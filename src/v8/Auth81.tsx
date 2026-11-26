// ELKIMIYA_V82_EMAIL_ONLY
import { useState, type FormEvent } from 'react';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { ArrowLeft, ArrowRight, Eye, EyeOff, Moon, Sun, ShieldCheck, FlaskConical, BookOpen, Atom } from 'lucide-react';
import { useLanguage, LanguageSwitch } from '../lib/language';
import { BrandMark } from '../components/BrandMark';
import { usePlatform, v8Auth } from './platform';
export type AuthRoute = 'account'|'register'|'reset';
function friendly(e:unknown,en:boolean){
 const code=typeof e==='object'&&e!==null&&'code' in e?String(e.code):'';
 const messages:Record<string,[string,string]>={
  'auth/invalid-credential':['Email atau kata sandi tidak sesuai.','Email or password is incorrect.'],
  'auth/invalid-email':['Format email tidak valid.','Invalid email address.'],
  'auth/email-already-in-use':['Email sudah terdaftar. Silakan masuk.','Email is already registered. Please sign in.'],
  'auth/weak-password':['Gunakan kata sandi yang lebih kuat.','Choose a stronger password.'],
  'auth/too-many-requests':['Terlalu banyak percobaan. Coba lagi nanti.','Too many attempts. Try again later.'],
  'auth/network-request-failed':['Koneksi gagal. Coba lagi.','Network request failed. Try again.'],
  'auth/operation-not-allowed':['Login email belum diaktifkan. Hubungi pengelola.','Email sign-in is not enabled. Contact the administrator.'],
  'auth/unauthorized-domain':['Domain ini belum diizinkan.','This domain is not authorized.'],
 };
 return (messages[code]||['Permintaan belum berhasil. Periksa koneksi atau konfigurasi Firebase.','The request failed. Check your connection or Firebase configuration.'])[en?1:0]+(code?` (${code})`:'');
}
export function AuthPage81({mode,go,dark,setDark}:{mode:AuthRoute;go:(p:AuthRoute|'landing')=>void;dark:boolean;setDark:(v:boolean)=>void}){
 const {language}=useLanguage();const en=language==='en';const t=(id:string,english:string)=>en?english:id;
 const {ready,issue}=usePlatform(); const [email,E]=useState(''),[password,P]=useState(''),[show,S]=useState(false),[busy,B]=useState(false),[message,M]=useState(''),[ok,O]=useState(false);
 const register=mode==='register',reset=mode==='reset';
 const navigate=(p:AuthRoute|'landing')=>{if(!busy)go(p);};
 async function submit(e:FormEvent){e.preventDefault();if(busy||!ready)return;B(true);M('');O(false);
  try{
   const auth=v8Auth();const address=email.trim();
   if(reset){await sendPasswordResetEmail(auth,address);O(true);M(t('Jika email terdaftar, periksa kotak masuk untuk tautan reset.','If the email is registered, check your inbox for a reset link.'));}
   else if(register)await createUserWithEmailAndPassword(auth,address,password);
   else await signInWithEmailAndPassword(auth,address,password);
   // SessionBoundary alone routes after Firebase confirms UID and role.
  }catch(e){M(friendly(e,en));}finally{B(false);}
 }
 return <main className="v81-auth" data-web-version="8.2">
  <header className="v81-auth-nav"><button type="button" onClick={()=>navigate('landing')} disabled={busy} className="v81-back"><ArrowLeft size={19}/>{t('Kembali ke beranda','Back to homepage')}</button><BrandMark size="sm"/><div className="v81-auth-tools"><LanguageSwitch/><button type="button" className="v81-icon" aria-label={t('Ganti tema','Toggle theme')} onClick={()=>setDark(!dark)}>{dark?<Sun size={20}/>:<Moon size={20}/>}</button></div></header>
  <div className="v81-auth-grid"><section className="v81-auth-art"><div className="v81-art-top"><FlaskConical size={20}/><span>EL-KĪMIYĀ / LEARNING JOURNEY</span></div><div className="v81-orbit" aria-hidden="true"><svg viewBox="0 0 260 190"><g fill="none" stroke="currentColor" strokeWidth="1.4"><ellipse cx="130" cy="95" rx="103" ry="32"/><ellipse cx="130" cy="95" rx="103" ry="32" transform="rotate(60 130 95)"/><ellipse cx="130" cy="95" rx="103" ry="32" transform="rotate(-60 130 95)"/></g><g fill="#e6cd91"><circle cx="130" cy="95" r="15"/><circle cx="233" cy="95" r="6"/><circle cx="79" cy="6" r="6"/><circle cx="79" cy="184" r="6"/></g></svg></div><h1>{t('Setiap penemuan dimulai dari rasa ingin tahu.','Every discovery begins with curiosity.')}</h1><p>{t('Pahami kimia melalui materi, penelitian dan AI hibrida yang transparan.','Understand chemistry through lessons, research and transparent hybrid AI.')}</p><div className="v81-art-features"><span><BookOpen size={17}/>{t('Belajar bilingual','Bilingual learning')}</span><span><Atom size={17}/>{t('Eksplorasi ilmiah','Scientific exploration')}</span><span><ShieldCheck size={17}/>{t('Akses sesuai peran','Role-based access')}</span></div></section>
  <section className="v81-auth-form"><span className="v81-kicker">{t('RUANG BELAJAR PRIBADI','PERSONAL LEARNING SPACE')}</span><h2>{reset?t('Atur ulang kata sandi','Reset your password'):register?t('Mulai perjalanan belajarmu.','Begin your learning journey.'):t('Selamat datang kembali.','Welcome back.')}</h2><p>{reset?t('Masukkan email akun yang dapat menerima pesan.','Enter an account email that can receive messages.'):register?t('Buat akun pelajar gratis. Hak Moduler hanya diberikan oleh pengelola.','Create a free learner account. Moduler access is granted by an administrator only.'):t('Masuk dengan email dan kata sandi. Sistem akan membuka ruang kerja sesuai peranmu.','Sign in with email and password. Your workspace opens according to your role.')}</p>
  {issue&&<p className="v81-error" role="alert">{issue}</p>}
  <form onSubmit={submit}>
   <label>Email<input type="email" autoComplete="email" required value={email} onChange={e=>E(e.target.value)} placeholder="name@example.com"/></label>
   {!reset&&<label>{t('Kata sandi','Password')}<span className="v81-password"><input type={show?'text':'password'} required minLength={register?6:undefined} value={password} onChange={e=>P(e.target.value)} autoComplete={register?'new-password':'current-password'} placeholder={t('Masukkan kata sandi','Enter password')}/><button type="button" onClick={()=>S(!show)} aria-label={show?t('Sembunyikan kata sandi','Hide password'):t('Tampilkan kata sandi','Show password')}>{show?<EyeOff size={19}/>:<Eye size={19}/>}</button></span></label>}
   {!register&&!reset&&<button type="button" className="v81-link v81-forgot" disabled={busy} onClick={()=>navigate('reset')}>{t('Lupa kata sandi?','Forgot password?')}</button>}
   <button className="v81-submit" type="submit" disabled={busy||!ready}>{busy?t('Memproses…','Processing…'):reset?t('Kirim tautan reset','Send reset link'):register?t('Buat akun User','Create learner account'):t('Masuk','Sign in')}<ArrowRight size={19}/></button>
  </form>
  {message&&<p className={ok?'v81-message':'v81-error'} role={ok?'status':'alert'}>{message}</p>}
  {reset?<button type="button" className="v81-link" onClick={()=>navigate('account')} disabled={busy}>{t('Kembali ke login','Back to sign in')}</button>:<div className="v81-switch">{register?t('Sudah punya akun?','Already have an account?'):t('Belum punya akun?','New here?')} <button type="button" className="v81-link" onClick={()=>navigate(register?'account':'register')} disabled={busy}>{register?t('Masuk','Sign in'):t('Daftar','Register')}</button></div>}
  <small>{t('Akun diperlukan untuk menggunakan fitur pembelajaran.','An account is required to use learning features.')}</small>
  </section></div><footer>El-Kīmiyā · Understand Chemistry. Anywhere.</footer>
 </main>;
}
