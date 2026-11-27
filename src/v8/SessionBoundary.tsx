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
  // Only display the splash while an authentication/role check is genuinely pending.
  // A failed role check remains blocked; neither retry nor the visual layer grants access.
  let dark=window.matchMedia('(prefers-color-scheme: dark)').matches;
  try { const saved=window.localStorage.getItem('elk.dark'); if(saved!==null) dark=saved==='true'; } catch { /* optional */ }
  return (
    <div data-elk-splash="true" className={dark?'app dark':'app'}>
      <main className="v81-session v84-session-splash v85-splash" aria-busy={!roleIssue}>
        <section className="v84-session-inner">
          <BrandMark size="lg" showTagline/>
          <div className="v84-session-copy" role="status" aria-live="polite">
            {!roleIssue&&<span className="v84-session-spinner" aria-hidden="true"/>}
            <h2>{roleIssue?(en?'Access verification unavailable':'Verifikasi akses belum tersedia'):(en?'Preparing your workspace…':'Menyiapkan ruang kerja…')}</h2>
            <p>{roleIssue?(en?'A live Firestore role check is required before entering an account workspace. Check your connection and rules.':'Pemeriksaan role Firestore diperlukan sebelum membuka ruang kerja akun. Periksa koneksi dan aturan akses.'):(en?'Checking your session and permissions.':'Memeriksa sesi serta hak akses.')}</p>
          </div>
          {roleIssue&&<div className="v84-session-actions">
            <button type="button" className="primary-button" disabled={busy} onClick={()=>window.location.reload()}>{en?'Retry':'Coba lagi'}</button>
            <button type="button" className="secondary-button" disabled={busy} onClick={async()=>{setBusy(true);setError('');try{await signOut(v8Auth());writeGuest(false);history.replaceState(null,'','#landing');window.location.reload();}catch(e){setError(e instanceof Error?e.message:String(e));setBusy(false);}}}>{busy?(en?'Signing out…':'Keluar akun…'):(en?'Sign out':'Keluar akun')}</button>
          </div>}
          {error&&<p className="inline-alert" role="alert">{error}</p>}
        </section>
      </main>
    </div>
  );
}
