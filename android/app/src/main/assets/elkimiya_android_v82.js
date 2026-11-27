/* ELKIMIYA_ANDROID_WEB_V82. Only injected by the Android WebView. */
(function () {
  'use strict';
  const ORIGIN = 'https://el-kimiya.vercel.app';
  const WORKSPACE = new Set(['dashboard','mission','library','faith','reader','tutor','hybrid','practice','explorer','molecules','flashcards','progress','notes','settings','scan','profile','about']);
  function canUseWorkspace(s) {
    return s.origin === ORIGIN && s.path === '/' && s.learner === true &&
      s.publicOrAdmin === false && WORKSPACE.has(String(s.hash).replace(/^#/, ''));
  }
  function canUseNative(s) {
    return canUseWorkspace(s) && (s.hash === '#tutor' || s.hash === '#hybrid');
  }
  if (typeof module === 'object' && module.exports) {
    module.exports = {canUseNative, canUseWorkspace};
    return;
  }
  if (location.origin !== ORIGIN || window.top !== window || window.__elkV82Installed) return;
  const bridge = window.ElKimiyaDownload;
  if (!bridge || typeof bridge.postMessage !== 'function') return;
  window.__elkV82Installed = true;
  function send(packet) { try { bridge.postMessage(JSON.stringify(packet)); } catch (_) {} }
  function surface() {
    return {
      origin:location.origin,path:location.pathname,hash:location.hash,
      learner:!!document.querySelector('.sidebar .v82-session-nav') &&
        !!document.querySelector('.app-shell .page-entrance'),
      publicOrAdmin:!!document.querySelector('.landing-page,.v81-auth,.v82-guest-preview,.v81-session,.v81-moduler,.v81-admin-nav')
    };
  }
  window.__elkV82NativeAllowed = () => canUseNative(surface());
  window.__elkV82WorkspaceAllowed = () => canUseWorkspace(surface());
  const lang = () => document.documentElement.lang === 'en' ? 'en' : 'id';
  let lastAllowed = null, lastPrefs = '', scheduled = false;
  const style = document.createElement('style');
  style.id = 'elkimiya-android-shell-v82';
  style.textContent = [
    '#elk-v82-native-card{display:flex;align-items:center;justify-content:space-between;gap:13px;flex-wrap:wrap;margin:12px 16px 4px;padding:14px 16px;border:1px solid var(--v8-line,#d8e2e5);border-radius:14px;background:var(--v8-bg,#fff);color:var(--v8-ink,#133b55)}',
    '#elk-v82-native-card strong{font-size:14px;display:block;margin-bottom:4px}',
    '#elk-v82-native-card small{font-size:12px;display:block;color:var(--v8-muted,#617686);line-height:1.4}',
    '#elk-v82-native-card button{display:inline-flex;align-items:center;justify-content:center;min-height:43px;padding:9px 15px;flex-shrink:0;border-radius:9px;background:#133b55;color:#fff;font-weight:700;font-size:13px;border:1px solid transparent}',
    '.app.dark #elk-v82-native-card{background:#162f42;color:#f3f5f1;border-color:#385364}',
    '.app.dark #elk-v82-native-card small{color:#c0d2dc}',
    '.app.dark #elk-v82-native-card button{background:#b5d7e2;color:#0c1e30}',
    '@media(max-width:380px){#elk-v82-native-card button{width:100%}}'
  ].join('\n');
  (document.head || document.documentElement).appendChild(style);
  function updateText(el,text) { if(el.textContent !== text) el.textContent = text; }
  function renderCard(allowed) {
    let card = document.getElementById('elk-v82-native-card');
    // ELKIMIYA_V83_UNIFIED: old website compatibility only; new website has one AI UI.
    if(document.querySelector('[data-elk-ai-v83="learner"]')){if(card)card.remove();return;}
    const target = document.querySelector('.app-shell .page-entrance');
    if (!allowed || !target) { if(card)card.remove(); return; }
    if (!card) {
      card = document.createElement('section'); card.id = 'elk-v82-native-card';
      card.setAttribute('aria-label','Android Hybrid AI');
      const description = document.createElement('div');
      description.append(document.createElement('strong'),document.createElement('small'));
      const action = document.createElement('button'); action.type = 'button';
      action.addEventListener('click', () => {
        if (window.__elkV82NativeAllowed()) send({kind:'native-ai'});
      });
      card.append(description, action);
    }
    if(card.parentElement !== target) target.prepend(card);
    const en=lang()==='en';
    updateText(card.querySelector('strong'),en?'Android Hybrid AI':'Hybrid AI Android');
    updateText(card.querySelector('small'),en?'Check device support and actual inference source.':'Periksa dukungan perangkat dan sumber inferensi aktual.');
    updateText(card.querySelector('button'),en?'Open native AI':'Buka AI native');
  }
  function sync() {
    scheduled=false;
    const allowed=window.__elkV82NativeAllowed();
    if(lastAllowed!==allowed){lastAllowed=allowed;send({kind:'native-access',allowed});}
    renderCard(allowed);
    // Sync only after a V8.2 surface renders; no account/session data crosses the bridge.
    if(document.querySelector('[data-web-version="8.2"],.sidebar .v82-session-nav')){
      let dark=null;
      try { const raw=localStorage.getItem('elk.dark');if(raw==='true'||raw==='false')dark=raw==='true'; }catch(_){}
      const prefs={kind:'preferences',language:lang(),dark};
      const encoded=JSON.stringify(prefs);
      if(encoded!==lastPrefs){lastPrefs=encoded;send(prefs);}
    }
  }
  function schedule() {
    if(scheduled)return;
    scheduled=true;
    setTimeout(sync,0);
  }
  new MutationObserver(schedule).observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['class','lang']});
  window.addEventListener('hashchange',schedule);
  window.addEventListener('popstate',schedule);
  document.addEventListener('click',() => setTimeout(schedule,120),true);
  window.addEventListener('pagehide',()=>send({kind:'native-access',allowed:false}));
  document.addEventListener('visibilitychange',schedule);
  const browserPrint=typeof window.print==='function'?window.print.bind(window):()=>{};
  window.print=function(){if(window.__elkV82WorkspaceAllowed())send({kind:'print'});else browserPrint();};
  document.addEventListener('click',function(ev){
    const a=ev.target && ev.target.closest ? ev.target.closest('a[download]') : null;
    if(!a||!a.href||!a.href.startsWith('blob:')||!window.__elkV82WorkspaceAllowed())return;
    ev.preventDefault();ev.stopImmediatePropagation();
    fetch(a.href).then(r=>r.blob()).then(blob=>{
      if(blob.size>2097152){alert(lang()==='en'?'Report exceeds 2 MB.':'Laporan melebihi batas 2 MB.');return;}
      const reader=new FileReader();
      reader.onload=()=>{if(window.__elkV82WorkspaceAllowed())send({kind:'download',name:a.getAttribute('download')||'ElKimiya_Report.json',mime:blob.type||'text/plain',data:reader.result});};
      reader.readAsDataURL(blob);
    }).catch(()=>alert(lang()==='en'?'Unable to prepare report.':'Gagal menyiapkan laporan.'));
  },true);
  sync();
})();
