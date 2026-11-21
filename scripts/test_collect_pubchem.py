"""Offline unit tests: no external API calls."""
import importlib.util
import json
from pathlib import Path
import tempfile
import unittest

PATH = Path(__file__).with_name('collect_pubchem.py')
spec = importlib.util.spec_from_file_location('collector', PATH)
assert spec and spec.loader
collector = importlib.util.module_from_spec(spec)
spec.loader.exec_module(collector)


class CollectorTests(unittest.TestCase):
    def test_url_encoding(self):
        self.assertIn('/name/sodium%20chloride/property/', collector.build_url('sodium chloride'))
        self.assertTrue(collector.build_url('aspirin').endswith('/JSON'))

    def test_normalize(self):
        seed = {'query':'aspirin','name':'Aspirin','category':'Medicine'}
        sample = {'PropertyTable': {'Properties': [{
            'CID': 2244, 'MolecularFormula': 'C9H8O4',
            'MolecularWeight':'180.16', 'ConnectivitySMILES':'CC(=O)OC1=CC=CC=C1C(=O)O',
            'IUPACName':'2-acetyloxybenzoic acid',
        }]}}
        result = collector.normalize(sample, seed, collector.build_url('aspirin'))
        self.assertEqual(result['cid'], 2244)
        self.assertEqual(result['molecular_formula'], 'C9H8O4')
        self.assertIsNone(result['xlogp'])
        self.assertEqual(result['pubchem_url'], 'https://pubchem.ncbi.nlm.nih.gov/compound/2244')

    def test_duplicate_cids_and_manifest(self):
        seeds = [
            {'query':'aspirin','name':'Aspirin','category':'Medicine'},
            {'query':'acetylsalicylic acid','name':'ASA','category':'Medicine'},
            {'query':'notfound','name':'Unknown','category':'Unknown'},
        ]
        state = {}
        for row in seeds[:2]:
            state[row['query']] = {'status':'ok','record': collector.normalize({'PropertyTable':{'Properties':[{'CID':2244}]}},row, collector.build_url(row['query']))}
        with tempfile.TemporaryDirectory() as tmp:
            out = Path(tmp)
            success, unique, failed = collector.export(out,state,seeds)
            self.assertEqual((success,unique,failed),(2,1,1))
            entries=json.loads((out/'pubchem_compounds.json').read_text(encoding='utf-8'))
            self.assertEqual(len(entries),1)
            manifest=json.loads((out/'manifest.json').read_text(encoding='utf-8'))
            self.assertIn('2244',manifest['duplicate_cids'])

    def test_seeds(self):
        path=PATH.with_name('pubchem_seed_compounds.json')
        seeds=collector.load_seeds(path,0)
        self.assertGreaterEqual(len(seeds),40)
        self.assertEqual(len(collector.load_seeds(path,5)),5)
        self.assertEqual(len({s['query'] for s in seeds}),len(seeds))

    def test_no_public_output(self):
        with tempfile.TemporaryDirectory() as tmp:
            p=Path(tmp)/'public'
            p.mkdir()
            with self.assertRaises(SystemExit) as exc:
                collector.main(['--out',str(p),'--input',str(PATH.with_name('pubchem_seed_compounds.json')),'--limit','1'])
            self.assertEqual(exc.exception.code, 2)


if __name__=='__main__':
    unittest.main()
