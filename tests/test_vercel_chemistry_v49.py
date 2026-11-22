"""Run: python -m unittest discover -s tests -p 'test_vercel_chemistry_v49.py' -v"""
import importlib.util
from pathlib import Path
import unittest
from fastapi.testclient import TestClient

HERE = Path(__file__).resolve().parent.parent
spec = importlib.util.spec_from_file_location("vercel_chemistry", HERE / "api" / "chemistry.py")
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
client = TestClient(module.app)

class ChemistryV49Tests(unittest.TestCase):
    def test_health_both_paths(self):
        for path in ("/", "/api/chemistry"):
            r = client.get(path)
            self.assertEqual(r.status_code, 200)
            self.assertEqual(r.json()["mode"], "PUBLIC_RDKIT")
            self.assertFalse(r.json()["chEMBL_database_ready"])

    def test_ethanol_descriptor(self):
        r = client.post("/api/chemistry", json={"smiles": "CCO"})
        self.assertEqual(r.status_code, 200, r.text)
        d = r.json()
        self.assertEqual(d["molecular_formula_rdkit"], "C2H6O")
        self.assertAlmostEqual(d["molecular_weight_rdkit"], 46.069, places=2)
        self.assertEqual(d["atom_count_rdkit"], 3)

    def test_invalid_input(self):
        self.assertEqual(client.post("/api/chemistry",json={"smiles":"not-a-smiles"}).status_code,422)
        self.assertEqual(client.post("/api/chemistry",json={"smiles":"CCO", "extra":"x"}).status_code,422)
        self.assertEqual(client.post("/api/chemistry",json={"smiles":"C"*257}).status_code,422)

    def test_no_private_data_routes(self):
        for path in ("/api/v1/molecules/search", "/api/v1/agent/query", "/private/compound_data/chembl_37.sqlite"):
            self.assertEqual(client.get(path).status_code,404)

if __name__ == "__main__": unittest.main()
