import { useState } from 'react';
import {
  ArrowLeft, ArrowRight, BookOpen, Check, ChevronRight, Copy, Droplets,
  ExternalLink, FlaskConical, Heart, Leaf, Lightbulb, Microscope,
  NotebookPen, ShieldCheck, Sparkles,
} from 'lucide-react';
import '../faith-chemistry.css';
import { t, useLanguage } from '../lib/language';

/** Qur'an Arabic verified against the Indonesian Ministry of Religious Affairs (Bimas Islam). */
const LUQMAN_20_ARABIC =
  'اَلَمْ تَرَوْا اَنَّ اللّٰهَ سَخَّرَ لَكُمْ مَّا فِى السَّمٰوٰتِ وَمَا فِى الْاَرْضِ وَاَسْبَغَ عَلَيْكُمْ نِعَمَهٗ ظَاهِرَةً وَّبَاطِنَةً ۗوَمِنَ النَّاسِ مَنْ يُّجَادِلُ فِى اللّٰهِ بِغَيْرِ عِلْمٍ وَّلَا هُدًى وَّلَا كِتٰبٍ مُّنِيْرٍ';

const SOURCE = 'https://bimasislam.kemenag.go.id/al-quran/luqman';

const BENEFITS = [
  { icon: Microscope, number: '01', title: 'Mengenal ciptaan Allah', body: 'Pelajari susunan materi, atom, molekul, dan perubahan zat sebagai bagian dari alam yang dapat diamati dengan ilmu.' },
  { icon: Droplets, number: '02', title: 'Memberi manfaat bagi sesama', body: 'Terapkan pengetahuan kimia untuk air bersih, obat-obatan, pangan yang aman, dan kebutuhan masyarakat.' },
  { icon: Heart, number: '03', title: 'Menumbuhkan rasa syukur', body: 'Memahami manfaat air, udara, dan bahan alam dapat menjadi pengingat untuk mensyukuri nikmat Allah.' },
  { icon: Leaf, number: '04', title: 'Menjaga amanah lingkungan', body: 'Gunakan prinsip kimia untuk mengurangi limbah, mencegah pencemaran, dan memanfaatkan sumber daya secara bijak.' },
  { icon: Lightbulb, number: '05', title: 'Berpikir dengan dasar ilmu', body: 'Belajar menimbang bukti, memeriksa eksperimen, dan menghindari klaim yang tidak memiliki landasan.' },
] as const;

const EXAMPLES = [
  { id: 'observe', short: 'Amati', icon: Microscope, category: '01 · Mengamati', title: 'Mengapa air punya sifat yang khas?', equation: 'H₂O', topic: 'STRUKTUR MOLEKUL', science: 'Ikatan O–H bersifat polar dan geometri molekul air bengkok. Kedua hal ini memengaruhi sifat air dan interaksinya dengan molekul lain.', reflection: 'Saat mempelajari air secara ilmiah, kita dapat merenungkan betapa pentingnya air bagi kehidupan.', question: 'Mengapa molekul air bersifat polar? Jelaskan dengan bukti konsep ikatan dan geometri molekul.' },
  { id: 'use', short: 'Manfaatkan', icon: Droplets, category: '02 · Memanfaatkan', title: 'Bagaimana kimia membantu air bersih?', equation: 'H₂O', topic: 'KIMIA LINGKUNGAN', science: 'Proses penyaringan, koagulasi, dan disinfeksi dapat membantu menghasilkan air yang lebih aman jika dilakukan dengan prosedur yang sesuai.', reflection: 'Ilmu yang bermanfaat dapat dipakai untuk memenuhi kebutuhan orang banyak, bukan hanya untuk diri sendiri.', question: 'Jelaskan peran koagulasi dan disinfeksi dalam pengolahan air serta batas keamanan penggunaannya.' },
  { id: 'protect', short: 'Jaga', icon: Leaf, category: '03 · Menjaga', title: 'Apa kaitan kimia dan tanggung jawab?', equation: 'CO₂', topic: 'KIMIA HIJAU', science: 'Kimia hijau merancang bahan dan proses yang mengurangi limbah berbahaya, penggunaan sumber daya, serta dampak lingkungan.', reflection: 'Pengetahuan tentang dampak suatu zat mengajak kita lebih bertanggung jawab dalam memanfaatkan alam.', question: 'Apa itu kimia hijau? Berikan tiga contoh penerapan yang masuk akal dan aman dalam kehidupan sehari-hari.' },
] as const;

type ExampleId = (typeof EXAMPLES)[number]['id'];
type Props = {
  onBack: () => void;
  onOpenLibrary: () => void;
  onAskTutor: (question: string) => void;
  onSaveNote: (title: string, content: string, source: string) => void;
};

