# El-Kimiya V8.4 — verified hybrid + visual release candidate
This is a targeted patch for the existing V8.3 project (including the optional
V8.3 AutoDoctor native patch). It contains full changed source files and a
context-safe, backup-first installer, not an entire copy of the repository.
It does not reset app data, uninstall packages, change roles, deploy Firestore
rules, disable App Check, add a paid service or include credentials.

## Windows steps
1. Keep your existing Node, Python, Android SDK, Gradle wrapper and Firebase
   configuration. Keep the Samsung device unlocked, USB or wireless ADB.
2. Extract the ZIP in a temporary directory. Run in Windows PowerShell:
   powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\run-v84.ps1 -ProjectRoot "D:\el kimiya" -PublishWeb -RegisterDebugToken -DownloadLocal
3. Only if needed, use the actual learner login form (not Moduler); input
   credentials at the local terminal, not in chat. Never share debug secrets.
4. The script checks/typechecks/builds the web app, optionally commits and
   pushes only known changed web paths to existing main (Vercel connected),
   builds and installs the Android debug APK, and runs real device QA.
   Auto-publish is deliberately blocked if HEAD/origin diverges or unexpected
   local changes are detected. If no publish flag, there is no push/deploy.
5. If App Check rejects the token, the optional flag registers the device's
   current private DEBUG secret with the exact Android app via official
   Firebase REST API if gcloud is already authenticated with suitable IAM.
   Otherwise it opens Firebase Console and copies the token locally. Add it
   under the **Android** app's Manage debug tokens and confirm to retry.
   This is a one-time owner-authenticated step. No key/token printed or stored
   in the report. Do not disable enforcement.
6. Device results in reports/android-v84-real-qa.json. Real cloud and local
   generation can be checked independently. An installed or downloaded model
   is not evidence of actual inference. The runner labels fallback/offline
   untested unless verified; wireless ADB must remain connected.
7. Re-run with -TestOnly (and optionally -RegisterDebugToken -DownloadLocal)
   to skip source/build/install. Use -SourceOnly to patch and build web but
   not deploy/install. Use -Serial for multiple connected devices.

Private timestamped source backup: private/web-android-v84-backups.
Safety: debug APK/tokens are for private test devices, not public judges.
A release APK needs release signing + Play Integrity App Check registration
and its own release QA. No fee guarantee: existing Firebase tier/usage
limits apply, and model downloads can use substantial data/storage.

Reference:
- https://firebase.google.com/docs/app-check/android/debug-provider
- https://firebase.google.com/docs/reference/appcheck/rest/v1/projects.apps.debugTokens/create
- https://firebase.google.com/docs/ai-logic/hybrid/android/get-started
- https://firebase.google.com/docs/ai-logic/app-check#replay-protection
