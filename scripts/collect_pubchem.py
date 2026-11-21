#!/usr/bin/env python3
"""Private El-Kimiya chemical-data ingestion; Python stdlib, no HTML scraping.

Example:
    py -3 scripts/collect_pubchem.py --limit 20
    py -3 scripts/collect_pubchem.py --limit 0

Outputs ONLY under private/compound_data (gitignored). No Firebase upload.
"""
from __future__ import annotations

import argparse
import csv
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime
import json
import os
from pathlib import Path
import random
import sys
import time
from urllib.error import HTTPError, URLError
from urllib.parse import quote
from urllib.request import Request, urlopen

SOURCE = "https://pubchem.ncbi.nlm.nih.gov/rest/pug"
PROPS = (
    "MolecularFormula", "MolecularWeight", "ConnectivitySMILES", "SMILES",
    "IUPACName", "InChIKey", "XLogP", "TPSA", "HBondDonorCount",
    "HBondAcceptorCount", "RotatableBondCount", "Charge",
)
FIELDS = (
    "cid", "name", "category", "molecular_formula", "molecular_weight_g_mol",
    "connectivity_smiles", "smiles", "iupac_name", "inchikey", "xlogp",
    "tpsa_angstrom2", "h_bond_donors", "h_bond_acceptors", "rotatable_bonds",
    "formal_charge", "source_query", "source_url", "pubchem_url", "fetched_at_utc",
)
DOC_URL = "https://pubchem.ncbi.nlm.nih.gov/docs/pug-rest"


def now_utc() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def atomic_json(path: Path, data: object) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temp = path.with_name(path.name + ".tmp")
    with temp.open("w", encoding="utf-8") as file:
        json.dump(data, file, ensure_ascii=False, indent=2, allow_nan=False)
        file.write("\n")
    os.replace(temp, path)


def get_json(url: str, delay: float = 1.0, attempts: int = 4) -> dict:
    """Conservative sequential requests with bounded retries for 429/5xx."""
    retryable = {408, 429, 500, 502, 503, 504}
    for trial in range(attempts):
        time.sleep(delay)
        request = Request(url, headers={
            "User-Agent": "ElKimiyaEducationalCollector/1.0 (https://github.com/MENSTRUE/el-kimiya)",
            "Accept": "application/json",
        })
        try:
            with urlopen(request, timeout=35) as response:
                data = json.load(response)
            if not isinstance(data, dict):
                raise ValueError("Unexpected JSON root type")
            return data
        except HTTPError as error:
            if error.code in (400, 404):
                raise LookupError(f"PubChem: HTTP {error.code} (not found / unsupported query)") from error
            if error.code not in retryable or trial == attempts - 1:
                raise RuntimeError(f"PubChem HTTP {error.code}") from error
            retry_after = error.headers.get("Retry-After")
            pause = min(60.0, 2 ** trial + random.uniform(0.1, 0.7))
            if retry_after:
                try:
                    pause = min(60.0, max(pause, float(retry_after)))
                except ValueError:
                    try:
                        dt = parsedate_to_datetime(retry_after)
                        pause = min(60.0, max(pause, dt.timestamp() - time.time()))
                    except (TypeError, ValueError):
                        pass
            print(f"[RETRY] HTTP {error.code}; waiting {pause:.1f}s", flush=True)
            time.sleep(pause)
        except (URLError, TimeoutError) as error:
            if trial == attempts - 1:
                raise RuntimeError(f"Network failure: {error}") from error
            pause = min(30.0, 2 ** trial + random.uniform(0.1, 0.7))
            print(f"[RETRY] Network issue; waiting {pause:.1f}s", flush=True)
            time.sleep(pause)
    raise RuntimeError("No API response")


def build_url(query: str) -> str:
    return f"{SOURCE}/compound/name/{quote(query, safe='')}/property/{','.join(PROPS)}/JSON"


def normalize(raw: dict, seed: dict, url: str) -> dict:
    rows = raw.get("PropertyTable", {}).get("Properties", [])
    if not rows or not isinstance(rows, list):
        raise ValueError("Missing PropertyTable.Properties")
    prop = rows[0]
    cid = prop.get("CID")
    if not isinstance(cid, int) or cid <= 0:
        raise ValueError("Invalid PubChem CID")
    return {
        "cid": cid,
        "name": seed["name"],
        "category": seed["category"],
        "molecular_formula": prop.get("MolecularFormula"),
        "molecular_weight_g_mol": prop.get("MolecularWeight"),
        "connectivity_smiles": prop.get("ConnectivitySMILES"),
        "smiles": prop.get("SMILES"),
        "iupac_name": prop.get("IUPACName"),
        "inchikey": prop.get("InChIKey"),
        "xlogp": prop.get("XLogP"),
        "tpsa_angstrom2": prop.get("TPSA"),
        "h_bond_donors": prop.get("HBondDonorCount"),
        "h_bond_acceptors": prop.get("HBondAcceptorCount"),
        "rotatable_bonds": prop.get("RotatableBondCount"),
        "formal_charge": prop.get("Charge"),
        "source_query": seed["query"],
        "source_url": url,
        "pubchem_url": f"https://pubchem.ncbi.nlm.nih.gov/compound/{cid}",
        "fetched_at_utc": now_utc(),
    }


def load_seeds(path: Path, limit: int) -> list[dict]:
    seeds = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(seeds, list):
        raise ValueError("Seed file must be a JSON list")
    found: set[str] = set()
    out: list[dict] = []
    for row in seeds:
        if not isinstance(row, dict) or not all(isinstance(row.get(x), str) and row[x].strip() for x in ("query", "name", "category")):
            raise ValueError("Every seed must have query, name and category")
        key = row["query"].casefold().strip()
        if key in found:
            continue
        found.add(key)
        out.append({"query":row["query"].strip(), "name":row["name"].strip(), "category":row["category"].strip()})
    return out[:limit] if limit > 0 else out


