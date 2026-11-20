/** El-Kīmiyā V3.6: first-party reading studio with local PDF.js canvas + private index.
 * PDFs stay on the local-only Vite bridge or in user-selected object URLs.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft, ArrowRight, BookOpen, Bookmark, BookmarkCheck, Check, ChevronLeft,
  ChevronRight, CircleHelp, Columns2, FileSearch, FileText, Heart, ListTree,
  LoaderCircle, Maximize, Minimize, Minus, Plus, Search, ShieldCheck, Sparkles, X,
} from 'lucide-react';
import { getDocument, GlobalWorkerOptions, type PDFDocumentProxy, type RenderTask } from 'pdfjs-dist';
import workerURL from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { type SourceBook } from '../data/books';
import { searchIndex, type PrivateIndex } from '../lib/bookSearch';
import '../library-v36.css';
import { t, LanguageSwitch } from '../lib/language';

GlobalWorkerOptions.workerSrc = workerURL;

type ReaderTab = 'contents' | 'search' | 'notes';
type ReadingMode = 'document' | 'text';
type OutlineItem = { title: string; page: number; depth: number };
type Props = {
  book: SourceBook;
  url: string;
  page: number;
  savedPage: number;
  favorite: boolean;
  privateIndex: PrivateIndex | null;
  onPageChange: (page: number) => void;
  onBookmark: () => void;
  onFavorite: () => void;
  onBack: () => void;
  onAsk: (prompt: string) => void;
};
function clamp(page: number, max: number): number {
  return Math.max(1, Math.min(max, Number.isFinite(page) ? Math.round(page) : 1));
}
async function readOutline(pdf: PDFDocumentProxy): Promise<OutlineItem[]> {
  const outline = await pdf.getOutline();
  const result: OutlineItem[] = [];
  const scan = async (items: typeof outline, depth: number) => {
    if (!items || depth > 5) return;
    for (const node of items) {
      let page = 1;
      try {
        const destination = typeof node.dest === 'string' ? await pdf.getDestination(node.dest) : node.dest;
        if (destination?.[0]) page = (await pdf.getPageIndex(destination[0])) + 1;
      } catch { /* Some PDF outlines have destinations we cannot resolve. */ }
      if (result.length < 120) result.push({ title: node.title || 'Bagian', page, depth });
      if (result.length < 120 && node.items?.length) await scan(node.items, depth + 1);
    }
  };
  await scan(outline, 0);
  return result;
}

