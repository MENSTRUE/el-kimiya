# El-Kīmiyā V4.2 — Integration notes

**Scope:** Complete new `backend/` service, `MolecularBackendPanel.tsx`, `molecularBackend.ts`, CSS, install/check/start scripts, tests. Patches existing `src/components/MolecularIntelligenceLab.tsx` once and adds venv/backend `.env` ignores. No Firebase API keys or local ChEMBL rows are distributed.

## Data lineage

- Source: ChEMBL 37 chemreps (2,897,819 unique structure rows observed on owner's machine).
- Read-only DB: `private/compound_data/chembl_37.sqlite` created in V4.1.
- Identity: ChEMBL IDs are not PubChem CIDs. No compound names or activities are inferred.
- Computed RDKit fields explicitly suffixed `_rdkit`.
- Similarity: Morgan radius 2 / 2048 bit; local bounded screening. No global nearest-neighbor claim.
- AI: local tool planner for zero-key mode (not generative); actual Google Gemini function-calling with a backend-only key. The existing Firebase AI client remains independent and unchanged.

## Installation proof

Installer must print `[PASS] EL-KIMIYA V4.2 AGENTIC BACKEND INSTALLED`. Then run backend and frontend in separate terminals. `/api/v1/health` must return `database_ready:true` and count > 0; `/api/v1/molecules/search?q=CHEMBL25` should return structure (if record is present). Real Gemini must be tested separately with a valid key before claiming operational LLM tool calling.

## Known limitations

The backend isn't deployed to Firebase Hosting, there is no authentication or global molecular similarity index, there are no chemical name/assay join tables, and there is no model fine-tuning. Both UI and backend explicitly show these limitations. For public use, add server auth (e.g., Firebase Authentication + App Check verification on server), per-user quotas, rate limits, remote persistent storage, and deployment pipeline before changing localhost restrictions.
