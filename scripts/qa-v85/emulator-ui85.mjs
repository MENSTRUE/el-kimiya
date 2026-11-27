// Test server only: isolated Auth and Firestore emulator; never run against production.
import assert from 'node:assert/strict';
import {build,preview} from 'vite';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {chromium} from 'playwright';
import {inspectPage,auditPage,LEARNER_ROUTES,MODULER_ROUTES} from './visual-core-v85.mjs';
import {mkdir,writeFile,mkdtemp,rm} from 'node:fs/promises';
const auth=process.env.FIREBASE_AUTH_EMULATOR_HOST, fire=process.env.FIRESTORE_EMULATOR_HOST;
if(!/^127\.0\.0\.1:\d+$/.test(auth||'')||!/^127\.0\.0\.1:\d+$/.test(fire||''))throw Error('Loopback Auth and Firestore emulators required');
const project='demo-elkimiya-v80', [host,port]=fire.split(':');
const tag='qa'+Date.now(), pass='emulator-only-password-85';
async function seed(role){
 const email=role+'-'+tag+'@example.test';
 const r=await fetch('http://'+auth+'/identitytoolkit.googleapis.com/v1/accounts:signUp?key=demo-key',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,password:pass,returnSecureToken:true})});
 assert(r.ok,'emulator signup');const {localId}=await r.json();
 if(role==='moduler'){
 const s=await fetch('http://'+fire+'/v1/projects/'+project+'/databases/(default)/documents/v8Roles/'+localId,{method:'PATCH',headers:{'Content-Type':'application/json',Authorization:'Bearer owner'},body:JSON.stringify({fields:{role:{stringValue:'moduler'}}})});assert(s.ok,'seed role');
 }
 return email;
}
const envModule=`
import {initializeApp} from 'firebase/app';
import {getAuth,connectAuthEmulator} from 'firebase/auth';
import {getFirestore,connectFirestoreEmulator} from 'firebase/firestore';
const app=initializeApp({projectId:${JSON.stringify(project)},apiKey:'demo-key',appId:'1:123:web:demo',authDomain:'localhost'});
connectAuthEmulator(getAuth(app),${JSON.stringify('http://'+auth)},{disableWarnings:true});
connectFirestoreEmulator(getFirestore(app),${JSON.stringify(host)},${Number(port)});
export const firebaseConfigured=true;
export function setupAppCheck(){return app;}
export async function runHybridInference(){throw Error('QA emulator: no live AI inference');}
`;
const plugin={name:'elk-qa85-emulator',enforce:'pre',resolveId(id){if(/(?:^|\/)lib\/hybrid(?:\.ts)?$/.test(id)||id==='./hybrid')return '\0elk-qa85-hybrid';},load(id){if(id==='\0elk-qa85-hybrid')return envModule;}};
// A dedicated production-mode QA build avoids the Vite development scanner,
 // hot reloads, private browser profiles, and serving private local book files.
