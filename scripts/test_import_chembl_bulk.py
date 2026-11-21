import gzip
import sqlite3
from contextlib import closing
import tempfile
import unittest
from pathlib import Path
from import_chembl_bulk import ingest

class TestBulk(unittest.TestCase):
    def test_import_dedupe(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            source = root / 'sample.gz'
            with gzip.open(source, 'wt', encoding='utf-8') as f:
                f.write('chembl_id\tcanonical_smiles\tstandard_inchi\tstandard_inchi_key\n')
                f.write('CHEMBL1\tO\tInChI=1S/H2O/h1H2\tKEY1\n')
                f.write('CHEMBL2\tCCO\tInChI=1S/C2H6O\tKEY2\n')
                f.write('CHEMBL1\tO\tInChI=1S/H2O/h1H2\tKEY1\n')
                f.write('CHEMBL3\t\t\t\n')
            db = root / 'private' / 'compound_data' / 'sample.sqlite'
            result = ingest(source, db)
            self.assertEqual(result['unique_molecules'], 2)
            self.assertEqual(result['invalid_or_missing_smiles'], 1)
            self.assertEqual(result['duplicate_chembl_ids'], 1)
            with closing(sqlite3.connect(db)) as cx:
                self.assertEqual(cx.execute('SELECT COUNT(*) FROM molecules').fetchone()[0], 2)
                self.assertEqual(cx.execute('SELECT canonical_smiles FROM molecules WHERE chembl_id=?',('CHEMBL2',)).fetchone()[0], 'CCO')
            self.assertTrue((db.parent / 'chembl_37_manifest.json').is_file())
    def test_limit(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            source=root/'sample.gz'
            with gzip.open(source, 'wt') as f:
                f.write('chembl_id\tcanonical_smiles\tstandard_inchi\tstandard_inchi_key\nCHEMBL1\tO\t\t\nCHEMBL2\tCCO\t\t\n')
            db=root/'private'/'molecules.sqlite'
            result=ingest(source,db,limit=1,checksum=False)
            self.assertEqual(result['unique_molecules'],1)
    def test_public_rejected(self):
        with tempfile.TemporaryDirectory() as tmp:
            root=Path(tmp); source=root/'sample.gz'
            with gzip.open(source,'wt') as f:
                f.write('chembl_id\tcanonical_smiles\tstandard_inchi\tstandard_inchi_key\nCHEMBL1\tO\t\t\n')
            with self.assertRaises(ValueError):
                ingest(source, root/'public'/'bad.sqlite')

if __name__ == '__main__':
    unittest.main()
