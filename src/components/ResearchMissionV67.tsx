import { learningStorage as elkLearningStorage } from '../v8/learningStorage';
import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft, ArrowRight, BookOpen, BrainCircuit, CheckCircle2, ClipboardList,
  Download, Droplets, FileDown, FlaskConical, GraduationCap, Info,
  LoaderCircle, NotebookPen, RotateCcw, ShieldCheck, Sparkles, Target, Trophy,
} from 'lucide-react';
import { useLanguage, t } from '../lib/language';
import { RichAnswer85 } from '../v8/RichAnswer85';
import { firebaseConfigured, runHybridInference, type InferencePreference, type InferenceResult } from '../lib/hybrid';
import { ExperimentGlassV66 } from './ExperimentGlassV66';
import {
  EMPTY_MISSION, MISSION_EVENT, MISSION_KEY, DROP_SIZES, QUIZ_CORRECT,
  canFinish, distinctSizes, measure, progressPercent, reportMarkdown, restoreMission,
  takeTrial, type DropSize, type MissionState,
} from '../lib/researchMissionV67';
import '../research-journey-v67.css';

type Destination = 'dashboard' | 'library' | 'practice' | 'molecules';
const labelsId = ['Masalah', 'Hipotesis', 'Eksperimen', 'Analisis', 'Laporan'];
const labelsEn = ['Problem', 'Hypothesis', 'Experiment', 'Analysis', 'Report'];
function load(): MissionState {
  try { return restoreMission(elkLearningStorage.getItem(MISSION_KEY)); }
  catch { return {...EMPTY_MISSION}; }
}
function exportFile(filename: string, text: string, mime: string) {
  const blob = new Blob([text], {type: mime});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 600);
}
const hypotheses = [
  {id:'small', idText:'Tetes lebih kecil → resolusi lebih halus', enText:'Smaller drops → finer resolution'},
  {id:'large', idText:'Tetes lebih besar → resolusi lebih halus', enText:'Larger drops → finer resolution'},
] as const;

