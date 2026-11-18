# El-Kīmiyā Android Hybrid AI MVP (experimental)

This folder is an **Android Kotlin + Jetpack Compose MVP**, not a WebView. It uses `com.google.firebase:firebase-ai` and the on-device extension to call `generateContent` and show the actual `inferenceSource`. It is intentionally smaller than the React web product; it demonstrates the Android platform's hybrid path.

**Setup (Android Studio)**
1. Open the `android/` folder as a Gradle project with recent Android Studio (JDK 17, Android SDK 36). The Gradle wrapper *properties* file is provided; the wrapper JAR is not packaged. If your environment does not supply Gradle automatically, run `gradle wrapper --gradle-version 8.13` using an installed Gradle once, then use `./gradlew`.
2. Create one Firebase project with Android application ID `com.menstrue.elkimiya` (or update the ID in Gradle if another ID is registered). In Firebase Console > Project settings > Your apps, register this Android app and download `google-services.json` into `android/app/` — the file is **gitignored**.
3. Enable Firebase AI Logic Gemini Developer API and enforce App Check. For development, `ElKimiyaApplication` uses App Check Debug provider on debug builds; register the printed token in Firebase Console. Do not commit any token.
4. For release, the code uses the Play Integrity App Check provider. Configure registration/fingerprints and test production attestation before public distribution.
5. In Android Studio, Sync Gradle and Run on a compatible Android device. Tap **Check local model**, and **Download local model** if supported. Then try **Prefer device** and **Cloud only**, inspect `Actual inference source`. A model download may need to be performed separately on supported hardware.

**Scope:** Real Firebase hybrid SDK call; four inference choices; text-based chemistry AI tutoring; actual provider display; check local model status. No PDF ingestion or synced progress in the native MVP yet. Do not claim those web-only features exist on Android. Android AI hybrid SDK is experimental as of Nov 2026.

**Official reference:** https://firebase.google.com/docs/ai-logic/hybrid/android/get-started and https://firebase.google.com/docs/ai-logic/hybrid/android/configuration-options
