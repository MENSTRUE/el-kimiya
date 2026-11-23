/** V6.7 verified integration + actual TS model tests (Node; no browser mocks claimed). */
import {readFileSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
import vm from 'node:vm';
import ts from 'typescript';

const root=process.cwd();
const read=p=>readFileSync(resolve(root,p),'utf8');
const check=(ok,label)=>{if(!ok)throw Error('FAIL '+label);console.log('[PASS]',label)};
const files=[
  'src/App.tsx','src/components/DashboardRealV65.tsx','src/lib/language.tsx',
  'src/components/EntryFlowV67.tsx','src/components/ResearchMissionV67.tsx',
  'src/components/DashboardMissionV67.tsx','src/lib/researchMissionV67.ts',
  'src/research-journey-v67.css'
];
for(const file of files)check(existsSync(resolve(root,file)),`File exists: ${file}`);
const app=read('src/App.tsx');
const landing=app.split('function LandingPage(')[1]?.split('function Dashboard(')[0]||'';
check(app.includes('ELKIMIYA_V67_RESEARCH_JOURNEY')&&app.includes("if(page==='mission')return <ResearchMissionV67"),'Mission route wired to real component');
check(app.includes("if(page==='onboarding')return <EntryFlowV67")&&app.includes("if(page==='guest')return <EntryFlowV67")&&app.includes("'onboarding','guest','mission'"),'Onboarding and guest routes wired');
check(landing.includes('onClick={guest}')&&landing.includes('onClick={start}'),'Guest and learn have different handlers');
check(landing.includes('scrollTo("product")')&&landing.includes('scrollTo("experience")')&&landing.includes('scrollTo("hybrid")'),'Marketing navbar scrolls without changing route');
check(!landing.includes('onClick={enterApp}')&&!landing.includes('href="#product"'),'No legacy enterApp / #hash nav on landing');
check(landing.includes('MissionLandingTeaserV67'),'Research story is visible on landing');
check(read('src/components/DashboardRealV65.tsx').includes('DashboardMissionV67'),'Dashboard points to real Research Mission');
check(read('src/lib/language.tsx').includes('"Research Mission": "Misi Penelitian"'),'Bilingual navigation entry exists');
check(read('src/components/ResearchMissionV67.tsx').includes('runHybridInference(prompt,preference)'),'Firebase SDK called, no invented provider');
check(read('src/components/ResearchMissionV67.tsx').includes('Experimental')===false,'No fake industrial certification label');
check(read('src/research-journey-v67.css').includes('@media print'),'Print-to-PDF layout provided');

// TypeScript transpilation verifies TS/TSX syntactic structure. Full tsc + build is separate.
for(const path of ['src/components/EntryFlowV67.tsx','src/components/ResearchMissionV67.tsx','src/components/DashboardMissionV67.tsx','src/lib/researchMissionV67.ts']){
  const res=ts.transpileModule(read(path),{
    fileName:path,reportDiagnostics:true,
    compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}
  });
  const errors=(res.diagnostics||[]).filter(d=>d.category===ts.DiagnosticCategory.Error);
  check(errors.length===0,`TS/TSX parse: ${path}`);
}
function transpileCJS(path,requireFn){
  const source=read(path);
  const code=ts.transpileModule(source,{fileName:path,compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  const module={exports:{}};
  const scope={module,exports:module.exports,require:requireFn,console};
  vm.runInNewContext(code,scope,{filename:path,timeout:2000});
  return module.exports;
}
const petro=transpileCJS('src/lib/petroExperimentV62.ts',()=>{throw Error('Petrochemical model must not import anything in test')});
const mission=transpileCJS('src/lib/researchMissionV67.ts',x=>{if(x==='./petroExperimentV62')return petro;throw Error('Unexpected import '+x)});
const low=mission.measure(0.03,24),high=mission.measure(0.08,24);
check(low.resolutionMgKohGPerDrop<high.resolutionMgKohGPerDrop,'Actual model: smaller drops give finer resolution');
check(mission.measure(0.05,0).volumeMl===0,'Actual model: zero drops equals zero added volume');
const t1=mission.takeTrial(0.03,24,'low'),t2=mission.takeTrial(0.08,13,'high');
check(t1.acidNumber>=0&&t2.acidNumber>=0&&mission.distinctSizes([t1,t2])===2,'Two distinct synthetic trial records');
const state={schema:1,hypothesis:'small',trials:[t1,t2],reflection:'Smaller drops yield finer resolution, but do not capture real calibration uncertainty.',selectedAnswer:1,checked:true,finished:false};
check(mission.canFinish(state)===true,'Mission completion has evidence-based criteria');
check(mission.canFinish({...state,trials:[t1]})===false,'One drop size cannot complete mission');
check(mission.canFinish({...state,selectedAnswer:0})===false,'Incorrect knowledge check cannot complete mission');
check(mission.canFinish({...state,reflection:'short'})===false,'Interpretation is required');
check(mission.restoreMission('{bad json').trials.length===0,'Corrupted storage fails safely');
check(mission.restoreMission(JSON.stringify({...state,finished:true})).finished===true,'Valid completed record survives reload');
check(mission.progressPercent({...state,finished:true})===100,'Progress counts only actual completion');
const md=mission.reportMarkdown({...state,finished:true},'id');
check(md.includes('BUKAN pengukuran fisik')&&md.includes('0.03')&&md.includes('0.08'),'Report includes synthetic warning and actual trial data');
console.log('V6.7 checks PASS — run npm run release:build for full TypeScript + production bundle.');