export function ResearchMissionV67({onGo, onSaveNote}:{onGo:(page:Destination)=>void;onSaveNote:(title:string,content:string,source:string)=>void}) {
  const {language} = useLanguage();
  const en = language === 'en';
  const tx = (id:string, english:string) => en ? english : id;
  const [step,setStep] = useState(0);
  const [state,setState] = useState<MissionState>(load);
  const [dropSize,setDropSize] = useState<DropSize>(0.05);
  const [drops,setDrops] = useState(0);
  const [preference,setPreference] = useState<InferencePreference>('Prefer on-device');
  const [aiResult,setAiResult] = useState<InferenceResult|null>(null);
  const [aiError,setAiError] = useState('');
  const [busy,setBusy] = useState(false);
  const [notice,setNotice] = useState('');
  const observation = useMemo(()=>measure(dropSize,drops),[dropSize,drops]);
  const pct = progressPercent(state);
  const completeReady = canFinish(state);
  useEffect(()=>{
    try { elkLearningStorage.setItem(MISSION_KEY,JSON.stringify(state)); }
    catch { /* In private browsing, progress remains in memory for this session. */ }
    window.dispatchEvent(new Event(MISSION_EVENT));
  },[state]);
  const addDrop = (n:number) => setDrops(v=>Math.min(2000,v+n));
  const record = () => {
    if (!drops) {setNotice(tx('Tambahkan tetes sebelum mencatat.','Add drops before recording.'));return;}
    const entry = takeTrial(dropSize,drops,`${Date.now()}-${state.trials.length}`);
    setState(s=>({...s,trials:[...s.trials,entry].slice(-24),finished:false}));
    setNotice(tx('Percobaan sintetis dicatat. Ubah ukuran tetes dan coba lagi.','Synthetic trial recorded. Change drop size and repeat.'));
  };
  const chooseSize = (x:DropSize) => {setDropSize(x);setDrops(0);setNotice('');};
  const askAI = async () => {
    if (!firebaseConfigured || busy || !state.trials.length) return;
    setBusy(true);setAiError('');setAiResult(null);
    const rows=state.trials.slice(-6).map(t=>`drop=${t.dropVolumeMl}mL, n=${t.drops}, simulated AN=${t.acidNumber}mg KOH/g, resolution=${t.resolution}`).join('; ');
    const prompt = `${en?'Answer in English':'Jawab dalam Bahasa Indonesia'}. You are an educational research mentor. This is a fully synthetic arithmetic simulation, NOT laboratory measurement, process optimization, industrial validation, or ASTM D664 procedure. Research question: how does assumed drop size influence one-drop acid-number resolution? Synthetic observations: ${rows}. Learner hypothesis: ${state.hypothesis || 'not selected'}. Provide (1) brief evidence-based comparison, (2) one uncertainty or model limitation, (3) one safe conceptual follow-up question. Explain numerical resolution only; do not offer reagent choices, hazardous physical procedures, production decisions, or chemical mixing instructions. In 120 words maximum.`;
    try {setAiResult(await runHybridInference(prompt,preference));}
    catch(e){setAiError(e instanceof Error?e.message:String(e));}
    finally{setBusy(false);}
  };
  const saveReport = (type:'markdown'|'json') => {
    if (type === 'markdown') exportFile('ElKimiya_ResearchMission_Educational.md',reportMarkdown(state,en?'en':'id'),'text/markdown;charset=utf-8');
    else exportFile('ElKimiya_ResearchMission_Educational.json',JSON.stringify({kind:'EL_KIMIYA_V67_SYNTHETIC_MISSION',not_real_experiment:true,model:'V6.2 educational acid-number arithmetic',...state},null,2),'application/json;charset=utf-8');
  };
  const steps = en?labelsEn:labelsId;
  return <main className="mission67" aria-label={tx('Misi penelitian kimia','Chemistry research mission')}>
    <header className="mission67-hero">
      <div className="mission67-hero-content"><span className="mission67-eyebrow"><Sparkles size={15}/>{tx('EL-KĪMIYĀ · MISI PENELITI MUDA','EL-KĪMIYĀ · YOUNG RESEARCHER MISSION')}</span>
        <h2>{tx('Dari pertanyaan menjadi bukti.','From curiosity to evidence.')}</h2>
        <p>{tx('Rancang hipotesis, uji asumsi virtual, interpretasikan hasil, lalu tulis laporan ilmiah yang jujur. Semuanya menggunakan data sintetis.','Form a hypothesis, test virtual assumptions, interpret observations, and write a transparent research report. All data is synthetic.')}</p>
        <div className="mission67-hero-actions"><button type="button" onClick={()=>onGo('library')}><BookOpen size={16}/>{tx('Baca konsep kimia','Read chemistry concepts')}</button><button type="button" onClick={()=>onGo('molecules')}><FlaskConical size={16}/>{tx('Buka lab lengkap','Open full laboratory')}</button></div>
      </div><div className="mission67-hero-progress"><span>{tx('PROGRES MISI DI BROWSER INI','MISSION PROGRESS IN THIS BROWSER')}</span><strong>{pct}%</strong><div><i style={{width:`${pct}%`}}/></div><small>{state.finished ? tx('Laporan telah diselesaikan','Report completed') : tx('Selesaikan berdasarkan bukti, bukan demo','Earn progress from your work, not a demo')}</small></div>
    </header>
    <p className="mission67-scope"><ShieldCheck size={17}/>{tx('Simulasi matematika edukatif. Bukan data percobaan nyata, bukan ASTM D664, dan tidak untuk keputusan industri.','Educational arithmetic simulation. Not measured data, not ASTM D664, and not for industrial decisions.')}</p>
    <div className="mission67-stepper" role="group" aria-label={tx('Tahapan misi','Mission steps')}>{steps.map((name,i)=><button type="button" key={name} className={step===i?'selected':''} aria-current={step===i?'step':undefined} onClick={()=>{setStep(i);setNotice('')}}><span>{String(i+1).padStart(2,'0')}</span>{name}</button>)}</div>
    <div className="mission67-body">
      {step===0&&<section className="mission67-paper"><span className="mission67-kicker">01 / {tx('PERTANYAAN PENELITIAN','RESEARCH QUESTION')}</span><h3>{tx('Bisakah ukuran tetes mengubah ketelitian yang tampak dalam simulasi?', 'Can virtual drop size change the resolution of a measurement model?')}</h3>
        <p>{tx('Dalam contoh QC produk petroleum, satu tetes pada simulasi mewakili sejumlah volume. Kita akan membandingkan ukuran tetes yang berbeda—dengan massa dan normalitas sintetis tetap—untuk mempelajari resolusi per tetes. Tidak ada bahan nyata yang digunakan.','In a fictional petroleum QC example, each virtual drop represents a volume. Compare different drop sizes while keeping synthetic sample mass and normality constant to study one-drop resolution. No materials are used.')}</p>
        <div className="mission67-stats"><div><span>{tx('Sumber model','Model source')}</span><strong>El-Kīmiyā V6.2</strong></div><div><span>{tx('Sampel','Sample')}</span><strong>{tx('A · sintetis','A · synthetic')}</strong></div><div><span>{tx('Fokus','Focus')}</span><strong>{tx('Resolusi pengukuran','Measurement resolution')}</strong></div></div>
        <p className="mission67-note"><Info size={16}/>{tx('Pertanyaan ini membandingkan angka yang dihitung, bukan menguji keberhasilan proses petrokimia nyata.','This question compares computed numbers, not the success of a real petrochemical process.')}</p>
        <button className="mission67-primary" type="button" onClick={()=>setStep(1)}>{tx('Mulai menyusun hipotesis','Form a hypothesis')}<ArrowRight size={17}/></button>
      </section>}
      {step===1&&<section className="mission67-paper"><span className="mission67-kicker">02 / {tx('HIPOTESIS','HYPOTHESIS')}</span><h3>{tx('Apa prediksimu?', 'What do you predict?')}</h3><p>{tx('Dalam model yang sama, mana yang memberi perubahan nilai lebih kecil setiap satu tetes?','With all other model assumptions fixed, which drop size produces a smaller change per drop?')}</p>
        <div className="mission67-choices">{hypotheses.map(h=><button key={h.id} type="button" className={state.hypothesis===h.id?'chosen':''} aria-pressed={state.hypothesis===h.id} onClick={()=>setState(s=>({...s,hypothesis:h.id,finished:false}))}>{state.hypothesis===h.id?<CheckCircle2 size={21}/>:<Target size={21}/>}<strong>{en?h.enText:h.idText}</strong></button>)}</div>
        <p className="mission67-note">{tx('Hipotesis boleh salah. Bandingkan dengan bukti dan jelaskan koreksinya di laporan.','A hypothesis may be wrong. Compare it with observations and discuss corrections in your report.')}</p>
        <button className="mission67-primary" type="button" disabled={!state.hypothesis} onClick={()=>setStep(2)}>{tx('Lanjut ke eksperimen','Continue to experiment')}<ArrowRight size={17}/></button>
      </section>}
      {step===2&&<section className="mission67-paper mission67-exp"><div><span className="mission67-kicker">03 / {tx('SIMULASI VIRTUAL','VIRTUAL SIMULATION')}</span><h3>{tx('Ubah satu variabel. Catat hasilnya.', 'Change one variable. Record the result.')}</h3><p>{tx('Pilih dua ukuran tetes berbeda, jalankan simulasi, kemudian catat setiap hasil. Rumus disambungkan ke model V6.2 yang sudah digunakan di laboratorium.','Choose two different drop sizes, simulate, and record each observation. Calculations reuse the existing V6.2 laboratory model.')}</p>
          <label className="mission67-select">{tx('Ukuran tetes virtual','Virtual drop size')}<select value={dropSize} onChange={e=>chooseSize(Number(e.target.value) as DropSize)}>{DROP_SIZES.map(v=><option value={v} key={v}>{v.toLocaleString(en?'en-US':'id-ID')} mL / {tx('tetes','drop')}</option>)}</select></label>
          <div className="mission67-controls"><button type="button" onClick={()=>addDrop(1)}><Droplets size={16}/>+1</button><button type="button" onClick={()=>addDrop(5)}>+5</button><button type="button" onClick={()=>addDrop(10)}>+10</button><button type="button" className="mission67-reset" onClick={()=>{setDrops(0);setNotice('')}}><RotateCcw size={16}/>{tx('Ulangi','Reset')}</button></div>
          <div className="mission67-stats"><div><span>{tx('Tetes','Drops')}</span><strong>{drops}</strong></div><div><span>{tx('Bilangan asam (mg KOH/g)','Acid number (mg KOH/g)')}</span><strong>{observation.acidNumberMgKohG.toFixed(3)}</strong></div><div><span>{tx('Resolusi per tetes','One-drop resolution')}</span><strong>{observation.resolutionMgKohGPerDrop.toFixed(4)}</strong></div></div>
          <button type="button" className="mission67-primary" onClick={record} disabled={!drops}>{tx('Catat pengamatan sintetis','Record synthetic observation')}<ClipboardList size={17}/></button>
          {notice&&<p role="status" className="mission67-note">{notice}</p>}
        </div><div className="mission67-graphic"><ExperimentGlassV66 drops={drops} volumeMl={observation.volumeMl} meter={observation.completion*100} status={observation.status} en={en}/></div>
        <div className="mission67-trials"><h4>{tx('Jurnal percobaan','Trial journal')} · {state.trials.length}</h4>{state.trials.length?<div className="mission67-trial-list">{state.trials.map((trial,i)=><div key={trial.id}><span>#{i+1} · {trial.dropVolumeMl} mL/{tx('tetes','drop')}</span><strong>{trial.acidNumber.toFixed(3)} mg KOH/g</strong><button type="button" title={tx('Hapus percobaan ini','Remove this trial')} onClick={()=>setState(s=>({...s,trials:s.trials.filter(t=>t.id!==trial.id),finished:false}))}>×</button></div>)}</div>:<p>{tx('Belum ada percobaan. Tambah tetes lalu catat.','No trials recorded. Add drops, then record.')}</p>}
          <span>{tx('Jumlah ukuran tetes berbeda','Distinct drop sizes')}: {distinctSizes(state.trials)} / 2</span>
          <button className="mission67-secondary" disabled={distinctSizes(state.trials)<2} onClick={()=>setStep(3)}>{tx('Bandingkan dan analisis','Compare and analyze')}<ArrowRight size={16}/></button>
        </div>
      </section>}
      {step===3&&<section className="mission67-paper"><span className="mission67-kicker">04 / {tx('ANALISIS ILMIAH','SCIENTIFIC ANALYSIS')}</span><h3>{tx('Pahami hasil, bukan sekadar mendapatkan angka.', 'Interpret evidence, not just numbers.')}</h3>
        <div className="mission67-summary">{state.trials.length ? state.trials.map((trial,i)=><div key={trial.id}><small>#{i+1} · {trial.dropVolumeMl} mL</small><strong>{trial.resolution.toFixed(4)}</strong><span>mg KOH/g / {tx('tetes','drop')}</span></div>) : <p>{tx('Catat percobaan pada tahap sebelumnya.','Record trials in the previous step.')}</p>}</div>
        <h4>{tx('Pertanyaan pemeriksaan','Knowledge check')}</h4><p>{tx('Jika ukuran tetes membesar tetapi variabel lain tetap, apa yang terjadi pada perubahan bilangan asam per tetes?', 'If drop size increases while other variables remain fixed, what happens to the acid-number increment per drop?')}</p>
        <div className="mission67-quiz">{[
          tx('Menjadi lebih kecil','Becomes smaller'),tx('Menjadi lebih besar','Becomes larger'),tx('Tidak berubah','Remains unchanged'),tx('Tidak dapat dihitung sama sekali','Cannot be calculated at all')
        ].map((label,i)=><button type="button" key={i} aria-pressed={state.selectedAnswer===i} className={state.selectedAnswer===i?'chosen':''} onClick={()=>setState(s=>({...s,selectedAnswer:i,checked:false,finished:false}))}><b>{'ABCD'[i]}</b>{label}</button>)}</div>
        <button className="mission67-secondary" disabled={state.selectedAnswer===null} onClick={()=>setState(s=>({...s,checked:true,finished:false}))}>{tx('Periksa jawaban','Check answer')}</button>
        {state.checked&&<p role="status" className={`mission67-feedback ${state.selectedAnswer===QUIZ_CORRECT?'good':'retry'}`}>{state.selectedAnswer===QUIZ_CORRECT?tx('Benar: satu tetes lebih besar menyumbang perubahan numerik lebih besar, sehingga resolusinya lebih kasar.','Correct: a larger drop produces a larger numeric increment, giving coarser resolution.'):tx('Belum tepat. Perhatikan nilai resolusi pada tabel dan coba lagi.','Not quite. Compare the resolution values in the table and try again.')}</p>}
        <label className="mission67-reflection">{tx('Tuliskan interpretasi dan batasan percobaan (minimum 20 karakter)','Write your interpretation and a model limitation (at least 20 characters)')}<textarea value={state.reflection} maxLength={1200} rows={4} onChange={e=>setState(s=>({...s,reflection:e.target.value,finished:false}))} placeholder={tx('Contoh: Ukuran tetes yang lebih kecil menghasilkan langkah perubahan lebih halus, tetapi model ini tidak memperhitungkan ketidakpastian fisik…','For example: Smaller drops produce finer increments, but this model omits real measurement uncertainty…')}/><small>{state.reflection.trim().length}/20 {tx('karakter minimum','minimum characters')}</small></label>
        <div className="mission67-ai"><div><BrainCircuit size={21}/><strong>{tx('Pembimbing Hybrid AI (opsional)','Hybrid AI research mentor (optional)')}</strong></div><p>{tx('Jawaban dihasilkan melalui Firebase AI Logic jika tersedia. Hasil yang dilaporkan menunjukkan jalur inferensi sebenarnya, bukan klaim lokal palsu.','Responses use Firebase AI Logic where available. The recorded inference route is reported from the SDK, not invented.')}</p>
          <select aria-label={tx('Preferensi inferensi','Inference preference')} value={preference} onChange={e=>setPreference(e.target.value as InferencePreference)}>{(["Prefer on-device","On-device only","Prefer cloud","Cloud only"] as const).map(mode=><option key={mode} value={mode}>{t(mode)}</option>)}</select>
          <button type="button" disabled={!firebaseConfigured||busy||!state.trials.length} onClick={()=>void askAI()}>{busy?<LoaderCircle size={17}/>:<Sparkles size={17}/>} {busy?tx('Memproses…','Processing…'):tx('Analisis dengan Hybrid AI','Analyze with Hybrid AI')}</button>
          {!firebaseConfigured&&<p className="mission67-warning">{tx('Firebase belum lengkap. Misi tetap dapat diselesaikan tanpa AI.','Firebase is not configured. You can still complete the mission without AI.')}</p>}
          {aiError&&<p role="alert" className="mission67-warning">{aiError}</p>}
          {aiResult&&<div className="mission67-ai-answer"><strong>{aiResult.provider} · {aiResult.model}</strong><RichAnswer85 text={aiResult.text}/></div>}
        </div>
        <button className="mission67-primary" type="button" onClick={()=>setStep(4)}>{tx('Siapkan laporan','Prepare report')}<ArrowRight size={17}/></button>
      </section>}
      {step===4&&<section className="mission67-paper"><span className="mission67-kicker">05 / {tx('LAPORAN PENELITI MUDA','YOUNG RESEARCHER REPORT')}</span><h3>{tx('Laporan yang bisa diperiksa, bukan sekadar skor.', 'A reviewable research report, not just a score.')}</h3>
        <p>{tx('Simpan bukti percobaan dan interpretasi. Tidak ada hasil industri yang diklaim. Data bersifat lokal di browser ini.','Keep the simulated observations and your interpretation. No industrial results are claimed. Draft data stays local to this browser.')}</p>
        <div className="mission67-checklist"><p className={state.hypothesis?'ok':''}><CheckCircle2 size={16}/>{tx('Hipotesis disimpan','Hypothesis saved')}</p><p className={distinctSizes(state.trials)>=2?'ok':''}><CheckCircle2 size={16}/>{tx('Dua ukuran tetes berbeda dicatat','Two distinct drop sizes recorded')}</p><p className={state.checked&&state.selectedAnswer===QUIZ_CORRECT?'ok':''}><CheckCircle2 size={16}/>{tx('Pertanyaan analisis dijawab benar','Knowledge check passed')}</p><p className={state.reflection.trim().length>=20?'ok':''}><CheckCircle2 size={16}/>{tx('Interpretasi ditulis','Interpretation written')}</p></div>
        <button className="mission67-primary" type="button" disabled={!completeReady||state.finished} onClick={()=>setState(s=>({...s,finished:true}))}>{state.finished?<><Trophy size={18}/>{tx('Misi selesai','Mission completed')}</>:<><Trophy size={18}/>{tx('Selesaikan misi','Complete mission')}</>}</button>
        {!completeReady&&<p className="mission67-note">{tx('Lengkapi seluruh pemeriksaan di atas; tidak wajib menggunakan AI.','Finish the checklist above; AI use is optional.')}</p>}
        <article className="mission67-print-report"><h4>{tx('EL-KĪMIYĀ / JURNAL PENELITIAN','EL-KĪMIYĀ / RESEARCH NOTEBOOK')}</h4><p className="mission67-disclaimer">{tx('LAPORAN SIMULASI EDUKATIF — BUKAN PENGUKURAN INDUSTRI','EDUCATIONAL SIMULATION — NOT AN INDUSTRIAL MEASUREMENT')}</p>
          <pre>{reportMarkdown(state,en?'en':'id')}</pre></article>
        <div className="mission67-export"><button onClick={()=>saveReport('markdown')} type="button"><Download size={17}/> Markdown</button><button onClick={()=>saveReport('json')} type="button"><FileDown size={17}/> JSON</button><button onClick={()=>window.print()} type="button"><FileDown size={17}/>{tx('Cetak / Simpan PDF','Print / Save PDF')}</button><button disabled={!state.finished} onClick={()=>{onSaveNote('Research Mission · Synthetic acid number',reportMarkdown(state,en?'en':'id').slice(0,4500),'El-Kīmiyā V6.7 · browser-local synthetic report');setNotice(tx('Tersimpan di Catatan Tersimpan.','Saved to your personal notes.'))}} type="button"><NotebookPen size={17}/>{tx('Simpan ke catatan','Save to notes')}</button></div>
        {notice&&<p className="mission67-note" role="status">{notice}</p>}
      </section>}
    </div>
    <footer className="mission67-footer"><button type="button" onClick={()=>step===0?onGo('dashboard'):setStep(s=>s-1)}><ArrowLeft size={16}/>{tx('Kembali','Back')}</button><span>{step+1} / {steps.length}</span><button type="button" onClick={()=>step===4?onGo('dashboard'):setStep(s=>s+1)}>{step===4?tx('Ke dasbor','Go to dashboard'):tx('Berikutnya','Next')}<ArrowRight size={16}/></button></footer>
  </main>;
}
