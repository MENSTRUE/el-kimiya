import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { getAuth, onAuthStateChanged, type User } from 'firebase/auth';
import { getFirestore, collection, doc, getDoc, onSnapshot, query, where, limit, type Firestore } from 'firebase/firestore';
import { firebaseConfigured, setupAppCheck } from '../lib/hybrid';
export type Bi = { id:string; en:string };
export type Kind = 'lesson'|'question'|'flashcard'|'reference'|'molecule';
export type Entry = { key:string; kind:Kind; title:Bi; body:Bi; answer:Bi; alternate:Bi; source:string; status:'draft'|'published' };
export type Policy = { guidance:Bi };
type Context = { user:User|null; role:'guest'|'user'|'moduler'; ready:boolean; db:Firestore|null; items:Entry[]; policy:Policy|null; issue:string; catalogIssue:string; catalogReady:boolean };
const initial:Context={user:null,role:'guest',ready:false,db:null,items:[],policy:null,issue:'',catalogIssue:'',catalogReady:false};
const C = createContext(initial);
export const usePlatform = () => useContext(C);
export const v8Auth = () => { if(!firebaseConfigured) throw Error("Firebase configuration required"); return getAuth(setupAppCheck()); };
export function PlatformProvider({children}:{children:ReactNode}) {
 const [state,setState]=useState(initial);
 useEffect(()=>{
  if(!firebaseConfigured){setState(s=>({...s,ready:true,issue:'Firebase configuration required'}));return;}
  let stop=()=>{}, stopRole=()=>{}, stopItems=()=>{}, stopPolicy=()=>{}; let alive=true;
  try {
   const app=setupAppCheck(); const db=getFirestore(app);
   setState(s=>({...s,db}));
   stop=onAuthStateChanged(getAuth(app), user=>{
    stopRole(); if(!alive)return;
    setState(s=>({...s,user,role:user?'user':'guest',ready:true,issue:''}));
    if(user) stopRole=onSnapshot(doc(db,'v8Roles',user.uid), snap=>{
     if(alive)setState(s=>s.user?.uid===user.uid?{...s,role:snap.data()?.role==='moduler'?'moduler':'user'}:s);
    },()=>{if(alive)setState(s=>({...s,issue:'Role verification unavailable; privileged access denied',role:s.user?'user':'guest'}));});
   },e=>{if(alive)setState(s=>({...s,ready:true,issue:e.message}));});
   stopItems=onSnapshot(query(collection(db,'v8Content'),where('status','==','published'),limit(100)),snap=>{
    if(alive)setState(s=>({...s,items:snap.docs.map(d=>({...d.data(),key:d.id} as Entry)),catalogReady:true,catalogIssue:''}));
   },e=>{if(alive)setState(s=>({...s,catalogReady:true,catalogIssue:e.code}));});
   stopPolicy=onSnapshot(doc(db,'v8Public','tutor'),snap=>{if(alive)setState(s=>({...s,policy:snap.exists()?snap.data() as Policy:null}));},()=>{});
  }catch(e){setState(s=>({...s,ready:true,issue:e instanceof Error?e.message:String(e)}));}
  return ()=>{alive=false;stop();stopRole();stopItems();stopPolicy();};
 },[]);
 return <C.Provider value={state}>{children}</C.Provider>;
}
export async function readBackup(db:Firestore,uid:string){return getDoc(doc(db,'v8Users',uid,'private','learning'));}
