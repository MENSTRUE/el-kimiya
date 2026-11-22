# El-Kīmiyā V4.9 — Vercel Python Function (RDKit)

This patch keeps the Vite frontend project and adds a **single Python serverless function** at `api/chemistry.py`, mapped by Vercel's file-based Python Functions to `/api/chemistry`. It does **not** deploy the private ChEMBL 37 SQLite database, persistent learning progress, or the original `backend/app/main.py` agent. No API secret or ChEMBL raw database is required.

## Production shape

- `https://el-kimiya.vercel.app/` — existing Vite frontend
- `GET /api/chemistry` — public runtime health; responds `mode: PUBLIC_RDKIT`
- `POST /api/chemistry` — `{ "smiles": "CCO" }`, real RDKit descriptors
- `/#molecules` — public Molecular Intelligence Lab now includes RDKit calculator for both languages
- The full 2.9 million ChEMBL database stays local; 10 exported samples remain static in `/data/molecules/samples.json`

## Requirements

- Vercel project `el-kimiya` remains **Vite**, root `./`, build `npm run release:build`, output `dist`, install automatic (npm).
- Keep Firebase's existing production environment variables; add no Python secrets.
- `.python-version` pins Python 3.12 for the Functions runtime.
- Root `requirements.txt` lists only runtime dependencies: FastAPI and RDKit. The local `backend/requirements.txt` remains unchanged.

## Local verification

```powershell
cd 'D:\el kimiya'
python -m pip install -r requirements.txt httpx
python -m unittest discover -s tests -p 'test_vercel_chemistry_v49.py' -v
npm run release:build
```

Run Vercel runtime locally using `npx vercel dev` if the project is linked. Or use `python -m uvicorn api.chemistry:app --port 8020` for direct FastAPI testing. Plain `npm run dev` does not serve Python Functions; the new UI renders only on a public/non-local host.

## Git and deployment

```powershell
git add -- .python-version requirements.txt api/chemistry.py tests/test_vercel_chemistry_v49.py src/components/PublicRDKitV49.tsx src/components/MolecularIntelligenceLab.tsx src/public-rdkit-v49.css docs/V49_VERCEL_PYTHON_ID.md
git diff --cached --check
git diff --cached --stat
git commit -m 'feat(api): add public Vercel RDKit chemistry function'
git push origin main
```

Vercel should automatically rebuild the linked Vite project. In Vercel Deployments, check the *latest* commit and inspect build/runtime logs. If `/api/chemistry` returns 404, check Vercel's **Functions** list for `api/chemistry.py`, and verify the framework preset is still Vite with root `./`. The direct route depends on Vercel's Python file-based function support; local FastAPI tests alone cannot verify Vercel routing. Avoid rewriting all routes to `index.html` (it would swallow API calls).

## Safety and limitations

- Same-origin requests, no CORS wildcard, no file uploads, no auth, no writable DB. Inputs are limited to 256 chars and 80 atoms; use Vercel Firewall and monitor usage if public traffic grows.
- RDKit descriptors are structure-derived and not experimental measurements. No biological/toxicological predictions are exposed.
- Vercel Hobby is bounded by compute and invocation quotas. $0 is a goal only while staying in included limits and eligible use. Verify Vercel plan terms for the intended hackathon/public demo.
- Previous/local Firebase AI Logic Cloud + on-device routes do not depend on this Python API. Verify App Check separately on the public domain.
