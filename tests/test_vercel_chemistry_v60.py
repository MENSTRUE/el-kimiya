"""Run: python -m unittest discover -s tests -p 'test_vercel_chemistry_v60.py' -v"""
from pathlib import Path
import importlib.util
import unittest
from fastapi.testclient import TestClient

ROOT = Path(__file__).resolve().parent.parent
spec = importlib.util.spec_from_file_location("v60_chemistry", ROOT / "api/chemistry.py")
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
client = TestClient(module.app)

class MolecularStudioV60Tests(unittest.TestCase):
    def test_health(self):
        r = client.get("/api/chemistry")
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.json()["version"], "6.0.0")
        self.assertFalse(r.json()["chEMBL_database_ready"])

    def test_2d_ethanol_real_svg(self):
        r = client.post("/api/chemistry", json={"smiles": "CCO"})
        self.assertEqual(r.status_code, 200, r.text)
        data = r.json()
        self.assertEqual(data["molecular_formula_rdkit"], "C2H6O")
        self.assertAlmostEqual(data["molecular_weight_rdkit"], 46.069, places=2)
        self.assertIn("<svg", data["svg_2d"])
        self.assertIn("</svg>", data["svg_2d"])
        self.assertIsNone(data["molecule_3d"])

    def test_3d_ethanol_coordinates(self):
        r = client.post("/api/chemistry", json={"smiles": "CCO", "include_3d": True})
        self.assertEqual(r.status_code, 200, r.text)
        geo = r.json()["molecule_3d"]
        self.assertGreaterEqual(len(geo["atoms"]), 3)
        self.assertGreaterEqual(len(geo["bonds"]), 2)
        self.assertEqual(len(geo["atoms"][0]["xyz"]), 3)
        self.assertIn("ETKDG", geo["method"])

    def test_complex_and_stereochemistry(self):
        for smiles in ["c1ccccc1", "C[C@H](O)C(=O)O", "CC(=O)O"]:
            r = client.post("/api/chemistry", json={"smiles": smiles})
            self.assertEqual(r.status_code, 200, (smiles, r.text))
            self.assertIn("<svg", r.json()["svg_2d"])

    def test_invalid_input_and_bounds(self):
        self.assertEqual(client.post("/api/chemistry", json={"smiles": "not-a-smiles"}).status_code, 422)
        self.assertEqual(client.post("/api/chemistry", json={"smiles": "CCO", "extra": "x"}).status_code, 422)
        self.assertEqual(client.post("/api/chemistry", json={"smiles": "C"*257}).status_code, 422)

    def test_no_private_data_routes(self):
        for path in ("/api/v1/molecules/search", "/api/v1/agent/query", "/private/compound_data/chembl_37.sqlite"):
            self.assertEqual(client.get(path).status_code, 404)

if __name__ == "__main__": unittest.main()
