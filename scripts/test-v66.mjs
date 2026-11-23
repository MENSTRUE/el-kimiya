import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import vm from 'node:vm';
const root=process.cwd();
const require=createRequire(import.meta.url);
let ts;
try{ts=require('typescript')}catch{console.error('[FAIL] TypeScript dev dependency missing. Run npm install.');process.exit(1)}
const read=x=>fs.readFileSync(path.join(root,x),'utf8');
const app=read('src/App.tsx');
const petro=read('src/components/PetrochemicalExperimentLabV62.tsx');
const publicComponent=read('src/components/PublicChemistryLibraryV66.tsx');
const glass=read('src/components/ExperimentGlassV66.tsx');
const search=read('src/lib/publicSearchV66.ts');
let passed=0;
function check(title, fn){try{fn(); console.log(`[PASS] ${title}`);passed++}catch(e){console.error(`[FAIL] ${title}: ${e.message}`);process.exitCode=1}}
check('Library has original public reader and still keeps private PDF reader',()=>{assert.match(app,/PublicChemistryLibraryV66/);assert.match(app,/<BookResearchPanel askAbout=/);assert.match(app,/v66-private-drawer/)});
check('Original TXT/MD, historic demo shelf retained in optional disclosure',()=>{assert.match(app,/v66-supplemental/);assert.match(app,/upload-text-label/);assert.match(app,/Legacy sample cards/)});
check('Public library uses original course rather than private PDF contents',()=>{assert.match(publicComponent,/COURSE, localize/);assert.doesNotMatch(publicComponent,/chemistry-books|private\/chemistry-text/)});
check('Hugging Face semantic model only downloads upon explicit user click',()=>{const start=publicComponent.indexOf('const activateSemantic=async');assert.ok(start>0);const loader=publicComponent.indexOf('import(/* @vite-ignore */ remote)');assert.ok(loader>start);assert.match(publicComponent,/setAiStatus\('unavailable'\)/);assert.match(publicComponent,/keywordRank/)});
check('Model result is ranking, not fabricated AI response',()=>{assert.match(publicComponent,/semanticRank/);assert.match(publicComponent,/not a generated AI answer/)});
check('Existing Firebase tutor route and practice route preserved',()=>{assert.match(publicComponent,/onAskTutor/);assert.match(publicComponent,/onPractice/)});
check('Lab math and legacy diagram preserved',()=>{assert.match(petro,/evaluateTitration/);assert.match(petro,/petro62-beaker/);assert.match(petro,/ExperimentGlassV66/)});
check('Zero drops display no colored liquid',()=>{assert.match(glass,/filled=drops>0&&volumeMl>0/);assert.match(glass,/\{filled&&<g clipPath/)});
check('Liquid clipping follows flask interior',()=>{assert.match(glass,/<clipPath id=\{clip\}>/);assert.match(glass,/clipPath=\{`url\(#\$\{clip\}\)`\}/);assert.match(glass,/const levelY=368-100\*fraction/)});
check('Reset button high-contrast override',()=>{const css=read('src/lab-polish-v66.css');assert.match(css,/\.petro62 \.petro62-buttons button\.subtle/);assert.match(css,/color:#224f49!important/)});
check('Search keyword coverage and cosine implementation',()=>{assert.match(search,/export function keywordRank/);assert.match(search,/export function cosine/)});
check('Source TSX/TS syntax parses',()=>{
  for(const file of ['src/components/PublicChemistryLibraryV66.tsx','src/components/ExperimentGlassV66.tsx','src/lib/publicSearchV66.ts']) {
    const result=ts.transpileModule(read(file),{fileName:file,reportDiagnostics:true,compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext,jsx:ts.JsxEmit.ReactJSX}});
    const errs=result.diagnostics?.filter(x=>x.category===ts.DiagnosticCategory.Error)||[];
    assert.equal(errs.length,0,`${file}: ${errs.map(e=>ts.flattenDiagnosticMessageText(e.messageText,' ')).join(' | ')}`);
  }
});
check('Keyword index respects token matching and works without network',()=>{
  const js=ts.transpileModule(search,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  const module={exports:{}};vm.runInNewContext('(function(module,exports){'+js+'})') (module,module.exports);
  const {keywordRank,cosine,semanticRank}=module.exports;
  const matches=keywordRank('kimia atom',[{id:'a',text:'atom dan molekul'},{id:'b',text:'sejarah bola'}]);
  assert.equal(matches[0].id,'a');assert.equal(matches.length,1);
  assert.equal(cosine([1,0],[1,0]),1);assert.equal(cosine([1,0],[0,1]),0);
  assert.equal(semanticRank([1,0],[{id:'a',vector:[1,0]},{id:'b',vector:[0,1]}])[0].id,'a');
});
console.log(`${passed}/13 V6.6 static+logic checks passed`);
if(process.exitCode)process.exit(process.exitCode);
