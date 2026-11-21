#!/usr/bin/env python3
"""Stream ChEMBL release chemreps TSV.gz into a private SQLite database.

Only four source-provided chemical representations are imported; no activity,
property, or PubChem CID fields are invented. No network access is used here.
"""
from __future__ import annotations

import argparse
import csv
import gzip
import hashlib
import json
import os
import sqlite3
import sys
from datetime import datetime, timezone
from pathlib import Path

EXPECTED = ('chembl_id', 'canonical_smiles', 'standard_inchi', 'standard_inchi_key')
SQL = '''CREATE TABLE molecules (
  chembl_id TEXT PRIMARY KEY NOT NULL,
  canonical_smiles TEXT NOT NULL,
  standard_inchi TEXT,
  standard_inchi_key TEXT
) WITHOUT ROWID'''
INSERT = 'INSERT OR IGNORE INTO molecules VALUES (?,?,?,?)'
SOURCE = 'https://ftp.ebi.ac.uk/pub/databases/chembl/ChEMBLdb/releases/chembl_37/chembl_37_chemreps.txt.gz'

def guarded(path: Path) -> Path:
    path = path.resolve()
    parts = {p.lower() for p in path.parts}
    if 'public' in parts or 'dist' in parts:
        raise ValueError('Dataset output must never be inside public/ or dist/.')
    return path

def ingest(source: Path, destination: Path, limit: int = 0, checksum: bool = True) -> dict:
    if limit < 0:
        raise ValueError('--limit cannot be negative.')
    source = source.resolve()
    destination = guarded(destination)
    if not source.is_file():
        raise FileNotFoundError('Source .gz not found: ' + str(source))
    if source.suffix.lower() != '.gz':
        raise ValueError('Source must be a gzip-compressed .gz file.')
    destination.parent.mkdir(parents=True, exist_ok=True)
    tmp = destination.with_suffix(destination.suffix + '.building')
    if tmp.exists():
        tmp.unlink()
    con = sqlite3.connect(tmp)
    read = 0
    accepted = 0
    skipped = 0
    try:
        con.execute('PRAGMA journal_mode=DELETE')
        con.execute('PRAGMA synchronous=NORMAL')
        con.execute(SQL)
        con.commit()
        with gzip.open(source, 'rt', encoding='utf-8', errors='replace', newline='') as handle:
            reader = csv.DictReader(handle, delimiter='\t')
            if not set(EXPECTED).issubset(set(reader.fieldnames or [])):
                raise ValueError('ChEMBL chemreps header not recognized: ' + str(reader.fieldnames))
            buffer = []
            for row in reader:
                if limit and read >= limit:
                    break
                read += 1
                chembl_id = (row.get('chembl_id') or '').strip()
                smiles = (row.get('canonical_smiles') or '').strip()
                if not chembl_id.startswith('CHEMBL') or not smiles:
                    skipped += 1
                    continue
                buffer.append((chembl_id, smiles,
                               (row.get('standard_inchi') or '').strip() or None,
                               (row.get('standard_inchi_key') or '').strip() or None))
                if len(buffer) >= 5000:
                    before = con.total_changes
                    con.executemany(INSERT, buffer)
                    accepted += con.total_changes - before
                    con.commit()
                    buffer.clear()
                if read % 250_000 == 0:
                    print(f'[PROGRESS] {read:,} source records | {accepted:,} unique imported', flush=True)
            if buffer:
                before = con.total_changes
                con.executemany(INSERT, buffer)
                accepted += con.total_changes - before
                con.commit()
        con.execute('CREATE INDEX idx_molecule_inchikey ON molecules(standard_inchi_key)')
        con.commit()
        total = con.execute('SELECT COUNT(*) FROM molecules').fetchone()[0]
        if total != accepted:
            raise RuntimeError('Imported row count mismatch.')
    except Exception:
        con.close()
        if tmp.exists():
            tmp.unlink()
        raise
    con.close()
    os.replace(tmp, destination)
    digest = None
    if checksum:
        h = hashlib.sha256()
        with source.open('rb') as f:
            for block in iter(lambda: f.read(8*1024*1024), b''):
                h.update(block)
        digest = h.hexdigest()
    report = {
        'dataset': 'ChEMBL chemical representations',
        'release': 'ChEMBL 37', 'doi': '10.6019/CHEMBL.database.37',
        'source_url': SOURCE,
        'imported_at_utc': datetime.now(timezone.utc).isoformat(),
        'source_file': str(source), 'source_sha256': digest,
        'rows_examined': read, 'unique_molecules': accepted, 'invalid_or_missing_smiles': skipped,
        'duplicate_chembl_ids': read - skipped - accepted,
        'database_file': str(destination),
        'columns': list(EXPECTED),
        'limits': 'Structures only; not a PubChem download. ChEMBL IDs are not PubChem CIDs. No molecular properties or activities included.',
    }
    report_file = destination.parent / 'chembl_37_manifest.json'
    report_file.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding='utf-8')
    print(f'[PASS] Imported {accepted:,} distinct molecular records -> {destination}', flush=True)
    print(f'[PASS] Manifest -> {report_file}', flush=True)
    return report

def main() -> int:
    parser = argparse.ArgumentParser(description='Import official ChEMBL 37 chemreps into SQLite (streaming)')
    parser.add_argument('--input', type=Path, required=True)
    parser.add_argument('--db', type=Path, default=Path('private/compound_data/chembl_37.sqlite'))
    parser.add_argument('--limit', type=int, default=0, help='0 imports every ChEMBL chemreps row')
    parser.add_argument('--skip-sha256', action='store_true')
    args = parser.parse_args()
    try:
        ingest(args.input, args.db, args.limit, not args.skip_sha256)
        return 0
    except (OSError, ValueError, RuntimeError, sqlite3.Error, EOFError, csv.Error) as exc:
        print('[ERROR]', exc, file=sys.stderr)
        return 1

if __name__ == '__main__':
    raise SystemExit(main())
