/** Source-level regression tests only. Run npm run release:build for TypeScript and Vite. */
import { readFileSync, existsSync } from 'node:fs';
import assert from 'node:assert/strict';

const read = p => readFileSync(p, 'utf8');
const app = read('src/App.tsx');
const reader = read('src/components/PrivateReadingWorkspace.tsx');
const dashboard = read('src/components/DashboardRealV65.tsx');
const exporter = read('scripts/export_private_books_v65.py');
const checks = [
  ['Dashboard route uses real progress', () => assert.match(app, /if\(page==='dashboard'\)return <DashboardRealV65 onGo=\{setPage\}/)],
  ['Dashboard reads browser score', () => assert.match(dashboard, /elkimiya\.quizbank\.v63\.progress/)],
  ['Dashboard uses saved learning path', () => assert.match(dashboard, /elk\.v45\.learningPath\.1/)],
  ['Demo duration and daily streak not invented', () => { assert.doesNotMatch(dashboard, /4h\s?25m|7 hari beruntun|streak:/i); }],
  ['PDF document viewer preserved', () => assert.match(reader, /pdfPage\.render/)],
  ['PDF text is extracted from opened document', () => assert.match(reader, /pdfPage\.getTextContent\(\)/)],
  ['PDF text has adjustable font', () => { assert.match(reader, /setFontSize/); assert.match(reader, /fontFamily:/); }],
  ['Reader retains original index', () => assert.match(reader, /searchIndex\(/)],
  ['Reader retains personal notes', () => assert.match(reader, /elk\.reader\.notes/)],
  ['Reader keeps original PDF mode', () => assert.match(reader, /readMode==='document'/)],
  ['Private JSON import validates book ID', () => assert.match(reader, /data\.book_id !== book\.id/)],
  ['Exporter stores JSON under private', () => { assert.match(exporter, /'private' \/ 'chemistry-text-v65'/); assert.doesNotMatch(exporter, /public\/data|dist\/data/); }],
  ['New TSX/CSS copied', () => ['src/components/DashboardRealV65.tsx','src/real-progress-v65.css','src/library-reader-v65.css'].forEach(p => assert.ok(existsSync(p), p))],
];
let passed = 0;
for (const [label, callback] of checks) {
  try { callback(); console.log('[PASS] ' + label); passed++; }
  catch (err) { console.error('[FAIL] ' + label + ': ' + err.message); process.exitCode = 1; }
}
console.log(`${passed}/${checks.length} V6.5 source-level checks passed`);
