#!/usr/bin/env python3
"""Create a PRIVATE, browser-importable chemistry PDF page index.

This does not perform OCR, copy source PDFs, or publish their contents.
All extracted text stays in your locally saved JSON. DO NOT git add it.
"""
from __future__ import annotations
import argparse
import hashlib
import json
import re
import unicodedata
from datetime import datetime, timezone
from pathlib import Path

# Exact book identifiers match src/data/books.ts. Order matters for matching.
MATCHERS = [
    ("kuncoro-2021", ["dasar_dasar_kimia_islam", "dasardasarkimiaislam"]),
    ("cucu-2022", ["integrasi_sains_cucu", "integrasisainscucu"]),
    ("uii-2017", ["refleksi", "aplikasi ilmu kimia"]),
    ("yahdi-2020", ["eksperimenkimia", "buku eksperimen kimia"]),
    ("kemenag-2013", ["makanan_minuman", "makananminuman"]),
    ("kusuma-2020", ["buku kajian sains", "buku kajian sains 2020"]),
    ("water-2024", ["kimia air dalam cairan", "kimiaair"]),
    ("kimia-dasar", ["buku kimia dasar", "buku_kimia_dasar"]),
]

def normalize_name(value: str) -> str:
    asciiish = unicodedata.normalize("NFKD", value.casefold())
    return re.sub(r"[ _\-]+", " ", asciiish)

def infer_book_id(name: str) -> str | None:
    norm = normalize_name(name)
    compact = re.sub(r"[^a-z0-9]", "", norm)
    for book_id, patterns in MATCHERS:
        for pattern in patterns:
            p = normalize_name(pattern)
            if p in norm or re.sub(r"[^a-z0-9]", "", p) in compact:
                return book_id
    return None

def strip_page_text(value: str, max_chars: int = 4800) -> str:
    text = re.sub(r"\s+", " ", value).strip()
    return text[:max_chars]

def main() -> None:
    parser = argparse.ArgumentParser(description="Index your own PDFs locally for El-Kīmiyā")
    parser.add_argument("--input-dir", type=Path, required=True, help="Folder containing personal PDF copies")
    parser.add_argument("--output", type=Path, default=Path("private/chemistry_index.json"))
    parser.add_argument("--max-pages-per-book", type=int, default=300)
    args = parser.parse_args()
    if not args.input_dir.is_dir():
        parser.error(f"Not a directory: {args.input_dir}")
    try:
        import fitz  # PyMuPDF
    except ImportError:
        parser.error("PyMuPDF is required. Run: python -m pip install pymupdf")
    pages = []
    scanned_hashes: set[str] = set()
    used_book_ids: set[str] = set()
    for file in sorted(args.input_dir.rglob('*.pdf')):
        book_id = infer_book_id(file.name)
        if book_id is None:
            print(f"[SKIP] Not recognized: {file.name}")
            continue
        if book_id in used_book_ids:
            print(f"[SKIP] Duplicate catalog entry: {file.name}")
            continue
        file_hash = hashlib.sha256(file.read_bytes()).hexdigest()
        if file_hash in scanned_hashes:
            print(f"[SKIP] Duplicate bytes: {file.name}")
            continue
        try:
            with fitz.open(file) as document:
                extracted = 0
                for idx in range(min(len(document), max(1,args.max_pages_per_book))):
                    text = strip_page_text(document[idx].get_text("text"))
                    if not text:
                        continue
                    pages.append({"bookId":book_id,"pdfPage":idx+1,"text":text})
                    extracted += 1
                print(f"[OK] {file.name} -> {book_id}: {extracted} text pages of {len(document)} PDF pages")
        except Exception as exc:
            print(f"[ERROR] {file.name}: {exc}")
            continue
        scanned_hashes.add(file_hash)
        used_book_ids.add(book_id)
    if not pages:
        parser.error("No extractable text pages; files may be scans or naming mismatch. OCR not included.")
    payload={"schemaVersion":1, "generatedAt":datetime.now(timezone.utc).isoformat(), "pages":pages}
    args.output.parent.mkdir(parents=True,exist_ok=True)
    args.output.write_text(json.dumps(payload,ensure_ascii=False,separators=(",",":")), encoding="utf-8")
    print(f"\nDONE: {len(pages)} indexed PDF pages -> {args.output.resolve()}")
    print("PRIVATE CONTENT: NEVER commit this JSON or the original PDFs to a public repository.")
    print("In El-Kīmiyā > My Library > Import private JSON index, select the created JSON file.")

if __name__ == '__main__':
    main()
