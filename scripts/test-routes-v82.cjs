const assert=require('node:assert/strict');
const path=require('node:path');
const root=process.argv[2]||process.cwd();
const routeFile=path.resolve(root,'src/v8/routes81.ts');
let resolveRoute;
try {
 const ts=require(require.resolve('typescript',{paths:[root]}));
 const Module=require('node:module');
 const src=require('node:fs').readFileSync(routeFile,'utf8');
 const m=new Module(routeFile,module);
 m._compile(ts.transpileModule(src,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,routeFile);
 resolveRoute=m.exports.resolveRoute;
} catch(e) {
 if(e.code!=='MODULE_NOT_FOUND')throw e;
 resolveRoute=require(routeFile).resolveRoute;
}
const learning=['dashboard','mission','library','faith','reader','tutor','hybrid','practice','explorer','molecules','flashcards','progress','notes','settings','scan','profile','about','moduler','onboarding'];
for (const route of learning) {
  assert.equal(resolveRoute(route,'guest',false),'account',`guest direct #${route}`);
  assert.equal(resolveRoute(route,'guest',true),'account',`guest with stale V8.1 permission #${route}`);
}
for (const route of ['landing','guest','account','register','reset']) assert.equal(resolveRoute(route,'guest'),route);
for (const role of ['user','moduler']){
  assert.equal(resolveRoute('landing',role),'landing',`home for ${role}`);
  for (const route of ['account','register','reset','guest','onboarding']) assert.equal(resolveRoute(route,role),role==='user'?'dashboard':'moduler');
}
for (const route of learning.filter(r=>r!=='onboarding')) {
 assert.equal(resolveRoute(route,'user'),route==='moduler'?'dashboard':route);
 assert.equal(resolveRoute(route,'moduler'),'moduler');
}
console.log('[PASS] 87 route assertions: guest locked, stale access ignored, both roles can go home; cross-role routing.');
