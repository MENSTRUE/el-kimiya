"""Checks that PDF->JSON conversion only writes private text with the correct schema."""
import importlib.util
from pathlib import Path
import tempfile
import unittest
try:
    import fitz
except ImportError:
    fitz = None
ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'scripts' / 'export_private_books_v65.py'
spec = importlib.util.spec_from_file_location('v65_exporter', SOURCE)
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

@unittest.skipUnless(fitz is not None, 'PyMuPDF required for PDF extraction test')
class TestPrivatePdfExporter(unittest.TestCase):
    def test_real_text_extraction_and_privacy(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            infile = root / 'private' / 'chemistry-books' / 'kuncoro-2021__tiny.pdf'
            infile.parent.mkdir(parents=True)
            pdf = fitz.open()
            page = pdf.new_page()
            page.insert_text((72, 72), 'El Kimiya molaritas kimia 2026')
            pdf.save(infile)
            pdf.close()
            output = root / 'private' / 'chemistry-text-v65'
            result = module.export_pdf(infile, output, 20, False)
            self.assertEqual(result['status'], 'ok')
            import json
            data = json.loads((output / 'kuncoro-2021.json').read_text(encoding='utf-8'))
            self.assertEqual(data['book_id'], 'kuncoro-2021')
            self.assertEqual(data['exported_pages'], 1)
            self.assertIn('molaritas', data['pages'][0]['text'])
            self.assertFalse((root / 'public').exists())
            self.assertEqual(data['text_layer_pages'], 1)
    def test_unrecognized_filename_not_exported(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            pdf = fitz.open()
            pdf.new_page(); path = root / 'wrong-name.pdf'; pdf.save(path); pdf.close()
            result = module.export_pdf(path, root / 'private' / 'data', 20, False)
            self.assertEqual(result['status'], 'skip')
            self.assertFalse((root / 'private').exists())
if __name__ == '__main__': unittest.main()
