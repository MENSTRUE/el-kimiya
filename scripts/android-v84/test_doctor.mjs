import test from 'node:test';
import assert from 'node:assert/strict';
import {classify, safeLogLine, selectTarget} from './android-ai-doctor.mjs';
test('strict cloud requires cloud source and nonblank text',()=>{
 assert.equal(classify('cloud',{kind:'result',provider:'IN_CLOUD',hasText:true}).state,'PASS');
 assert.equal(classify('cloud',{kind:'result',provider:'ON_DEVICE',hasText:true}).state,'FAIL');
 assert.equal(classify('cloud',{kind:'result',provider:'IN_CLOUD',hasText:false}).state,'FAIL');
});
test('local cannot silently succeed via cloud',()=>{
 assert.equal(classify('local',{kind:'result',provider:'ON_DEVICE',hasText:true}).state,'PASS');
 assert.equal(classify('local',{kind:'result',provider:'IN_CLOUD',hasText:true}).state,'FAIL');
});
test('status is not inference and failures retain code',()=>{
 assert.equal(classify('status',{kind:'result',status:'DOWNLOADABLE'}).state,'INFO');
 assert.equal(classify('status',{kind:'result',status:'UNKNOWN'}).state,'FAIL');
 assert.equal(classify('cloud',{kind:'error',code:'APP_CHECK'}).detail,'APP_CHECK');
 assert.equal(classify('attest',{kind:'result',attestation:'OK'}).state,'PASS');
});
test('only structured diagnostic logs are accepted',()=>{
 assert.equal(safeLogLine('I/ElKimiyaAI83: AI_DOCTOR83 RESPONSE provider=IN_CLOUD nonblank=true legacyMatch=false'),'RESPONSE provider=IN_CLOUD nonblank=true legacyMatch=false');
 assert.equal(safeLogLine('I/DebugAppCheckProvider: debug secret abc'),null);
 assert.equal(safeLogLine('I/ElKimiyaAI83: AI_DOCTOR83 token=private'),null);
});
test('select only the exact production origin and page target',()=>{
 const good={type:'page',url:'https://el-kimiya.vercel.app/#hybrid',webSocketDebuggerUrl:'ws://127.0.0.1/devtools/page/a'};
 assert.equal(selectTarget([{...good,url:'https://el-kimiya.vercel.app.evil.test/'},good]),good);
 assert.equal(selectTarget([{...good,type:'iframe'}]),undefined);
});

