import { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight, BookOpen, Check, CheckCircle2, ChevronLeft, CircleHelp,
  FlaskConical, GraduationCap, Layers3, RefreshCcw, RotateCcw,
  Search, ShieldCheck, Sparkles, Target, Trophy,
} from 'lucide-react';
import { useLanguage } from '../lib/language';
import { QUESTION_BANK_V63, QUIZ_FAMILIES_V63 } from '../data/quizBankV63';
import type { ExerciseV63 } from '../data/quizBankV63';
import '../experience-v63.css';

const KEY = 'elkimiya.quizbank.v63.progress';
type Score = { attempted: number; correct: number; history: { id: string; correct: boolean }[] };
const EMPTY: Score = { attempted: 0, correct: 0, history: [] };
function loadScore(): Score {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(KEY) || '{}');
    if (!value || typeof value !== 'object') return EMPTY;
    const s = value as Partial<Score>;
    return {
      attempted: Number.isSafeInteger(s.attempted) && (s.attempted ?? -1) >= 0 ? s.attempted! : 0,
      correct: Number.isSafeInteger(s.correct) && (s.correct ?? -1) >= 0 ? s.correct! : 0,
      history: Array.isArray(s.history) ? s.history.filter(h => h && typeof h.id === 'string' && typeof h.correct === 'boolean').slice(-80) : [],
    };
  } catch { return EMPTY; }
}
const percentage = (part: number, total: number) => total ? Math.round(part * 100 / total) : 0;

