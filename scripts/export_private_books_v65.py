#!/usr/bin/env python3
"""Convert user-owned local PDFs into private, per-page text JSON for El-Kīmiyā.

Nothing is sent to a remote service. Outputs stay under private/ and should NEVER
be copied to public/, dist/, Git, or Vercel. No OCR is attempted on scan-only PDFs.
"""
from __future__ import annotations
import argparse
import json
import re
from pathlib import Path

# Prefixes must match src/data/books.ts. Users can import a JSON into the
# corresponding reader tab after choosing the associated PDF file.
BOOK_IDS = (
    'kuncoro-2021', 'kimia-dasar', 'yahdi-2020', 'cucu-2022',
    'uii-2017', 'kemenag-2013', 'kusuma-2020', 'water-2024',
)


def book_id_from_filename(name: str) -> str | None:
    lower = name.lower()
    return next((book for book in BOOK_IDS if lower.startswith(book + '__') or lower == book + '.pdf'), None)


def paragraphs(page) -> tuple[str, list[str]]:
    # Sorted text-block extraction is more readable than blindly joining glyphs.
    blocks = page.get_text('blocks', sort=True)
    lines = []
    for block in blocks:
        if len(block) < 5 or not isinstance(block[4], str):
            continue
        if len(block) > 6 and block[6] != 0:  # avoid raster-image blocks
            continue
        chunk = re.sub(r'\s+', ' ', block[4]).strip()
        if chunk:
            lines.append(chunk)
    return '\n\n'.join(lines), lines


def export_pdf(pdf: Path, output_dir: Path, max_pages: int, overwrite: bool) -> dict:
    import fitz  # PyMuPDF
    book_id = book_id_from_filename(pdf.name)
    if not book_id:
        return {'file': pdf.name, 'status': 'skip', 'reason': 'Filename lacks expected <book-id>__ prefix'}
    if pdf.is_symlink() or not pdf.is_file():
        return {'file': pdf.name, 'status': 'skip', 'reason': 'Not a regular PDF'}
    if pdf.stat().st_size > 160_000_000:
        return {'file': pdf.name, 'status': 'skip', 'reason': 'PDF exceeds 160 MB safety limit'}
    target = output_dir / f'{book_id}.json'
    if target.exists() and not overwrite:
        return {'file': pdf.name, 'status': 'skip', 'reason': 'JSON already exists (use --overwrite)'}
    with fitz.open(pdf) as document:
        if document.needs_pass:
            return {'file': pdf.name, 'status': 'skip', 'reason': 'Password-protected PDF'}
        limit = min(len(document), max_pages)
        items = []
        for index in range(limit):
            text, lines = paragraphs(document[index])
            items.append({'page': index + 1, 'text': text[:35000], 'paragraphs': lines[:250]})
        data = {
            'schema_version': 1,
            'book_id': book_id,
            'source_file': pdf.name,
            'pdf_pages': len(document),
            'exported_pages': limit,
            'text_layer_pages': sum(bool(item['text'].strip()) for item in items),
            'notice': 'User-provided private PDF text. Not a public/open licensed corpus. Do not publish.',
            'pages': items,
        }
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(json.dumps(data, ensure_ascii=False, indent=1), encoding='utf-8')
    return {'file': pdf.name, 'status': 'ok', 'pages': limit, 'text_pages': data['text_layer_pages'], 'output': str(target)}


def main() -> None:
    cli = argparse.ArgumentParser(description='Local-only El-Kīmiyā PDF → private JSON')
    cli.add_argument('--project', default='.', help='El-Kīmiyā project directory')
    cli.add_argument('--max-pages', type=int, default=2000)
    cli.add_argument('--overwrite', action='store_true')
    a = cli.parse_args()
    root = Path(a.project).expanduser().resolve()
    library = root / 'private' / 'chemistry-books'
    output = root / 'private' / 'chemistry-text-v65'
    if not 1 <= a.max_pages <= 5000:
        cli.error('--max-pages must be between 1 and 5000')
    if not library.is_dir() or not (root / 'src' / 'data' / 'books.ts').is_file():
        cli.error('Expected El-Kīmiyā root with private/chemistry-books and src/data/books.ts')
    try:
        import fitz
        print(f'[INFO] PyMuPDF: {fitz.VersionBind}')
    except ImportError:
        cli.error('Missing PyMuPDF. Run: python -m pip install "pymupdf>=1.24,<2"')
    files = sorted(library.glob('*.pdf'))
    if not files:
        print('[INFO] No PDFs found in private/chemistry-books.')
        return
    total = success = 0
    for pdf in files:
        result = export_pdf(pdf, output, a.max_pages, a.overwrite)
        total += 1
        if result['status'] == 'ok': success += 1
        print(f'[{result["status"].upper()}] {result["file"]}: ' + (f'{result["text_pages"]}/{result["pages"]} searchable pages; {result["output"]}' if result['status'] == 'ok' else result['reason']))
    print(f'[DONE] {success}/{total} local PDFs exported under {output}')
    print('[PRIVACY] Do not git add private/, do not copy the JSON into public/.')
    print('[READER] On Vercel choose the original PDF; Text mode extracts directly in-browser. JSON can be imported optionally within that reader.')


if __name__ == '__main__':
    main()
