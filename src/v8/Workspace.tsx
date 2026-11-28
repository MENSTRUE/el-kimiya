import { learningStorage as elkLearningStorage } from './learningStorage';
import { useState, useEffect, useRef, type ReactNode } from 'react';
import { signOut, updateProfile } from 'firebase/auth';
import { collection, doc, onSnapshot, query, limit, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { useLanguage } from '../lib/language';
import { BrandMark } from '../components/BrandMark';
import { usePlatform, v8Auth, readBackup, type Entry, type Kind, type Bi } from './platform';
import {blankBi,blankEntry,studioKinds,fieldLimits,validateEntry,entryFields,decodeEntry,filterEntries,catalogSummary,validGuidance,canWriteStudio,studioErrorCode,type CatalogState,type StudioFilter,type ValidationCode,type StudioError} from './studio85';
type T=(id:string,en:string)=>string;
const errorLabel=(code:StudioError,t:T)=>({
 PERMISSION:t('Akses tidak diizinkan. Periksa izin akun ini.','Access denied. Check this account’s permissions.'),
 CONNECTION:t('Koneksi ke layanan tidak tersedia. Coba lagi saat online.','Service connection unavailable. Retry when online.'),
 QUOTA:t('Batas layanan tercapai. Coba lagi nanti.','Service quota reached. Retry later.'),
 FAILED:t('Operasi belum berhasil. Tidak ada keberhasilan yang dikonfirmasi.','The operation failed. No success was confirmed.')
})[code];
const keys=['elk.stats','elk.v45.learningPath.1','elkimiya.quizbank.v63.progress','elk.v44.cardRatings','elk.notes','elk.customCards'] as const;
export function AccountIdentity(){const {user}=usePlatform();return <>{(user?.displayName||user?.email||'G').slice(0,2).toUpperCase()}</>;}
export function AccountPanel({go}:{go:(p:'account'|'moduler'|'landing')=>void}){
 const {language:l}=useLanguage();const t=(id:string,en:string)=>l==='id'?id:en;const {user,role,db}=usePlatform();const [message,M]=useState(''),[busy,B]=useState(false),[name,N]=useState(user?.displayName||'');const [includeNotes,I]=useState(false);
 useEffect(()=>N(user?.displayName||''),[user?.uid,user?.displayName]);
 async function act(fn:()=>Promise<void>){B(true);M('');try{await fn();}catch(e){M(errorLabel(studioErrorCode(e),t));}finally{B(false);}}
 const save=()=>act(async()=>{if(!db||!user){M(t('Masuk terlebih dahulu.','Sign in first.'));return;}const data:Record<string,string>={};for(const k of keys){if(!includeNotes&&(k==='elk.notes'||k==='elk.customCards'))continue;const raw=elkLearningStorage.getItem(k);if(raw!==null){JSON.parse(raw);data[k]=raw;}}const payload=JSON.stringify(data);if(new TextEncoder().encode(payload).length>180000){M(t('Cadangan melebihi batas 180 KB.','Backup exceeds the 180 KB limit.'));return;}await setDoc(doc(db,'v8Users',user.uid,'private','learning'),{payload,updatedAt:serverTimestamp()});M(t('Cadangan akun tersimpan.','Account backup saved.'));});
 const restore=()=>act(async()=>{if(!db||!user){M(t('Masuk terlebih dahulu.','Sign in first.'));return;}const snap=await readBackup(db,user.uid);if(!snap.exists()){M(t('Belum ada cadangan.','No backup yet.'));return;}const data=JSON.parse(snap.data().payload) as Record<string,unknown>;const valid=keys.filter(k=>typeof data[k]==='string');for(const k of valid)JSON.parse(data[k] as string);if(!confirm(t('Ganti data belajar lokal yang tercantum dengan cadangan akun?','Replace matching local learning data with the account backup?')))return;for(const k of valid)elkLearningStorage.setItem(k,data[k] as string);location.reload();});
 return <section className="v8-card v8-profile"><h2>{t('Akun & sinkronisasi','Account & sync')}</h2>{!user?<><p>{t('Masuk atau buat akun untuk mengakses ruang belajar.','Sign in or register to access the learning workspace.')}</p><button className="v8-primary" onClick={()=>go('account')}>{t('Masuk / Daftar','Sign in / Register')}</button><button onClick={()=>go('landing')}>{t('Ke halaman utama','Back to homepage')}</button></>:<><p>{user.email} · {role==='moduler'?'Moduler':t('Pelajar','Learner')}</p><label>{t('Nama akun','Account name')}<input value={name} maxLength={80} onChange={e=>N(e.target.value)}/></label><div className="v8-actions"><button disabled={busy||!name.trim()} onClick={()=>void act(async()=>{await updateProfile(user,{displayName:name.trim()});M(t('Nama disimpan.','Name saved.'));})}>{t('Simpan nama','Save name')}</button>{role==='moduler'&&<button onClick={()=>go('moduler')}>Moduler Studio</button>}<button disabled={busy} onClick={()=>void act(async()=>{await signOut(v8Auth());go('landing');})}>{t('Keluar akun','Sign out')}</button><button type="button" onClick={()=>go('landing')}>{t('Ke halaman utama','Back to homepage')}</button></div><p>{t('Data belajar baru dipisahkan per akun pada browser ini. Cadangan cloud hanya milik akun ini. Data lokal tidak dienkripsi; hindari perangkat bersama untuk data privat.','New local learning data is separated by account on this browser. Cloud backups belong to this account only. Local storage is not encrypted; avoid shared devices for private data.')}</p><label className="v8-check"><input type="checkbox" checked={includeNotes} onChange={e=>I(e.target.checked)}/>{t('Sertakan catatan dan flashcard pribadi dalam cadangan cloud (opsional)','Include personal notes and flashcards in cloud backup (optional)')}</label><div className="v8-actions"><button disabled={busy||!db} onClick={()=>void save()}>{t('Cadangkan progres','Back up progress')}</button><button disabled={busy||!db} onClick={()=>void restore()}>{t('Pulihkan dari akun','Restore from account')}</button></div></>}<p role="status">{message}</p></section>;
}
// ELKIMIYA_V82_ACCOUNT_REQUIRED
export function AboutPage(){const {language:l}=useLanguage();return <main className="v8-page"><section className="v8-card"><BrandMark size="lg" showTagline/><h2>{l==='id'?'Tentang El-Kīmiyā':'About El-Kīmiyā'}</h2><p>{l==='id'?'Ruang pembelajaran kimia bilingual dengan latihan, penelitian, molekul, dan refleksi keimanan. AI menggunakan Firebase AI Logic dengan sumber inferensi aktual; perangkat yang kompatibel dapat menjalankan model lokal.':'A bilingual chemistry workspace with practice, research, molecules and faith reflection. Firebase AI Logic reports actual inference sources; compatible devices can run a local model.'}</p><p>{l==='id'?'Beranda dan pratinjau dapat dilihat oleh tamu; akun diperlukan untuk membuka ruang belajar. Hasil AI bukan pengganti verifikasi ilmiah.':'The homepage and preview are public; an account is required to open the learning workspace. AI output does not replace scientific verification.'}</p><a href="https://github.com/MENSTRUE/el-kimiya" target="_blank" rel="noreferrer">GitHub · Apache 2.0</a></section></main>}
// ELKIMIYA_V81_STUDIO — V8.5, existing role-guarded Firestore schema only.
export type StudioSection='overview'|Kind|'ai';
export type EditorState={dirty:boolean;busy:boolean};
type Notice={type:'success'|'error';code:'DRAFT_SAVED'|'PUBLISHED'|'DELETED'|'GUIDANCE_SAVED'|StudioError};
const same=(a:unknown,b:unknown)=>JSON.stringify(a)===JSON.stringify(b);
const validationLabel=(code:ValidationCode,t:T)=>({
 TITLE_REQUIRED:t('Judul Indonesia dan Inggris wajib diisi.','Fill in both Indonesian and English titles.'),
 BODY_REQUIRED:t('Isi Indonesia dan Inggris wajib diisi untuk publikasi.','Both Indonesian and English content are required to publish.'),
 SOURCE_REQUIRED:t('Sumber yang dapat diperiksa wajib diisi untuk publikasi.','A verifiable source is required to publish.'),
 ANSWER_REQUIRED:t('Jawaban Indonesia dan Inggris wajib diisi.','Both Indonesian and English answers are required.'),
 ALTERNATE_REQUIRED:t('Pilihan salah Indonesia dan Inggris wajib diisi.','Both Indonesian and English incorrect options are required.'),
 ANSWER_DUPLICATE:t('Jawaban benar dan pilihan salah harus berbeda pada kedua bahasa.','Correct and incorrect answers must differ in both languages.'),
 TITLE_LIMIT:t('Judul maksimal 160 karakter per bahasa.','Titles are limited to 160 characters per language.'),
 BODY_LIMIT:t('Isi maksimal 6.000 karakter per bahasa.','Content is limited to 6,000 characters per language.'),
 ANSWER_LIMIT:t('Jawaban maksimal 1.200 karakter per bahasa.','Answers are limited to 1,200 characters per language.'),
 ALTERNATE_LIMIT:t('Pilihan salah maksimal 1.200 karakter per bahasa.','Incorrect options are limited to 1,200 characters per language.'),
 SOURCE_LIMIT:t('Sumber maksimal 500 karakter.','Sources are limited to 500 characters.'),
 KIND_INVALID:t('Jenis konten tidak valid.','Invalid content type.')
})[code];
function StatusNote({state,t,retry,children}:{state:CatalogState;t:T;retry:()=>void;children?:ReactNode}){
 const descriptions={loading:t('Memuat dan memverifikasi data dari Firestore…','Loading and verifying data from Firestore…'),cached:t('Menunggu konfirmasi server. Data lokal mungkin belum mutakhir; perubahan dinonaktifkan.','Waiting for server confirmation. Cached data may be out of date; editing is disabled.'),ready:t('Data telah dikonfirmasi server.','Data confirmed by the server.'),error:t('Data tidak dapat dimuat. Tidak ada jumlah atau perubahan yang dikonfirmasi.','Unable to load data. Counts and changes are not confirmed.')};
 return <div className={`v85-studio-state state-${state}`} data-elk-catalog-state={state} role="status" aria-live="polite"><div><strong>{({loading:t('Memuat','Loading'),cached:t('Belum terverifikasi','Not yet verified'),ready:t('Terhubung','Connected'),error:t('Tidak tersedia','Unavailable')})[state]}</strong><p>{descriptions[state]}</p>{children}</div>{state==='error'&&<button type="button" onClick={retry}>{t('Coba lagi','Retry')}</button>}</div>
}
export function ModulerPage({go,section,onSection,onEditorState}:{go:()=>void;section:StudioSection;onSection:(s:StudioSection)=>void;onEditorState?:(state:EditorState)=>void}){
 const {language:l}=useLanguage();const t:T=(id,en)=>l==='id'?id:en;
 const platform=usePlatform(),{role,ready,roleReady,db,user}=platform;
 const kind=section==='overview'||section==='ai'?'lesson':section;
 const [items,S]=useState<Entry[]>([]),[rawCount,R]=useState(0),[catalog,C]=useState<CatalogState>('loading'),[attempt,Retry]=useState(0);
 const [draft,D]=useState<Entry>(()=>blankEntry(kind)),[original,O]=useState<Entry>(()=>blankEntry(kind));
 const [search,Q]=useState(''),[filter,F]=useState<StudioFilter>('all');
 const [notice,M]=useState<Notice|null>(null),[busy,B]=useState(false);
 const [guide,G]=useState<Bi>(blankBi),[savedGuide,GS]=useState<Bi>(blankBi),[policyState,PS]=useState<CatalogState>('loading'),[policyAttempt,PR]=useState(0),[policyConflict,PC]=useState(false);
 const guideRef=useRef(guide),savedGuideRef=useRef(savedGuide);
 const updateGuide=(value:Bi)=>{guideRef.current=value;G(value)};
 const adoptGuide=(value:Bi)=>{savedGuideRef.current=value;GS(value);updateGuide(value);PC(false)};
 const mutateBusy=useRef(false);
 const dirty=section==='ai'?!same(guide,savedGuide):section==='overview'?false:!same(draft,original);
 useEffect(()=>{onEditorState?.({dirty,busy});return()=>onEditorState?.({dirty:false,busy:false});},[dirty,busy,onEditorState]);
 useEffect(()=>{if(!dirty)return;const warn=(e:BeforeUnloadEvent)=>{e.preventDefault();e.returnValue='';};window.addEventListener('beforeunload',warn);return()=>window.removeEventListener('beforeunload',warn);},[dirty]);
 useEffect(()=>{
   S([]);R(0);C('loading');
   if(section==='ai')return;
   if(role!=='moduler'||!roleReady||!db||!user){C('error');return;}
   let active=true;
   const stop=onSnapshot(query(collection(db,'v8Content'),limit(100)),{includeMetadataChanges:true},snap=>{
     if(!active)return;
     if(snap.metadata.hasPendingWrites)return; // Do not treat a locally queued write as server success.
     const decoded=snap.docs.map(x=>decodeEntry(x.id,x.data())).filter((x):x is Entry=>x!==null);
     S(decoded);R(snap.size);C(snap.metadata.fromCache?'cached':'ready');
   },()=>{if(active){S([]);R(0);C('error');}});
   return()=>{active=false;stop();};
 },[role,roleReady,db,user?.uid,attempt,section]);
 useEffect(()=>{
   if(section!=='ai')return;
   PS('loading');if(role!=='moduler'||!roleReady||!db||!user){PS('error');return;}
   let active=true;
   const stop=onSnapshot(doc(db,'v8Public','tutor'),{includeMetadataChanges:true},snap=>{
     if(!active||snap.metadata.hasPendingWrites)return;
     if(snap.metadata.fromCache){PS('cached');return;}
     const next=snap.exists()?snap.data().guidance:blankBi();
     if(!validGuidance(next)){PS('error');return;}
     if(same(guideRef.current,savedGuideRef.current))adoptGuide(next);
     else if(!same(next,savedGuideRef.current)&&!same(next,guideRef.current)){savedGuideRef.current=next;GS(next);PC(true);}
     else if(same(next,guideRef.current))adoptGuide(next);
     PS('ready');
   },()=>{if(active)PS('error');});
   return()=>{active=false;stop();};
 },[role,roleReady,db,user?.uid,section,policyAttempt]);
 const labels:Record<Kind,string>={lesson:t('Materi','Lessons'),question:t('Bank soal','Question bank'),flashcard:t('Kartu hafalan','Flashcards'),reference:t('Referensi','References'),molecule:t('Molekul','Molecules')};
 const statusLabel=(status:Entry['status'])=>status==='published'?t('Terbit','Published'):t('Draf','Draft');
 const writable=canWriteStudio(platform,catalog),policyWritable=canWriteStudio(platform,policyState);
 const summary=catalogSummary(items,catalog,rawCount);
 const current=draft.key?items.find(x=>x.key===draft.key):undefined;
 const conflict=!!draft.key&&catalog==='ready'&&(!current||!same(current,original));
 const canNavigate=()=>!busy&&(!dirty||confirm(t('Buang perubahan yang belum tersimpan?','Discard unsaved changes?')));
 function choose(next:Entry){if(!canNavigate())return;D(next);O(next);M(null);}
 const mutate=async(view:CatalogState,success:Notice['code'],fn:()=>Promise<void>)=>{
   if(mutateBusy.current||!canWriteStudio(platform,view))return;
   mutateBusy.current=true;B(true);M(null);
   try{await fn();M({type:'success',code:success});}
   catch(e){M({type:'error',code:studioErrorCode(e)});}
   finally{mutateBusy.current=false;B(false);}
 };
 const save=(status:Entry['status'])=>{
   if(!db||!writable||busy||conflict||validateEntry(draft,status).length)return;
   if(status==='published'&&!confirm(t('Terbitkan konten ini untuk pengguna ruang belajar?','Publish this content to the learner workspace?')))return;
   if(status==='draft'&&original.status==='published'&&!confirm(t('Tarik konten dari ruang belajar dan simpan sebagai draf?','Remove this content from the learner workspace and save it as a draft?')))return;
   const fields=entryFields(draft,status);
   void mutate(catalog,status==='draft'?'DRAFT_SAVED':'PUBLISHED',async()=>{
     const ref=draft.key?doc(db,'v8Content',draft.key):doc(collection(db,'v8Content'));
     await setDoc(ref,{...fields,updatedAt:serverTimestamp()});
     const saved={key:ref.id,...fields};D(saved);O(saved);
   });
 };
 const remove=()=>{
   if(!db||!writable||!draft.key||busy||conflict)return;
   if(!confirm(t('Hapus konten ini secara permanen? Tindakan tidak dapat dibatalkan.','Permanently delete this content? This cannot be undone.')))return;
   void mutate(catalog,'DELETED',async()=>{await deleteDoc(doc(db,'v8Content',draft.key));const next=blankEntry(kind);D(next);O(next);});
 };
 const saveGuide=()=>{
   if(!db||!policyWritable||busy||policyConflict||!validGuidance(guide))return;
   const value={...guide};
   void mutate(policyState,'GUIDANCE_SAVED',async()=>{await setDoc(doc(db,'v8Public','tutor'),{guidance:value,updatedAt:serverTimestamp()});adoptGuide(value);});
 };
 const noticeLabel=notice?.type==='success'?({
   DRAFT_SAVED:t('Draf tersimpan di Firestore.','Draft saved to Firestore.'),
   PUBLISHED:t('Status terbit tersimpan dan konten dapat dimuat pada katalog Learner.','Published status saved; the Learner catalog can load this content.'),
   DELETED:t('Konten dihapus.','Content deleted.'),
   GUIDANCE_SAVED:t('Panduan tutor tersimpan.','Tutor guidance saved.')
 } as Record<string,string>)[notice.code]:notice?errorLabel(notice.code as StudioError,t):'';
 const draftErrors=validateEntry(draft,'draft'),publishErrors=validateEntry(draft,'published');
 const visible=filterEntries(items,kind,filter,search).slice().sort((a,b)=>a.title[l].localeCompare(b.title[l]));
 const fieldLabel={title:t('Judul','Title'),body:t('Isi / pertanyaan / rumus','Body / question / formula'),answer:kind==='flashcard'?t('Jawaban kartu','Card answer'):t('Jawaban benar','Correct answer'),alternate:t('Pilihan salah','Incorrect option')};
 if(!ready||!roleReady)return <main className="v8-page" role="status">{t('Memeriksa akses…','Checking access…')}</main>;
 if(role!=='moduler'||!user)return <main className="v8-page"><section className="v8-card"><h2>{t('Akses terbatas','Restricted access')}</h2><p>{t('Hanya Moduler yang berwenang.','Authorized Moduler only.')}</p><button type="button" onClick={go}>{t('Kembali','Back')}</button></section></main>;
 return <main className={`v8-page v8-studio v85-studio ${section==='overview'?'v81-studio-overview':''}`}>
   <header className="v85-studio-header">
     <span className="v85-eyebrow">{t('RUANG PENGELOLAAN · MODULER','CONTENT STUDIO · MODULER')}</span>
     <h2>{section==='overview'?'Moduler Studio':section==='ai'?t('Konfigurasi Tutor AI','AI Tutor configuration'):labels[section]}</h2>
     <p>{section==='overview'?t('Kelola materi tambahan untuk ruang belajar. Materi bawaan tetap tersedia dan tidak dihitung di sini.','Manage supplementary learning content. Built-in materials remain available and are not counted here.'):section==='ai'?t('Atur panduan tambahan tutor untuk melengkapi pembelajaran.','Manage supplementary tutor guidance for learning.'):t('Susun dan kelola koleksi bilingual tambahan yang dapat ditampilkan kepada Learner.','Create and manage supplementary bilingual content for Learners.')}</p>
   </header>
   {section!=='ai'&&<StatusNote state={catalog} t={t} retry={()=>Retry(a=>a+1)}>
     {catalog==='ready'&&<p>{t('Dokumen tambahan yang valid dimuat:','Valid supplementary documents loaded:')} {items.length} / {rawCount}{rawCount>=100?` · ${t('batas 100 dokumen; bukan total database','100-document cap; not the database total')}`:''}{rawCount!==items.length?` · ${rawCount-items.length} ${t('dokumen tidak terbaca','unreadable documents')}`:''}</p>}
   </StatusNote>}
   {section==='overview'&&<>
     <section className="v8-card v85-overview-card">
       <h3>{t('Koleksi tambahan','Supplementary collection')}</h3>
       <div className="v85-overview-totals"><div><strong>{summary?.total??'—'}</strong><span>{t('Dokumen yang dimuat','Loaded documents')}</span></div><div><strong>{summary?.published??'—'}</strong><span>{t('Terbit','Published')}</span></div><div><strong>{summary?.draft??'—'}</strong><span>{t('Draf','Drafts')}</span></div></div>
       <small>{t('Angka hanya mencakup hingga 100 dokumen tambahan yang dimuat. Materi bawaan aplikasi tidak berubah.','Counts cover up to 100 loaded supplementary documents only. Built-in application content is unchanged.')}</small>
     </section>
     <section className="v85-category-section"><h3>{t('Kelola per kategori','Manage by category')}</h3>
       <div className="v8-metrics v85-category-grid">{studioKinds.map(k=><button type="button" key={k} onClick={()=>onSection(k)}><span>{labels[k]}</span><strong>{summary?.byKind[k]??'—'}</strong><small>{t('Tambahan dimuat','Loaded additions')} · {t('Buka','Open')} ›</small></button>)}</div>
     </section>
     <section className="v8-card v85-overview-card"><h3>{t('Panduan Tutor AI','AI Tutor guidance')}</h3><p>{t('Sesuaikan konteks pembelajaran dalam dua bahasa tanpa mengubah model, privasi, atau keselamatan AI.','Adjust bilingual learning context without changing AI models, privacy, or safety.')}</p><button type="button" className="v8-primary" onClick={()=>onSection('ai')}>{t('Buka konfigurasi Tutor AI','Open AI Tutor configuration')}</button></section>
   </>}
   {section!=='overview'&&section!=='ai'&&<div className="v8-studio-grid v85-editor-grid">
     <section className="v8-card v85-content-list" data-elk-content-list="">
       <div className="v85-studio-card-heading"><h3>{t('Koleksi','Collection')}</h3><button type="button" className="v8-primary" disabled={busy} onClick={()=>choose(blankEntry(kind))}>{t('Buat baru','Create new')}</button></div>
       <label>{t('Cari koleksi','Search collection')}<input type="search" value={search} onChange={e=>Q(e.target.value)} placeholder={t('Judul, isi, sumber…','Title, body, source…')}/></label>
       <label>{t('Status','Status')}<select value={filter} onChange={e=>F(e.target.value as StudioFilter)}><option value="all">{t('Semua','All')}</option><option value="draft">{t('Draf','Drafts')}</option><option value="published">{t('Terbit','Published')}</option></select></label>
       <p className="v85-list-count">{catalog==='ready'?`${visible.length} ${t('hasil dari','results from')} ${items.filter(x=>x.kind===kind).length} ${t('dokumen tambahan dimuat','loaded supplementary documents')}`:t('Koleksi belum terverifikasi.','Collection not yet verified.')}</p>
       <div className="v85-entry-list">
         {visible.map(x=><button type="button" className="v8-entry" aria-pressed={draft.key===x.key} key={x.key} disabled={busy} onClick={()=>choose(x)}><strong>{x.title[l]||x.title[l==='id'?'en':'id']||t('(Tanpa judul)','(Untitled)')}</strong><span className={`v85-entry-status ${x.status}`}>{statusLabel(x.status)}</span></button>)}
         {!visible.length&&catalog==='ready'&&<p>{search||filter!=='all'?t('Tidak ada hasil untuk filter ini.','No results match this filter.'):t('Belum ada dokumen tambahan di kategori ini. Konten bawaan tidak termasuk dalam koleksi ini.','No supplementary documents loaded in this category. Built-in content is not included.')}</p>}
       </div>
     </section>
     <section className="v8-card v85-content-editor" data-elk-editor="" aria-busy={busy}>
       <div className="v85-studio-card-heading"><div><h3>{draft.key?t('Edit konten','Edit content'):t('Konten baru','New content')}</h3><p>{labels[draft.kind]} · {statusLabel(draft.status)}{dirty?` · ${t('Belum disimpan','Unsaved changes')}`:''}</p></div></div>
       {conflict&&<div role="alert" className="v85-editor-alert">{t('Dokumen berubah atau tidak lagi tersedia pada hasil server. Muat ulang sebelum mengedit agar perubahan lama tidak menimpa data baru.','The document changed or is no longer available in the server results. Reload it before editing to prevent overwriting changes.')} <button type="button" onClick={()=>choose(current||blankEntry(kind))}>{t('Muat ulang dokumen','Reload document')}</button></div>}
       <p className="v85-editor-instructions">{t('Draf memerlukan judul dalam kedua bahasa. Publikasi juga memerlukan isi, sumber, dan jawaban yang sesuai untuk soal atau kartu.','Drafts require titles in both languages. Publishing also requires content, a source, and appropriate answers for questions or flashcards.')}</p>
       <fieldset disabled={busy} className="v85-fieldset">
         {(['title','body',...(['question','flashcard'].includes(draft.kind)?['answer']:[]),...(draft.kind==='question'?['alternate']:[])] as ('title'|'body'|'answer'|'alternate')[]).map(field=><div className="v85-editor-field" key={field}>
           <strong>{fieldLabel[field]} <small>{field==='title'?t('Wajib untuk draf','Required for draft'):t('Wajib untuk terbit','Required to publish')}</small></strong>
           <div className="v8-fields">{(['id','en'] as const).map(lang=><label key={lang}>{lang==='id'?'Bahasa Indonesia (ID)':'English (EN)'}<textarea rows={field==='body'?5:field==='title'?2:3} maxLength={fieldLimits[field]} value={draft[field][lang]} onChange={e=>D({...draft,[field]:{...draft[field],[lang]:e.target.value}})}/><small className="v85-field-count">{draft[field][lang].length} / {fieldLimits[field]}</small></label>)}</div>
         </div>)}
         <label>{t('Sumber yang dapat diperiksa','Verifiable source')}<input value={draft.source} maxLength={fieldLimits.source} placeholder={t('URL, sitasi, atau CID','URL, citation, or CID')} onChange={e=>D({...draft,source:e.target.value})}/><small className="v85-field-count">{draft.source.length} / {fieldLimits.source}</small></label>
       </fieldset>
       {!!publishErrors.length&&<div className="v85-editor-requirements"><strong>{t('Sebelum publikasi','Before publishing')}</strong><ul>{publishErrors.map(e=><li key={e}>{validationLabel(e,t)}</li>)}</ul></div>}
       {!writable&&<p role="status">{t('Penyimpanan tersedia hanya ketika akses Moduler dan data server telah terverifikasi.','Saving is enabled only after Moduler access and server data are verified.')}</p>}
       <div className="v8-actions v85-editor-actions"><button type="button" disabled={!writable||busy||conflict||!!draftErrors.length} onClick={()=>save('draft')}>{draft.status==='published'?t('Tarik ke draf','Move to draft'):t('Simpan draf','Save draft')}</button><button type="button" className="v8-primary" disabled={!writable||busy||conflict||!!publishErrors.length} onClick={()=>save('published')}>{draft.status==='published'?t('Perbarui publikasi','Update publication'):t('Publikasikan','Publish')}</button>{draft.key&&<button type="button" className="v85-danger" disabled={!writable||busy||conflict} onClick={remove}>{t('Hapus','Delete')}</button>}</div>
     </section>
   </div>}
   {section==='ai'&&<>
     <StatusNote state={policyState} t={t} retry={()=>PR(a=>a+1)}/>
     <section className="v8-card v85-ai-guidance" data-elk-editor="" aria-busy={busy}>
       <h3>{t('Panduan konteks Tutor AI','AI Tutor context guidance')}</h3>
       <p>{t('Panduan tambahan untuk tutor utama, bukan pengaturan model atau mode inferensi. Jangan masukkan data pribadi, rahasia, atau kredensial.','Supplementary guidance for the main Tutor, not model or inference settings. Do not enter personal data, secrets, or credentials.')}</p>
       {policyConflict&&<div className="v85-editor-alert" role="alert">{t('Panduan berubah di server. Muat ulang sebelum menyimpan.','Guidance changed on the server. Reload before saving.')} <button type="button" onClick={()=>{if(canNavigate())adoptGuide(savedGuideRef.current);}}>{t('Muat ulang panduan','Reload guidance')}</button></div>}
       <fieldset disabled={busy} className="v85-fieldset v8-fields">{(['id','en'] as const).map(lang=><label key={lang}>{lang==='id'?'Bahasa Indonesia (ID)':'English (EN)'}<textarea rows={7} maxLength={fieldLimits.guide} value={guide[lang]} onChange={e=>updateGuide({...guide,[lang]:e.target.value})}/><small className="v85-field-count">{guide[lang].length} / {fieldLimits.guide}</small></label>)}</fieldset>
       <small>{t('Kedua panduan dapat dikosongkan untuk menonaktifkan arahan tambahan.','Both guidance fields may be empty to disable supplementary guidance.')}</small>
       <button type="button" className="v8-primary" disabled={!policyWritable||busy||policyConflict||!validGuidance(guide)||!dirty} onClick={saveGuide}>{t('Simpan konfigurasi tutor','Save tutor guidance')}</button>
     </section>
   </>}
   {busy&&<div className="v85-save-notice" role="status">{t('Menunggu konfirmasi perubahan dari server…','Waiting for server confirmation of changes…')}</div>}
   {notice&&<div className={`v85-save-notice ${notice.type}`} role={notice.type==='error'?'alert':'status'}>{noticeLabel}</div>}
 </main>;
}
export function PublishedContent({kind,onAsk,onAnswer}:{kind:Kind;onAsk:(prompt:string)=>void;onAnswer?:(correct:boolean)=>void}){
 const {language:l}=useLanguage();const t=(id:string,en:string)=>l==='id'?id:en;const {items,catalogIssue,catalogReady}=usePlatform();const [open,O]=useState<string[]>([]),[answers,A]=useState<Record<string,boolean>>({});const visible=items.filter(x=>x.kind===kind);
 if(!visible.length&&!catalogIssue)return null;
 return <section className="v8-page v8-published"><h2>{t('Konten terbaru dari Moduler','Latest content from Moduler')}</h2>{catalogIssue&&<p>{t('Konten cloud belum tersedia. Materi bawaan tetap dapat digunakan.','Cloud content unavailable. Built-in materials remain usable.')}</p>}{!catalogReady&&<p>…</p>}<div className="v8-content-grid">{visible.map(x=><article className="v8-card" key={x.key}><h3>{x.title[l]}</h3><p className="v8-body">{x.body[l]}</p><small>{t('Sumber:','Source:')} {x.source}</small>{kind==='question'&&<><div className="v8-actions">{(x.key.charCodeAt(0)%2?[false,true]:[true,false]).map(correct=><button key={String(correct)} disabled={x.key in answers} onClick={()=>{A(a=>({...a,[x.key]:correct}));onAnswer?.(correct);}}>{correct?x.answer[l]:x.alternate[l]}</button>)}</div>{x.key in answers&&<p role="status">{answers[x.key]?t('Benar!','Correct!'):t('Belum tepat. Jawaban: ','Not quite. Answer: ')+x.answer[l]}</p>}</>}{kind==='flashcard'&&<><button onClick={()=>O(a=>a.includes(x.key)?a.filter(k=>k!==x.key):[...a,x.key])}>{t('Balik kartu','Flip card')}</button>{open.includes(x.key)&&<p>{x.answer[l]}</p>}</>}<button onClick={()=>onAsk(`${t('Jelaskan materi berikut berdasarkan sumber yang disediakan.','Explain the following material based on the provided source.')}\n${x.title[l]}\n${x.body[l]}\nSource: ${x.source}`)}>{t('Diskusikan dengan AI','Discuss with AI')}</button></article>)}</div></section>;
}
