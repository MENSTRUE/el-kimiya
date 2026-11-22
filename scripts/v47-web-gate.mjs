#!/usr/bin/env node
/** Judge-readiness gate for static public Web assets and live backend. */
import { readFile, stat } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
const root=resolve(import.meta.dirname,'..');
const strict=process.argv.includes('--strict');
const live=process.argv.includes('--live');
const hostedArg=process.argv.find(x=>x.startsWith('--hosted='));
let fails=0,warns=0,passes=0;
const pass=m=>{passes++;console.log('[PASS]',m)};
const warn=m=>{warns++;console.log('[WARN]',m)};
const fail=m=>{fails++;console.log('[FAIL]',m)};
async function read(path){return await readFile(resolve(root,path),'utf8')}
async function has(path){try{await stat(resolve(root,path));return true}catch{return false}}
const exp={topics:13,questions:65,flashcards:52};
async function staticQA(){
  let all=true;
  for(const lang of ['id','en']){
    const prefix=`public/data/learning/${lang}/`;
    for(const [name,key,expected] of [['catalog.json','topics',13],['questions.json','questions',65],['flashcards.json','cards',52]]){
      const filename=prefix+name;
      if(!(await has(filename))){warn(`${filename} missing`);all=false;continue}
      try{
        const content=await read(filename);const data=JSON.parse(content),rows=data[key];
        if(!Array.isArray(rows)||rows.length!==expected)throw new Error(`${key}: ${rows?.length} not ${expected}`);
        if(key==='questions'&&/"(correct_choice_id|is_correct|correct_answer|answer_key|solution|explanation)"\s*:/.test(content))throw new Error('quiz answer leakage');
        if(new Set(rows.map(x=>x.id)).size!==expected)throw new Error('duplicate IDs');
        pass(`${lang}/${name}: ${expected} entries validated`);
      }catch(e){fail(`${filename}: ${e.message}`)}
    }
  }
  if(all && await has('public/data/learning/provenance.json'))pass('Public content provenance present');
  else warn('Public learning export incomplete; Firebase Hosting is NOT submission-ready');
  if(!(await has('public/data/molecules/samples.json')))warn('Public molecular samples not exported');
  else try{const d=JSON.parse(await read('public/data/molecules/samples.json'));if(Array.isArray(d.examples)&&d.examples.length>=3)pass(`${d.examples.length} molecular samples ready`);else fail('Molecule samples malformed')}catch(e){fail(e.message)}
  return all;
}
console.log('EL-KIMIYA V4.7 — WEB RELEASE GATES');
for(const p of ['src/lib/learningSourceV47.ts','src/components/PublicMoleculesV47.tsx','src/public-web-v47.css','src/components/StudyExperienceV44.tsx','src/components/MolecularIntelligenceLab.tsx','src/components/HybridCoachV46.tsx','src/lib/hybrid.ts','LICENSE']){
  if(await has(p))pass(p);else fail(`Missing ${p}`);
}
try{
  const study=await read('src/components/StudyExperienceV44.tsx');
  if(study.includes('readLearningV47(path, signal)'))pass('Study bank uses safe local/hosted transport');else fail('V4.4 study bank not wired to V4.7');
  const lab=await read('src/components/MolecularIntelligenceLab.tsx');
  if(lab.includes('PublicMoleculesV47') && lab.includes('backendAvailableHere()'))pass('Public molecule lab fallback integrated');else fail('Public molecule fallback not integrated');
  const vite=await read('vite.config.ts');
  if(/\b__dirname\b/.test(vite))warn('Vite has legacy __dirname and may issue warnings');else pass('Vite native loader dirname compatibility');
  const hybrid=await read('src/lib/hybrid.ts');
  if(hybrid.includes('response.inferenceSource')&&hybrid.includes('getGenerativeModel('))pass('Firebase AI Logic runtime path remains present');else fail('Firebase hybrid runtime path missing');
}catch(e){fail(e.message)}
const exported=await staticQA();
if(strict&&!exported)fail('Strict mode: public learning data missing');
if(live){
  try{
    const controller=AbortSignal.timeout(5000);
    const r=await fetch('http://127.0.0.1:8000/api/v1/learning/health',{signal:controller});
    if(!r.ok)throw new Error(`HTTP ${r.status}`);
    const d=await r.json();for(const k of Object.keys(exp))if(d[k]!==exp[k])throw new Error(`${k} count ${d[k]}`);
    pass('Local V4.3 backend live and dataset counts correct');
  }catch(e){fail(`FastAPI not reachable: ${e.message}`)}
}
if(hostedArg){
  try{
    const base=new URL(hostedArg.slice('--hosted='.length));
    if(!['https:','http:'].includes(base.protocol))throw new Error('Invalid scheme');
    for(const f of ['data/learning/id/catalog.json','data/learning/en/flashcards.json','data/molecules/samples.json']){
      const u=new URL(f,base.toString().replace(/\/?$/,'/'));
      const r=await fetch(u,{signal:AbortSignal.timeout(12000)});
      if(!r.ok)throw new Error(`${u} HTTP ${r.status}`);
      const content=await r.json();if(!content)throw new Error(`${u} empty`);
      pass(`Hosted ${f}`);
    }
  }catch(e){fail(`Hosted smoke check: ${e.message}`)}
}
console.log(`\nRESULT: ${passes} PASS / ${warns} WARN / ${fails} FAIL`);
console.log('NOT COVERED: Chrome on-device model, App Check attestation, live Firebase cloud and actual UI clicks.');
console.log('These must be tested in the browser and demonstrated with real SDK inference-source evidence.');
if(fails)process.exitCode=1;
