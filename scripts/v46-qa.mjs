/** El-Kimiya V4.6 source + optional local backend QA. No credentials are printed. */
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import process from 'node:process';

const cwd = process.cwd();
const read = (name) => readFileSync(resolve(cwd, name), 'utf8');
const ok = (message) => console.log(`[PASS] ${message}`);
const warn = (message) => console.warn(`[WARN] ${message}`);
const failures = [];
const test = (name, success) => success ? ok(name) : (failures.push(name), console.error(`[FAIL] ${name}`));
const has = name => existsSync(resolve(cwd, name));
const strict = process.argv.includes('--release');
const live = process.argv.includes('--live');

console.log('\nEL-KIMIYA V4.6 - HYBRID AI QUALITY GATES\n');
for (const name of [
  'src/components/LearningPathV45.tsx',
  'src/components/HybridCoachV46.tsx',
  'src/hybrid-coach-v46.css',
  'src/lib/hybrid.ts',
  'src/data/elements-v45.ts',
  'src/data/course-v45.ts',
  'LICENSE', 'README.md',
]) test(`${name} exists`, has(name));
if (failures.length) process.exit(1);

const journey = read('src/components/LearningPathV45.tsx');
const coach = read('src/components/HybridCoachV46.tsx');
const firebase = read('src/lib/hybrid.ts');
const elements = read('src/data/elements-v45.ts');
const course = read('src/data/course-v45.ts');
const config = read('vite.config.ts');
const count = (source, regex) => [...source.matchAll(regex)].length;

test('Hybrid Coach integrated in sequenced learning path', journey.includes('<HybridCoachV46') && journey.includes('ELKIMIYA_V46_HYBRID_COACH'));
test('118 elements bundled in-app', count(elements, /"number"\s*:/g) === 118);
test('13 ordered chapters', count(course, /\bid: '(?:matter|atoms|periodic|bonding|stoich|solutions|acids|gases|energy|kinetics|redox|organic|safety)'/g) === 13);
test('Firebase AI Logic called at runtime', firebase.includes('getGenerativeModel(') && firebase.includes('model.generateContent(prompt)'));
test('Actual provider is read from SDK', firebase.includes('response.inferenceSource'));
test('No model output simulation in coach', coach.includes('runHybridInference(') && !coach.includes('mockModelResponse'));
test('Cloud-aware modes and comparisons require consent', coach.includes('cloudConsent') && coach.includes('requiresConsent') && coach.includes('if (compare && !cloudConsent)'));
test('Coach accepts bilingual lesson summaries', coach.includes('lesson.concepts') && coach.includes('useLanguage'));
test('Vite config supports next-generation native loading', config.includes('import.meta.dirname') && config.includes("local-private-books-plugin.ts") && config.includes("type: 'json'"));

if (has('.gitignore')) {
  const ignore = read('.gitignore');
  test('Backup directory excluded from commits', ignore.includes('scripts/.v46-backups/'));
} else test('.gitignore exists', false);

if (strict) {
  test('Production frontend build exists', has('dist/index.html'));
  const releaseCheck = has('scripts/release-preflight.mjs');
  test('Existing release-preflight script available', releaseCheck);
  console.log('[NOTE] Static QA CANNOT verify remote App Check or actual on-device/cloud inference. Test these in Chrome and Android.');
}

if (live) {
  const base = 'http://127.0.0.1:8000/api/v1';
  const request = async (path, options) => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    try {
      const response = await fetch(base + path, { ...options, signal: controller.signal });
      return response;
    } finally { clearTimeout(timeout); }
  };
  try {
    const response = await request('/learning/health');
    test('FastAPI learning endpoint returns HTTP 200', response.ok);
    if (response.ok) {
      const data = await response.json();
      test('Learning API baseline: 13 topics / 65 questions / 52 cards', data.topics === 13 && data.questions === 65 && data.flashcards === 52);
    }
    const mol = await request('/health');
    test('ChEMBL health reachable', mol.ok);
    if (mol.ok) {
      const data = await mol.json();
      test('ChEMBL database ready', data.database_ready === true && data.molecules === 2897819);
    }
    const cors = await request('/health', {
      method: 'OPTIONS',
      headers: { Origin: 'http://127.0.0.1:8443', 'Access-Control-Request-Method': 'GET', 'Access-Control-Request-Headers': 'content-type' },
    });
    test('Vite 8443 CORS preflight allowed', cors.ok && cors.headers.get('access-control-allow-origin') === 'http://127.0.0.1:8443');
  } catch (error) {
    failures.push('Local backend is not reachable');
    console.error('[FAIL] Local FastAPI integration:', error instanceof Error ? error.message : String(error));
  }
} else warn('Live backend checks skipped. Run: node scripts/v46-qa.mjs --live');

console.log(`\nRESULT: ${failures.length === 0 ? 'STATIC CHECKS PASSED' : `${failures.length} FAILURE(S)`}`);
console.log('INFERENCE PROOF: Run Teach-Back on the real device and record SDK provider receipts.');
if (failures.length) process.exitCode = 1;
