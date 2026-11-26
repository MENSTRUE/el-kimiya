import { useState } from 'react';
// ELKIMIYA_V82_MODULER_HOME
import { Home, LayoutDashboard, BookOpen, ClipboardList, Layers, Library, Atom, BrainCircuit, User, Info, LogOut, Moon, Sun, Menu, X, ChevronRight } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { BrandMark } from '../components/BrandMark';
import { useLanguage, LanguageSwitch } from '../lib/language';
import { usePlatform, v8Auth } from './platform';
import { AccountPanel, AboutPage, ModulerPage, type StudioSection } from './Workspace';
import { writeGuest } from './routes81';
import type { ReactNode } from 'react';
type Section=StudioSection|'profile'|'about';
export function ModulerWorkspace81({dark,setDark,onHome}:{dark:boolean;setDark:(v:boolean)=>void;onHome:()=>void}){
 const {language}=useLanguage();const en=language==='en';const t=(id:string,english:string)=>en?english:id;
 const {user,role,roleReady}=usePlatform();const [section,S]=useState<Section>('overview'),[mobile,M]=useState(false),[busy,B]=useState(false),[error,E]=useState('');
 const nav:{id:Section;label:string;icon:typeof User}[]=[{id:'overview',label:t('Ringkasan','Overview'),icon:LayoutDashboard},{id:'lesson',label:t('Materi','Lessons'),icon:BookOpen},{id:'question',label:t('Bank soal','Question bank'),icon:ClipboardList},{id:'flashcard',label:t('Kartu hafalan','Flashcards'),icon:Layers},{id:'reference',label:t('Referensi','References'),icon:Library},{id:'molecule',label:t('Molekul','Molecules'),icon:Atom},{id:'ai',label:t('Konfigurasi AI','AI configuration'),icon:BrainCircuit},{id:'profile',label:t('Akun Moduler','Moduler account'),icon:User},{id:'about',label:t('Tentang El-Kīmiyā','About El-Kīmiyā'),icon:Info}];
 const select=(s:Section)=>{S(s);M(false);window.scrollTo({top:0,behavior:'auto'});};
 async function logout(){B(true);E('');try{await signOut(v8Auth());writeGuest(false);history.replaceState(null,'','#landing');window.location.reload();}catch(e){E(e instanceof Error?e.message:String(e));B(false);}}
 if(!roleReady||role!=='moduler'||!user)return null;
 const active=nav.find(n=>n.id===section)!;
 const links=(list:typeof nav):ReactNode=>list.map(n=><button type="button" key={n.id} aria-current={section===n.id?'page':undefined} className={section===n.id?'selected':''} onClick={()=>select(n.id)}><n.icon size={19}/><span>{n.label}</span>{section===n.id&&<ChevronRight size={16}/>}</button>);
 return <div className="v81-moduler" data-web-version="8.2"><aside className={`v81-admin-nav ${mobile?'v81-open':''}`}><div className="v81-admin-brand"><button onClick={()=>select('overview')}><BrandMark showTagline size="sm"/></button><button className="v81-mobile-close" aria-label={t('Tutup menu','Close menu')} onClick={()=>M(false)}><X size={22}/></button></div><div className="v81-admin-role">MODULER STUDIO</div><button type="button" className="v82-home" onClick={onHome}><Home size={18}/>{t("Ke halaman utama","Back to homepage")}</button><button className="v81-admin-logout" onClick={()=>void logout()} disabled={busy}><LogOut size={19}/>{t("Keluar akun","Sign out")}</button><nav aria-label={t('Menu Moduler','Moduler navigation')}>{links(nav.slice(0,1))}<p>{t('MANAJEMEN KONTEN','CONTENT MANAGEMENT')}</p>{links(nav.slice(1,6))}<p>{t('SISTEM & AKUN','SYSTEM & ACCOUNT')}</p>{links(nav.slice(6))}</nav><div className="v81-admin-user"><span className="v81-initial">{(user.displayName||user.email||'M').slice(0,2).toUpperCase()}</span><div><strong>{user.displayName||user.email}</strong><small>{t('Akses pengelola','Manager access')}</small></div></div>{error&&<p role="alert">{error}</p>}</aside>{mobile&&<button className="v81-admin-overlay" aria-label={t('Tutup menu','Close menu')} onClick={()=>M(false)}/>}
 <div className="v81-admin-main"><header className="v81-admin-top"><button className="v81-mobile-menu v81-icon" onClick={()=>M(true)} aria-label={t('Buka menu','Open menu')}><Menu size={22}/></button><div><span>EL-KĪMIYĀ / MODULER</span><h1>{active.label}</h1></div><div className="v81-auth-tools"><button className="v82-home" onClick={onHome} type="button" aria-label={t("Ke halaman utama","Back to homepage")}><Home size={17}/></button><LanguageSwitch/><button className="v81-icon" aria-label={t('Ganti tema','Toggle theme')} onClick={()=>setDark(!dark)}>{dark?<Sun size={20}/>:<Moon size={20}/>}</button></div></header>
 {section==='profile'?<main className="v8-page"><AccountPanel go={p=>{if(p==='moduler')select('overview');else if(p==='landing'){writeGuest(false);history.replaceState(null,'','#landing');window.location.reload();}}}/></main>:section==='about'?<AboutPage/>:<ModulerPage key={section} section={section} onSection={select} go={()=>select('overview')}/>}
 </div></div>;
}
