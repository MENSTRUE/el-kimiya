"""Strictly read-only ChEMBL 37 repository. No arbitrary SQL from clients."""
from __future__ import annotations

import re
from contextlib import closing
import sqlite3
from pathlib import Path

CHEMBL_ID = re.compile(r"^CHEMBL[0-9]{1,12}$", re.I)
INCHIKEY = re.compile(r"^[A-Z]{14}-[A-Z]{10}-[A-Z]$", re.I)


class MoleculeRepository:
    def __init__(self, database: Path):
        self.database = Path(database).resolve()

    def present(self) -> bool:
        return self.database.is_file()

    def _connect(self) -> sqlite3.Connection:
        if not self.present():
            raise FileNotFoundError(f"ChEMBL database missing at {self.database}")
        # SQLite URI mode=ro prevents mutation even if queries changed later.
        conn = sqlite3.connect(self.database.as_uri() + "?mode=ro", uri=True, timeout=10)
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA query_only=ON")
        return conn

    @staticmethod
    def _row(row: sqlite3.Row | None) -> dict | None:
        if row is None:
            return None
        d = dict(row)
        d["source"] = "ChEMBL 37 chemreps"
        d["record_url"] = "https://www.ebi.ac.uk/chembl/compound_report_card/" + d["chembl_id"] + "/"
        return d

    def count(self) -> int:
        with closing(self._connect()) as con:
            return int(con.execute("SELECT COUNT(*) FROM molecules").fetchone()[0])

    def by_id(self, chembl_id: str) -> dict | None:
        cid = chembl_id.strip().upper()
        if not CHEMBL_ID.fullmatch(cid):
            raise ValueError("Use a valid ChEMBL identifier such as CHEMBL25")
        with closing(self._connect()) as con:
            return self._row(con.execute(
                "SELECT chembl_id, canonical_smiles, standard_inchi, standard_inchi_key "
                "FROM molecules WHERE chembl_id=?", (cid,)
            ).fetchone())

    def search(self, query: str, limit: int = 10) -> list[dict]:
        q = query.strip().upper()
        if not 1 <= limit <= 30:
            raise ValueError("limit must be between 1 and 30")
        if CHEMBL_ID.fullmatch(q):
            # Prefix scan on PK; output is not an exact hit unless identifier matches.
            with closing(self._connect()) as con:
                rows = con.execute(
                    "SELECT chembl_id, canonical_smiles, standard_inchi, standard_inchi_key "
                    "FROM molecules WHERE chembl_id LIKE ? ORDER BY chembl_id LIMIT ?",
                    (q + "%", limit)
                ).fetchall()
                return [self._row(r) for r in rows]
        if INCHIKEY.fullmatch(q):
            with closing(self._connect()) as con:
                rows = con.execute(
                    "SELECT chembl_id, canonical_smiles, standard_inchi, standard_inchi_key "
                    "FROM molecules WHERE standard_inchi_key=? LIMIT ?", (q, limit)
                ).fetchall()
                return [self._row(r) for r in rows]
        raise ValueError("Dataset supports ChEMBL ID or InChIKey search, not compound names. PubChem handles names.")
