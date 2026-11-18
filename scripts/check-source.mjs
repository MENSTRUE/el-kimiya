import ts from 'typescript';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import assert from 'node:assert/strict';

const sources = [
  'src/App.tsx','src/components/BrandMark.tsx','src/lib/storage.ts',
  'src/lib/hybrid.ts','src/lib/bookSearch.ts','src/data/books.ts',
  'src/components/BookResearchPanel.tsx','src/data/learning.ts','src/main.tsx',
];
for(const source of sources){
  const text=readFileSync(resolve(source),'utf8');
  const output=ts.transpileModule(text,{fileName:source,reportDiagnostics:true,compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2020,jsx:ts.JsxEmit.ReactJSX}});
  const errors=output.diagnostics?.filter(d=>d.category===ts.DiagnosticCategory.Error)||[];
  for(const e of errors) console.error(source+': '+ts.flattenDiagnosticMessageText(e.messageText,'\n'));
  assert.equal(errors.length,0,`${source} has syntax diagnostics`);
  console.log('SYNTAX PASS:',source);
}
const input=readFileSync(resolve('src/data/learning.ts'),'utf8');
const compiled=ts.transpileModule(input,{fileName:'learning.ts',compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
// Pure-data module test; no browser, Firebase or React needed.
const module={exports:{}};
new Function('module','exports',compiled)(module,module.exports);
const {quizzes,elements,starterCards,getDemoAnswer}=module.exports;
assert.equal(quizzes.length,3);
assert.equal(elements.find(e=>e.symbol==='O').number,8);
assert.equal(starterCards.length>=5,true);
assert.equal(getDemoAnswer('Why does salt dissolve in water?').title,'Why salt dissolves in water');
assert.equal(getDemoAnswer('Tell me about a made-up fictional species.'),null);
const counts=(q,values)=>{
  const [a,b,c]=values;
  switch(q){
    case 'water':return a*2===c*2&&b*2===c;
    case 'ammonia':return a*2===c&&b*2===c*3;
    case 'sodium':return a===c&&b*2===c;
    default:return false;
  }
};
for(const q of quizzes){
  q.choices.forEach((choice,i)=>{
    const values=choice.split(',').map(v=>Number(v.trim()));
    assert.equal(counts(q.id,values),i===q.correct,`wrong scoring for ${q.id} option ${choice}`);
  });
  console.log('CHEMISTRY BALANCING PASS:',q.id);
}
assert.ok(readFileSync('src/lib/hybrid.ts','utf8').includes('response.inferenceSource'),'Firebase source verification must remain');
console.log('ALL SOURCE AND PURE-LOGIC CHECKS PASS');

// V3: actual book metadata + private in-browser retrieval, without bundling books.
const evalCommonJs=(source, requireFn=()=>{throw new Error('Unexpected import')})=>{
  const code=ts.transpileModule(readFileSync(source,'utf8'),{fileName:source,compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
  const mod={exports:{}};
  new Function('module','exports','require',code)(mod,mod.exports,requireFn);
  return mod.exports;
};
const bookLib=evalCommonJs(resolve('src/data/books.ts'));
assert.equal(bookLib.sourceBooks.length,8,'Eight unique sources are expected');
assert.equal(bookLib.sourceBooks.reduce((sum,book)=>sum+book.pdfPages,0),1287);
assert.equal(bookLib.bookById('kuncoro-2021').rights,'restricted');
const searchLib=evalCommonJs(resolve('src/lib/bookSearch.ts'),id=>{
  if(id==='../data/books')return bookLib;
  throw new Error('Unexpected module '+id);
});
const index=searchLib.parsePrivateIndex({schemaVersion:1,generatedAt:'2026-11-18',pages:[
  {bookId:'kuncoro-2021',pdfPage:3,text:'Ikatan kimia merupakan interaksi atom dan elektron.'},
  {bookId:'yahdi-2020',pdfPage:6,text:'Konsentrasi larutan dan kesetimbangan kimia.'}
]});
const hits=searchLib.searchIndex(index,'Jelaskan ikatan kimia',5);
assert.equal(hits[0].bookId,'kuncoro-2021');
assert.ok(searchLib.contextForPrompt('What is a bond?',hits).includes('PDF page 3'));
assert.throws(()=>searchLib.parsePrivateIndex({schemaVersion:1,pages:[{bookId:'unknown',pdfPage:0,text:'x'}]}));
console.log('PRIVATE INDEX SEARCH PASS:',hits.length,'hit(s)');
