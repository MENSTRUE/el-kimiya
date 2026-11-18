# El-Kīmiyā V3.2 — Firebase AI Logic LIVE setup (Windows PowerShell)

**This is a Firebase-ready app, not proof of a successfully connected project.**
The Firebase project, Gemini Developer API backend, App Check keys, account quota, and actual model availability must be configured and verified by the project owner.

## A. Before running any commands

1. Open <https://console.firebase.google.com/> and **create or select your Firebase project**. Record its actual **Project ID** (not display name).
2. Project settings > General > Your apps > **Add Web app**. Register the Web app and copy its `firebaseConfig` values.
3. Add an **Android** app with package `com.menstrue.elkimiya`. Download `google-services.json` to `android/app/google-services.json` (gitignored).
4. Firebase console > **AI Logic** > Get started > **Gemini Developer API**. Complete activation and verify the model you plan to use is available. Do not paste Google AI Studio API keys into Vite `.env`.
5. Firebase console > **Security > App Check** > Apps > register the **Web app** with **reCAPTCHA Enterprise** (or v3). Record the *site key* and matching provider type. Enable / confirm **App Check enforcement** for Firebase AI Logic under the APIs tab.
6. For public production access, add the proper production domain to the reCAPTCHA key allow-list. **Do not whitelist `localhost`** for production reCAPTCHA; use Firebase App Check's debug provider for local development.

Firebase docs: <https://firebase.google.com/docs/ai-logic/hybrid/web/get-started> , <https://firebase.google.com/docs/ai-logic/app-check>.

## B. Local Web setup

Run this in a PowerShell terminal in the repository:

```powershell
cd "D:\el kimiya"
node -v
npm -v
if (!(Test-Path ".env")) { Copy-Item ".env.example" ".env" }
code .env
```

Fill the Web app's `VITE_FIREBASE_*` values and the App Check site key (only public config). Set `VITE_APPCHECK_PROVIDER=enterprise` if using Enterprise; set it to `v3` if using reCAPTCHA v3. For local App Check debugging, set `VITE_APPCHECK_DEBUG=true` (NOT a token). Save the file.

```powershell
npm install
npm run firebase:check
npm run verify
npm run dev -- --port 5173
```

Open <http://localhost:5173> in Chrome Desktop and press **F12 > Console**. When you submit an AI request, App Check prints a **local debug token**; register it in Firebase Console > App Check > Apps > your Web app > Manage debug tokens. **Never share the token or commit it.** After registration, retry the request.

Go to **Hybrid AI > Run real inference test**. First select **Cloud only** (should show `IN_CLOUD` if configured). Then try **Prefer on-device** on compatible Chrome Desktop. A returned `IN_CLOUD` indicates fallback, NOT on-device success. After local model downloads and is supported, test **On-device only**; it must show `ON_DEVICE` or an explicit error. Some Chrome device models are experimental and require system resources, supported flags, and downloads. Internet connectivity and model availability matter.

## C. Android verification

1. Open `D:\el kimiya\android` in Android Studio with Android SDK 36, JDK 17 and compatible Gradle.
2. Place `google-services.json` at `android/app/google-services.json` (never commit it). Register package `com.menstrue.elkimiya` in the **same Firebase project**.
3. **Gradle wrapper bootstrap**: This starter contains `gradle-wrapper.properties` but not the JAR or scripts. With a separately installed Gradle 8.13, run `gradle wrapper --gradle-version 8.13` inside `android/`, or use your locally installed Gradle tools to generate them; then Gradle sync.
4. Enable App Check debug for the Android app: run a debug build, find the debug provider token in **Android Studio Logcat**, and register it in Firebase Console > App Check > Apps > your Android app > Manage debug tokens.
5. First test **Cloud only** with internet. Then check/download the local model on a **compatible physical device** and try **Device only**. Verify displayed `inferenceSource` from Firebase. An emulator cannot prove real on-device Gemini Nano capability.
6. For public Android releases, configure Play Integrity (including signing/registration requirements) and test release App Check. Debug APK/token is for local testing only.

Android SDK documentation: <https://firebase.google.com/docs/ai-logic/hybrid/android/get-started>.

## D. Deploy Web

Important: new Firebase projects (since **15 Oct 2026**) no longer automatically receive a default Hosting site. In Firebase Console > **Build > Hosting > Get started**, provision your site's Hosting resources first.

```powershell
cd "D:\el kimiya"
npm install -g firebase-tools
firebase login
$projectId = Read-Host "Firebase Project ID (copy exact value from Console)"
npm run verify
firebase deploy --only hosting --project $projectId
```

In Firebase Console, complete reCAPTCHA production-domain registration for the Hosting URL and verify App Check on the **deployed** Web app. Production builds ignore `VITE_APPCHECK_DEBUG=true` in code; a real production attestation provider must work.

## E. Safety, copyright and submission

- Use the 8 chemistry books for **private research** and authored lessons where permitted; do not commit PDFs or the private JSON index.
- `npm run build` and `firebase:check` do **not** prove the cloud/on-device model works. The correct test is a live response showing actual SDK inference provider and App Check validation.
- Never commit `.env`, App Check debug tokens, `google-services.json`, credentials, private PDF indexes or API service-account files.
- Demo must show functioning runtime, not only the simulated Hybrid AI scenario cards.
- Final Devpost materials: public GitHub with recognized open-source LICENSE, working demo, hosted URL (strongly recommended), YouTube demo <=3 minutes in English or subtitled, English description and technology explanation.
