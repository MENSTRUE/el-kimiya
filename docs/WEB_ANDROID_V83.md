# El-Kīmiyā V8.3 – Web and Android parity

## Scope
The production HTTPS WebView remains the single learning UI. Mobile navigation provides direct Home, Library, Scan and AI Tutor tabs plus a searchable 17-route dialog. The former Practice/Profile tabs move to the menu. Scan and the reader retain a route out. The desktop sidebar, role verification, email-only sign-in, preview-only guest, learner and moduler separation, library data, camera and file-export paths remain intact.

Every existing caller of runHybridInference uses the new Android JS message transport on APK V8.3; desktop and ordinary mobile browsers retain Firebase Web SDK. The native implementation uses the same Android Firebase hybrid SDK already present in V8.2 Hotfix 1. A missing/failed native bridge does not retry in the Web SDK. The UI shows actual SDK inference source, not an assumed model or demo. Status/download is available from AI Engine Status. Use Cloud only to test cloud first, then check local status and test On-device only on supported devices.

## Access and App Check
The bridge is restricted to the exact production origin and main frame, and requires a V8.3 learner workspace, allowed route, current page and matching ephemeral workspace nonce. Changes of document/routing invalidate requests. The session marker is a UI defense-in-depth guard, not a cryptographic authentication assertion or server-side authorization check. Existing Firebase Web auth and Firestore rules remain the authoritative role/data rules. No web session credentials, API keys or App Check tokens are passed through the bridge. The existing Android Application class keeps its debug or Play Integrity provider. Private excerpts may be sent to the selected AI provider with the same explicit tutor request as on web; never silently switch to cloud in On-device only mode.

Development build: obtain the private Android App Check debug token locally from Logcat, register it in the corresponding Android app entry in Firebase App Check, then retry. Never commit or send this token. For judging/distribution to multiple devices, verify a production-signed build with the configured Play Integrity provider, signing certificate and distribution channel; a debug token from one installation does not approve other devices. Do not disable enforcement. See https://firebase.google.com/docs/app-check/android/debug-provider and https://firebase.google.com/docs/app-check/android/play-integrity-provider.

## Build/deploy
Extract the patch and run run-v83.ps1 against the existing web V8.2 + Android V8.2 Hotfix1 working copy. It validates all anchors before edits, saves backups under private/v83-backups, runs source tests, V8.2 route/access tests when present, web typecheck/build and :app:assembleDebug. No Git push/deploy is performed automatically. Stage only the V8.3 changed files, commit, push main, and wait for Vercel production Ready. Install the new APK as an update (same signing key); do not uninstall unless you understand local-data loss.

## Physical-device acceptance checklist
- Verify guest #tutor and #dashboard redirect to login, no Google sign-in.
- Sign in learner; verify menu lists 17 routes, open each, use search, close via X/Back.
- In learner workspace, test scanner/camera, reader/PDF, practice and saving notes.
- Under AI Engine Status choose Cloud only, then send a Tutor question; actual result must be IN_CLOUD (not Demo content).
- Check device model; download only if supported, select On-device only and send a short question. Confirm ON_DEVICE or a clear unsupported status.
- Try AI inside mission, molecules, practice/coaching and selected PDF excerpts.
- Try a failed request; it must show Failed without raw URL overflow, not a fake response.
- Rotate phone, switch languages/theme, check portrait layout and keyboard.
- Test homepage, logout and different learner/moduler accounts. Verify role boundaries and no stale result.
- Verify ordinary browser continues using Web SDK.
- For private debug use, adb logcat -d -s DebugAppCheckProvider (never send token). For release, verify Play Integrity.

Source and mock transport tests do not prove live inference or Android attestation; those require the installed APK, real Firebase project and a supported device.
