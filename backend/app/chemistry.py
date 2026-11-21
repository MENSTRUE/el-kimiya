"""RDKit chemistry tools. Structure descriptors are computed, not downloaded.

These are descriptors, NOT toxicity, activity, stability or synthesis predictions.
"""
from __future__ import annotations

from functools import lru_cache

try:
    from rdkit import Chem, DataStructs, rdBase
    from rdkit.Chem import Descriptors, Lipinski, rdMolDescriptors, rdFingerprintGenerator
    RDKIT_READY = True
except ImportError:
    RDKIT_READY = False


class ChemistryUnavailable(RuntimeError):
    pass


@lru_cache(maxsize=1)
def fingerprint_generator():
    if not RDKIT_READY:
        raise ChemistryUnavailable("RDKit not installed. See backend/requirements.txt")
    return rdFingerprintGenerator.GetMorganGenerator(radius=2, fpSize=2048)


def molecular_fingerprint(smiles: str):
    mol = parse_smiles(smiles)
    return fingerprint_generator().GetFingerprint(mol)


def parse_smiles(smiles: str):
    if not RDKIT_READY:
        raise ChemistryUnavailable("RDKit not installed. See backend/requirements.txt")
    if not isinstance(smiles, str) or not smiles.strip() or len(smiles) > 1200:
        raise ValueError("SMILES must contain 1–1200 characters")
    # RDKit may legitimately reject malformed molecules. This is not a network request.
    mol = Chem.MolFromSmiles(smiles)
    if mol is None:
        raise ValueError("RDKit could not parse/sanitize this SMILES")
    if mol.GetNumAtoms() > 300:
        raise ValueError("Molecule exceeds 300 atoms in interactive mode")
    return mol


def describe_smiles(smiles: str) -> dict:
    mol = parse_smiles(smiles)
    return {
        "canonical_smiles_rdkit": Chem.MolToSmiles(mol, canonical=True),
        "molecular_formula_rdkit": rdMolDescriptors.CalcMolFormula(mol),
        "molecular_weight_rdkit": round(Descriptors.MolWt(mol), 3),
        "logp_rdkit": round(Descriptors.MolLogP(mol), 3),
        "tpsa_rdkit": round(rdMolDescriptors.CalcTPSA(mol), 3),
        "h_bond_donors_rdkit": Lipinski.NumHDonors(mol),
        "h_bond_acceptors_rdkit": Lipinski.NumHAcceptors(mol),
        "rotatable_bonds_rdkit": Lipinski.NumRotatableBonds(mol),
        "formal_charge_rdkit": Chem.GetFormalCharge(mol),
        "atom_count_rdkit": mol.GetNumAtoms(),
        "descriptor_source": "RDKit computed from input SMILES; not ChEMBL measurements",
    }


def fingerprint_bytes(smiles: str) -> bytes:
    return DataStructs.BitVectToBinaryText(molecular_fingerprint(smiles))


def score_fingerprints(target_smiles: str, blobs: list[bytes]) -> list[float]:
    if not RDKIT_READY:
        raise ChemistryUnavailable("RDKit is required")
    query = molecular_fingerprint(target_smiles)
    fps = [DataStructs.CreateFromBinaryText(blob) for blob in blobs]
    return list(DataStructs.BulkTanimotoSimilarity(query, fps))
