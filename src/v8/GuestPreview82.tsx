import { ArrowLeft, ArrowRight, BookOpen, BrainCircuit, FlaskConical, LockKeyhole, Search, ShieldCheck, Moon, Sun } from 'lucide-react';
import { useLanguage, LanguageSwitch } from '../lib/language';
import { BrandMark } from '../components/BrandMark';
export function GuestPreview82({onHome,onLogin,onRegister,dark,setDark}:{onHome:()=>void;onLogin:()=>void;onRegister:()=>void;dark:boolean;setDark:(v:boolean)=>void}){
 const {language}=useLanguage(); const en=language==='en'; const t=(id:string,english:string)=>en?english:id;
 const features=[
  {icon:BookOpen,title:t('Materi kimia','Chemistry lessons'),copy:t('Materi bilingual dan referensi ilmiah.','Bilingual lessons and scientific references.')},
  {icon:FlaskConical,title:t('Laboratorium virtual','Virtual laboratory'),copy:t('Eksperimen dan eksplorasi molekul.','Experiments and molecular exploration.')},
  {icon:BrainCircuit,title:t('Tutor AI hibrida','Hybrid AI tutor'),copy:t('Dukungan belajar dengan sumber inferensi transparan.','Learning support with transparent inference sources.')},
  {icon:Search,title:t('Misi penelitian','Research missions'),copy:t('Hipotesis, simulasi, analisis, dan laporan.','Hypotheses, simulations, analysis, and reports.')},
 ];
 return <main className="entry67 v82-guest-preview" data-web-version="8.2">
  <header className="entry67-nav"><button type="button" onClick={onHome}><ArrowLeft size={18}/>{t('Kembali ke beranda','Back to homepage')}</button><BrandMark size="sm"/><div className="v81-auth-tools"><LanguageSwitch/><button type="button" className="v81-icon" aria-label={t('Ganti tema','Toggle theme')} onClick={()=>setDark(!dark)}>{dark?<Sun size={19}/>:<Moon size={19}/>}</button></div></header>
  <section className="entry67-top"><div className="entry67-kicker"><ShieldCheck size={17}/> {t('PRATINJAU PUBLIK · MODE TAMU','PUBLIC PREVIEW · GUEST MODE')}</div><h1>{t('Kenali El-Kīmiyā.','Discover El-Kīmiyā.')}</h1><p>{t('Lihat gambaran fitur pembelajaran kami. Untuk membaca materi lengkap, menggunakan tutor AI, melakukan latihan, atau menyimpan progres, kamu harus masuk dengan akun.','Discover our learning features. Sign in to read full lessons, use the AI tutor, complete exercises or save progress.')}</p></section>
  <div className="v82-preview-grid">{features.map(({icon:Icon,title,copy})=><article key={title}><span className="v82-feature-icon"><Icon size={23}/></span><h2>{title}</h2><p>{copy}</p><span className="v82-locked"><LockKeyhole size={14}/>{t('Memerlukan akun','Account required')}</span></article>)}</div>
  <section className="v82-preview-cta"><div><h2>{t('Siap mulai belajar?','Ready to start learning?')}</h2><p>{t('Masuk atau buat akun pelajar untuk membuka ruang belajar.','Sign in or create a learner account to unlock your workspace.')}</p></div><div className="v82-preview-actions"><button type="button" className="secondary-button" onClick={onRegister}>{t('Daftar','Register')}</button><button type="button" className="primary-button" onClick={onLogin}>{t('Masuk','Sign in')}<ArrowRight size={17}/></button></div></section>
 </main>;
}
