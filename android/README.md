# El-Kīmiyā Android — Web + Native Firebase Hybrid (V1)

`ELKIMIYA_ANDROID_HYBRID_WEB_V1`. This is the Android adaptation of the existing El-Kīmiyā V6.7 website; **it does not rewrite the React product in Kotlin**.

## Architecture

- `MainActivity.kt`: HTTPS WebView loading https://el-kimiya.vercel.app/, preserving the public React landing, guest/onboarding, dashboard, public library, Research Mission, practice/flashcards and Molecular Studio as implemented on the website.
- `NativeTutorActivity.kt`: the original Kotlin Compose Firebase Hybrid AI MVP, preserved by renaming the original `MainActivity` without changing Firebase generation logic.
- Top toolbar: Back, Home, Refresh, **AI Native**, **PDF** (Android print/save as PDF).
- WebView handles Android file picking, including PDF and text files. `webkitdirectory` folder upload is NOT equivalent to Chrome desktop; prefer **Pilih satu buku** for private PDFs.
- Local `blob:` JSON/Markdown report export and `window.print` are handled via an **origin-scoped AndroidX WebMessage listener**, not an unrestricted `addJavascriptInterface`. On unsupported WebViews the fallback is to open the website in Chrome. Android `PrintManager` allows print/save to PDF.
- HTTPS same-domain main-frame pages stay inside. External domains open in the system browser. No `file://` page navigation. Mixed content and file access are blocked.
- Camera can be requested from the trusted web origin with the Android runtime permission dialog; permission can be denied.

## Requirements and usage

- The **same Firebase Android app** as before: application ID `com.menstrue.elkimiya`, `android/app/google-services.json` from Firebase Console. The file is gitignored.
- AGP 8.11.1, Gradle 8.13, Kotlin 2.2.20, Android SDK 36, Compose BOM 2025.08.00 and AndroidX WebKit 1.14.0 (first build may download the new dependency).
- Java/JDK 17 or supported toolchain; Android Studio supporting AGP 8.11.1.
- Run `node scripts/check-android-hybrid-v1.mjs`, then `cd android; .\gradlew.bat :app:assembleDebug` on Windows.
- Use USB debugging and `adb install -r app\build\outputs\apk\debug\app-debug.apk` to install.

## What is and is not equivalent to desktop

| Capability | Android treatment |
|---|---|
| Landing, dashboard, lessons, mission, quiz, 2D/3D | Website UI displayed in WebView, subject to WebView compatibility |
| Firebase Hybrid AI | Original Kotlin-native SDK screen, with verified `inferenceSource` when successful |
| Local private books | Choose PDF in Android file picker; directory selection may be unavailable |
| Report JSON/Markdown | Native save-document dialog for `blob:` download (max 2 MB) |
| Report PDF | Android system Print/Save as PDF (requires print service support) |
| Hugging Face semantic model | Only if Android WebView, memory and network support the browser model; no guarantee |
| Web AI on-device (Chrome Prompt API) | Not guaranteed in Android WebView; use native Firebase screen for supported hardware |
| Offline | React content requires network unless independently cached; native on-device model availability varies |
| Login/account sync | No fake authentication; progress in WebView localStorage stays local to app, separate from Chrome |

## Real-device QA before release

1. Open app → landing → guest/onboarding → Research Mission → two synthetic trials → export JSON / print PDF.
2. Navigate library → pick one PDF → check PDF original / text mode.
3. Test RDKit molecule via live Vercel API; native AI cloud and on-device separately with visible actual inference source.
4. Test Android Back, return from native AI, external links, application restart (local progress), dark mode, camera consent.
5. Audit App Check debug token registration and Play Integrity before distributing a **release** build. **Never ship debug App Check token**.
6. Confirm certificate / Android package settings and check license/permissions before publication.

**Privacy:** `android/app/google-services.json`, `private/chemistry-books`, and extracted private JSON are never copied by the installer and should not be committed. The `google-services.json` file is *not a secret by itself* but must have appropriate Google/Firebase key restrictions, security rules and App Check. Never include App Check debug tokens in version control.