export function PrivateReadingWorkspace({book, url, page, savedPage, favorite, privateIndex, onPageChange, onBookmark, onFavorite, onBack, onAsk}: Props) {
  const [pdfDocument, setDocument] = useState<PDFDocumentProxy | null>(null);
  const [total, setTotal] = useState(book.pdfPages);
  const [loading, setLoading] = useState(true);
  const [rendering, setRendering] = useState(false);
  const [error, setError] = useState('');
  const [outline, setOutline] = useState<OutlineItem[]>([]);
  const [sideTab, setSideTab] = useState<ReaderTab>('contents');
  const [readMode, setReadMode] = useState<ReadingMode>('document');
  const [search, setSearch] = useState('');
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [showSide, setShowSide] = useState(true);
  const [manual, setManual] = useState(String(page));
  const [notes, setNotes] = useState<Record<number,string>>(() => {
    try {
      const value: unknown = JSON.parse(localStorage.getItem(`elk.reader.notes.${book.id}`) || '{}');
      if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
      return Object.fromEntries(Object.entries(value).filter(([k,v])=> /^\d+$/.test(k) && typeof v === 'string' && v.length <= 2500).map(([k,v])=>[Number(k),v as string]));
    } catch { return {}; }
  });
  const [noteDraft, setNoteDraft] = useState('');
  const [noteStatus, setNoteStatus] = useState('');
  const [copied, setCopied] = useState(false);
  const [fullScreen, setFullScreen] = useState(false);
  const frameRef = useRef<HTMLElement>(null);
  const viewRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const taskRef = useRef<RenderTask | null>(null);
  const [availableWidth, setAvailableWidth] = useState(720);
  const pageCount = pdfDocument?.numPages || total;
  const validPage = clamp(page, pageCount);
  const indexedPages = useMemo(() => privateIndex?.pages.filter(item => item.bookId === book.id) ?? [], [privateIndex, book.id]);
  const selectedText = useMemo(() => indexedPages.find(item => item.pdfPage === validPage)?.text || '', [indexedPages, validPage]);
  const hits = useMemo(() => {
    if (!search.trim() || !privateIndex) return [];
    return searchIndex({schemaVersion:1, generatedAt:privateIndex.generatedAt, pages:indexedPages}, search, 25);
  }, [search, indexedPages, privateIndex]);

  useEffect(() => { setManual(String(validPage)); }, [validPage]);
  useEffect(() => { setNoteDraft(notes[validPage] || ''); }, [validPage, notes]);
  useEffect(() => {
    try { localStorage.setItem(`elk.reader.notes.${book.id}`, JSON.stringify(notes)); }
    catch { /* Storage disabled. Notes remain in memory for this session. */ }
  }, [notes,book.id]);
  useEffect(() => {
    const el = viewRef.current;
    if (!el) return;
    const observer = new ResizeObserver(entries => {
      if (entries[0]) setAvailableWidth(Math.max(320, Math.floor(entries[0].contentRect.width) - 80));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [showSide, readMode, pdfDocument]);

  useEffect(() => {
    let active = true;
    const task = getDocument({url, withCredentials:false});
    setLoading(true); setError(''); setOutline([]); setDocument(null);
    void task.promise.then(async pdf => {
      if (!active) { await pdf.destroy(); return; }
      setDocument(pdf); setTotal(pdf.numPages); setLoading(false);
      const pdfOutline = await readOutline(pdf).catch(() => []);
      if (active) setOutline(pdfOutline);
    }).catch(err => {
      if (!active) return;
      setLoading(false);
      setError(err instanceof Error ? err.message : 'PDF tidak bisa dibaca.');
    });
    return () => {
      active = false;
      taskRef.current?.cancel(); taskRef.current = null;
      void task.destroy().catch(() => undefined);
    };
  }, [url]);

  useEffect(() => {
    if (!pdfDocument || readMode !== 'document' || !canvasRef.current) return;
    let cancelled = false;
    let activeTask: RenderTask | null = null;
    setRendering(true); setError('');
    void (async () => {
      try {
        const pdfPage = await pdfDocument.getPage(validPage);
        if (cancelled) return;
        const base = pdfPage.getViewport({scale:1, rotation});
        const fit = Math.min(1.85, Math.max(.45, availableWidth / base.width));
        const viewport = pdfPage.getViewport({scale:fit * zoom, rotation});
        const canvas = canvasRef.current;
        const context = canvas?.getContext('2d');
        if (!canvas || !context) throw new Error('Browser tidak dapat membuat canvas pembaca.');
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = Math.round(viewport.width * dpr);
        canvas.height = Math.round(viewport.height * dpr);
        canvas.style.width = `${Math.round(viewport.width)}px`;
        canvas.style.height = `${Math.round(viewport.height)}px`;
        activeTask = pdfPage.render({canvas, canvasContext:context, viewport, transform: dpr === 1 ? undefined : [dpr,0,0,dpr,0,0]});
        taskRef.current = activeTask;
        await activeTask.promise;
        if (!cancelled) setRendering(false);
      } catch (err) {
        if (cancelled || (err instanceof Error && err.name === 'RenderingCancelledException')) return;
        setRendering(false);
        setError(err instanceof Error ? err.message : 'Gagal merender halaman.');
      }
    })();
    return () => { cancelled = true; activeTask?.cancel(); if (taskRef.current === activeTask) taskRef.current = null; };
  }, [pdfDocument, validPage, zoom, rotation, availableWidth, readMode]);

  const go = useCallback((next: number) => {
    onPageChange(clamp(next, pageCount));
    viewRef.current?.scrollTo({top:0, behavior:'smooth'});
  }, [onPageChange, pageCount]);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;
      if (event.altKey || event.metaKey || event.ctrlKey) return;
      if (event.key === 'ArrowRight') go(validPage + 1);
      if (event.key === 'ArrowLeft') go(validPage - 1);
    };
    window.addEventListener('keydown',onKey);
    return () => window.removeEventListener('keydown',onKey);
  }, [go, validPage]);
  useEffect(() => {
    const listener = () => setFullScreen(Boolean(document.fullscreenElement));
    window.addEventListener('fullscreenchange', listener);
    return () => window.removeEventListener('fullscreenchange', listener);
  }, []);
  const fullscreen = async () => {
    const el = frameRef.current;
    if (!el) return;
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await el.requestFullscreen();
    } catch { setError('Mode layar penuh tidak didukung browser ini.'); }
  };
  const copyCitation = async () => {
    const ref = `${book.title} — halaman PDF ${validPage} (${book.author}).`;
    try { await navigator.clipboard.writeText(ref); setCopied(true); setTimeout(() => setCopied(false), 1500); }
    catch { setError('Browser tidak mengizinkan clipboard.'); }
  };

  return <section className="library36-studio" ref={frameRef} aria-label={`Reading Studio: ${book.title}`}>
    <header className="library36-topbar">
      <button className="library36-back" onClick={onBack}><ArrowLeft size={17}/> {t("Kembali ke perpustakaan")}</button>
      <div className="library36-top-title"><small>{t("EL-KĪMIYĀ · READING STUDIO")}</small><strong title={book.title}>{book.title}</strong></div>
      <div className="library36-top-actions">
        <LanguageSwitch />
        <button title={t("Simpan halaman")} onClick={onBookmark}><BookmarkCheck size={18}/><span>{t("Simpan")}</span></button>
        <button title={favorite?'Hapus favorit':'Tambah favorit'} onClick={onFavorite}><Heart size={18} fill={favorite?'currentColor':'none'}/></button>
        <button title={t("Layar penuh")} onClick={() => void fullscreen()}>{fullScreen?<Minimize size={18}/>:<Maximize size={18}/>}</button>
      </div>
    </header>
    <div className="library36-subbar">
      <div className="library36-location"><BookOpen size={16}/><span>{book.author}</span></div>
      <div className="library36-progress"><span>{t("Halaman")} {validPage} {t("dari")} {pageCount}</span><div><i style={{width:`${validPage/pageCount*100}%`}}/></div></div>
      <div className="library36-badge"><ShieldCheck size={15}/> {t("Dokumen pribadi · lokal")}</div>
    </div>
    <div className={`library36-layout ${showSide?'':'side-hidden'}`}>
      {showSide && <aside className="library36-sidebar">
        <div className="library36-side-tabs">
          <button onClick={() => setSideTab('contents')} className={sideTab==='contents'?'active':''}><ListTree size={16}/> {t("Daftar isi")}</button>
          <button onClick={() => setSideTab('search')} className={sideTab==='search'?'active':''}><Search size={16}/> {t("Cari isi")}</button>
          <button onClick={() => setSideTab('notes')} className={sideTab==='notes'?'active':''}><Bookmark size={16}/> {t("Catatan")}</button>
        </div>
        <div className="library36-side-content">
          {sideTab==='contents' && <><p className="library36-side-eyebrow">{t("NAVIGATE THIS BOOK")}</p>{outline.length ? <div className="library36-outline">{outline.map((item,i)=><button key={`${item.title}-${i}`} style={{paddingLeft:`${12+item.depth*14}px`}} onClick={() => go(item.page)} className={item.page===validPage?'active':''}><span>{item.title}</span><small>{item.page}</small></button>)}</div>:<div className="library36-side-empty"><ListTree size={26}/><p>{t("PDF ini tidak menyediakan daftar isi digital. Gunakan nomor halaman di toolbar untuk berpindah.")}</p></div>}<p className="library36-side-foot">{t("Nomor yang ditampilkan adalah halaman PDF, bukan nomor halaman cetak.")}</p></>}
          {sideTab==='search' && <><p className="library36-side-eyebrow">{t("SEARCH YOUR PRIVATE BOOK")}</p><label className="library36-side-search"><Search size={17}/><input placeholder={t("Contoh: ikatan kovalen")} value={search} onChange={e=>setSearch(e.target.value)}/>{search&&<button aria-label={t("Hapus pencarian")} onClick={()=>setSearch('')}><X size={15}/></button>}</label>{!privateIndex?<div className="library36-side-empty"><FileSearch size={26}/><p>{t("Indeks JSON pribadi belum tersedia. Jalankan generator indeks sekali di proyek untuk mengaktifkan pencarian halaman.")}</p></div>:!search.trim()?<div className="library36-side-empty"><Sparkles size={26}/><p>{t("Cari istilah untuk menemukan halaman relevan dari buku ini.")}</p></div>:hits.length?<div className="library36-results">{hits.map((hit,i)=><button key={`${hit.pdfPage}-${i}`} onClick={()=>{go(hit.pdfPage);setReadMode('text')}}><span>{t("Halaman")} {hit.pdfPage} <ArrowRight size={13}/></span><p>{hit.text.slice(0,180)}{hit.text.length>180?'…':''}</p></button>)}</div>:<p className="library36-side-empty">{t("Tidak ada hasil untuk “")}{search}”.</p>}<p className="library36-side-foot">{t("Pencarian dilakukan di browser, tanpa mengunggah buku.")}</p></>}
          {sideTab==='notes' && <><p className="library36-side-eyebrow">{t("YOUR READING MARKER")}</p><div className="library36-bookmark"><BookmarkCheck size={27}/><strong>{t("Halaman tersimpan:")} {savedPage}</strong><p>{t("Halaman terakhir yang kamu tandai pada buku ini.")}</p><button onClick={()=>go(savedPage)}>{t("Lanjutkan dari sini")} <ArrowRight size={14}/></button></div><div className="library36-notepad"><label htmlFor="elk-reader-note">{t("Catatan pribadi · halaman")} {validPage}</label><textarea id="elk-reader-note" value={noteDraft} maxLength={2500} rows={5} onChange={e=>{setNoteDraft(e.target.value);setNoteStatus('')}} placeholder={t("Apa hal penting dari halaman ini?")}/><div><button onClick={()=>{setNotes(prev=>({...prev,[validPage]:noteDraft.trim()}));setNoteStatus('Catatan tersimpan di browser.')}}><Check size={14}/> {t("Simpan catatan")}</button><button onClick={()=>{setNotes(prev=>{const next={...prev};delete next[validPage];return next});setNoteDraft('');setNoteStatus('Catatan dihapus.')}}><X size={14}/> {t("Hapus")}</button></div>{noteStatus&&<small role="status">{noteStatus}</small>}</div>{Object.entries(notes).filter(([p,t])=>t.trim()).length>0 && <div className="library36-notelist"><strong>{t("Halaman dengan catatan")}</strong>{Object.entries(notes).filter(([p,t])=>t.trim()).sort((a,b)=>Number(a[0])-Number(b[0])).map(([p,noteContent])=><button key={p} onClick={()=>go(Number(p))}><span>{t("Halaman")} {p}</span><small>{noteContent.slice(0,78)}{noteContent.length>78?'…':''}</small></button>)}</div>}<div className="library36-note-info"><CircleHelp size={19}/><p>{t("Catatan dan penanda disimpan di browser ini, bukan di Firebase.")}</p></div></>}
        </div>
      </aside>}
      <div className="library36-main">
        <div className="library36-tools">
          <div className="library36-nav">
            <button onClick={()=>setShowSide(x=>!x)} title={showSide?'Sembunyikan panel':'Tampilkan panel'}><Columns2 size={18}/></button>
            <button onClick={()=>go(validPage-1)} disabled={validPage<=1} title={t("Halaman sebelumnya")}><ChevronLeft size={19}/></button>
            <label className="library36-number"><span>{t("Hal.")}</span><input type="number" min={1} max={pageCount} value={manual} onChange={e=>setManual(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')go(Number(manual))}} onBlur={()=>setManual(String(validPage))}/><span>/ {pageCount}</span></label>
            <button onClick={()=>go(Number(manual))} title={t("Buka halaman")}><ArrowRight size={17}/></button>
            <button onClick={()=>go(validPage+1)} disabled={validPage>=pageCount} title={t("Halaman berikutnya")}><ChevronRight size={19}/></button>
          </div>
          <div className="library36-mode" role="group" aria-label={t("Mode membaca")}>
            <button className={readMode==='document'?'active':''} onClick={()=>setReadMode('document')}><BookOpen size={15}/> {t("Dokumen")}</button>
            <button className={readMode==='text'?'active':''} onClick={()=>setReadMode('text')}><FileText size={15}/> {t("Teks")}</button>
          </div>
          <div className="library36-zoom"><button aria-label={t("Perkecil")} onClick={()=>setZoom(x=>Math.max(.6,+(x-.1).toFixed(2)))}><Minus size={17}/></button><span>{Math.round(zoom*100)}%</span><button aria-label={t("Perbesar")} onClick={()=>setZoom(x=>Math.min(2,+(x+.1).toFixed(2)))}><Plus size={17}/></button></div>
        </div>
        <div className="library36-scroll" ref={viewRef}>
          {loading && <div className="library36-loading"><LoaderCircle size={31} className="spin"/><strong>{t("Menyiapkan halaman buku…")}</strong><span>{t("Dokumen dibaca dari folder privat laptop")}</span></div>}
          {error && <div className="library36-error" role="alert"><CircleHelp size={20}/><p>{error}</p><button onClick={()=>setReadMode('text')}>{t("Coba mode teks")}</button></div>}
          {!loading && readMode==='document' && <div className="library36-paper-wrap">
            <div className="library36-paper"><canvas ref={canvasRef} aria-label={`Halaman PDF ${validPage} dari ${book.title}`}/>{rendering&&<div className="library36-rendering"><LoaderCircle className="spin" size={22}/> {t("Memuat halaman…")}</div>}</div>
            <p className="library36-page-foot">El-Kīmiyā · {book.title} · PDF p. {validPage}</p>
          </div>}
          {!loading && readMode==='text' && <article className="library36-text-sheet"><span className="library36-text-kicker">{t("DIGITAL READING · PDF PAGE")} {validPage}</span><h2>{book.title}</h2><p className="library36-text-description">{t("Versi teks dari indeks privat. Untuk rumus, tabel, gambar, dan tata letak asli, gunakan mode Dokumen.")}</p>{selectedText?<div className="library36-text-content">{selectedText}</div>:<div className="library36-text-missing"><FileText size={30}/><strong>{t("Belum ada teks terindeks untuk halaman ini.")}</strong><p>{t("Buat indeks JSON dari PDF asli untuk mengaktifkan tampilan teks dan pencarian.")}</p></div>}<div className="library36-text-actions"><button onClick={()=>void copyCitation()}>{copied?<Check size={16}/>:<Bookmark size={16}/>} {copied?'Referensi disalin':'Salin referensi halaman'}</button><button onClick={()=>setReadMode('document')}><BookOpen size={16}/> {t("Lihat PDF asli")}</button></div></article>}
        </div>
        <footer className="library36-bottom"><div><ShieldCheck size={15}/> {t("Dokumen privat · Tidak dipublikasikan")}</div><div className="library36-bottom-actions"><button onClick={()=>onAsk(`Jelaskan topik pada ${book.title}, halaman PDF ${validPage}. Jangan mengarang isi halaman; jika tidak memiliki cuplikan sumber, minta saya mengimpor indeks pribadi terlebih dahulu.`)}><Sparkles size={16}/> {t("Diskusikan di AI Tutor")}</button><button onClick={()=>go(validPage+1)} disabled={validPage>=pageCount}>{t("Halaman berikutnya")} <ChevronRight size={16}/></button></div></footer>
      </div>
    </div>
  </section>;
}
