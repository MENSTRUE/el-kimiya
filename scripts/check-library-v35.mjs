#!/usr/bin/env node
/** Offline safety and integration smoke checks for the El-Kīmiyā V3.5 Library. */
import { readFileSync, existsSync } from 'node:fs';
const read = file => readFileSync(file, 'utf8');
const ui = read('src/components/BookResearchPanel.tsx');
const css = read('src/library-v35.css');
const vite = read('vite.config.ts');
const plugin = read('scripts/local-private-books-plugin.ts');
const ignore = read('.gitignore');
const tests = [
  ['New 1-click library reader', ui.includes('onClick={() => openBook(book.id)}') && ui.includes('library35-reader')],
  ['PDF bridge from V3.4 kept', ui.includes('/__elkimiya_local_books__/manifest.json') && vite.includes('localPrivateBooksPlugin()')],
  ['Private PDF route allowlisted', plugin.includes('BOOK_IDS') && plugin.includes("apply: 'serve'") && plugin.includes('localhost')],
  ['Local-only server', /host:\s*'127\.0\.0\.1'/.test(vite)],
  ['PDFs gitignored', ignore.split(/\r?\n/).some(line => line.trim()==='private/')],
  ['Bookmarks stored as page numbers', ui.includes('STORE_PAGES') && ui.includes('setPages(previous =>')],
  ['Favorites persistent in browser', ui.includes('STORE_FAVORITES') && ui.includes('toggleFavorite')],
  ['Search + source index consent preserved', ui.includes('searchIndex(') && ui.includes('contextForPrompt(') && ui.includes('!consent')],
  ['PDFs not imported as assets', !/import\s+.*\.pdf['"]/.test(ui) && !ui.includes('import.meta.glob')],
  ['Scoped redesign CSS loaded', ui.includes("import '../library-v35.css'") && css.includes('.library35-grid')],
  ['Accessible reader with dialog and keyboard escape', ui.includes('aria-modal="true"') && ui.includes("event.key === 'Escape'")],
];
let failed = 0;
for (const [name, ok] of tests) {
  console.log(`${ok ? '[PASS]' : '[FAIL]'} ${name}`);
  if (!ok) failed++;
}
if (existsSync('dist')) {
  const { readdirSync } = await import('node:fs');
  // Avoid accidentally shipping PDFs via Vite public assets.
  const scan = dir => readdirSync(dir, { withFileTypes:true }).flatMap(entry => entry.isDirectory() ? scan(`${dir}/${entry.name}`) : [`${dir}/${entry.name}`]);
  const leaked = scan('dist').filter(x => /\.pdf$/i.test(x));
  if (leaked.length) { console.error('[FAIL] PDFs found in dist; do NOT deploy:', leaked.length); failed++; }
  else console.log('[PASS] No PDF files in dist');
}
if (failed) process.exit(1);
console.log('\nEL-KIMIYA V3.5 LIBRARY SOURCE + PRIVACY CHECK PASS');
