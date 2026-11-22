import { useEffect, useMemo, useState } from 'react';
import { Atom, BookOpen, Database, ExternalLink, FlaskConical, Search, ShieldCheck } from 'lucide-react';
import { useLanguage } from '../lib/language';
import '../public-web-v47.css';

type Item = {
  chembl_id: string;
  canonical_smiles: string;
  record_url: string;
  descriptors: {
    molecular_formula_rdkit?: string;
    molecular_weight_rdkit?: number;
    logp_rdkit?: number;
    tpsa_rdkit?: number;
  };
};

export function PublicMoleculesV47() {
  const {language} = useLanguage();
  const en = language === 'en';
  const tx=(id:string,english:string)=>en?english:id;
  const [items,setItems]=useState<Item[]>([]);
  const [active,setActive]=useState<string>('');
  const [query,setQuery]=useState('');
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState('');
  useEffect(()=>{
    const controller=new AbortController();
    const base=import.meta.env.BASE_URL.endsWith('/')?import.meta.env.BASE_URL:`${import.meta.env.BASE_URL}/`;
    void fetch(`${base}data/molecules/samples.json`,{signal:controller.signal})
      .then(async response=>{if(!response.ok)throw new Error('Public molecular samples missing');return response.json() as Promise<{examples?: Item[]}>})
      .then(data=>{if(controller.signal.aborted)return;const list=Array.isArray(data.examples)?data.examples:[];setItems(list);setActive(list[0]?.chembl_id??'')})
      .catch(e=>{if(!controller.signal.aborted)setError(e instanceof Error?e.message:String(e))})
      .finally(()=>{if(!controller.signal.aborted)setLoading(false)});
    return()=>controller.abort();
  },[]);
  const visible=useMemo(()=>items.filter(x=>`${x.chembl_id} ${x.canonical_smiles}`.toLowerCase().includes(query.toLowerCase())),[items,query]);
  const current=items.find(x=>x.chembl_id===active);
  return <section className="v47-molecules" aria-label="Public molecule samples">
    <div className="v47-mol-intro"><div><span className="v47-tag"><Atom size={15}/>{tx('DEMO MOLEKUL PUBLIK · DATA TERBATAS','PUBLIC MOLECULE LAB · LIMITED DATA')}</span>
      <h2>{tx('Kenali struktur molekul. Tanpa data palsu.','Explore molecular structures. No fabricated data.')}</h2>
      <p>{tx('Contoh struktur ChEMBL dan descriptor RDKit dihitung sebelumnya. Situs publik TIDAK mengakses database lokal 2,89 juta struktur.','These ChEMBL samples have precomputed RDKit descriptors. The public site does NOT access the 2.89-million-record local database.')}</p></div>
      <div className="v47-mol-mark"><Database size={35}/><b>{items.length||'—'}</b><small>{tx('contoh terkurasi','exported samples')}</small></div></div>
    {loading?<p role="status">{tx('Memuat contoh…','Loading examples…')}</p>:
      error?<div className="v47-mol-error" role="alert">{tx('Contoh molekul publik belum diekspor. Jalankan skrip ekspor V4.7 sebelum deploy.','Molecule samples are not published. Run the V4.7 export before deployment.')} ({error})</div>:
      <div className="v47-mol-layout"><aside className="v47-mol-list"><label><Search size={16}/><input value={query} onChange={(e: {target: {value: string}})=>setQuery(e.target.value)} placeholder={tx('Cari ID atau SMILES…','Search ID or SMILES…')}/></label>
      {visible.map(item=><button key={item.chembl_id} onClick={()=>setActive(item.chembl_id)} className={item.chembl_id===active?'is-selected':''}><strong>{item.chembl_id}</strong><span>{item.canonical_smiles}</span></button>)}
      {!visible.length&&<p>{tx('Tidak ditemukan dalam koleksi sampel.','No match in this small sample collection.')}</p>}
      </aside><article className="v47-mol-detail">{current?<><span className="v47-tag"><FlaskConical size={16}/>{tx('PROFIL STRUKTUR','STRUCTURE PROFILE')}</span><h3>{current.chembl_id}</h3><p className="v47-mol-label">SMILES</p><code>{current.canonical_smiles}</code>
      <div className="v47-mol-metrics"><div><span>{tx('Rumus molekul','Molecular formula')}</span><b>{current.descriptors.molecular_formula_rdkit||'—'}</b></div><div><span>{tx('Massa molekul terhitung','Computed molecular weight')}</span><b>{current.descriptors.molecular_weight_rdkit??'—'} g/mol</b></div><div><span>LogP</span><b>{current.descriptors.logp_rdkit??'—'}</b></div><div><span>TPSA</span><b>{current.descriptors.tpsa_rdkit??'—'} Å²</b></div></div>
      <a href={current.record_url} target="_blank" rel="noopener noreferrer"><BookOpen size={17}/>{tx('Lihat sumber ChEMBL','View ChEMBL source')} <ExternalLink size={14}/></a></>:<p>{tx('Pilih contoh untuk mulai.','Choose a sample to begin.')}</p>}</article></div>}
    <p className="v47-mol-footer"><ShieldCheck size={16}/>{tx('Data ini hanya sampel edukasi; bukan pencarian keseluruhan ChEMBL atau hasil eksperimen. Untuk analisis penuh, jalankan backend lokal.','Educational preview only, not global ChEMBL search or experimental results. Use the local backend for full database access.')}</p>
  </section>;
}
