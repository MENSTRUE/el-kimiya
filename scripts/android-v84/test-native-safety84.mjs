// Scope: bridge transport actual behavior + native source invariants (not device inference).
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
const root=resolve(process.argv[2]||'ai84');
globalThis.window={};
globalThis.document={documentElement:{lang:'en'}};
Object.defineProperty(globalThis,'navigator',{value:{userAgent:'WebView ElKimiyaAndroid/8.4'},configurable:true});
const {runNativeAi83,isAndroid83}=await import(pathToFileURL(resolve(root,'src/lib/nativeAi83.ts')));
const failures=[];
function check(name,fn){try{fn();console.log('PASS',name)}catch(e){failures.push(name);console.error('FAIL',name,e.message)}}
check('v84 native UA is recognized even if the bridge is unavailable',()=>assert.equal(isAndroid83(),true));
let last;
const bridge={postMessage(raw){last=JSON.parse(raw)},onmessage:null};window.ElKimiyaAI83=bridge;
const emit=packet=>bridge.onmessage({data:JSON.stringify({id:last.id,...packet})});
for(const [code,en,id] of [
  ['APP_CHECK',/App Check/,/App Check/],['QUOTA',/quota|limit/i,/kuota/i],['API_KEY',/API key/i,/API/i],
  ['HTTP_403',/permission|403/i,/izin|403/i],['HTTP_404',/model|404/i,/model|404/i],['HTTP_401',/auth|401/i,/autentikasi|401/i],
  ['CONFIG',/configuration|enabled/i,/konfigurasi|aktif/i],['BLOCKED',/blocked/i,/blokir/i],
  ['LOCAL_INPUT',/local.*request|request.*local/i,/lokal/i],['LOCAL_BUSY',/local.*busy|busy.*local/i,/lokal/i],
  ['LOCAL_QUOTA',/local.*quota|quota.*local/i,/kuota.*lokal|lokal.*kuota/i],['LOCAL_RUNTIME',/local inference failed/i,/inferensi lokal gagal/i],['NO_TEXT',/empty|no.*text/i,/teks|kosong/i],
  ['SOURCE_MISMATCH',/verified|source/i,/sumber|terverifikasi/i],['SERVICE',/service/i,/layanan/i]
]){
  for(const [lang,expected] of [['en',en],['id',id]]){
    document.documentElement.lang=lang;
    const p=runNativeAi83('H2O?','Prefer on-device');
    emit({kind:'error',code,text:'private input'});
    try{await assert.rejects(p,e=>expected.test(e.message)&&!e.message.includes('private input'));console.log('PASS error',code,lang)}catch(e){failures.push(code+' '+lang);console.error('FAIL error',code,lang,e.message)}
  }
}
document.documentElement.lang='en';
let p=runNativeAi83('H2O?','On-device only');emit({kind:'result',text:'real',model:'local',provider:'IN_CLOUD'});await assert.rejects(p,/verified/);
p=runNativeAi83('H2O?','Prefer on-device');emit({kind:'result',text:'real',model:'cloud',provider:'IN_CLOUD'});assert.deepEqual(await p,{text:'real',model:'cloud',provider:'IN_CLOUD'});
p=runNativeAi83('H2O?','Prefer on-device');emit({kind:'result',text:'real',model:'local',provider:'ON_DEVICE'});assert.deepEqual(await p,{text:'real',model:'local',provider:'ON_DEVICE'});
const k=readFileSync(resolve(root,'android/app/src/main/java/com/menstrue/elkimiya/NativeAiBridge83.kt'),'utf8');
const h=readFileSync(resolve(root,'src/lib/hybrid.ts'),'utf8');
check('SDK cloud calls use replay-protected limited-use tokens',()=>assert.match(k,/useLimitedUseAppCheckTokens\s*=\s*true/));
check('debug-only attestation verifies same limited-use capability',()=>assert.match(k,/getLimitedUseAppCheckToken\(\)/));
check('provider + model readiness use documented typed API',()=>{assert.match(k,/InferenceSource\.ON_DEVICE/);assert.match(k,/InferenceSource\.IN_CLOUD/);assert.match(k,/OnDeviceModelStatus\.AVAILABLE/);});
check('failure codes are surfaced rather than replaced with generic failures',()=>assert.match(k,/errorCode\s*=\s*classifyFailure\(e/));
check('native prefer-on-device makes an explicit local-only attempt',()=>assert.match(k,/PREFER_ON_DEVICE[\s\S]+generateVerified\(prompt,\s*InferenceMode\.ONLY_ON_DEVICE\)/));
check('cloud fallback is restricted to the allowed recoverable local errors',()=>assert.match(k,/if\s*\(!localFallbackCodes\.contains\(.*\)\)/));
check('native result is allowed only for explicit typed provider and nonblank text',()=>{assert.match(k,/response\.inferenceSource/);assert.match(k,/text\.isNullOrBlank\(\)/);assert.match(k,/"SOURCE_MISMATCH"/);});
check('all origin, role/session, navigation, revision gates retained',()=>{for(const check of ['!mainFrame || !trusted(source)','setOf(origin)','view.url!=url','current!=session','generation!=epoch','data-elk-ai-session','ONLY_ON_DEVICE','ONLY_IN_CLOUD'])assert(k.includes(check),check);assert(!k.includes('addJavascriptInterface'));});
check('native generation does not require browser-only Firebase configuration',()=>assert(h.indexOf('if (isAndroid83()) return runNativeAi83')<h.indexOf('if (!firebaseConfigured)')));
check('web SDK cloud calls use limited-use tokens too',()=>assert.match(h,/useLimitedUseAppCheckTokens:\s*true/));
if(failures.length){console.error('FAILURES:',failures.join(', '));process.exitCode=1;}