export function PracticeBankV63({ onAnswer, onOpenPath, onOpenClassic }: {
  onAnswer: (correct: boolean) => void;
  onOpenPath: () => void;
  onOpenClassic: () => void;
}) {
  const { language } = useLanguage();
  const en = language === 'en';
  const tx = (id: string, english: string) => en ? english : id;
  const localize = (text: { id: string; en: string }) => en ? text.en : text.id;
  const [family, setFamily] = useState('all');
  const [difficulty, setDifficulty] = useState('all');
  const [query, setQuery] = useState('');
  const [index, setIndex] = useState(0);
  const [choice, setChoice] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const [score, setScore] = useState<Score>(loadScore);
  const [showWhy, setShowWhy] = useState(false);

  const filtered = useMemo(() => QUESTION_BANK_V63.filter(q =>
    (family === 'all' || q.family === family) &&
    (difficulty === 'all' || q.level === difficulty) &&
    (!query.trim() || `${q.prompt.id} ${q.prompt.en} ${q.topic.id} ${q.topic.en}`.toLowerCase().includes(query.trim().toLowerCase()))
  ), [family, difficulty, query]);
  const active = filtered.length ? filtered[index % filtered.length] : null;
  const position = filtered.length ? (index % filtered.length) + 1 : 0;
  const resetAnswer = () => { setChoice(null); setChecked(false); setShowWhy(false); };
  const setFilter = (next: string) => { setFamily(next); setIndex(0); resetAnswer(); };
  const setLevel = (next: string) => { setDifficulty(next); setIndex(0); resetAnswer(); };
  const check = () => {
    if (!active || choice === null || checked) return;
    const wasCorrect = choice === active.correct;
    setChecked(true); setShowWhy(true);
    onAnswer(wasCorrect);
    setScore(prev => ({ attempted: prev.attempted + 1, correct: prev.correct + (wasCorrect ? 1 : 0),
      history: [...prev.history, { id: active.id, correct: wasCorrect }].slice(-80) }));
  };
  const move = (next: number) => { setIndex(next); resetAnswer(); };
  const random = () => {
    if (!filtered.length) return;
    const candidate = Math.floor(Math.random() * filtered.length);
    move(filtered.length > 1 && candidate === (index % filtered.length) ? (candidate + 1) % filtered.length : candidate);
  };
  const resetSession = () => { setScore(EMPTY); resetAnswer(); };

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(score)); } catch { /* browser storage optional */ }
  }, [score]);

  const current = active as ExerciseV63 | null;
  return <main className="v63-quiz" aria-label={tx('Bank soal kimia', 'Chemistry question bank')}>
    <section className="v63-quiz-hero">
      <div className="v63-quiz-hero-copy">
        <span className="v63-kicker"><FlaskConical size={16}/> {tx('LABORATORIUM LATIHAN · BANK SOAL', 'PRACTICE LAB · QUESTION BANK')}</span>
        <h2>{tx('Belajar kimia dengan mencoba,', 'Learn chemistry by trying,')}<br/><em>{tx('bukan menebak.', 'not just guessing.')}</em></h2>
        <p>{tx('Tantangan A/B/C/D dari perhitungan kimia dasar hingga studi kasus petrokimia. Jawaban diperiksa segera, disertai penjelasan rumus dan langkahnya.',
          'A/B/C/D challenges from basic chemistry calculations to petrochemical case studies. Each answer is checked with clear working and explanation.')}</p>
        <div className="v63-quiz-nav">
          <span className="v63-quiz-active"><Check size={15}/> {tx('Bank soal', 'Question bank')}</span>
          <button type="button" onClick={onOpenPath}><BookOpen size={16}/>{tx('Jalur belajar', 'Learning journey')}</button>
          <button type="button" onClick={onOpenClassic}><FlaskConical size={16}/>{tx('Lab klasik', 'Classic lab')}</button>
        </div>
      </div>
      <div className="v63-quiz-emblem" aria-hidden="true"><div className="v63-emblem-inner"><span>H</span><span>O</span><span>Na</span><span>C</span></div><b>{QUESTION_BANK_V63.length.toLocaleString('id-ID')}</b><small>{tx('VARIASI SOAL', 'QUESTION VARIANTS')}</small></div>
    </section>

    <div className="v63-quiz-stats" aria-label={tx('Statistik belajar', 'Study statistics')}>
      <div className="v63-stat v63-stat-amber"><span><Layers3 size={21}/></span><div><strong>{QUESTION_BANK_V63.length.toLocaleString('id-ID')}</strong><small>{tx('Variasi hitungan terstruktur', 'Structured calculation variants')}</small></div></div>
      <div className="v63-stat v63-stat-teal"><span><Target size={21}/></span><div><strong>{score.attempted}</strong><small>{tx('Jawaban diperiksa', 'Answers checked')}</small></div></div>
      <div className="v63-stat v63-stat-purple"><span><Trophy size={21}/></span><div><strong>{percentage(score.correct,score.attempted)}%</strong><small>{tx('Akurasi latihan tersimpan', 'Saved practice accuracy')}</small></div></div>
    </div>

    <div className="v63-quiz-layout">
      <aside className="v63-filter-panel">
        <div className="v63-panel-heading"><GraduationCap size={19}/><div><strong>{tx('Atur sesi latihan', 'Set up your practice')}</strong><small>{tx('Pilih kompetensi dan tingkat kesulitan', 'Select topic and difficulty')}</small></div></div>
        <label className="v63-field">{tx('Cari kata kunci', 'Search topic or question')}
          <div className="v63-search"><Search size={17}/><input aria-label={tx('Cari soal', 'Search questions')} value={query} onChange={e => {setQuery(e.target.value);setIndex(0);resetAnswer();}} placeholder={tx('Mis. molaritas, gas...', 'E.g. molarity, gas...')}/></div>
        </label>
        <label className="v63-field">{tx('Tingkat kesulitan', 'Difficulty')}
          <select value={difficulty} onChange={e => setLevel(e.target.value)}>
            <option value="all">{tx('Semua tingkat', 'All levels')}</option>
            <option value="dasar">{tx('Dasar', 'Foundation')}</option>
            <option value="menengah">{tx('Menengah', 'Intermediate')}</option>
            <option value="lanjutan">{tx('Lanjutan', 'Advanced')}</option>
          </select>
        </label>
        <span className="v63-topic-label">{tx('Kompetensi', 'Competencies')} <b>{QUIZ_FAMILIES_V63.length}</b></span>
        <div className="v63-topics"><button type="button" className={family==='all'?'on':''} onClick={()=>setFilter('all')}><span>{tx('Semua topik', 'All topics')}</span><b>{QUESTION_BANK_V63.length}</b></button>
          {QUIZ_FAMILIES_V63.map(t => <button type="button" className={family===t.key?'on':''} key={t.key} onClick={()=>setFilter(t.key)}><span>{localize(t.topic)}</span><b>96</b></button>)}
        </div>
        <div className="v63-source-note"><ShieldCheck size={18}/><p>{tx('Bank ini berisi varian soal hitungan yang dibuat secara deterministik, bukan ribuan konsep independen atau soal ujian yang sudah diverifikasi pakar.',
          'This is a deterministic numerical-variant bank, not thousands of independent concepts or expert-validated exam questions.')}</p><a target="_blank" rel="noreferrer" href="https://openstax.org/details/books/chemistry-2e">OpenStax Chemistry 2e</a></div>
      </aside>

      <section className="v63-exam" aria-label={tx('Latihan pilihan ganda', 'Multiple choice practice')}>
        {current ? <>
          <div className="v63-exam-top"><span><Sparkles size={16}/>{localize(current.topic)}</span><span>{position} / {filtered.length}</span></div>
          <div className="v63-exam-progress"><span style={{width:`${position/filtered.length*100}%`}}/></div>
          <div className="v63-question-body"><div className="v63-question-meta"><span>{tx('SOAL', 'QUESTION')} {current.id.split('-').pop()}</span><span>{current.level === 'dasar' ? tx('Dasar', 'Foundation') : current.level === 'menengah' ? tx('Menengah', 'Intermediate') : tx('Lanjutan', 'Advanced')}</span></div>
            <h3>{localize(current.prompt)}</h3><p className="v63-question-tip">{tx('Pilih satu jawaban yang paling tepat.', 'Choose the single best answer.')}</p>
            <div className="v63-choices" role="group" aria-label={tx('Pilihan jawaban A sampai D', 'Answer choices A to D')}>
              {current.choices.map((option, i) => <button type="button" key={i} aria-pressed={choice===i} disabled={checked} onClick={()=>setChoice(i)}
                className={`${choice===i?'selected':''} ${checked&&i===current.correct?'correct':''} ${checked&&choice===i&&i!==current.correct?'wrong':''}`}>
                <span className="v63-letter">{String.fromCharCode(65+i)}</span><strong>{localize(option)}</strong>{checked&&i===current.correct&&<CheckCircle2 size={18}/>}
              </button>)}
            </div>
            {checked&&<div className={`v63-explanation ${choice===current.correct?'is-correct':'is-wrong'}`} role="status"><div><span>{choice===current.correct?<CheckCircle2 size={20}/>:<CircleHelp size={20}/>}</span><strong>{choice===current.correct?tx('Tepat!','Correct!'):tx('Belum tepat — pelajari pembahasannya.', 'Not quite — review the reasoning.')}</strong></div><p>{localize(current.explanation)}</p><button type="button" onClick={()=>setShowWhy(v=>!v)}>{showWhy?tx('Sembunyikan catatan', 'Hide notes'):tx('Lihat catatan sumber', 'Show source notes')}</button>{showWhy&&<p className="v63-explain-small">{tx('Nilai soal dibuat dari aritmetika ideal dengan parameter hipotetis. Rujukan konsep: ', 'Values use ideal arithmetic with hypothetical inputs. Concept reference: ')}<a href={current.source} target="_blank" rel="noreferrer">OpenStax Chemistry 2e</a></p>}</div>}
          </div>
          <div className="v63-exam-actions">
            <button type="button" className="v63-secondary" onClick={()=>move((index-1+filtered.length)%filtered.length)}><ChevronLeft size={16}/>{tx('Sebelumnya', 'Previous')}</button>
            <button type="button" className="v63-secondary" onClick={random}><RefreshCcw size={16}/>{tx('Acak soal', 'Random')}</button>
            {!checked ? <button type="button" className="v63-primary" disabled={choice===null} onClick={check}>{tx('Periksa jawaban', 'Check answer')}<Check size={17}/></button> :
              <button type="button" className="v63-primary" onClick={()=>move((index+1)%filtered.length)}>{tx('Soal berikutnya', 'Next question')}<ArrowRight size={17}/></button>}
          </div>
        </> : <div className="v63-no-results"><CircleHelp size={34}/><strong>{tx('Tidak ada soal untuk filter ini.', 'No questions match these filters.')}</strong><button type="button" onClick={()=>{setQuery('');setFamily('all');setDifficulty('all');setIndex(0);resetAnswer();}}>{tx('Reset filter', 'Reset filters')}</button></div>}
        <div className="v63-quiz-footer"><span>{tx('Nilai latihan tersimpan di browser ini, bukan dikirim ke server.', 'Practice results are stored in this browser, not uploaded.')}</span><button type="button" onClick={resetSession}><RotateCcw size={14}/>{tx('Reset statistik', 'Reset stats')}</button></div>
      </section>
    </div>
  </main>;
}
