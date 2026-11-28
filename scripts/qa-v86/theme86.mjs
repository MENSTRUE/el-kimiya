// Fixture-only computed theme check; no real credentials, writes, or network.
// Run: node scripts/qa-v86/theme86.mjs (124 layouts, Indonesian).
// ELK_THEME_LANGUAGE=en repeats all layouts in English; ELK_THEME_ROLE limits one role.
// Real rendered text on solid backgrounds throughout the page, not every possible UI state.
// Playwright Chromium required (npx playwright install chromium); optional ELK_QA_CHROMIUM path.
import {build,preview} from 'vite';
import {chromium} from 'playwright';
import {mkdtemp,rm,writeFile,mkdir} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,dirname,resolve} from 'node:path';
import {LEARNER_ROUTES,MODULER_ROUTES} from '../qa-v85/visual-core-v85.mjs';
const fixture=`
const role=new URLSearchParams(location.search).get('qaRole');
const guest=role==='guest', mod=role==='moduler';
const state={user:guest?null:{uid:mod?'fixture-moduler':'fixture-learner',email:'fixture@example.test',displayName:'QA Fixture'},role:guest?'guest':mod?'moduler':'user',ready:true,roleReady:true,roleIssue:'',db:null,items:[],policy:null,issue:'',catalogIssue:'',catalogReady:true};
export const usePlatform=()=>state;
export const PlatformProvider=({children})=>children;
export function v8Auth(){throw Error('Layout test only');}
export function readBackup(){throw Error('Layout test only');}
`;
const plugin={name:'elk-theme-test',enforce:'pre',resolveId(id){if(/(?:^|\/)v8\/platform(?:\.tsx)?$/.test(id)||id==='./platform')return '\0elk-theme-fixture';},load(id){if(id==='\0elk-theme-fixture')return fixture;}};
const out=await mkdtemp(join(tmpdir(),'elk-theme86-'));
const origin='http://127.0.0.1:4197';
const reportPath=resolve(process.env.ELK_THEME_REPORT||'reports/theme86-fixture.json');
const language=process.env.ELK_THEME_LANGUAGE||'id';
if(!['id','en'].includes(language))throw new Error('ELK_THEME_LANGUAGE must be id or en');
const roles=process.env.ELK_THEME_ROLE?[process.env.ELK_THEME_ROLE]:['learner','moduler','guest'];
if(roles.some(r=>!['learner','moduler','guest'].includes(r)))throw new Error('Invalid ELK_THEME_ROLE');
let server,browser;
const reports=[];
function audit(){
 const rgb=v=>{const n=v.match(/[\d.]+/g)?.map(Number);return /^rgba?\(/.test(v)&&n?.length>=3?[...n.slice(0,3),n[3]??1]:null;};
 const over=(f,b)=>[0,1,2].map(i=>f[i]*f[3]+b[i]*(1-f[3]));
 const lum=c=>c.slice(0,3).map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((s,v,i)=>s+v*[.2126,.7152,.0722][i],0);
 const ratio=(a,b)=>(Math.max(lum(a),lum(b))+.05)/(Math.min(lum(a),lum(b))+.05);
 const selector='button,a,input:not([type=hidden]),textarea,select,label,h1,h2,h3,h4,h5,p,li,small,span,strong,b,summary,div,dt,dd';
 let contrast=0,skipped=0;
 const failures=[];
 for(const e of document.querySelectorAll(selector)){
  if(e.closest('[aria-hidden="true"],[inert],button:disabled,[aria-disabled="true"]'))continue;
  const s=getComputedStyle(e),r=e.getBoundingClientRect();
  if(r.width<1||r.height<1||s.display==='none'||s.visibility!=='visible'||+s.opacity<.95)continue;
  if(!(e.matches('input,textarea,select')||[...e.childNodes].some(n=>n.nodeType===3&&n.textContent.trim())))continue;
  let stack=[],invalid=false;
  for(let a=e;a;a=a.parentElement){const st=getComputedStyle(a);if(st.backgroundImage!=='none'||+st.opacity<.95||st.mixBlendMode!=='normal'){invalid=true;break;}const fill=rgb(st.backgroundColor);if(fill?.[3]>0){stack.push(fill);if(fill[3]===1)break;}}
  const fg=rgb(s.color);
  if(invalid||!fg||!stack.length||stack.at(-1)[3]!==1){skipped++;continue;}
  let bg=stack.pop().slice(0,3);while(stack.length)bg=over(stack.pop(),bg);
  const cr=ratio(over(fg,bg),bg),size=parseFloat(s.fontSize),weight=parseInt(s.fontWeight),required=size>=24||size>=18.66&&weight>=700?3:4.5;
  contrast++;
  if(cr+.02<required){const key=n=>n.tagName.toLowerCase()+[...n.classList].map(c=>'.'+c).join('');const selector=[e.parentElement,e].filter(Boolean).map(key).join(' > ');failures.push({selector,ratio:+cr.toFixed(2),required,foreground:s.color,background:bg.map(Math.round)});}
 }
 return {contrast,skipped,failures,overflow:Math.max(0,document.documentElement.scrollWidth-innerWidth,document.body.scrollWidth-innerWidth)};
}
try{
 await build({plugins:[plugin],build:{outDir:out,emptyOutDir:true},logLevel:'error'});
 server=await preview({configFile:false,build:{outDir:out},preview:{host:'127.0.0.1',port:4197,strictPort:true}});
 browser=await chromium.launch({headless:true,executablePath:process.env.ELK_QA_CHROMIUM||undefined,args:['--no-sandbox','--disable-dev-shm-usage']});
 for(const role of roles)for(const dark of [true,false])for(const viewport of [{width:390,height:844},{width:1440,height:900}]){
  const ctx=await browser.newContext({viewport,serviceWorkers:'block',isMobile:viewport.width<=900,hasTouch:viewport.width<=900,deviceScaleFactor:1});
  await ctx.addInitScript(({dark,language})=>{localStorage.setItem('elk.dark',String(dark));localStorage.setItem('elk.language',language);},{dark,language});
  await ctx.route('**/*',r=>new URL(r.request().url()).origin===origin?r.continue():r.abort());
  const p=await ctx.newPage();
  try {
  const routes=role==='learner'?LEARNER_ROUTES:role==='moduler'?MODULER_ROUTES:['landing','guest','account','register','reset'];
  for(let i=0;i<routes.length;i++){
   const route=routes[i];
   if(i===0||role==='guest')await p.goto(origin+'/?qaRole='+role+'#'+(role==='moduler'?'moduler':route),{waitUntil:'domcontentloaded'});
   else if(role==='moduler'){if(viewport.width<=900)await p.locator('[data-elk-drawer-toggle]:visible').click();await p.locator('[data-elk-route="'+route+'"]:visible').click();}
   else await p.evaluate(route=>{location.hash=route;},route);
   try{await p.waitForFunction(({route,role})=>role==='moduler'?document.querySelector('[data-elk-role=moduler]')?.dataset.elkSection===route:document.querySelector('.app')?.dataset.elkPage===route,{route,role},{timeout:10000});}
   catch{reports.push({role,dark,language,viewport,route,blocked:'ROUTE_NOT_OBSERVED'});continue;}
   await p.waitForTimeout(150);
   if(await p.evaluate(()=>document.documentElement.lang)!==language){const control=p.locator('[data-elk-language="'+language+'"]:visible').first();if(await control.count())await control.click();}
   const mode=await p.evaluate(()=>({language:document.documentElement.lang,dark:document.querySelector('.app')?.classList.contains('dark')}));
   if(mode.language!==language||mode.dark!==dark){reports.push({role,dark,language,viewport,route,blocked:'WRONG_LANGUAGE_OR_THEME'});continue;}
   const result=await p.evaluate(audit);
   reports.push({role,dark,language,viewport,route,...result});
   if(result.failures.length||result.overflow>2){console.log(role,dark?'dark':'light',viewport.width,route,result.failures.length,'failures','overflow',result.overflow);console.log([...new Set(result.failures.map(f=>f.selector+' '+f.ratio+' '+f.foreground+' vs '+f.background.join(',')))].join('\n'));}
  }}finally{await ctx.close();}
 }
 await mkdir(dirname(reportPath),{recursive:true});
 await writeFile(reportPath,JSON.stringify(reports,null,2));
 const failures=reports.reduce((n,r)=>n+(r.failures?.length||0),0),overflow=reports.filter(r=>r.overflow>2).length,blocked=reports.filter(r=>r.blocked).length;
 console.log({layouts:reports.length,language,failures,overflow,blocked,reportPath});
 if(failures||overflow||blocked)process.exitCode=1;
}finally{await browser?.close();if(server){server.httpServer.closeAllConnections?.();await new Promise(resolve=>server.httpServer.close(resolve));}await rm(out,{recursive:true,force:true});}
