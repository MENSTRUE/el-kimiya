import { useEffect, useState } from 'react';
import { ArrowRight, BookOpen, BrainCircuit, CheckCircle2, FlaskConical, GraduationCap, Layers3, Target, Trophy } from 'lucide-react';
import { useLanguage } from '../lib/language';
import { COURSE } from '../data/course-v45';
import '../real-progress-v65.css';

type Destination = 'practice' | 'library' | 'flashcards' | 'molecules' | 'progress' | 'tutor';
type Snapshot = { attempted: number; correct: number; lessons: number; bookmarkedBooks: number; reviewedCards: number; recentIds: string[] };
const empty: Snapshot = { attempted: 0, correct: 0, lessons: 0, bookmarkedBooks: 0, reviewedCards: 0, recentIds: [] };
function safeObject(key: string): Record<string, unknown> {
  try { const parsed: unknown = JSON.parse(localStorage.getItem(key) || '{}'); return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed as Record<string, unknown> : {}; }
  catch { return {}; }
}
function naturalCount(v: unknown): number { return typeof v === 'number' && Number.isSafeInteger(v) && v >= 0 ? v : 0; }
function snapshot(): Snapshot {
  try {
    const quiz = safeObject('elkimiya.quizbank.v63.progress');
    const old = safeObject('elk.stats');
    const journey = safeObject('elk.v45.learningPath.1');
    const pages = safeObject('elk.v35.bookPages');
    const ratings = safeObject('elk.v44.cardRatings');
    const fresh = naturalCount(quiz.attempted);
    const oldCount = naturalCount(old.answered);
    const attempted = Math.max(fresh, oldCount); // Avoid double-counting the same quiz attempt.
    const correct = attempted === fresh ? naturalCount(quiz.correct) : naturalCount(old.correct);
    const passed = Array.isArray(journey.passed) ? journey.passed.filter((v): v is string => typeof v === 'string') : [];
    const history = Array.isArray(quiz.history) ? quiz.history as Record<string, unknown>[] : [];
    return {
      attempted, correct: Math.min(correct, attempted),
      lessons: COURSE.filter(u => passed.includes(u.id)).length,
      bookmarkedBooks: Object.values(pages).filter(v => typeof v === 'number' && Number.isFinite(v) && v > 0).length,
      reviewedCards: Object.keys(ratings).length,
      recentIds: history.filter(x => typeof x.id === 'string').slice(-3).map(x => String(x.id)),
    };
  } catch { return empty; }
}
export function DashboardRealV65({ onGo }: { onGo: (page: Destination) => void }) {
  const { language } = useLanguage(); const en = language === 'en';
  const tx = (id: string, english: string) => en ? english : id;
  const [data, setData] = useState<Snapshot>(snapshot);
  useEffect(() => {
    const refresh = () => setData(snapshot());
    window.addEventListener('storage', refresh);
    window.addEventListener('elk:v45-progress', refresh);
    return () => { window.removeEventListener('storage', refresh); window.removeEventListener('elk:v45-progress', refresh); };
  }, []);
  const accuracy = data.attempted ? Math.round(100 * data.correct / data.attempted) : 0;
  const lessonPercent = Math.round(100 * data.lessons / Math.max(1, COURSE.length));
  const started = data.attempted > 0 || data.lessons > 0 || data.bookmarkedBooks > 0 || data.reviewedCards > 0;
  return <main className="real65-dashboard" aria-label={tx('Dashboard progres asli', 'Real learning progress dashboard')}>
    <section className="real65-hero">
      <div><span className="real65-kicker"><GraduationCap size={16}/>{tx('RUANG BELAJAR · PROGRES TERUKUR', 'LEARNING SPACE · REAL PROGRESS')}</span>
        <h2>{started ? tx('Lanjutkan perjalanan ilmiahmu.', 'Keep your scientific curiosity going.') : tx('Mulai dari satu pertanyaan.', 'Start with one question.')}</h2>
        <p>{started ? tx('Semua angka di bawah diambil dari aktivitas yang tersimpan pada browser ini—bukan data demonstrasi.', 'Every number below comes from learning activity saved in this browser—not demo data.') : tx('Belum ada aktivitas yang tercatat di browser ini. Pilih materi atau soal untuk memulai; tidak ada progres palsu.', 'No learning activity has been recorded in this browser yet. Begin a lesson or question; no fabricated progress.')}</p>
        <div className="real65-hero-actions"><button onClick={() => onGo('practice')}><Target size={17}/>{tx('Mulai latihan soal', 'Start practicing')}<ArrowRight size={16}/></button><button className="real65-outline" onClick={() => onGo('library')}><BookOpen size={17}/>{tx('Buka perpustakaan', 'Open library')}</button></div>
      </div>
      <div className="real65-hero-side"><span>{tx('PROGRES JALUR BELAJAR', 'LEARNING JOURNEY PROGRESS')}</span><strong>{data.lessons}<small>/{COURSE.length}</small></strong><div className="real65-meter"><i style={{ width: `${lessonPercent}%` }}/></div><small>{tx('Materi selesai berdasarkan riwayat belajar', 'Completed lessons from saved learning records')}</small></div>
    </section>
    <div className="real65-section-head"><span>{tx('DATA BELAJAR NYATA', 'YOUR ACTUAL LEARNING DATA')}</span><button onClick={() => onGo('progress')}>{tx('Lihat progres lengkap', 'View all progress')} <ArrowRight size={16}/></button></div>
    <div className="real65-metrics">
      <article className="real65-metric amber"><Target size={23}/><strong>{data.attempted}</strong><span>{tx('Jawaban diperiksa', 'Answers checked')}</span></article>
      <article className="real65-metric green"><CheckCircle2 size={23}/><strong>{data.attempted ? `${accuracy}%` : '—'}</strong><span>{tx('Akurasi latihan', 'Practice accuracy')}</span></article>
      <article className="real65-metric violet"><Trophy size={23}/><strong>{data.lessons}<small>/{COURSE.length}</small></strong><span>{tx('Materi diselesaikan', 'Lessons completed')}</span></article>
      <article className="real65-metric coral"><BookOpen size={23}/><strong>{data.bookmarkedBooks}</strong><span>{tx('Buku dengan penanda', 'Books with bookmarks')}</span></article>
    </div>
    <div className="real65-workspaces">
      <article className="real65-workspace"><span className="real65-work-icon"><FlaskConical size={24}/></span><h3>{tx('Laboratorium Latihan', 'Practice Laboratory')}</h3><p>{tx('Latihan pilihan ganda A–D dengan kunci dan pembahasan. Semua hasil tersimpan di browser.', 'A–D multiple-choice questions with answers and explanations. Results stay in your browser.')}</p><button onClick={() => onGo('practice')}>{tx('Kerjakan soal', 'Solve questions')} <ArrowRight size={17}/></button></article>
      <article className="real65-workspace"><span className="real65-work-icon"><Layers3 size={24}/></span><h3>{tx('Kartu Hafalan', 'Flashcards')}</h3><p>{tx('Belajar istilah kimia sebelum menghafalnya. Buka kembali kartu untuk latihan aktif.', 'Understand chemistry concepts before memorizing. Review cards for active recall.')}</p><button onClick={() => onGo('flashcards')}>{tx('Buka kartu hafalan', 'Review flashcards')} <ArrowRight size={17}/></button></article>
      <article className="real65-workspace"><span className="real65-work-icon"><BrainCircuit size={24}/></span><h3>{tx('Molekul & Eksperimen', 'Molecules & Experiments')}</h3><p>{tx('Rakit struktur molekul dan jelajahi simulasi ilmiah edukatif dengan batasan yang jelas.', 'Build molecules and explore clearly labeled educational scientific simulations.')}</p><button onClick={() => onGo('molecules')}>{tx('Buka laboratorium', 'Open laboratory')} <ArrowRight size={17}/></button></article>
    </div>
    <p className="real65-privacy">{tx(`Progres bersifat lokal di perangkat ini; bukan akun cloud. ${data.reviewedCards} kartu memiliki status review tersimpan.`, `Progress is browser-local, not a cloud account. ${data.reviewedCards} cards have saved review status.`)}</p>
  </main>;
}
