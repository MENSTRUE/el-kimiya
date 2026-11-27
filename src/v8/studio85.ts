import type { Bi, Entry, Kind } from './platform';

export const studioKinds: Kind[]=['lesson','question','flashcard','reference','molecule'];
export type CatalogState='loading'|'cached'|'ready'|'error';
export type StudioFilter='all'|'draft'|'published';
export const blankBi=():Bi=>({id:'',en:''});
export const blankEntry=(kind:Kind='lesson'):Entry=>({key:'',kind,title:blankBi(),body:blankBi(),answer:blankBi(),alternate:blankBi(),source:'',status:'draft'});
export const fieldLimits={title:160,body:6000,answer:1200,alternate:1200,source:500,guide:1500} as const;
const biShape=(value:unknown):value is Bi=>!!value&&typeof value==='object'&&Object.keys(value).length===2&&typeof (value as Bi).id==='string'&&typeof (value as Bi).en==='string';
const filled=(b:Bi)=>!!(b.id.trim()&&b.en.trim());
const tidy=(b:Bi):Bi=>({id:b.id.trim(),en:b.en.trim()});
const normalized=(s:string)=>s.trim().toLocaleLowerCase().replace(/\s+/g,' ');
export type ValidationCode='TITLE_REQUIRED'|'BODY_REQUIRED'|'SOURCE_REQUIRED'|'ANSWER_REQUIRED'|'ALTERNATE_REQUIRED'|'ANSWER_DUPLICATE'|'TITLE_LIMIT'|'BODY_LIMIT'|'ANSWER_LIMIT'|'ALTERNATE_LIMIT'|'SOURCE_LIMIT'|'KIND_INVALID';
export function validateEntry(e:Entry,status:Entry['status']):ValidationCode[]{
 const errors:ValidationCode[]=[];
 if(!studioKinds.includes(e.kind))errors.push('KIND_INVALID');
 for(const field of ['title','body','answer','alternate'] as const){
  const b=e[field];
  if(!biShape(b)||b.id.length>fieldLimits[field]||b.en.length>fieldLimits[field])errors.push(({title:'TITLE_LIMIT',body:'BODY_LIMIT',answer:'ANSWER_LIMIT',alternate:'ALTERNATE_LIMIT'} as const)[field]);
 }
 if(typeof e.source!=='string'||e.source.length>fieldLimits.source)errors.push('SOURCE_LIMIT');
 if(!biShape(e.title)||!filled(e.title))errors.push('TITLE_REQUIRED');
 if(status==='published'){
  if(!biShape(e.body)||!filled(e.body))errors.push('BODY_REQUIRED');
  if(typeof e.source!=='string'||!e.source.trim())errors.push('SOURCE_REQUIRED');
  if(e.kind==='question'||e.kind==='flashcard'){if(!biShape(e.answer)||!filled(e.answer))errors.push('ANSWER_REQUIRED');}
  if(e.kind==='question'){
   if(!biShape(e.alternate)||!filled(e.alternate))errors.push('ALTERNATE_REQUIRED');
   else if(biShape(e.answer)&&filled(e.answer)&&(normalized(e.answer.id)===normalized(e.alternate.id)||normalized(e.answer.en)===normalized(e.alternate.en)))errors.push('ANSWER_DUPLICATE');
  }
 }
 return errors;
}
export function entryFields(e:Entry,status:Entry['status']):Omit<Entry,'key'>{
 return {kind:e.kind,title:tidy(e.title),body:tidy(e.body),answer:e.kind==='question'||e.kind==='flashcard'?tidy(e.answer):blankBi(),alternate:e.kind==='question'?tidy(e.alternate):blankBi(),source:e.source.trim(),status};
}
export function decodeEntry(key:string,value:unknown):Entry|null{
 if(!value||typeof value!=='object')return null;
 const e=value as Entry;
 if(!studioKinds.includes(e.kind)||!['draft','published'].includes(e.status)||!biShape(e.title)||!biShape(e.body)||!biShape(e.answer)||!biShape(e.alternate)||typeof e.source!=='string')return null;
 return {key,kind:e.kind,title:{...e.title},body:{...e.body},answer:{...e.answer},alternate:{...e.alternate},source:e.source,status:e.status};
}
export function filterEntries(entries:Entry[],kind:Kind,filter:StudioFilter,search:string){
 const q=normalized(search);
 return entries.filter(e=>e.kind===kind&&(filter==='all'||e.status===filter)&&(!q||normalized([e.title.id,e.title.en,e.body.id,e.body.en,e.source].join(' ')).includes(q)));
}
export function catalogSummary(entries:Entry[],state:CatalogState,rawCount=entries.length){
 if(state!=='ready')return null;
 const byKind:Record<Kind,number>={lesson:0,question:0,flashcard:0,reference:0,molecule:0};
 let published=0,draft=0;
 for(const e of entries){byKind[e.kind]++;if(e.status==='published')published++;else draft++;}
 return {total:entries.length,published,draft,byKind,capped:rawCount>=100};
}
export const validGuidance=(guide:unknown):guide is Bi=>biShape(guide)&&guide.id.length<=fieldLimits.guide&&guide.en.length<=fieldLimits.guide;
export const canWriteStudio=(session:{role:string;roleReady:boolean;user:unknown;db:unknown},view:CatalogState)=>session.role==='moduler'&&session.roleReady&&!!session.user&&!!session.db&&view==='ready';
export type StudioError='PERMISSION'|'CONNECTION'|'QUOTA'|'FAILED';
export function studioErrorCode(e:unknown):StudioError{
 const code=e&&typeof e==='object'&&'code' in e?String(e.code).split('/').pop():'';
 if(code==='permission-denied'||code==='unauthenticated')return 'PERMISSION';
 if(code==='unavailable'||code==='deadline-exceeded'||code==='cancelled'||code==='aborted')return 'CONNECTION';
 if(code==='resource-exhausted')return 'QUOTA';
 return 'FAILED';
}
