// Runs actual Firebase inference from the installed Android debug WebView.
// No external packages, tokens, credentials, or model response content in report.
import {execFileSync} from 'node:child_process';
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createInterface} from 'node:readline/promises';
import {Writable} from 'node:stream';
import {inspectWorkspace, prepareWorkspace} from './doctor-workspace.mjs';
const PKG='com.menstrue.elkimiya';
const ORIGIN='https://el-kimiya.vercel.app';
const providers=['IN_CLOUD','ON_DEVICE'];
const statuses=['AVAILABLE','DOWNLOADABLE','DOWNLOADING','UNAVAILABLE'];
const safeCodes=['ACCESS','BUSY','APP_CHECK','LOCAL','LOCAL_INPUT','LOCAL_BUSY','LOCAL_QUOTA','LOCAL_RUNTIME','API_KEY','CONFIG','QUOTA','HTTP_403','HTTP_404','HTTP_401','NETWORK','SERVICE','BLOCKED','SOURCE_MISMATCH','NO_TEXT','TIMEOUT','LIMIT','FAILED','BRIDGE','SDK_ERROR','UNKNOWN','INVALID_REPLY','TRANSPORT','AUTH_REQUIRED'];
const runtimeCodes=['NODE_22_OR_NEWER_REQUIRED','EXACTLY_ONE_AUTHORIZED_DEVICE_REQUIRED','ADB_DEVICE_OFFLINE','ADB_DEVICE_UNAUTHORIZED','ADB_DEVICE_NOT_FOUND','ADB_DEVICE_LIST_FAILED','APK_NOT_INSTALLED','PACKAGE_PROBE_UNAVAILABLE','WEBVIEW_DEVTOOLS_NOT_AVAILABLE','CDP_OPEN_TIMEOUT','CDP_OPEN_ERROR','CDP_COMMAND_FAILED','CDP_CLOSED','CDP_COMMAND_TIMEOUT','CDP_SEND_ERROR','WEBVIEW_EXPRESSION_FAILED','LEARNER_LOGIN_REQUIRED_INTERACTIVE_TERMINAL','LEARNER_LOGIN_REQUIRED','LOGIN_INPUT_CANCELLED','LOGIN_INPUT_EMPTY','LOGIN_FORM_CHANGED','LOGIN_BUTTON_NOT_READY','LEARNER_LOGIN_REJECTED','LEARNER_ACCOUNT_REQUIRED','UNTRUSTED_WEBVIEW_ORIGIN','WEBVIEW_STATE_UNAVAILABLE','FIRESTORE_ROLE_VERIFICATION_FAILED','SESSION_VERIFICATION_TIMEOUT','V83_LEARNER_MARKER_MISSING','LEARNER_LOGIN_TIMEOUT','HOMEPAGE_NAVIGATION_FAILED','GUEST_NAVIGATION_FAILED','AUTH_NAVIGATION_FAILED','WEB_APP_RENDER_TIMEOUT','LEARNER_SESSION_GATE_INCOMPLETE','NATIVE_BRIDGE_MISSING','HYBRID_ROUTE_CONTENT_MISSING','TUTOR_ROUTE_CONTENT_MISSING','PREFERENCE_CONTROL_MISSING','PREFERENCE_NOT_APPLIED','UI_REQUEST_NOT_STARTED','TUTOR_PREFERENCE_MISMATCH','UI_ROUTE_LOST','UI_RESULT_TIMEOUT','UI_RESULT_UNVERIFIED','UI_RESULT_PROVIDER_MISMATCH','TUTOR_INPUT_CONTROL','PREFERENCE_RESTORE_FAILED'];
const safeFailure=(e,fallback='ADB_OR_CDP_ERROR')=>runtimeCodes.includes(e?.message)?e.message:fallback;
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
export function classify(name,p){
 if(p?.kind!=='result')return {state:'FAIL',detail:safeCodes.includes(p?.code)?p.code:'INVALID_REPLY'};
 if(name==='attest')return p.attestation==='OK'?{state:'PASS',detail:'APP_CHECK_TOKEN_OBTAINED'}:{state:'FAIL',detail:'APP_CHECK'};
 if(name==='status'||name==='download')return statuses.includes(p.status)?{state:'INFO',detail:p.status}:{state:'FAIL',detail:'UNKNOWN_MODEL_STATUS'};
 const valid=providers.includes(p.provider)&&p.hasText===true;
 const matched=name==='cloud'?p.provider==='IN_CLOUD':name==='local'?p.provider==='ON_DEVICE':true;
 return valid&&matched?{state:'PASS',detail:p.provider}:{state:'FAIL',detail:'UNVERIFIED_INFERENCE'};
}
export function safeLogLine(l){
 const value=l.match(/\bAI_DOCTOR83 (.+)$/)?.[1]?.trim();
 if(!value)return null;
 if(/^(?:START kind=(?:attest|generate|status|download)|APP_CHECK verified=(?:true|false)|RESPONSE provider=(?:ON_DEVICE|IN_CLOUD|UNKNOWN) nonblank=(?:true|false) legacyMatch=(?:true|false)|MODEL_STATUS status=(?:AVAILABLE|DOWNLOADABLE|DOWNLOADING|UNAVAILABLE|UNKNOWN)|TIMEOUT kind=(?:attest|generate|status|download))$/.test(value))return value;
 const ex=value.match(/^EXCEPTION kind=(attest|generate|status|download) class=([A-Za-z][A-Za-z0-9_$]{0,70}(?:Exception|Error)) reason=([A-Z0-9_]+)$/);
 if(ex&&safeCodes.includes(ex[3]))return value;
 const fallback=value.match(/^FALLBACK from=ON_DEVICE to=IN_CLOUD reason=([A-Z0-9_]+)$/);
 if(fallback&&safeCodes.includes(fallback[1]))return value;
 const end=value.match(/^END kind=(attest|generate|status|download) code=([A-Z0-9_]+)$/);
 return end&&['OK',...safeCodes].includes(end[2])?value:null;
}
// Compare exact timestamped entries. If rotation removes all overlap, do not credit history.
export function newNativeRecords(before,after){
 if(!Array.isArray(before)||!Array.isArray(after))return [];
 if(!before.length)return after.slice();
 for(let overlap=Math.min(before.length,after.length);overlap>0;overlap--){
  if(before.slice(-overlap).every((value,i)=>value===after[i]))return after.slice(overlap);
 }
 return [];
}
function readNativeRecords(run){
 // Timestamp is used only in memory for freshness; report never contains timestamps, IDs or raw lines.
 try{return run('logcat','-d','-v','epoch','-s','ElKimiyaAI83:I','*:S').split(/\r?\n/).filter(l=>safeLogLine(l));}catch{return null;}
}
function nativeSince(run,before){
 return newNativeRecords(before,readNativeRecords(run)).map(safeLogLine).filter(Boolean);
}
export function nativeProof(lines,provider){
 const starts=lines.filter(l=>l==='START kind=generate');
 const ends=lines.filter(l=>l.startsWith('END kind=generate '));
 const replies=lines.filter(l=>l.startsWith('RESPONSE provider='));
 const start=lines.indexOf(starts[0]),end=lines.indexOf(ends[0]),reply=lines.lastIndexOf(replies.at(-1));
 const verified=starts.length===1&&ends.length===1&&start>=0&&start<reply&&reply<end&&ends[0]==='END kind=generate code=OK'&&providers.includes(provider)&&new RegExp('^RESPONSE provider='+provider+' nonblank=true legacyMatch=(?:true|false)$').test(replies.at(-1)||'');
 const fallback=verified&&provider==='IN_CLOUD'&&lines.some((line,index)=>index>start&&index<reply&&line.startsWith('FALLBACK from=ON_DEVICE to=IN_CLOUD reason='));
 return {verified,fallback};
}
export function selectTarget(targets){
 if(!Array.isArray(targets))return undefined;
 return targets.find(t=>{try{const page=new URL(t.url),ws=new URL(t.webSocketDebuggerUrl);return t.type==='page'&&page.origin===ORIGIN&&page.pathname==='/'&&!page.username&&!page.password&&ws.protocol==='ws:'&&!ws.username&&!ws.password&&ws.pathname.startsWith('/devtools/page/')}catch{return false}});
}
// Device selection is exact, not positional. Wireless serials are opaque; no splitting on '.' or ':'.
export async function selectDevice(run,requested,{attempts=6,pause=sleep}={}){
 let state=null,observed=false;
 for(let i=0;i<attempts;i++){
  try{
   const lines=run('devices','-l').split(/\r?\n/),devices=[];
   for(const line of lines){const m=line.trim().match(/^(\S+)\s+(device|offline|unauthorized|recovery|sideload|bootloader|no permissions)(?:\s+.*)?$/);if(m)devices.push({serial:m[1],state:m[2]});}
   observed=lines.some(l=>/^List of devices attached/.test(l));
   if(requested){
    const exact=devices.find(d=>d.serial===requested);state=exact?.state||null;
    if(state==='device')return exact.serial;
   }else{
    const ready=devices.filter(d=>d.state==='device');
    if(ready.length===1)return ready[0].serial;
    if(ready.length>1)throw Error('EXACTLY_ONE_AUTHORIZED_DEVICE_REQUIRED');
    state=devices.length===1?devices[0].state:null;
   }
  }catch(error){if(error.message==='EXACTLY_ONE_AUTHORIZED_DEVICE_REQUIRED')throw error;}
  if(i+1<attempts)await pause(1000);
 }
 throw Error(state==='offline'?'ADB_DEVICE_OFFLINE':state==='unauthorized'?'ADB_DEVICE_UNAUTHORIZED':observed?'ADB_DEVICE_NOT_FOUND':'ADB_DEVICE_LIST_FAILED');
}
export async function probePackage(run,pkg,{attempts=4,pause=sleep,version=true}={}){
 let presence='UNKNOWN',evidence='NO_PACKAGE_EVIDENCE';
 const safeExec=(...args)=>{try{return {ok:true,text:String(run(...args))}}catch{return {ok:false,text:''}};};
 for(let i=0;i<attempts;i++){
  const path=safeExec('shell','pm','path',pkg),list=safeExec('shell','pm','list','packages',pkg);
  const pathFound=path.ok&&path.text.split(/\r?\n/).some(l=>/^package:\/[^\r\n]+\.apk$/.test(l.trim()));
  const listFound=list.ok&&list.text.split(/\r?\n/).some(l=>l.trim()==='package:'+pkg);
  if(pathFound||listFound){presence='PRESENT';evidence=pathFound&&listFound?'PM_PATH_AND_LIST':pathFound?'PM_PATH':'PM_LIST';break;}
  // A successful empty or filtered list is a negative PackageManager result; not a transport exception.
  const readable=list.ok&&list.text.split(/\r?\n/).every(l=>!l.trim()||/^package:[A-Za-z0-9_.]+$/.test(l.trim()));
  presence=readable?'NOT_FOUND':'UNKNOWN';evidence=readable?'PM_LIST_NO_EXACT_PACKAGE':'NO_PACKAGE_EVIDENCE';
  if(i+1<attempts)await pause(1000);
 }
 let versionName='UNKNOWN';
 if(version&&presence==='PRESENT'){
  const meta=safeExec('shell','dumpsys','package',pkg);
  const candidate=meta.text.match(/(?:^|\s)versionName=([^\s]+)/)?.[1];
  if(candidate&&/^\d+(?:\.\d+){0,5}(?:[-+][A-Za-z0-9.-]{1,25})?$/.test(candidate))versionName=candidate;
 }
 return {presence,evidence,version:versionName};
}
function adbRunner(adb,serial){
 const base=serial?['-s',serial]:[];
 return (...args)=>execFileSync(adb,[...base,...args],{encoding:'utf8',windowsHide:true,stdio:['ignore','pipe','pipe'],timeout:30000,maxBuffer:8*1024*1024}).trim();
}
async function connectCDP(url) {
 const ws=new WebSocket(url);
 const pending=new Map();let seq=0;
 let readyTimer;
 await new Promise((res,rej)=>{
  readyTimer=setTimeout(()=>{ws.close();rej(new Error('CDP_OPEN_TIMEOUT'));},10000);
  ws.addEventListener('open',()=>{clearTimeout(readyTimer);res();},{once:true});
  ws.addEventListener('error',()=>{clearTimeout(readyTimer);rej(new Error('CDP_OPEN_ERROR'));},{once:true});
 });
 ws.addEventListener('message',event=>{
  let p;try{p=JSON.parse(event.data);}catch{return;}
  const w=pending.get(p.id);if(!w)return;
  pending.delete(p.id);clearTimeout(w.timer);p.error?w.reject(new Error('CDP_COMMAND_FAILED')):w.resolve(p.result);
 });
 ws.addEventListener('close',()=>{for(const w of pending.values()){clearTimeout(w.timer);w.reject(new Error('CDP_CLOSED'));}pending.clear();});
 function call(method,params={},timeout=15000){
  return new Promise((resolve,reject)=>{
   const id=++seq;
   const timer=setTimeout(()=>{pending.delete(id);reject(new Error('CDP_COMMAND_TIMEOUT'));},timeout);
   pending.set(id,{timer,resolve,reject});
   try{ws.send(JSON.stringify({id,method,params}));}catch{pending.delete(id);clearTimeout(timer);reject(new Error('CDP_SEND_ERROR'));}
  });
 }
 const evaluate=async(expression,timeout=15000)=>{
  const r=await call('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true,userGesture:true},timeout);
  if(r.exceptionDetails)throw new Error('WEBVIEW_EXPRESSION_FAILED');
  return r.result?.value;
 };
 return {evaluate,close:()=>ws.close()};
}
async function waitFor(cdp,expression,timeout=30000){
 const until=Date.now()+timeout;
 while(Date.now()<until){
  try{const value=await cdp.evaluate(expression,5000);if(value)return value;}catch{}
  await sleep(500);
 }
 return null;
}
const trustedPage="location.origin==='https://el-kimiya.vercel.app'&&location.pathname==='/'&&window===window.top";
const shellReady=trustedPage+"&&!!document.querySelector('[data-elk-ai-v83=learner]')&&/^[A-Za-z0-9-]{12,100}$/.test(document.querySelector('[data-elk-ai-v83=learner]')?.getAttribute('data-elk-ai-session')||'')&&!!document.querySelector('.sidebar .v82-session-nav')&&!!document.querySelector('.app-shell .page-entrance')&&!document.querySelector('.v81-session,.v81-auth,.v81-moduler,.v81-admin-nav,.landing-page,.v82-guest-preview')";
const workspaceReady=route=>"("+shellReady+")&&location.hash==='#"+route+"'";

async function routeTo(cdp,route){
 // Prefer real React navigation handlers; hash only as a fallback.
 await cdp.evaluate(`(()=>{
   if(!(${trustedPage}))return false;
   const to=${JSON.stringify(route)};
   let button;
   if(to==='account'){
     if(document.querySelector('.v81-session,.v81-moduler,.v81-admin-nav,[data-elk-ai-v83=learner]'))return false;
     button=document.querySelector('.landing-nav .landing-signin,.landing-nav .primary-button,.v82-preview-actions .primary-button');
     if(document.querySelector('.landing-nav .landing-signin'))button=document.querySelector('.landing-nav .landing-signin');
   }
   if(to!=='account'&&!(${shellReady}))return false;
   if(to==='hybrid')button=document.querySelector('.sidebar .secondary-nav button:first-child');
   if(to==='tutor')button=[...document.querySelectorAll('.mobile-nav button')].find(b=>b.querySelector('small')?.textContent?.trim()==='AI Tutor');
   if(button&&!button.disabled)button.click();else if(location.hash!=='#'+to)location.hash='#'+to;else window.dispatchEvent(new HashChangeEvent('hashchange'));
   return true;
 })()`);
}
async function promptLogin(cdp){
 if(!process.stdin.isTTY)throw Error('LEARNER_LOGIN_REQUIRED_INTERACTIVE_TERMINAL');
 console.log('[ACTION] Sesi learner belum aktif. Masukkan akun learner demo di terminal ini (bukan Moduler).');
 let mute=false;
 const output=new Writable({write(chunk,_enc,cb){if(!mute)process.stdout.write(chunk);cb();}});
 const rl=createInterface({input:process.stdin,output,terminal:true});
 const controller=new AbortController();
 rl.on('SIGINT',()=>controller.abort());
 let email='',password='';
 try{
  email=(await rl.question('Email learner: ',{signal:controller.signal})).trim();
  process.stdout.write('Password learner (tidak ditampilkan): ');
  mute=true;
  password=await rl.question('',{signal:controller.signal});
  mute=false;process.stdout.write('\n');
 }catch{throw Error('LOGIN_INPUT_CANCELLED');}finally{rl.close();output.end();}
 if(!email||!password)throw Error('LOGIN_INPUT_EMPTY');
 try{
  const filled=await cdp.evaluate(`(()=>{
   if(!(${trustedPage})||location.hash!=='#account'||document.querySelector('.v81-session,.v81-moduler,.v81-admin-nav,[data-elk-ai-v83=learner]'))return false;
   const form=document.querySelector('.v81-auth form');
   const e=form?.querySelector('input[type=email]'),p=form?.querySelector('input[autocomplete=current-password]');
   if(!e||!p)return false;
   const set=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set;
   set.call(e,${JSON.stringify(email)});e.dispatchEvent(new Event('input',{bubbles:true}));
   set.call(p,${JSON.stringify(password)});p.dispatchEvent(new Event('input',{bubbles:true}));
   return true;
  })()`);
  if(!filled)throw Error('LOGIN_FORM_CHANGED');
  const submit=await waitFor(cdp,trustedPage+"&&location.hash==='#account'&&!!document.querySelector('.v81-auth form button[type=submit]:not(:disabled)')",10000);
  if(!submit)throw Error('LOGIN_BUTTON_NOT_READY');
  try{await cdp.evaluate("if(("+trustedPage+")&&location.hash==='#account')document.querySelector('.v81-auth form button[type=submit]:not(:disabled)')?.click();true");}catch{/* normal navigation may start immediately */}
 } finally {email='';password='';}
}
async function navigate(cdp,route,selector,observe=()=>{},allowLogin=false){
 await prepareWorkspace({
  inspect:()=>inspectWorkspace(cdp),
  route:to=>routeTo(cdp,to),
 },{destination:route,observe,login:allowLogin?()=>promptLogin(cdp):undefined});
 if(!await waitFor(cdp,workspaceReady(route)+"&&!!document.querySelector("+JSON.stringify(selector)+")",5000))throw Error(route.toUpperCase()+'_ROUTE_CONTENT_MISSING');
 await sleep(400);
}
async function bridgeRequest(cdp,kind,preference,timeout=145000){
 // Only the existing, origin-restricted WebView bridge, on the authenticated learner surface.
 const id='doctor-'+Date.now()+'-'+Math.random().toString(36).slice(2,8);
 const packet={id,kind,...(preference?{preference,prompt:'Why is water polar? Answer in one short English sentence.'}:{})};
 const request=JSON.stringify(packet);
 return await cdp.evaluate(`new Promise(resolve=>{
  const bridge=window.ElKimiyaAI83;
  if(!bridge||typeof bridge.postMessage!=='function'){resolve({kind:'error',code:'BRIDGE'});return;}
  if(!(${workspaceReady('hybrid')})){resolve({kind:'error',code:'ACCESS'});return;}
  const previous=typeof bridge.onmessage==='function'?bridge.onmessage:null;
  let timer;
  const own=function(ev){
   let p;try{p=JSON.parse(ev.data);}catch{}
   if(!p||p.id!==${JSON.stringify(id)}){if(typeof previous==='function')previous.call(bridge,ev);return;}
   if(p.kind==='progress')return;
   if(p.kind!=='result'&&p.kind!=='error')return;
   clearTimeout(timer);bridge.onmessage=previous;
   const vp=['ON_DEVICE','IN_CLOUD'];
   const vs=['AVAILABLE','DOWNLOADABLE','DOWNLOADING','UNAVAILABLE','UNKNOWN'];
   const vc=${JSON.stringify(safeCodes)};
   resolve({kind:p.kind,provider:vp.includes(p.provider)?p.provider:'UNKNOWN',hasText:typeof p.text==='string'&&p.text.trim().length>0,hasModel:typeof p.model==='string'&&p.model.trim().length>0,status:vs.includes(p.status)?p.status:undefined,attestation:p.attestation==='OK'?'OK':undefined,code:vc.includes(p.code)?p.code:'UNKNOWN'});
  };
  bridge.onmessage=own;
  timer=setTimeout(()=>{bridge.onmessage=previous;resolve({kind:'error',code:'TIMEOUT'});},${timeout});
  try{bridge.postMessage(${JSON.stringify(request)});}catch{clearTimeout(timer);bridge.onmessage=previous;resolve({kind:'error',code:'TRANSPORT'});}
 })`,timeout+10000);
}
async function deviceTarget(adbRun){
 const deadline=Date.now()+75000;
 let port,pid,startAt=0,attempts=0;
 const remove=()=>{if(port)try{adbRun('forward','--remove','tcp:'+port)}catch{}port=undefined;};
 const getPid=()=>{
  try{const v=adbRun('shell','pidof',PKG).split(/\s+/)[0];if(/^\d+$/.test(v))return v;}catch{}
  try{const lines=adbRun('shell','ps','-A').split(/\r?\n/),header=lines[0]?.trim().split(/\s+/)||[],pidAt=header.indexOf('PID');
   if(pidAt>=0)for(const l of lines.slice(1)){const values=l.trim().split(/\s+/);if(values.at(-1)===PKG&&/^\d+$/.test(values[pidAt]))return values[pidAt];}
  }catch{}
  return null;
 };
 try {
  while(Date.now()<deadline){
   if(attempts<3&&(!pid||attempts===0)&&Date.now()-startAt>5000){
    try{adbRun('shell','am','start','-n',PKG+'/.MainActivity')}catch{}
    startAt=Date.now();attempts++;
   }
   const current=getPid();
   if(current&&current!==pid){remove();pid=current;}
   if(pid&&!port)try{
     const p=adbRun('forward','tcp:0','localabstract:webview_devtools_remote_'+pid);
     if(/^\d+$/.test(p)&&+p>0&&+p<=65535)port=p;
   }catch{}
   if(port){
    try{
     const response=await fetch('http://127.0.0.1:'+port+'/json/list',{signal:AbortSignal.timeout(3000)});
     const target=selectTarget(await response.json());
     if(target){
      const ws=new URL(target.webSocketDebuggerUrl);ws.hostname='127.0.0.1';ws.port=port;
      return {url:ws.toString(),port};
     }
    }catch{}
   }
   await sleep(1000);
  }
  throw new Error('WEBVIEW_DEVTOOLS_NOT_AVAILABLE');
 }catch(e){remove();throw e;}
}
const preferences=['Cloud only','On-device only','Prefer on-device','Prefer cloud'];
// Mode selectors use machine-readable V84 attributes when available; V83 labels retain compatibility.
const preferenceHelper=`const modes=${JSON.stringify(preferences)};
 const modeOf=b=>{const raw=b.getAttribute('data-elk-preference');if(modes.includes(raw))return raw;
 const label=(b.querySelector('span')?.textContent||b.innerText||'').trim();
 return ({'Cloud only':'Cloud only','Hanya cloud':'Cloud only','On-device only':'On-device only','Hanya perangkat':'On-device only','Prefer on-device':'Prefer on-device','Utamakan perangkat':'Prefer on-device','Prefer cloud':'Prefer cloud','Utamakan cloud':'Prefer cloud'})[label]||null};
 const buttons=[...document.querySelectorAll('.segmented-stack button')];
 const active=()=>buttons.find(b=>b.classList.contains('active')||b.getAttribute('aria-pressed')==='true');`;
async function getPreference(cdp){
 return cdp.evaluate(`(()=>{if(!(${workspaceReady('hybrid')}))return null;${preferenceHelper}const b=active();return b?modeOf(b):null})()`);
}
async function selectPreference(cdp,preference){
 if(!preferences.includes(preference))throw Error('PREFERENCE_CONTROL_MISSING');
 const selected=await cdp.evaluate(`(()=>{if(!(${workspaceReady('hybrid')}))return false;${preferenceHelper}
 const b=buttons.find(b=>modeOf(b)===${JSON.stringify(preference)});if(!b||b.disabled)return false;
 if(b!==active())b.click();return true;})()`);
 if(!selected)throw Error('PREFERENCE_CONTROL_MISSING');
 if(!await waitFor(cdp,`(()=>{if(!(${workspaceReady('hybrid')}))return false;${preferenceHelper}const b=active();return !!b&&modeOf(b)===${JSON.stringify(preference)};})()`,5000))throw Error('PREFERENCE_NOT_APPLIED');
}
export function classifyUi(preference,p){
 if(!p?.fresh||!p.hasText||!providers.includes(p.provider))return {state:'FAIL',detail:'UI_RESULT_UNVERIFIED'};
 if(preference==='Cloud only'&&p.provider!=='IN_CLOUD'||preference==='On-device only'&&p.provider!=='ON_DEVICE')return {state:'FAIL',detail:'UI_RESULT_PROVIDER_MISMATCH'};
 if(p.nativeVerified!==true)return {state:'FAIL',detail:'UI_NATIVE_TRACE_UNVERIFIED'};
 return {state:'PASS',detail:p.provider+'_VISIBLE'};
}
export function visibleProvider(node,label,tutor=false){
 if(!node)return 'UNKNOWN';
 const attr=node.getAttribute('data-elk-provider');const live=node.getAttribute('data-elk-live');
 if(attr||live){if(!['ON_DEVICE','IN_CLOUD'].includes(attr)||live!=='true')return 'UNKNOWN';}
 const visible=tutor?
   (/^(Cloud · Firebase verified|Cloud · Firebase terverifikasi)$/.test(label)?'IN_CLOUD':/^(On-device · Firebase verified|Perangkat · Firebase terverifikasi|Di perangkat · Firebase terverifikasi)$/.test(label)?'ON_DEVICE':'UNKNOWN'):
   (/^(?:Verified provider:|Provider terverifikasi:|Penyedia terverifikasi:)?\s*IN_CLOUD(?:\s*·|$)/i.test(label)?'IN_CLOUD':/^(?:Verified provider:|Provider terverifikasi:|Penyedia terverifikasi:)?\s*ON_DEVICE(?:\s*·|$)/i.test(label)?'ON_DEVICE':'UNKNOWN');
 // Attribute and visible SDK provider must agree. Actual provider is never derived from text answer.
 return attr&&visible!==attr?'UNKNOWN':visible;
 }
const readProvider=`const providerOf=${visibleProvider.toString()};`;
async function uiSmoke(cdp,preference,diagnostics){
 await navigate(cdp,'hybrid','.live-hybrid-check');
 await selectPreference(cdp,preference);
 const before=diagnostics();
 const result=await cdp.evaluate(`new Promise(resolve=>{
  if(!(${workspaceReady('hybrid')})){resolve({error:'UI_ROUTE_LOST'});return;}
  const container=document.querySelector('.live-hybrid-check'),button=container?.querySelector('.primary-button');
  if(!button||button.disabled){resolve({error:'UI_REQUEST_NOT_STARTED'});return;}
  const old=container.querySelector('.live-result'),oldError=container.querySelector('.inline-alert');
  let fresh=false,timer,poll,watcher,finished=false;
  ${readProvider}
  function done(value){if(finished)return;finished=true;clearTimeout(timer);clearInterval(poll);watcher?.disconnect();resolve(value);}
  function check(){
   if(!(${workspaceReady('hybrid')})){done({error:'UI_ROUTE_LOST'});return;}
   const node=container.querySelector('.live-result'),err=container.querySelector('.inline-alert');
   if(button.disabled||!node||node!==old||!old?.isConnected)fresh=true;
   if(button.disabled)return;
   if(fresh&&node){const provider=providerOf(node,node.querySelector('strong')?.textContent?.trim()||'');done({fresh:true,provider,hasText:!!node.querySelector('p')?.textContent?.trim()});}
   else if(fresh&&err&&err!==oldError)done({error:'UI_GENERATION_FAILED'});
  }
  watcher=new MutationObserver(check);watcher.observe(container,{childList:true,subtree:true,attributes:true,characterData:true});
  poll=setInterval(check,250);timer=setTimeout(()=>done({error:'UI_RESULT_TIMEOUT'}),170000);
  button.click();
 })`,180000);
 if(result?.error)return {state:'FAIL',detail:result.error};
 const proof=nativeProof(diagnostics(before),result?.provider);
 return classifyUi(preference,{...result,nativeVerified:proof.verified});
}
async function tutorSmoke(cdp,preference,diagnostics){
 // Independently choose the mode even if Hybrid UI smoke failed before selecting it.
 await navigate(cdp,'hybrid','.live-hybrid-check');await selectPreference(cdp,preference);
 await navigate(cdp,'tutor','.composer textarea');
 const labels={'Cloud only':['Cloud only','Hanya cloud'],'On-device only':['On-device only','Hanya perangkat'],'Prefer on-device':['Prefer on-device','Utamakan perangkat'],'Prefer cloud':['Prefer cloud','Utamakan cloud']};
 const matched=await waitFor(cdp,`(()=>{
   if(!(${workspaceReady('tutor')}))return false;
   const label=document.querySelector('.composer > div > span')?.textContent?.trim()||'';
   return ${JSON.stringify(labels[preference])}.some(s=>label==='Firebase · Android · '+s);
 })()`,5000);
 if(!matched)return {state:'FAIL',detail:'TUTOR_PREFERENCE_MISMATCH'};
 const prompt='Why does salt dissolve in water? Answer in one short English sentence. [QA '+Date.now()+']';
 // Use unique visible prompt to tie the new answer to this test, never return answer text.
 const typed=await cdp.evaluate(`(()=>{
 if(!(${workspaceReady('tutor')}))return false;
 const e=document.querySelector('.composer textarea');
 if(!e)return false;
 Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value').set.call(e,${JSON.stringify(prompt)});
 e.dispatchEvent(new Event('input',{bubbles:true}));return true;})()`);
 if(!typed)return {state:'FAIL',detail:'TUTOR_INPUT_CONTROL'};
 const ready=await waitFor(cdp,`(${workspaceReady('tutor')})&&!!document.querySelector('.composer button:not(:disabled)')`,5000);
 if(!ready)return {state:'FAIL',detail:'TUTOR_INPUT_CONTROL'};
 const before=diagnostics();
 const result=await cdp.evaluate(`new Promise(resolve=>{
  if(!(${workspaceReady('tutor')})){resolve({error:'UI_ROUTE_LOST'});return;}
  const thread=document.querySelector('.conversation'),button=document.querySelector('.composer button:not(:disabled)');
  if(!thread||!button){resolve({error:'UI_REQUEST_NOT_STARTED'});return;}
  let timer,poll,watcher,finished=false;
  ${readProvider}
  function done(value){if(finished)return;finished=true;clearTimeout(timer);clearInterval(poll);watcher?.disconnect();resolve(value);}
  function check(){
   if(!(${workspaceReady('tutor')})){done({error:'UI_ROUTE_LOST'});return;}
   const pair=[...thread.querySelectorAll('.thread-pair')].find(row=>row.querySelector('.user-message')?.textContent?.trim()===${JSON.stringify(prompt)});
   if(!pair||thread.querySelector('.tutor-running'))return;
   const answer=pair.querySelector('.ai-answer'),reply=answer?.querySelector('.answer-section');
   if(!answer||!reply)return;
   if(answer.querySelector('.inline-alert')){done({error:'UI_GENERATION_FAILED'});return;}
   if(!/^(LIVE INFERENCE|INFERENSI LANGSUNG)$/.test(reply.querySelector('.eyebrow')?.textContent?.trim()||'')){done({error:'UI_RESULT_UNVERIFIED'});return;}
   const provider=providerOf(answer,answer.querySelector('.answer-intro small')?.textContent?.trim()||'',true);
   done({fresh:true,provider,hasText:!!reply.querySelector('p:not(.eyebrow)')?.textContent?.trim()});
  }
  watcher=new MutationObserver(check);watcher.observe(thread,{childList:true,subtree:true,attributes:true,characterData:true});
  poll=setInterval(check,250);timer=setTimeout(()=>done({error:'UI_RESULT_TIMEOUT'}),170000);
  button.click();
 })`,180000);
 if(result?.error)return {state:'FAIL',detail:result.error};
 return classifyUi(preference,{...result,nativeVerified:nativeProof(diagnostics(before),result?.provider).verified});
}
// Each independent check records its own outcome; failed attestation/cloud cannot skip local.
export async function runChecks(io,{baseline=false,downloadLocal=false}={}){
 const add=io.add,request=async(kind,preference,timeout)=>{
   try{const packet=await io.request(kind,preference,timeout);return packet&&typeof packet==='object'?packet:{kind:'error',code:'INVALID_REPLY'};}catch{return {kind:'error',code:'TRANSPORT'};}
 };
 if(!baseline){
   add('app_check',classify('attest',await request('attest')));
 }
 let status=await request('status');add('local_model_status',classify('status',status));
 const cloud=classify('cloud',await request('generate','Cloud only'));add('cloud_only',cloud);
 if(baseline)return;
 if(status.status==='DOWNLOADABLE'&&downloadLocal){
   console.log('[INFO] Downloading local model; may take up to 10 minutes.');
   add('model_download',classify('download',await request('download',undefined,625000)));
   status=await request('status');add('local_model_status_after_download',classify('status',status));
 }
 const local=classify('local',await request('generate','On-device only'));add('on_device_only',local);
 const preferredPacket=await request('generate','Prefer on-device');
 const preferred=classify('preferred',preferredPacket);add('prefer_on_device',preferred);
 // A selected cloud route with model-unavailable status demonstrates observed preferred routing,
 // but cannot prove a forced runtime local failure and fallback unless that path is instrumented.
 const fallbackObserved=preferred.state==='PASS'&&preferred.detail==='IN_CLOUD'&&local.state!=='PASS'&&['UNAVAILABLE','DOWNLOADABLE','DOWNLOADING'].includes(status.status);
 const fallbackVerified=preferred.state==='PASS'&&preferred.detail==='IN_CLOUD'&&preferredPacket?.nativeFallback===true;
 add('fallback',{state:fallbackVerified?'PASS':'NOT_TESTED',detail:fallbackVerified?'NATIVE_LOCAL_TO_CLOUD_VERIFIED':fallbackObserved?'PREFERRED_CLOUD_LOCAL_NOT_READY_OBSERVED':'STRICT_FALLBACK_NOT_PROVEN'});
 add('offline_inference',{state:'NOT_TESTED',detail:'NETWORK_NOT_DISABLED'});
 const route=cloud.state==='PASS'?['Cloud only',cloud.detail]:local.state==='PASS'?['On-device only',local.detail]:preferred.state==='PASS'?['Prefer on-device',preferred.detail]:null;
 for(const [name,fn] of [['hybrid_ui',io.ui],['tutor_ui',io.tutor]]){
  if(!route){add(name,{state:'BLOCKED',detail:'NO_VERIFIED_PROVIDER'});continue;}
  try{add(name,await fn(...route));}catch(error){add(name,{state:'FAIL',detail:safeFailure(error,'UI_TEST_ERROR')});}
 }
}
async function main(){
 const arg=key=>{const i=process.argv.indexOf(key);return i<0?undefined:process.argv[i+1];};
 const adb=arg('--adb');if(!adb)throw new Error('Provide --adb');
 const reportPath=resolve(arg('--report')||'reports/android-ai-doctor.json');
 const report={time:new Date().toISOString(),package:PKG,mode:process.argv.includes('--baseline')?'baseline':'post_install',checks:[],nativeDiagnostics:[],routeTrace:[]};
 const add=(name,outcome)=>{report.checks.push({name,...outcome});console.log('['+outcome.state+'] '+name+' '+outcome.detail);return outcome;};
 let port,cdp,run,beforeSafe=null,originalPreference=null;
 try{
  if(typeof WebSocket!=='function')throw new Error('NODE_22_OR_NEWER_REQUIRED');
  const serial=await selectDevice(adbRunner(adb),arg('--serial'));
  report.transport=serial.includes('._adb-tls-connect._tcp')||/^.+:\d+$/.test(serial)?'WIRELESS_OR_TCP':'USB_OR_OTHER';
  run=adbRunner(adb,serial);
  const info=await probePackage(run,PKG);
  report.version=info.version;report.packageEvidence=info.evidence;
  add('installed_apk',{state:info.presence==='PRESENT'?'PASS':info.presence==='NOT_FOUND'?'FAIL':'BLOCKED',detail:info.evidence});
  if(info.presence!=='PRESENT')throw Error(info.presence==='NOT_FOUND'?'APK_NOT_INSTALLED':'PACKAGE_PROBE_UNAVAILABLE');
  const expected=arg('--expected-version');
  add('apk_version',{state:info.version==='UNKNOWN'?'INFO':expected&&info.version!==expected?'FAIL':'PASS',detail:info.version==='UNKNOWN'?'VERSION_METADATA_UNAVAILABLE':info.version});
  const core=await probePackage(run,'com.google.android.aicore',{attempts:1,version:false});
  add('aicore_package',{state:'INFO',detail:core.presence});
  const target=await deviceTarget(run);port=target.port;
  cdp=await connectCDP(target.url);
  // Wait for the actual session/role UI, then use the real navigation handlers.
  // Do not read auth storage or send credentials into a report.
  const observe=s=>{
   const entry={surface:s.surface,route:s.route,gate:!!s.gate,bridge:!!s.bridge,hybrid:!!s.hybrid,tutor:!!s.tutor,web84:!!s.web84};
   report.routeTrace.push(entry);
   console.log('[ROUTE] '+JSON.stringify(entry));
  };
  const baseline=process.argv.includes('--baseline');
  await navigate(cdp,'hybrid','.live-hybrid-check',observe,!baseline||process.argv.includes('--baseline-login'));
  add('learner_workspace',{state:'PASS',detail:'V83_LEARNER_GATE_PRESENT'});
  if(!baseline){
   const state=await inspectWorkspace(cdp);
   add('web_ui_v84',{state:state.web84?'PASS':'BLOCKED',detail:state.web84?'V84_WEB_MARKER_PRESENT':'V84_WEB_MARKER_MISSING'});
   try{originalPreference=await getPreference(cdp);}catch{}
  }
  beforeSafe=readNativeRecords(run);
  const diagnostics=(before)=>before===undefined?readNativeRecords(run):nativeSince(run,before);
  await runChecks({
   add,request:async(kind,preference,timeout)=>{
    const nativeBefore=diagnostics();
    const packet=await bridgeRequest(cdp,kind,preference,timeout);
    const trace=diagnostics(nativeBefore);
    if(kind==='generate'&&packet?.provider)packet.nativeFallback=nativeProof(trace,packet.provider).fallback;
    return packet;
   },
   ui:(preference)=>originalPreference?uiSmoke(cdp,preference,diagnostics):Promise.resolve({state:'BLOCKED',detail:'ORIGINAL_PREFERENCE_UNAVAILABLE'}),
   tutor:(preference)=>originalPreference?tutorSmoke(cdp,preference,diagnostics):Promise.resolve({state:'BLOCKED',detail:'ORIGINAL_PREFERENCE_UNAVAILABLE'})
  },{baseline,downloadLocal:process.argv.includes('--download-local')});
 }catch(e){
  // Never echo arbitrary adb output, URLs, or credentials.
  add('doctor_runtime',{state:'FAIL',detail:safeFailure(e)});
 }finally{
  if(cdp&&originalPreference)try{
   await navigate(cdp,'hybrid','.live-hybrid-check');await selectPreference(cdp,originalPreference);
   add('preference_restore',{state:'INFO',detail:'ORIGINAL_PREFERENCE_RESTORED'});
  }catch{add('preference_restore',{state:'FAIL',detail:'PREFERENCE_RESTORE_FAILED'});}
  if(run&&beforeSafe!==null){
   report.nativeDiagnostics=nativeSince(run,beforeSafe).slice(-200);
  }
  if(cdp)cdp.close();
  if(run&&port)try{run('forward','--remove','tcp:'+port)}catch{}
  if(report.mode==='post_install'){
   for(const name of ['installed_apk','learner_workspace','web_ui_v84','app_check','local_model_status','cloud_only','on_device_only','prefer_on_device','hybrid_ui','tutor_ui']){
    if(!report.checks.some(c=>c.name===name))add(name,{state:'BLOCKED',detail:'PREREQUISITE_NOT_MET'});
   }
   if(!report.checks.some(c=>c.name==='fallback'))add('fallback',{state:'NOT_TESTED',detail:'STRICT_FALLBACK_NOT_PROVEN'});
   if(!report.checks.some(c=>c.name==='offline_inference'))add('offline_inference',{state:'NOT_TESTED',detail:'NETWORK_NOT_DISABLED'});
  }
  report.summary={passed:report.checks.filter(c=>c.state==='PASS').length,failed:report.checks.filter(c=>c.state==='FAIL').length,blocked:report.checks.filter(c=>c.state==='BLOCKED').length,notTested:report.checks.filter(c=>c.state==='NOT_TESTED').length};
  mkdirSync(dirname(reportPath),{recursive:true});writeFileSync(reportPath,JSON.stringify(report,null,2)+'\n');
  console.log('\n=== SAFE REPORT ===');console.log(JSON.stringify(report,null,2));
  console.log('Saved: '+reportPath);
  process.exitCode=report.summary.failed||report.summary.blocked?2:0;
 }
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)await main();
