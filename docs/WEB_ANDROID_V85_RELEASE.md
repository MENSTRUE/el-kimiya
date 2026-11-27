# El-Kīmiyā V8.5
Baseline: GitHub main, 30dbeafef53f2f6475ac5b65803873e0afd8406e (V8.4).
## Changes
- Full viewport boot HTML, React role/session boundary and Android Compose startup background. Android waits for an actual web paint, offers retry if the release is stale or loading fails.
- Shared navigation inventory across desktop sidebar and mobile hamburger; 17 learner routes and 9 independent Moduler sections. Native Back closes an open drawer first.
- Unified theme tokens and targeted fixes across older components; preserve simulation colors and scientific illustrations.
- Rich model-response rendering via local React Markdown, GFM, KaTeX and mhchem. Raw HTML and model-provided interactive links/images are disabled. Neither inference output nor provenance is fabricated. No inference provider, preferences, App Check, Auth/role policy or Firestore rules changed.
- Moduler Studio: bilingual draft, publish, update, withdraw and delete with server confirmation, validation, filters, distinct loading/error/empty states, and protected unsaved edits. Existing built-in curriculum remains separate from supplementary database documents.
- Android version 0.8.5 (versionCode 5).
## Tests
Use Node 22.13+ or 24, npm locked dependencies, Python 3.11+, Android Gradle wrapper from existing project, ADB. Optional emulator checks require Firebase CLI and Java 21+.
```sh
npm ci
npm run typecheck
npm run build
node scripts/check-v82.cjs
node scripts/check-v83.cjs
node --test scripts/test-studio85.mjs scripts/test-rich-answer85.mjs scripts/qa-v85/test-visual-v85.mjs
python scripts/qa-v85/test_boot85.py .
python scripts/qa-v85/test_ui85.py src
npx playwright install chromium
firebase emulators:exec --config firebase.qa85.json --project demo-elkimiya-v80 --only auth,firestore "node scripts/test-v80-rules.mjs && node scripts/qa-v85/emulator-ui85.mjs"
```
The emulator UI test uses only loopback emulators on a demo project; its Vite-only fixture deliberately disables live AI inference. It does not alter production data. Five categories and real SDK CRUD are verified; see reports/emulator-ui85.json for route audit findings.
The visual QA runner is documented in scripts/qa-v85/README.md. It audits actual screenshots and contrast, not the semantic completeness of translation or all interactive states.
## Deployment
Do not publish or install if source checks, build, or authorization restrictions fail. Android v0.8.5 requires Vercel to serve V8.5 HTML and JS. Update the existing APK in place using ADB install -r, not uninstall, so the prior local session/App Check settings are preserved. Check on-device and cloud inference independently; app installation does not prove either provider succeeds. Real Android build, physical camera, startup, keyboard and AI verification remain required on the developer device.
