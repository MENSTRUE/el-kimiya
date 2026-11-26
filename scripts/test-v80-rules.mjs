/* ELKIMIYA_V82_SIGNED_READS — Optional integration test: only a demo Firebase Emulator project, never production. */
import assert from 'node:assert/strict';
import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, connectAuthEmulator, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator, doc, collection, setDoc, getDoc, getDocs, query, where, limit, deleteDoc, serverTimestamp } from 'firebase/firestore';
const projectId='demo-elkimiya-v80';
const fh=process.env.FIRESTORE_EMULATOR_HOST, ah=process.env.FIREBASE_AUTH_EMULATOR_HOST;
if(!fh||!ah||!/^((localhost|127\.0\.0\.1):\d+)$/.test(fh)||!/^((localhost|127\.0\.0\.1):\d+)$/.test(ah))throw Error('Run via local firebase emulators:exec; emulator hosts required.');
const apps=[];
async function client(name, authenticated){const app=initializeApp({projectId,apiKey:'demo-key',authDomain:'demo-elkimiya-v80.firebaseapp.com'},name);apps.push(app);const auth=getAuth(app);connectAuthEmulator(auth,`http://${ah}`,{disableWarnings:true});const db=getFirestore(app);const [host,port]=fh.split(':');connectFirestoreEmulator(db,host,Number(port));const user=authenticated?(await createUserWithEmailAndPassword(auth,`${name}-${Date.now()}@example.test`,'test-password-123')).user:null;return {db,user};}
async function deny(fn){await assert.rejects(fn,e=>e.code==='permission-denied');}
const id=`rule-test-${Date.now()}`;
const bi={id:'Uji',en:'Test'};
const body={kind:'lesson',title:bi,body:bi,answer:{id:'',en:''},alternate:{id:'',en:''},source:'Test fixture',status:'draft'};
try{
 const guest=await client('guest',false), learner=await client('learner',true), mod=await client('mod',true);
 const rolePath=`http://${fh}/v1/projects/${projectId}/databases/(default)/documents/v8Roles/${mod.user.uid}`;
 const seed=await fetch(rolePath,{method:'PATCH',headers:{Authorization:'Bearer owner','Content-Type':'application/json'},body:JSON.stringify({fields:{role:{stringValue:'moduler'}}})});assert.ok(seed.ok,await seed.text());
 await deny(()=>setDoc(doc(learner.db,'v8Roles',learner.user.uid),{role:'moduler'}));
 await deny(()=>setDoc(doc(learner.db,'v8Content',id),{...body,updatedAt:serverTimestamp()}));
 await setDoc(doc(mod.db,'v8Content',id),{...body,updatedAt:serverTimestamp()});
 await deny(()=>getDoc(doc(guest.db,'v8Content',id)));
 await deny(()=>getDocs(query(collection(learner.db,'v8Content'),limit(100))));
 await setDoc(doc(mod.db,'v8Content',id),{...body,status:'published',updatedAt:serverTimestamp()});
 await deny(()=>getDoc(doc(guest.db,'v8Content',id)));
 assert.ok((await getDoc(doc(learner.db,'v8Content',id))).exists());
 await deny(()=>getDocs(query(collection(guest.db,'v8Content'),where('status','==','published'),limit(100))));
 assert.ok((await getDocs(query(collection(learner.db,'v8Content'),where('status','==','published'),limit(100)))).docs.some(d=>d.id===id));
 await setDoc(doc(learner.db,'v8Users',learner.user.uid,'private','learning'),{payload:'{}',updatedAt:serverTimestamp()});
 assert.ok((await getDoc(doc(learner.db,'v8Users',learner.user.uid,'private','learning'))).exists());
 await deny(()=>getDoc(doc(mod.db,'v8Users',learner.user.uid,'private','learning')));
 await deny(()=>setDoc(doc(learner.db,'v8Public','tutor'),{guidance:bi,updatedAt:serverTimestamp()}));
 await setDoc(doc(mod.db,'v8Public','tutor'),{guidance:bi,updatedAt:serverTimestamp()});
 await deny(()=>getDoc(doc(guest.db,'v8Public','tutor')));
 assert.ok((await getDoc(doc(learner.db,'v8Public','tutor'))).exists());
 await deleteDoc(doc(mod.db,'v8Content',id));
 const revoke=await fetch(rolePath,{method:'DELETE',headers:{Authorization:'Bearer owner'}});assert.ok(revoke.ok);
 await deny(()=>setDoc(doc(mod.db,'v8Content',id),{...body,updatedAt:serverTimestamp()}));
 console.log('[PASS] Emulator: role escalation denied, drafts private, published content authenticated, own backup only, curator policy protected, revocation enforced.');
}finally{await Promise.all(apps.map(deleteApp));}
