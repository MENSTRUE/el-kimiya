# El-Kīmiyā V4.6 — Panduan install, uji, dan demo (ID)

**Patch, bukan repository pengganti.** Pemasangan dilakukan di atas El-Kīmiyā V4.5 yang sudah memiliki `src/components/LearningPathV45.tsx`. Tidak menghapus komponen lama, FastAPI V4.3, ChEMBL atau aset di `private/`.

## Fitur utama

1. **AI Teach-Back** langsung di setiap bab. Siswa menjelaskan konsep dalam bahasanya sendiri (20–900 karakter). Model memberi kritik pembelajaran singkat berbasis catatan 3 konsep lokal dari bab itu.
2. **Empat mode inferensi nyata melalui `src/lib/hybrid.ts`**: `Prefer on-device`, `On-device only`, `Prefer cloud`, `Cloud only`.
3. **Perbandingan dua model bila pengguna memilih**. Dua permintaan nyata dijalankan menggunakan ONLY_ON_DEVICE dan ONLY_IN_CLOUD. Sumber (`ON_DEVICE`/`IN_CLOUD`) berasal dari `response.inferenceSource`, bukan simulasi UI. Waktu ditampilkan sebagai durasi permintaan total, **bukan benchmark terkontrol**.
4. **Persetujuan cloud** pada mode apa pun yang dapat mengirim input keluar perangkat. Tanpa persetujuan tombol meminta AI tidak aktif.
5. **Export evidence metadata tanpa jawaban** melalui tombol salin bukti. Jawaban siswa tidak disimpan dalam localStorage oleh komponen Teach-Back.
6. **Tiga perbaikan peringatan `configLoader: native` Vite**: `import.meta.dirname`, `.ts` extension pada import plugin lokal, dan JSON import attribute.
7. **QA statis + live API** (`node scripts/v46-qa.mjs` dan opsi `--live`). QA statis **tidak membuktikan AI aktif**.

## Instal via satu ZIP

Simpan `ElKimiya_V46_Hybrid_Coach_FINAL.zip` di `Downloads`, lalu di PowerShell jalankan:

```powershell
cd "D:\el kimiya"
$zip = Get-ChildItem "$env:USERPROFILE\Downloads" -Filter "ElKimiya_V46_Hybrid_Coach_FINAL*.zip" -File |
  Sort-Object LastWriteTime -Descending | Select-Object -First 1
if (!$zip) { throw "ZIP V4.6 belum ada di Downloads" }
$stage = Join-Path $env:TEMP 'elkimiya-v46-patch'
Expand-Archive -LiteralPath $zip.FullName -DestinationPath $stage -Force
$installer = Join-Path $stage 'ElKimiya_V46_Hybrid_Coach\tools\install-v46.ps1'
& powershell.exe -NoProfile -ExecutionPolicy Bypass -File $installer -ProjectDir 'D:\el kimiya'
if ($LASTEXITCODE -ne 0) { throw 'Instalasi, build, atau QA gagal. Baca output sebelumnya.' }
```

*Installer* membuat backup lokal di `scripts/.v46-backups/<timestamp>/` (diabaikan Git). Installer menolak struktur V4.5 yang tidak sesuai, bukan mengganti `App.tsx` atau seluruh repository. File `backend/`, database dan `.env` tidak disentuh.

## Jalankan

Terminal A (backend jika belum aktif):

```powershell
cd "D:\el kimiya"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "scripts\start-backend-learning-v43.ps1"
```

Terminal B (React/Vite):

```powershell
cd "D:\el kimiya"
npm run dev
```

Buka `http://127.0.0.1:8443/#practice`, mulai Bab 1, scroll ke kartu **AI Teach-Back** dan klik **Coba fitur**. Mode belajar lokal tetap jalan tanpa backend/AI.

## Bukti demo AI yang wajib direkam

1. Konfigurasi Web Firebase (Project ID, appId, apiKey publik, App Check site key), aktifkan Gemini Developer API di Firebase Console dan registrasikan token App Check DEBUG khusus localhost. Token/jalur `.env` tidak boleh dimasukkan ke publik. Dokumentasi proyek saat ini: `docs/FIREBASE_LIVE_SETUP.md`.
2. Pastikan `npm run firebase:check` menunjukkan konfigurasi ada (ini **belum** tes request). Pastikan Chrome Desktop kompatibel, flags Prompt API aktif, model lokal tersedia/diunduh (perlu dukungan perangkat).
3. Pada Bab 1, tulis penjelasan kimia sendiri, lalu pilih **On-device only**. Tekan kirim. Jika model mendukung, akan tampil `ON_DEVICE`. Jika tidak, **error itu harus ditampilkan jujur** dan tidak bisa diklaim berhasil.
4. Pilih **Cloud only**, setujui cloud, kirim. Pastikan `IN_CLOUD` muncul dari SDK. Apabila App Check / kuota salah, selesaikan konfigurasi sebelum mengklaim keberhasilan.
5. Pilih **Prefer on-device**, setujui cloud, tampilkan bagaimana SDK memilih provider sebenarnya saat model lokal tersedia/tidak tersedia.
6. Klik **Bandingkan lokal vs cloud** untuk melihat dua hasil nyata dan duration; catat bahwa ini bukan performa benchmark yang dikontrol.
7. Klik **Salin bukti**. Pastikan metadata yang disalin berisi mode, provider, model dan durasi; tidak berisi jawaban siswa atau kredensial.
8. Buka `#explorer` dan `#flashcards` untuk memperlihatkan 118 unsur dan 52 flashcard. Tunjukkan bab kedua tetap terkunci sebelum Bab 1 tuntas.

## Uji dev dan release

```powershell
cd "D:\el kimiya"
npm run typecheck
npm run build
node scripts/v46-qa.mjs
node scripts/v46-qa.mjs --live
node scripts/v46-qa.mjs --release
npm run release:build
```

`--live` membutuhkan backend jalan di port 8000 dan CORS `127.0.0.1:8443`. `--release` mengecek sebagian berkas build. `release:build` merupakan release preflight yang sudah ada pada repo. Semua itu tetap **tidak menggantikan pengujian manual inferensi Firebase**.

## Keamanan, kualitas konten, dan batasan

- AI feedback dapat keliru; bukan grading resmi, bukan sertifikasi keahlian, dan bukan pengganti telaah guru/pakar kimia.
- 26 soal V4.5 dan 65 soal V4.3 masih **draft edukasi**. Jangan mengklaim sudah disahkan oleh IUPAC/OpenStax/pakar.
- Teach-Back mengirim ringkasan 3 konsep dari bab dan teks siswa ke penyedia model sesuai mode. Cloud-capable mode membutuhkan persetujuan eksplisit. Hindari data rahasia atau data pribadi.
- Web lokal Chrome Desktop mungkin membutuhkan unduhan model; Android MVP terpisah masih harus diuji di perangkat kompatibel.
- Backend ChEMBL dibuat untuk localhost. Tidak otomatis tersedia dalam deployment publik.
- Aplikasi berjalan tanpa Firebase untuk kurikulum/kartu statis. Jangan menyamakan *offline learning* dengan *offline AI*.

## Rollback

Lihat `scripts/.v46-backups/<timestamp>/manifest.json`. Semua file yang diganti ada pada folder cadangan dengan path relatif yang sama. Restore file yang dicadangkan sesuai manifest dan hapus hanya file baru yang tercatat pada `created`. Commit atau buat backup perubahan setelah V4.6 sebelum rollback. **Jangan hapus** backend, data ChEMBL, atau file milik V4.5.
