# El-Kīmiyā V3 — perintah lengkap (Windows 11 PowerShell)

Repo yang sudah kamu push tetap **MENSTRUE/el-kimiya**. Jangan `git init` ulang.

## 1. Update kode V3 tanpa menghapus repo

Unduh `El-Kimiya_V3_Full_Source.zip` ke Downloads, lalu di terminal VS Code yang sudah berada di `D:\el kimiya`:

```powershell
cd "D:\el kimiya"
$zip = Join-Path $env:USERPROFILE "Downloads\El-Kimiya_V3_Full_Source.zip"
$stage = Join-Path $env:TEMP "el-kimiya-v3-update"
New-Item -ItemType Directory -Force $stage | Out-Null
Expand-Archive -LiteralPath $zip -DestinationPath $stage -Force
$source = Join-Path $stage "El-Kimiya_V3"
robocopy $source (Get-Location).Path /E /R:2 /W:1 /XD .git node_modules dist private /XF .env google-services.json *.pdf
if ($LASTEXITCODE -ge 8) { throw "Gagal menyalin V3 (robocopy exit $LASTEXITCODE)" }
```

**PERHATIAN:** bila sudah punya modifikasi lokal setelah V2, lihat `git status` sebelum copy karena command ini dapat menimpa file source yang ada. Tidak menghapus folder `.git`, `node_modules`, atau `.env`.

## 2. Install, test, jalan

```powershell
node -v
npm -v
npm install
npm run test:source
npm run typecheck
npm run build
npm run dev
```

Buka URL yang muncul dari Vite (biasanya `http://localhost:8443`). Untuk menghentikan Vite: `Ctrl+C`.

## 3. Buat indeks PDF privat (opsional, jangan di-push!)

Pastikan PDF ada di Downloads dan Python tersedia:

```powershell
py -3 -m pip install pymupdf
py -3 scripts\build_private_index.py --input-dir "$env:USERPROFILE\Downloads" --output "private\chemistry_index.json"
```

Masuk ke Web UI: **My Library → Import private JSON index**, pilih `D:\el kimiya\private\chemistry_index.json`.

PDF bisa dibuka dengan **Open your PDF** di My Library. Browser tidak akan menyimpan salinan permanen PDF atau mengunggahnya sendiri.

## 4. Firebase Web (harus sebelum submission)

1. Buat proyek di https://console.firebase.google.com . Tambah Web app dan Android app.
2. Aktifkan **Firebase AI Logic (Gemini Developer API)** dan **App Check**. Daftarkan hostname yang kamu pakai.
3. `Copy-Item .env.example .env` dan isi konfigurasi Web Firebase dari konsol. Isi `VITE_FIREBASE_RECAPTCHA_SITE_KEY` untuk App Check.
4. Pada localhost saja set `VITE_APPCHECK_DEBUG=true`. Setelah aplikasi berjalan, catat token debug dari console browser dan **daftarkan di App Check**. Jangan commit token.
5. Di Web, buka **Hybrid AI**, jalankan real inference, periksa provider `ON_DEVICE`/`IN_CLOUD`. Cek juga AI Tutor; untuk on-device Web gunakan Chrome Desktop yang kompatibel.

## 5. Android native (minimum hackathon MVP)

1. Buka folder `D:\el kimiya\android` menggunakan Android Studio terbaru.
2. Jika Android Studio butuh Gradle wrapper JAR yang belum tersedia, jalankan `gradle wrapper --gradle-version 8.13` memakai Gradle lokal; lalu sync project.
3. Daftarkan Android package `com.menstrue.elkimiya` di Firebase, unduh `google-services.json` ke `android/app/google-services.json` (gitignored).
4. Sync Gradle, install ke perangkat compatible, register App Check debug token, lalu uji mode `Prefer device`, `Cloud only`, dan cek sumber inference.
5. Untuk release gunakan App Check Play Integrity dan uji produksi; jangan kirim APK debug/token ke publik.

## 6. Push kode aman

```powershell
cd "D:\el kimiya"
git status --short
git add .gitignore .env.example README.md LICENSE docs scripts src public android firebase.json index.html package.json tsconfig.json vite.config.ts
git diff --cached --name-only
git diff --cached --check
git commit -m "feat: add chemistry source library and Android hybrid AI MVP"
git push origin main
```

Periksa `git diff --cached --name-only`: **jangan** ada `.env`, `google-services.json`, file PDF, `private/chemistry_index.json`, atau token.

## 7. Final check

```powershell
npm run test:source
npm run typecheck
npm run build
git status
```

Catatan: kode di ZIP belum dapat diuji `npm run build` di lingkungan pembuatnya karena akses registry npm gagal (`EAI_AGAIN`); uji itu harus kamu jalankan di laptop. Build Gradle Android pun belum terverifikasi di lingkungan ini.

## 8. Deploy Web ke Firebase Hosting (setelah build lolos)

Tambahkan nama project Firebase milikmu (jangan menebak ID):

```powershell
npm install -g firebase-tools
firebase login
npm run build
firebase deploy --only hosting --project "YOUR_FIREBASE_PROJECT_ID"
```

Repo sudah berisi `firebase.json` dengan SPA rewrite. Pastikan aplikasi berjalan di URL hasil deploy, daftarkan domain Hosting di App Check dan cek **real inference** di versi deployed (bukan hanya localhost).
