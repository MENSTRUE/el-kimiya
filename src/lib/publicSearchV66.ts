/** Pure search primitives for original, public chemistry lessons. No private book data. */
export type SearchableLesson = { id: string; text: string };
export type SearchMatch = { id: string; score: number };

const TOKENS = /[\p{L}\p{N}]+/gu;
const STOP = new Set(['di','ke','dan','yang','dari','dengan','pada','adalah','untuk','atau','ini','itu','of','the','and','what','which','for','from','with','about','into','are','is','an','a','to']);
export function tokens(input: string): string[] {
  return (input.toLocaleLowerCase().match(TOKENS) || []).filter(x => x.length > 1 && !STOP.has(x));
}
export function keywordRank(query: string, lessons: SearchableLesson[]): SearchMatch[] {
  const words = [...new Set(tokens(query))];
  if (!words.length) return lessons.map(x => ({id:x.id,score:0}));
  return lessons.map(lesson => {
    const body = lesson.text.toLocaleLowerCase();
    const set = new Set(tokens(body));
    const score = words.reduce((sum, w) => sum + (set.has(w) ? 4 : body.includes(w) ? 1 : 0), 0);
    return {id:lesson.id,score};
  }).filter(x=>x.score>0).sort((a,b)=>b.score-a.score);
}
export function cosine(a: ArrayLike<number>, b: ArrayLike<number>): number {
  if (!a.length || a.length !== b.length) return 0;
  let dot=0, aa=0, bb=0;
  for(let i=0;i<a.length;i++) {const x=a[i],y=b[i]; if(!Number.isFinite(x)||!Number.isFinite(y))return 0; dot+=x*y;aa+=x*x;bb+=y*y;}
  return aa>0&&bb>0?dot/Math.sqrt(aa*bb):0;
}
export function semanticRank(queryVector: ArrayLike<number>, entries: {id:string;vector:ArrayLike<number>}[]): SearchMatch[] {
  return entries.map(entry=>({id:entry.id,score:cosine(queryVector,entry.vector)})).sort((a,b)=>b.score-a.score);
}
