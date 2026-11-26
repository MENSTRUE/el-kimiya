import { useEffect, useState, type ReactNode } from 'react';
import { signOut } from 'firebase/auth';
import { useLanguage } from '../lib/language';
import { BrandMark } from '../components/BrandMark';
import { usePlatform, v8Auth } from './platform';
import { bindLearningScope, getBoundScope } from './learningStorage';
import { writeGuest } from './routes81';
export function SessionBoundary({children}:{children:ReactNode}) {
  const {user,role,ready,roleReady,roleIssue} = usePlatform();
  const {language}=useLanguage(); const en=language==='en';
  const [error,setError]=useState(''); const [busy,setBusy]=useState(false);
  const target=user?`uid:${user.uid}`:'guest';
  const bound=getBoundScope();
  const settled=ready&&(!user||roleReady)&&!roleIssue;
  const changed=settled&&bound!==null&&bound!==target;
  useEffect(()=>{
    if(!changed)return;
    writeGuest(false);
    const next=user?(role==='moduler'?'moduler':'dashboard'):'landing';
    history.replaceState(null,'',`#${next}`);
    window.location.reload();
  },[changed,user,role]);
  if(settled&&!changed){bindLearningScope(target);return <>{children}</>;}
  let dark=false;try{dark=window.localStorage.getItem('elk.dark')==='true';}catch{/* optional */}
  return <div className={dark?'app dark':'app'}><main className="v81-session"><section className="v8-card" aria-live="polite"><BrandMark showTagline/><h2>{roleIssue?(en?'Access verification unavailable':'Verifikasi akses belum tersedia'):(en?'Preparing your workspace…':'Menyiapkan ruang kerja…')}</h2><p>{roleIssue?(en?'A live Firestore role check is required before entering an account workspace. Check your connection and rules.':'Pemeriksaan role Firestore diperlukan sebelum membuka akun. Periksa koneksi dan aturan akses.'):(en?'Checking the current session and permissions.':'Memeriksa sesi serta hak akses.')}</p>{roleIssue&&<div className="v8-actions"><button onClick={()=>window.location.reload()}>{en?'Retry':'Coba lagi'}</button><button disabled={busy} onClick={async()=>{setBusy(true);try{await signOut(v8Auth());writeGuest(false);history.replaceState(null,'','#landing');window.location.reload();}catch(e){setError(e instanceof Error?e.message:String(e));setBusy(false);}}}>{en?'Sign out':'Keluar akun'}</button></div>}{error&&<p role="alert">{error}</p>}</section></main></div>;
}
