// Real production learner React shell with credentials/chemistry isolated.
// Test delayed network, high-DPR Android user agent, slow CPU, page switching,
// touch interaction, retained graph, browser history failure, and no inert lock.
import {build,preview} from 'vite';
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
const fixture='const state={user:{uid:"fixture",email:"fixture@example.test",displayName:"QA"},role:"user",ready:true,roleReady:true,roleIssue:"",db:null,items:[],policy:null,issue:"",catalogIssue:"",catalogReady:true};export const usePlatform=()=>state;export const PlatformProvider=({children})=>children;export function v8Auth(){throw Error("layout test only")}export function readBackup(){throw Error("layout test only")}';
const plugin={name:'elk-fullscreen-test',enforce:'pre',resolveId(id){if(/(?:^|\/)v8\/platform(?:\.tsx)?$/.test(id)||id==='./platform')return '\0elk-fullscreen-fixture';},load(id){if(id==='\0elk-fullscreen-fixture')return fixture;}};
const origin='http://127.0.0.1:4199',dir=await mkdtemp(join(tmpdir(),'elk-fullscreen-'));
let browser,server;
try {
 await build({plugins:[plugin],build:{outDir:dir,emptyOutDir:true},logLevel:'error'});
 server=await preview({configFile:false,build:{outDir:dir},preview:{host:'127.0.0.1',port:4199,strictPort:true}});
 browser=await chromium.launch({headless:true,executablePath:process.env.ELK_QA_CHROMIUM||undefined,args:['--no-sandbox','--disable-dev-shm-usage']});
 for(const c of [
   {dark:true,language:'id',native:true,width:360,height:740},
   {dark:false,language:'en',native:true,width:390,height:844},
   {dark:true,language:'en',native:false,width:412,height:840},
   {dark:false,language:'id',native:true,width:840,height:412}
 ]){
  const context=await browser.newContext({viewport:{width:c.width,height:c.height},isMobile:true,hasTouch:true,deviceScaleFactor:3,serviceWorkers:'block',userAgent:c.native?'Mozilla/5.0 (Linux; Android 16; SM-S948B) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/141.0.0.0 Mobile Safari/537.36 ElKimiyaAndroid/8.3 ElKimiyaRelease/8.5':undefined});
  let unblock;const waiting=new Promise(r=>unblock=r);
  await context.addInitScript(({dark,language})=>{localStorage.setItem('elk.dark',String(dark));localStorage.setItem('elk.language',language==='id'?'Bahasa Indonesia':'English')},c);
  await context.route('**/*',async r=>{const url=new URL(r.request().url());if(url.pathname==='/api/chemistry'){await waiting;return r.abort().catch(()=>{});}if(url.origin===origin)return r.continue();return r.abort();});
  try{
   const page=await context.newPage();let errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.goto(origin+'/#molecules',{waitUntil:'domcontentloaded'});
   const launch=page.locator('[data-elk-molecule-open="builder"]');await launch.waitFor();
   const client=await context.newCDPSession(page);await client.send('Emulation.setCPUThrottlingRate',{rate:6});
   if(!c.native)await page.evaluate(()=>{history.pushState=()=>{throw new DOMException('test history failure','SecurityError')}});
   await launch.scrollIntoViewIfNeeded();
   const initial=await page.evaluate(()=>({len:history.length,hash:location.hash}));
   const surface=page.locator('[data-elk-molecule-fullscreen="builder"]');
   for(let i=0;i<3;i++){
    const start=Date.now();await launch.tap({timeout:8000});await surface.waitFor({timeout:2500});
    const elapsed=Date.now()-start;
    const state=await surface.evaluate(x=>{const r=x.getBoundingClientRect(),back=x.querySelector('[data-elk-drawer-close]'),b=back.getBoundingClientRect(),hit=document.elementFromPoint(b.x+b.width/2,b.y+b.height/2);return {position:getComputedStyle(x).position,full:r.x<=2&&r.y<=2&&r.right>=innerWidth-2&&r.bottom>=innerHeight-2,click:!!hit&&back.contains(hit),inert:x.parentElement.querySelectorAll(':scope > [inert]').length,overflow:document.documentElement.style.overflow,hidden:getComputedStyle(x.parentElement.querySelector('.app-shell')).display==='none'}});
    assert.equal(state.position,'relative');assert(state.full&&state.click&&state.hidden&&!state.inert&&!state.overflow,JSON.stringify(state));
    if(i===0){await surface.getByRole('button',{name:c.language==='id'?'Etanol':'Ethanol',exact:true}).tap({timeout:5000});}
    assert.match(await surface.locator('.v61-submit > span').textContent(),/3 atom/,'Graph still responds and persists');
    // Android shell uses this close marker; no same-URL history mutation is necessary.
    await surface.locator('[data-elk-drawer-close]').tap({timeout:5000});
    await surface.waitFor({state:'hidden',timeout:2500});
    assert(await launch.isVisible(),'Page must return to interactive workspace');
    assert.equal(await page.evaluate(()=>document.documentElement.style.overflow),'');
    assert.equal(await page.evaluate(()=>location.hash),initial.hash);
    assert.equal(await page.evaluate(()=>history.length),initial.len);
    console.log('[PASS]',c.width+'x'+c.height,c.dark?'dark':'light',c.language,c.native?'Android UA':'history rejected','cycle',i+1,'opened in',elapsed,'ms');
   }
   assert.deepEqual(errors,[]);
  }finally{unblock();await context.close();}
 }
}finally{await browser?.close();if(server){server.httpServer.closeAllConnections?.();await new Promise(r=>server.httpServer.close(r))}await rm(dir,{recursive:true,force:true})}
