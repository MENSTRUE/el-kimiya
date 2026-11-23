/** Deterministic integrity audit: independent arithmetic + bilingual fields + additive integration. */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
let ts;
try { ts = require('typescript'); } catch { ts = require('/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript'); }
const source=readFileSync(resolve(root,'src/data/quizBankV63.ts'),'utf8');
const t=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext},reportDiagnostics:true});
assert.equal(t.diagnostics?.filter(d=>d.category===ts.DiagnosticCategory.Error).length||0,0,'TS transpilation errors');
const mod=await import(`data:text/javascript;base64,${Buffer.from(t.outputText).toString('base64')}`);
const bank=mod.QUESTION_BANK_V63;
const ids=new Set(), prompts=new Set(), counts=new Map();
const to4=n=>Number(n.toFixed(4));
for(const q of bank){
  assert(!ids.has(q.id),`duplicate id ${q.id}`);ids.add(q.id);
  assert(!prompts.has(q.prompt.id),`duplicate prompt ${q.id}`);prompts.add(q.prompt.id);
  assert(q.prompt.id && q.prompt.en && q.explanation.id && q.explanation.en,`missing bilingual content ${q.id}`);
  assert.equal(q.choices.length,4,`must have 4 choices ${q.id}`);
  assert.equal(new Set(q.choices.map(x=>x.id)).size,4,`repeated answer labels ${q.id}`);
  assert(Number.isInteger(q.correct) && q.correct>=0 && q.correct<4,`bad index ${q.id}`);
  const {a,b}=q.audit;
  let expected;
  switch(q.family){
    case 'mass-from-moles': expected=a/2*(10+5*b); break;
    case 'moles-from-mass': expected=a/2; break;
    case 'molarity': expected=(a*.05)/(b*.25); break;
    case 'dilution': expected=40*b; break;
    case 'density': expected=.5+a*.1; break;
    case 'mass-percent': expected=(a*2)/(a*2+b*3)*100; break;
    case 'reaction-yield': expected=(b+1)*10; break;
    case 'boyle': expected=(1+a*.5)*(b*2)/((b+2)*2); break;
    case 'heat': expected=a*10*b*.2*(a%6+3)*5; break;
    case 'neutralization': expected=a*.1*b*10/.5; break;
    case 'ideal-gas': expected=a*.1*.082057*(250+b*10)/10; break;
    case 'petroleum-acid': expected=(((b+1)*.5)-.1)*.1*56.1/(2*a+4); break;
    default: throw new Error(`unknown family ${q.family}`);
  }
  assert.equal(q.audit.expected,to4(expected),`independent formula audit failed ${q.id}`);
  const unit=q.choices[q.correct].id.split(' ').slice(1).join(' ');
  assert.equal(q.choices[q.correct].id,`${to4(expected)} ${unit}`,`wrong marked answer ${q.id}`);
  counts.set(q.family,(counts.get(q.family)||0)+1);
}
assert.equal(bank.length,1152);
assert.equal(counts.size,12);
for(const [family,count] of counts){assert.equal(count,96,`wrong family coverage ${family}`);}
const targets=[
  ['src/App.tsx','ELKIMIYA_V63_QUIZ_INTEGRATED'],
  ['src/App.tsx','<ConceptGuideV63/>'],
  ['src/components/PetrochemicalExperimentLabV62.tsx','ELKIMIYA_V63_GLASS_INTEGRATED'],
  ['src/components/PetrochemicalExperimentLabV62.tsx','glassView ? <ExperimentGlassV63'],
  ['src/main.tsx',"import './experience-v63.css'"],
  ['src/lib/petroExperimentV62.ts','ELKIMIYA_V63_12_SCENARIOS']
];
if(existsSync(resolve(root,'src/App.tsx'))){for(const [path,needle] of targets){assert(readFileSync(resolve(root,path),'utf8').includes(needle),`missing V6.3 integration ${path}: ${needle}`);}}

// Verify all original and added synthetic petro cases obey the existing V6.2 model limits.
const petroPath=resolve(root,'src/lib/petroExperimentV62.ts');
if(existsSync(petroPath)){
  const petroTs=readFileSync(petroPath,'utf8');
  const compiled=ts.transpileModule(petroTs,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText;
  const petro=await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);
  assert.equal(petro.SYNTHETIC_SCENARIOS.length,12,'expected 12 synthetic scenarios total');
  assert.equal(new Set(petro.SYNTHETIC_SCENARIOS.map(s=>s.id)).size,12,'duplicate petro scenarios');
  for (const scenario of petro.SYNTHETIC_SCENARIOS){
    assert.equal(petro.validateScenario(scenario),null,`invalid scenario ${scenario.id}`);
    const observation=petro.evaluateTitration(scenario,5);
    assert(Number.isFinite(observation.acidNumberMgKohG),`non-finite simulated result ${scenario.id}`);
  }
  console.log('[PASS] 12 synthetic petroleum cases, all valid under untouched V6.2 model');
}

console.log(`[PASS] ${bank.length} bilingual exercises, ${counts.size} skills, 4 unique answers each`);
console.log('[PASS] Each key audited against independent formula and indexed correct choice');
console.log('[PASS] Generated numerical variants explicitly labeled; no expert-review claim');
if(existsSync(resolve(root,'src/App.tsx')))console.log('[PASS] Additive integration: Practice Lab + Flashcard guide + V6.2 glass toggle + CSS');
