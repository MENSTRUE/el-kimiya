import { learningStorage as elkLearningStorage } from '../v8/learningStorage';
import { useEffect, useState } from 'react';
import {
  ArrowRight, BookOpen, BrainCircuit, CheckCircle2, ClipboardCheck,
  FlaskConical, GraduationCap, Layers3, Library, NotebookPen,
  PenLine, ShieldCheck, Sparkles, Target, BookMarked,
} from 'lucide-react';
import { BrandMark } from './BrandMark';
import { COURSE } from '../data/course-v45';
import { useLanguage } from '../lib/language';
import { usePlatform } from '../v8/platform';
// ELKIMIYA_V80_LOCAL_PROFILE
import { useStoredState } from '../lib/storage';

type Destination = 'dashboard' | 'library' | 'practice' | 'mission' | 'flashcards' | 'notes' | 'progress' | 'tutor' | 'settings' | 'molecules';
type Goal = 'read' | 'practice' | 'research' | 'explore';
type Snapshot = { attempted: number; correct: number; lessons: number; bookmarkedBooks: number; reviewedCards: number };

function objectFromStorage(key: string): Record<string, unknown> {
  try {
    const value: unknown = JSON.parse(elkLearningStorage.getItem(key) || '{}');
    return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
  } catch { return {}; }
}
function numberOrZero(value: unknown): number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 ? value : 0;
}
function readActualProgress(): Snapshot {
  const currentQuiz = objectFromStorage('elkimiya.quizbank.v63.progress');
  const legacyQuiz = objectFromStorage('elk.stats');
  const journey = objectFromStorage('elk.v45.learningPath.1');
  const pages = objectFromStorage('elk.v35.bookPages');
  const ratings = objectFromStorage('elk.v44.cardRatings');
  const currentAttempted = numberOrZero(currentQuiz.attempted);
  const oldAttempted = numberOrZero(legacyQuiz.answered);
  const attempted = Math.max(currentAttempted, oldAttempted);
  const correct = attempted === currentAttempted ? numberOrZero(currentQuiz.correct) : numberOrZero(legacyQuiz.correct);
  const completedIds = Array.isArray(journey.passed) ? journey.passed.filter((id): id is string => typeof id === 'string') : [];
  return {
    attempted,
    correct: Math.min(correct, attempted),
    lessons: COURSE.filter(unit => completedIds.includes(unit.id)).length,
    bookmarkedBooks: Object.values(pages).filter(v => typeof v === 'number' && Number.isFinite(v) && v > 0).length,
    reviewedCards: Object.keys(ratings).length,
  };
}

