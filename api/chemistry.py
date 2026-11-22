"""El-Kimiya V4.9: public read-only RDKit service for Vercel Python Functions.

No local private database, secrets, model keys, filesystem writes or LLM calls.
api/chemistry.py maps to /api/chemistry on Vercel's Vite project.
"""
from __future__ import annotations

import re
from fastapi import FastAPI, HTTPException, Response
from pydantic import BaseModel, ConfigDict, Field
from rdkit import Chem, rdBase
from rdkit.Chem import Descriptors, Lipinski, rdMolDescriptors

MAX_SMILES = 256
MAX_ATOMS = 80
MAX_BONDS = 160
_ALLOWED = re.compile(r"[A-Za-z0-9@+\-\[\]()/=\\#$%.*:]+\Z")

app = FastAPI(
    title="El-Kimiya Public RDKit API",
    version="4.9.0",
    docs_url=None,
    redoc_url=None,
    openapi_url=None,
)


class DescribeRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    smiles: str = Field(min_length=1, max_length=MAX_SMILES)


@app.get("/")
@app.get("/api/chemistry")
def health(response: Response):
    response.headers["Cache-Control"] = "no-store"
    return {
        "status": "ok",
        "version": "4.9.0",
        "mode": "PUBLIC_RDKIT",
        "rdkit_ready": True,
        "rdkit_version": rdBase.rdkitVersion,
        "chEMBL_database_ready": False,
        "scope": "SMILES descriptors only; no full ChEMBL search or biological claims",
    }


@app.post("/")
@app.post("/api/chemistry")
def describe(req: DescribeRequest, response: Response):
    response.headers["Cache-Control"] = "no-store"
    smiles = req.smiles.strip()
    if not smiles or len(smiles) > MAX_SMILES or not _ALLOWED.fullmatch(smiles):
        raise HTTPException(status_code=422, detail="SMILES contains unsupported characters or length")
    # RDKit parse/sanitize the input; never evaluate custom scripts or molecule files.
    try:
        mol = Chem.MolFromSmiles(smiles)
        if mol is None:
            raise ValueError("Unable to parse/sanitize SMILES")
        if mol.GetNumAtoms() > MAX_ATOMS or mol.GetNumBonds() > MAX_BONDS:
            raise ValueError(f"Demo limit: at most {MAX_ATOMS} atoms and {MAX_BONDS} bonds")
        return {
            "canonical_smiles_rdkit": Chem.MolToSmiles(mol, canonical=True),
            "molecular_formula_rdkit": rdMolDescriptors.CalcMolFormula(mol),
            "molecular_weight_rdkit": round(Descriptors.MolWt(mol), 3),
            "logp_rdkit": round(Descriptors.MolLogP(mol), 3),
            "tpsa_rdkit": round(rdMolDescriptors.CalcTPSA(mol), 3),
            "h_bond_donors_rdkit": Lipinski.NumHDonors(mol),
            "h_bond_acceptors_rdkit": Lipinski.NumHAcceptors(mol),
            "rotatable_bonds_rdkit": Lipinski.NumRotatableBonds(mol),
            "atom_count_rdkit": mol.GetNumAtoms(),
            "descriptor_source": "RDKit calculation from user-supplied SMILES (not measured experimental data)",
        }
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)[:160]) from exc
    except Exception as exc:
        # Keep internal chemistry and binary-library stack traces private.
        raise HTTPException(status_code=422, detail="RDKit could not process this molecule") from exc
