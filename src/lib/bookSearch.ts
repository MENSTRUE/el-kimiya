import { bookById } from '../data/books';
export type PrivatePage = {bookId:string; pdfPage:number; text:string};
export type PrivateIndex = {schemaVersion:1; generatedAt:string; pages:PrivatePage[]};
export type SearchHit = PrivatePage & {score:number; title:string};
const STOP = new Set(['the','and','for','with','this','that','dari','yang','dalam','atau','pada','untuk','dan','apa','bagaimana','why','how','what','is','are','a','an','di','ke','ini','itu','saya','kamu','buku']);
export function terms(text:string):string[]{return [...new Set((text.toLocaleLowerCase('id').match(/[\p{L}\p{N}]{3,}/gu)||[]).filter(w=>!STOP.has(w)))];}
export function parsePrivateIndex(value:unknown):PrivateIndex {
  if(!value || typeof value!=='object')throw new Error('Invalid index file.');
  const obj=value as Record<string,unknown>;
  if(obj.schemaVersion!==1 || !Array.isArray(obj.pages))throw new Error('Not an El-Kīmiyā index v1.');
  if(obj.pages.length>20_000)throw new Error('Index exceeds 20,000 pages.');
  const pages:PrivatePage[]=obj.pages.map((p:unknown)=>{
    if(!p || typeof p!=='object')throw new Error('Malformed PDF page entry.');
    const row=p as Record<string,unknown>;
    if(typeof row.bookId!=='string'||typeof row.pdfPage!=='number'||!Number.isSafeInteger(row.pdfPage)||row.pdfPage<1||typeof row.text!=='string'||row.text.length>5000)throw new Error('Malformed PDF page metadata.');
    if(!bookById(row.bookId))throw new Error('Unknown book id in private index: '+row.bookId);
    return {bookId:row.bookId,pdfPage:row.pdfPage,text:row.text};
  });
  return {schemaVersion:1,generatedAt:String(obj.generatedAt || ''),pages};
}
export function searchIndex(index:PrivateIndex, query:string, max=5):SearchHit[]{
  const q=terms(query); if(!q.length)return [];
  return index.pages.map(page=>{
    const content=page.text.toLowerCase();const unique=terms(page.text);
    const wordSet=new Set(unique);
    const score=q.reduce((sum,term)=>sum+(wordSet.has(term)?3:content.includes(term)?1:0),0);
    return {...page,score,title:bookById(page.bookId)?.title??page.bookId};
  }).filter(hit=>hit.score>0).sort((a,b)=>b.score-a.score||a.pdfPage-b.pdfPage).slice(0,max);
}
export function contextForPrompt(question:string,hits:SearchHit[]):string{
  const excerpts=hits.slice(0,3).map(h=>`[SOURCE: ${h.title}, PDF page ${h.pdfPage}]\n${h.text.slice(0,1050)}`).join('\n\n');
  return `You are El-Kīmiyā, an educational chemistry tutor. Explain accurately in simple language. Separate experimentally testable chemistry facts from Islamic interpretations. NEVER invent page numbers, Quran verses, tafsir quotes, or references. Use only the source excerpts below for source-backed claims, citing the exact PDF page number indicated. If excerpts are insufficient, say so. Do not provide dangerous experimental procedures.\n\nQUESTION: ${question.slice(0,500)}\n\nPRIVATE USER-SELECTED PDF EXCERPTS:\n${excerpts}`;
}
