import { learningStorage as elkLearningStorage } from '../v8/learningStorage';
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  ArrowRight, Atom, BookOpen, BookmarkPlus, Check, CheckCircle2,
  ChevronLeft, ChevronRight, CircleHelp, Database, ExternalLink,
  Filter, FlaskConical, Layers3, Lightbulb, LoaderCircle,
  RefreshCw, RotateCcw, Search, ShieldCheck, Sparkles, X,
} from 'lucide-react';
import { useLanguage } from '../lib/language';
import { readLearningV47 } from '../lib/learningSourceV47'; // ELKIMIYA_V47_PUBLIC_DATA
import type { StudyCard } from '../data/learning';
import '../study-v44.css';

type Lang = 'id' | 'en';
type Raw = Record<string, unknown>;
type Topic = { id: string; title: string; description: string; questionCount: number; flashcardCount: number };
type Flashcard = { id: string; topicId: string; front: string; back: string; sourceUrl?: string; sourceName?: string; custom?: boolean };
type Quiz = { id: string; topicId: string; prompt: string; choices: { id: string; text: string }[] };
const asObj = (v: unknown): Raw => v && typeof v === 'object' && !Array.isArray(v) ? v as Raw : {};
const str = (v: unknown, fallback = ''): string => typeof v === 'string' ? v : fallback;
const num = (v: unknown): number => typeof v === 'number' && Number.isFinite(v) ? v : 0;
const field = (obj: Raw, ...keys: string[]) => { for (const k of keys) if (obj[k] !== undefined && obj[k] !== null) return obj[k]; return undefined; };
const sourceLink = 'https://openstax.org/details/books/chemistry-2e';

async function readApi(path: string, signal?: AbortSignal): Promise<unknown> {
  return readLearningV47(path, signal);
}
async function listApi(path: string, key: string, lang: Lang, signal?: AbortSignal): Promise<unknown[]> {
  // Try permitted API limits, then best-effort pagination. No guessed POST routes.
  let first: unknown[] | null = null;
  let usedLimit: number | undefined;
  for (const limit of [100, 50, 25, undefined] as const) {
    const url = `${path}?lang=${lang}${limit ? `&limit=${limit}` : ''}`;
    try {
      const data = asObj(await readApi(url, signal));
      if (Array.isArray(data[key])) {
        first = data[key] as unknown[];
        usedLimit = limit;
        break;
      }
    } catch (error) {
      if (signal?.aborted) throw error;
      if (!limit) throw error;
    }
  }
  if (!first) return [];
  const seen = new Set(first.map((x, i) => str(field(asObj(x), 'id', 'card_id', 'question_id'), `${i}`)));
  const all = [...first];
  const pageLimit = usedLimit || first.length;
  if (!pageLimit || first.length < pageLimit) return all;
  for (let step = 0; step < 8 && all.length < 200; step++) {
    const url = `${path}?lang=${lang}&limit=${pageLimit}&offset=${all.length}`;
    let page: unknown[] = [];
    try {
      const response = asObj(await readApi(url, signal));
      page = Array.isArray(response[key]) ? response[key] as unknown[] : [];
    } catch (error) {
      if (signal?.aborted) throw error;
      break; // offset unsupported by the local API: present an honest partial warning.
    }
    let added = 0;
    for (const raw of page) {
      const id = str(field(asObj(raw), 'id', 'card_id', 'question_id'));
      if (!id || seen.has(id)) continue;
      seen.add(id); all.push(raw); added++;
    }
    if (added === 0 || page.length < pageLimit) break;
  }
  return all;
}