def export(out: Path, state: dict, seeds: list[dict]) -> tuple[int, int, int]:
    # Keep only records requested by this run, dedupe by stable PubChem CID.
    by_cid: dict[int, dict] = {}
    duplicate_cids: dict[str, list[str]] = {}
    failed: list[dict] = []
    success = 0
    for seed in seeds:
        entry = state.get(seed["query"], {})
        if entry.get("status") != "ok":
            failed.append({"query": seed["query"], "status":entry.get("status","pending"), "message":entry.get("message")})
            continue
        success += 1
        row = entry["record"]
        cid = row["cid"]
        if cid in by_cid:
            duplicate_cids.setdefault(str(cid), [by_cid[cid]["source_query"]]).append(seed["query"])
        else:
            by_cid[cid] = row
    data = list(by_cid.values())
    atomic_json(out / "pubchem_compounds.json", data)
    with (out / "pubchem_compounds.csv").open("w", encoding="utf-8-sig", newline="") as file:
        writer = csv.DictWriter(file, fieldnames=FIELDS, extrasaction="ignore")
        writer.writeheader()
        writer.writerows(data)
    atomic_json(out / "manifest.json", {
        "schema_version": 1,
        "generated_at_utc": now_utc(),
        "source": "PubChem PUG REST API",
        "source_documentation": DOC_URL,
        "endpoint_template": SOURCE + "/compound/name/{query}/property/{properties}/JSON",
        "request_delay_seconds": "configured via CLI (default 1.0; minimum 0.25)",
        "requested_queries": len(seeds),
        "successful_queries": success,
        "unique_compounds": len(data),
        "duplicate_cids": duplicate_cids,
        "not_fetched": failed,
        "property_fields": list(PROPS),
        "limitations": [
            "PubChem names may be ambiguous; the first returned CID is selected.",
            "Properties are computed/described by PubChem; not laboratory validation.",
            "Missing properties remain null; they are never guessed.",
            "API responses can change over time; see each fetched_at_utc field.",
            "Educational dataset, not evidence of biological activity, toxicity or safety.",
        ],
    })
    return success, len(data), len(failed)


def main(argv: list[str] | None = None) -> int:
    root = Path(__file__).resolve().parents[1]
    parser = argparse.ArgumentParser(description="Collect compound properties safely from PubChem PUG REST API")
    parser.add_argument("--input", type=Path, default=root / "scripts" / "pubchem_seed_compounds.json")
    parser.add_argument("--out", type=Path, default=root / "private" / "compound_data")
    parser.add_argument("--limit", type=int, default=20, help="First N seeds; 0=all")
    parser.add_argument("--delay", type=float, default=1.0, help="Delay before each HTTP request (>=0.25)")
    parser.add_argument("--retry-errors", action="store_true", help="Retry failed queries from previous runs")
    args = parser.parse_args(argv)
    if args.limit < 0 or not (0.25 <= args.delay <= 120):
        parser.error("--limit must be >=0 and --delay must be 0.25..120 seconds")
    if not args.input.is_file():
        parser.error(f"Missing seeds JSON: {args.input}")
    seeds = load_seeds(args.input, args.limit)
    out = args.out.resolve()
    # Never accidentally collect directly into a publicly deployed directory.
    if any(part.lower() in ("public", "dist") for part in out.parts):
        parser.error("Output cannot be inside public/ or dist/")
    out.mkdir(parents=True, exist_ok=True)
    state_path = out / "lookup_state.json"
    state = json.loads(state_path.read_text(encoding="utf-8")) if state_path.exists() else {}
    if not isinstance(state, dict):
        parser.error("lookup_state.json must be an object")
    print(f"[PUBCHEM] Collecting {len(seeds)} seed names. Output: {out}", flush=True)
    for i, seed in enumerate(seeds, 1):
        name = seed["query"]
        prev = state.get(name)
        if isinstance(prev, dict) and (prev.get("status") == "ok" or (not args.retry_errors and prev.get("status") in ("error", "not_found"))):
            print(f"[{i}/{len(seeds)}] [CACHED] {name}: {prev['status']}", flush=True)
            continue
        url = build_url(name)
        try:
            raw = get_json(url, delay=args.delay)
            record = normalize(raw, seed, url)
            state[name] = {"status":"ok","record":record}
            print(f"[{i}/{len(seeds)}] [OK] {name} -> CID {record['cid']}", flush=True)
        except LookupError as error:
            state[name] = {"status":"not_found","message":str(error),"checked_at_utc":now_utc()}
            print(f"[{i}/{len(seeds)}] [NOT FOUND] {name}: {error}", flush=True)
        except (ValueError, RuntimeError, KeyError) as error:
            state[name] = {"status":"error","message":str(error),"checked_at_utc":now_utc()}
            print(f"[{i}/{len(seeds)}] [ERROR] {name}: {error}", flush=True)
        finally:
            atomic_json(state_path, state)
    success, unique, failed = export(out, state, seeds)
    print(f"[DONE] {success}/{len(seeds)} resolved | {unique} distinct CIDs | {failed} unresolved")
    print(f"[FILES] {out / 'pubchem_compounds.csv'}")
    print(f"[FILES] {out / 'pubchem_compounds.json'}")
    print(f"[FILES] {out / 'manifest.json'}")
    print("[PRIVATE] No files uploaded to GitHub, Firebase or any cloud storage.")
    return 0 if success else 2


if __name__ == "__main__":
    sys.exit(main())
