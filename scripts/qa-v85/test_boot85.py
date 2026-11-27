import sys,re
from pathlib import Path
from xml.etree import ElementTree as ET
r=Path(sys.argv[1])
m=(r/'android/app/src/main/java/com/menstrue/elkimiya/MainActivity.kt').read_text(encoding='utf-8-sig')
html=(r/'index.html').read_text(encoding='utf-8-sig')
sw=(r/'public/sw.js').read_text(encoding='utf-8-sig')
gradle=(r/'android/app/build.gradle.kts').read_text()
checks={
'HTML release marker': 'data-elk-release="8.5"' in html,
'pre-React visible branded bootstrap': 'id="elk-boot85"' in html and 'elk-boot85-spinner' in html,
'HTML boot full viewport': 'min-height:100dvh' in html and 'place-items:center' in html and '[data-elk-theme=dark]' in html,
'HTML saved theme before mount': "localStorage.getItem('elk.dark')" in html and html.index("localStorage.getItem('elk.dark')") < html.index('<div id="root">'),
'native waits for actual rendered document': 'waitForWebPaint85' in m and 'postVisualStateCallback' in m,
'no immediate hide onPageFinished': 'firstDocument84 = false' not in m[m.index('override fun onPageFinished'):m.index('override fun doUpdateVisitedHistory')],
'native back closes drawer first': 'data-elk-drawer-open' in m and 'data-elk-drawer-close' in m,
'native stale release detection': "data-elk-release" in m and 'WEB_RELEASE_85' in m,
'native timeout recovery': 'MAX_PAINT_WAIT_85' in m and 'errorLoading = true' in m,
'origin and native gates intact': 'NativeAiBridge83(this@MainActivity, this)' in m and 'window.__elkV82NativeAllowed' in m and m.count('nativeAI83?.invalidate()')>=4,
'no forced algorithmic inversion': 'setAlgorithmicDarkeningAllowed(settings, false)' in m,
'service worker stays network first navigation': "cache:'no-store'" in sw and 'el-kimiya-app-shell-v85' in sw,
'APK version 0.8.5': 'versionCode = 5' in gradle and 'versionName = "0.8.5"' in gradle,
}
for n,v in checks.items(): print(('[PASS] ' if v else '[FAIL] ')+n)
raise SystemExit(not all(checks.values()))
