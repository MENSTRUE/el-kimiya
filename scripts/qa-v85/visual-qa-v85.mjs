#!/usr/bin/env node
// V8.5 visual QA. Local screenshots/data; no credentials, tokens or Firestore writes.
// Real browsers only. Missing auth/browser/Android is BLOCKED, not a false pass.
import { mkdirSync,writeFileSync,existsSync } from 'node:fs';
import { resolve,join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { LEARNER_ROUTES,MODULER_ROUTES,createMatrix,trustedUrl,screenshotName,summarize,classifyAudit,inspectPage,auditPage,inspectDrawer,clickVisible,inspectSplash,splashVerdict,viewports } from './visual-core-v85.mjs';
const val=(k,def)=>{const i=process.argv.indexOf(k);return i<0?def:process.argv[i+1];};
const flags=new Set(process.argv.slice(2));
const options={url:trustedUrl(val('--url','http://127.0.0.1:4173/')),role:val('--role','both'),report:resolve(val('--report-dir','reports/visual-v85')),adb:val('--adb',null),serial:val('--serial',null),androidOnly:flags.has('--android-only'),browserExe:val('--browser-exe',null),quick:flags.has('--quick'),drawerOnly:flags.has('--drawer-only'),polish:flags.has('--polish')};
if(!['learner','moduler','both'].includes(options.role))throw Error('Use --role learner|moduler|both');
if(options.androidOnly&&!options.adb)throw Error('--android-only requires --adb <path>');
if(options.drawerOnly&&!options.androidOnly)throw Error('--drawer-only requires --android-only');
if(options.polish&&(!options.drawerOnly||!options.androidOnly))throw Error('--polish requires --android-only --drawer-only');
const base=options.url,origin=new URL(base).origin;
const modes=options.androidOnly?['android']:options.adb?['desktop','mobile','android']:['desktop','mobile'];
const fullMatrix=options.drawerOnly?[]:createMatrix(options.role,modes);
const matrix=options.quick?fullMatrix.filter(c=>c.theme==='dark'&&c.language==='id'):fullMatrix;
const actualRoles=options.role==='both'?['learner','moduler']:[options.role];
const expectedDrawerChecks=(actualRoles.length+(options.polish&&actualRoles.includes('learner')?1:0))*(options.quick?1:4);
const screenshots=join(options.report,'screenshots');mkdirSync(screenshots,{recursive:true});
const results=[],extras=[];const startedAt=new Date().toISOString();
const delay=ms=>new Promise(r=>setTimeout(r,ms));
const safeError=e=>typeof e?.message==='string'&&/^[A-Z][A-Z0-9_]{3,90}$/.test(e.message)?e.message:'RUNTIME_OR_NAVIGATION_ERROR';
function persist(){
 const summary=summarize(results,matrix);const supplemental={pass:extras.filter(e=>e.status==='PASS').length,fail:extras.filter(e=>e.status==='FAIL').length,warn:extras.filter(e=>e.status==='WARN').length,blocked:extras.filter(e=>e.status==='BLOCKED').length};
 const complete=options.drawerOnly?supplemental.pass===expectedDrawerChecks&&supplemental.fail===0&&supplemental.blocked===0&&supplemental.warn===0:summary.certified&&!options.quick&&supplemental.fail===0&&supplemental.blocked===0&&supplemental.warn===0;
 const data={startedAt,updatedAt:new Date().toISOString(),version:options.polish?'8.6':'8.5.1',url:base,quick:options.quick,drawerOnly:options.drawerOnly,matrix:summary,supplemental,complete,results,extras,note:'Contrast checks measure visible solid-background text only; screenshots remain local. This does not verify translations semantically, camera permissions, Firebase model inference or CRUD/release behavior.'};
 writeFileSync(join(options.report,'report.json'),JSON.stringify(data,null,2));return data;
}
function addResult(c,state){
 const result={...c,...state};results.push(result);
 console.log('['+result.status+'] '+[c.role,c.viewport,c.theme,c.language,c.route].join('/')+(result.reasons?.length?' '+result.reasons.join(','):''));
 persist();
}
function addExtra(data){extras.push(data);console.log('['+data.status+'] '+data.check+(data.detail?' '+data.detail:''));persist();}
const permittedOrigin=ev=>ev.origin===origin&&ev.rootPath;
async function waitFor(target,pred,ms=10000){
 const end=Date.now()+ms;let last;
 while(Date.now()<end){
  try{last=await target.eval(inspectPage);if(!permittedOrigin(last))throw Error('UNTRUSTED_URL');if(pred(last))return last;}
  catch(e){if(e?.message==='UNTRUSTED_URL')throw e;}
  await delay(150);
 }
 return null;
}
async function click(target,role,selector,scroll=false){
 return target.eval(clickVisible,{selector,role,origin,scroll});
}
async function observeSplash(target,role,viewport){
 let now=null;
 try{now=await target.eval(inspectSplash);}catch{}
 let sample=now;
 if(!sample&&target.splash)try{sample=await target.splash();}catch{}
 if(!sample){
  addExtra({check:'session-splash',role,viewport,status:'WARN',detail:'NOT_OBSERVED_DURING_ACTUAL_PAINT'});return;
 }
 const verdict=splashVerdict(sample);
 let png=null;
 if(now){const st=await target.eval(inspectPage).catch(()=>null);if(st&&permittedOrigin(st)&&st.session){png=role+'-'+viewport+'-splash.png';try{await target.capture(join(screenshots,png));}catch{png=null;}}}
 addExtra({check:'session-splash',role,viewport,...verdict,sample,screenshot:png});
}
async function manualLogin(target,role,viewport){
 let s=await target.eval(inspectPage).catch(()=>null);
 if(s&&permittedOrigin(s)&&s.role===role&&s.ready)return s;
 console.log('\n[ACTION] Login sebagai '+role+' pada '+viewport+'. Masukkan kredensial hanya di form aplikasi. Jangan kirim ke terminal. Waktu 3 menit.');
 if(target.kind==='browser'){try{await target.goto(base+'#account');}catch{}}
 const result=await waitFor(target,s=>s.role===role,180000);
 if(!result)throw Error('ROLE_LOGIN_NOT_OBSERVED');
 if(!result.ready)throw Error('V85_MARKER_MISSING');
 return result;
}
async function setAppearance(target,c){
 let s=await target.eval(inspectPage);
 if(s.drawerVisible&&c.viewport!=='desktop'){
  if(!await click(target,c.role,'[data-elk-drawer-close]',true))throw Error('DRAWER_CLOSE_NOT_FOUND');
  if(!await waitFor(target,x=>!x.drawerVisible))throw Error('DRAWER_CLOSE_FAILED');
 }
 if(s.theme!==c.theme){
  if(!await click(target,c.role,'[data-elk-theme-toggle]'))throw Error('THEME_TOGGLE_MISSING');
  if(!await waitFor(target,x=>x.theme===c.theme))throw Error('THEME_CHANGE_NOT_APPLIED');
 }
 s=await target.eval(inspectPage);
 if(s.language!==c.language){
  if(!await click(target,c.role,'[data-elk-language="'+c.language+'"]'))throw Error('LANGUAGE_CONTROL_MISSING');
  if(!await waitFor(target,x=>x.language===c.language))throw Error('LANGUAGE_CHANGE_NOT_APPLIED');
 }
}
async function openDrawer(target,c){
 if((await target.eval(inspectPage)).drawerVisible){await delay(200);return target.eval(inspectDrawer);}
 if(!await click(target,c.role,'[data-elk-drawer-toggle]'))throw Error('HAMBURGER_MISSING');
 if(!await waitFor(target,x=>x.drawerVisible,5000))throw Error('DRAWER_DID_NOT_OPEN');
 await delay(300);return target.eval(inspectDrawer);
}
async function drawerAudit(target,c){
 let drawer=await openDrawer(target,c);
 const routes=c.role==='learner'?LEARNER_ROUTES:MODULER_ROUTES;
 const pass=drawer.visible&&drawer.release&&drawer.painted&&drawer.coverage>=96&&drawer.top<=4&&drawer.bottom>=drawer.height-4&&drawer.left>=-3&&drawer.right<=drawer.width+3&&drawer.expanded&&drawer.focusInside&&routes.every(r=>drawer.routes.includes(r));
 const png=screenshotName({...c,route:'drawer'});
 let screenshot=null;
 try{await target.capture(join(screenshots,png));screenshot=png;}catch{}
 let closed=false;
 // Actual keyboard dismissal where browser/CDP provides keyboard.
 if(target.escape){try{await target.escape();closed=!!await waitFor(target,x=>!x.drawerVisible,2500);}catch{}}
 if(!closed){
  try{closed=await click(target,c.role,'[data-elk-drawer-close]',true)&&!!await waitFor(target,x=>!x.drawerVisible,4000);}catch{}
 }
 addExtra({check:'mobile-drawer',...c,status:pass&&closed&&screenshot?'PASS':'FAIL',detail:!pass?'DRAWER_GEOMETRY_FOCUS_OR_ROUTE_DEFECT':!closed?'DRAWER_CLOSE_FAILED':!screenshot?'SCREENSHOT_FAILED':'DRAWER_FULL_HEIGHT_AND_ALL_ROUTES',drawer,closed,screenshot});
 if(!closed)throw Error('DRAWER_CLOSE_FAILED');
}
// Read-only physical builder smoke: actual app surface, no validation/backend request.
async function builderAudit86(target,c){
 const route='molecules';
 let opened=false,closed=false,geometry=null,screenshot=null,error='';
 try{
  await navigate(target,{...c,route});
  const mark=await target.eval(()=>document.documentElement.dataset.elkPolishRelease==='8.6');
  if(!mark)throw Error('V86_MARKER_MISSING');
  if(!await click(target,'learner','[data-elk-molecule-open="builder"]',true))throw Error('MOLECULE_LAUNCHER_MISSING');
  opened=true;
  const deadline=Date.now()+6000;
  while(Date.now()<deadline){
   geometry=await target.eval(()=>{
    const root=document.querySelector('[data-elk-molecule-fullscreen="builder"]');
    const svg=root?.querySelector('.v61-drop-zone svg');
    if(!root||!svg)return null;
    const r=root.getBoundingClientRect(),b=svg.getBoundingClientRect();
    const hit=document.elementFromPoint(Math.round(b.left+b.width/2),Math.round(b.top+b.height/2));
    return {visible:r.width>0&&r.height>0,full:r.left<=3&&r.top<=3&&r.right>=innerWidth-3&&r.bottom>=innerHeight-3,canvasWidth:Math.round(b.width),canvasHeight:Math.round(b.height),width:innerWidth,height:innerHeight,hit:!!hit&&svg.contains(hit)};
   });
   if(geometry?.full&&geometry?.hit)break;
   await delay(150);
  }
  if(!geometry?.visible||!geometry.full||!geometry.hit||geometry.canvasWidth<geometry.width*.65||geometry.canvasHeight<170)throw Error('MOLECULE_FULLSCREEN_GEOMETRY');
  screenshot=['learner','android',c.theme,c.language,'molecule-builder'].join('-')+'.png';
  await target.capture(join(screenshots,screenshot));
 }catch(e){error=safeError(e);}
 finally{
  if(opened){
   try{
    const selector='[data-elk-molecule-fullscreen="builder"] [data-elk-drawer-close]';
    const clicked=await click(target,'learner',selector,true);
    if(clicked){
     const until=Date.now()+5000;
     while(Date.now()<until){
      if(!await target.eval(()=>!!document.querySelector('[data-elk-molecule-fullscreen="builder"]'))){closed=true;break;}
      await delay(150);
     }
    }
   }catch{}
  }
 }
 addExtra({check:'molecule-builder',...c,status:!error&&closed?'PASS':opened?'FAIL':'BLOCKED',detail:error||(!closed?'MOLECULE_CLOSE_FAILED':'MOLECULE_FULLSCREEN_GEOMETRY_AND_CLOSE'),geometry,closed,screenshot});
 if(opened&&!closed)throw Error('MOLECULE_CLOSE_FAILED');
}
async function navigate(target,c){
 if(c.viewport!=='desktop')await openDrawer(target,c);
 const selector='[data-elk-route="'+c.route+'"]';
 if(!await click(target,c.role,selector,true))throw Error('ROUTE_CONTROL_NOT_CLICKABLE');
 const state=await waitFor(target,x=>x.ready&&x.role===c.role&&x.route===c.route&&(c.viewport==='desktop'||!x.drawerVisible),12000);
 if(!state)throw Error('ROUTE_NOT_REACHED_OR_DRAWER_VISIBLE');
 await delay(300);
 return state;
}
async function checkRoute(target,c){
 try{
  const state=await navigate(target,c);
  const metrics=await target.eval(auditPage);
  const observed={...state,...metrics};delete observed.origin;
  const verdict=classifyAudit(observed,c);
  const png=screenshotName(c);
  try{await target.capture(join(screenshots,png));}catch{verdict.status='FAIL';verdict.reasons.push('SCREENSHOT_FAILED');}
  addResult(c,{...verdict,observed,screenshot:verdict.reasons.includes('SCREENSHOT_FAILED')?null:png});
 }catch(e){addResult(c,{status:'BLOCKED',reasons:[safeError(e)]});}
}
async function runMatrix(target,role,viewport){
 let relevant=matrix.filter(x=>x.role===role&&x.viewport===viewport);if(!relevant.length)return;
 try{
  await manualLogin(target,role,viewport);
 }catch(e){for(const c of relevant)addResult(c,{status:'BLOCKED',reasons:[safeError(e)]});return;}
 const initial=await target.eval(inspectPage);
 if(!initial.ready||initial.role!==role){for(const c of relevant)addResult(c,{status:'BLOCKED',reasons:['V85_WORKSPACE_NOT_READY']});return;}
 try{
  for(let i=0;i<relevant.length;){
   const c=relevant[i],group=relevant.slice(i).filter(x=>x.theme===c.theme&&x.language===c.language);
   i+=group.length;
   try{
    await setAppearance(target,c);
    if(viewport!=='desktop')await drawerAudit(target,c);
   }catch(e){
    for(const item of group)addResult(item,{status:'BLOCKED',reasons:[safeError(e)]});continue;
   }
   for(const item of group)await checkRoute(target,item);
  }
 } finally {
  // Browser contexts are disposable; Android manual role session is kept. Restore theme and language.
  if(viewport==='android'&&initial.language&&initial.theme){
   try{await setAppearance(target,{role,viewport,theme:initial.theme,language:initial.language});}catch{}
  }
 }
}
function splashInit(inspect){
 window.__elk85SplashAudit=null;
 const auditUntil=performance.now()+30000;
 function frame(){
  const s=inspect();
  if(s&&s.surface.right>s.surface.left&&s.surface.bottom>s.surface.top)window.__elk85SplashAudit=s;
  if(performance.now()<auditUntil&&(window.__elk85SplashAudit===null||document.querySelector('.v81-session')))requestAnimationFrame(frame);
 }
 requestAnimationFrame(frame);
}
const splashInitScript='('+splashInit.toString()+')('+inspectSplash.toString()+');';
async function browserTarget(page){
 return {kind:'browser',eval:(fn,arg)=>page.evaluate(fn,arg),goto:url=>page.goto(url,{waitUntil:'domcontentloaded',timeout:45000}),capture:path=>page.screenshot({path,fullPage:false,animations:'disabled',timeout:20000}),escape:()=>page.keyboard.press('Escape'),splash:()=>page.evaluate(()=>window.__elk85SplashAudit)};
}
async function openBrowser(){
 const {chromium}=await import('playwright').catch(()=>{throw Error('PLAYWRIGHT_PACKAGE_MISSING');});
 const known=[options.browserExe,process.env.ELK_CHROME,process.env['PROGRAMFILES(X86)']&&join(process.env['PROGRAMFILES(X86)'],'Microsoft','Edge','Application','msedge.exe'),process.env.PROGRAMFILES&&join(process.env.PROGRAMFILES,'Google','Chrome','Application','chrome.exe')].filter(Boolean);
 for(const executablePath of [undefined,...known.filter(x=>existsSync(x))]){
  try{return await chromium.launch({headless:false,executablePath});}catch{}
 }
 throw Error('BROWSER_EXECUTABLE_MISSING');
}
async function runPublic(browser){
 // Guest contexts are isolated, no account sign-in/reset/registration submissions.
 const routes=['landing','guest','account','register','reset'];
 for(const viewport of ['desktop','mobile']){
  for(const theme of options.quick?['dark']:['light','dark']){
   const ctx=await browser.newContext({viewport:viewports[viewport],colorScheme:theme});
   try{
    await ctx.addInitScript({content:splashInitScript});
    const page=await ctx.newPage(),target=await browserTarget(page);
    await target.goto(base+'#landing');
    if(!await waitFor(target,x=>x.landing&&!x.session,30000))throw Error('PUBLIC_LANDING_UNAVAILABLE');
    for(const language of options.quick?['id']:['id','en']){
     for(const route of routes){
      const c={role:'guest',viewport,theme,language,route};
      try{
       await target.goto(base+'#'+route);
       const surface=route==='landing'?'landing':route==='guest'?'guest':'auth';
       let state=await waitFor(target,x=>x[surface]&&!x.session&&x.route===route,15000);
       if(!state)throw Error('PUBLIC_ROUTE_UNAVAILABLE');
       if(state.language!==language){
        if(!await click(target,null,'[data-elk-language="'+language+'"]'))throw Error('LANGUAGE_CONTROL_MISSING');
        state=await waitFor(target,x=>x.language===language,5000);if(!state)throw Error('LANGUAGE_CHANGE_NOT_APPLIED');
       }
       await delay(250);
       const metrics=await target.eval(auditPage);
       const reasons=[];
       if(state.role)reasons.push('PUBLIC_ROLE_NOT_GUEST');
       if(!state.publicMarker||state.publicRoute!==route)reasons.push('PUBLIC_V85_MARKER_OR_ROUTE_MISSING');
       if(state.theme!==theme)reasons.push('THEME_NOT_APPLIED');
       if(metrics.overflow>2)reasons.push('HORIZONTAL_OVERFLOW');
       if(metrics.contrastFailures)reasons.push('LOW_CONTRAST');
       const png=screenshotName(c);let screenshot=null;
       try{await target.capture(join(screenshots,png));screenshot=png;}catch{reasons.push('SCREENSHOT_FAILED');}
       addExtra({check:'public-route',...c,status:reasons.length?'FAIL':metrics.contrastMeasured?'PASS':'WARN',detail:reasons.join(',')||(!metrics.contrastMeasured?'CONTRAST_NOT_MEASURED':'PUBLIC_VISUAL_AUDIT'),screenshot,metrics});
      }catch(e){addExtra({check:'public-route',...c,status:'BLOCKED',detail:safeError(e)});}
     }
    }
   }catch(e){addExtra({check:'public-matrix',viewport,theme,status:'BLOCKED',detail:safeError(e)});}
   finally{await ctx.close();}
  }
 }
}
async function runBrowser(){
 let browser;
 try{
  browser=await openBrowser();
  await runPublic(browser);
  for(const role of actualRoles){
   const ctx=await browser.newContext({viewport:viewports.desktop});
   try{
    await ctx.addInitScript({content:splashInitScript});
    const page=await ctx.newPage(),target=await browserTarget(page);
    await target.goto(base+'#account');
    await observeSplash(target,role,'desktop');
    await runMatrix(target,role,'desktop');
    await page.setViewportSize(viewports.mobile);
    await delay(300);
    await runMatrix(target,role,'mobile');
   }catch(e){addExtra({check:'browser-role',role,status:'BLOCKED',detail:safeError(e)});}
   finally{await ctx.close();}
  }
 }catch(e){addExtra({check:'browser',status:'BLOCKED',detail:safeError(e)});}
 finally{await browser?.close();}
}
function adbRunner(adb,serial){
 return (...args)=>execFileSync(adb,[...(serial?['-s',serial]:[]),...args],{encoding:'utf8',windowsHide:true,stdio:['ignore','pipe','pipe'],timeout:30000,maxBuffer:8*1024*1024}).trim();
}
async function connectWebView(url){
 const ws=new WebSocket(url);let seq=0;const pending=new Map();
 await new Promise((res,rej)=>{const t=setTimeout(()=>rej(Error('CDP_OPEN_TIMEOUT')),10000);ws.addEventListener('open',()=>{clearTimeout(t);res();},{once:true});ws.addEventListener('error',()=>{clearTimeout(t);rej(Error('CDP_OPEN_FAILED'));},{once:true});});
 ws.addEventListener('message',e=>{try{const p=JSON.parse(e.data),w=pending.get(p.id);if(!w)return;clearTimeout(w.timer);pending.delete(p.id);p.error?w.reject(Error('CDP_COMMAND_FAILED')):w.resolve(p.result);}catch{}});
 ws.addEventListener('close',()=>{for(const w of pending.values()){clearTimeout(w.timer);w.reject(Error('CDP_CLOSED'));}pending.clear();});
 function call(method,params={},timeout=15000){return new Promise((resolve,reject)=>{const id=++seq,timer=setTimeout(()=>{pending.delete(id);reject(Error('CDP_TIMEOUT'));},timeout);pending.set(id,{resolve,reject,timer});try{ws.send(JSON.stringify({id,method,params}));}catch{clearTimeout(timer);pending.delete(id);reject(Error('CDP_SEND_FAILED'));}});}
 async function evaluate(fn,arg){
  const expression='('+fn.toString()+')('+JSON.stringify(arg??null)+')';
  const result=await call('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true,userGesture:true});
  if(result.exceptionDetails)throw Error('CDP_EVALUATE_FAILED');
  return result.result?.value;
 }
 return {evaluate,call,close:()=>ws.close()};
}
async function runAndroid(){
 if(origin!=='https://el-kimiya.vercel.app'){addExtra({check:'android',status:'BLOCKED',detail:'ANDROID_REQUIRES_PRODUCTION_URL'});return;}
 let cdp,run,port;
 try{
  const {selectDevice,probePackage,selectTarget}=await import('../android-v84/android-ai-doctor.mjs').catch(()=>{throw Error('V84_DEVICE_HELPER_MISSING');});
  const serial=await selectDevice(adbRunner(options.adb),options.serial);
  run=adbRunner(options.adb,serial);
  const pkg='com.menstrue.elkimiya',probe=await probePackage(run,pkg);
  if(probe.presence!=='PRESENT')throw Error('APK_NOT_INSTALLED');
  if(probe.version!=='0.8.5')throw Error('ANDROID_V85_APK_REQUIRED');
  run('shell','am','start','-n',pkg+'/.MainActivity');
  const until=Date.now()+45000;
  let url;
  while(Date.now()<until&&!url){
   try{
    const pid=run('shell','pidof',pkg).split(/\s+/)[0];
    if(!/^\d+$/.test(pid))throw Error('PID_UNAVAILABLE');
    if(!port)port=run('forward','tcp:0','localabstract:webview_devtools_remote_'+pid);
    if(!/^\d+$/.test(port))throw Error('FORWARD_UNAVAILABLE');
    const list=await fetch('http://127.0.0.1:'+port+'/json/list',{signal:AbortSignal.timeout(2500)}).then(r=>r.json());
    const target=selectTarget(list);
    if(target){const w=new URL(target.webSocketDebuggerUrl);w.hostname='127.0.0.1';w.port=port;url=w.toString();}
   }catch{}
   if(!url)await delay(1000);
  }
  if(!url)throw Error('WEBVIEW_DEVTOOLS_NOT_AVAILABLE');
  cdp=await connectWebView(url);
  const target={kind:'android',eval:cdp.evaluate,capture:path=>{
   const png=execFileSync(options.adb,['-s',serial,'exec-out','screencap','-p'],{windowsHide:true,timeout:20000,maxBuffer:30*1024*1024});
   if(png[0]!==137||png[1]!==80||png[2]!==78||png[3]!==71)throw Error('ANDROID_SCREENSHOT_INVALID');
   writeFileSync(path,png);
  },escape:async()=>{
   await cdp.call('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});
   await cdp.call('Input.dispatchKeyEvent',{type:'keyUp',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});
  }};
  // No auth mutation; the owner switches roles using the application's real login flow.
  for(const role of actualRoles){
   if(options.drawerOnly){
    try{
     const initial=await manualLogin(target,role,'android');
     try{
      for(const theme of options.quick?['dark']:['dark','light'])for(const language of options.quick?['id']:['id','en']){
       const c={role,viewport:'android',theme,language};
       await setAppearance(target,c);await drawerAudit(target,c);
       if(options.polish&&role==='learner')await builderAudit86(target,c);
      }
     }finally{try{await setAppearance(target,{role,viewport:'android',theme:initial.theme,language:initial.language});}catch{}}
    }catch(e){addExtra({check:'android-drawer-role',role,status:'BLOCKED',detail:safeError(e)});}
   }else{
    await observeSplash(target,role,'android');
    await runMatrix(target,role,'android');
   }
  }
 }catch(e){addExtra({check:'android',status:'BLOCKED',detail:safeError(e)});}
 finally{cdp?.close();if(port&&run)try{run('forward','--remove','tcp:'+port);}catch{}}
}
async function main(){
 persist();
 console.log('[INFO] '+(options.polish?'V8.6 polish':'V8.5')+' ',matrix.length,' expected route screenshots. All output is saved locally:',options.report);
 console.log('[PRIVACY] Do not upload unreviewed screenshots; authenticated profile/learning pages may show account data. This QA does not create, edit, publish or delete real database records.');
 if(!options.androidOnly)await runBrowser();
 if(options.adb)await runAndroid();
 const data=persist();
 console.log('[RESULT]',JSON.stringify({matrix:data.matrix,supplemental:data.supplemental,complete:data.complete}));console.log('Report:',join(options.report,'report.json'));
 process.exitCode=data.complete?0:2;
}
await main();
