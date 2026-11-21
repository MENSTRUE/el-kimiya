"""Explicit-coverage Morgan/Tanimoto similarity. No fake global ANN ranking."""
from __future__ import annotations

import heapq
from contextlib import closing
import sqlite3
from pathlib import Path
from .chemistry import score_fingerprints

FP_MODEL = "RDKit Morgan radius=2, 2048 bits; Tanimoto"


class FingerprintIndex:
    def __init__(self, path: Path):
        self.path = Path(path).resolve()

    def present(self) -> bool:
        return self.path.is_file()

    def _connect(self):
        if not self.present():
            raise FileNotFoundError("Fingerprint index missing; run backend/scripts/build_fingerprints.py")
        con = sqlite3.connect(self.path.as_uri() + "?mode=ro", uri=True)
        con.row_factory = sqlite3.Row
        con.execute("PRAGMA query_only=ON")
        return con

    def indexed_count(self) -> int:
        if not self.present():
            return 0
        with closing(self._connect()) as con:
            return int(con.execute("SELECT COUNT(*) FROM fingerprints").fetchone()[0])

    def similar(self, smiles: str, *, top_k: int = 8, max_candidates: int = 20000, exclude_id: str | None = None) -> dict:
        if not 1 <= top_k <= 15 or not 1 <= max_candidates <= 50000:
            raise ValueError("top_k must be 1..15 and max_candidates 1..50000")
        heap: list[tuple[float, str]] = []
        scanned = 0
        indexed = self.indexed_count()
        with closing(self._connect()) as con:
            cur = con.execute("SELECT chembl_id, fingerprint FROM fingerprints ORDER BY chembl_id LIMIT ?", (max_candidates,))
            while True:
                rows = cur.fetchmany(512)
                if not rows:
                    break
                scores = score_fingerprints(smiles, [bytes(r["fingerprint"]) for r in rows])
                for row, score in zip(rows, scores):
                    scanned += 1
                    chembl_id = row["chembl_id"]
                    if exclude_id and chembl_id == exclude_id:
                        continue
                    value = (float(score), chembl_id)
                    if len(heap) < top_k:
                        heapq.heappush(heap, value)
                    elif value > heap[0]:
                        heapq.heapreplace(heap, value)
        return {
            "hits": [
                {"chembl_id": cid, "tanimoto": round(score, 4),
                 "record_url": f"https://www.ebi.ac.uk/chembl/compound_report_card/{cid}/"}
                for score, cid in sorted(heap, reverse=True)
            ],
            "screened_fingerprints": scanned,
            "indexed_fingerprints": indexed,
            "fingerprint_method": FP_MODEL,
            "scope_warning": "Ranks ONLY molecules screened in this request. NOT global nearest neighbors of all 2.9M records.",
        }
