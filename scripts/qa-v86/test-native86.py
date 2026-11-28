"""Source contracts for the actual Android 0.8.6 shell; real device QA is separate."""
from pathlib import Path
from xml.etree import ElementTree as ET
r=Path(__file__).resolve().parents[2]
main=(r/'android/app/src/main/java/com/menstrue/elkimiya/MainActivity.kt').read_text(encoding='utf-8')
gradle=(r/'android/app/build.gradle.kts').read_text(encoding='utf-8')
manifest=ET.parse(r/'android/app/src/main/AndroidManifest.xml')
ns='{http://schemas.android.com/apk/res/android}'
activity=next(a for a in manifest.iter('activity') if a.get(ns+'name')=='.MainActivity')
qa=(r/'scripts/qa-v85/visual-qa-v85.mjs').read_text(encoding='utf-8')
html=(r/'index.html').read_text(encoding='utf-8')
checks={
    'APK version 0.8.6': 'versionCode = 6' in gradle and 'versionName = "0.8.6"' in gradle,
    'native shell demands web polish 8.6': 'WEB_POLISH_86 = "8.6"' in main and "getAttribute('data-elk-polish-release') !== '$WEB_POLISH_86'" in main and 'data-elk-polish-release="8.6"' in html and 'data-elk-molecule-release="8.6.1"' in html and "getAttribute('data-elk-molecule-release') !== '$WEB_MOLECULE_861'" in main,
    'viewport respects CSS mobile geometry': 'settings.useWideViewPort = true' in main and 'settings.loadWithOverviewMode = false' in main,
    'rotation preserves the WebView editor': {'orientation','screenSize','screenLayout','smallestScreenSize'} <= set(activity.get(ns+'configChanges','').split('|')),
    'native back prioritizes molecule fullscreen': '[data-elk-molecule-fullscreen]' in main and main.index('[data-elk-molecule-fullscreen]') < main.index('[data-elk-drawer-open='),
    'native AI and HTTPS origin preserved': 'ElKimiyaAndroid/8.3' in main and 'NativeAiBridge83(this@MainActivity, this)' in main and 'settings.mixedContentMode = WebSettings.MIXED_CONTENT_NEVER_ALLOW' in main and 'settings.allowFileAccess = false' in main,
    'real-device gate verifies new APK and native Back': 'ANDROID_V86_APK_REQUIRED' in qa and 'KEYCODE_BACK' in qa and 'MOLECULE_NATIVE_BACK' in qa and 'VIEWER_FULLSCREEN' in qa,
}
for name,ok in checks.items(): print(('[PASS] ' if ok else '[FAIL] ')+name)
raise SystemExit(not all(checks.values()))