export function GuestLearningSpaceV71({onGo, notesCount, flashcardsCount}: {
  onGo: (page: Destination) => void;
  notesCount: number;
  flashcardsCount: number;
}) {
  const { language } = useLanguage();
  const {user} = usePlatform();
  const en = language === 'en';
  const tx = (id: string, english: string) => en ? english : id;
  const [nickname, setNickname] = useStoredState('elk.profile.nickname.v71', '');
  const [draftNickname, setDraftNickname] = useState(nickname);
  const [editing, setEditing] = useState(false);
  const [goal, setGoal] = useStoredState<Goal>('elk.profile.goal.v71', 'read');
  const [progress, setProgress] = useState<Snapshot>(readActualProgress);
  useEffect(() => {
    const refresh = () => setProgress(readActualProgress());
    window.addEventListener('storage', refresh);
    window.addEventListener('elk:v45-progress', refresh);
    return () => {
      window.removeEventListener('storage', refresh);
      window.removeEventListener('elk:v45-progress', refresh);
    };
  }, []);
  const name = user?.displayName || user?.email || nickname.trim() || tx('Penjelajah Kimia', 'Chemistry Explorer');
  const initial = name.slice(0, 1).toUpperCase();
  const completePercent = Math.round(100 * progress.lessons / Math.max(COURSE.length, 1));
  const accuracy = progress.attempted ? `${Math.round(100 * progress.correct / progress.attempted)}%` : '—';
  const goals = [
    {id: 'read' as Goal, icon: BookOpen, idLabel: 'Baca materi', enLabel: 'Read lessons', target: 'library' as Destination},
    {id: 'practice' as Goal, icon: ClipboardCheck, idLabel: 'Latihan soal', enLabel: 'Practice', target: 'practice' as Destination},
    {id: 'research' as Goal, icon: FlaskConical, idLabel: 'Misi penelitian', enLabel: 'Research mission', target: 'mission' as Destination},
    {id: 'explore' as Goal, icon: Sparkles, idLabel: 'Jelajahi molekul', enLabel: 'Explore molecules', target: 'molecules' as Destination},
  ];
  const selectedGoal = goals.find(item => item.id === goal) || goals[0];
  const metrics = [
    {id: 'lessons', icon: GraduationCap, value: `${progress.lessons}/${COURSE.length}`, label: tx('Materi selesai', 'Lessons completed')},
    {id: 'quiz', icon: ClipboardCheck, value: String(progress.attempted), label: tx('Soal dikerjakan', 'Questions answered')},
    {id: 'accuracy', icon: CheckCircle2, value: accuracy, label: tx('Akurasi latihan', 'Practice accuracy')},
    {id: 'notes', icon: NotebookPen, value: String(notesCount), label: tx('Catatan tersimpan', 'Saved notes')},
  ];
  const modules = [
    {id: 'library' as Destination, icon: Library, title: tx('Perpustakaan', 'Library'), description: tx('Baca materi kimia bilingual.', 'Read bilingual chemistry lessons.')},
    {id: 'practice' as Destination, icon: Target, title: tx('Latihan', 'Practice'), description: tx('Kerjakan soal dan periksa pemahaman.', 'Check your understanding with questions.')},
    {id: 'mission' as Destination, icon: FlaskConical, title: tx('Misi Penelitian', 'Research Mission'), description: tx('Bangun hipotesis dan laporan.', 'Build a hypothesis and report.')},
    {id: 'flashcards' as Destination, icon: Layers3, title: tx('Flashcard', 'Flashcards'), description: tx(`${flashcardsCount} kartu pribadi · ${progress.reviewedCards} kartu diulas`, `${flashcardsCount} personal cards · ${progress.reviewedCards} reviewed`)},
    {id: 'notes' as Destination, icon: NotebookPen, title: tx('Catatan Saya', 'My Notes'), description: tx('Tinjau teks yang sudah kamu simpan.', 'Revisit passages you saved.')},
    {id: 'tutor' as Destination, icon: BrainCircuit, title: tx('Tutor AI', 'AI Tutor'), description: tx('Ajukan pertanyaan dan periksa sumber AI.', 'Ask questions and verify the AI route.')},
  ];
  return (
    <main className="guest71" aria-label={tx('Ruang belajar tamu pribadi', 'Personal guest learning space')}>
      <section className="guest71-hero">
        <div className="guest71-hero-top">
          <BrandMark compact inverted size="sm" />
          <span className="guest71-private"><ShieldCheck size={15}/>{user ? tx('AKTIVITAS · PERANGKAT INI', 'ACTIVITY · THIS DEVICE') : tx('MODE TAMU · LOKAL', 'GUEST MODE · LOCAL')}</span>
        </div>
        <div className="guest71-identity">
          <span className="guest71-avatar" aria-hidden="true">{initial}</span>
          <div>
            <span className="guest71-eyebrow">{tx('RUANG BELAJAR PRIBADI', 'YOUR LEARNING SPACE')}</span>
            <h1>{tx('Halo,', 'Hello,')} {name}.</h1>
            <p>{tx('Setiap langkah kecil dalam belajar kimia layak dicatat.', 'Every small step in learning chemistry matters.')}</p>
          </div>
        </div>
        {!user && (editing ? (
          <form className="guest71-name-editor" onSubmit={event => { event.preventDefault(); setNickname(draftNickname.trim().slice(0,24)); setEditing(false); }}>
            <label htmlFor="elk-guest-name">{tx('Nama panggilan (tersimpan di perangkat)', 'Nickname (saved on this device)')}</label>
            <div>
              <input id="elk-guest-name" maxLength={24} autoFocus value={draftNickname} onChange={event=>setDraftNickname(event.target.value)} placeholder={tx('Misal: Peneliti Muda', 'E.g. Young Scholar')}/>
              <button type="submit">{tx('Simpan', 'Save')}</button>
              <button type="button" className="guest71-cancel" onClick={()=>{setDraftNickname(nickname);setEditing(false);}}>{tx('Batal', 'Cancel')}</button>
            </div>
          </form>
        ) : (
          <button className="guest71-edit" onClick={()=>{setDraftNickname(nickname);setEditing(true);}}><PenLine size={15}/>{tx('Atur nama panggilan', 'Set your nickname')}</button>
        ))}
        <div className="guest71-journey">
          <div><span>{tx('PROGRES JALUR BELAJAR', 'LEARNING JOURNEY')}</span><strong>{completePercent}%</strong></div>
          <div className="guest71-track" role="progressbar" aria-valuenow={completePercent} aria-valuemin={0} aria-valuemax={100} aria-label={tx('Materi selesai', 'Lessons completed')}><i style={{width:`${completePercent}%`}}/></div>
          <small>{tx(`${progress.lessons} dari ${COURSE.length} materi selesai`, `${progress.lessons} of ${COURSE.length} lessons completed`)}</small>
        </div>
        <div className="guest71-hero-actions">
          <button onClick={()=>onGo(selectedGoal.target)}>{tx('Lanjut belajar', 'Continue learning')} <ArrowRight size={17}/></button>
          <button className="guest71-outline" onClick={()=>onGo('progress')}>{tx('Lihat progres', 'View progress')}</button>
        </div>
      </section>

      <div className="guest71-section-title"><span>{tx('AKTIVITAS NYATA', 'REAL ACTIVITY')}</span><small>{tx('Data perangkat ini · tanpa angka demo', 'This device · no demo figures')}</small></div>
      <section className="guest71-metrics" aria-label={tx('Statistik belajar', 'Learning statistics')}>
        {metrics.map(entry => { const Icon = entry.icon; return <article key={entry.id}><Icon size={21}/><strong>{entry.value}</strong><span>{entry.label}</span></article>; })}
      </section>

      <div className="guest71-section-title"><span>{tx('TUJUAN BELAJAR', 'YOUR LEARNING FOCUS')}</span><small>{tx('Bisa diubah kapan saja', 'Change anytime')}</small></div>
      <div className="guest71-goals" role="group" aria-label={tx('Pilih fokus belajar', 'Choose a learning focus')}>
        {goals.map(entry => {const Icon = entry.icon; return <button key={entry.id} aria-pressed={entry.id===goal} className={entry.id===goal?'selected':''} onClick={()=>setGoal(entry.id)}><Icon size={18}/><span>{en?entry.enLabel:entry.idLabel}</span>{entry.id===goal&&<CheckCircle2 size={16}/>}</button>;})}
      </div>

      <div className="guest71-section-title"><span>{tx('MODUL BELAJARMU', 'YOUR LEARNING MODULES')}</span></div>
      <section className="guest71-modules">
        {modules.map(module=>{const Icon=module.icon;return <button className="guest71-module" key={module.id} onClick={()=>onGo(module.id)}><span className="guest71-module-icon"><Icon size={21}/></span><span className="guest71-module-copy"><strong>{module.title}</strong><small>{module.description}</small></span><ArrowRight size={18}/></button>;})}
      </section>

      <section className="guest71-footer">
        <BookMarked size={20}/>
        <p>{tx('Nama panggilan, tujuan belajar, catatan, dan progres tersimpan lokal. Gunakan panel akun untuk membuat atau memulihkan cadangan secara eksplisit.', 'Nickname, goals, notes and progress are stored locally. Use the account panel to explicitly create or restore a backup.')}</p>
        <button onClick={()=>onGo('settings')}>{tx('Pengaturan', 'Settings')} <ArrowRight size={16}/></button>
      </section>
    </main>
  );
}
