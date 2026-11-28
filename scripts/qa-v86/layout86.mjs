// Production component layout audit with a test-only identity boundary.
// It never writes Firebase, tests real network AI, or collects real account data.
import {build,preview} from 'vite';
import {chromium} from 'playwright';
import {mkdtemp,rm,mkdir,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {LEARNER_ROUTES,MODULER_ROUTES,inspectPage} from '../qa-v85/visual-core-v85.mjs';
const args=new Set(process.argv.slice(2));
const baseline=args.has('--baseline');
const outdir=process.env.ELK_QA_REPORT||'reports/layout-v86';
const fixture=`
const r=new URLSearchParams(location.search).get('qaRole');
const user=r==='guest'?null:{uid:r==='moduler'?'fixture-moduler':'fixture-learner',email:'fixture@example.test',displayName:'QA Fixture'};
const state={user,role:r==='moduler'?'moduler':r==='guest'?'guest':'user',ready:true,roleReady:true,roleIssue:'',db:null,items:[],policy:null,issue:'',catalogIssue:'',catalogReady:true};
export const usePlatform=()=>state;
export const PlatformProvider=({children})=>children;
export function v8Auth(){throw Error('Layout test only');}
export function readBackup(){throw Error('Layout test only');}
`;
const plugin={name:'elk-layout86-test',enforce:'pre',resolveId(id){if(/(?:^|\/)v8\/platform(?:\.tsx)?$/.test(id)||id==='./platform')return '\0elk-layout86-fixture';},load(id){if(id==='\0elk-layout86-fixture')return fixture;}};
const origin='http://127.0.0.1:4196';
const dir=await mkdtemp(join(tmpdir(),'elk-layout86-'));
let server,browser;
const results=[];
function inspectAllText(){
 const rgb=v=>{const m=v.match(/[\d.]+/g)?.map(Number);return /^rgba?\(/.test(v)&&m?.length>=3?[...m.slice(0,3),m[3]??1]:null};
 const over=(a,b)=>[0,1,2].map(i=>a[i]*a[3]+b[i]*(1-a[3]));
 const luminance=c=>c.slice(0,3).map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((s,v,i)=>s+v*[.2126,.7152,.0722][i],0);
 const ratio=(a,b)=>{const x=luminance(a),y=luminance(b);return(Math.max(x,y)+.05)/(Math.min(x,y)+.05)};
 const elements=[...document.querySelectorAll('button,a,input:not([type=hidden]),textarea,select,label,h1,h2,h3,h4,h5,h6,p,li,small,span,strong,em,dt,dd,td,th,div')];
 const issues=[];let measured=0,skipped=0;
 for(const e of elements){
  if(e.closest('[aria-hidden="true"],[inert],[hidden],button:disabled,[aria-disabled="true"],[disabled]'))continue;
  if(!e.matches('input,textarea,select')&&![...e.childNodes].some(n=>n.nodeType===3&&n.textContent?.trim()))continue;
  const r=e.getBoundingClientRect(),style=getComputedStyle(e);
  if(!r.width||!r.height||style.display==='none'||style.visibility!=='visible'||+style.opacity===0||r.width<2||r.height<2)continue;
  let stack=[],invalid=false,color=rgb(style.color);
  if(!color)continue;
  // Skip non-solid/transition/transparent composition rather than falsely certify it.
  for(let a=e;a;a=a.parentElement){
   const c=getComputedStyle(a);
   if(c.visibility!=='visible'||c.display==='none'||c.backgroundImage!=='none'||+c.opacity<.95||c.mixBlendMode!=='normal'){invalid=true;break}
   const fill=rgb(c.backgroundColor);
   if(fill?.[3]>0){stack.push(fill);if(fill[3]===1)break}
  }
  if(invalid||!stack.length||stack.at(-1)[3]!==1){skipped++;continue}
  let bg=stack.pop().slice(0,3);while(stack.length)bg=over(stack.pop(),bg);
  let required=parseFloat(style.fontSize)>=24||parseFloat(style.fontSize)>=18.66&&parseInt(style.fontWeight)>=700?3:4.5;
  const cr=ratio(over(color,bg),bg);measured++;
  if(cr+0.02<required){
   const who=[e.tagName.toLowerCase(),String(e.className||'').slice(0,140),String(e.parentElement?.className||'').slice(0,140)];
   const key=who.join('|')+'|'+style.color+'|'+bg.map(Math.round).join(',');
   if(!issues.some(q=>q.key===key))issues.push({key,tag:who[0],class:who[1],parent:who[2],fg:style.color,bg:bg.map(Math.round),ratio:+cr.toFixed(2),required,text:e.textContent?.trim().slice(0,70)});
  }
 }
 const overflow=Math.max(0,document.documentElement.scrollWidth-innerWidth,document.body.scrollWidth-innerWidth);
 const overflows=overflow>2?[...document.querySelectorAll('main,section,article,div,form')].filter(e=>{const r=e.getBoundingClientRect();return r.width>0&&r.right>innerWidth+2&&!e.closest('[hidden],[aria-hidden=true]')}).slice(0,10).map(e=>({cls:String(e.className),width:Math.round(e.getBoundingClientRect().width),right:Math.round(e.getBoundingClientRect().right)})):[];
 return {measured,skipped,issues,overflow,overflows};
}
try{
 await build({plugins:[plugin],build:{outDir:dir,emptyOutDir:true},logLevel:'error'});
 server=await preview({configFile:false,build:{outDir:dir},preview:{host:'127.0.0.1',port:4196,strictPort:true}});
 browser=await chromium.launch({headless:true,executablePath:process.env.ELK_QA_CHROMIUM||undefined,args:['--no-sandbox','--disable-dev-shm-usage']});
 for(const role of ['learner','moduler','guest'])for(const width of [390,1440])for(const dark of [true,false])for(const language of ['id','en']){
  const viewport={width,height:width===390?844:900};
  const context=await browser.newContext({viewport,isMobile:width===390,hasTouch:width===390,deviceScaleFactor:1,serviceWorkers:'block',userAgent:width===390?'Mozilla/5.0 (Linux; Android 16; Samsung) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Mobile Safari/537.36 ElKimiyaAndroid/8.4':undefined});
  await context.addInitScript(({dark,language})=>{localStorage.setItem('elk.dark',String(dark));localStorage.setItem('elk.language',language==='en'?'English':'Bahasa Indonesia');},{dark,language});
  await context.route('**/*',r=>new URL(r.request().url()).origin===origin?r.continue():r.abort());
  const page=await context.newPage();
  const routes=role==='learner'?LEARNER_ROUTES:role==='moduler'?MODULER_ROUTES:['landing','guest','account','register','reset'];
  await page.goto(origin+'/?qaRole='+role+'#'+(role==='moduler'?'moduler':routes[0]));
  await page.locator(role==='guest'?'[data-elk-ui-v85="public"]':'[data-elk-ui-v85="ready"]').first().waitFor({timeout:15000});
  // Actual app's public, authenticated and moderator navigation controls remain intact.
  if(await page.evaluate(()=>document.documentElement.lang)!==language){
   const selector=page.locator('[data-elk-language="'+language+'"]:visible').first();
   if(await selector.count())await selector.click();
  }
  for(const route of routes){
   try {
    if(role==='moduler'){
     if(route!=='overview'){
      if(width===390){await page.locator('[data-elk-drawer-toggle]:visible').click();await page.locator('[data-elk-drawer-open="true"] [data-elk-route="'+route+'"]').click();}
      else await page.locator('aside [data-elk-route="'+route+'"]:visible').click();
     }
     await page.waitForFunction(r=>document.querySelector('.v81-moduler')?.dataset.elkSection===r,route);
    }else{
     await page.evaluate(r=>location.hash=r,route);
     await page.waitForFunction(({r})=>document.querySelector('[data-elk-ui-v85]')?.dataset.elkPage===r,{r:route});
    }
    await page.waitForTimeout(100);
    const state=await page.evaluate(inspectPage);
    const audit=await page.evaluate(inspectAllText);
    const error=state.theme!==(dark?'dark':'light')||state.language!==language||state.bottomNav||state.drawerVisible?'UNEXPECTED_APPEARANCE_STATE':undefined;
    results.push({role,width,theme:dark?'dark':'light',language,route,error,...audit});
   } catch(e){results.push({role,width,theme:dark?'dark':'light',language,route,error:String(e).slice(0,140)})}
  }
  console.log('[MATRIX]',role,width,dark?'dark':'light',language,routes.length);
  await context.close();
 }
}finally{
 await browser?.close();
 if(server){server.httpServer.closeAllConnections?.();await new Promise(r=>server.httpServer.close(r))}
 await rm(dir,{recursive:true,force:true});
 await mkdir(outdir,{recursive:true});
 await writeFile(join(outdir,'report.json'),JSON.stringify({scope:'Fixture accounts; actual page UI only. Text over solid surfaces measured. No real Firebase operations or AI inference.',results},null,2));
}
const fail=results.filter(r=>r.error||r.overflow>2||r.issues?.length||!r.measured);
console.log(JSON.stringify({expected:248,actual:results.length,pass:results.length-fail.length,fail:fail.length,contrastCount:results.reduce((s,r)=>s+(r.issues?.length||0),0),report:join(outdir,'report.json')}));
if(!baseline&&(fail.length||results.length!==248))process.exitCode=1;
