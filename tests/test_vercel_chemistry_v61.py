"""Visual Molecular Assembly V6.1 contract tests. Run from repository root."""
from pathlib import Path
import importlib.util
import unittest
from fastapi.testclient import TestClient

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("v61_chemistry", ROOT / "api" / "chemistry.py")
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
client = TestClient(module.app)


def graph(atoms, bonds):
    return {"assembly": {"atoms": [{"element": a} for a in atoms],
                         "bonds": [{"a": a, "b": b, "order": o} for a, b, o in bonds]}}


class VisualBuilderV61Tests(unittest.TestCase):
    def test_existing_v60_smiles_unchanged(self):
        r = client.post('/api/chemistry', json={"smiles": "CCO"})
        self.assertEqual(r.status_code, 200, r.text)
        x = r.json()
        self.assertEqual(x['molecular_formula_rdkit'], 'C2H6O')
        self.assertIn('<svg', x['svg_2d'])
        self.assertIsNone(x['molecule_3d'])

    def test_existing_v60_3d_unchanged(self):
        r = client.post('/api/chemistry', json={"smiles": "CCO", "include_3d": True})
        self.assertEqual(r.status_code, 200, r.text)
        self.assertIn('ETKDG', r.json()['molecule_3d']['method'])

    def test_builder_ethanol(self):
        r = client.post('/api/chemistry', json=graph(['C','C','O'], [(0,1,1),(1,2,1)]))
        self.assertEqual(r.status_code, 200, r.text)
        d = r.json()
        self.assertEqual(d['canonical_smiles_rdkit'], 'CCO')
        self.assertEqual(d['molecular_formula_rdkit'], 'C2H6O')
        self.assertIn('<svg', d['svg_2d'])

    def test_builder_benzene(self):
        rings = [(i, (i+1)%6, 2 if i%2==0 else 1) for i in range(6)]
        r = client.post('/api/chemistry', json=graph(['C']*6, rings))
        self.assertEqual(r.status_code, 200, r.text)
        self.assertEqual(r.json()['canonical_smiles_rdkit'], 'c1ccccc1')
        self.assertEqual(r.json()['molecular_formula_rdkit'], 'C6H6')

    def test_builder_acetic_acid(self):
        r = client.post('/api/chemistry', json=graph(['C','C','O','O'], [(0,1,1),(1,2,2),(1,3,1)]))
        self.assertEqual(r.status_code, 200, r.text)
        self.assertEqual(r.json()['canonical_smiles_rdkit'], 'CC(=O)O')

    def test_builder_double_bond(self):
        r = client.post('/api/chemistry', json=graph(['C','C'], [(0,1,2)]))
        self.assertEqual(r.status_code, 200, r.text)
        self.assertEqual(r.json()['molecular_formula_rdkit'], 'C2H4')

    def test_builder_invalid_valence(self):
        req = graph(['C'] + ['F']*5, [(0,i,1) for i in range(1,6)])
        self.assertEqual(client.post('/api/chemistry',json=req).status_code,422)

    def test_builder_disconnected(self):
        self.assertEqual(client.post('/api/chemistry',json=graph(['C','O'],[])).status_code,422)

    def test_builder_bad_bonds(self):
        self.assertEqual(client.post('/api/chemistry',json=graph(['C','C'],[(0,1,1),(1,0,2)])).status_code,422)
        self.assertEqual(client.post('/api/chemistry',json=graph(['C'],[(0,1,1)])).status_code,422)
        self.assertEqual(client.post('/api/chemistry',json=graph(['C'],[(0,0,1)])).status_code,422)

    def test_builder_reject_unknown_element(self):
        self.assertEqual(client.post('/api/chemistry',json=graph(['Hg'],[])).status_code,422)

    def test_reject_ambiguous_input(self):
        self.assertEqual(client.post('/api/chemistry',json={"smiles":"CCO","assembly":graph(['C'],[])['assembly']}).status_code,422)
        self.assertEqual(client.post('/api/chemistry',json={}).status_code,422)

    def test_health_and_private_routes(self):
        h = client.get('/api/chemistry')
        self.assertEqual(h.status_code,200)
        self.assertEqual(h.json()['version'],'6.0.0') # preserve V6.0 external contract
        self.assertIn('visual_assembly_v61',h.json()['capabilities'])
        self.assertEqual(client.get('/private/compound_data/chembl_37.sqlite').status_code,404)

if __name__ == '__main__': unittest.main()
