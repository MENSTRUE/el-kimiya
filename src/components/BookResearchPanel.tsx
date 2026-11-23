import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowDownUp, ArrowLeft, ArrowRight, BookMarked, BookOpen, Bookmark,
  BookmarkCheck, BrainCircuit, Check, ChevronDown, ChevronLeft, ChevronRight,
  Clock3, ExternalLink, FileSearch, FileText, FolderOpen, Heart, LibraryBig,
  Search, ShieldCheck, Sparkles, Upload, X,
} from 'lucide-react';
import { sourceBooks, type SourceBook } from '../data/books';
import { identifyLocalBook, expectedLocalBookCount } from '../lib/localBookFiles';
import { contextForPrompt, parsePrivateIndex, searchIndex, type PrivateIndex } from '../lib/bookSearch';
import '../library-v35.css';
import { t } from '../lib/language';
import { PrivateReadingWorkspace } from './PrivateReadingWorkspace';
import { LibraryEmptyStateV64 } from './LibraryEmptyStateV64'; // ELKIMIYA_V64_ADAPTIVE_LIBRARY
import { useLanguage } from '../lib/language';

type Props = { askAbout: (text: string) => void; notify: (text: string) => void };
type ReadingMap = Record<string, number>;
type ShelfMode = 'all' | 'saved' | 'continue';
type AutoStatus = 'checking' | 'connected' | 'manual';
const STORE_PAGES = 'elk.v35.bookPages';
const STORE_FAVORITES = 'elk.v35.favorites';
const STORE_RECENT = 'elk.v35.recent';
const roleLabels: Record<SourceBook['role'], string> = {
  'Main chemistry course': 'Kimia dasar',
  'Islamic integration': 'Sains & Islam',
  'Chemistry applications': 'Kimia terapan',
  'Supporting reference': 'Referensi ilmiah',
};
const palettes: Record<string, string> = {
  'kuncoro-2021': 'ocean', 'kimia-dasar': 'pearl', 'yahdi-2020': 'copper',
  'cucu-2022': 'sage', 'uii-2017': 'plum', 'kemenag-2013': 'sand',
  'kusuma-2020': 'night', 'water-2024': 'aqua',
};
const getBook = (id: string) => sourceBooks.find(book => book.id === id);
const boundPage = (page: number, max: number) => Math.min(max, Math.max(1, Number.isFinite(page) ? Math.round(page) : 1));

function readPages(): ReadingMap {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(STORE_PAGES) || '{}');
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    const pages: ReadingMap = {};
    for (const book of sourceBooks) {
      const value = (parsed as Record<string, unknown>)[book.id];
      if (typeof value === 'number' && Number.isFinite(value)) pages[book.id] = boundPage(value, book.pdfPages);
    }
    return pages;
  } catch { return {}; }
}
function readFavorites(): string[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(STORE_FAVORITES) || '[]');
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string' && !!getBook(id)) : [];
  } catch { return []; }
}
function readRecent(): string | null {
  try {
    const id = localStorage.getItem(STORE_RECENT);
    return id && getBook(id) ? id : null;
  } catch { return null; }
}
function BookCover({ book, large = false }: { book: SourceBook; large?: boolean }) {
  return (
    <span className={`library35-cover library35-cover--${palettes[book.id] || 'ocean'} ${large ? 'library35-cover--large' : ''}`} aria-hidden="true">
      <span className="library35-cover-spine" />
      <span className="library35-cover-top">EL-KĪMIYĀ <span>·</span> {t("REFERENCE LIBRARY")}</span>
      <span className="library35-cover-emblem"><Sparkles size={large ? 26 : 19} strokeWidth={1.5} /></span>
      <span className="library35-cover-name">{book.title}</span>
      <span className="library35-cover-foot">{t("CHEMISTRY")} <span>✦</span> {t("KNOWLEDGE")}</span>
    </span>
  );
}

