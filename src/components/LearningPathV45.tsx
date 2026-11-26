import { learningStorage as elkLearningStorage } from '../v8/learningStorage';
import { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight, BookOpen, Check, CheckCircle2, ChevronLeft, ChevronRight,
  CircleHelp, FlaskConical, GraduationCap, Layers3, LockKeyhole,
  RotateCcw, ShieldCheck, Sparkles, Target, UnlockKeyhole,
} from 'lucide-react';
import { useLanguage } from '../lib/language';
import { COURSE, localize } from '../data/course-v45';
import { HybridCoachV46 } from './HybridCoachV46'; // ELKIMIYA_V46_HYBRID_COACH
import '../study-v45.css';

type Progress = { passed: string[]; read: string[] };
const KEY = 'elk.v45.learningPath.1';
function loadProgress(): Progress {
  try {
    const raw = JSON.parse(elkLearningStorage.getItem(KEY) || '{}') as Record<string, unknown>;
    return {
      passed: Array.isArray(raw.passed) ? raw.passed.filter((v): v is string => typeof v === 'string') : [],
      read: Array.isArray(raw.read) ? raw.read.filter((v): v is string => typeof v === 'string') : [],
    };
  } catch { return { passed: [], read: [] }; }
}
function saveProgress(next: Progress): Progress {
  try { elkLearningStorage.setItem(KEY, JSON.stringify(next)); } catch { /* Browsers without storage can still practice this session. */ }
  window.dispatchEvent(new Event('elk:v45-progress'));
  return next;
}

