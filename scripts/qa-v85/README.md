# V8.5 Real visual QA

Run in the project root after building/deploying V8.5. The V8.4 native diagnostic helper must remain installed in `scripts/android-v84`.

```powershell
# Live Vercel desktop + mobile browser screens:
node scripts/qa-v85/visual-qa-v85.mjs --url https://el-kimiya.vercel.app/ --role both
# Actual installed Android 0.8.5 only:
$adb = "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe"
node scripts/qa-v85/visual-qa-v85.mjs --url https://el-kimiya.vercel.app/ --adb $adb --android-only --role both
# For local preview (start npm run preview -- --host 127.0.0.1 --port 4173 separately):
node scripts/qa-v85/visual-qa-v85.mjs
# Unit tests (offline):
node --test scripts/qa-v85/test-visual-v85.mjs
```

The browser is headed and uses isolated, temporary contexts. Login manually with the learner and Moduler demo accounts only when prompted; credentials are never read, retained or logged. WebView uses the existing real authenticated session. If the required role differs, sign out and login manually on the phone. Screenshots may reveal your own account/profile text and drafts, so review before sharing. No CRUD mutations or simulated AI success occur.

Full expected matrix: 17 learner + 9 Moduler routes, 2 themes × 2 languages × desktop/mobile = **208 authenticated screenshots**, plus **40 public screenshots** (landing, guest, sign-in, registration and reset forms). Adding actual phone audit adds 104 authenticated screenshots. `--quick` restricts to dark/ID only and cannot certify full QA. `--role learner` or `--role moduler` narrows scope. `--serial <adb serial>` selects among multiple devices, `--browser-exe <path>` points to a locally installed browser. If Playwright has no Chromium, install it using the project's Playwright dependency (`npx playwright install chromium`), or use installed Edge/Chrome.

Checks actual V8.5 workspace marker, route/language/theme switching by UI controls, screenshot capture, real viewport horizontal overflow, no visible bottom navigation, and full-height mobile drawer with every role's expected route, focus and close behavior. Session splash geometry and lower-corner theme background are sampled only if present during real page load; solid-color or opaque gradient stops can verify the background, while an unobserved splash is WARN, not PASS. Native Android splash may appear before the WebView CDP attaches and remains explicitly unverified if not captured. Text contrast is an approximation over visible solid backgrounds only, not gradients, icon strokes, semantic translation or accessibility certification. A successful screenshot audit does not prove Firestore CRUD, AI inference or device release behavior. Those require their own tests.

Reports are in `reports/visual-v85/report.json` and `reports/visual-v85/screenshots/`. Nonzero exit means not fully verified. No report or image is uploaded anywhere. If localhost App Check forbids access, use the verified Vercel URL. Do not bypass Firebase protections just to make QA green.