export function ChemistryFaithPage({ onBack, onOpenLibrary, onAskTutor, onSaveNote }: Props) {
  const {language}=useLanguage();
  const tx=(id:string,en:string)=>language==='en'?en:id;
  const [exampleId, setExampleId] = useState<ExampleId>('observe');
  const [thought, setThought] = useState('');
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const example = EXAMPLES.find(item => item.id === exampleId) ?? EXAMPLES[0];

  const copyReflection = async () => {
    const text = `QS. Luqman [31]: 20 — Pelajari alam dengan ilmu, syukuri nikmat Allah, dan gunakan pengetahuan untuk kebaikan.\nSumber Al-Qur'an: ${SOURCE}`;
    try {
      if (!navigator.clipboard?.writeText) return;
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch { setCopied(false); }
  };

  return (
    <main className="page standard-page faith-page">
      <div className="faith-breadcrumb">
        <button onClick={onBack}><ArrowLeft size={15} /> {t("Kembali ke Dashboard")}</button>
        <span aria-hidden="true">/</span><span>{t("Kimia & Keimanan")}</span>
      </div>
      <section className="faith-hero" aria-labelledby="faith-title">
        <div className="faith-hero-copy">
          <span className="faith-eyebrow"><Sparkles size={15} /> {t("TAFAKKUR · SAINS & KEIMANAN")}</span>
          <h1 id="faith-title">{t("Mempelajari materi.")}<br /><em>{t("Merenungi ciptaan.")}</em></h1>
          <p>{t("Kimia membantu kita memahami sifat dan perubahan zat. Dalam perspektif Islam, ilmu juga dapat menjadi jalan untuk bersyukur, berbuat manfaat, dan menjaga amanah.")}</p>
          <div className="faith-hero-actions">
            <a href="#faith-verse" className="faith-cta-main">{t("Baca landasan ayat")} <ChevronRight size={18}/></a>
            <button onClick={onOpenLibrary} className="faith-cta-muted"><BookOpen size={17}/> {t("Buka perpustakaan")}</button>
          </div>
        </div>
        <div className="faith-hero-art" aria-hidden="true"><span className="faith-orbit faith-orbit-outer"/><span className="faith-orbit faith-orbit-inner"/><span className="faith-orbit-center"><FlaskConical size={58}/></span><span className="faith-art-caption">{t("ILMU · SYUKUR · AMANAH")}</span></div>
      </section>

      <section className="faith-verse-layout" id="faith-verse" aria-labelledby="faith-verse-title">
        <div className="faith-verse-card">
          <div className="faith-verse-head"><span>{t("01 / LANDASAN AL-QUR'AN")}</span><span>QS. LUQMAN · 31:20</span></div>
          <h2 id="faith-verse-title">{t("Memperhatikan nikmat Allah di langit dan bumi")}</h2>
          <p lang="ar" dir="rtl" className="faith-arabic">{LUQMAN_20_ARABIC}</p>
          <div className="faith-translation">
            <span>{t("MAKNA AYAT · PARAFRASA BAHASA INDONESIA")}</span>
            <p>{t("Allah mengingatkan manusia agar memperhatikan bahwa apa yang berada di langit dan di bumi telah dijadikan bermanfaat bagi mereka. Nikmat-Nya meliputi yang tampak dan tidak tampak. Ayat ini juga memperingatkan agar manusia tidak berbantah mengenai Allah tanpa ilmu, petunjuk, atau kitab yang menerangi.")}</p>
          </div>
          <div className="faith-verse-footer">
            <a href={SOURCE} target="_blank" rel="noopener noreferrer"><ExternalLink size={16}/> {t("Baca ayat & terjemahan resmi Kemenag")}</a>
            <button onClick={() => void copyReflection()}>{copied ? <Check size={16}/> : <Copy size={16}/>} {copied ? t('Tersalin') : t('Salin pesan hikmah')}</button>
          </div>
        </div>
        <aside className="faith-reading-note">
          <span className="faith-note-mark">۞</span>
          <span className="faith-eyebrow">{t("CATATAN PENAFSIRAN")}</span>
          <h3>{t("Ayat sebagai petunjuk nilai, bukan rumus kimia.")}</h3>
          <p>{t("QS. Luqman: 20 tidak menyebut atom, molekul, atau reaksi kimia secara khusus. Hubungan dengan kimia di halaman ini adalah refleksi pendidikan, bukan klaim bahwa ayat tersebut meramalkan teori sains modern.")}</p>
          <div><ShieldCheck size={18}/><span>{t("Fakta ilmiah diuji dengan metode ilmiah. Makna agama dirujuk pada Al-Qur'an dan tafsir yang dapat diperiksa.")}</span></div>
        </aside>
      </section>

      <section className="faith-benefits" aria-labelledby="faith-benefits-title">
        <div className="faith-section-head"><div><span className="faith-eyebrow">{t("02 / ALASAN KITA BELAJAR")}</span><h2 id="faith-benefits-title">{t("Lima manfaat mempelajari ilmu kimia")}</h2></div><p>{t("Ilmu yang baik memperluas pemahaman sekaligus memperbaiki cara kita memperlakukan sesama dan alam.")}</p></div>
        <div className="faith-benefit-grid">{BENEFITS.map(item => { const Icon = item.icon; return <article className="faith-benefit" key={item.number}><span className="faith-benefit-icon"><Icon size={22}/></span><span className="faith-benefit-number">{item.number}</span><h3>{t(item.title)}</h3><p>{t(item.body)}</p></article>; })}</div>
      </section>

      <section className="faith-experience" aria-labelledby="faith-experience-title">
        <div className="faith-section-head"><div><span className="faith-eyebrow">{t("03 / DARI KONSEP KE AKSI")}</span><h2 id="faith-experience-title">{t("Amati. Manfaatkan. Jaga.")}</h2></div><p>{t("Pilih contoh untuk melihat bagaimana pengetahuan kimia dan refleksi keislaman dapat berdampingan tanpa dicampuradukkan.")}</p></div>
        <div className="faith-experience-body">
          <div className="faith-experience-tabs" role="tablist" aria-label={tx('Contoh penerapan kimia','Examples of chemistry in practice')}>{EXAMPLES.map(item => { const Icon = item.icon; return <button key={item.id} role="tab" id={`faith-tab-${item.id}`} aria-controls="faith-example-panel" aria-selected={exampleId === item.id} className={exampleId === item.id ? 'active' : ''} onClick={() => setExampleId(item.id)}><Icon size={19}/><span>{t(item.short)}</span><ChevronRight size={15}/></button> })}</div>
          <article className="faith-experience-panel" role="tabpanel" id="faith-example-panel" aria-labelledby={`faith-tab-${exampleId}`} key={exampleId}>
            <div className="faith-panel-meta"><span>{t(example.category)}</span><span>{t(example.topic)}</span></div>
            <div className="faith-panel-main"><div><h3>{t(example.title)}</h3><div className="faith-fact"><strong>{t("FAKTA KIMIA")}</strong><p>{t(example.science)}</p></div><div className="faith-reflection"><strong>{t("REFLEKSI KEIMANAN")}</strong><p>{t(example.reflection)}</p></div></div><span className="faith-panel-formula" aria-hidden="true">{example.equation}</span></div>
            <button className="faith-ask-button" onClick={() => onAskTutor(`${t(example.question)} Pisahkan penjelasan sains dari religious reflection; do not invent scripture or quotations.`)}><Sparkles size={17}/> {t("Pelajari konsep ini dengan AI Tutor")} <ArrowRight size={16}/></button>
          </article>
        </div>
      </section>

      <section className="faith-personal" aria-labelledby="faith-personal-title">
        <div><span className="faith-eyebrow">{t("04 / JURNAL TAFAKKUR")}</span><h2 id="faith-personal-title">{t("Ilmu apa yang ingin kamu manfaatkan?")}</h2><p>{t("Tulis satu contoh sederhana bagaimana kimia bisa memberi manfaat untuk orang lain atau membantu menjaga lingkungan. Refleksimu disimpan sebagai catatan pribadi di browser ini.")}</p></div>
        <div className="faith-personal-form"><label htmlFor="faith-thought">{t("REFLEKSI PRIBADI")}</label><textarea id="faith-thought" maxLength={1200} rows={4} placeholder={t("Contoh: Saya ingin memahami cara mengolah air bersih agar bisa bermanfaat bagi masyarakat...")} value={thought} onChange={event => {setThought(event.target.value);setSaved(false)}}/><div><small>{thought.length}{t("/1.200 karakter · Tersimpan hanya setelah kamu menekan tombol")}</small><button disabled={thought.trim().length < 10} onClick={() => { onSaveNote('Refleksi QS. Luqman: 20', thought.trim(), 'Kimia & Keimanan · QS. Luqman [31]: 20'); setSaved(true); }}><NotebookPen size={17}/> {saved ? t('Catatan tersimpan') : t('Simpan refleksi')} </button></div></div>
      </section>
      <footer className="faith-footer"><FlaskConical size={17}/><span>{t("El-Kīmiyā · Belajar dengan ilmu, berkarya dengan manfaat, menjaga amanah.")}</span><a href={SOURCE} target="_blank" rel="noopener noreferrer">{t("Rujukan Al-Qur'an")} <ExternalLink size={14}/></a></footer>
    </main>
  );
}
