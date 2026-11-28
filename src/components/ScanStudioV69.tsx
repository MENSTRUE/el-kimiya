import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, BookOpen, Camera, CheckCircle2, FileText, ImagePlus, Layers3, NotebookPen, ShieldCheck, Sparkles, Upload } from 'lucide-react';
import { useLanguage } from '../lib/language';
import type { StudyCard } from '../data/learning';
import '../mobile-polish-v69.css';

type Props = {
  setPage: (page: 'dashboard' | 'library' | 'scan' | 'tutor') => void;
  addNote: (title: string, content: string, source: string) => void;
  addCard: (card: StudyCard) => void;
  notify: (message: string) => void;
  askAbout: (prompt: string) => void;
};
type Step = 'choose' | 'review' | 'saved';
const DEMO = 'Ikatan kovalen terbentuk ketika dua atom berbagi satu atau lebih pasangan elektron. Elektron bersama tertarik oleh inti kedua atom.';

export function ScanStudioV69({ setPage, addNote, addCard, notify, askAbout }: Props) {
  const { language } = useLanguage();
  const en = language === 'en';
  const tx = (id: string, english: string) => en ? english : id;
  const [step, setStep] = useState<Step>('choose');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [sourceName, setSourceName] = useState('');
  const [passage, setPassage] = useState('');
  const [error, setError] = useState('');
  const cameraInput = useRef<HTMLInputElement | null>(null);
  const galleryInput = useRef<HTMLInputElement | null>(null);

  useEffect(() => () => { if (imageUrl) URL.revokeObjectURL(imageUrl); }, [imageUrl]);

  const choose = (file?: File) => {
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError(tx('Pilih gambar JPG, PNG, atau WebP.', 'Choose a JPG, PNG or WebP image.'));
      return;
    }
    if (file.size > 6 * 1024 * 1024) {
      setError(tx('Maksimal ukuran gambar 6 MB.', 'Maximum image size is 6 MB.'));
      return;
    }
    setError('');
    setImageUrl(URL.createObjectURL(file));
    setSourceName(file.name || tx('Foto halaman', 'Page photo'));
    setPassage('');
    setStep('review');
  };
  const sample = () => {
    setError(''); setImageUrl(null); setSourceName(tx('Contoh latihan (bukan hasil OCR)', 'Practice sample (not OCR)'));
    setPassage(en ? 'A covalent bond forms when two atoms share one or more pairs of electrons. The shared electrons are attracted by the nuclei of both atoms.' : DEMO);
    setStep('review');
  };
  const saveNote = () => {
    if (!passage.trim()) return;
    addNote(tx('Catatan dari foto / teks', 'Note from photo / text'), passage.trim(), `${sourceName} · ${tx('Teks diketik/diperiksa manual; bukan OCR', 'Manually entered/reviewed; not OCR')}`);
    notify(tx('Catatan berhasil disimpan secara lokal', 'Note saved locally'));
    setStep('saved');
  };
  const saveFlashcard = () => {
    if (!passage.trim()) return;
    addCard({
      id: `scan69-${Date.now()}`, topic: tx('Catatan pribadi', 'Personal note'),
      question: tx('Jelaskan konsep dalam paragraf yang sudah kamu periksa.', 'Explain the concept in the paragraph you reviewed.'),
      answer: passage.trim(), detail: tx('Dari teks yang diperiksa manual; belum diverifikasi dari buku.', 'From manually reviewed text; no verified book metadata.'),
    });
    notify(tx('Flashcard tersimpan secara lokal', 'Flashcard saved locally'));
    setStep('saved');
  };
  const askTutor = () => askAbout((en
    ? 'Help me understand this chemistry passage. Clearly separate explanations from unsupported claims:\n'
    : 'Jelaskan konsep kimia pada teks ini dengan sederhana. Bedakan fakta dan hal yang belum terverifikasi:\n') + passage.trim().slice(0, 1500));
  const goBack = () => step === 'choose' ? setPage('dashboard') : setStep(step === 'saved' ? 'review' : 'choose');

  return <main className="scan69" aria-label={tx('Pindai untuk belajar', 'Capture to study')}>
    <header className="scan69-topbar">
      <button type="button" onClick={goBack} className="scan69-back" aria-label={tx('Kembali', 'Back')}><ArrowLeft size={20} /></button>
      <div className="scan69-identity"><span className="scan69-overline">{tx('EL-KĪMIYĀ · PINDAI MATERI','EL-KĪMIYĀ · STUDY CAPTURE')}</span><strong>{tx('Foto ke Pemahaman', 'Photo to Understanding')}</strong></div>
      <span className="scan69-step">{step === 'choose' ? '1' : step === 'review' ? '2' : '3'} / 3</span>
    </header>

    <section className="scan69-hero">
      <span className="scan69-kicker"><Sparkles size={16} /> {tx('ALAT BELAJAR PRIBADI', 'PERSONAL STUDY TOOL')}</span>
      <h1>{step === 'choose' ? tx('Bawa halamanmu ke ruang belajar.', 'Bring a page into your study space.') : step === 'review' ? tx('Periksa teks yang kamu baca.', 'Review what you read.') : tx('Teks siap dipelajari.', 'Your passage is ready.')}</h1>
      <p>{step === 'choose'
        ? tx('Ambil foto halaman kimia atau pilih gambar dari galeri. Setelah itu, tulis atau salin sendiri paragraf yang ingin kamu pahami.', 'Take a picture of a chemistry page or choose an image. Then type the passage you want to understand.')
        : step === 'review'
          ? tx('Foto hanya sebagai referensi. Aplikasi ini belum mengekstrak teks otomatis. Pastikan tulisanmu cocok dengan halaman asli.', 'The picture is a reference only. Automatic text extraction is not available. Check your transcription against the original.')
          : tx('Catatan disimpan di browser pada perangkat ini, bukan ke akun cloud.', 'Your note is saved in this device browser, not a cloud account.')}</p>
    </section>

    {step === 'choose' && <div className="scan69-content">
      <div className="scan69-preview-placeholder" aria-hidden="true">
        <div className="scan69-page"><div className="scan69-page-icon"><BookOpen size={28} /></div><span>H₂O · NaCl · CO₂</span><i /><i /><i /></div>
        <div className="scan69-corners"><span /><span /><span /><span /></div>
      </div>
      <div className="scan69-actions">
        <button type="button" className="scan69-primary" onClick={() => cameraInput.current?.click()}><Camera size={20} />{tx('Ambil foto halaman', 'Take a page photo')}</button>
        <button type="button" className="scan69-secondary" onClick={() => galleryInput.current?.click()}><ImagePlus size={19} />{tx('Pilih dari galeri', 'Choose from gallery')}</button>
        <button type="button" className="scan69-text-button" onClick={sample}><BookOpen size={18} />{tx('Coba dengan contoh teks', 'Try a sample passage')} <ArrowRight size={16} /></button>
      </div>
      <input className="scan69-file" ref={cameraInput} type="file" accept="image/jpeg,image/png,image/webp" capture="environment" aria-label={tx('Ambil foto', 'Take photo')} onChange={e => {choose(e.currentTarget.files?.[0]);e.currentTarget.value='';}} />
      <input className="scan69-file" ref={galleryInput} type="file" accept="image/jpeg,image/png,image/webp" aria-label={tx('Pilih gambar', 'Choose image')} onChange={e => {choose(e.currentTarget.files?.[0]);e.currentTarget.value='';}} />
      {error && <p role="alert" className="scan69-error">{error}</p>}
      <div className="scan69-notice"><ShieldCheck size={20}/><p><strong>{tx('Privasi dan kejelasan', 'Privacy and clarity')}</strong><span>{tx('Gambar tetap di sesi browser; tidak dikirim ke server oleh fitur Scan. Ini belum OCR ataupun identifikasi kimia otomatis.', 'Images stay in this browser session and are not uploaded by Scan. This is not OCR or automatic chemistry recognition.')}</span></p></div>
    </div>}

    {step === 'review' && <div className="scan69-content">
      {imageUrl ? <div className="scan69-photo"><img src={imageUrl} alt={tx('Foto halaman yang dipilih', 'Selected page photo')} /></div> : <div className="scan69-sample"><BookOpen size={19}/>{tx('Mode contoh — teks buatan untuk latihan', 'Sample mode — example study passage')}</div>}
      <div className="scan69-field"><label htmlFor="scan69-passage">{tx('Teks yang sudah kamu periksa', 'Manually reviewed passage')}</label><textarea id="scan69-passage" value={passage} rows={7} maxLength={4000} placeholder={tx('Ketik isi halaman atau pertanyaan kimiamu di sini...', 'Type your passage or chemistry question here...')} onChange={e=>setPassage(e.target.value)}/><span>{passage.length} / 4000 · {sourceName}</span></div>
      <div className="scan69-notice"><ShieldCheck size={19}/><p><strong>{tx('Belum menggunakan OCR', 'OCR is not enabled')}</strong><span>{tx('Periksa setiap kata sebelum membuat catatan, kartu, atau meminta bantuan AI.', 'Check every word before saving notes, cards, or asking AI.')}</span></p></div>
      <div className="scan69-actions"><button type="button" className="scan69-primary" disabled={!passage.trim()} onClick={saveNote}><NotebookPen size={19}/>{tx('Simpan catatan', 'Save note')}</button><button type="button" className="scan69-secondary" disabled={!passage.trim()} onClick={saveFlashcard}><Layers3 size={19}/>{tx('Buat flashcard', 'Create flashcard')}</button><button type="button" className="scan69-text-button" disabled={!passage.trim()} onClick={askTutor}><Sparkles size={17}/>{tx('Bahas di Tutor Kimia', 'Discuss with chemistry tutor')} <ArrowRight size={16}/></button></div>
    </div>}

    {step === 'saved' && <div className="scan69-content scan69-complete"><CheckCircle2 size={56}/><h2>{tx('Tersimpan di perangkatmu', 'Saved on your device')}</h2><p>{tx('Kamu bisa lanjut ke catatan, flashcard, atau membahas konsep di tutor. Teks masih perlu diverifikasi dari sumber aslinya.', 'Continue with your notes, flashcards, or chemistry tutor. The passage still needs verification against its source.')}</p><div className="scan69-actions"><button className="scan69-primary" type="button" onClick={askTutor}><Sparkles size={19}/>{tx('Tanya Tutor Kimia', 'Ask chemistry tutor')}</button><button className="scan69-secondary" type="button" onClick={()=>setPage('library')}><FileText size={19}/>{tx('Buka perpustakaan', 'Open library')}</button><button className="scan69-text-button" type="button" onClick={()=>{setStep('choose');setImageUrl(null);setPassage('');}}><Upload size={18}/>{tx('Pindai halaman lain', 'Capture another page')}</button></div></div>}
  </main>;
}
