/** V4.2 local-only FastAPI bridge. No tokens or PDF data are sent. */
export type BackendHealth = {
  status: string; dataset: string; database_ready: boolean; molecules: number;
  fingerprints_indexed: number; rdkit_ready: boolean; gemini_configured: boolean;
  agent_modes: string[]; backend_scope: 'LOCAL_ONLY';
};
export type ChemblRecord = {
  chembl_id: string; canonical_smiles: string; standard_inchi: string | null;
  standard_inchi_key: string | null; source: string; record_url: string;
};
export type DescriptorResult = {
  molecular_formula_rdkit: string; molecular_weight_rdkit: number;
  logp_rdkit: number; tpsa_rdkit: number; h_bond_donors_rdkit: number;
  h_bond_acceptors_rdkit: number; rotatable_bonds_rdkit: number;
  canonical_smiles_rdkit: string; descriptor_source: string;
};
export type SimilarResult = {
  hits: {chembl_id: string; tanimoto: number; record_url: string}[];
  screened_fingerprints: number; indexed_fingerprints: number;
  fingerprint_method: string; scope_warning: string;
};
export type AgentResult = {
  answer: string; mode: 'TOOLS_ONLY' | 'GEMINI_TOOL_CALLING'; model: string | null;
  tools: {tool: string; args?: Record<string,string>; outcome: string; message?: string}[];
  evidence: {chembl_id: string; url: string; source: string}[]; limitations: string[];
};

// Never reach a developer's localhost from the public Firebase Hosting app.
export function backendAvailableHere(): boolean {
  return ['localhost','127.0.0.1'].includes(window.location.hostname);
}

const ROOT = 'http://127.0.0.1:8000';
async function api<T>(path: string, options: RequestInit={}, timeoutMs=15000): Promise<T> {
  if (!backendAvailableHere()) throw new Error('Local FastAPI backend is available only when running El-Kīmiyā on localhost.');
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(`${ROOT}${path}`, {
      ...options, signal: controller.signal,
      headers: {'Content-Type':'application/json', ...options.headers},
    });
    if (!response.ok) {
      const body: unknown = await response.json().catch(() => null);
      const detail = body && typeof body === 'object' && 'detail' in body ? String(body.detail) : response.statusText;
      throw new Error(`${response.status}: ${detail}`);
    }
    return await response.json() as T;
  } catch(err) {
    if(err instanceof TypeError) throw new Error('FastAPI tidak terhubung. Jalankan backend pada http://127.0.0.1:8000 (terminal terpisah).');
    if(err instanceof DOMException && err.name==='AbortError') throw new Error('Backend melewati batas waktu request.');
    throw err;
  } finally {window.clearTimeout(timer);}
}
export const molecularBackend = {
  health: () => api<BackendHealth>('/api/v1/health'),
  search: (q:string) => api<{hits:ChemblRecord[];dataset:string}>(`/api/v1/molecules/search?q=${encodeURIComponent(q.trim())}&limit=10`),
  describe: (smiles:string) => api<DescriptorResult>('/api/v1/molecules/describe',{method:'POST',body:JSON.stringify({smiles})}),
  similar: (chembl_id:string) => api<SimilarResult>('/api/v1/molecules/similar',{method:'POST',body:JSON.stringify({chembl_id,top_k:8,max_candidates:20000})},30000),
  agent: (question:string,language:'id'|'en',use_llm:boolean) => api<AgentResult>('/api/v1/agent/query',{method:'POST',body:JSON.stringify({question,language,use_llm})},70000),
};
