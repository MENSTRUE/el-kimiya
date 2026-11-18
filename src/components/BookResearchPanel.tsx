import { useEffect, useMemo, useRef, useState } from 'react';
import { BookOpen, ExternalLink, FileSearch, FileText, ShieldCheck, Upload, X, BrainCircuit } from 'lucide-react';
import { sourceBooks } from '../data/books';
import { contextForPrompt, parsePrivateIndex, searchIndex, type PrivateIndex } from '../lib/bookSearch';

type Props={askAbout:(text:string)=>void; notify:(text:string)=>void};
export function BookResearchPanel({askAbout,notify}:Props){
  const [filter,setFilter]=useState('All');
  const [selected,setSelected]=useState<string>('kuncoro-2021');
  const [pdfs,setPdfs]=useState<Record<string,string>>({});
  const [index,setIndex]=useState<PrivateIndex|null>(null);
  const [question,setQuestion]=useState('What is the difference between ionic and covalent bonding?');
  const [consent,setConsent]=useState(false);
  const [message,setMessage]=useState('');
  const [viewer,setViewer]=useState<string|null>(null);
  // Never persist or upload PDF bytes. Revoke object URLs when component unmounts.
  const localUrls=useRef<string[]>([]);
  useEffect(()=>()=>{localUrls.current.forEach(url=>URL.revokeObjectURL(url))},[]);
  const visible=useMemo(()=>sourceBooks.filter(b=>filter==='All'||b.role===filter),[filter]);
  const hits=useMemo(()=>index?searchIndex(index,question,5):[],[index,question]);
  const uploadPdf=(file?:File)=>{
    if(!file)return;
    if(file.type!=='application/pdf'&&!file.name.toLowerCase().endsWith('.pdf')){setMessage('Only PDF documents can be opened here.');return;}
    if(file.size>80_000_000){setMessage('Maximum file size is 80 MB.');return;}
    const url=URL.createObjectURL(file);localUrls.current.push(url);
    setPdfs(prev=>({...prev,[selected]:url}));setMessage(`Opened ${file.name} locally — this app has not published or indexed its text.`);
    setViewer(url);
  };
  const uploadIndex=async(file?:File)=>{
    if(!file)return;
    if(file.size>15_000_000){setMessage('Index file too large (15 MB maximum).');return;}
    try{const data=parsePrivateIndex(JSON.parse(await file.text()));setIndex(data);setMessage(`Loaded a private text index of ${data.pages.length} PDF pages in memory. No cloud upload occurred.`);}
    catch(err){setMessage(err instanceof Error?err.message:'Could not load the index.');}
  };
  const askWithSources=()=>{
    if(!consent){setMessage('Please confirm before sending excerpts to Firebase AI.');return;}
    if(!hits.length){setMessage('No matching indexed passage. Choose another question.');return;}
    askAbout(contextForPrompt(question,hits));
    notify('Source context prepared; select a live Firebase inference path in Tutor.');
  };
  return <section className="source-research" aria-label="Chemistry sources and local PDF study">
    <header className="source-research-head"><div><p className="eyebrow">SOURCE LIBRARY · 8 VERIFIED FILES</p><h2>Study from real chemistry books.</h2><p>These are bibliographic entries from your PDFs—not copyrighted book files published online. You can open your own PDF locally or import a private searchable index.</p></div><span className="source-research-seal"><ShieldCheck size={18}/> Private by default</span></header>
    <div className="source-filter" role="group" aria-label="Filter source type">{['All','Main chemistry course','Islamic integration','Chemistry applications','Supporting reference'].map(x=><button key={x} className={filter===x?'active':''} onClick={()=>setFilter(x)}>{x}</button>)}</div>
    <div className="source-grid">{visible.map(b=><button key={b.id} className={`source-book ${selected===b.id?'selected':''}`} aria-pressed={selected===b.id} onClick={()=>setSelected(b.id)}><div><span className="source-book-code">{b.id.split('-')[0].toUpperCase()}</span><span className="source-book-pages">{b.pdfPages} PDF pages</span></div><h3>{b.title}</h3><p>{b.author}</p><small>{b.role}</small></button>)}</div>
    <div className="source-workspace">
      <div className="source-book-details"><p className="eyebrow">SELECTED REFERENCE</p><h3>{sourceBooks.find(x=>x.id===selected)?.title}</h3><p>{sourceBooks.find(x=>x.id===selected)?.sourceNote}</p><div className="source-topic-list">{sourceBooks.find(x=>x.id===selected)?.topics.map(t=><span key={t}>{t}</span>)}</div><p className="source-rights">{sourceBooks.find(x=>x.id===selected)?.rights==='restricted'?'Copyright restrictions apply. Do not commit the source PDF or extracted pages to GitHub.':'Noncommercial reproduction permitted per publisher’s statement; verify terms before deployment.'}</p><div className="source-actions"><label className="source-action primary"><Upload size={17}/> Open your PDF <input type="file" accept="application/pdf,.pdf" onChange={e=>{uploadPdf(e.target.files?.[0]);e.target.value='';}}/></label>{pdfs[selected]&&<button className="source-action" onClick={()=>setViewer(pdfs[selected])}><ExternalLink size={16}/> View PDF again</button>}</div></div>
      <div className="source-index"><div><FileSearch size={22}/><h3>Private text search</h3></div><p>Create an index locally with <code>python scripts/build_private_index.py</code>, then import it here. It never needs to enter the public repo.</p><label className="source-action"><FileText size={17}/> Import private JSON index <input type="file" accept="application/json,.json" onChange={e=>{void uploadIndex(e.target.files?.[0]);e.target.value='';}}/></label><label className="source-question">Ask about the indexed chapters<textarea value={question} onChange={e=>setQuestion(e.target.value)} maxLength={500} rows={2}/></label><p className="source-index-status">{index?`${index.pages.length} pages indexed · ${hits.length} relevant passages`:'No private index loaded · metadata only'}</p></div>
    </div>
    {message&&<p className="source-message" role="status">{message}</p>}
    {index&&<div className="source-hits"><h3>Matching pages</h3>{hits.length?hits.map((hit,i)=><article key={`${hit.bookId}-${hit.pdfPage}-${i}`}><strong>{hit.title} · PDF p. {hit.pdfPage}</strong><p>{hit.text.slice(0,340)}{hit.text.length>340?'…':''}</p><small>Local retrieval · not independently fact-checked</small></article>):<p>Nothing found in this index. Try another query.</p>}<label className="source-consent"><input type="checkbox" checked={consent} onChange={e=>setConsent(e.target.checked)}/> I understand the selected excerpts may be transmitted to cloud inference depending on the live model provider.</label><button className="source-action primary" disabled={!hits.length||!consent} onClick={askWithSources}><BrainCircuit size={17}/> Prepare grounded AI question</button><p className="source-note">Do not treat AI-generated citations as verified until you compare them against the original PDF page.</p></div>}
    {viewer&&<div className="source-viewer-backdrop" role="presentation" onClick={()=>setViewer(null)}><section className="source-viewer" role="dialog" aria-modal="true" aria-label="Preview local PDF" onClick={e=>e.stopPropagation()}><div><span><BookOpen size={17}/> Your local PDF · not uploaded</span><button onClick={()=>setViewer(null)} aria-label="Close local PDF"><X size={20}/></button></div><iframe title="Local PDF book preview" src={viewer}/></section></div>}
  </section>;
}