const qaDir=await mkdtemp(join(tmpdir(),'elkimiya-qa85-'));
let server;
const origin='http://127.0.0.1:4185';
let browser;
const results=[];
try{
 await build({plugins:[plugin],build:{outDir:qaDir,emptyOutDir:true},logLevel:'warn'});
 server=await preview({configFile:false,build:{outDir:qaDir},preview:{host:'127.0.0.1',port:4185,strictPort:true}});
 console.log('[PASS] Isolated QA static build (no dependency scanner or HMR)');
 browser=await chromium.launch({headless:true,executablePath:process.env.ELK_QA_CHROMIUM||undefined,args:['--no-sandbox','--disable-dev-shm-usage','--disable-gpu']});
 async function login(role){
  const ctx=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block'});
  await ctx.addInitScript(()=>{if(!localStorage.getItem('elk.qa.seed')){localStorage.setItem('elk.dark','true');localStorage.setItem('elk.language','en');localStorage.setItem('elk.qa.seed','yes');}});
  const p=await ctx.newPage();p.on('dialog',d=>d.accept());
  p.on('pageerror',e=>console.error('[PAGE ERROR]',e.message));
  await p.goto(origin+'/#account',{waitUntil:'domcontentloaded',timeout:60000});
  await p.locator('.v81-auth input[type=email]').waitFor({state:'visible',timeout:60000});
  await p.locator('.v81-auth input[type=email]').fill(await seed(role));
  await p.locator('.v81-auth input[type=password]').fill(pass);
  await p.locator('.v81-submit').click();
  await p.locator('[data-elk-ui-v85="ready"]').waitFor({timeout:40000});
  assert.equal((await p.evaluate(inspectPage)).role,role);return p;
 }
 const mod=await login('moduler'), learner=await login('learner');
 async function nav(p,route){
  const state=await p.evaluate(inspectPage);
  if(state.route===route)return;
  if(state.width<=900){await p.locator('[data-elk-drawer-toggle]').click();await p.locator('[data-elk-drawer-open="true"] [data-elk-route="'+route+'"]').click();}
  else await p.locator('[data-elk-route="'+route+'"]:visible').first().click();
  await p.waitForFunction(r=>document.querySelector('[data-elk-role="moduler"]')?.dataset.elkSection===r||document.querySelector('[data-elk-ai-v83="learner"]')?.dataset.elkPage===r,route);
 }
 const mapping={lesson:'library',reference:'library',question:'practice',flashcard:'flashcards',molecule:'molecules'};
 for(const kind of Object.keys(mapping)){
  await nav(mod,kind);
  await mod.locator('[data-elk-catalog-state="ready"]').first().waitFor();
  const ed=mod.locator('[data-elk-editor]');
  const fields=ed.locator('textarea'), title=tag+' '+kind;
  for(let i=0;i<await fields.count();i++)await fields.nth(i).fill(i<2?title:i<4?'Safe emulator test content '+tag:i<6?'Correct answer':'Incorrect answer');
  await ed.locator('input').fill('https://example.test/qa');
  await ed.getByRole('button',{name:'Save draft',exact:true}).click();
  await mod.locator('.v85-entry-list').getByText(title,{exact:true}).waitFor();
  await nav(learner,mapping[kind]);
  assert.equal(await learner.getByText(title,{exact:true}).count(),0,'draft invisible');
  await ed.getByRole('button',{name:'Publish',exact:true}).click();
  await learner.getByText(title,{exact:true}).waitFor({timeout:20000});
  await fields.nth(0).fill(title+' updated');await fields.nth(1).fill(title+' updated');
  await ed.getByRole('button',{name:'Update publication',exact:true}).click();
  await learner.getByText(title+' updated',{exact:true}).waitFor({timeout:20000});
  await ed.getByRole('button',{name:'Move to draft',exact:true}).click();
  await learner.getByText(title+' updated',{exact:true}).waitFor({state:'detached',timeout:20000});
  await ed.getByRole('button',{name:'Delete',exact:true}).click();
  await mod.locator('.v85-entry-list').getByText(title+' updated',{exact:true}).waitFor({state:'detached'});
  console.log('[PASS] Real SDK UI draft/publish/read/update/unpublish/delete:',kind);
 }
 await nav(mod,'ai');await mod.locator('[data-elk-catalog-state="ready"]').first().waitFor();
 const guide=mod.locator('[data-elk-editor] textarea');
 await guide.nth(0).fill('Panduan uji lokal');await guide.nth(1).fill('Local QA guidance');
 await mod.getByRole('button',{name:'Save tutor guidance',exact:true}).click();
 await mod.getByText('Tutor guidance saved.',{exact:false}).waitFor({timeout:10000});
 console.log('[PASS] AI guidance form submitted to emulator');
 const routeGroups=process.argv.includes('--explorer-only')?[['learner',learner,['explorer']]]:[['learner',learner,LEARNER_ROUTES],['moduler',mod,MODULER_ROUTES]];
 for(const [role,p,routes] of routeGroups){
   for(const viewport of [{width:390,height:844},{width:1440,height:900}]){
    await p.setViewportSize(viewport);
    for(const theme of ['dark','light'])for(const language of ['en','id']){
      if((await p.evaluate(inspectPage)).theme!==theme)await p.locator('[data-elk-theme-toggle]').first().click();
      await p.locator('[data-elk-language="'+language+'"]:visible').first().click();
      for(const route of routes){
        await nav(p,route);
        await p.waitForTimeout(120);
        const state=await p.evaluate(inspectPage), audit=await p.evaluate(auditPage);
        assert.equal(state.role,role);assert.equal(state.route,route);assert.equal(state.bottomNav,false);assert.equal(state.theme,theme);assert.equal(state.language,language);
        results.push({role,width:viewport.width,theme,language,route,overflow:audit.overflow,contrastFailures:audit.contrastFailures,contrastDetails:audit.contrastDetails});
      }
    }
   }
 }
 await mkdir('reports',{recursive:true});await writeFile('reports/emulator-ui85.json',JSON.stringify(results,null,2));
 console.log('[PASS] authenticated routes visited',results.length);
 const findings=results.filter(x=>x.overflow>2||x.contrastFailures>0);
 console.log('[INFO] contrast/overflow affected cases',findings.length);
 assert.equal(findings.length,0,'Visible text contrast or viewport overflow requires review; see reports/emulator-ui85.json');
}finally{
 await browser?.close();
 if(server){server.httpServer.closeAllConnections?.();await new Promise(resolve=>server.httpServer.close(resolve));}
 await rm(qaDir,{recursive:true,force:true});
}
