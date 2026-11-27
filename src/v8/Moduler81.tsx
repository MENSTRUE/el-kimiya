import { useEffect, useRef, useState } from 'react';
// ELKIMIYA_V82_MODULER_HOME — V8.5 responsive Moduler, same verified role boundary.
import { Home, LayoutDashboard, BookOpen, ClipboardList, Layers, Library, Atom, BrainCircuit, User, Info, LogOut, Moon, Sun, Menu, X, ChevronRight } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { BrandMark } from '../components/BrandMark';
import { useLanguage, LanguageSwitch } from '../lib/language';
import { usePlatform, v8Auth } from './platform';
import { AccountPanel, AboutPage, ModulerPage, type StudioSection, type EditorState } from './Workspace';
import { writeGuest } from './routes81';
import './moduler85.css';

type Section=StudioSection|'profile'|'about';
const emptyState:EditorState={busy:false,dirty:false};

export function ModulerWorkspace81({dark,setDark,onHome}:{dark:boolean;setDark:(v:boolean)=>void;onHome:()=>void}){
 const {language}=useLanguage();const t=(id:string,en:string)=>language==='en'?en:id;
 const {user,role,roleReady}=usePlatform();
 const [section,S]=useState<Section>('overview'),[mobile,M]=useState(false),[busy,B]=useState(false),[error,E]=useState(false),[editorState,setEditorState]=useState<EditorState>(emptyState);
 const drawer=useRef<HTMLDialogElement>(null),mobileTrigger=useRef<HTMLButtonElement>(null),closeButton=useRef<HTMLButtonElement>(null);
 const nav:{id:Section;label:string;icon:typeof User}[]=[
  {id:'overview',label:t('Ringkasan','Overview'),icon:LayoutDashboard},
  {id:'lesson',label:t('Materi','Lessons'),icon:BookOpen},
  {id:'question',label:t('Bank soal','Question bank'),icon:ClipboardList},
  {id:'flashcard',label:t('Kartu hafalan','Flashcards'),icon:Layers},
  {id:'reference',label:t('Referensi','References'),icon:Library},
  {id:'molecule',label:t('Molekul','Molecules'),icon:Atom},
  {id:'ai',label:t('Konfigurasi AI','AI configuration'),icon:BrainCircuit},
  {id:'profile',label:t('Akun Moduler','Moduler account'),icon:User},
  {id:'about',label:t('Tentang El-Kīmiyā','About El-Kīmiyā'),icon:Info}
 ];
 // Native modal is placed in the browser top layer (no clipped fixed panel or accidental
 // scroll on the app behind it). Esc, backdrop, button and native Back all close it.
 useEffect(()=>{
  const el=drawer.current;if(!el)return;
  if(mobile&&!el.open){el.showModal();closeButton.current?.focus();}
  if(!mobile&&el.open)el.close();
  if(!mobile)return;
  const before=document.body.style.overflow;document.body.style.overflow='hidden';
  return()=>{document.body.style.overflow=before;if(el.open)el.close();};
 },[mobile]);
 useEffect(()=>{
  const mq=window.matchMedia('(max-width:900px)');
  const changed=()=>{if(!mq.matches)M(false);};
  mq.addEventListener('change',changed);return()=>mq.removeEventListener('change',changed);
 },[]);
 const close=()=>{M(false);};
 const allowLeave=()=>!editorState.busy&&!busy&&(!editorState.dirty||confirm(t('Buang perubahan yang belum tersimpan?','Discard unsaved changes?')));
 const select=(s:Section)=>{
  if(s===section){close();return;}
  if(!allowLeave())return;
  setEditorState(emptyState);S(s);close();window.scrollTo({top:0,behavior:'auto'});
 };
 const home=()=>{if(allowLeave()){close();onHome();}};
 async function logout(){
  if(!allowLeave())return;B(true);E(false);close();
  try{await signOut(v8Auth());writeGuest(false);history.replaceState(null,'','#landing');window.location.reload();}
  catch{E(true);B(false);}
 }
 if(!roleReady||role!=='moduler'||!user)return null;
 const active=nav.find(n=>n.id===section)!;
 const locked=editorState.busy||busy;
 const links=(list:typeof nav)=>list.map(n=><button type="button" key={n.id} data-elk-route={n.id} aria-current={section===n.id?'page':undefined} className={section===n.id?'selected':''} disabled={locked&&section!==n.id} onClick={()=>select(n.id)}><n.icon size={20} aria-hidden="true"/><span>{n.label}</span>{section===n.id&&<ChevronRight size={16} aria-hidden="true"/>}</button>);
 const menu=(isMobile:boolean)=><>
  <div className="v81-admin-brand"><button type="button" aria-label={t('Ringkasan Moduler','Moduler overview')} onClick={()=>select('overview')} disabled={locked&&section!=='overview'}><BrandMark showTagline size="sm"/></button>{isMobile&&<button type="button" ref={closeButton} data-elk-drawer-close="" className="v81-mobile-close" aria-label={t('Tutup menu','Close menu')} onClick={close}><X size={23}/></button>}</div>
  <div className="v81-admin-role">MODULER STUDIO</div>
  <nav className="v85-admin-links" aria-label={t('Menu Moduler','Moduler navigation')}>
   {links(nav.slice(0,1))}
   <p>{t('MANAJEMEN KONTEN','CONTENT MANAGEMENT')}</p>{links(nav.slice(1,6))}
   <p>{t('SISTEM & AKUN','SYSTEM & ACCOUNT')}</p>{links(nav.slice(6))}
  </nav>
  <div className="v85-admin-footer">
   <button type="button" className="v82-home" onClick={home} disabled={locked}><Home size={19} aria-hidden="true"/><span>{t('Ke halaman utama','Back to homepage')}</span></button>
   <button type="button" className="v81-admin-logout" onClick={()=>void logout()} disabled={locked}><LogOut size={19} aria-hidden="true"/><span>{busy?t('Memproses…','Signing out…'):t('Keluar akun','Sign out')}</span></button>
   <div className="v81-admin-user"><span className="v81-initial" aria-hidden="true">{(user.displayName||user.email||'M').slice(0,2).toUpperCase()}</span><div><strong>{user.displayName||user.email||'Moduler'}</strong><small>{t('Akses pengelola','Manager access')}</small></div></div>
  </div>
 </>;
 return <div className="v81-moduler v85-mod-shell" data-web-version="8.2" data-elk-ui-v85="ready" data-elk-role="moduler" data-elk-section={section}>
  <aside className="v81-admin-nav v85-nav-surface v85-mod-desktop" aria-label={t('Navigasi Moduler','Moduler navigation')}>{menu(false)}</aside>
  <dialog ref={drawer} id="elk-moduler-menu" className="v85-drawer v85-moduler-drawer" data-elk-drawer="" data-elk-drawer-open={mobile?'true':'false'} aria-label={t('Menu Moduler','Moduler menu')}
   onCancel={e=>{e.preventDefault();close();}} onClose={()=>{M(false);if(mobileTrigger.current?.getClientRects().length)mobileTrigger.current.focus();}}
   onClick={e=>{if(e.target===e.currentTarget)close();}}>
   <div className="v85-mod-drawer-content v85-nav-surface">{menu(true)}</div>
  </dialog>
  <div className="v81-admin-main v85-mod-main">
   <header className="v81-admin-top v85-mod-header">
    <button type="button" ref={mobileTrigger} data-elk-drawer-toggle="" className="v81-mobile-menu v81-icon" aria-label={t('Buka menu','Open menu')} aria-haspopup="dialog" aria-controls="elk-moduler-menu" aria-expanded={mobile} onClick={()=>M(true)}><Menu size={23}/></button>
    <div className="v85-mod-heading"><span>EL-KĪMIYĀ / MODULER</span><h1>{active.label}</h1></div>
    <div className="v81-auth-tools v85-mod-tools">
     <button className="v82-home" onClick={home} disabled={locked} type="button" aria-label={t('Ke halaman utama','Back to homepage')}><Home size={19}/></button>
     <LanguageSwitch/>
     <button type="button" className="v81-icon" data-elk-theme-toggle="" aria-label={t('Ganti tema','Toggle theme')} aria-pressed={dark} onClick={()=>setDark(!dark)}>{dark?<Sun size={21}/>:<Moon size={21}/>}</button>
    </div>
   </header>
   {error&&<p className="v85-mod-signout-error" role="alert">{t('Keluar akun belum berhasil. Coba lagi.','Sign-out did not complete. Please try again.')}</p>}
   {section==='profile'?<main className="v8-page"><AccountPanel go={p=>{if(p==='moduler')select('overview');else if(p==='landing'){writeGuest(false);history.replaceState(null,'','#landing');window.location.reload();}}}/></main>:section==='about'?<AboutPage/>:<ModulerPage key={section} section={section} onSection={select} go={()=>select('overview')} onEditorState={setEditorState}/>}
  </div>
 </div>;
}
