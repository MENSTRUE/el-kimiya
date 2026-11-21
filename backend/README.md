# El-Kīmiyā V4.2 — Molecular Backend + Tool-Calling Agent

This is real backend source code, **not** a mock service. It is designed for the user's already-imported ChEMBL 37 database at `private/compound_data/chembl_37.sqlite` (2,897,819 rows reported on the user's computer). The installer **does not download or overwrite** that database.

## Architecture

```
React + Vite (http://localhost:5173/#molecules)
   |   fetch(JSON) - local browser only
   v
FastAPI (http://127.0.0.1:8000)
   ├── search/lookup ─────> ChEMBL 37 SQLite [read-only]
   ├── RDKit descriptors -> computed from stored SMILES
   ├── Tanimoto ─────────> optional private Morgan fingerprint SQLite
   └── Agent planner
       ├── tools-only: deterministic retrieval + RDKit (no LLM)
       └── Gemini: explicit tool calls [bounded] -> evidence-based prose
```

**Neither ChEMBL chemreps nor PubChem raw data contains a magic verified model.** ChEMBL chemreps has `chembl_id`, `canonical_smiles`, `standard_inchi`, `standard_inchi_key` only. Compound names/bioactivity/toxicity/synthesis feasibility are not present. The app keeps the existing PubChem + Firebase AI user interface separately; backend Gemini API is a distinct provider, and **does not prove on-device Firebase inference**.

## Start on Windows (PowerShell)

Run `install-v42.ps1` from the extracted ZIP (does npm verification, creates `backend/.venv`, installs Python packages, runs tests). Python 3.11 x64 required. If network interruption breaks Python package download, rerun installer. There is also `-SkipPythonSetup` for source-only installation; it is **not** a verified running backend.

Terminal A (keep running):

```powershell
cd "D:\el kimiya"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts\start-backend-v42.ps1
```

Terminal B (keep running):

```powershell
cd "D:\el kimiya"
npm run dev -- --port 5173
```

Visit `http://127.0.0.1:8000/docs` and `http://localhost:5173/#molecules`.

If port 5173 is already in use, use your existing running Vite window rather than starting another. If backend port 8000 is already in use, stop that server before launching this one.

## API contracts

| Route | Method | Description |
|---|---|---|
| `/api/v1/health` | GET | DB count, RDKit/fingerprint/Gemini state |
| `/api/v1/molecules/search?q=CHEMBL25` | GET | ChEMBL ID prefix or exact InChIKey, **not names** |
| `/api/v1/molecules/CHEMBL25` | GET | Exact structure record |
| `/api/v1/molecules/describe` | POST | `{"smiles":"CCO"}`; RDKit derived descriptors |
| `/api/v1/molecules/similar` | POST | `{"chembl_id":"CHEMBL25", "top_k":8, "max_candidates":20000}`; bounded fingerprint candidates |
| `/api/v1/agent/query` | POST | `{"question":"Explain CHEMBL25", "language":"id", "use_llm":false}` |

**Tools-only mode** is retrieval and deterministic presentation. It is **not** a generative LLM. Gemini tool-calling mode requires a separate server-side key; it plans / invokes allowlisted database and RDKit tools with a max 4-call budget. Structured evidence and tool trace are shown to the user. AI responses remain fallible.

## Optional Gemini (server-side only)

Copy `backend/.env.example` to `backend/.env`, then provide a valid `GEMINI_API_KEY`. Never prefix it with `VITE_`. Never paste into chat, Git, source, frontend or hosting. Restart backend after editing. `GEMINI_MODEL` defaults to `gemini-2.5-flash`; use any account-enabled supported model if unavailable. Google GenAI SDK may have API quota or charges; no-cost operation is NOT guaranteed. In tools-only mode no Gemini requests occur.

## Fingerprints (optional; safe and resumable)

A 2.9-million-row full fingerprint build is computationally substantial. We **do not** pretend it is done. For a useful initial subset:

```powershell
cd "D:\el kimiya"
.\backend\.venv\Scripts\python.exe backend\scripts\build_fingerprints.py --limit 25000
```

Continue with another 25K (resumes from checkpoint), or run `--limit 0` to process all remaining rows (may take hours and consume storage). Writes to `private/compound_data/chembl_37_fingerprints.sqlite`; original `chembl_37.sqlite` is READ-ONLY and untouched. API limits each query to max 50,000 sampled fingerprint entries to control cost; rankings apply ONLY to the screened subset, even after the full fingerprint build. Build a dedicated ANN/molecular search index to support global-scale high-performance similarity later.

## Testing

```
.\backend\.venv\Scripts\python.exe -m pytest -q backend\tests
npm run verify
```

All API tests use **tiny synthetic fixtures**, not the 2.9M database. A green test is not proof of every record's RDKit validity, global similarity search, or cloud Gemini live connection. Once the backend is running, test in browser with a real ChEMBL ID.

## Privacy and deployment

- The service binds `127.0.0.1` only and accepts CORS from `localhost:5173` / `127.0.0.1:5173` only. Do **not** expose it publicly without authentication, quotas, HTTPS, monitoring and a managed database.
- Do not put local SQLite databases, PDFs, indexes, backend `.env` secrets, App Check debug tokens, or virtual environments into GitHub, Firebase Hosting or `public/`.
- The hosted Firebase website cannot access this backend on other people's laptops. Production needs a properly secured deployed backend (later milestone), not localhost bridging.
- Molecular structure similarity is NOT evidence of biological activity, toxicity, clinical suitability, or feasible synthesis.
