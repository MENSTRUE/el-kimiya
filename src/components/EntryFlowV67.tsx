import { useState } from 'react';
import { ArrowLeft, ArrowRight, Atom, BookOpen, BrainCircuit, FlaskConical, GraduationCap, LockKeyhole, ShieldCheck, Sparkles } from 'lucide-react';
import { useLanguage } from '../lib/language';
import '../research-journey-v67.css';

type Goal = 'learn' | 'research' | 'practice' | 'explore';
type Destination = 'dashboard' | 'library' | 'practice' | 'mission' | 'molecules';
const choices: {id:Goal; titleId:string; titleEn:string; descId:string; descEn:string; target:Destination}[] = [
  {id:'learn',titleId:'Pahami kimia dari dasar',titleEn:'Build chemistry foundations',descId:'Baca materi bilingual dengan font nyaman dan latihan pemahaman.',descEn:'Read bilingual lessons and check your understanding.',target:'library'},
  {id:'research',titleId:'Jadi peneliti muda',titleEn:'Think like a young researcher',descId:'Mulai misi: hipotesis, pengamatan sintetis, AI, dan laporan.',descEn:'Begin a mission: hypothesis, synthetic observations, AI, and report.',target:'mission'},
  {id:'practice',titleId:'Latihan soal kimia',titleEn:'Practice chemistry questions',descId:'Kerjakan pilihan ganda dengan pembahasan dan progres lokal.',descEn:'Solve multiple-choice questions with explanations and local progress.',target:'practice'},
  {id:'explore',titleId:'Jelajahi molekul',titleEn:'Explore molecular structures',descId:'Lihat struktur 2D/3D, perhitungan RDKit, dan lab virtual.',descEn:'View 2D/3D structures, RDKit descriptors, and virtual laboratory.',target:'molecules'},
];
export function EntryFlowV67({intent,onBack,onEnter}:{intent:'learn'|'guest';onBack:()=>void;onEnter:(target:Destination)=>void}) {
  const {language}=useLanguage();const en=language==='en';
  const tx=(id:string,english:string)=>en?english:id;
  const [goal,setGoal]=useState<Goal>('research');
  const selected=choices.find(x=>x.id===goal)||choices[0];
  return <main className="entry67">
    <header className="entry67-nav"><button type="button" onClick={onBack}><ArrowLeft size={17}/>{tx('Kembali ke beranda','Back to homepage')}</button><span>El-Kīmiyā <strong>/ {intent==='guest'?tx('Mode Tamu','Guest Mode'):tx('Mulai Belajar','Start Learning')}</strong></span></header>
    <section className="entry67-top"><div className="entry67-kicker"><Sparkles size={17}/> {tx('SELAMAT DATANG DI EL-KĪMIYĀ','WELCOME TO EL-KĪMIYĀ')}</div>
      <h1>{intent==='guest'?tx('Jelajahi tanpa akun.','Explore without an account.'):tx('Mau mulai dari mana?','Where would you like to begin?')}</h1>
      <p>{intent==='guest'?tx('Belum ada login atau sinkronisasi akun. Ini adalah mode tamu yang transparan; kemajuan disimpan pada browser yang kamu gunakan.','There is no real account login or cloud sync yet. This is a transparent guest mode; progress is saved in this browser.'):tx('Pilih satu tujuan. Kamu dapat berpindah ke fitur lain kapan saja melalui sidebar aplikasi.','Choose a goal. You can switch to other tools anytime using the app sidebar.')}</p></section>
    <div className="entry67-privacy"><ShieldCheck size={21}/><span>{tx('Tidak memerlukan email. Tidak ada akun palsu. Buku PDF pribadi tidak diunggah otomatis.','No email required. No fake account. Your private PDFs are never auto-uploaded.')}</span></div>
    {intent==='guest'?<div className="entry67-guest"><div className="entry67-guest-icon"><LockKeyhole size={33}/></div><div><h2>{tx('Lanjut sebagai tamu','Continue as a guest')}</h2><p>{tx('Lihat dasbor dengan progres nyata. Jika belum ada aktivitas, nilainya mulai dari nol.','Open the dashboard with real learning progress. If you have no activity yet, all counters start at zero.')}</p></div><button type="button" onClick={()=>onEnter('dashboard')}>{tx('Buka ruang belajar tamu','Open guest workspace')}<ArrowRight size={18}/></button></div>:
      <><div className="entry67-choices" role="group" aria-label={tx('Pilih tujuan belajar','Select a learning goal')}>{choices.map((x,i)=>{const Icon=[BookOpen,GraduationCap,BrainCircuit,Atom][i];return <button key={x.id} type="button" aria-pressed={goal===x.id} className={goal===x.id?'chosen':''} onClick={()=>setGoal(x.id)}><span className="entry67-choice-icon"><Icon size={25}/></span><strong>{en?x.titleEn:x.titleId}</strong><small>{en?x.descEn:x.descId}</small><span className="entry67-check">{goal===x.id?'●':'○'}</span></button>})}</div><div className="entry67-bottom"><span>{tx('Pilihanmu:', 'Your choice:')} <strong>{en?selected.titleEn:selected.titleId}</strong></span><button type="button" onClick={()=>onEnter(selected.target)}>{tx('Lanjutkan ke fitur','Continue to workspace')}<ArrowRight size={18}/></button></div></>}
    <p className="entry67-foot"><ShieldCheck size={15}/>{tx('El-Kīmiyā adalah prototipe edukasi. Semua simulasi ilmiah menggunakan label dan batasan yang transparan.','El-Kīmiyā is an educational prototype. Scientific simulations disclose their assumptions and limitations.')}</p>
  </main>;
}
export function MissionLandingTeaserV67({onStart}:{onStart:()=>void}) {
  const {language}=useLanguage();const en=language==='en';
  const tx=(id:string,english:string)=>en?english:id;
  return <section className="mission67-landing-teaser" id="research-mission-intro"><div className="mission67-landing-copy"><span><FlaskConical size={16}/>{tx('SATU PENGALAMAN, DARI BELAJAR KE MENELITI','ONE JOURNEY, FROM LEARNING TO INVESTIGATION')}</span><h2>{tx('Bukan hanya membaca kimia.','More than reading chemistry.')}<em>{tx('Cobalah berpikir seperti ilmuwan.','Learn to think like a scientist.')}</em></h2><p>{tx('Mulai dari pertanyaan, susun hipotesis, jalankan eksperimen virtual sintetis, bandingkan hasil, dan tulis laporan. AI membantu bila tersedia; belajar tetap jalan tanpanya.','Ask a question, form a hypothesis, run a synthetic virtual experiment, compare observations, and write a report. AI helps when available; learning works without it.')}</p><button type="button" onClick={onStart}>{tx('Mulai Research Mission','Start Research Mission')}<ArrowRight size={17}/></button></div><div className="mission67-landing-steps" aria-label={tx('Alur riset','Research flow')}><span>01 <b>{tx('Pertanyaan','Question')}</b></span><span>02 <b>{tx('Hipotesis','Hypothesis')}</b></span><span>03 <b>{tx('Simulasi','Simulation')}</b></span><span>04 <b>{tx('Analisis AI','AI analysis')}</b></span><span>05 <b>{tx('Laporan','Report')}</b></span></div></section>;
}
export function FeatureOverviewV67({onStart}:{onStart:()=>void}) {
  const {language}=useLanguage();const en=language==='en';
  const tx=(id:string,english:string)=>en?english:id;
  return <section className="feature67" id="tools" aria-label={tx('Fitur pembelajaran El-Kīmiyā','El-Kīmiyā learning features')}>
    <div className="feature67-head"><div><span>{tx('SATU RUANG KIMIA YANG TERINTEGRASI','ONE CONNECTED CHEMISTRY WORKSPACE')}</span><h2>{tx('Pilih caramu menemukan jawaban.','Discover chemistry your way.')}</h2><p>{tx('Bukan tombol yang semuanya menuju Dashboard: pilih bacaan, latihan, molekul, atau misi penelitian sesuai tujuanmu.','Not a collection of buttons that all lead to Dashboard: choose reading, practice, molecules, or a research mission that fits your goal.')}</p></div><button onClick={onStart} type="button">{tx('Pilih tujuan belajar','Choose a learning goal')}<ArrowRight size={17}/></button></div>
    <div className="feature67-grid">
      <article><BookOpen size={24}/><h3>{tx('Perpustakaan Kimia','Chemistry Library')}</h3><p>{tx('13 materi asli bilingual yang langsung bisa dibaca, PDF pribadi tetap privat.','13 original bilingual lessons ready to read; private PDFs stay private.')}</p></article>
      <article><GraduationCap size={24}/><h3>{tx('Laboratorium Latihan','Practice Lab')}</h3><p>{tx('Bank latihan pilihan ganda dengan pembahasan, bukan skor contoh.','Multiple-choice exercises with explanations, not demo scores.')}</p></article>
      <article><Atom size={24}/><h3>{tx('Molecular Studio','Molecular Studio')}</h3><p>{tx('Rakit molekul, tampilkan 2D/3D, dan hitung deskriptor dengan RDKit.','Assemble molecules, view 2D/3D, and compute RDKit descriptors.')}</p></article>
      <article><BrainCircuit size={24}/><h3>{tx('Penelitian & Hybrid AI','Research & Hybrid AI')}</h3><p>{tx('Eksperimen sintetis, hipotesis, laporan, dan tutor AI dengan rute inferensi yang transparan.','Synthetic experiments, hypotheses, reports, and a tutor with transparent inference routing.')}</p></article>
    </div>
  </section>;
}