function normalizeTopics(items: unknown[]): Topic[] {
  return items.map((raw, i) => {
    const obj = asObj(raw);
    return {
      id: str(field(obj, 'id', 'topic_id', 'slug'), `topic-${i}`),
      title: str(field(obj, 'title', 'name', 'label'), `Topic ${i + 1}`),
      description: str(field(obj, 'summary', 'description', 'overview', 'intro')),
      questionCount: num(field(obj, 'question_count', 'questions_count', 'questions')),
      flashcardCount: num(field(obj, 'flashcard_count', 'flashcards_count', 'flashcards')),
    };
  });
}
function normalizeCards(items: unknown[]): Flashcard[] {
  return items.map((raw, i) => {
    const o = asObj(raw);
    const firstSource = Array.isArray(o.sources) && o.sources.length ? asObj(o.sources[0]) : {};
    return {
      id: str(field(o, 'id', 'card_id'), `card-${i}`),
      topicId: str(field(o, 'topic_id', 'topic'), 'general'),
      front: str(field(o, 'front', 'question', 'prompt')),
      back: str(field(o, 'back', 'answer', 'definition')),
      sourceUrl: str(firstSource.url),
      sourceName: str(firstSource.title),
    };
  }).filter(c => c.front && c.back);
}
function normalizeQuestions(items: unknown[]): Quiz[] {
  return items.map((raw, i) => {
    const obj = asObj(raw);
    const choicesRaw = field(obj, 'choices', 'options');
    const choices: Quiz['choices'] = Array.isArray(choicesRaw)
      ? choicesRaw.map((x: unknown, j: number) => {
          const o = asObj(x);
          return typeof x === 'string'
            ? { id: String.fromCharCode(65 + j), text: x }
            : { id: str(field(o, 'id', 'choice_id', 'key'), String.fromCharCode(65 + j)), text: str(field(o, 'text', 'label', 'content', 'value')) };
        }).filter(c => c.text)
      : [];
    return {
      id: str(field(obj, 'id', 'question_id'), `question-${i}`),
      topicId: str(field(obj, 'topic_id', 'topic'), 'general'),
      prompt: str(field(obj, 'prompt', 'question', 'text')),
      choices,
    };
  }).filter(q => q.prompt && q.choices.length > 0);
}
function useCopy() {
  const { language } = useLanguage();
  const lang: Lang = language === 'en' ? 'en' : 'id';
  return { lang, en: lang === 'en' };
}
function EmptyState({ title, description, retry }: { title: string; description: string; retry?: () => void }) {
  const {en}=useCopy();
  return <div className="v44-empty" role="status"><CircleHelp size={25}/><strong>{title}</strong><p>{description}</p>{retry && <button className="v44-button v44-button-light" onClick={retry}><RefreshCw size={15}/> {en?'Retry':'Coba lagi'}</button>}</div>;
}
function Stat({ title, value, icon }: { title: string; value: number | string; icon: ReactNode }) {
  return <div className="v44-stat"><span className="v44-stat-icon">{icon}</span><div><strong>{value}</strong><small>{title}</small></div></div>;
}
function Eyebrow({ children }: { children: ReactNode }) { return <span className="v44-eyebrow">{children}</span>; }

