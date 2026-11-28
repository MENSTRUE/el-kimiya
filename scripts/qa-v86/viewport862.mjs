// Actual learner shell and molecular components. Fixture identity/chemistry;
// zero stylesheet height deliberately simulates the observed WebView collapse.
// This checks UI behavior, not Firebase, live RDKit or native Android.
import {build,preview} from 'vite';
import {chromium} from 'playwright';
import {clickVisible} from '../qa-v85/visual-core-v85.mjs';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
const fixture='const state={user:{uid:"fixture",email:"fixture@example.test",displayName:"QA"},role:"user",ready:true,roleReady:true,roleIssue:"",db:null,items:[],policy:null,issue:"",catalogIssue:"",catalogReady:true};export const usePlatform=()=>state;export const PlatformProvider=({children})=>children;export function v8Auth(){throw Error("layout test only")}export function readBackup(){throw Error("layout test only")}';
const plugin={name:'elk-viewport-test',enforce:'pre',resolveId(id){if(/(?:^|\/)v8\/platform(?:\.tsx)?$/.test(id)||id==='./platform')return '\0elk-viewport-fixture';},load(id){if(id==='\0elk-viewport-fixture')return fixture;}};
const descriptor={canonical_smiles_rdkit:'CCO',molecular_formula_rdkit:'C2H6O',molecular_weight_rdkit:46,logp_rdkit:0,tpsa_rdkit:20,h_bond_donors_rdkit:1,h_bond_acceptors_rdkit:1,rotatable_bonds_rdkit:0,atom_count_rdkit:3,svg_2d:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 100"><path d="M20 60L90 20L160 60" fill="none" stroke="black"/></svg>',descriptor_source:'fixture'};
const geometry={atoms:[{element:'C',xyz:[-1,0,0]},{element:'C',xyz:[0,0,0]},{element:'O',xyz:[1,1,0]}],bonds:[{a:0,b:1,order:1},{a:1,b:2,order:1}],method:'fixture'};
const origin='http://127.0.0.1:4197',dir=await mkdtemp(join(tmpdir(),'elk-viewport-'));
let browser,server;
const results=[];
function inspect(kind){
 const root=document.querySelector('[data-elk-molecule-fullscreen="'+kind+'"]');
 const canvas=root?.querySelector(kind==='builder'?'.v61-drop-zone svg':'canvas');
 if(!root||!canvas)return null;
 const r=root.getBoundingClientRect(),b=canvas.getBoundingClientRect(),hit=document.elementFromPoint(Math.round(b.x+b.width/2),Math.round(b.y+b.height/2));
 let colorCount=null;
 if(kind==='viewer'&&canvas.width&&canvas.height){const d=canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height).data;const colors=new Set();for(let i=0;i<d.length;i+=Math.max(4,4*Math.floor(d.length/4/20000)))colors.add(d[i]+256*d[i+1]+65536*d[i+2]);colorCount=colors.size;}
 return {panel:[r.x,r.y,r.width,r.height],canvas:[b.x,b.y,b.width,b.height],viewport:[innerWidth,innerHeight],full:r.left<=3&&r.top<=3&&r.right>=innerWidth-3&&r.bottom>=innerHeight-3&&r.height>0,hit:!!hit&&canvas.contains(hit),colorCount,position:getComputedStyle(root).position};
}
try{
 await build({plugins:[plugin],build:{outDir:dir,emptyOutDir:true},logLevel:'error'});
 server=await preview({configFile:false,build:{outDir:dir},preview:{host:'127.0.0.1',port:4197,strictPort:true}});
 browser=await chromium.launch({headless:true,executablePath:process.env.ELK_QA_CHROMIUM||undefined,args:['--no-sandbox','--disable-dev-shm-usage']});
 for(const dark of [true,false])for(const language of ['id','en'])for(const collapse of [true,false]){
  const context=await browser.newContext({viewport:{width:384,height:744},isMobile:true,hasTouch:true,deviceScaleFactor:3,serviceWorkers:'block',userAgent:'Mozilla/5.0 (Linux; Android 16; SM-S948B) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/141.0.0.0 Mobile Safari/537.36 ElKimiyaAndroid/8.3 ElKimiyaRelease/8.6'});
  await context.addInitScript(({dark,language})=>{localStorage.setItem('elk.dark',String(dark));localStorage.setItem('elk.language',language==='id'?'Bahasa Indonesia':'English')},{dark,language});
  await context.route('**/*',r=>{const u=new URL(r.request().url());if(u.pathname==='/api/chemistry')return r.fulfill({json:{...descriptor,molecule_3d:r.request().postDataJSON().include_3d?geometry:null},headers:{'Access-Control-Allow-Origin':'*'}});return u.origin===origin?r.continue():r.abort();});
  try{
   const p=await context.newPage();
   await p.goto(origin+'/#molecules',{waitUntil:'domcontentloaded'});
   const launch=p.locator('[data-elk-molecule-open="builder"]');await launch.waitFor();
   if(collapse)await p.addStyleTag({content:'.app .molecule86-fullscreen{height:0px;min-height:0px}'});
   for(const kind of ['builder','viewer']){
    if(kind==='viewer'){await p.locator('.v60-tabs button:nth-child(2)').click();await p.locator('[data-elk-molecule-open="viewer"]').waitFor({timeout:7000});}
    assert(await p.evaluate(clickVisible,{origin,role:'learner',selector:'[data-elk-molecule-open="'+kind+'"]',scroll:true}),'launch');
    const surface=p.locator('[data-elk-molecule-fullscreen="'+kind+'"]');await surface.waitFor({state:'attached'});
    await p.waitForTimeout(280);
    const before=await p.evaluate(inspect,kind);
    const pass=before?.full&&before.hit&&before.position==='relative'&&before.canvas[2]>=384*.7&&before.canvas[3]>=170&&(kind==='builder'||before.colorCount>12);
    console.log(pass?'[PASS]':'[FAIL]',dark?'dark':'light',language,collapse?'collapsed-CSS':'normal-CSS',kind,JSON.stringify(before));
    results.push(!!pass);
    if(pass){
      // Rotate the page while the editor remains mounted; native app has configChanges.
      await p.setViewportSize({width:744,height:384});
      await p.waitForTimeout(150);
      const rotated=await p.evaluate(inspect,kind);
      assert(rotated?.full,'resize must not leave stale panel dimensions');
      await p.setViewportSize({width:384,height:744});
      await p.waitForTimeout(150);
    }
    // Use the same close action native Back targets. No real device claim.
    await p.evaluate(k=>document.querySelector('[data-elk-molecule-fullscreen="'+k+'"] [data-elk-drawer-close]').click(),kind);
    await surface.waitFor({state:'detached'});
    assert.equal(await p.evaluate(()=>location.hash),'#molecules');
   }
  }finally{await context.close();}
 }
}finally{await browser?.close();if(server){server.httpServer.closeAllConnections?.();await new Promise(r=>server.httpServer.close(r))}await rm(dir,{recursive:true,force:true});}
const passed=results.filter(Boolean).length;console.log(JSON.stringify({expected:16,actual:results.length,pass:passed,fail:results.length-passed}));
assert.equal(passed,16);
