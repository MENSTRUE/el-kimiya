"""El-Kimiya V6 Molecular Studio public RDKit API (Vercel Python Function).

Small, bounded SMILES-to-2D + descriptor route; optional approximate 3D
conformer generation. No local ChEMBL database, LLM, credentials, or writes.
"""
from __future__ import annotations

import re
from fastapi import FastAPI, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, ConfigDict, Field
from rdkit import Chem, rdBase
from rdkit.Chem import AllChem, Descriptors, Lipinski, rdMolDescriptors
from rdkit.Chem.Draw import rdMolDraw2D

MAX_SMILES = 256
MAX_ATOMS = 80
MAX_BONDS = 160
MAX_3D_HEAVY_ATOMS = 35
_ALLOWED = re.compile(r"[A-Za-z0-9@+\-\[\]()/=\\#$%.*:]+\Z")

app = FastAPI(
    title="El-Kimiya Molecular Studio API",
    version="6.0.0",
    docs_url=None,
    redoc_url=None,
    openapi_url=None,
)
# Only required for the optional LOCAL Vite + uvicorn test workflow.
# Production always calls the same-origin /api/chemistry endpoint.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://127.0.0.1:8443", "http://localhost:8443", "http://localhost:5173", "http://127.0.0.1:5173"],
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)


class DescribeRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    smiles: str = Field(min_length=1, max_length=MAX_SMILES)
    include_3d: bool = False


def parse_molecule(raw: str):
    smiles = raw.strip()
    if not smiles or len(smiles) > MAX_SMILES or not _ALLOWED.fullmatch(smiles):
        raise HTTPException(status_code=422, detail="SMILES contains unsupported characters or length")
    mol = Chem.MolFromSmiles(smiles)
    if mol is None:
        raise HTTPException(status_code=422, detail="Unable to parse/sanitize SMILES")
    if mol.GetNumAtoms() > MAX_ATOMS or mol.GetNumBonds() > MAX_BONDS:
        raise HTTPException(status_code=422, detail=f"Demo limit: at most {MAX_ATOMS} atoms / {MAX_BONDS} bonds")
    return mol


def draw_svg(mol) -> str:
    # Draw a copy so the canonical molecule and atom count remain unchanged.
    picture_mol = Chem.Mol(mol)
    rdMolDraw2D.PrepareMolForDrawing(picture_mol)
    painter = rdMolDraw2D.MolDraw2DSVG(760, 510)
    opts = painter.drawOptions()
    opts.bondLineWidth = 2.3
    opts.padding = 0.08
    opts.addStereoAnnotation = True
    opts.annotationFontScale = 0.75
    painter.DrawMolecule(picture_mol)
    painter.FinishDrawing()
    return painter.GetDrawingText()


def make_3d(mol):
    if mol.GetNumAtoms() > MAX_3D_HEAVY_ATOMS:
        raise HTTPException(status_code=422, detail=f"3D demo supports at most {MAX_3D_HEAVY_ATOMS} heavy atoms; 2D supports up to {MAX_ATOMS}")
    # The estimate is an ETKDG-generated conformer, not measured structure.
    molecule = Chem.AddHs(Chem.Mol(mol))
    params = AllChem.ETKDGv3()
    params.randomSeed = 2026
    params.maxIterations = 55
    params.numThreads = 1
    status = AllChem.EmbedMolecule(molecule, params)
    if status != 0:
        raise HTTPException(status_code=422, detail="Could not generate a 3D conformer for this structure")
    # UFF may not support some chemistry; keep the ETKDG conformer if so.
    try:
        AllChem.UFFOptimizeMolecule(molecule, maxIters=70)
    except Exception:
        pass
    conf = molecule.GetConformer()
    atoms = []
    for atom in molecule.GetAtoms():
        pos = conf.GetAtomPosition(atom.GetIdx())
        atoms.append({"element": atom.GetSymbol(), "xyz": [round(pos.x, 4), round(pos.y, 4), round(pos.z, 4)]})
    bonds = [
        {"a": b.GetBeginAtomIdx(), "b": b.GetEndAtomIdx(), "order": round(b.GetBondTypeAsDouble(), 1)}
        for b in molecule.GetBonds()
    ]
    return {"atoms": atoms, "bonds": bonds, "method": "RDKit ETKDGv3 approximate conformer; not experimental geometry"}


@app.get("/")
@app.get("/api/chemistry")
def health(response: Response):
    response.headers["Cache-Control"] = "no-store"
    return {
        "status": "ok",
        "version": "6.0.0",
        "mode": "PUBLIC_RDKIT",
        "rdkit_ready": True,
        "rdkit_version": rdBase.rdkitVersion,
        "chEMBL_database_ready": False,
        "capabilities": ["descriptors", "svg_2d", "conformer_3d_on_demand"],
        "scope": "Structure depiction and approximate 3D only; no full ChEMBL search or biological claims",
    }


@app.post("/")
@app.post("/api/chemistry")
def describe(req: DescribeRequest, response: Response):
    response.headers["Cache-Control"] = "no-store"
    mol = parse_molecule(req.smiles)
    try:
        result = {
            "canonical_smiles_rdkit": Chem.MolToSmiles(mol, canonical=True),
            "molecular_formula_rdkit": rdMolDescriptors.CalcMolFormula(mol),
            "molecular_weight_rdkit": round(Descriptors.MolWt(mol), 3),
            "logp_rdkit": round(Descriptors.MolLogP(mol), 3),
            "tpsa_rdkit": round(rdMolDescriptors.CalcTPSA(mol), 3),
            "h_bond_donors_rdkit": Lipinski.NumHDonors(mol),
            "h_bond_acceptors_rdkit": Lipinski.NumHAcceptors(mol),
            "rotatable_bonds_rdkit": Lipinski.NumRotatableBonds(mol),
            "atom_count_rdkit": mol.GetNumAtoms(),
            "svg_2d": draw_svg(mol),
            "molecule_3d": make_3d(mol) if req.include_3d else None,
            "descriptor_source": "RDKit calculation from user-supplied SMILES; no experimentally measured properties",
        }
        return result
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=422, detail="RDKit could not depict this molecule") from exc
