// ELKIMIYA_V70_DARK_CONTRAST: static fail-closed release checks.
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
const root = process.cwd();
const file = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const main = file('src/main.tsx');
const css = file('src/dark-contrast-v70.css');
const checks = [
  ['style imported in main entry', main.includes("import './dark-contrast-v70.css'")],
  ['system theme bootstrap only if not yet saved', main.includes("localStorage.getItem('elk.dark') === null")],
  ['dark landing-principles selector', css.includes('.app.dark .landing-principles {')],
  ['dark feature card selector', css.includes('.app.dark .landing-principles .principle-grid article {')],
  ['dark heading selector', css.includes('.app.dark .landing-principles .principle-grid h3 {')],
  ['dark description selector', css.includes('.app.dark .landing-principles .principle-grid p {')],
  ['light feature card selector', css.includes('.app:not(.dark) .landing-principles .principle-grid article {')],
  ['light description selector', css.includes('.app:not(.dark) .landing-principles .principle-grid p {')],
  ['no logo filter or invert', !css.includes('filter:') && !css.includes('invert(')],
];
for (const [name, ok] of checks) console.log(`[${ok ? 'PASS' : 'FAIL'}] ${name}`);
if (checks.some(([, ok]) => !ok)) process.exit(1);
console.log(`[PASS] ${checks.length}/${checks.length} V70 source assertions`);