import * as doctor from './android-ai-doctor.mjs';
const delay=async()=>{};
test('package probe accepts pm path/package-list even without dumpsys version metadata',async()=>{
 const pm = (a,b,c,...rest) => {
  if(b==='pm'&&c==='path')return 'package:/data/app/~~obfuscated/base.apk\r\n';
  if(b==='pm'&&c==='list')return 'package:com.menstrue.elkimiya\r\n';
  if(b==='dumpsys')return 'Permission Denial';
  throw Error('unexpected command');
 };
 const actual=await doctor.probePackage(pm,'com.menstrue.elkimiya',{pause:delay});
 assert.equal(actual.presence,'PRESENT');
 assert.equal(actual.version,'UNKNOWN');
});
test('package probe retries wireless transient and refuses to mistake list prefix for exact package',async()=>{
 let n=0;
 const pm=(a,b,c,...rest)=>{
  if(b==='pm'&&c==='path'){if(++n<2)throw Error('transport');return 'package:/data/app/base.apk';}
  if(b==='pm'&&c==='list')return 'package:com.menstrue.elkimiya.other';
  if(b==='dumpsys')return 'versionName=8.3.0';
 };
 assert.equal((await doctor.probePackage(pm,'com.menstrue.elkimiya',{pause:delay})).presence,'PRESENT');
 assert.equal(n,2);
 assert.equal((await doctor.probePackage((a,b,c)=>c==='list'?'package:com.menstrue.elkimiya.other':'','com.menstrue.elkimiya',{pause:delay,attempts:2})).presence,'NOT_FOUND');
 assert.equal((await doctor.probePackage(()=>{throw Error('transport')},'com.menstrue.elkimiya',{pause:delay,attempts:2})).presence,'UNKNOWN');
});
test('wireless serial selected verbatim across intermittent offline status',async()=>{
 const serial='adb-RRGL90373RR-peIUhx._adb-tls-connect._tcp';
 let count=0;
 const run=()=> 'List of devices attached\r\n'+serial+'\t'+(++count===1?'offline':'device product:test')+'\r\n';
 assert.equal(await doctor.selectDevice(run,serial,{pause:delay}),serial);
 assert.equal(count,2);
});
test('multiple authorized devices require explicit serial instead of guessing',async()=>{
 await assert.rejects(doctor.selectDevice(()=> 'List of devices attached\nUSB-A\tdevice\nUSB-B\tdevice\n',undefined,{pause:delay}),/EXACTLY_ONE_AUTHORIZED_DEVICE_REQUIRED/);
});
test('App Check failure and cloud failure cannot suppress real LOCAL, PREFER, or UI using available local inference',async()=>{
 const calls=[], checks={}; const responses={
  attest:{kind:'error',code:'APP_CHECK'},
  status:{kind:'result',status:'AVAILABLE'},
  'Cloud only':{kind:'error',code:'HTTP_403'},
  'On-device only':{kind:'result',provider:'ON_DEVICE',hasText:true,hasModel:true},
  'Prefer on-device':{kind:'result',provider:'ON_DEVICE',hasText:true,hasModel:true}
 };
 await doctor.runChecks({request:async(kind,pref)=>{calls.push(pref||kind);return responses[pref||kind]},
  add:(name,o)=>(checks[name]=o), ui:async(pref,provider)=>{calls.push('hybrid:'+pref);assert.equal(provider,'ON_DEVICE');return {state:'PASS',detail:provider}},
  tutor:async(pref,provider)=>{calls.push('tutor:'+pref);assert.equal(provider,'ON_DEVICE');return {state:'PASS',detail:provider}}
 });
 assert.deepEqual(calls,['attest','status','Cloud only','On-device only','Prefer on-device','hybrid:On-device only','tutor:On-device only']);
 assert.equal(checks.cloud_only.state,'FAIL');assert.equal(checks.app_check.state,'FAIL');
 assert.equal(checks.on_device_only.state,'PASS');assert.equal(checks.prefer_on_device.state,'PASS');
 assert.equal(checks.hybrid_ui.state,'PASS');assert.equal(checks.tutor_ui.state,'PASS');
 assert.equal(checks.offline_inference.state,'NOT_TESTED');
});
test('real local and prefer are attempted even when status is unavailable and cloud fails',async()=>{
 const calls=[], checks={};
 await doctor.runChecks({request:async(kind,pref)=>{calls.push(pref||kind);return kind==='status'?{kind:'result',status:'UNAVAILABLE'}:{kind:'error',code:'LOCAL'}},
  add:(name,o)=>(checks[name]=o), ui:async()=>assert.fail('no verified provider'),tutor:async()=>assert.fail('no verified provider')});
 assert(calls.includes('On-device only'));assert(calls.includes('Prefer on-device'));
 assert.equal(checks.on_device_only.state,'FAIL');assert.equal(checks.hybrid_ui.state,'BLOCKED');
 assert.notEqual(checks.fallback.state,'PASS');
});
test('preferred cloud provider does not prove strict fallback when local request result was ambiguous',async()=>{
 const checks={};
 await doctor.runChecks({request:async(kind,pref)=>kind==='status'?{kind:'result',status:'AVAILABLE'}:kind==='attest'?{kind:'result',attestation:'OK'}:
  pref==='On-device only'?{kind:'error',code:'TIMEOUT'}:{kind:'result',provider:'IN_CLOUD',hasText:true,hasModel:true},
  add:(name,o)=>(checks[name]=o),ui:async()=>({state:'PASS',detail:'IN_CLOUD'}),tutor:async()=>({state:'PASS',detail:'IN_CLOUD'})});
 assert.equal(checks.prefer_on_device.state,'PASS');
 assert.equal(checks.fallback.state,'NOT_TESTED');
});
test('real preferred-only result permits UI smoke but does not pretend strict cloud or local worked',async()=>{
 const checks={};
 await doctor.runChecks({request:async(kind,pref)=>pref==='Prefer on-device'?{kind:'result',provider:'ON_DEVICE',hasText:true,hasModel:true}:{kind:'error',code:'FAILED'},
  add:(name,o)=>(checks[name]=o),ui:async(pref,provider)=>{assert.equal(pref,'Prefer on-device');assert.equal(provider,'ON_DEVICE');return {state:'PASS',detail:provider}},tutor:async(pref,provider)=>{assert.equal(pref,'Prefer on-device');return {state:'PASS',detail:provider}}});
 assert.equal(checks.hybrid_ui.state,'PASS');assert.equal(checks.cloud_only.state,'FAIL');assert.equal(checks.on_device_only.state,'FAIL');
});
test('a failed hybrid UI probe cannot suppress tutor probe and controller exceptions become safe codes',async()=>{
 const checks={};
 await doctor.runChecks({request:async(kind,pref)=>{if(kind==='attest')throw Error('sensitive transport value');return kind==='status'?{kind:'result',status:'AVAILABLE'}:{kind:'result',provider:pref==='Cloud only'?'IN_CLOUD':'ON_DEVICE',hasText:true,hasModel:true}},
  add:(name,o)=>(checks[name]=o),ui:async()=>{throw Error('private text');},tutor:async()=>({state:'PASS',detail:'IN_CLOUD'})});
 assert.equal(checks.hybrid_ui.state,'FAIL');assert.equal(checks.tutor_ui.state,'PASS');
 assert.doesNotMatch(JSON.stringify(checks),/private text|sensitive transport value/);
});
test('accept diagnostics only from allowlisted diagnostic vocabulary',()=>{
 assert.equal(safeLogLine('I/ElKimiyaAI83: AI_DOCTOR83 EXCEPTION kind=generate class=FirebaseAIException reason=HTTP_403'),'EXCEPTION kind=generate class=FirebaseAIException reason=HTTP_403');
 assert.equal(safeLogLine('I/ElKimiyaAI83: AI_DOCTOR83 EXCEPTION kind=generate class=abcdSecret reason=ACCESS_TOKEN'),null);
 assert.equal(safeLogLine('I/ElKimiyaAI83: AI_DOCTOR83 END kind=generate code=SECRET_VALUE'),null);
});
test('target must be exact root and no credential userinfo',()=>{
 const good={type:'page',url:'https://el-kimiya.vercel.app/#hybrid',webSocketDebuggerUrl:'ws://127.0.0.1/devtools/page/a'};
 assert.equal(selectTarget([{...good,url:'https://user@el-kimiya.vercel.app/#hybrid'},{...good,url:'https://el-kimiya.vercel.app/wrong/#hybrid'}]),undefined);
 assert.equal(selectTarget([good]),good);
});
test('fresh diagnostic evidence excludes stale history, refuses rotation with no overlap',()=>{
 const old=['100 START kind=generate','101 RESPONSE provider=IN_CLOUD nonblank=true legacyMatch=true','102 END kind=generate code=OK'];
 const newLines=['103 START kind=generate','104 RESPONSE provider=ON_DEVICE nonblank=true legacyMatch=true','105 END kind=generate code=OK'];
 assert.deepEqual(doctor.newNativeRecords(old,old.concat(newLines)),newLines);
 assert.deepEqual(doctor.newNativeRecords(old,old.slice(1).concat(newLines)),newLines);
 assert.deepEqual(doctor.newNativeRecords(old,newLines),[]);
 assert.deepEqual(doctor.newNativeRecords(old,old),[]);
});
test('strict fallback only passes with native evidence from one matching complete request',async()=>{
 const checks={};
 await doctor.runChecks({request:async(kind,pref)=>kind==='status'?{kind:'result',status:'UNAVAILABLE'}:kind==='attest'?{kind:'result',attestation:'OK'}:
  pref==='On-device only'?{kind:'error',code:'LOCAL'}:{kind:'result',provider:'IN_CLOUD',hasText:true,hasModel:true,nativeFallback:pref==='Prefer on-device'},
  add:(name,o)=>(checks[name]=o),ui:async()=>({state:'PASS',detail:'IN_CLOUD'}),tutor:async()=>({state:'PASS',detail:'IN_CLOUD'})});
 assert.equal(checks.fallback.state,'PASS');
 const local=['START kind=generate','FALLBACK from=ON_DEVICE to=IN_CLOUD reason=LOCAL','RESPONSE provider=IN_CLOUD nonblank=true legacyMatch=true','END kind=generate code=OK'];
 assert.equal(doctor.nativeProof(local,'IN_CLOUD').fallback,true);
 assert.equal(doctor.nativeProof(local,'ON_DEVICE').verified,false);
 assert.equal(doctor.nativeProof(local.slice(1),'IN_CLOUD').verified,false);
 assert.equal(doctor.nativeProof([...local,...local],'IN_CLOUD').verified,false);
 assert.equal(safeLogLine('I/ElKimiyaAI83: AI_DOCTOR83 FALLBACK from=ON_DEVICE to=IN_CLOUD reason=LOCAL'),'FALLBACK from=ON_DEVICE to=IN_CLOUD reason=LOCAL');
 assert.equal(safeLogLine('I/ElKimiyaAI83: AI_DOCTOR83 FALLBACK from=ON_DEVICE to=IN_CLOUD reason=SECRET'),null);
});
test('Hybrid UI verifier rejects stale/invalid/demo source and accepts real provider marker',()=>{
 assert.equal(doctor.classifyUi('Cloud only',{fresh:false,provider:'IN_CLOUD',hasText:true,nativeVerified:true}).state,'FAIL');
 assert.equal(doctor.classifyUi('Cloud only',{fresh:true,provider:'ON_DEVICE',hasText:true,nativeVerified:true}).state,'FAIL');
 assert.equal(doctor.classifyUi('Cloud only',{fresh:true,provider:'IN_CLOUD',hasText:true,nativeVerified:false}).state,'FAIL');
 assert.equal(doctor.classifyUi('On-device only',{fresh:true,provider:'ON_DEVICE',hasText:true,nativeVerified:true}).state,'PASS');
});
test('actual visible provider parsing handles V83 and V84 Indonesian labels and disagreed attributes',()=>{
 const node=(attrs={})=>({getAttribute:key=>attrs[key]||null});
 assert.equal(doctor.visibleProvider(node(),'Penyedia terverifikasi: ON_DEVICE · Android on-device model'),'ON_DEVICE');
 assert.equal(doctor.visibleProvider(node(),'Verified provider: IN_CLOUD · gemini'),'IN_CLOUD');
 assert.equal(doctor.visibleProvider(node({'data-elk-live':'true','data-elk-provider':'ON_DEVICE'}),'Di perangkat · Firebase terverifikasi',true),'ON_DEVICE');
 assert.equal(doctor.visibleProvider(node({'data-elk-live':'true','data-elk-provider':'IN_CLOUD'}),'Di perangkat · Firebase terverifikasi',true),'UNKNOWN');
 assert.equal(doctor.visibleProvider(node(),'Learning response: IN_CLOUD'),'UNKNOWN');
});
test('malformed bridge response does not suppress independent later checks',async()=>{
 const calls=[],checks={};
 await doctor.runChecks({request:async(kind,pref)=>{calls.push(pref||kind);return undefined;},add:(name,o)=>(checks[name]=o),ui:()=>assert.fail(),tutor:()=>assert.fail()});
 assert(calls.includes('On-device only'));assert(calls.includes('Prefer on-device'));
 assert.equal(checks.local_model_status.state,'FAIL');assert.equal(checks.prefer_on_device.state,'FAIL');
});
