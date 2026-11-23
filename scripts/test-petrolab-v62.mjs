/** El-Kimiya V6.2 quick pure-model test: node scripts/test-petrolab-v62.mjs */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import assert from 'node:assert/strict';

const require = createRequire(import.meta.url);
const ts = require('typescript');
const root = process.cwd();
const source = fs.readFileSync(path.join(root, 'src/lib/petroExperimentV62.ts'), 'utf8');
const out = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }, reportDiagnostics: true });
const errors = (out.diagnostics || []).filter(d => d.category === ts.DiagnosticCategory.Error);
assert.equal(errors.length, 0, 'TypeScript parser diagnostics: ' + errors.map(x=>ts.flattenDiagnosticMessageText(x.messageText,' ')).join(','));
const moduleObject = { exports: {} };
vm.runInNewContext(out.outputText, { module: moduleObject, exports: moduleObject.exports, Number, Math, Error, Object, Array, String });
const m = moduleObject.exports;
let passed = 0;
const test = (name, fn) => { fn(); console.log('[PASS]', name); passed++; };

test('acid number math: 1 mL @ 0.1 N for 10 g = 0.561 mg KOH/g', () => {
  assert.ok(Math.abs(m.acidNumberFromVolume(1,10,.1) - .561) < 1e-10);
});
test('blank subtraction', () => {
  assert.ok(Math.abs(m.acidNumberFromVolume(1.1,10,.1,.1) - .561) < 1e-10);
});
test('all synthetic cases have valid inputs', () => {
  for (const s of m.SYNTHETIC_SCENARIOS) assert.equal(m.validateScenario(s), null);
});
test('nearest theoretical whole drop is inside model resolution band', () => {
  for (const s of m.SYNTHETIC_SCENARIOS) {
    const base = m.evaluateTitration(s, 0);
    const at = m.evaluateTitration(s, Math.round(base.theoreticalEndpointDrops));
    assert.equal(at.status, 'near');
  }
});
test('undershoot then overshoot modeled target', () => {
  const s = m.SYNTHETIC_SCENARIOS[0];
  const ref = m.evaluateTitration(s, 0);
  assert.equal(ref.status, 'before');
  assert.equal(m.evaluateTitration(s, Math.ceil(ref.theoreticalEndpointDrops)+20).status, 'after');
});
test('invalid masses, drop size, reference and negative count rejected', () => {
  const s = m.SYNTHETIC_SCENARIOS[0];
  assert.ok(m.validateScenario({...s, sampleMassG: 0}));
  assert.ok(m.validateScenario({...s, dropVolumeMl: .25}));
  assert.ok(m.validateScenario({...s, referenceAcidNumber: 100}));
  assert.throws(()=>m.evaluateTitration(s,-1));
});
test('repeatability stats are correct', () => {
  const q=m.summarizeRuns([1.0,1.2,1.4],1.2);
  assert.equal(q?.count,3);
  assert.ok(Math.abs(q.mean-1.2) < 1e-8);
  assert.ok(Math.abs(q.range-.4) < 1e-8);
  assert.equal(m.summarizeRuns([],1),null);
});
test('existing studio integration is additive', () => {
  const c=fs.readFileSync(path.join(root,'src/components/MolecularIntelligenceLab.tsx'),'utf8');
  assert.match(c, /<MolecularStudioV60\s*\/>/);
  assert.match(c, /<PetrochemicalExperimentLabV62\s*\/>/);
  assert.match(c, /<MolecularBackendPanel\s*\/>/);
  assert.match(c, /runHybridInference/);
});
console.log(`\nEL-KIMIYA V6.2: ${passed}/8 MODEL/INTEGRATION CHECKS PASS`);