export function BookResearchPanel({ askAbout, notify }: Props) {
const { language } = useLanguage();
const en = language === 'en';
const tx = (id: string, english: string) => en ? english : id;
  const [pdfs, setPdfs] = useState<Record<string, string>>({});
  const [autoStatus, setAutoStatus] = useState<AutoStatus>('checking');
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [shelfMode, setShelfMode] = useState<ShelfMode>('all');
  const [sort, setSort] = useState('recommended');
  const [pages, setPages] = useState<ReadingMap>(readPages);
  const [favorites, setFavorites] = useState<string[]>(readFavorites);
  const [recent, setRecent] = useState<string | null>(readRecent);
  const [readerId, setReaderId] = useState<string | null>(null);
  const [readerPage, setReaderPage] = useState(1);
  const [manualPage, setManualPage] = useState('1');
  const [message, setMessage] = useState('');
  const [index, setIndex] = useState<PrivateIndex | null>(null);
  const [showResearch, setShowResearch] = useState(false);
  const [question, setQuestion] = useState('What is the difference between ionic and covalent bonding?');
  const [consent, setConsent] = useState(false);
  const folderInput = useRef<HTMLInputElement>(null);
  const selectedInput = useRef<HTMLInputElement>(null);
  const localUrls = useRef<Record<string, string>>({});
  const [selectedForUpload, setSelectedForUpload] = useState(sourceBooks[0]?.id ?? 'kuncoro-2021');

  useEffect(() => {
    const controller = new AbortController();
    const host = window.location.hostname;
    if (!import.meta.env.DEV || !['localhost', '127.0.0.1'].includes(host)) {
      setAutoStatus('manual');
      return;
    }
    void fetch('/__elkimiya_local_books__/manifest.json', {
      signal: controller.signal, cache: 'no-store', credentials: 'same-origin',
    }).then(async res => {
      if (!res.ok) throw new Error('Private PDF bridge unavailable');
      return res.json() as Promise<unknown>;
    }).then(payload => {
      if (controller.signal.aborted) return;
      const data = payload && typeof payload === 'object' ? payload as Record<string, unknown> : null;
      const rows = data?.schemaVersion === 1 && Array.isArray(data.books) ? data.books : [];
      const knownIds = new Set(sourceBooks.map(book => book.id));
      const found: Record<string, string> = {};
      for (const row of rows) {
        if (!row || typeof row !== 'object') continue;
        const item = row as Record<string, unknown>;
        if (typeof item.bookId !== 'string' || typeof item.url !== 'string') continue;
        if (!knownIds.has(item.bookId) || item.url !== `/__elkimiya_local_books__/pdf/${item.bookId}`) continue;
        found[item.bookId] = item.url;
      }
      if (Object.keys(found).length) {
        setPdfs(previous => ({ ...found, ...previous }));
        setAutoStatus('connected');
      } else setAutoStatus('manual');
    }).catch(() => { if (!controller.signal.aborted) setAutoStatus('manual'); });
    return () => controller.abort();
  }, []);

  // Optional JSON index is served only by the loopback-only Vite dev plugin.
  useEffect(() => {
    if (!import.meta.env.DEV || !['localhost', '127.0.0.1'].includes(window.location.hostname)) return;
    const controller = new AbortController();
    void fetch('/__elkimiya_local_books__/index.json', {
      signal:controller.signal, cache:'no-store', credentials:'same-origin',
    }).then(async response => {
      if (!response.ok) return null;
      return parsePrivateIndex(await response.json());
    }).then(data => {if (data && !controller.signal.aborted) setIndex(data);})
      .catch(() => undefined);
    return () => controller.abort();
  }, []);

  useEffect(() => {
    folderInput.current?.setAttribute('webkitdirectory', '');
    folderInput.current?.setAttribute('directory', '');
    return () => Object.values(localUrls.current).forEach(url => URL.revokeObjectURL(url));
  }, []);
  useEffect(() => { try { localStorage.setItem(STORE_PAGES, JSON.stringify(pages)); } catch { /* storage unavailable */ } }, [pages]);
  useEffect(() => { try { localStorage.setItem(STORE_FAVORITES, JSON.stringify(favorites)); } catch { /* storage unavailable */ } }, [favorites]);
  useEffect(() => { try { recent ? localStorage.setItem(STORE_RECENT, recent) : localStorage.removeItem(STORE_RECENT); } catch { /* storage unavailable */ } }, [recent]);

  useEffect(() => { setManualPage(String(readerPage)); }, [readerPage]);

  const connectedCount = sourceBooks.filter(book => !!pdfs[book.id]).length;
  const lastBook = recent && pdfs[recent] ? getBook(recent) : undefined;
  const featured = lastBook || sourceBooks.find(book => pdfs[book.id]) || sourceBooks[0];
  const currentBook = readerId ? getBook(readerId) : null;
  const currentUrl = readerId ? pdfs[readerId] : undefined;
  const rememberedPage = currentBook ? pages[currentBook.id] || 1 : 1;
  const researchHits = useMemo(() => index ? searchIndex(index, question, 5) : [], [index, question]);
  const visibleBooks = useMemo(() => {
    const lower = query.trim().toLocaleLowerCase('id');
    const filtered = sourceBooks.filter(book => {
      const matchCategory = category === 'All' || book.role === category;
      const matchShelf = shelfMode === 'all' || (shelfMode === 'saved' ? favorites.includes(book.id) : !!pages[book.id]);
      const matchQuery = !lower || `${book.title} ${book.author} ${book.role} ${book.topics.join(' ')}`.toLocaleLowerCase('id').includes(lower);
      return matchCategory && matchShelf && matchQuery;
    });
    if (sort === 'title') return filtered.sort((a, b) => a.title.localeCompare(b.title, 'id'));
    if (sort === 'length') return filtered.sort((a, b) => a.pdfPages - b.pdfPages);
    return filtered;
  }, [category, favorites, pages, query, shelfMode, sort]);

  const attachFile = (bookId: string, file: File) => {
    const current = localUrls.current[bookId];
    if (current) URL.revokeObjectURL(current);
    const url = URL.createObjectURL(file);
    localUrls.current[bookId] = url;
    setPdfs(previous => ({ ...previous, [bookId]: url }));
    return url;
  };
  const openBook = (bookId: string) => {
    if (!pdfs[bookId]) {
      setSelectedForUpload(bookId);
      setMessage('PDF belum terhubung. Gunakan tombol “Buka PDF sendiri” pada kartu buku ini.');
      return;
    }
    setReaderId(bookId);
    setReaderPage(pages[bookId] || 1);
    setRecent(bookId);
    setMessage('');
  };
  const toggleFavorite = (id: string) => setFavorites(previous => previous.includes(id) ? previous.filter(x => x !== id) : [...previous, id]);
  const connectFolder = (files: FileList | null) => {
    if (!files?.length) return;
    const matched = new Map<string, File>();
    for (const file of Array.from(files)) {
      const id = identifyLocalBook(file.name);
      if (id && file.size <= 80_000_000 && !matched.has(id)) matched.set(id, file);
    }
    for (const [id, file] of matched) attachFile(id, file);
    setMessage(matched.size ? `${matched.size} PDF terhubung dari folder lokal. Tidak ada file yang diunggah ke cloud.` : 'Tidak ditemukan PDF yang cocok dengan katalog El-Kīmiyā.');
  };
  const uploadSelected = (file?: File) => {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.pdf') || file.size > 80_000_000) {
      setMessage('Pilih file .pdf dengan ukuran maksimal 80 MB.'); return;
    }
    const detected = identifyLocalBook(file.name);
    if (detected && detected !== selectedForUpload) {
      setMessage('File itu cocok dengan kartu buku lain. Pilih kartu yang sesuai.'); return;
    }
    attachFile(selectedForUpload, file);
    setMessage('PDF berhasil dihubungkan, hanya di browser lokal.');
    setReaderId(selectedForUpload);
    setReaderPage(pages[selectedForUpload] || 1);
    setRecent(selectedForUpload);
  };
  const loadIndex = async (file?: File) => {
    if (!file) return;
    if (file.size > 15_000_000) { setMessage('Indeks terlalu besar (maksimum 15 MB).'); return; }
    try {
      const data = parsePrivateIndex(JSON.parse(await file.text()));
      setIndex(data);
      setMessage(`Indeks privat terbaca: ${data.pages.length} halaman. Tidak diunggah ke cloud.`);
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Format indeks tidak didukung.'); }
  };
  const prepareTutor = () => {
    if (!consent || !researchHits.length) return;
    askAbout(contextForPrompt(question, researchHits));
    notify('Kutipan disiapkan untuk AI Tutor. Periksa kembali nomor halaman pada PDF asli.');
  };
  const savePage = () => {
    if (!currentBook) return;
    const page = boundPage(readerPage, currentBook.pdfPages);
    setPages(previous => ({ ...previous, [currentBook.id]: page }));
    setMessage(`Halaman ${page} disimpan untuk ${currentBook.title}.`);
  };
  const navigatePage = (next: number) => currentBook && setReaderPage(boundPage(next, currentBook.pdfPages));
  const applyManualPage = () => currentBook && setReaderPage(boundPage(Number(manualPage), currentBook.pdfPages));
  const chooseOwnPdf = (id: string) => { setSelectedForUpload(id); selectedInput.current?.click(); };

  // Full-page reading workspace, not a modal layered on top of the library.
  if (currentBook && currentUrl) {
    return <PrivateReadingWorkspace
      book={currentBook}
      url={currentUrl}
      page={readerPage}
      savedPage={pages[currentBook.id] || 1}
      favorite={favorites.includes(currentBook.id)}
      privateIndex={index}
      onPageChange={(next) => {
        setReaderPage(next);
        setPages(previous => ({ ...previous, [currentBook.id]: next }));
      }}
      onBookmark={savePage}
      onFavorite={() => toggleFavorite(currentBook.id)}
      onBack={() => setReaderId(null)}
      onAsk={askAbout}
    />;
  }

  return (
    <section className="library35" aria-label="Perpustakaan kimia pribadi El-Kīmiyā">
      <input ref={selectedInput} className="library35-file-input" type="file" accept=".pdf,application/pdf" onChange={event => { uploadSelected(event.target.files?.[0]); event.target.value = ''; }} aria-label="Pilih PDF dari laptop" />
      <input ref={folderInput} className="library35-file-input" type="file" multiple onChange={event => { connectFolder(event.target.files); event.target.value = ''; }} aria-label="Pilih folder PDF pribadi" />

      <div className="library35-heading">
        <div><span className="library35-overline"><span /> {t("THE KNOWLEDGE COLLECTION · EL-KĪMIYĀ")}</span><h2>{t("Your chemistry,")} <em>{t("beautifully organized.")}</em></h2><p>{t("Delapan referensi yang kamu miliki, satu ruang belajar untuk menemukan dan memahami kimia.")}</p></div>
        <span className="library35-private"><ShieldCheck size={16} /> {t("Personal & private")}</span>
      </div>

      {connectedCount === 0 ? <LibraryEmptyStateV64
        english={en}
        checking={autoStatus === 'checking'}
        count={sourceBooks.length}
        onChooseFolder={() => folderInput.current?.click()}
        onBrowseCatalog={() => document.getElementById('elkimiya-v64-catalog')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
      /> : <div className="library35-hero">
        <div className="library35-hero-copy">
          <div className="library35-pill"><Sparkles size={14} /> {t("YOUR PRIVATE READING STUDIO")}</div>
          <h3>{lastBook ? tx('Lanjutkan dari halaman terakhir.', 'Continue where you left off.') : tx('Buku siap dibaca.', 'Your book is ready to read.')}</h3>
          <p>{t("Eksplorasi kimia dengan buku sungguhan. Buka, tandai halaman, dan temukan referensi tanpa meninggalkan El-Kīmiyā.")}</p>
          <div className="library35-hero-actions">
            <button className="library35-btn library35-btn--light" onClick={() => featured && openBook(featured.id)} disabled={!featured || !pdfs[featured.id]}><BookOpen size={17} /> {lastBook ? tx('Lanjutkan membaca', 'Continue reading') : tx('Mulai membaca', 'Start reading')} <ArrowRight size={16} /></button>
            <a href="#progress" className="library64-inline-link">{tx('Lihat progres', 'View progress')} <ArrowRight size={15}/></a>
            <span className="library35-hero-hint">{lastBook ? `${lastBook.title} · halaman tersimpan ${pages[lastBook.id] || 1}` : 'Pilih buku untuk mulai membaca'}</span>
          </div>
          <div className="library35-metrics">
            <div><strong>{connectedCount}<small>/{expectedLocalBookCount}</small></strong><span>{t("Buku terhubung")}</span></div>
            <div><strong>{Object.keys(pages).length}</strong><span>{t("Progres tersimpan")}</span></div>
            <div><strong>{favorites.length}</strong><span>{t("Buku favorit")}</span></div>
          </div>
        </div>
        {featured && <div className="library35-hero-art"><div className="library35-hero-orbit"/><div className="library35-hero-book"><BookCover book={featured} large /></div><span className="library35-hero-annotation">{t("CURATED READING")} <span>01 / 08</span></span></div>}
        </div>}

      <div className="library35-connect" role="status">
        <span className={`library35-connect-icon ${connectedCount ? 'online' : ''}`}>{connectedCount ? <Check size={19} /> : <FolderOpen size={19} />}</span>
        <div><strong>{autoStatus === 'checking' ? tx('Memeriksa PDF lokal…', 'Checking local PDFs…') : connectedCount ? tx(`${connectedCount} PDF terhubung · Siap dibaca`, `${connectedCount} PDFs connected · Ready to read`) : tx('Pilih PDF milikmu dari perangkat', 'Choose your own PDFs from this device')}</strong><p>{autoStatus === 'connected' ? tx('PDF dari server development lokal; tidak dipublikasikan di website.', 'PDFs from the local development server; not published online.') : tx('Pilih folder atau buka PDF pada kartu katalog. Berkas tidak diunggah ke server.', 'Choose a folder or open a PDF on a catalogue card. Files are not uploaded to the server.')}</p></div>
        <button className="library35-connect-button" onClick={() => folderInput.current?.click()}><FolderOpen size={16}/> {t("Pilih folder")} <ChevronDown size={15}/></button>
      </div>

      <div className="library35-discover-head" id="elkimiya-v64-catalog"><div><span className="library35-overline">{t("EXPLORE THE SHELVES")}</span><h3>{t("Find something worth reading.")}</h3></div><span>{visibleBooks.length} {t("dari")} {sourceBooks.length} {t("referensi")}</span></div>
      <div className="library35-toolbar">
        <label className="library35-search"><Search size={19} /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Cari judul, penulis, atau topik kimia..." aria-label="Cari buku" />{query && <button aria-label={t("Hapus pencarian")} onClick={() => setQuery('')}><X size={16}/></button>}</label>
        <label className="library35-sort"><ArrowDownUp size={17}/><select aria-label="Urutkan buku" value={sort} onChange={event => setSort(event.target.value)}><option value="recommended">{t("Urutan katalog")}</option><option value="title">{t("Judul A–Z")}</option><option value="length">{t("Halaman paling sedikit")}</option></select></label>
      </div>
      <div className="library35-filters" role="group" aria-label="Filter kategori buku">
        {['All', ...Object.keys(roleLabels)].map(role => <button key={role} className={category === role ? 'active' : ''} onClick={() => setCategory(role)}>{role === 'All' ? t('Semua buku') : t(roleLabels[role as SourceBook['role']])}</button>)}
      </div>
      <div className="library35-shelf-tabs" role="group" aria-label="Filter koleksi">
        <button className={shelfMode === 'all' ? 'active' : ''} onClick={() => setShelfMode('all')}><LibraryBig size={15}/> {t("Koleksi")}</button>
        <button className={shelfMode === 'continue' ? 'active' : ''} onClick={() => setShelfMode('continue')}><Clock3 size={15}/> {t("Sedang dibaca")}</button>
        <button className={shelfMode === 'saved' ? 'active' : ''} onClick={() => setShelfMode('saved')}><Heart size={15}/> {t("Favorit")}</button>
      </div>

      {visibleBooks.length ? <div className="library35-grid">{visibleBooks.map((book, i) => {
        const ready = !!pdfs[book.id];
        const remembered = pages[book.id];
        const isFavorite = favorites.includes(book.id);
        return <article key={book.id} className="library35-card" style={{ animationDelay: `${Math.min(i, 7) * 45}ms` }}>
          <button className="library35-card-main" onClick={() => ready ? openBook(book.id) : chooseOwnPdf(book.id)} title={ready ? tx('Baca buku ini', 'Read this book') : tx('Pilih PDF pribadi untuk buku ini', 'Select your own PDF for this book')}>
            <span className="library35-card-cover"><BookCover book={book}/></span>
            <span className="library35-card-body"><span className="library35-card-role">{t(roleLabels[book.role])}</span><strong className="library35-card-title">{book.title}</strong><span className="library35-card-author">{book.author}</span><span className="library35-card-meta"><span><BookOpen size={13}/> {book.pdfPages} {t("halaman")}</span><span className={ready ? 'ready' : 'pending'}>{t(ready ? '● Siap dibaca' : '○ PDF belum ada')}</span></span>{remembered && <span className="library35-card-progress"><span><span style={{ width: `${Math.max(4, remembered / book.pdfPages * 100)}%` }} /></span><small>{t("Penanda: halaman")} {remembered}</small></span>}<span className="library35-card-cta">{t(ready ? (remembered ? 'Lanjutkan membaca' : 'Baca sekarang') : 'Hubungkan PDF')} <ArrowRight size={16}/></span></span>
          </button>
          <button className={`library35-card-favorite ${isFavorite ? 'active' : ''}`} onClick={() => toggleFavorite(book.id)} aria-label={isFavorite ? `Hapus ${book.title} dari favorit` : `Tambahkan ${book.title} ke favorit`} title={isFavorite ? 'Hapus favorit' : 'Tambah favorit'}><Heart size={17} fill={isFavorite ? 'currentColor' : 'none'}/></button>
          {!ready && <button className="library35-card-attach" onClick={() => chooseOwnPdf(book.id)}><Upload size={13}/> {t("Buka PDF sendiri")}</button>}
        </article>;
      })}</div> : <div className="library35-empty"><FileSearch size={34}/><h4>{t("Belum ada buku yang cocok")}</h4><p>{t("Coba kata kunci lain, ubah filter, atau tambahkan favorit untuk mengisi rak ini.")}</p><button onClick={() => { setQuery(''); setCategory('All'); setShelfMode('all'); }}>{t("Tampilkan semua buku")}</button></div>}
      {message && <div className="library35-toast" role="status"><Check size={16}/>{message}<button onClick={() => setMessage('')} aria-label="Tutup pesan"><X size={15}/></button></div>}

      <div className="library35-research">
        <div><span className="library35-overline">{t("FROM READING TO UNDERSTANDING")}</span><h3>{index ? tx('Tanya bukumu berdasarkan sumber.', 'Ask your books with evidence.') : tx('Cari isi buku setelah membuat indeks.', 'Search inside books after building an index.')}</h3><p>{index ? tx('Indeks PDF tersedia. Pilih halaman relevan dan tinjau kutipan sebelum bertanya kepada AI.', 'Your PDF index is ready. Review page-level excerpts before asking AI.') : tx('Pencarian isi PDF memerlukan indeks pribadi di laptop atau JSON yang kamu impor sendiri. Katalog saja belum menyediakan isi buku.', 'Searching PDF contents needs a local index or your own imported JSON. Catalogue entries do not contain full book text.')}</p><span><ShieldCheck size={16}/>{tx('PDF tetap privat · kutipan hanya atas persetujuanmu', 'PDFs remain private · quotes require your consent')}</span></div>
        <button className="library35-btn library35-btn--outline" onClick={() => setShowResearch(value => !value)} aria-expanded={showResearch}><FileSearch size={17}/>{showResearch ? 'Tutup pencarian' : 'Buka pencarian buku'}<ChevronDown size={16} className={showResearch ? 'library35-rotate' : ''}/></button>
      </div>
      {showResearch && <section className="library35-research-panel" aria-label="Cari isi PDF dengan indeks privat">
        <div className="library35-research-setup"><div><FileText size={22}/><div><strong>{t("Indeks PDF pribadi")}</strong><p>{t("Indeks otomatis dari folder private tersedia saat server lokal berjalan. Jika belum ada, buat dengan")} <code>python scripts/build_private_index.py</code>.</p></div></div><label className="library35-btn library35-btn--outline"><Upload size={16}/> {t("Import JSON")}<input type="file" accept=".json,application/json" onChange={event => { void loadIndex(event.target.files?.[0]); event.target.value = ''; }} /></label></div>
        <label className="library35-question">{t("Tanyakan topik dari buku")}<textarea value={question} onChange={event => setQuestion(event.target.value)} maxLength={500} rows={2} placeholder="Misalnya: apa perbedaan ikatan ion dan kovalen?" /></label>
        <p className="library35-index-status">{index ? `${index.pages.length} halaman terindeks · ${researchHits.length} cuplikan relevan` : 'Belum ada indeks pribadi yang dimuat.'}</p>
        {index && <><div className="library35-hits">{researchHits.map(hit => <article key={`${hit.bookId}-${hit.pdfPage}`}><strong>{hit.title} {t("· PDF halaman")} {hit.pdfPage}</strong><p>{hit.text.slice(0, 340)}{hit.text.length > 340 ? '…' : ''}</p></article>)}</div><label className="library35-consent"><input type="checkbox" checked={consent} onChange={event => setConsent(event.target.checked)} /> {t("Saya setuju cuplikan buku terpilih dapat dikirim ke layanan AI cloud untuk menjawab pertanyaan ini.")}</label><button className="library35-btn library35-btn--dark" disabled={!consent || !researchHits.length} onClick={prepareTutor}><BrainCircuit size={17}/> {t("Siapkan pertanyaan bersumber")} <ArrowRight size={16}/></button><p className="library35-footnote">{t("Periksa nomor halaman dan kebenaran kutipan pada PDF asli. Sumber dan tafsir bukan hal yang sama.")}</p></>}
      </section>}
      <p className="library35-rights"><ShieldCheck size={14}/> {t("PDF tetap pribadi. Katalog ini bukan izin untuk mempublikasikan atau menjual buku berhak cipta.")}</p>


    </section>
  );
}
