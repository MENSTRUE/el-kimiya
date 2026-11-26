import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { getAuth, onAuthStateChanged, type User } from 'firebase/auth';
import { getFirestore, collection, doc, getDoc, onSnapshot, query, where, limit, type Firestore } from 'firebase/firestore';
import { firebaseConfigured, setupAppCheck } from '../lib/hybrid';
export type Bi = { id:string; en:string };
export type Kind = 'lesson'|'question'|'flashcard'|'reference'|'molecule';
export type Entry = { key:string; kind:Kind; title:Bi; body:Bi; answer:Bi; alternate:Bi; source:string; status:'draft'|'published' };
export type Policy = { guidance:Bi };
type Context = { user:User|null; role:'guest'|'user'|'moduler'; ready:boolean; roleReady:boolean; roleIssue:string; db:Firestore|null; items:Entry[]; policy:Policy|null; issue:string; catalogIssue:string; catalogReady:boolean };
const initial:Context={user:null,role:'guest',ready:false,roleReady:false,roleIssue:'',db:null,items:[],policy:null,issue:'',catalogIssue:'',catalogReady:false};
const C = createContext(initial);
export const usePlatform = () => useContext(C);
export const v8Auth = () => { if(!firebaseConfigured) throw Error("Firebase configuration required"); return getAuth(setupAppCheck()); };
export function PlatformProvider({children}:{children:ReactNode}) {
 const [state,setState]=useState(initial);
 useEffect(()=>{
  if(!firebaseConfigured){setState(s=>({...s,ready:true,issue:'Firebase configuration required'}));return;}
  // ELKIMIYA_V82_AUTH_CATALOG
  let stop=()=>{}, stopRole=()=>{}; let alive=true;
  try {
   const app=setupAppCheck(); const db=getFirestore(app);
   setState(s=>({...s,db}));
   stop=onAuthStateChanged(getAuth(app), user=>{
    stopRole(); if(!alive)return;
    setState(s=>({...s,user,role:'guest',ready:true,roleReady:!user,roleIssue:'',issue:'',items:[],policy:null,catalogReady:false,catalogIssue:''}));
    if(user) stopRole=onSnapshot(doc(db,'v8Roles',user.uid), {includeMetadataChanges:true}, snap=>{
     if(alive)setState(s=>s.user?.uid!==user.uid?s:snap.metadata.fromCache?(s.role==='user'&&s.roleReady?s:{...s,role:'guest',roleReady:false,roleIssue:'offline'}):{...s,role:snap.data()?.role==='moduler'?'moduler':'user',roleReady:true,roleIssue:''});
    },()=>{if(alive)setState(s=>s.user?.uid===user.uid?{...s,role:'guest',roleReady:false,roleIssue:'denied'}:s);});
   },e=>{if(alive)setState(s=>({...s,ready:true,issue:e.message}));});
  }catch(e){setState(s=>({...s,ready:true,issue:e instanceof Error?e.message:String(e)}));}
  return ()=>{alive=false;stop();stopRole();};
 },[]);
 const uid=state.user?.uid;
 const db=state.db;
 const roleReady=state.roleReady;
 useEffect(()=>{
  if(!uid||!db||!roleReady)return;
  let active=true;
  const update=(patch:Partial<Context>)=>{if(active)setState(s=>s.user?.uid===uid&&s.roleReady?{...s,...patch}:s);};
  const stopItems=onSnapshot(query(collection(db,'v8Content'),where('status','==','published'),limit(100)),snap=>{
    update({items:snap.docs.map(d=>({...d.data(),key:d.id} as Entry)),catalogReady:true,catalogIssue:''});
  },e=>update({catalogReady:true,catalogIssue:e.code}));
  const stopPolicy=onSnapshot(doc(db,'v8Public','tutor'),snap=>update({policy:snap.exists()?snap.data() as Policy:null}),()=>update({policy:null}));
  return ()=>{active=false;stopItems();stopPolicy();};
 },[uid,db,roleReady]);
 return <C.Provider value={state}>{children}</C.Provider>;
}
export async function readBackup(db:Firestore,uid:string){return getDoc(doc(db,'v8Users',uid,'private','learning'));}
