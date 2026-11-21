#!/usr/bin/env python3
"""Build a resumable private Morgan fingerprint index from the ChEMBL database.

Usage (from root):
  python backend/scripts/build_fingerprints.py --limit 25000
  python backend/scripts/build_fingerprints.py --limit 0  # all remaining, potentially long

Never alters the source ChEMBL database. Does not claim complete similarity coverage
until every source record has been scanned AND successfully fingerprinted.
"""
from __future__ import annotations

import argparse
import sqlite3
from contextlib import closing
from pathlib import Path

from rdkit import DataStructs
from rdkit import Chem
from rdkit.Chem import rdFingerprintGenerator

ROOT = Path(__file__).resolve().parents[2]
DEFAULT_DB = ROOT / "private" / "compound_data" / "chembl_37.sqlite"
DEFAULT_INDEX = ROOT / "private" / "compound_data" / "chembl_37_fingerprints.sqlite"


def build(db: Path, out: Path, limit: int) -> dict:
    db, out = Path(db).resolve(), Path(out).resolve()
    if not db.is_file():
        raise FileNotFoundError(f"Database not found: {db}")
    if out == db or any(x.lower() in ('dist','public') for x in out.parts):
        raise ValueError("Refusing to overwrite source DB or create a public fingerprint index")
    if limit < 0:
        raise ValueError("limit must be >= 0 (zero means all remaining)")
    out.parent.mkdir(parents=True, exist_ok=True)
    gen = rdFingerprintGenerator.GetMorganGenerator(radius=2, fpSize=2048)
    scanned = indexed_now = skipped = 0
    last_processed = None
    with closing(sqlite3.connect(db.as_uri() + "?mode=ro", uri=True)) as source, closing(sqlite3.connect(out)) as idx:
        idx.execute("PRAGMA journal_mode=WAL")
        idx.execute("CREATE TABLE IF NOT EXISTS fingerprints (chembl_id TEXT PRIMARY KEY, fingerprint BLOB NOT NULL)")
        idx.execute("CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT NOT NULL)")
        row = idx.execute("SELECT value FROM meta WHERE key='last_scanned_id'").fetchone()
        start_after = row[0] if row else ''
        rows = source.execute("SELECT chembl_id, canonical_smiles FROM molecules WHERE chembl_id > ? ORDER BY chembl_id",(start_after,))
        batch=[]
        for chembl_id, smiles in rows:
            if limit and scanned >= limit:
                break
            scanned += 1
            last_processed = chembl_id
            mol = Chem.MolFromSmiles(smiles) if smiles and len(smiles) <= 1200 else None
            if mol is None or mol.GetNumAtoms() > 300:
                skipped += 1
            else:
                fp = gen.GetFingerprint(mol)
                batch.append((chembl_id,sqlite3.Binary(DataStructs.BitVectToBinaryText(fp))))
            if scanned % 1000 == 0:
                if batch:
                    idx.executemany("INSERT OR IGNORE INTO fingerprints VALUES (?,?)",batch)
                    indexed_now += len(batch)
                    batch=[]
                idx.execute("INSERT OR REPLACE INTO meta VALUES ('last_scanned_id',?)",(last_processed,))
                idx.commit()
                print(f"[FINGERPRINTS] {scanned:,} scanned this run | {indexed_now:,} newly indexed | {skipped:,} skipped",flush=True)
        if batch:
            idx.executemany("INSERT OR IGNORE INTO fingerprints VALUES (?,?)",batch)
            indexed_now += len(batch)
        if last_processed:
            idx.execute("INSERT OR REPLACE INTO meta VALUES ('last_scanned_id',?)",(last_processed,))
        idx.execute("INSERT OR REPLACE INTO meta VALUES ('method','Morgan radius=2 bits=2048')")
        idx.commit()
        total=idx.execute("SELECT COUNT(*) FROM fingerprints").fetchone()[0]
    result={"scanned_this_run":scanned,"added_this_run":indexed_now,"skipped_this_run":skipped,"indexed_total":total,"index":str(out)}
    print("[PASS]",result,flush=True)
    return result


if __name__ == '__main__':
    p=argparse.ArgumentParser()
    p.add_argument('--db',type=Path,default=DEFAULT_DB)
    p.add_argument('--out',type=Path,default=DEFAULT_INDEX)
    p.add_argument('--limit',type=int,default=25000,help='0 processes all remaining records')
    args=p.parse_args()
    build(args.db,args.out,args.limit)
