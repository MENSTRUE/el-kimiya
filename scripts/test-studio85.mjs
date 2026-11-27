import test from 'node:test';
import assert from 'node:assert/strict';
import * as studio from '../src/v8/studio85.ts';
const valid=(kind='question')=>({
  ...studio.blankEntry(kind),key:'doc-x',title:{id:'Judul',en:'Title'},body:{id:'Isi',en:'Body'},
  answer:{id:'Benar',en:'Correct'},alternate:{id:'Salah',en:'Incorrect'},source:'doi:10/example'
});
test('draft requires bilingual title, not content or source',()=>{
  const draft={...studio.blankEntry('lesson'),title:{id:'Judul',en:'Title'}};
  assert.deepEqual(studio.validateEntry(draft,'draft'),[]);
  assert(studio.validateEntry(draft,'published').includes('BODY_REQUIRED'));
  draft.title.en='  ';assert(studio.validateEntry(draft,'draft').includes('TITLE_REQUIRED'));
});
test('published questions require different correct/incorrect answers in both languages',()=>{
  const entry=valid();
  assert.deepEqual(studio.validateEntry(entry,'published'),[]);
  entry.alternate.en=' correct  ';
  assert(studio.validateEntry(entry,'published').includes('ANSWER_DUPLICATE'));
  entry.alternate.en='';assert(studio.validateEntry(entry,'published').includes('ALTERNATE_REQUIRED'));
});
test('flashcards require answer; other content does not',()=>{
  const flash=valid('flashcard');flash.answer.en='';
  assert(studio.validateEntry(flash,'published').includes('ANSWER_REQUIRED'));
  const lesson=valid('lesson');lesson.answer.en='';
  assert.deepEqual(studio.validateEntry(lesson,'published'),[]);
});
test('all server-side field limits and supported kinds are validated even for drafts',()=>{
  const entry=valid();entry.title.en='x'.repeat(161);entry.body.id='x'.repeat(6001);
  entry.answer.id='x'.repeat(1201);entry.alternate.en='x'.repeat(1201);entry.source='x'.repeat(501);entry.kind='fake';
  assert.deepEqual(studio.validateEntry(entry,'draft').sort(),['ANSWER_LIMIT','ALTERNATE_LIMIT','BODY_LIMIT','KIND_INVALID','SOURCE_LIMIT','TITLE_LIMIT'].sort());
});
test('Firestore write payload uses only existing schema, strips key/extras and irrelevant answers',()=>{
  const entry={...valid('lesson'),title:{id:' Judul  ',en:'Title'},source:' citation ',updatedAt:'old',injected:true};
  assert.deepEqual(studio.entryFields(entry,'published'),{
    kind:'lesson',title:{id:'Judul',en:'Title'},body:{id:'Isi',en:'Body'},answer:{id:'',en:''},alternate:{id:'',en:''},source:'citation',status:'published'
  });
});
test('legacy malformed or unsafe entries do not become fake empty content',()=>{
  const item=valid();
  assert.equal(studio.decodeEntry('abc',{...item,kind:'unsupported'}),null);
  assert.equal(studio.decodeEntry('abc',{...item,title:null}),null);
  assert.equal(studio.decodeEntry('abc',{...item,status:'deleted'}),null);
  assert.equal(studio.decodeEntry('abc',{...item}).key,'abc');
});
test('local filter searches both languages and source without mixing kinds/status',()=>{
  const entries=[valid('question'),{...valid('lesson'),key:'two',status:'published'},{...valid('question'),key:'three',status:'published',title:{id:'Kimia',en:'Chemistry'}}];
  assert.deepEqual(studio.filterEntries(entries,'question','published','kimia').map(x=>x.key),['three']);
  assert.deepEqual(studio.filterEntries(entries,'question','draft','title').map(x=>x.key),['doc-x']);
  assert.deepEqual(studio.filterEntries(entries,'lesson','all','doi:10').map(x=>x.key),['two']);
});
test('catalog count is not zero while loading/cache/error; server-ready zero is explicit',()=>{
  assert.equal(studio.catalogSummary([], 'loading'),null);
  assert.equal(studio.catalogSummary([], 'cached'),null);
  assert.equal(studio.catalogSummary([], 'error'),null);
  assert.deepEqual(studio.catalogSummary([], 'ready'),{total:0,published:0,draft:0,byKind:{lesson:0,question:0,flashcard:0,reference:0,molecule:0},capped:false});
  const e=valid();assert.equal(studio.catalogSummary([e], 'ready',100).capped,true);
});
test('AI guidance status and shape obey existing rules; empty guidance is allowed',()=>{
  assert.equal(studio.validGuidance({id:'',en:''}),true);
  assert.equal(studio.validGuidance({id:'x'.repeat(1501),en:''}),false);
  assert.equal(studio.validGuidance({id:'',en:'',secret:'foo'}),false);
});
test('permission guard requires confirmed Moduler role, authenticated user, db and server-ready view',()=>{
  const base={role:'moduler',roleReady:true,user:true,db:true};
  assert.equal(studio.canWriteStudio(base,'ready'),true);
  assert.equal(studio.canWriteStudio({...base,role:'user'},'ready'),false);
  assert.equal(studio.canWriteStudio({...base,roleReady:false},'ready'),false);
  assert.equal(studio.canWriteStudio(base,'cached'),false);
  assert.equal(studio.canWriteStudio(base,'error'),false);
});
test('safe errors never expose a raw Firebase token or rejected document payload',()=>{
  assert.equal(studio.studioErrorCode({code:'permission-denied',message:'Token SECRET'}),'PERMISSION');
  assert.equal(studio.studioErrorCode({code:'unavailable',message:'SECRET'}),'CONNECTION');
  assert.equal(studio.studioErrorCode(new Error('SECRET')),'FAILED');
});
