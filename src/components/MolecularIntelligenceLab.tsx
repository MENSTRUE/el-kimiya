import { useEffect, useRef, useState } from 'react';
import { Atom, ArrowRight, BrainCircuit, BookOpen, CheckCircle2, ChevronDown, ExternalLink, FlaskConical, LoaderCircle, Search, ShieldCheck, Sparkles, TriangleAlert, X } from 'lucide-react';
import { compoundImage, compoundLink, findCompound, makeResearchPrompt, type Compound, type ComparisonMode } from '../lib/pubchem';
import { firebaseConfigured, runHybridInference, type InferencePreference, type InferenceResult } from '../lib/hybrid';
import { useLanguage } from '../lib/language';
import { MolecularBackendPanel } from './MolecularBackendPanel';
import { MolecularStudioV60 } from './MolecularStudioV60';
import { backendAvailableHere } from '../lib/molecularBackend';
import '../molecular-lab-v39.css';

type Lang = 'id' | 'en';
const labels = {
  id: {
    eyebrow:'MOLECULAR INTELLIGENCE · DATA NYATA + AI', title:'Kenali molekul. Pahami sifatnya.',
    subtitle:'Cari senyawa di PubChem, bandingkan data terverifikasi, lalu jelajahi penjelasannya dengan Firebase AI. Tidak ada hasil eksperimen yang dikarang.',
    source:'SUMBER ILMIAH', sourceText:'NIH PubChem · PUG REST · Record CID', step1:'01 / TEMUKAN SENYAWA', step2:'02 / ANALISIS DENGAN AI',
    first:'Senyawa A', second:'Senyawa B (opsional)', find:'Cari molekul', searching:'Mengambil data...',
    examples:'Contoh cepat', cards:'Senyawa ditemukan', empty:'Cari satu atau dua senyawa untuk melihat data dan struktur molekul.',
    formula:'Rumus molekul', molecularWeight:'Massa molekul', hydrogenDonors:'Donor ikatan H', hydrogenAcceptors:'Akseptor ikatan H',
    logp:'XLogP (perkiraan)', tpsa:'TPSA', missing:'Data tidak tersedia', formulaEmpty:'Belum diketahui',
    open:'Buka catatan PubChem', remove:'Hapus', mode:'Jenis analisis AI', explain:'Jelaskan konsep', compare:'Bandingkan', quiz:'Buat kuis',
    aiRoute:'Rute inferensi Firebase', ask:'Jalankan AI berdasarkan data', aiWorking:'AI sedang menganalisis...',
    unavailable:'Firebase AI belum siap. Lengkapi konfigurasi dan App Check.', status:'Sumber inferensi terverifikasi',
    caveat:'Angka berasal dari PubChem; penjelasan AI dapat salah dan perlu diperiksa. Struktur 2D adalah ilustrasi, bukan simulasi molekul.',
    noRisk:'Bukan penilaian keamanan, toksisitas, atau kelayakan sintesis.',
    link:'Lihat dokumentasi sumber', errors:'Kesalahan',
    text:'Cocok untuk pembelajaran, bukan untuk menilai keselamatan bahan kimia.',
  },
  en: {
    eyebrow:'MOLECULAR INTELLIGENCE · REAL DATA + AI', title:'Explore molecules. Understand matter.',
    subtitle:'Search PubChem compounds, compare verified descriptors, and explore AI explanations with Firebase AI. No simulated experimental findings.',
    source:'SCIENTIFIC SOURCE', sourceText:'NIH PubChem · PUG REST · CID record', step1:'01 / FIND COMPOUNDS', step2:'02 / ANALYZE WITH AI',
    first:'Compound A', second:'Compound B (optional)', find:'Search molecules', searching:'Fetching data...',
    examples:'Quick examples', cards:'Found compounds', empty:'Search one or two compounds to explore their properties and molecular structure.',
    formula:'Molecular formula', molecularWeight:'Molecular weight', hydrogenDonors:'H-bond donors', hydrogenAcceptors:'H-bond acceptors',
    logp:'XLogP (estimated)', tpsa:'TPSA', missing:'Not available', formulaEmpty:'Unknown',
    open:'View PubChem record', remove:'Remove', mode:'AI analysis task', explain:'Explain concepts', compare:'Compare', quiz:'Create quiz',
    aiRoute:'Firebase inference route', ask:'Run evidence-grounded AI', aiWorking:'AI analyzing...',
    unavailable:'Firebase AI not configured. Set up App Check and Firebase settings.', status:'Verified inference source',
    caveat:'Numerical data comes from PubChem; AI explanations may be wrong and require review. 2D diagrams are illustrations, not molecular simulations.',
    noRisk:'Not a chemical safety, toxicity, or synthesis feasibility assessment.',
    link:'View source documentation', errors:'Error',
    text:'Intended for learning, not chemical safety assessment.',
  }
};
const choices: InferencePreference[] = ['Prefer on-device','On-device only','Prefer cloud','Cloud only'];
const fmt = (v: number | null, digits=2) => v === null ? '—' : v.toLocaleString('en-US',{maximumFractionDigits:digits});
export function MolecularIntelligenceLab() {
  const {language} = useLanguage();
  const words = labels[language as Lang] ?? labels.id;
  const [names,setNames] = useState(['aspirin','caffeine']);
  const [compounds,setCompounds] = useState<Compound[]>([]);
  const [busy,setBusy] = useState(false);
  const [error,setError] = useState('');
  const [mode,setMode] = useState<ComparisonMode>('compare');
  const [preference,setPreference] = useState<InferencePreference>('Prefer cloud');
  const [aiBusy,setAiBusy] = useState(false);
  const [aiError,setAiError] = useState('');
  const [answer,setAnswer] = useState<InferenceResult|null>(null);
  const request = useRef<AbortController|null>(null);
  useEffect(() => () => request.current?.abort(), []);
  const load = async (requested?: string[]) => {
    const input = requested ?? names;
    const nonempty = input.map(x=>x.trim()).filter(Boolean);
    if(!nonempty.length) {setError(language==='id'?'Masukkan nama senyawa dahulu.':'Enter a compound name.');return;}
    request.current?.abort();const controller=new AbortController();request.current=controller;
    const timeout=window.setTimeout(()=>controller.abort(),15_000);
    setBusy(true);setError('');setCompounds([]);setAnswer(null);setAiError('');
    try {
      // Max two PubChem requests per explicit user click; no automated polling.
      const results = await Promise.all(nonempty.slice(0,2).map(x=>findCompound(x,controller.signal)));
      if(!controller.signal.aborted) setCompounds(results);
    } catch(e) {if(!controller.signal.aborted)setError(e instanceof Error?e.message:String(e));}
    finally {window.clearTimeout(timeout);if(request.current===controller)request.current=null;setBusy(false)}
  };
  const launchAI = async () => {
    if(!compounds.length||aiBusy)return;
    setAiBusy(true);setAiError('');setAnswer(null);
    try {const result=await runHybridInference(makeResearchPrompt(compounds,mode,language),preference);setAnswer(result);}
    catch(e){setAiError(e instanceof Error?e.message:String(e));}
    finally {setAiBusy(false);}
  };
  const selectExample=(x:string,y:string)=>{setNames([x,y]);void load([x,y]);};
  return <main className="page standard-page mi39-root">
    <section className="mi39-hero">
      <div><span className="mi39-overline"><Atom size={15}/>{words.eyebrow}</span><h2>{words.title}</h2><p>{words.subtitle}</p>
        <div className="mi39-trust"><span><ShieldCheck size={15}/> {words.sourceText}</span><span><BrainCircuit size={15}/> Firebase AI Logic</span><span><CheckCircle2 size={15}/> {language.toUpperCase()}</span></div>
      </div><div className="mi39-hero-art" aria-hidden="true"><span className="mi39-orbit mi39-one"/><span className="mi39-orbit mi39-two"/><span className="mi39-orbit mi39-three"/><Atom size={64}/></div>
    </section>
    <MolecularStudioV60/>{backendAvailableHere() && <MolecularBackendPanel/>}
    <section className="mi39-card">
      <div className="mi39-section-line"><span>{words.step1}</span><div className="mi39-source">{words.source}</div></div>
      <form onSubmit={e=>{e.preventDefault();void load()}} className="mi39-search">
        {names.map((value,i)=><label key={i}>{i===0?words.first:words.second}<input value={value} onChange={e=>setNames(prev=>prev.map((old,index)=>index===i?e.target.value:old))} placeholder={i===0?'aspirin':'caffeine'} maxLength={70} autoComplete="off"/></label>)}
        <button className="mi39-button primary" type="submit" disabled={busy}>{busy?<LoaderCircle size={17} className="mi39-spin"/>:<Search size={17}/>} {busy?words.searching:words.find}</button>
      </form>
      <div className="mi39-example"><span>{words.examples}</span><button onClick={()=>selectExample('aspirin','caffeine')} disabled={busy}>Aspirin × Caffeine</button><button onClick={()=>selectExample('water','ethanol')} disabled={busy}>Water × Ethanol</button><button onClick={()=>selectExample('sodium chloride','')} disabled={busy}>NaCl</button></div>
      {error&&<p className="mi39-alert" role="alert"><TriangleAlert size={16}/> {error}</p>}
    </section>
    {compounds.length ? <section className="mi39-results" aria-label={words.cards}>
      <div className="mi39-section-line"><span>{words.cards} · {compounds.length}</span><span>PubChem PUG REST</span></div>
      <div className="mi39-compounds">{compounds.map(c=><article className="mi39-molecule" key={c.cid}>
        <div className="mi39-molecule-head"><div><small>COMPOUND CID {c.cid}</small><h3>{c.title}</h3><p>{c.iupacName||words.formulaEmpty}</p></div><a href={compoundLink(c.cid)} target="_blank" rel="noopener noreferrer" aria-label={`${words.open}: ${c.title}`}><ExternalLink size={17}/></a></div>
        <div className="mi39-molecule-image"><img loading="lazy" src={compoundImage(c.cid)} alt={`PubChem 2D structure illustration for ${c.title}, CID ${c.cid}`}/></div>
        <div className="mi39-properties"><div><span>{words.formula}</span><strong>{c.formula||'—'}</strong></div><div><span>{words.molecularWeight}</span><strong>{fmt(c.molecularWeight)} g/mol</strong></div><div><span>{words.logp}</span><strong>{fmt(c.xlogp)}</strong></div><div><span>{words.tpsa}</span><strong>{fmt(c.tpsa)} Å²</strong></div><div><span>{words.hydrogenDonors}</span><strong>{fmt(c.hBondDonorCount,0)}</strong></div><div><span>{words.hydrogenAcceptors}</span><strong>{fmt(c.hBondAcceptorCount,0)}</strong></div></div>
        <a className="mi39-record-link" target="_blank" rel="noopener noreferrer" href={compoundLink(c.cid)}>{words.open}<ArrowRight size={15}/></a>
      </article>)}</div>
    </section> : <div className="mi39-empty"><FlaskConical size={32}/><p>{words.empty}</p></div>}
    <section className="mi39-card mi39-ai">
      <div className="mi39-section-line"><span>{words.step2}</span><span><Sparkles size={15}/> Firebase</span></div>
      <div className="mi39-ai-options"><div><label>{words.mode}</label><div className="mi39-pills"><button className={mode==='explain'?'selected':''} onClick={()=>setMode('explain')}>{words.explain}</button><button className={mode==='compare'?'selected':''} onClick={()=>setMode('compare')}>{words.compare}</button><button className={mode==='quiz'?'selected':''} onClick={()=>setMode('quiz')}>{words.quiz}</button></div></div>
        <label className="mi39-pref">{words.aiRoute}<span><select value={preference} onChange={e=>setPreference(e.target.value as InferencePreference)}>{choices.map(x=><option value={x} key={x}>{x}</option>)}</select><ChevronDown size={16}/></span></label>
      </div>
      <button className="mi39-button primary mi39-ai-run" onClick={()=>void launchAI()} disabled={!compounds.length||aiBusy||!firebaseConfigured}>{aiBusy?<LoaderCircle size={17} className="mi39-spin"/>:<BrainCircuit size={17}/>} {aiBusy?words.aiWorking:words.ask}<ArrowRight size={17}/></button>
      {!firebaseConfigured&&<p className="mi39-alert"><TriangleAlert size={16}/>{words.unavailable}</p>}
      {aiError&&<p className="mi39-alert" role="alert"><TriangleAlert size={16}/>{aiError}</p>}
      {answer&&<article className="mi39-answer"><div><CheckCircle2 size={18}/><strong>{words.status}: {answer.provider}</strong><small>{answer.model}</small></div><pre>{answer.text}</pre><p>{words.caveat}</p></article>}
    </section>
    <footer className="mi39-footer"><ShieldCheck size={19}/><div><strong>{words.noRisk}</strong><p>{words.caveat}</p><a href="https://pubchem.ncbi.nlm.nih.gov/docs/pug-rest" target="_blank" rel="noopener noreferrer"><BookOpen size={15}/> {words.link}</a></div></footer>
  </main>;
}