export function StudyLearningV44({ onOpenLab, onOpenFlashcards }: { onOpenLab: () => void; onOpenFlashcards: () => void }) {
  const { lang, en } = useCopy();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [questions, setQuestions] = useState<Quiz[]>([]);
  const [counts, setCounts] = useState({ topics: 0, questions: 0, flashcards: 0 });
  const [selectedTopic, setSelectedTopic] = useState('all');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<Record<string, string>>({});
  const [reveal, setReveal] = useState<Record<string, boolean>>({});
  const [visibleCount, setVisibleCount] = useState(12);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [reload, setReload] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError(''); setSelected({}); setReveal({}); setVisibleCount(12);
    const load = async () => {
      try {
        const [catalog, questionsData, health] = await Promise.all([
          readApi(`/catalog?lang=${lang}`, controller.signal),
          listApi('/questions', 'questions', lang, controller.signal),
          readApi('/health', controller.signal),
        ]);
        if (controller.signal.aborted) return;
        const c = asObj(catalog), h = asObj(health);
        setTopics(normalizeTopics(Array.isArray(c.topics) ? c.topics : []));
        setQuestions(normalizeQuestions(questionsData));
        setCounts({ topics: num(h.topics), questions: num(h.questions), flashcards: num(h.flashcards) });
      } catch (e) { if (!controller.signal.aborted) setError(e instanceof Error ? e.message : String(e)); }
      finally { if (!controller.signal.aborted) setLoading(false); }
    };
    void load();
    return () => controller.abort();
  }, [lang, reload]);
  const visibleTopics = useMemo(() => topics.filter(topic => `${topic.title} ${topic.description}`.toLowerCase().includes(query.toLowerCase())), [topics, query]);
  const visibleQuestions = useMemo(() => questions.filter(q => selectedTopic === 'all' || q.topicId === selectedTopic), [questions, selectedTopic]);
  const selectedName = topics.find(t => t.id === selectedTopic)?.title || (en ? 'All topics' : 'Semua topik');
  return <main className="v44-root" aria-label={en?'Learning center':'Pusat belajar'}>
    <div className="v44-hero v44-learning-hero">
      <div><Eyebrow><BookOpen size={15}/> {en ? 'LEARNING STUDIO · LIVE CONTENT' : 'STUDIO PEMBELAJARAN · DATA API'}</Eyebrow>
        <h2>{en ? 'Build understanding, one concept at a time.' : 'Belajar kimia, satu konsep setiap kali.'}</h2>
        <p>{en ? 'Browse the V4.3 learning catalog, choose a topic, and practice with the real question bank.' : 'Jelajahi katalog pembelajaran V4.3, pilih topik, dan berlatih menggunakan bank soal dari backend.'}</p>
        <div className="v44-hero-actions"><button className="v44-button v44-button-primary" onClick={onOpenFlashcards}><Layers3 size={17}/>{en ? 'Review flashcards' : 'Latihan kartu hafalan'}<ArrowRight size={15}/></button><button className="v44-button v44-button-ghost" onClick={onOpenLab}><FlaskConical size={17}/>{en ? 'Interactive lab' : 'Laboratorium interaktif'}</button></div>
      </div><div className="v44-hero-symbol" aria-hidden="true"><span>H</span><b>₂</b><span>O</span></div>
    </div>
    <div className="v44-stats"><Stat icon={<BookOpen size={22}/>} value={counts.topics || '—'} title={en ? 'Learning topics' : 'Topik pembelajaran'}/><Stat icon={<Lightbulb size={22}/>} value={counts.questions || '—'} title={en ? 'Draft questions' : 'Soal draft'}/><Stat icon={<Layers3 size={22}/>} value={counts.flashcards || '—'} title={en ? 'Learning cards' : 'Kartu hafalan'}/></div>
    <div className="v44-editorial" role="note"><ShieldCheck size={19}/><span>{en ? 'Editorial status: linked to OpenStax/IUPAC, but still awaiting subject-expert review. Do not present these as expert-approved questions.' : 'Status editorial: tersedia referensi OpenStax/IUPAC, tetapi materi dan soal masih membutuhkan tinjauan pakar kimia. Belum boleh diklaim tersertifikasi ahli.'}</span><a href={sourceLink} target="_blank" rel="noopener noreferrer">OpenStax <ExternalLink size={13}/></a></div>
    <div className="v44-section-head"><div><Eyebrow><Database size={15}/> {en ? 'CURRICULUM' : 'KURIKULUM'}</Eyebrow><h3>{en ? 'Explore the topics' : 'Jelajahi topik'}</h3><p>{en ? 'Organized by chemistry fundamentals' : 'Tersusun berdasarkan fondasi ilmu kimia'}</p></div><label className="v44-search"><Search size={16}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder={en ? 'Search topics...' : 'Cari topik...'} aria-label={en ? 'Search topics' : 'Cari topik'}/></label></div>
    {loading ? <div className="v44-loading"><LoaderCircle className="v44-spin" size={22}/>{en ? 'Loading learning data...' : 'Memuat data pembelajaran...'}</div> : error ? <EmptyState title={en ? 'Learning API not available' : 'Learning API belum terhubung'} description={error} retry={() => setReload(n => n + 1)}/> : <>
      <div className="v44-topic-grid"><button className={`v44-topic v44-topic-all ${selectedTopic === 'all' ? 'is-selected' : ''}`} onClick={() => { setSelectedTopic('all'); setVisibleCount(12); }}><span className="v44-topic-icon"><Atom size={22}/></span><span className="v44-topic-copy"><strong>{en ? 'All questions' : 'Semua pertanyaan'}</strong><small>{en ? 'See the whole practice bank' : 'Lihat seluruh bank latihan'}</small></span><ArrowRight size={16}/></button>{visibleTopics.map((topic, i) => <button key={topic.id} className={`v44-topic ${selectedTopic === topic.id ? 'is-selected' : ''}`} onClick={() => { setSelectedTopic(topic.id); setVisibleCount(12); }} aria-pressed={selectedTopic === topic.id}><span className="v44-topic-number">{String(i + 1).padStart(2, '0')}</span><span className="v44-topic-copy"><strong>{topic.title}</strong><small>{topic.description || (en ? 'Learn core concepts' : 'Pelajari konsep dasar')}</small></span><ArrowRight size={16}/></button>)}</div>
      <section className="v44-bank" aria-label={en?'Question bank':'Bank soal'}><div className="v44-section-head"><div><Eyebrow><Lightbulb size={15}/> {en ? 'QUESTION BANK' : 'BANK SOAL'}</Eyebrow><h3>{selectedName}</h3><p>{en ? 'Read and select an answer. Scoring is available in the interactive lab; these V4.3 questions are displayed without exposing answer keys.' : 'Baca soal dan pilih opsi. Penilaian tersedia pada lab interaktif; bank soal V4.3 ini tidak menampilkan kunci jawaban sebelum tersedia integrasi penilaian yang terverifikasi.'}</p></div><span className="v44-count-label">{visibleQuestions.length} / {counts.questions || questions.length} {en ? 'loaded' : 'termuat'}</span></div>
        {!visibleQuestions.length ? <EmptyState title={en ? 'No questions found' : 'Soal belum ditemukan'} description={en ? 'Try another topic or check the API response.' : 'Coba topik lain atau periksa respons API.'}/> : <div className="v44-quiz-grid">{visibleQuestions.slice(0, visibleCount).map((q, index) => <article className="v44-question" key={q.id}><div className="v44-question-top"><span>{en ? 'QUESTION' : 'SOAL'} {String(index + 1).padStart(2, '0')}</span><small>{topics.find(t => t.id === q.topicId)?.title || q.topicId}</small></div><h4>{q.prompt}</h4><div className="v44-choices">{q.choices.map((choice, j) => <button type="button" key={`${q.id}-${choice.id}-${j}`} className={selected[q.id] === choice.id ? 'is-selected' : ''} aria-pressed={selected[q.id] === choice.id} onClick={() => setSelected(s => ({ ...s, [q.id]: choice.id }))}><b>{String.fromCharCode(65 + j)}</b><span>{choice.text}</span>{selected[q.id] === choice.id && <Check size={15}/>}</button>)}</div><div className="v44-question-foot"><span>{selected[q.id] ? (en ? 'Answer selected · not graded' : 'Jawaban dipilih · belum dinilai') : (en ? 'Select an option' : 'Pilih salah satu opsi')}</span><button type="button" onClick={() => setReveal(p => ({ ...p, [q.id]: !p[q.id] }))}><CircleHelp size={14}/>{en ? 'Source status' : 'Status sumber'}</button></div>{reveal[q.id] && <div className="v44-source-hint">{en ? 'Source-linked editorial draft. Scientific accuracy requires expert review.' : 'Draft editorial dengan referensi. Akurasi ilmiah tetap membutuhkan review pakar.'} <a href={sourceLink} target="_blank" rel="noopener noreferrer">OpenStax <ExternalLink size={12}/></a></div>}</article>)}</div>}
        {visibleQuestions.length > visibleCount && <button className="v44-load-more" onClick={() => setVisibleCount(c => c + 12)}><ArrowRight size={16}/>{en ? `Load more questions (${visibleQuestions.length - visibleCount} left)` : `Tampilkan soal berikutnya (${visibleQuestions.length - visibleCount} tersisa)`}</button>}
        {questions.length < counts.questions && <p className="v44-notice">{en ? 'The API returned a partial page of questions; this view does not claim the full bank is loaded.' : 'API hanya mengirim sebagian bank soal; tampilan tidak mengklaim semua soal sudah termuat.'}</p>}
      </section>
    </>}
  </main>;
}

