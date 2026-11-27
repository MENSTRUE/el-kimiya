import test from 'node:test';
import assert from 'node:assert/strict';
import {prepareWorkspace, snapshotExpression, classifySurface} from './doctor-workspace.mjs';

const learner={surface:'LEARNER',route:'dashboard',bridge:true,gate:true,hybrid:false,tutor:false};
const hybrid={...learner,route:'hybrid',hybrid:true};
const landing={surface:'LANDING',route:'landing',bridge:true,gate:false};
const login={surface:'LOGIN',route:'account',bridge:true,gate:false,loginReady:true};
const tick=async()=>{};
function mock(states) {
 let index=0;const actions=[];
 return {actions, async inspect(){return states[Math.min(index++,states.length-1)]}, async route(to){actions.push(to)}};
}
test('already-authenticated landing restores learner without asking for credentials',async()=>{
 const io=mock([landing,learner,hybrid]);let prompts=0;
 await prepareWorkspace(io,{pause:tick,attempts:8,login:async()=>{prompts++}});
 assert.deepEqual(io.actions,['account','hybrid']);assert.equal(prompts,0);
});
test('waits for Firestore/session verification before navigating',async()=>{
 const io=mock([{surface:'SESSION_PENDING'},{surface:'SESSION_PENDING'},learner,hybrid]);
 await prepareWorkspace(io,{pause:tick,attempts:8});assert.deepEqual(io.actions,['hybrid']);
});
test('retries a lost hash navigation only after an authenticated shell',async()=>{
 const io=mock([learner,learner,learner,learner,learner,learner,hybrid]);
 await prepareWorkspace(io,{pause:tick,attempts:10,retryEvery:3});
 assert.deepEqual(io.actions,['hybrid','hybrid']);
});
test('actual login form invokes credential callback once then resumes after reload',async()=>{
 const io=mock([login,login,{surface:'SESSION_PENDING'},learner,hybrid]);let count=0;
 await prepareWorkspace(io,{pause:tick,attempts:10,login:async()=>{count++}});
 assert.equal(count,1);assert.deepEqual(io.actions,['hybrid']);
});
test('wrong role is not bypassed',async()=>{
 const io=mock([{surface:'MODULER'}]);
 await assert.rejects(prepareWorkspace(io,{pause:tick,attempts:5}),/LEARNER_ACCOUNT_REQUIRED/);assert.deepEqual(io.actions,[]);
});
test('role failure and old deployment produce separate diagnostic codes',async()=>{
 await assert.rejects(prepareWorkspace(mock([{surface:'ROLE_ERROR'}]),{pause:tick,attempts:3}),/FIRESTORE_ROLE_VERIFICATION_FAILED/);
 await assert.rejects(prepareWorkspace(mock([{surface:'OLD_WORKSPACE'}]),{pause:tick,attempts:3}),/V83_LEARNER_MARKER_MISSING/);
});
test('authenticated shell without bridge and missing route detail cannot pass',async()=>{
 await assert.rejects(prepareWorkspace(mock([{...hybrid,bridge:false}]),{pause:tick,attempts:3}),/NATIVE_BRIDGE_MISSING/);
 await assert.rejects(prepareWorkspace(mock([{...hybrid,hybrid:false}]),{pause:tick,attempts:3}),/HYBRID_ROUTE_CONTENT_MISSING/);
});
test('safe state never discloses account, token, URL, nonce, or form values',()=>{
 assert.equal(classifySurface({session:true,roleError:true}), 'ROLE_ERROR');
 assert.equal(classifySurface({shell:true,marker:false}), 'OLD_WORKSPACE');
 assert.equal(classifySurface({shell:true,marker:true}), 'LEARNER');
 assert.equal(classifySurface({auth:true,account:true}), 'LOGIN');
 assert.doesNotMatch(snapshotExpression,/localStorage|sessionStorage|indexedDB|\.value\b|location\.href|document\.body\.innerText/);
});
test('snapshot matches actual V83 selector contract and ignores private form values',async()=>{
 const {runInNewContext}=await import('node:vm');
 let session=false,roleError=false;const el={getAttribute:()=> 'opaque-nonce-12345'};
 const doc={readyState:'complete',querySelector:s=>{
  if(s==='.v81-session')return session?{}:null;
  if(s==='.v81-session .v8-actions')return roleError?{}:null;
  if(session)return null;
  if(s==='[data-elk-ai-v83="learner"]')return el;
  if(['.app-shell .page-entrance','.sidebar .v82-session-nav','.live-hybrid-check'].includes(s))return {};
  return null;
 }};
 const window={ElKimiyaAI83:{postMessage(){}}};window.top=window;
 const context={document:doc,location:{hash:'#hybrid',origin:'https://el-kimiya.vercel.app',pathname:'/'},window};
 let state=runInNewContext(snapshotExpression,context);
 assert.equal(classifySurface(state),'LEARNER');assert.equal(state.gate,true);assert.equal(state.bridge,true);
 assert(!JSON.stringify(state).includes('opaque-nonce'));
 session=true;roleError=true;state=runInNewContext(snapshotExpression,context);
 assert.equal(classifySurface(state),'ROLE_ERROR');assert.equal(state.gate,false);
});
test('explicit untrusted page state cannot trigger navigation or login',async()=>{
 const io=mock([{surface:'UNTRUSTED',trusted:false,route:'account',loginReady:true}]);
 let count=0;
 await assert.rejects(prepareWorkspace(io,{pause:tick,attempts:3,login:async()=>{count++}}),/UNTRUSTED_WEBVIEW_ORIGIN/);
 assert.deepEqual(io.actions,[]);assert.equal(count,0);
});
test('retries navigation when hash matches desired route but route content never arrived',async()=>{
 const io=mock([{...hybrid,hybrid:false},{...hybrid,hybrid:false},hybrid]);
 await prepareWorkspace(io,{pause:tick,attempts:5,retryEvery:1});
 assert.deepEqual(io.actions,['hybrid','hybrid']);
});
