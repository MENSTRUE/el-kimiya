import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createMatrix, trustedUrl, screenshotName, summarize, contrastRatio, classifyAudit, splashVerdict} from './visual-core-v85.mjs';
test('covers every workspace section across two themes, languages and viewports', ()=>{
 const m=createMatrix('both',['desktop','mobile']);assert.equal(m.length,208);
 const unique=new Set(m.map(x=>[x.role,x.viewport,x.theme,x.language,x.route].join(':')));
 assert.equal(unique.size,208);
 assert.equal(m.filter(x=>x.role==='learner').length,136);
 assert.equal(m.filter(x=>x.role==='moduler').length,72);
 for(const route of ['reader','scan','profile','about','hybrid'])assert.ok(m.some(x=>x.role==='learner'&&x.route===route));
 for(const route of ['overview','lesson','question','flashcard','reference','molecule','ai','profile','about'])assert.ok(m.some(x=>x.role==='moduler'&&x.route===route));
});
test('requires exact trusted app root, not spoofed hostname, credentials or redirect', ()=>{
 assert.equal(trustedUrl('https://el-kimiya.vercel.app/#dashboard'),'https://el-kimiya.vercel.app/');
 assert.equal(trustedUrl('http://127.0.0.1:4173/#landing'),'http://127.0.0.1:4173/');
 assert.throws(()=>trustedUrl('https://el-kimiya.vercel.app.example.com/'));
 assert.throws(()=>trustedUrl('https://x@el-kimiya.vercel.app/'));
 assert.throws(()=>trustedUrl('https://el-kimiya.vercel.app/foo'));
 assert.throws(()=>trustedUrl('http://el-kimiya.vercel.app/'));
});
test('file names do not contain URLs, credentials, separators or unexpected values', ()=>{
 assert.equal(screenshotName({role:'moduler',viewport:'mobile',theme:'dark',language:'en',route:'lesson'}),'moduler-mobile-dark-en-lesson.png');
 assert.throws(()=>screenshotName({role:'../secret',viewport:'mobile',theme:'dark',language:'en',route:'lesson'}));
});
test('cannot pass stale UI, wrong role, clipped drawer, visible bottom navigation or missed route', ()=>{
 const base={ready:true,role:'learner',theme:'dark',language:'en',route:'dashboard',width:390,overflow:0,bottomNav:false,drawerVisible:false,contrastFailures:0,contrastMeasured:1};
 const expected={role:'learner',viewport:'mobile',theme:'dark',language:'en',route:'dashboard'};
 assert.equal(classifyAudit(base,expected).status,'PASS');
 assert.equal(classifyAudit({...base,ready:false},expected).status,'FAIL');
 assert.equal(classifyAudit({...base,role:'moduler'},expected).status,'FAIL');
 assert.equal(classifyAudit({...base,route:'tutor'},expected).status,'FAIL');
 assert.equal(classifyAudit({...base,bottomNav:true},expected).status,'FAIL');
 assert.equal(classifyAudit({...base,drawerVisible:true},expected).status,'FAIL');
 assert.equal(classifyAudit({...base,overflow:5},expected).status,'FAIL');
 assert.equal(classifyAudit({...base,language:'id'},expected).status,'FAIL');
 assert.equal(classifyAudit({...base,contrastFailures:1},expected).status,'FAIL');
 assert.equal(classifyAudit({...base,contrastMeasured:0},expected).status,'WARN');
});
test('contrast math follows WCAG relative luminance',()=>{
 assert.equal(contrastRatio([0,0,0],[255,255,255]),21);
 assert.equal(contrastRatio([10,10,10],[10,10,10]),1);
 assert.ok(contrastRatio([111,111,111],[255,255,255])>4.5);
});
test('summary counts every blocked and missing route; any failure means not certified', ()=>{
 const matrix=createMatrix('learner',['desktop']);
 const out=summarize([ {...matrix[0],status:'PASS'}, {...matrix[1],status:'FAIL'}, {...matrix[2],status:'BLOCKED'} ],matrix);
 assert.deepEqual(out,{expected:68,pass:1,fail:1,warn:0,blocked:66,certified:false});
});

test('full-height wrapper still fails dark splash with a white lower background', ()=>{
 const p={width:390,height:844,surface:{left:0,top:0,right:390,bottom:844},theme:'dark',contentCenterOffset:2,samples:[{luminance:.08},{luminance:.9}]};
 assert.equal(splashVerdict(p).status,'FAIL');
 assert.equal(splashVerdict({...p,samples:[{luminance:.08},{luminance:.08}]}).status,'PASS');
 assert.equal(splashVerdict({...p,samples:[]}).status,'WARN');
 assert.equal(splashVerdict({...p,surface:{...p.surface,bottom:500}}).status,'FAIL');
});
