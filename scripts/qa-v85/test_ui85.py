"""V8.5 source, routing and explicit color-pair regression checks.
Static checks are not a claim of production browser/device validation."""
from pathlib import Path
import sys,re
p=Path(sys.argv[1] if len(sys.argv)>1 else 'ui85/src')
app=(p/'App.tsx').read_text(); main=(p/'main.tsx').read_text(); splash=(p/'v8/SessionBoundary.tsx').read_text(); lang=(p/'lib/language.tsx').read_text(); css=(p/'v8/design85.css').read_text() if (p/'v8/design85.css').exists() else ""
routes=((p/'v8/routes81.ts')).read_text()
expected=set(re.findall(r"'([^']+)'",re.search(r'const learnerRoutes = new Set\(\[(.*?)\]\)',routes).group(1)))
nav=app[app.index("const navItems:"):app.index("const books =")]
nav_ids=re.findall(r'id: "([^"]+)"',nav)
checks={
'all 17 route entries in one shared list':len(nav_ids)==17 and set(nav_ids)==expected,
'bottom navigation removed from real DOM':'MobileBottomNav' not in app and 'className="mobile-nav"' not in app,
'learner desktop and drawer share route navigation':'data-elk-route={item.id}' in app and 'data-elk-drawer-open' in app,
'accessible hamburger and close controls':'data-elk-drawer-toggle' in app and 'aria-expanded=' in app and 'aria-controls="elk-drawer"' in app and 'data-elk-drawer-close' in app,
'native modal and overlay close':'dialog.showModal()' in app and 'event.target===event.currentTarget' in app and 'onCancel=' in app,
'route/back closes drawer': bool(re.search(r'handler=\(\)=>\{setMenu85\(false\);setCurrentPage\(hashPage\(\)\)',app)),
'desktop permanent navigation preserves native security check':'v82-session-nav' in app and 'className="app-shell"' in app and 'className="page-entrance"' in app,
'V84 and V85 readiness alongside native role/session attributes': all(x in app for x in ['data-elk-ui-v84','data-elk-ui-v85','data-elk-ai-v83','data-elk-ai-session']),
'splash actual session guard and root marker':'data-elk-splash' in splash and 'ready&&(!user||roleReady)&&!roleIssue' in splash and 'bindLearningScope(target)' in splash,
'full viewport splash and root canvas':all(x in css for x in ['#root','100dvh','[data-elk-splash]','place-items:center']),
'old mobile bottom reservation removed':'.app-shell' in css and 'padding-bottom:0' in css and 'env(safe-area-inset-bottom)' in css,
'screenshot raw Markdown rendered only as live response':'<RichAnswer85 text={message.text}' in app and '<RichAnswer85 text={liveResult}' in app,
'design overrides loaded after V84':main.find("design85.css")>main.find("visual84.css"),
'theme and language controls have QA selectors':'data-elk-theme-toggle' in app and 'data-elk-language="id"' in lang and 'data-elk-language="en"' in lang,
'drawer fits viewport and scrolls':'.v85-drawer' in css and 'max-height:none' in css and 'overflow-y:auto' in css,
'toast uses paired colors, not white on white':'.app.dark .toast' in css and '--v85-toast-bg' in css and '--v85-toast-ink' in css,
'screenshot dark tutor provenance and button pairs':'.source-box' in css and '.v83-tutor-tools' in css and '.source-box > span' in css,
}
for k,v in checks.items():print(('PASS' if v else 'FAIL')+' '+k)
raise SystemExit(0 if all(checks.values()) else 1)
