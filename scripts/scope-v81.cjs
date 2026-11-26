// Use the project's TypeScript parser rather than blindly replacing source text.
const fs=require('node:fs'), path=require('node:path');
const root=process.argv[2];const apply=process.argv.includes('--apply');
const ts=require(require.resolve('typescript',{paths:[process.argv[3] || root]}));
const src=path.join(root,'src');
const excludes=new Set(['main.tsx','v8/learningStorage.ts','v8/SessionBoundary.tsx']);
function walk(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(d=>d.isDirectory()?walk(path.join(dir,d.name)):[path.join(dir,d.name)]);}
const changes={};
for(const file of walk(src).filter(f=>/\.[jt]sx?$/.test(f)&&!f.endsWith('.d.ts'))){
 const rel=path.relative(src,file).replaceAll('\\','/');if(excludes.has(rel))continue;
 const text=fs.readFileSync(file,'utf8');const sf=ts.createSourceFile(file,text,ts.ScriptTarget.Latest,true);
 const edits=[];
 function visit(n){
  if(ts.isPropertyAccessExpression(n)&&n.name.text==='localStorage'&&ts.isIdentifier(n.expression)&&['window','globalThis','self'].includes(n.expression.text)){edits.push([n.getStart(sf),n.end]);return;}
  if(ts.isElementAccessExpression(n)&&ts.isIdentifier(n.expression)&&['window','globalThis','self'].includes(n.expression.text)&&ts.isStringLiteral(n.argumentExpression)&&n.argumentExpression.text==='localStorage'){edits.push([n.getStart(sf),n.end]);return;}
  if(ts.isIdentifier(n)&&n.text==='localStorage'){
   if(ts.isPropertyAccessExpression(n.parent)&&n.parent.name===n)throw Error(`Unsupported storage receiver: ${rel}:${sf.getLineAndCharacterOfPosition(n.pos).line+1}`);
   if(ts.isPropertyAssignment(n.parent)&&n.parent.name===n)throw Error(`Unsupported storage alias: ${rel}`);
   edits.push([n.getStart(sf),n.end]);return;
  }
  ts.forEachChild(n,visit);
 }
 visit(sf);if(!edits.length)continue;
 if(text.includes('elkLearningStorage'))throw Error(`Storage alias conflict: ${rel}`);
 let next=text;for(const [a,b] of edits.sort((x,y)=>y[0]-x[0]))next=next.slice(0,a)+'elkLearningStorage'+next.slice(b);
 let imp=path.relative(path.dirname(file),path.join(src,'v8','learningStorage')).replaceAll('\\','/');if(!imp.startsWith('.'))imp='./'+imp;
 next=`import { learningStorage as elkLearningStorage } from '${imp}';\n`+next;
 const parsed=ts.createSourceFile(file,next,ts.ScriptTarget.Latest,true);if(parsed.parseDiagnostics.length)throw Error(`Scoped storage syntax error: ${rel}`);
 changes['src/'+rel]=next;
}
if(apply)for(const [rel,text] of Object.entries(changes))fs.writeFileSync(path.join(root,rel),text,'utf8');
else process.stdout.write(JSON.stringify(changes));