type ReviewRating = 'again' | 'hard' | 'known';
const ratingKey = 'elk.v44.review.v1';
function getRatings(): Record<string, ReviewRating> {
  try { const parsed: unknown = JSON.parse(elkLearningStorage.getItem(ratingKey) || '{}'); return asObj(parsed) as Record<string, ReviewRating>; }
  catch { return {}; }
}
export function StudyFlashcardsV44({ customCards, onReview }: { customCards: StudyCard[]; onReview: () => void }) {
  const { lang, en } = useCopy();
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [expected, setExpected] = useState(0);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [reload, setReload] = useState(0);
  const [query, setQuery] = useState('');
  const [topic, setTopic] = useState('all');
  const [mode, setMode] = useState<'grid' | 'focus'>('grid');
  const [flipped, setFlipped] = useState<Record<string, boolean>>({});
  const [focusIndex, setFocusIndex] = useState(0);
  const [ratings, setRatings] = useState<Record<string, ReviewRating>>(getRatings);
  useEffect(() => {
    const controller = new AbortController(); setLoading(true); setError(''); setFlipped({}); setFocusIndex(0);
    const load = async () => {
      try {
        const [raw, health] = await Promise.all([listApi('/flashcards', 'cards', lang, controller.signal), readApi('/health', controller.signal)]);
        if (controller.signal.aborted) return;
        setCards(normalizeCards(raw)); setExpected(num(asObj(health).flashcards));
      } catch (e) { if (!controller.signal.aborted) setError(e instanceof Error ? e.message : String(e)); }
      finally { if (!controller.signal.aborted) setLoading(false); }
    };
    void load(); return () => controller.abort();
  }, [lang, reload]);
  const extras = useMemo(() => customCards.map(c => ({ id: `custom:${c.id}`, topicId: c.topic || 'custom', front: c.question, back: `${c.answer}${c.detail ? `\n${c.detail}` : ''}`, custom: true })), [customCards]);
  const combined = useMemo(() => [...cards, ...extras], [cards, extras]);
  const topics = useMemo(() => Array.from(new Set(combined.map(c => c.topicId))).sort(), [combined]);
  const filtered = useMemo(() => combined.filter(c => (topic === 'all' || c.topicId === topic) && `${c.front} ${c.back} ${c.topicId}`.toLowerCase().includes(query.toLowerCase())), [combined, query, topic]);
  const current = filtered[Math.min(focusIndex, Math.max(0, filtered.length - 1))];
  const known = combined.filter(c => ratings[c.id] === 'known').length;
  const review = combined.filter(c => ratings[c.id] === 'again' || ratings[c.id] === 'hard').length;
  const rate = (card: Flashcard, status: ReviewRating) => {
    const changed = ratings[card.id] !== status;
    const next = { ...ratings, [card.id]: status };
    setRatings(next); try { elkLearningStorage.setItem(ratingKey, JSON.stringify(next)); } catch { /* optional local persistence */ }
    if (changed) onReview();
    if (mode === 'focus') { setFlipped(prev => ({ ...prev, [card.id]: false })); setFocusIndex(i => (i + 1) % Math.max(1, filtered.length)); }
  };
  const cardBody = (card: Flashcard, index: number, focused = false) => {
    const isFlipped = Boolean(flipped[card.id]);
    return <article key={card.id} className={`v44-study-card ${focused ? 'v44-study-card-focus' : ''}`}>
      <div className="v44-card-top"><span>{card.topicId.replace(/[-_]/g, ' ')}</span><span>{String(index + 1).padStart(2, '0')}</span></div>
      <button type="button" className="v44-flip-surface" aria-pressed={isFlipped} aria-label={isFlipped ? (en ? 'Show question' : 'Tampilkan pertanyaan') : (en ? 'Reveal answer' : 'Tampilkan jawaban')} onClick={() => setFlipped(p => ({ ...p, [card.id]: !p[card.id] }))}>
        <span className="v44-flip-label">{isFlipped ? (en ? 'ANSWER / JAWABAN' : 'JAWABAN / ANSWER') : (en ? 'QUESTION / PERTANYAAN' : 'PERTANYAAN / QUESTION')}</span><strong>{isFlipped ? card.back : card.front}</strong><span className="v44-flip-hint"><RotateCcw size={15}/>{isFlipped ? (en ? 'Tap for question' : 'Ketuk untuk pertanyaan') : (en ? 'Tap to reveal' : 'Ketuk untuk melihat jawaban')}</span>
      </button>
      <div className="v44-card-footer"><span>{card.custom ? (en ? 'Personal card' : 'Kartu pribadi') : (en ? 'V4.3 bank · source-linked draft' : 'Bank V4.3 · draft bereferensi')}</span>{card.sourceUrl && <a href={card.sourceUrl} title={card.sourceName || 'Source'} target="_blank" rel="noopener noreferrer"><ExternalLink size={13}/>{en ? 'Source' : 'Sumber'}</a>}</div>
      <div className="v44-rating-actions"><button disabled={!isFlipped} onClick={() => rate(card, 'again')} className={ratings[card.id] === 'again' ? 'active-again' : ''}><RefreshCw size={15}/>{en ? 'Again' : 'Ulang'}</button><button disabled={!isFlipped} onClick={() => rate(card, 'hard')} className={ratings[card.id] === 'hard' ? 'active-hard' : ''}><CircleHelp size={15}/>{en ? 'Hard' : 'Sulit'}</button><button disabled={!isFlipped} onClick={() => rate(card, 'known')} className={ratings[card.id] === 'known' ? 'active-known' : ''}><Check size={15}/>{en ? 'Known' : 'Paham'}</button></div>
    </article>;
  };
  return <main className="v44-root" aria-label={en?'Flashcard study':'Belajar kartu hafalan'}>
    <div className="v44-hero v44-flash-hero"><div><Eyebrow><Layers3 size={15}/>{en ? 'ACTIVE RECALL · CHEMISTRY' : 'LATIHAN MENGINGAT · KIMIA'}</Eyebrow><h2>{en ? 'Review as cards. Remember with confidence.' : 'Belajar dengan kartu. Ingat lebih percaya diri.'}</h2><p>{en ? 'Real flashcards from the V4.3 learning API, shown in a clean, responsive grid. Progress is saved locally.' : 'Flashcard asli dari API pembelajaran V4.3, disajikan sebagai kartu yang rapi dan responsif. Penilaian disimpan di browser.'}</p></div><div className="v44-flash-art" aria-hidden="true"><span>H₂O</span><span>NaCl</span><span>CO₂</span></div></div>
    <div className="v44-stats"><Stat icon={<Layers3 size={22}/>} value={cards.length + extras.length || '—'} title={en ? 'Cards loaded' : 'Kartu termuat'}/><Stat icon={<CheckCircle2 size={22}/>} value={known} title={en ? 'Marked understood' : 'Ditandai paham'}/><Stat icon={<RefreshCw size={22}/>} value={review} title={en ? 'Needs review' : 'Perlu diulang'}/></div>
    <div className="v44-section-head"><div><Eyebrow><Filter size={15}/>{en ? 'YOUR DECK' : 'KOLEKSI KARTU'}</Eyebrow><h3>{en ? 'Choose what to study' : 'Pilih materi yang dipelajari'}</h3><p>{en ? 'Cards are revealed individually, never overlapped.' : 'Pertanyaan dan jawaban tampil bergantian, tidak saling menumpuk.'}</p></div><div className="v44-toolbar"><label className="v44-search"><Search size={16}/><input value={query} onChange={e => {setQuery(e.target.value); setFocusIndex(0);}} placeholder={en ? 'Search cards...' : 'Cari kartu...'} /></label><select aria-label={en ? 'Filter topic' : 'Filter topik'} value={topic} onChange={e => {setTopic(e.target.value);setFocusIndex(0);}}><option value="all">{en ? 'All topics' : 'Semua topik'}</option>{topics.map(t => <option value={t} key={t}>{t.replace(/[-_]/g, ' ')}</option>)}</select></div></div>
    <div className="v44-tabs"><button onClick={() => setMode('grid')} className={mode === 'grid' ? 'is-active' : ''}><Layers3 size={16}/>{en ? 'Card grid' : 'Tampilan kartu'}</button><button onClick={() => setMode('focus')} className={mode === 'focus' ? 'is-active' : ''}><Sparkles size={16}/>{en ? 'Focus review' : 'Fokus belajar'}</button><span>{filtered.length} {en ? 'cards' : 'kartu'}</span></div>
    {loading ? <div className="v44-loading"><LoaderCircle className="v44-spin" size={22}/>{en ? 'Loading cards...' : 'Memuat kartu...'}</div> : error ? <EmptyState title={en?'Learning API offline':'API pembelajaran tidak terhubung'} description={error} retry={() => setReload(n => n + 1)}/> : <>
      {expected > 0 && cards.length < expected && <p className="v44-notice">{en ? `Only ${cards.length} of ${expected} backend cards were returned. Check the API pagination before claiming full coverage.` : `Baru ${cards.length} dari ${expected} kartu backend yang diterima. Periksa pagination API sebelum mengklaim semua kartu tersedia.`}</p>}
      {mode === 'grid' ? <div className="v44-flash-grid">{filtered.map((c, i) => cardBody(c, i))}</div> : current ? <div className="v44-focus"><div className="v44-focus-controls"><button onClick={() => { setFocusIndex(i => (i - 1 + filtered.length) % filtered.length); }}><ChevronLeft size={17}/>{en ? 'Previous' : 'Sebelumnya'}</button><span>{Math.min(focusIndex + 1, filtered.length)} / {filtered.length}</span><button onClick={() => {setFocusIndex(i => (i + 1) % filtered.length);}}>{en ? 'Next' : 'Berikutnya'}<ChevronRight size={17}/></button></div>{cardBody(current, Math.min(focusIndex, filtered.length - 1), true)}</div> : null}
      {!filtered.length && <EmptyState title={en ? 'No matching cards' : 'Tidak ada kartu yang cocok'} description={en ? 'Adjust the filter or search term.' : 'Ubah filter atau kata pencarian.'}/>}
      <p className="v44-footnote">{en ? 'Local review markings only. This version does not claim a validated spaced-repetition scheduler.' : 'Hanya status penilaian lokal. Versi ini belum mengklaim sistem spaced repetition yang tervalidasi.'}</p>
    </>}
  </main>;
}

