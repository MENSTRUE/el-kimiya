#!/usr/bin/env node
/** A small PUBLIC, read-only educational subset; never bundles all of ChEMBL. */
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
const base = 'http://127.0.0.1:8000/api/v1';
async function get(path, init) {
  const timeout = AbortSignal.timeout(15000);
  const res = await fetch(`${base}${path}`, {...init, signal:timeout});
  if (!res.ok) throw new Error(`${res.status}: ${path}`);
  return await res.json();
}
try {
  const health = await get('/health');
  if (!health.database_ready || !health.rdkit_ready) throw new Error('ChEMBL + RDKit required');
  const result = await get('/molecules/search?q=CHEMBL1&limit=30');
  if (!Array.isArray(result.hits) || !result.hits.length) throw new Error('No public molecule sample candidates');
  const examples=[];
  for (const hit of result.hits.slice(0,10)) {
    const id=String(hit.chembl_id??'');
    if(!/^CHEMBL\d+$/.test(id)) continue;
    const data=await get(`/molecules/${encodeURIComponent(id)}`);
    const row=data.record;
    if(!row || typeof row.canonical_smiles!=='string') continue;
    const descriptor=await get('/molecules/describe',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({smiles:row.canonical_smiles})});
    examples.push({
      chembl_id:id,
      canonical_smiles:row.canonical_smiles,
      record_url:`https://www.ebi.ac.uk/chembl/compound_report_card/${id}/`,
      descriptors:{
        molecular_formula_rdkit:descriptor.molecular_formula_rdkit,
        molecular_weight_rdkit:descriptor.molecular_weight_rdkit,
        logp_rdkit:descriptor.logp_rdkit,
        tpsa_rdkit:descriptor.tpsa_rdkit,
      }
    });
  }
  if(examples.length<3) throw new Error(`Only ${examples.length} valid samples; at least 3 required`);
  const output=resolve(import.meta.dirname,'..','public','data','molecules','samples.json');
  await mkdir(dirname(output),{recursive:true});
  await writeFile(output,JSON.stringify({
    export_version:1, source:'ChEMBL 37 chemreps + RDKit computed descriptors',
    scope:'PUBLIC EDUCATIONAL SAMPLE ONLY; NOT A LIVE SEARCH OF 2,897,819 RECORDS',
    generated_at:new Date().toISOString(), examples,
  },null,2)+'\n','utf8');
  console.log(`[PASS] ${examples.length} public chemistry samples exported (not full database)`);
} catch(error) { console.error('[FAIL]',error instanceof Error?error.message:String(error));process.exitCode=1; }
