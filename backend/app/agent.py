"""Bounded tool-using molecular agent; Gemini is optional but never silently simulated.

Gemini uses explicit, allowlisted function declarations with at most 4 tool calls.
No SQL, filesystem, shell commands, external URLs, or arbitrary code execution are exposed.
"""
from __future__ import annotations

import os
import re
from typing import Any, Callable

from .chemistry import describe_smiles, RDKIT_READY
from .repository import MoleculeRepository, CHEMBL_ID
from .similarity import FingerprintIndex

ID_IN_TEXT = re.compile(r"CHEMBL[0-9]{1,12}", re.I)

class ToolRunner:
    def __init__(self, repo: MoleculeRepository, fingerprints: FingerprintIndex):
        self.repo, self.fingerprints = repo, fingerprints
        self.trace: list[dict] = []
        self.evidence: list[dict] = []

    def call(self, name: str, args: dict) -> dict:
        # Validate every argument again server-side, regardless of model's tool schema.
        if name == "lookup_molecule":
            cid = str(args.get("chembl_id", ""))[:40]
            data = self.repo.by_id(cid)
            result = {"record": data, "found": data is not None}
            if data:
                self.evidence.append({"chembl_id": data["chembl_id"], "url": data["record_url"], "source": data["source"]})
        elif name == "validate_smiles":
            smiles = str(args.get("smiles", ""))[:1201]
            result = describe_smiles(smiles)
        elif name == "search_molecule":
            q = str(args.get("query", ""))[:80]
            limit = min(10, max(1, int(args.get("limit", 5))))
            result = {"hits": self.repo.search(q, limit), "search_type": "ChEMBL ID prefix or exact InChIKey"}
            for hit in result["hits"][:5]:
                self.evidence.append({"chembl_id": hit["chembl_id"], "url": hit["record_url"], "source": hit["source"]})
        elif name == "find_similar":
            cid = str(args.get("chembl_id", ""))[:40].upper()
            record = self.repo.by_id(cid)
            if not record:
                raise ValueError(f"Molecule not found: {cid}")
            result = self.fingerprints.similar(record["canonical_smiles"], top_k=5, max_candidates=20000, exclude_id=cid)
            result["query_chembl_id"] = cid
            self.evidence.append({"chembl_id": cid, "url": record["record_url"], "source": record["source"]})
        else:
            raise ValueError("Unknown tool (not allowlisted)")
        self.trace.append({"tool": name, "args": {k: str(v)[:80] for k,v in args.items()}, "outcome": "ok"})
        return result


def local_grounded_answer(question: str, repo: MoleculeRepository, fingerprints: FingerprintIndex, language: str) -> dict:
    """Tool-driven factual fallback. Explicitly NOT an LLM response."""
    runner = ToolRunner(repo, fingerprints)
    matches = ID_IN_TEXT.findall(question)
    if not matches:
        return {
            "answer": ("Masukkan ID seperti CHEMBL25 agar saya bisa mengambil bukti dari database. Nama umum belum tersedia dalam ChEMBL chemreps."
                       if language == "id" else "Provide a ChEMBL ID like CHEMBL25 to retrieve evidence. Common names are not in chemreps."),
            "mode": "TOOLS_ONLY", "model": None, "tools": [], "evidence": [],
            "limitations": ["Not a generative AI response", "Names and bioactivity not included in ChEMBL chemreps"]
        }
    cid = matches[0].upper()
    hit = runner.call("lookup_molecule", {"chembl_id": cid})
    record = hit["record"]
    if not record:
        answer = (f"ID {cid} tidak ditemukan di database lokal." if language == "id" else f"ID {cid} not found in local database.")
    else:
        desc = runner.call("validate_smiles", {"smiles": record["canonical_smiles"]}) if RDKIT_READY else None
        if language == "id":
            answer = f"{cid} tersedia pada ChEMBL 37. SMILES sumber: {record['canonical_smiles']}."
            if desc:
                answer += f" RDKit menghitung rumus {desc['molecular_formula_rdkit']} dan massa molekul {desc['molecular_weight_rdkit']} g/mol."
        else:
            answer = f"{cid} is present in ChEMBL 37. Source SMILES: {record['canonical_smiles']}."
            if desc:
                answer += f" RDKit computes formula {desc['molecular_formula_rdkit']} and MW {desc['molecular_weight_rdkit']} g/mol."
        if re.search(r"similar|mirip|serupa|kemiripan", question, re.I):
            if fingerprints.present() and RDKIT_READY:
                sim = runner.call("find_similar", {"chembl_id": cid})
                answer += " " + (f"Kemiripan Tanimoto dalam {sim['screened_fingerprints']:,} fingerprint yang diperiksa: " if language == "id" else f"Tanimoto similarity among {sim['screened_fingerprints']:,} screened fingerprints: ")
                answer += ", ".join(f"{x['chembl_id']} ({x['tanimoto']:.3f})" for x in sim['hits'][:3]) or "—"
            else:
                answer += " " + ("Indeks fingerprint belum dibangun." if language == "id" else "Fingerprint index has not been built yet.")
    return {
        "answer": answer, "mode": "TOOLS_ONLY", "model": None, "tools": runner.trace,
        "evidence": runner.evidence,
        "limitations": ["No LLM was invoked", "Only structural representations are present", "No toxicity, bioactivity or synthesis prediction"]
    }


