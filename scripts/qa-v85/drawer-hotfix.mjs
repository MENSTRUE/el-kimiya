// Isolated layout QA; actual App, both roles and real CSS. Fixture identity never
// reaches Firebase or touches a real account. This is NOT physical WebView QA.
import assert from 'node:assert/strict';
import {build,preview} from 'vite';
import {chromium} from 'playwright';
import {mkdtemp,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';

const fixture=`
const mod = new URLSearchParams(location.search).get('qaRole')==='moduler';
const state={user:{uid:mod?'fixture-moduler':'fixture-learner',email:'fixture@example.test',displayName:'QA Fixture'},role:mod?'moduler':'user',ready:true,roleReady:true,roleIssue:'',db:null,items:[],policy:null,issue:'',catalogIssue:'',catalogReady:true};
export const usePlatform=()=>state;
export const PlatformProvider=({children})=>children;
export function v8Auth(){throw Error('Layout test only');}
export function readBackup(){throw Error('Layout test only');}
`;
const plugin={name:'elk-drawer-layout-test',enforce:'pre',resolveId(id){if(/(?:^|\/)v8\/platform(?:\.tsx)?$/.test(id)||id==='./platform')return '\0elk-drawer-fixture';},load(id){if(id==='\0elk-drawer-fixture')return fixture;}};
const out=await mkdtemp(join(tmpdir(),'elk-drawer-'));
let server,browser;
let passed=0;
try{
 await build({plugins:[plugin],build:{outDir:out,emptyOutDir:true},logLevel:'error'});
 server=await preview({configFile:false,build:{outDir:out},preview:{host:'127.0.0.1',port:4191,strictPort:true}});
 browser=await chromium.launch({headless:true,executablePath:process.env.ELK_QA_CHROMIUM||undefined,args:['--no-sandbox','--disable-dev-shm-usage']});
 for(const role of ['learner','moduler'])for(const dark of [true,false])for(const language of ['id','en'])for(const size of [{width:360,height:740},{width:412,height:840},{width:840,height:412}]){
  const context=await browser.newContext({viewport:size,isMobile:true,hasTouch:true,deviceScaleFactor:2,serviceWorkers:'block',userAgent:'Mozilla/5.0 (Linux; Android 16; Samsung) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Mobile Safari/537.36 ElKimiyaAndroid/8.4'});
  await context.addInitScript(({dark,language})=>{localStorage.setItem('elk.dark',String(dark));localStorage.setItem('elk.language',language);},{dark,language});
  // Prevent accidental external calls (including Firebase and live inference).
  await context.route('**/*',r=>new URL(r.request().url()).origin==='http://127.0.0.1:4191'?r.continue():r.abort());
  const p=await context.newPage();
  const initial=role==='learner'?'hybrid':'moduler';
  await p.goto('http://127.0.0.1:4191/?qaRole='+role+'#'+initial);
  const toggle=p.locator('[data-elk-drawer-toggle]:visible');
  await toggle.waitFor({timeout:15000});
  await toggle.click();
  const drawer=p.locator('[data-elk-drawer-open="true"]');
  await drawer.waitFor();
  const geometry=await drawer.evaluate(e=>{
   const r=e.getBoundingClientRect();return {tag:e.tagName,x:r.x,y:r.y,width:r.width,height:r.height,viewport:innerHeight,viewportWidth:innerWidth,hit:e.contains(document.elementFromPoint(Math.min(r.right-10,100),Math.min(r.bottom-10,100))),focused:e.contains(document.activeElement),routes:e.querySelectorAll('[data-elk-route]').length};
  });
  assert.notEqual(geometry.tag,'DIALOG','Native dialog must no longer be involved in WebView drawer paint');
  assert(geometry.x<=2&&geometry.y<=2&&geometry.width>200&&geometry.width<geometry.viewportWidth&&geometry.height>=geometry.viewport-2&&geometry.hit&&geometry.focused,JSON.stringify(geometry));
  assert.equal(geometry.routes,role==='learner'?17:9);
  const close=drawer.locator('[data-elk-drawer-close]');
  await close.click();
  await drawer.waitFor({state:'hidden'});
  assert.equal(await toggle.getAttribute('aria-expanded'),'false');
  await toggle.click();await p.keyboard.press('Escape');await drawer.waitFor({state:'hidden'});
  await toggle.click();await p.mouse.click(size.width-5,Math.min(100,size.height-10));await drawer.waitFor({state:'hidden'});
  await toggle.click();
  const route=role==='learner'?'about':'profile';
  const target=drawer.locator('[data-elk-route="'+route+'"]');
  await target.scrollIntoViewIfNeeded();
  assert(await target.evaluate(e=>{const r=e.getBoundingClientRect();const h=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return !!h&&e.contains(h)}),'Last route must be visually clickable inside scroll panel');
  await target.click();await drawer.waitFor({state:'hidden'});
  await p.waitForFunction(({role,route})=>role==='learner'?document.querySelector('[data-elk-ai-v83=learner]')?.dataset.elkPage===route:document.querySelector('[data-elk-role=moduler]')?.dataset.elkSection===route,{role,route});
  assert.equal(await p.evaluate(()=>document.documentElement.style.overflow),'');
  // Reopen after selecting a route, then resize to desktop.
  await toggle.click();await p.setViewportSize({width:1200,height:760});
  await drawer.waitFor({state:'hidden'});
  assert.equal(await p.evaluate(()=>document.documentElement.style.overflow),'');
  passed++;
  console.log('[PASS]',role,dark?'dark':'light',language,size.width+'x'+size.height);
  await context.close();
 }
 console.log('[PASS] '+passed+' drawer layouts/actions; actual WebView still requires phone QA.');
}finally{await browser?.close();if(server){server.httpServer.closeAllConnections?.();await new Promise(resolve=>server.httpServer.close(resolve));}await rm(out,{recursive:true,force:true});}
