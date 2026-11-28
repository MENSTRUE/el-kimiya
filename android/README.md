# El-Kīmiyā Android

[README Indonesia](../README.md) | [English](../README.en.md) | [Screenshot gallery](../docs/screenshots/README.md)

## Architecture

The Android application combines a WebView learning workspace with Kotlin, Jetpack Compose, and the native Firebase AI Logic hybrid inference SDK.

- Application ID: `com.menstrue.elkimiya`
- Android version: 0.8.6
- Minimum Android API: 26
- Compile SDK: 36
- Java: 17
- Production UI: https://el-kimiya.vercel.app/

Minimum OS support does not guarantee on-device AI support.

## Build

1. Open the `android/` directory in Android Studio.
2. Register the application ID in your Firebase project.
3. Place your Firebase configuration in `app/google-services.json`.
4. Sync Gradle and connect an Android device.
5. Use Android Studio Run or the following PowerShell commands.

```powershell
cd android
.\gradlew.bat :app:assembleDebug
```

If the Gradle wrapper files are unavailable, use Android Studio or generate the wrapper using an installed Gradle distribution compatible with Gradle 8.13.

Install the debug APK:

```powershell
$adb = "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe"

& $adb devices -l
& $adb install -r "app\build\outputs\apk\debug\app-debug.apk"
& $adb shell am start -n "com.menstrue.elkimiya/.MainActivity"
```

The commands above are run from the `android/` directory. Installing as an update preserves existing app data when package signing is compatible.

## Firebase App Check

Debug builds use the App Check debug provider. A developer must register the debug token from their own installation in the corresponding Firebase Android app.

Debug tokens are private credentials and must never be distributed in source code, documentation, screenshots, or APK configuration.

Release builds use Play Integrity. Public distribution requires correctly configured signing, attestation, and supported devices. A debug token registered for one installation does not authorize every installation.

Official guides:

- https://firebase.google.com/docs/app-check/android/debug-provider
- https://firebase.google.com/docs/app-check/android/play-integrity-provider

## Live AI verification

1. Sign in as Learner.
2. Open AI Engine Status.
3. Select Cloud only and run the real inference test.
4. Confirm that the SDK reports `IN_CLOUD`.
5. Check local model availability and download it when supported.
6. Select On-device only and repeat the test.
7. Confirm that the SDK reports `ON_DEVICE`.
8. Test AI Chemistry Tutor in both modes.

An unsupported device or failed request must display an honest limitation rather than simulated success.

## Documentation evidence

The November 28, 2026 documentation includes 17 Android screenshots covering:

- Homepage, learner dashboard and mobile drawer.
- Published content and book reader.
- Native on-device and cloud inference.
- AI Tutor responses in both modes.
- Periodic table exploration.
- Fullscreen molecule builder and 3D viewer.
- Practice and flashcards.
- Moduler dashboard, published content and AI configuration.

View the [complete screenshot gallery](../docs/screenshots/README.md#android).

## Distribution status

Development-device inference has been demonstrated. Production distribution and attestation on other devices must be verified separately.

No private debug credentials are included in this documentation.