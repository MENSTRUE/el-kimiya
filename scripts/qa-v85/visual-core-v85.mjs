export const LEARNER_ROUTES=['dashboard','mission','library','faith','reader','tutor','hybrid','practice','explorer','molecules','flashcards','progress','notes','settings','scan','profile','about'];
export const MODULER_ROUTES=['overview','lesson','question','flashcard','reference','molecule','ai','profile','about'];
export const THEMES=['light','dark'], LANGUAGES=['id','en'];
export const viewports={desktop:{width:1440,height:900},mobile:{width:390,height:844}};
export function createMatrix(role='both',sizes=['desktop','mobile']){
 const roles=role==='both'?['learner','moduler']:[role];
 if(roles.some(r=>!['learner','moduler'].includes(r))||sizes.some(s=>!['desktop','mobile','android'].includes(s)))throw Error('INVALID_MATRIX');
 return roles.flatMap(role=>sizes.flatMap(viewport=>THEMES.flatMap(theme=>LANGUAGES.flatMap(language=>(role==='learner'?LEARNER_ROUTES:MODULER_ROUTES).map(route=>({role,viewport,theme,language,route}))))));
}
export function trustedUrl(raw){
 const u=new URL(raw);
 if(u.username||u.password||u.pathname!=='/'||u.search)throw Error('UNTRUSTED_URL');
 if(u.origin==='https://el-kimiya.vercel.app')return u.origin+'/';
 if(u.protocol==='http:'&&['127.0.0.1','localhost'].includes(u.hostname)&&u.port)return u.origin+'/';
 throw Error('UNTRUSTED_URL');
}
export function screenshotName({role,viewport,theme,language,route}){
 if(!['learner','moduler','guest'].includes(role)||!['desktop','mobile','android'].includes(viewport)||!THEMES.includes(theme)||!LANGUAGES.includes(language)||![...LEARNER_ROUTES,...MODULER_ROUTES,'drawer','splash','landing','guest','account','register','reset'].includes(route))throw Error('INVALID_SCREEN_NAME');
 return [role,viewport,theme,language,route].join('-')+'.png';
}
export function contrastRatio(a,b){ // exported, also stringified in DOM audit below
 const luminance=c=>c.slice(0,3).map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((s,v,i)=>s+v*[.2126,.7152,.0722][i],0);
 const x=luminance(a),y=luminance(b);
 return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);
}
export function classifyAudit(observed,expected){
 const reasons=[];
 if(!observed.ready)reasons.push('V85_MARKER_MISSING');
 if(observed.role!==expected.role)reasons.push('WRONG_ROLE');
 if(observed.route!==expected.route)reasons.push('WRONG_ROUTE');
 if(observed.theme!==expected.theme)reasons.push('WRONG_THEME');
 if(observed.language!==expected.language)reasons.push('WRONG_LANGUAGE');
 if(observed.overflow>2)reasons.push('HORIZONTAL_OVERFLOW');
 if(observed.bottomNav)reasons.push('BOTTOM_NAV_VISIBLE');
 if(expected.viewport!=='desktop'&&observed.drawerVisible)reasons.push('DRAWER_REMAINS_OPEN');
 if(observed.contrastFailures>0)reasons.push('LOW_CONTRAST');
 if(reasons.length)return {status:'FAIL',reasons};
 if(!observed.contrastMeasured)return {status:'WARN',reasons:['CONTRAST_NOT_MEASURED']};
 return {status:'PASS',reasons:[]};
}
export function summarize(results,matrix){
 const key=x=>[x.role,x.viewport,x.theme,x.language,x.route].join(':');
 const index=new Map(results.map(x=>[key(x),x]));
 const counts={expected:matrix.length,pass:0,fail:0,warn:0,blocked:0};
 for(const x of matrix){const status=index.get(key(x))?.status?.toLowerCase();counts[['pass','fail','warn','blocked'].includes(status)?status:'blocked']++;}
 return {...counts,certified:counts.pass===counts.expected&&counts.expected>0};
}
// Browser evaluation functions: every function is self-contained for CDP serialization.
export function inspectPage(){
 const visible=e=>!!e&&e.getClientRects().length>0&&getComputedStyle(e).visibility!=='hidden'&&getComputedStyle(e).display!=='none'&&Number(getComputedStyle(e).opacity)>0&&e.getBoundingClientRect().right>0&&e.getBoundingClientRect().bottom>0&&e.getBoundingClientRect().left<innerWidth&&e.getBoundingClientRect().top<innerHeight;
 const mod=document.querySelector('.v81-moduler'),learner=document.querySelector('[data-elk-ai-v83="learner"]');
 const active=mod||learner;
 const publicRoot=document.querySelector('[data-elk-ui-v85="public"]');
 const routes=['landing','guest','account','register','reset','moduler','dashboard','mission','library','faith','reader','tutor','hybrid','practice','explorer','molecules','flashcards','progress','notes','settings','scan','profile','about','overview','lesson','question','flashcard','reference','molecule','ai'];
 const safeRoute=r=>routes.includes(r)?r:'OTHER';
 const theme=document.documentElement.dataset.elkTheme||((document.querySelector('.app')?.classList.contains('dark'))?'dark':'light');
 return {origin:location.origin,rootPath:location.pathname==='/',ready:!!active?.matches('[data-elk-ui-v85="ready"]')||!!active?.querySelector('[data-elk-ui-v85="ready"]'),role:mod?'moduler':learner?'learner':null,route:safeRoute(mod?mod.dataset.elkSection:(learner?.dataset.elkPage||location.hash.slice(1))),routeHash:safeRoute(location.hash.slice(1)),publicMarker:!!publicRoot,publicRoute:safeRoute(publicRoot?.dataset.elkPage),theme:['light','dark'].includes(theme)?theme:'OTHER',language:['id','en'].includes(document.documentElement.lang)?document.documentElement.lang:'OTHER',session:!!document.querySelector('.v81-session'),roleError:!!document.querySelector('.v81-session button'),auth:!!document.querySelector('.v81-auth'),landing:!!document.querySelector('.landing-page'),guest:!!document.querySelector('.v82-guest-preview'),width:innerWidth,height:innerHeight,drawerVisible:[...document.querySelectorAll('[data-elk-drawer]')].some(e=>e.getAttribute('aria-hidden')!=='true'&&visible(e)),drawerToggle:[...document.querySelectorAll('[data-elk-drawer-toggle]')].some(visible),bottomNav:[...document.querySelectorAll('.mobile-nav')].some(visible)};
}
export function clickVisible({selector,origin,role,scroll=false}){
 if(location.origin!==origin||location.pathname!=='/'||window!==window.top)return false;
 if(role==='learner'&&!document.querySelector('[data-elk-ai-v83="learner"][data-elk-ui-v85="ready"]'))return false;
 if(role==='moduler'&&!document.querySelector('.v81-moduler[data-elk-ui-v85="ready"]'))return false;
 for(const e of document.querySelectorAll(selector)){
  if(e.closest('[aria-hidden="true"],[inert]')||e.disabled)continue;
  const r=e.getBoundingClientRect(),style=getComputedStyle(e);
  if(!r.width||!r.height||r.right<=0||r.left>=innerWidth||style.display==='none'||style.visibility==='hidden')continue;
  if(scroll)e.scrollIntoView({block:'nearest',inline:'nearest'});
  const q=e.getBoundingClientRect();
  if(q.bottom<=0||q.top>=innerHeight)continue;
  e.click();return true;
 }
 return false;
}
export function auditPage(){
 const visible=e=>{
  if(e.closest('[aria-hidden="true"],[inert]'))return false;
  const r=e.getBoundingClientRect(),s=getComputedStyle(e);
  return r.width>0&&r.height>0&&r.right>0&&r.left<innerWidth&&r.bottom>0&&r.top<innerHeight&&s.visibility==='visible'&&s.display!=='none'&&Number(s.opacity)>.05;
 };
 const rgb=v=>{const nums=v.match(/[\d.]+/g)?.map(Number);return /^rgba?\(/.test(v)&&nums?.length>=3?[...nums.slice(0,3),nums[3]??1]:null;};
 const over=(front,back)=>[0,1,2].map(i=>front[i]*front[3]+back[i]*(1-front[3]));
 // Approximate text contrast only over solid backgrounds: skip images, gradients, opacity
 // and elements outside viewport. No text values or account identifiers are collected.
 const luminance=c=>c.slice(0,3).map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((s,v,i)=>s+v*[.2126,.7152,.0722][i],0);
 const ratio=(a,b)=>{const x=luminance(a),y=luminance(b);return(Math.max(x,y)+.05)/(Math.min(x,y)+.05);};
 const selector='button,a,input:not([type=hidden]),textarea,select,label,h1,h2,h3,h4,p,li,small,span';
 let contrastMeasured=0,contrastSkipped=0,contrastFailures=0;
 const details=[];
 for(const e of document.querySelectorAll(selector)){
  if(!visible(e)||e.closest('button:disabled,[aria-disabled="true"]')||!e.textContent?.trim()&&!(e.matches('input,textarea,select')))continue;
  // Only actual direct text or simple control text; nested UI is measured at its own node.
  if(!e.matches('button,a,input,textarea,select')&&![...e.childNodes].some(n=>n.nodeType===3&&n.textContent?.trim()))continue;
  const fg=getComputedStyle(e), color=rgb(fg.color);let stack=[],invalid=!color;
  for(let a=e;a&&!invalid;a=a.parentElement){
   const c=getComputedStyle(a);if(c.backgroundImage!=='none'||+c.opacity<.95||c.mixBlendMode!=='normal'){invalid=true;break;}
   const fill=rgb(c.backgroundColor);
   if(fill?.[3]>0){stack.push(fill);if(fill[3]===1)break;}
  }
  if(invalid||!stack.length||stack.at(-1)[3]!==1){contrastSkipped++;continue;}
  let bg=stack.pop().slice(0,3);while(stack.length)bg=over(stack.pop(),bg);
  const cr=ratio(over(color,bg),bg);
  const size=parseFloat(fg.fontSize),weight=parseInt(fg.fontWeight);
  const required=size>=24||size>=18.66&&weight>=700?3:4.5;
  contrastMeasured++;
  if(cr+0.02<required){
   contrastFailures++;
   // Record only tag and fixed semantic attribute, not user text/class names or input values.
   if(details.length<20){const region=['.toast','.ai-answer','.composer','.v8-card','.v8-studio','.sidebar','.v81-admin-nav','.page-entrance','.topbar','.landing-page','.v81-auth','.v82-guest-preview'].find(s=>e.closest(s));details.push({element:e.tagName.toLowerCase(),region:region||'OTHER',ratio:Math.round(cr*100)/100,required});}
  }
 }
 return {overflow:Math.max(0,document.documentElement.scrollWidth-innerWidth,document.body.scrollWidth-innerWidth),contrastMeasured,contrastFailures,contrastSkipped,contrastDetails:details};
}
export function inspectDrawer(){
 const nodes=[...document.querySelectorAll('[data-elk-drawer]')];
 const visible=nodes.find(e=>{const r=e.getBoundingClientRect();return e.getAttribute('aria-hidden')!=='true'&&r.width>0&&r.height>0&&r.right>0&&r.left<innerWidth&&r.top<innerHeight&&r.bottom>0&&getComputedStyle(e).visibility!=='hidden'&&!e.closest('[inert]')});
 if(!visible)return {visible:false};
 const r=visible.getBoundingClientRect();
 const nav=[...visible.querySelectorAll('[data-elk-route]')].map(e=>e.dataset.elkRoute);
 const uniqueRoutes=[...new Set(nav)];
 const navSurface=visible.querySelector('.v85-nav-surface');
 const painted=!!navSurface&&navSurface.contains(document.elementFromPoint(Math.min(r.right-8,r.left+100),Math.min(r.bottom-8,r.top+100)))&&navSurface.getBoundingClientRect().height>=r.height-4;
 const release=visible.getAttribute('data-elk-drawer-release')==='8.5.1';
 const toggle=[...document.querySelectorAll('[data-elk-drawer-toggle]')].find(e=>e.getBoundingClientRect().width>0&&getComputedStyle(e).display!=='none');
 return {visible:true,painted,release,coverage:Math.round(100*Math.min(r.height,innerHeight)/innerHeight),top:Math.round(r.top),bottom:Math.round(r.bottom),left:Math.round(r.left),right:Math.round(r.right),height:innerHeight,width:innerWidth,expanded:toggle?.getAttribute('aria-expanded')==='true',focusInside:visible.contains(document.activeElement),routes:uniqueRoutes.filter(x=>/^[a-z]+$/.test(x))};
}
export function splashVerdict(sample){
 if(!sample)return {status:'WARN',detail:'NOT_OBSERVED_DURING_ACTUAL_PAINT'};
 const {surface:s,width,height,contentCenterOffset,theme,samples}=sample;
 if(s.top>2||s.left>2||s.right<width-2||s.bottom<height-2)return {status:'FAIL',detail:'SPLASH_DOES_NOT_COVER_VIEWPORT'};
 if(contentCenterOffset!==null&&Math.abs(contentCenterOffset)>height*.2)return {status:'FAIL',detail:'SPLASH_NOT_CENTERED'};
 const points=(samples||[]).filter(s=>Number.isFinite(s?.luminance));
 if(theme==='dark'&&points.some(s=>s.luminance>.34))return {status:'FAIL',detail:'DARK_SPLASH_LIGHT_BACKGROUND_LEAK'};
 if(theme==='light'&&points.some(s=>s.luminance<.18))return {status:'FAIL',detail:'LIGHT_SPLASH_DARK_BACKGROUND_LEAK'};
 if(contentCenterOffset===null||points.length<2||!THEMES.includes(theme))return {status:'WARN',detail:'SPLASH_CENTER_OR_BACKGROUND_NOT_MEASURED'};
 return {status:'PASS',detail:'REAL_SESSION_SURFACE_MEASURED'};
}
export function inspectSplash(){
 const e=document.querySelector('[data-elk-splash],.v84-session-splash,.v81-session');
 if(!e)return null;
 const r=e.getBoundingClientRect();
 const center=e.querySelector('.v84-session-inner,[data-elk-splash-content]')?.getBoundingClientRect();
 const theme=document.documentElement.dataset.elkTheme||(e.closest('.dark')?'dark':'light');
 const lum=c=>c.map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((s,v,i)=>s+v*[.2126,.7152,.0722][i],0);
 // At the top and bottom corners, estimate *rendered* background from hit target
 // and ancestor fills. Skip non-solid backgrounds instead of falsely passing.
 const samples=[[4,4],[4,innerHeight-4],[innerWidth-4,innerHeight-4]].map(([x,y])=>{
  const top=document.elementFromPoint(x,y);let stack=[];
  for(let a=top;a;a=a.parentElement){
   const style=getComputedStyle(a);
   if(+style.opacity<.95)return null;
   if(style.backgroundImage!=='none'){
    const image=style.backgroundImage;
    if(!/^(?:radial|linear)-gradient\(/.test(image)||image.includes('url(')||stack.length)return null;
    const stops=[...image.matchAll(/rgba?\(([^)]+)\)/g)].map(m=>m[1].match(/[\d.]+/g)?.map(Number));
    if(stops.length<2||stops.some(c=>!c||c.length<3||c.length>3&&c[3]!==1))return null;
    // All-solid gradient stops bound the sampled luminance; worst-case is
    // intentionally conservative, and this is not a pixel-accurate screenshot.
    const range=stops.map(c=>lum(c.slice(0,3)));
    return {x,y,luminance:theme==='dark'?Math.max(...range):Math.min(...range),method:'gradient_stop_bound'};
   }
   const value=style.backgroundColor,nums=value.match(/[\d.]+/g)?.map(Number);
   if(!/^rgba?\(/.test(value)||!nums||nums.length<3)continue;
   const color=[...nums.slice(0,3),nums[3]??1];
   if(color[3]>0){stack.push(color);if(color[3]===1)break;}
  }
  if(!stack.length||stack.at(-1)[3]!==1)return null;
  let bg=stack.pop().slice(0,3);
  while(stack.length){const f=stack.pop();bg=[0,1,2].map(i=>f[i]*f[3]+bg[i]*(1-f[3]));}
  return {x,y,luminance:lum(bg)};
 });
 return {width:innerWidth,height:innerHeight,surface:{top:Math.round(r.top),left:Math.round(r.left),right:Math.round(r.right),bottom:Math.round(r.bottom)},contentCenterOffset:center?Math.round(center.top+center.height/2-innerHeight/2):null,theme,samples};
}
