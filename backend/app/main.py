"""El-Kīmiyā V4.2 local molecular REST API.

The API is LOCAL-ONLY by design. Never expose it directly to the public Internet.
The large ChEMBL 37 database is opened read-only, never copied or overwritten.
"""
from __future__ import annotations

import os
from pathlib import Path

import anyio
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, ConfigDict

from .agent import local_grounded_answer, gemini_tool_agent
from .chemistry import describe_smiles, RDKIT_READY, ChemistryUnavailable
from .repository import MoleculeRepository
from .similarity import FingerprintIndex
from .learning_api import make_learning_router

ROOT = Path(__file__).resolve().parents[2]
# This backend/.env never goes to frontend or Firebase Hosting.
try:
    from dotenv import load_dotenv
    load_dotenv(ROOT / "backend" / ".env", override=False)
except ImportError:
    pass

DEFAULT_DB = ROOT / "private" / "compound_data" / "chembl_37.sqlite"
DEFAULT_FPS = ROOT / "private" / "compound_data" / "chembl_37_fingerprints.sqlite"


class StrictModel(BaseModel):
    model_config = ConfigDict(extra="forbid")


class DescribeRequest(StrictModel):
    smiles: str = Field(min_length=1, max_length=1200)


class SimilarRequest(StrictModel):
    chembl_id: str = Field(min_length=7, max_length=20)
    top_k: int = Field(default=8, ge=1, le=15)
    max_candidates: int = Field(default=20000, ge=1, le=50000)


class AgentRequest(StrictModel):
    question: str = Field(min_length=5, max_length=800)
    language: str = Field(default="id", pattern="^(id|en)$")
    use_llm: bool = False


def create_app(db_path: Path | None = None, fps_path: Path | None = None, learning_progress_path: Path | None = None, learning_bank_path: Path | None = None) -> FastAPI:
    app = FastAPI(title="El-Kīmiyā Molecular Agent API", version="4.2.0",
                  description="Local read-only ChEMBL 37 + RDKit + optional Gemini tool-calling")
    app.add_middleware(
        CORSMiddleware,
        allow_origins=['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:8443', 'http://127.0.0.1:8443'],
        allow_methods=["GET", "POST"], allow_headers=["Content-Type"],
        allow_credentials=False,
    )
    app.state.repo = MoleculeRepository(Path(db_path or os.getenv("CHEMBL_DB", DEFAULT_DB)))
    app.state.fps = FingerprintIndex(Path(fps_path or os.getenv("FINGERPRINT_DB", DEFAULT_FPS)))
    app.include_router(
        make_learning_router(
            bank_path=Path(learning_bank_path or os.getenv(
                "ELK_LEARNING_BANK", ROOT / "backend" / "data" / "chemistry_learning_bank_v1.json")),
            progress_path=Path(learning_progress_path or os.getenv(
                "ELK_LEARNING_PROGRESS_DB", ROOT / "private" / "learning" / "progress.sqlite")),
        ),
        prefix="/api/v1/learning", tags=["learning"],
    )

    @app.get("/api/v1/health")
    def health():
        repo = app.state.repo
        fps = app.state.fps
        ready = repo.present()
        try:
            molecules = repo.count() if ready else 0
            indexed = fps.indexed_count()
        except Exception:
            molecules, indexed, ready = 0, 0, False
        return {
            "status": "ok" if ready else "database_missing",
            "dataset": "ChEMBL 37 chemreps", "database_ready": ready,
            "molecules": molecules, "fingerprints_indexed": indexed,
            "rdkit_ready": RDKIT_READY,
            "gemini_configured": bool(os.getenv("GEMINI_API_KEY", "").strip()),
            "agent_modes": ["TOOLS_ONLY"] + (["GEMINI_TOOL_CALLING"] if os.getenv("GEMINI_API_KEY", "").strip() else []),
            "backend_scope": "LOCAL_ONLY",
        }

    @app.get("/api/v1/molecules/search")
    def search(q: str = Query(min_length=3, max_length=60), limit: int = Query(default=10, ge=1, le=30)):
        try:
            return {"hits": app.state.repo.search(q, limit), "dataset": "ChEMBL 37 chemreps",
                    "note": "Searches ChEMBL ID prefix or exact InChIKey. No compound names in this dataset."}
        except ValueError as exc:
            raise HTTPException(422, str(exc)) from exc
        except FileNotFoundError as exc:
            raise HTTPException(503, str(exc)) from exc

    @app.get("/api/v1/molecules/{chembl_id}")
    def get_molecule(chembl_id: str):
        try:
            row = app.state.repo.by_id(chembl_id)
            if row is None:
                raise HTTPException(404, "ChEMBL ID not found in local database")
            return {"record": row, "dataset": "ChEMBL 37 chemreps"}
        except ValueError as exc:
            raise HTTPException(422, str(exc)) from exc
        except FileNotFoundError as exc:
            raise HTTPException(503, str(exc)) from exc

    @app.post("/api/v1/molecules/describe")
    def describe(req: DescribeRequest):
        try:
            return describe_smiles(req.smiles)
        except ValueError as exc:
            raise HTTPException(422, str(exc)) from exc
        except ChemistryUnavailable as exc:
            raise HTTPException(503, str(exc)) from exc

    @app.post("/api/v1/molecules/similar")
    def similar(req: SimilarRequest):
        try:
            record = app.state.repo.by_id(req.chembl_id)
            if not record:
                raise HTTPException(404, "ChEMBL ID not found")
            result = app.state.fps.similar(record["canonical_smiles"], top_k=req.top_k,
                                          max_candidates=req.max_candidates, exclude_id=record["chembl_id"])
            result["query_chembl_id"] = record["chembl_id"]
            result["entire_dataset"] = app.state.repo.count()
            return result
        except ValueError as exc:
            raise HTTPException(422, str(exc)) from exc
        except (FileNotFoundError, ChemistryUnavailable) as exc:
            raise HTTPException(503, str(exc)) from exc

    @app.post("/api/v1/agent/query")
    async def agent_query(req: AgentRequest):
        if not app.state.repo.present():
            raise HTTPException(503, "ChEMBL SQLite missing. See setup instructions.")
        if req.use_llm and not os.getenv("GEMINI_API_KEY", "").strip():
            raise HTTPException(409, "GEMINI_API_KEY not configured in backend/.env. Use tools-only mode or set backend key.")
        # Model calls / fingerprint scans must not block FastAPI's main event loop.
        try:
            if req.use_llm:
                return await anyio.to_thread.run_sync(gemini_tool_agent, req.question,
                                                      app.state.repo, app.state.fps, req.language)
            return await anyio.to_thread.run_sync(local_grounded_answer, req.question,
                                                  app.state.repo, app.state.fps, req.language)
        except (ValueError, RuntimeError, ChemistryUnavailable) as exc:
            raise HTTPException(422, str(exc)[:300]) from exc
        except FileNotFoundError as exc:
            raise HTTPException(503, str(exc)) from exc
        except Exception as exc:
            # Do not leak tokens, HTTP headers or raw upstream SDK error strings.
            raise HTTPException(502, f"Agent provider failed ({type(exc).__name__}). Check backend terminal logs.") from exc

    return app


app = create_app()
