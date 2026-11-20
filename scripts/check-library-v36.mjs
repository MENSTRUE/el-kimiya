#!/usr/bin/env node
/** Validate the private PDF reader + index route without exposing document bytes. */
import {readFileSync, existsSync, readdirSync} from 'node:fs';
const read = f => readFileSync(f,'utf8');
const panel=read('src/components/BookResearchPanel.tsx');
const reader=read('src/components/PrivateReadingWorkspace.tsx');
const plugin=read('scripts/local-private-books-plugin.ts');
const css=read('src/library-v36.css');
const pkg=JSON.parse(read('package.json'));
const tests=[
 ['V3.6 reader integrated into Library', panel.includes('return <PrivateReadingWorkspace') && panel.includes("/__elkimiya_local_books__/index.json")],
 ['No V3.5 iframe modal remains', !panel.includes('library35-reader-backdrop')],
 ['PDF.js renders the document as canvas', reader.includes('pdfPage.render({canvas, canvasContext:context')&&reader.includes('<canvas')&&!reader.includes('<iframe')],
 ['Reader supports on-page navigation', reader.includes('onPageChange')&&reader.includes('onBookmark')],
 ['Reader supports local indexed text', reader.includes('searchIndex(')&&reader.includes('selectedText')],
 ['Private JSON index served only by local bridge',plugin.includes("pathname === PREFIX + '/index.json'")&&plugin.includes('allowedHost')&&plugin.includes('sameOrigin')],
 ['No public indexed files referenced',!reader.includes('/public/chemistry')&&!reader.includes('/assets/books')],
 ['Reader fully integrated rather than overlay',css.includes('main.standard-page:has(> .library36-studio)')],
 ['PDF.js installed as pinned direct dependency',pkg.dependencies?.['pdfjs-dist']==='5.4.624'],
 ['Private directory remains Git-ignored',read('.gitignore').split(/\r?\n/).some(x=>x.trim()==='private/')],
 ];
let failed=false;
for (const [name, ok] of tests){console.log(`${ok?'[PASS]':'[FAIL]'} ${name}`);if(!ok) failed=true}
if (existsSync('dist')) {
  const scan = dir => readdirSync(dir, {withFileTypes:true}).flatMap(item => item.isDirectory()?scan(`${dir}/${item.name}`):[`${dir}/${item.name}`]);
  const leaks = scan('dist').filter(name => /\.pdf$|chemistry_index\.json$|google-services\.json$/i.test(name));
  console.log(`${leaks.length?'[FAIL]':'[PASS]'} Public build does not contain private PDFs/JSON/Android config`);
  if (leaks.length) failed=true;
}
if (failed) process.exitCode=1;
else console.log('V3.6 STATIC CHECKS PASS (browser rendering must still be tested).');