type Props = {
  onOpenLab: () => void;
  onOpenFlashcards: () => void;
  onOpenDraftBank: () => void;
  onOpenExplorer: () => void;
};
export function LearningPathV45({ onOpenLab, onOpenFlashcards, onOpenDraftBank, onOpenExplorer }: Props) {
  const { language } = useLanguage();
  const lang: 'id' | 'en' = language === 'en' ? 'en' : 'id';
  const en = lang === 'en';
  const tx = (id: string, enText: string) => en ? enText : id;
  const [progress, setProgress] = useState<Progress>(loadProgress);
  const doneCount = COURSE.reduce((sum, unit, i) => sum + (progress.passed.includes(unit.id) && COURSE.slice(0, i).every(prev => progress.passed.includes(prev.id)) ? 1 : 0), 0);
  const firstOpen = Math.min(doneCount, COURSE.length - 1);
  const [selected, setSelected] = useState(firstOpen);
  const [readingStep, setReadingStep] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [grading, setGrading] = useState<'none' | 'pass' | 'retry'>('none');
  const [attempts, setAttempts] = useState(0);
  const [apiHealth, setApiHealth] = useState<'checking' | 'online' | 'offline'>('checking');
  const [serverTopics, setServerTopics] = useState(0);

  useEffect(() => {
    if (!['localhost', '127.0.0.1'].includes(window.location.hostname)) { setApiHealth('offline'); return; }
    const controller = new AbortController();
    void fetch('http://127.0.0.1:8000/api/v1/learning/health', { signal: controller.signal })
      .then(async r => { if (!r.ok) throw new Error('API unavailable'); return r.json() as Promise<{ topics?: number }>; })
      .then(data => { if (!controller.signal.aborted) { setServerTopics(data.topics ?? 0); setApiHealth('online'); } })
      .catch(() => { if (!controller.signal.aborted) setApiHealth('offline'); });
    return () => controller.abort();
  }, []);
  const unit = COURSE[selected];
  const alreadyRead = progress.read.includes(unit.id);
  const passed = progress.passed.includes(unit.id);
  const finished = doneCount === COURSE.length;
  const countDone = Math.round((doneCount / COURSE.length) * 100);
  const selectedNames = useMemo(() => COURSE.map(x => localize(x.title, lang)), [lang]);
  const handleSelect = (index: number) => {
    if (index > doneCount || index < 0 || index >= COURSE.length) return;
    setSelected(index); setReadingStep(0); setAnswers({}); setGrading('none'); setAttempts(0);
  };
  const markRead = () => {
    if (readingStep < unit.sections.length - 1) { setReadingStep(v => v + 1); return; }
    setProgress(old => saveProgress({ ...old, read: [...new Set([...old.read, unit.id])] }));
  };
  const grade = () => {
    if (Object.keys(answers).length < unit.checks.length) return;
    const correct = unit.checks.every((q, i) => answers[i] === q.correct);
    setAttempts(a => a + 1);
    setGrading(correct ? 'pass' : 'retry');
    if (correct && !passed) {
      setProgress(old => saveProgress({ read: old.read, passed: [...new Set([...old.passed, unit.id])] }));
    }
  };
  const reset = () => {
    if (!window.confirm(tx('Reset seluruh progres jalur belajar di browser ini?', 'Reset all learning-path progress in this browser?'))) return;
    setProgress(saveProgress({ passed: [], read: [] })); setSelected(0); setReadingStep(0); setAnswers({}); setGrading('none'); setAttempts(0);
  };
  return <main className="v45-root" aria-label={tx('Jalur pembelajaran kimia', 'Chemistry learning path')}>
    <section className="v45-hero">
      <div className="v45-hero-main">
        <span className="v45-kicker"><GraduationCap size={16}/>{tx('JALUR BELAJAR · TERSTRUKTUR', 'LEARNING JOURNEY · STRUCTURED')}</span>
        <h2>{tx('Belajar terarah. Buka bab selanjutnya dengan pemahaman.', 'Learn with direction. Unlock chapters through understanding.')}</h2>
        <p>{tx('Tidak ada lagi 13 bab yang semuanya terbuka. Selesaikan bacaan dan dua cek pemahaman agar bab berikutnya terbuka.', 'No more 13 chapters open at once. Finish the reading and two knowledge checks to unlock the next chapter.')}</p>
        <div className="v45-hero-actions">
          <button className="v45-primary" onClick={() => { handleSelect(firstOpen); document.getElementById('v45-study-content')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }}><BookOpen size={16}/>{finished ? tx('Ulangi materi', 'Review lessons') : tx('Lanjutkan belajar', 'Continue learning')}<ArrowRight size={16}/></button>
          <button className="v45-ghost" onClick={onOpenExplorer}><Sparkles size={17}/>{tx('Tabel periodik 118 unsur', '118-element periodic table')}</button>
        </div>
      </div>
      <div className="v45-hero-progress"><strong>{countDone}%</strong><span>{tx('jalur selesai', 'journey completed')}</span><div className="v45-progressbar"><span style={{ width: `${countDone}%` }}/></div><small>{doneCount}/{COURSE.length} {tx('bab tuntas', 'chapters completed')}</small></div>
    </section>

    <div className="v45-statsbar">
      <span><Target size={17}/><b>{COURSE.length}</b> {tx('bab berurutan', 'ordered chapters')}</span>
      <span><CheckCircle2 size={17}/><b>{doneCount}</b> {tx('dituntaskan', 'completed')}</span>
      <span><ShieldCheck size={17}/>{apiHealth === 'online' ? tx(`Learning API aktif · ${serverTopics} topik`, `Learning API online · ${serverTopics} topics`) : apiHealth === 'checking' ? tx('Memeriksa API...', 'Checking API...') : tx('Materi lokal tetap tersedia · API offline', 'Built-in lessons available · API offline')}</span>
    </div>

    <div className="v45-path-layout">
      <aside className="v45-path-panel" aria-label={tx('Daftar bab', 'Chapter list')}>
        <div className="v45-panel-heading"><span className="v45-kicker">{tx('KURIKULUM', 'CURRICULUM')}</span><h3>{tx('Jalur 13 bab', '13-chapter path')}</h3><p>{tx('Bab terkunci dibuka secara berurutan.', 'Locked chapters unlock in sequence.')}</p></div>
        <div className="v45-path-list">{COURSE.map((chapter, i) => {
          const completed = i < doneCount;
          const locked = i > doneCount;
          return <button key={chapter.id} className={`v45-path-item ${selected === i ? 'is-active' : ''} ${locked ? 'is-locked' : ''} ${completed ? 'is-done' : ''}`} disabled={locked} onClick={() => handleSelect(i)} aria-current={selected === i ? 'step' : undefined}>
            <span className="v45-path-number">{completed ? <Check size={16}/> : locked ? <LockKeyhole size={15}/> : String(i + 1).padStart(2, '0')}</span>
            <span className="v45-path-copy"><strong>{localize(chapter.title, lang)}</strong><small>{completed ? tx('Tuntas · bisa diulang', 'Completed · review anytime') : locked ? tx('Terkunci · selesaikan bab sebelumnya', 'Locked · complete previous chapter') : tx('Sedang dipelajari', 'In progress')}</small></span>
            {!locked && <ChevronRight size={16}/>}</button>;
        })}</div>
        <div className="v45-path-tools"><span className="v45-kicker">{tx('ALAT BELAJAR LAIN', 'MORE LEARNING TOOLS')}</span>
          <button onClick={onOpenFlashcards}><Layers3 size={17}/>{tx('Kartu hafalan (latihan bebas)', 'Flashcards (free review)')}<ArrowRight size={15}/></button>
          <button onClick={onOpenLab}><FlaskConical size={17}/>{tx('Laboratorium interaktif', 'Interactive laboratory')}<ArrowRight size={15}/></button>
          <button onClick={onOpenDraftBank}><BookOpen size={17}/>{tx('Bank 65 soal draft', '65 draft questions')}<ArrowRight size={15}/></button>
        </div>
      </aside>

      <section id="v45-study-content" className="v45-study-panel" aria-label={selectedNames[selected]}>
        <div className="v45-lesson-banner"><div><span className="v45-kicker">{tx('BAB', 'CHAPTER')} {String(selected + 1).padStart(2, '0')} / {COURSE.length}</span><h3>{localize(unit.title, lang)}</h3><p>{localize(unit.objective, lang)}</p></div><span className={`v45-state-label ${passed ? 'done' : ''}`}>{passed ? tx('Tuntas', 'Completed') : alreadyRead ? tx('Saatnya latihan', 'Ready to practice') : tx('Baca materi', 'Read lesson')}</span></div>

        <div className="v45-stepper" aria-label={tx('Tahapan belajar', 'Learning stages')}>
          <div className={alreadyRead ? 'is-done' : 'is-current'}><span>1</span><strong>{tx('Baca', 'Read')}</strong><small>{tx('3 konsep penting', '3 key ideas')}</small></div>
          <div className={passed ? 'is-done' : alreadyRead ? 'is-current' : ''}><span>2</span><strong>{tx('Cek pemahaman', 'Knowledge check')}</strong><small>{tx('2 soal dinilai lokal', '2 locally graded checks')}</small></div>
          <div className={passed ? 'is-done' : ''}><span>3</span><strong>{tx('Buka bab', 'Unlock chapter')}</strong><small>{tx('Lanjutkan jalur', 'Continue the path')}</small></div>
        </div>

        {!alreadyRead ? <div className="v45-reading">
          <div className="v45-reading-top"><span className="v45-kicker">{tx('MATERI INTERAKTIF', 'INTERACTIVE LESSON')}</span><span>{readingStep + 1} / {unit.sections.length}</span></div>
          <div className="v45-reading-progress"><span style={{ width: `${((readingStep + 1) / unit.sections.length) * 100}%` }}/></div>
          <article className="v45-reading-card"><div className="v45-concept-icon"><BookOpen size={28}/></div><span className="v45-muted-upper">{tx('KONSEP', 'CONCEPT')} {String(readingStep + 1).padStart(2, '0')}</span><h4>{localize(unit.sections[readingStep].title, lang)}</h4><p>{localize(unit.sections[readingStep].body, lang)}</p></article>
          <div className="v45-reading-controls"><button className="v45-secondary" disabled={readingStep === 0} onClick={() => setReadingStep(s => s - 1)}><ChevronLeft size={16}/>{tx('Sebelumnya', 'Previous')}</button><button className="v45-primary" onClick={markRead}>{readingStep === unit.sections.length - 1 ? tx('Sudah baca semua · mulai latihan', 'Read all · start practice') : tx('Baca konsep berikutnya', 'Next concept')}<ArrowRight size={16}/></button></div>
        </div> : <div className="v45-checkpoint">
          <div className="v45-section-title"><div><span className="v45-kicker">{tx('CEK PEMAHAMAN', 'KNOWLEDGE CHECK')}</span><h4>{tx('Jawab kedua soal untuk membuka bab berikutnya.', 'Answer both questions to unlock the next chapter.')}</h4></div><span className="v45-pill">2 / 2 {tx('benar untuk lulus', 'correct to pass')}</span></div>
          {unit.checks.map((q, qi) => <article key={`${unit.id}-${qi}`} className="v45-check-card"><div className="v45-check-top"><span>{tx('SOAL', 'QUESTION')} {String(qi + 1).padStart(2, '0')}</span><span>{answers[qi] !== undefined ? tx('Terjawab', 'Answered') : tx('Belum dijawab', 'Not answered')}</span></div>
            <h5>{localize(q.question, lang)}</h5><div className="v45-choice-list">{q.choices.map((choice, ci) => {
              const selectedAnswer = answers[qi] === ci;
              const showCorrect = grading !== 'none' && ci === q.correct;
              const wrong = grading !== 'none' && selectedAnswer && ci !== q.correct;
              return <button type="button" key={`${unit.id}-${qi}-${ci}`} className={`${selectedAnswer ? 'is-selected' : ''} ${showCorrect ? 'is-correct' : ''} ${wrong ? 'is-wrong' : ''}`} disabled={grading !== 'none'} onClick={() => setAnswers(a => ({ ...a, [qi]: ci }))} aria-pressed={selectedAnswer}><b>{String.fromCharCode(65 + ci)}</b><span>{localize(choice, lang)}</span>{showCorrect && <Check size={16}/>}</button>;
            })}</div>
            {grading !== 'none' && <div className="v45-reason"><CircleHelp size={16}/>{localize(q.why, lang)}</div>}
          </article>)}
          <div className="v45-check-actions">{grading === 'none' ? <button className="v45-primary" disabled={Object.keys(answers).length !== unit.checks.length} onClick={grade}><Target size={17}/>{tx('Periksa jawaban', 'Check answers')}</button> : grading === 'retry' ? <><p className="v45-result-warning">{tx('Belum tepat semuanya. Baca penjelasan lalu coba lagi—tidak ada batas percobaan.', 'Not all answers are correct. Review the explanations and retry—no attempt limit.')}</p><button className="v45-primary" onClick={() => { setAnswers({}); setGrading('none'); }}><RotateCcw size={16}/>{tx('Coba lagi', 'Try again')}</button></> : <div className="v45-result-success"><CheckCircle2 size={23}/><div><strong>{tx('Bab selesai!', 'Chapter complete!')}</strong><p>{selected === COURSE.length - 1 ? tx('Seluruh jalur sudah selesai. Kamu bisa mengulang bab dan meninjau kartu hafalan.', 'You finished the journey. Review chapters and flashcards any time.') : tx('Bab selanjutnya telah terbuka.', 'The next chapter is unlocked.')}</p></div>{selected < COURSE.length - 1 && <button className="v45-primary" onClick={() => handleSelect(selected + 1)}>{tx('Lanjut bab', 'Next chapter')}<ArrowRight size={16}/></button>}</div>}</div>
          {attempts > 0 && <small className="v45-attempts">{tx('Percobaan sesi ini:', 'Attempts this session:')} {attempts}</small>}
          {passed && grading === 'none' && <div className="v45-notice-success"><CheckCircle2 size={17}/>{tx('Bab pernah diselesaikan. Kamu dapat mengulang kuis untuk berlatih.', 'You have already completed this chapter. You can repeat the quiz for practice.')}</div>}
        </div>}
        <HybridCoachV46 key={unit.id} lesson={{ id: unit.id, title: unit.title, objective: unit.objective, concepts: unit.sections }} />
        <details className="v45-source"><summary><ShieldCheck size={17}/>{tx('Tentang materi dan rujukan ilmiah', 'About content and scientific references')}</summary><p>{tx('Teks ringkas dan cek pemahaman V4.5 disusun untuk demo edukasi; belum ditinjau pakar mata pelajaran. Nilai di sini dihitung lokal dari dua kunci jawaban buatan sendiri, bukan nilai resmi/sertifikasi. Bank 65 soal V4.3 tetap draft terpisah.', 'V4.5 lesson summaries and checks are independently authored educational drafts, not subject-expert approved. Scores are calculated locally using two authored answer keys, not official assessment. The 65-question V4.3 bank remains a separate draft.')}</p><a href={unit.reference} target="_blank" rel="noopener noreferrer">{tx('Sumber rujukan: OpenStax Chemistry 2e (opsional)', 'Reference: OpenStax Chemistry 2e (optional)')}</a></details>
      </section>
    </div>
    <div className="v45-footer"><span><ShieldCheck size={16}/>{tx('Progres hanya di browser ini, tidak disinkronkan ke akun.', 'Progress is stored in this browser only, not synced to an account.')}</span><button onClick={reset}>{tx('Reset progres jalur', 'Reset journey progress')}</button></div>
  </main>;
}
