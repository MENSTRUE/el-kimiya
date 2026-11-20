# El-Kīmiyā V3.3 — cloud verified → hybrid testing → safe release

## Bukti saat ini

- Cloud AI Logic sudah terbukti menjawab di localhost, dengan `Verified provider: IN_CLOUD`.
- App Check debug testing: registered token pada Firebase; itu **tidak** sama dengan produksi.
- On-device (`ON_DEVICE`) **belum** terverifikasi; jangan klaim sudah.
- Android native **belum** teruji/dirilis.

## Instalasi patch

Ekstrak ZIP patch ke folder staging (bukan langsung ke repo), lalu jalankan `install-v33.ps1` dari folder patch. Installer membuat backup, hanya mengubah `src/lib/hybrid.ts`, skrip terkait, label UI yang relevan dan `package.json` serta default host Vite menjadi `127.0.0.1` agar token pengujian tidak diakses pengguna lain di jaringan LAN. Installer otomatis memindahkan token debug dari `.env` ke `.env.development.local` (diabaikan Git). `npm run typecheck` dan `npm run build` dijalankan setelah instalasi. Tidak ada langkah otomatis yang men-deploy Firebase.

## Local test — App Check debug

`.env` berisi konfigurasi publik Firebase, dengan `VITE_APPCHECK_DEBUG=false`. Untuk **localhost saja**, gunakan file `.env.development.local` yang otomatis dibuat oleh installer jika kamu sebelumnya menyimpan token di `.env`:

```
VITE_APPCHECK_DEBUG=true
VITE_APPCHECK_DEBUG_TOKEN=<nilai token yang TERDAFTAR di Firebase>
```

Jangan commit file `.env.development.local`; file ini diabaikan Git. Vite membacanya hanya pada development dan tidak pada production build. Periksa bahwa `.gitignore` masih memiliki `.env*`. Setelah `npm run dev -- --port 5173`, buka `http://localhost:5173/#hybrid` (bukan `http://192.168...`). Uji `Cloud only`; pengguna sudah membuktikan berhasil pada 20 Nov 2026.

Catatan: token debug adalah bypass keamanan. Ia masuk ke browser *development* untuk pengujian lokal dan tidak boleh dipakai pada deployment. Karena sebuah token sempat dibagikan di chat, **cabut token lama yang terekspos** lewat Firebase App Check > Apps > El-Kimiya-Web > Manage debug tokens.

## On-device proof

1. Gunakan Chrome **desktop** v139+ (bukan Edge/mobile). Buka `chrome://settings/help` untuk verifikasi versi.
2. Aktifkan `chrome://flags/#prompt-api-for-gemini-nano-multimodal-input`, restart Chrome; pastikan lingkungan mendukung built-in model. Ikuti dokumentasi Chrome bila butuh flag/hardware khusus.
3. Buka `http://localhost:5173/#hybrid` lalu pilih `On-device only` dan jalankan *Run real inference test*. Model bisa perlu download dan browser mungkin menolak karena tidak kompatibel. Hasil valid harus bertuliskan `Verified provider: ON_DEVICE`; `IN_CLOUD` bukan bukti lokal.
4. Coba `Prefer on-device` dengan model belum diunduh; Firebase mungkin memberi `IN_CLOUD`, itu **fallback**, bukan local. Jangan menutupi status aslinya.
5. Jika mode lokal gagal, catat pesan error dan demonstrasikan cloud sebagai fitur yang sudah teruji; jangan membuat status simulasi untuk pengujian live.

Referensi: https://firebase.google.com/docs/ai-logic/hybrid/web/get-started

## Siapkan produksi

Untuk produksi, **pastikan `.env` tidak memiliki token** dan `VITE_APPCHECK_DEBUG=false`. Token lokal seharusnya hanya berada di `.env.development.local`, yang tidak dibaca oleh build produksi. Jalankan release preflight; jika menemukan token di `.env` atau konfigurasi debug aktif, rilis otomatis diblokir. Gunakan domain yang sudah didaftarkan di key Fraud Defense (`el-kimiya.web.app`).

```
cd "D:\el kimiya"
npm run release:build
firebase deploy --only hosting --project el-kimiya
```

Perintah `release:build` harus dijalankan pertama dan **akan GAGAL dengan sengaja** jika konfigurasi debug masih aktif atau repo Git melacak PDF/secret. Jangan mengakali guard. Setelah deploy, uji `https://el-kimiya.web.app/#hybrid` (tanpa debug token), lalu Cloud only harus muncul `IN_CLOUD` sebagai bukti App Check produksi. Pastikan domain Fraud Defense sudah terdaftar.

**Batasan**: deployment membutuhkan akses Firebase dari laptopmu; patch ini tidak otomatis mengirim data ke Firebase. Konfigurasi lokal `.env`, token, PDF dan file `google-services.json` tidak boleh masuk repository publik.