type Compound = { id: string; nameId: string; nameEn: string; formula: string; mass: string; bondId: string; bondEn: string; descriptionId: string; descriptionEn: string; diagram: string[]; source: string };
const compounds: Compound[] = [
  { id: 'water', nameId: 'Air', nameEn: 'Water', formula: 'H₂O', mass: '18,015 g/mol', bondId: 'Kovalen polar', bondEn: 'Polar covalent', descriptionId: 'Molekul berbentuk bengkok; sudut H–O–H sekitar 104,5°.', descriptionEn: 'Bent molecular geometry; H–O–H angle is approximately 104.5°.', diagram: ['H', 'O', 'H'], source: 'https://openstax.org/books/chemistry-2e/pages/7-6-molecular-structure-and-polarity' },
  { id: 'carbon', nameId: 'Karbon dioksida', nameEn: 'Carbon dioxide', formula: 'CO₂', mass: '44,01 g/mol', bondId: 'Kovalen', bondEn: 'Covalent', descriptionId: 'Geometri linear; dipol ikatan C=O saling meniadakan.', descriptionEn: 'Linear geometry; opposing C=O bond dipoles cancel.', diagram: ['O', 'C', 'O'], source: 'https://openstax.org/books/chemistry-2e/pages/7-6-molecular-structure-and-polarity' },
  { id: 'salt', nameId: 'Natrium klorida', nameEn: 'Sodium chloride', formula: 'NaCl', mass: '58,44 g/mol', bondId: 'Kisi ionik', bondEn: 'Ionic lattice', descriptionId: 'Kristal ionik berulang, bukan satu molekul NaCl diskret.', descriptionEn: 'A repeating ionic lattice, not a discrete NaCl molecule.', diagram: ['Na⁺', 'Cl⁻', 'Na⁺'], source: 'https://openstax.org/books/chemistry-2e/pages/7-2-ionic-bonding' },
  { id: 'methane', nameId: 'Metana', nameEn: 'Methane', formula: 'CH₄', mass: '16,04 g/mol', bondId: 'Kovalen', bondEn: 'Covalent', descriptionId: 'Molekul sederhana dengan geometri tetrahedral di sekitar karbon.', descriptionEn: 'Simple molecule with tetrahedral geometry around carbon.', diagram: ['H', 'C', 'H'], source: 'https://openstax.org/books/chemistry-2e/pages/7-6-molecular-structure-and-polarity' },
  { id: 'ammonia', nameId: 'Amonia', nameEn: 'Ammonia', formula: 'NH₃', mass: '17,03 g/mol', bondId: 'Kovalen polar', bondEn: 'Polar covalent', descriptionId: 'Geometri piramida trigonal karena pasangan elektron bebas pada nitrogen.', descriptionEn: 'Trigonal pyramidal geometry due to the lone pair on nitrogen.', diagram: ['H', 'N', 'H'], source: 'https://openstax.org/books/chemistry-2e/pages/7-6-molecular-structure-and-polarity' },
  { id: 'oxygen', nameId: 'Oksigen', nameEn: 'Oxygen', formula: 'O₂', mass: '32,00 g/mol', bondId: 'Kovalen nonpolar', bondEn: 'Nonpolar covalent', descriptionId: 'Dua atom oksigen identik dihubungkan oleh ikatan rangkap.', descriptionEn: 'Two identical oxygen atoms joined by a double bond.', diagram: ['O', '=', 'O'], source: 'https://openstax.org/books/chemistry-2e/pages/7-3-lewis-symbols-and-structures' },
];
const atomicElements = [
  { symbol: 'H', number: 1, id: 'Hidrogen', en: 'Hydrogen', mass: '1,008' },
  { symbol: 'He', number: 2, id: 'Helium', en: 'Helium', mass: '4,003' },
  { symbol: 'C', number: 6, id: 'Karbon', en: 'Carbon', mass: '12,011' },
  { symbol: 'N', number: 7, id: 'Nitrogen', en: 'Nitrogen', mass: '14,007' },
  { symbol: 'O', number: 8, id: 'Oksigen', en: 'Oxygen', mass: '15,999' },
  { symbol: 'Na', number: 11, id: 'Natrium', en: 'Sodium', mass: '22,990' },
  { symbol: 'Mg', number: 12, id: 'Magnesium', en: 'Magnesium', mass: '24,305' },
  { symbol: 'Al', number: 13, id: 'Aluminium', en: 'Aluminum', mass: '26,982' },
  { symbol: 'Si', number: 14, id: 'Silikon', en: 'Silicon', mass: '28,085' },
  { symbol: 'P', number: 15, id: 'Fosfor', en: 'Phosphorus', mass: '30,974' },
  { symbol: 'S', number: 16, id: 'Sulfur', en: 'Sulfur', mass: '32,06' },
  { symbol: 'Cl', number: 17, id: 'Klorin', en: 'Chlorine', mass: '35,45' },
  { symbol: 'K', number: 19, id: 'Kalium', en: 'Potassium', mass: '39,098' },
  { symbol: 'Ca', number: 20, id: 'Kalsium', en: 'Calcium', mass: '40,078' },
];
export function ChemistryExplorerV44({ onSave, onAsk, onOpenMolecules }: { onSave: (title: string, content: string, source: string) => void; onAsk: (prompt: string) => void; onOpenMolecules: () => void }) {
  const { en } = useCopy();
  const [compound, setCompound] = useState('water');
  const [element, setElement] = useState('O');
  const [query, setQuery] = useState('');
  const item = compounds.find(c => c.id === compound)!;
  const elementData = atomicElements.find(e => e.symbol === element)!;
  const filtered = compounds.filter(c => `${c.nameId} ${c.nameEn} ${c.formula}`.toLowerCase().includes(query.toLowerCase()));
  const name = en ? item.nameEn : item.nameId;
  const desc = en ? item.descriptionEn : item.descriptionId;
  return <main className="v44-root" aria-label={en?'Chemistry explorer':'Eksplorasi kimia'}>
    <div className="v44-hero v44-explorer-hero"><div><Eyebrow><Atom size={15}/>{en ? 'MOLECULE EXPLORER' : 'EKSPLORASI MOLEKUL'}</Eyebrow><h2>{en ? 'From the formula to the concept.' : 'Dari rumus menuju pemahaman.'}</h2><p>{en ? 'Pick a familiar compound, compare its properties, and connect to verified source material.' : 'Pilih senyawa sehari-hari, bandingkan sifatnya, lalu pelajari referensi ilmiahnya.'}</p></div><button className="v44-button v44-button-primary" onClick={onOpenMolecules}><Database size={17}/>{en ? 'Open ChEMBL database' : 'Buka database ChEMBL'}<ArrowRight size={16}/></button></div>
    <div className="v44-section-head"><div><Eyebrow><Layers3 size={15}/>{en ? 'COMPOUND LIBRARY' : 'KOLEKSI SENYAWA'}</Eyebrow><h3>{en ? 'Choose a study card' : 'Pilih kartu senyawa'}</h3><p>{en ? 'Six illustrative examples · not an exhaustive database' : 'Enam contoh ilustrasi · bukan database lengkap'}</p></div><label className="v44-search"><Search size={16}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder={en ? 'Search compounds...' : 'Cari senyawa...'}/></label></div>
    <div className="v44-compound-grid">{filtered.map(c => <button key={c.id} className={`v44-compound-tile ${compound === c.id ? 'is-selected' : ''}`} aria-pressed={compound === c.id} onClick={() => setCompound(c.id)}><div className="v44-compound-tile-top"><span>{c.formula}</span><Atom size={18}/></div><strong>{en ? c.nameEn : c.nameId}</strong><small>{en ? c.bondEn : c.bondId}</small><span className="v44-compound-go">{en ? 'Explore' : 'Jelajahi'} <ArrowRight size={14}/></span></button>)}</div>
    <div className="v44-explorer-layout"><section className="v44-surface v44-stage-card"><div className="v44-panel-title"><div><Eyebrow><FlaskConical size={15}/>{en ? 'MOLECULE VIEW' : 'VISUAL MOLEKUL'}</Eyebrow><h3>{name} <span>· {item.formula}</span></h3></div><button className="v44-button v44-button-light" onClick={() => onSave(name, `${desc} ${en ? item.bondEn : item.bondId}. ${item.mass}`, item.source)}><BookmarkPlus size={16}/>{en ? 'Save note' : 'Simpan catatan'}</button></div>
      <div className="v44-diagram" role="img" aria-label={`${name}. ${desc}`}><div className={`v44-atoms v44-atoms-${item.id}`}>{item.diagram.map((symbol, i) => <span key={`${symbol}-${i}`} className={symbol === '=' ? 'v44-atom-bond' : `v44-atom v44-atom-${symbol.replace(/[^A-Za-z]/g, '').toLowerCase()}`}>{symbol}</span>)}</div><span className="v44-diagram-label">{en ? 'Symbolic atom chips · do not indicate bond angles or 3D geometry' : 'Simbol atom skematis · tidak menunjukkan sudut ikatan atau geometri 3D'}</span></div><p className="v44-compound-description">{desc}</p><div className="v44-property-grid"><div><small>{en ? 'Formula' : 'Rumus'}</small><strong>{item.formula}</strong></div><div><small>{en ? 'Molar mass' : 'Massa molar'}</small><strong>{en ? item.mass.replace(',', '.') : item.mass}</strong></div><div><small>{en ? 'Bonding' : 'Jenis ikatan'}</small><strong>{en ? item.bondEn : item.bondId}</strong></div></div><div className="v44-stage-actions"><a className="v44-button v44-button-light" href={item.source} target="_blank" rel="noopener noreferrer"><BookOpen size={16}/>{en ? 'Read reference' : 'Baca referensi'}<ExternalLink size={13}/></a><button className="v44-button v44-button-primary" onClick={() => onAsk(en ? `Explain the bonding and molecular geometry of ${item.nameEn} (${item.formula}). Cite what is known and distinguish concept diagrams from experimental results.` : `Jelaskan ikatan dan geometri ${item.nameId} (${item.formula}) dalam bahasa Indonesia. Bedakan ilustrasi dari hasil eksperimen.`)}><Sparkles size={16}/>{en ? 'Ask AI tutor' : 'Tanya tutor AI'}</button></div>
    </section><aside className="v44-surface v44-element-panel"><div className="v44-panel-title"><div><Eyebrow><Atom size={15}/>{en ? 'PERIODIC EXPLORER' : 'EKSPLORASI PERIODIK'}</Eyebrow><h3>{en ? 'Meet the elements' : 'Kenali unsur'}</h3></div></div><div className="v44-periodic-grid">{atomicElements.map(e => <button key={e.symbol} onClick={() => setElement(e.symbol)} className={element === e.symbol ? 'is-selected' : ''} aria-pressed={element === e.symbol}><small>{e.number}</small><strong>{e.symbol}</strong></button>)}</div><div className="v44-element-detail"><span className="v44-element-symbol">{elementData.symbol}</span><div><strong>{en ? elementData.en : elementData.id}</strong><span>{en ? 'Atomic number' : 'Nomor atom'}: {elementData.number}</span><span>{en ? 'Relative atomic mass ≈' : 'Massa atom relatif ≈'} {elementData.mass}</span></div></div><p className="v44-footnote">{en ? 'Atomic masses shown are rounded educational values.' : 'Massa atom ditampilkan dalam nilai pendekatan untuk belajar.'}</p><a className="v44-source-link" href="https://iupac.org/what-we-do/periodic-table-of-elements/" target="_blank" rel="noopener noreferrer">IUPAC {en ? 'periodic table' : 'tabel periodik'} <ExternalLink size={14}/></a></aside></div>
  </main>;
}
