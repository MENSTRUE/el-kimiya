// Read only structural state; never read storage or identity.
export const snapshotExpression = `(()=>{
 const has=s=>!!document.querySelector(s);
 const trusted=location.origin==='https://el-kimiya.vercel.app'&&location.pathname==='/'&&window===window.top;
 if(!trusted)return {trusted:false,route:'OTHER'};
 const route=location.hash.slice(1);
 const allowed=['landing','guest','account','register','reset','dashboard','mission','library','faith','reader','tutor','hybrid','practice','explorer','molecules','flashcards','progress','notes','settings','scan','profile','about','moduler'];
 const session=has('.v81-session'), shell=has('.app-shell .page-entrance');
 const marker=has('[data-elk-ai-v83="learner"]');
 const el=document.querySelector('[data-elk-ai-v83="learner"]');
 const gate=marker&&shell&&!has('.v81-moduler,.v81-admin-nav,.v81-session,.v81-auth,.landing-page,.v82-guest-preview')&&has('.sidebar .v82-session-nav')&&/^[A-Za-z0-9-]{12,100}$/.test(el?.getAttribute('data-elk-ai-session')||'');
 const roleError=session&&has('.v81-session .v8-actions');
 const auth=has('.v81-auth');
 const account=route==='account';
 const loginReady=auth&&account&&has('.v81-auth form input[type=email]')&&has('.v81-auth form input[autocomplete=current-password]')&&has('.v81-auth form button[type=submit]:not(:disabled)');
 const loginError=auth&&account&&has('.v81-auth .v81-error[role=alert]');
 return {trusted:true,web84:has('[data-elk-ui-v84="ready"]'),route:allowed.includes(route)?route:route?'OTHER':'landing',ready:document.readyState!=='loading',session,roleError,shell,marker,gate,auth,account,loginReady,loginError,landing:has('.landing-page'),guest:has('.v82-guest-preview'),moduler:has('.v81-moduler,.v81-admin-nav'),hybrid:has('.live-hybrid-check'),tutor:has('.composer textarea'),bridge:typeof window.ElKimiyaAI83?.postMessage==='function'};
})()`;
export function classifySurface(s) {
 if(!s)return 'LOADING';
 if(s.trusted===false)return 'UNTRUSTED';
 if(s.session)return s.roleError?'ROLE_ERROR':'SESSION_PENDING';
 if(s.moduler)return 'MODULER';
 if(s.auth)return s.account?'LOGIN':'OTHER_AUTH';
 if(s.landing)return 'LANDING';
 if(s.guest)return 'GUEST';
 if(s.shell)return s.marker?'LEARNER':'OLD_WORKSPACE';
 return 'LOADING';
}
export const inspectWorkspace=async cdp=>{
 const s=await cdp.evaluate(snapshotExpression,5000);
 return {...s,surface:classifySurface(s)};
};
const delay=ms=>new Promise(r=>setTimeout(r,ms));
export async function prepareWorkspace(io,{pause=delay,attempts=90,retryEvery=4,login,observe=()=>{},destination='hybrid'}={}) {
 let last=null, lastAction='', actionAt=-Infinity, loginAttempted=false, previous='';
 for(let i=0;i<attempts;i++){
  try{last=await io.inspect();}catch{await pause(1000);continue;}
  const fingerprint=[last.surface,last.route,last.gate,last.bridge,last.loginReady,last.loginError,last.hybrid,last.tutor,last.web84].join('|');
  if(fingerprint!==previous){observe(last);previous=fingerprint;}
  const {surface,route,gate,bridge,loginReady,loginError}=last;
  if(surface==='UNTRUSTED')throw Error('UNTRUSTED_WEBVIEW_ORIGIN');
  if(surface==='MODULER')throw Error('LEARNER_ACCOUNT_REQUIRED');
  if(surface==='LEARNER'&&gate&&bridge&&route===destination&&last[destination]===true)return last;
  // Never navigate while auth/Firestore initialization is in flight.
  let next=null;
  if(['LANDING','GUEST','OTHER_AUTH'].includes(surface))next='account';
  if(surface==='LEARNER'&&gate&&bridge&&(route!==destination||last[destination]!==true))next=destination;
  if(next&&(lastAction!==next||i-actionAt>=retryEvery)){
   try{await io.route(next);}catch{/* navigation may reload */ }
   lastAction=next;actionAt=i;
  }
  if(surface==='LOGIN'&&loginReady){
   if(loginAttempted&&loginError)throw Error('LEARNER_LOGIN_REJECTED');
   if(!loginAttempted){
    if(!login)throw Error('LEARNER_LOGIN_REQUIRED');
    loginAttempted=true;
    await login();
   }
  }
  await pause(1000);
 }
 if(!last)throw Error('WEBVIEW_STATE_UNAVAILABLE');
 const codes={ROLE_ERROR:'FIRESTORE_ROLE_VERIFICATION_FAILED',SESSION_PENDING:'SESSION_VERIFICATION_TIMEOUT',OLD_WORKSPACE:'V83_LEARNER_MARKER_MISSING',LOGIN:loginAttempted?'LEARNER_LOGIN_TIMEOUT':'LEARNER_LOGIN_REQUIRED',LANDING:'HOMEPAGE_NAVIGATION_FAILED',GUEST:'GUEST_NAVIGATION_FAILED',OTHER_AUTH:'AUTH_NAVIGATION_FAILED',LOADING:'WEB_APP_RENDER_TIMEOUT'};
 if(last.surface==='LEARNER'){
  if(!last.gate)throw Error('LEARNER_SESSION_GATE_INCOMPLETE');
  if(!last.bridge)throw Error('NATIVE_BRIDGE_MISSING');
  throw Error(destination.toUpperCase()+'_ROUTE_CONTENT_MISSING');
 }
 throw Error(codes[last.surface]||'WEBVIEW_STATE_UNAVAILABLE');
}