SYSTEM = """You are El-Kīmiyā's educational chemistry data agent.
Only make factual molecule claims supported by YOUR TOOL RESULTS. Do not invent compound names,
activity, experimental results, measured properties, therapeutic claims, procedures, or sources.
The source dataset is ChEMBL 37 chemreps: ChEMBL ID, SMILES, InChI, InChIKey only.
RDKit descriptors are COMPUTED (not measured). Tanimoto similarity is computed on the
screened fingerprint subset (never say global top neighbor unless all records screened).
Do not provide actionable instructions for hazardous substance synthesis.
When no evidence exists, say so. Explicitly cite ChEMBL IDs in your answer.
Keep it educational, clear, and concise. Respond in the requested language.
"""


def gemini_tool_agent(question: str, repo: MoleculeRepository, fingerprints: FingerprintIndex, language: str) -> dict:
    from google import genai
    from google.genai import types
    runner = ToolRunner(repo, fingerprints)
    defs = [
        ("lookup_molecule", "Look up exact ChEMBL identifier in the read-only local database", {"chembl_id": {"type": "string"}}, ["chembl_id"]),
        ("search_molecule", "Search ChEMBL ID prefix or exact InChIKey (NO common-name lookup)", {"query": {"type": "string"}, "limit": {"type": "integer"}}, ["query"]),
        ("validate_smiles", "Compute RDKit descriptors for given SMILES, not measured experimental properties", {"smiles": {"type": "string"}}, ["smiles"]),
        ("find_similar", "Find Tanimoto similarity ONLY within the locally indexed subset", {"chembl_id": {"type": "string"}}, ["chembl_id"]),
    ]
    declarations = [types.FunctionDeclaration(name=name, description=desc, parameters_json_schema={"type":"object","properties":props,"required":required}) for name,desc,props,required in defs]
    tool = types.Tool(function_declarations=declarations)
    client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])
    model = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
    prompt = question[:800] + ("\nLanguage: Bahasa Indonesia" if language == "id" else "\nLanguage: English")
    contents: list = [types.Content(role="user", parts=[types.Part.from_text(text=prompt)])]
    config = types.GenerateContentConfig(
        system_instruction=SYSTEM,
        temperature=0.15,
        max_output_tokens=900,
        tools=[tool],
        automatic_function_calling=types.AutomaticFunctionCallingConfig(disable=True),
    )
    try:
        for turn in range(5):
            response = client.models.generate_content(model=model, contents=contents, config=config)
            calls = response.function_calls or []
            if not calls:
                if not runner.trace:
                    # Do not label unsupported ungrounded LLM prose as grounded analysis.
                    return {"answer": "No tool evidence was used. Add a ChEMBL ID and retry.", "mode":"GEMINI_TOOL_CALLING", "model":model, "tools":[], "evidence":[], "limitations":["No database tool used; response suppressed"]}
                return {"answer": (response.text or "No final answer generated").strip()[:4000],
                        "mode":"GEMINI_TOOL_CALLING", "model":model, "tools":runner.trace, "evidence":runner.evidence,
                        "limitations":["LLM explanations require verification", "No biological or experimental predictions", "Similarity may be subset-only"]}
            if turn >= 4:
                break
            contents.append(response.candidates[0].content)
            parts = []
            for call in calls:
                if len(runner.trace) >= 4:
                    break
                try:
                    result = runner.call(call.name, dict(call.args or {}))
                    payload: dict[str, Any] = {"result": result}
                except (ValueError, FileNotFoundError, ImportError, RuntimeError) as exc:
                    runner.trace.append({"tool":call.name, "outcome":"error", "message":str(exc)[:150]})
                    payload = {"error": str(exc)[:150]}
                # Cap tool output to prevent excessive context costs (InChI can be long).
                parts.append(types.Part.from_function_response(name=call.name, response=payload))
            if not parts:
                break
            contents.append(types.Content(role="tool", parts=parts))
        return {"answer":"Agent stopped at the 4-tool-call safety budget. Review evidence and narrow the question.",
                "mode":"GEMINI_TOOL_CALLING", "model":model, "tools":runner.trace,"evidence":runner.evidence,
                "limitations":["Tool-call budget reached", "No unsupported conclusion generated"]}
    finally:
        client.close()
