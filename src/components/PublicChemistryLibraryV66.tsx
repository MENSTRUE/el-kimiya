/**
 * V6.6 public reading shelf. Content is original in src/data/course-v45.ts.
 * HF model is an OPTIONAL browser-only enhancement; nothing private is sent.
 */
import { useMemo, useRef, useState } from 'react';
import { ArrowRight, BookOpen, BookText, Check, ChevronLeft, ChevronRight, ExternalLink, GraduationCap, LoaderCircle, Search, ShieldCheck, Sparkles, Type, WifiOff } from 'lucide-react';
import { COURSE, localize } from '../data/course-v45';
import { useLanguage } from '../lib/language';
import { keywordRank, semanticRank, type SearchMatch } from '../lib/publicSearchV66';
import '../public-library-v66.css';

type Embedder = (text:string) => Promise<Float32Array>;
type AIStatus = 'off'|'loading'|'ready'|'unavailable';
const HF_MODEL = 'Xenova/paraphrase-multilingual-MiniLM-L12-v2';
// Official Transformers.js browser ESM distribution; loaded only on button click.
const HF_BROWSER_ESM = 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@4.3.2';
const CACHE_KEY = 'elk.v66.public.lastLesson';
function restoreId():string {
  try { return window.localStorage.getItem(CACHE_KEY) || COURSE[0]?.id || ''; } catch {return COURSE[0]?.id || '';}
}
const corpus = COURSE.map(unit => ({
  id:unit.id,
  text:[unit.title.id,unit.title.en,unit.objective.id,unit.objective.en,
    ...unit.sections.flatMap(section=>[section.title.id,section.title.en,section.body.id,section.body.en])].join(' '),
}));
export function PublicChemistryLibraryV66({onPractice,onAskTutor}:{onPractice:()=>void;onAskTutor:(prompt:string)=>void}) {
  const {language} = useLanguage();
  const en = language==='en';
  const tx=(id:string,english:string)=>en?english:id;
  const [selectedId,setSelectedId]=useState(restoreId);
  const [query,setQuery]=useState('');
  const [fontSize,setFontSize]=useState(18);
  const [fontMode,setFontMode]=useState<'serif'|'sans'>('serif');
  const [showCheck,setShowCheck]=useState(false);
  const [answers,setAnswers]=useState<Record<number,number>>({});
  const [aiStatus,setAiStatus]=useState<AIStatus>('off');
  const [aiError,setAiError]=useState('');
  const [ranked,setRanked]=useState<SearchMatch[]|null>(null);
  const embedder=useRef<Embedder|null>(null);
  const modelVectors=useRef<{id:string;vector:Float32Array}[]>([]);
  const readerRef=useRef<HTMLElement>(null);
  const lang: 'id'|'en' = en?'en':'id';
  const chosen=COURSE.find(x=>x.id===selectedId)||COURSE[0];
  const keywordResults=useMemo(()=>keywordRank(query,corpus),[query]);
  const foundIds=(ranked&&query.trim()?ranked:keywordResults).map(x=>x.id);
  const visible=COURSE.filter(x=>!query.trim()||foundIds.includes(x.id))
    .sort((a,b)=>query.trim()?foundIds.indexOf(a.id)-foundIds.indexOf(b.id):COURSE.indexOf(a)-COURSE.indexOf(b));
  const choose=(id:string)=>{
    setSelectedId(id);setShowCheck(false);setAnswers({});
    try{window.localStorage.setItem(CACHE_KEY,id)}catch{/* optional */}
    readerRef.current?.scrollIntoView({behavior:'smooth',block:'start'});
  };
  const currentIndex=COURSE.findIndex(x=>x.id===chosen.id);
  const score=chosen.checks.reduce((sum,check,i)=>sum+(answers[i]===check.correct?1:0),0);
  const allAnswered=chosen.checks.every((_,i)=>answers[i]!==undefined);
  const activateSemantic=async()=>{
    if(!query.trim()) {setAiError(tx('Tulis topik dahulu.', 'Type a topic first.'));return;}
    setAiStatus('loading');setAiError('');setRanked(null);
    try {
      if(!embedder.current) {
        // Dynamic import bypasses Vite bundling; no provider token, private PDF or user data sent.
        const remote: string=HF_BROWSER_ESM;
        const lib = await import(/* @vite-ignore */ remote);
        if(typeof lib.pipeline!=='function')throw new Error('Transformers.js pipeline unavailable');
        const pipe = await lib.pipeline('feature-extraction',HF_MODEL);
        embedder.current=async(text:string)=>{
          const tensor=await pipe(text,{pooling:'mean',normalize:true});
          if(!tensor?.data?.length)throw new Error('Embedding model returned empty vector');
          return Float32Array.from(tensor.data as ArrayLike<number>);
        };
      }
      if(!modelVectors.current.length){
        // Public, original course material only; each vector stays in memory.
        for(const item of corpus){modelVectors.current.push({id:item.id,vector:await embedder.current(item.text.slice(0,1350))});}
      }
      const vector=await embedder.current(query.slice(0,280));
      setRanked(semanticRank(vector,modelVectors.current));
      setAiStatus('ready');
    }catch(e){
      setAiStatus('unavailable');
      setRanked(null);
      setAiError(`${tx('Pencarian semantik tidak tersedia; pencarian kata tetap aktif.', 'Semantic search unavailable; keyword search remains active.')} ${e instanceof Error?e.message:String(e)}`);
    }
  };
  const changeQuery=(value:string)=>{setQuery(value);setRanked(null);setAiError(''); if(aiStatus==='ready')setAiStatus('off')};
  return <section className="public66" id="public-chemistry-library" aria-label={tx('Materi kimia publik','Public chemistry reading shelf')}>
    <header className="public66-hero">
      <div className="public66-hero-copy"><span className="public66-eyebrow"><BookText size={15}/>{tx('PERPUSTAKAAN BELAJAR TERBUKA','OPEN LEARNING SHELF')}</span>
        <h2>{tx('Baca ilmu kimia sekarang.','Start reading chemistry now.')} <em>{tx('Tanpa unggah PDF.','No PDF required.')}</em></h2>
        <p>{tx('13 materi singkat bilingual yang ditulis untuk El-Kīmiyā; tersedia langsung untuk semua pengunjung. PDF pribadi tetap disimpan terpisah.',
          '13 original bilingual lessons made for El-Kīmiyā, readable by all visitors. Your private PDFs remain separate.')}</p>
        <div className="public66-hero-actions"><button type="button" onClick={()=>readerRef.current?.scrollIntoView({behavior:'smooth',block:'start'})}><BookOpen size={16}/>{tx('Mulai membaca','Start reading')} <ArrowRight size={16}/></button><button type="button" className="public66-ghost" onClick={onPractice}><GraduationCap size={16}/>{tx('Latihan soal','Practice questions')}</button></div>
      </div><div className="public66-hero-stamp"><strong>{COURSE.length}</strong><span>{tx('Materi asli','Original lessons')}</span><small>ID / EN</small></div>
    </header>
    <div className="public66-body">
      <aside className="public66-shelf" aria-label={tx('Daftar materi','Lesson list')}>
        <label className="public66-search"><Search size={18}/><input value={query} onChange={e=>changeQuery(e.target.value)} placeholder={tx('Cari: atom, asam, minyak…','Search: atoms, acids, oil…')} aria-label={tx('Cari materi','Search lessons')}/></label>
        <button type="button" className="public66-semantic" disabled={!query.trim()||aiStatus==='loading'} onClick={()=>void activateSemantic()}>
          {aiStatus==='loading'?<LoaderCircle size={15} className="public66-spin"/>:<Sparkles size={15}/>}
          {aiStatus==='loading'?tx('Memuat model Hugging Face…','Loading Hugging Face model…'):tx('Cari semantik · Hugging Face','Semantic search · Hugging Face')}
        </button>
        <p className="public66-search-mode" aria-live="polite">{aiStatus==='ready'&&ranked?tx('Hasil urutan model di browser · bukan jawaban AI','Browser model ranking · not a generated AI answer'):tx('Pencarian kata langsung tersedia','Instant keyword search available')}</p>
        {aiError&&<p className="public66-warning" role="status">{aiError}</p>}
        <div className="public66-shelf-list">{visible.length?visible.map((unit,i)=><button type="button" key={unit.id} className={unit.id===chosen.id?'selected':''} onClick={()=>choose(unit.id)}><span>{String(COURSE.indexOf(unit)+1).padStart(2,'0')}</span><strong>{localize(unit.title,lang)}</strong><ArrowRight size={15}/></button>):<p className="public66-no-match">{tx('Tidak ada materi cocok. Coba kata lain.','No matching lesson. Try a different term.')}</p>}</div>
        <p className="public66-shelf-note"><ShieldCheck size={15}/>{tx('Bahan bacaan ini bukan delapan PDF pribadi di katalog.', 'These lessons are not the eight private catalogue PDFs.')}</p>
      </aside>
      <article className="public66-reader" ref={readerRef} aria-label={tx('Pembaca kimia','Chemistry reader')}>
        <div className="public66-reader-top"><span><BookOpen size={16}/>{tx('BACAAN KIMIA · EL-KĪMIYĀ','CHEMISTRY READING · EL-KĪMIYĀ')}</span><div className="public66-font-controls"><button type="button" onClick={()=>setFontSize(x=>Math.max(15,x-2))} aria-label={tx('Perkecil huruf','Smaller text')}>A−</button><span>{fontSize}px</span><button type="button" onClick={()=>setFontSize(x=>Math.min(28,x+2))} aria-label={tx('Perbesar huruf','Larger text')}>A+</button><button type="button" onClick={()=>setFontMode(x=>x==='serif'?'sans':'serif')} title={tx('Ganti jenis huruf','Switch font')}><Type size={17}/>{fontMode==='serif'?'Serif':'Sans'}</button></div></div>
        <div className="public66-paper" style={{fontSize:`${fontSize}px`,fontFamily:fontMode==='serif'?"Georgia, 'Times New Roman', serif":"system-ui, sans-serif"}}>
          <span className="public66-chapter">{tx('BAB','CHAPTER')} {String(currentIndex+1).padStart(2,'0')} / {COURSE.length}</span>
          <h3>{localize(chosen.title,lang)}</h3><p className="public66-goal"><strong>{tx('Tujuan belajar','Learning objective')}:</strong> {localize(chosen.objective,lang)}</p>
          {chosen.sections.map((section,i)=><section key={`${chosen.id}-${i}`} className="public66-paragraph"><h4>{localize(section.title,lang)}</h4><p>{localize(section.body,lang)}</p></section>)}
          <div className="public66-source"><ShieldCheck size={17}/><div><strong>{tx('Keterangan sumber','Source information')}</strong><p>{tx('Materi ringkas asli proyek (draft edukatif), bukan salinan lengkap buku, bukan review ahli. Referensi untuk pemeriksaan dan pendalaman:',
            'Original concise project notes (educational draft), not a full textbook reproduction or expert review. Reference for verification and further reading:')}</p><a href={chosen.reference} target="_blank" rel="noopener noreferrer">OpenStax Chemistry 2e <ExternalLink size={14}/></a></div></div>
        </div>
        <div className="public66-tutor-panel"><div><Sparkles size={19}/><span>{tx('Masih bingung? Diskusikan bacaan dengan Firebase AI Tutor, lalu periksa sumber aslinya.', 'Need help? Discuss this text with Firebase AI Tutor, then verify the original source.')}</span></div><button type="button" onClick={()=>onAskTutor(`${en?'Answer in English':'Jawab dalam Bahasa Indonesia'}. Explain the following ORIGINAL EDUCATIONAL COURSE EXCERPT, and state uncertainty if the excerpt does not support a claim. Topic: ${localize(chosen.title,lang)}. Objective: ${localize(chosen.objective,lang)}. Passages: ${chosen.sections.map(s=>localize(s.body,lang)).join(' ')}. Reference for human verification: ${chosen.reference}. Do not invent quotes or claim this is full textbook content.`)}>{tx('Diskusikan materi','Discuss lesson')} <ArrowRight size={16}/></button></div>
        <div className="public66-review"><button type="button" className="public66-review-toggle" onClick={()=>setShowCheck(x=>!x)} aria-expanded={showCheck}><GraduationCap size={17}/>{tx('Uji pemahaman singkat','Quick self-check')}<ArrowRight size={16}/></button>
          {showCheck&&<div className="public66-checks">{chosen.checks.map((check,i)=><div key={i} className="public66-check"><strong>{i+1}. {localize(check.question,lang)}</strong><div>{check.choices.map((choice,k)=><button key={k} type="button" className={answers[i]===k?'chosen':''} onClick={()=>setAnswers(p=>({...p,[i]:k}))}><span>{'ABC'[k]}</span>{localize(choice,lang)}</button>)}</div>{answers[i]!==undefined&&<p className={answers[i]===check.correct?'correct':'wrong'}>{answers[i]===check.correct?<Check size={14}/>:null}{localize(check.why,lang)}</p>}</div>)}<p role="status">{allAnswered?tx(`${score} dari ${chosen.checks.length} benar`,`${score} of ${chosen.checks.length} correct`):tx('Pilih jawaban untuk melihat penjelasannya.','Choose answers to reveal explanations.')}</p><button type="button" onClick={onPractice}>{tx('Lanjutkan ke Laboratorium Latihan','Continue to Practice Laboratory')} <ArrowRight size={15}/></button></div>}
        </div>
        <footer className="public66-reader-foot"><button type="button" disabled={currentIndex<=0} onClick={()=>choose(COURSE[currentIndex-1].id)}><ChevronLeft size={17}/>{tx('Sebelumnya','Previous')}</button><span>{currentIndex+1}/{COURSE.length}</span><button type="button" disabled={currentIndex>=COURSE.length-1} onClick={()=>choose(COURSE[currentIndex+1].id)}>{tx('Berikutnya','Next')}<ChevronRight size={17}/></button></footer>
      </article>
    </div>
    <div className="public66-footer-note"><WifiOff size={17}/>{tx('Materi tetap bisa dibaca saat model AI tidak tersedia. Hugging Face hanya dipakai jika tombol pencarian semantik ditekan.',
      'Lessons remain readable if the AI model is unavailable. Hugging Face is used only after activating semantic search.')}</div>
  </section>;
}
