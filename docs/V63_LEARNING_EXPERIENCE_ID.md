# El-Kīmiyā V6.3 — Learning Experience & Lab Visual Upgrade

## Tujuan

Perubahan **aditif** terhadap V6.2. Default `#practice` sekarang membuka bank soal A/B/C/D. Tampilan jalur belajar, 65 soal V4.3, lab klasik, serta semua fitur `#molecules` tetap tersedia. Pada `#flashcards`, pengantar konsep membantu menjelaskan istilah sebelum pengguna membuka kartu V4.3 yang lama. Pada Petrochemical Experiment Lab, pengguna bisa memilih visual labu-buret baru atau diagram klasik. Perhitungan dan AI tetap menggunakan implementasi V6.2, tanpa mengganti kontrak API.

## Cakupan aktual (tidak boleh dilebih-lebihkan)

- **1.152 varian soal numerik bilingual** dari **12 keluarga/kompetensi** dengan 96 kasus per keluarga. Ini soal yang dibuat berdasarkan parameter dan rumus sederhana; **bukan 1.152 konsep independen**. Verifikasi aritmetika otomatis dilakukan, tetapi **belum melalui peer review ahli kimia**.
- Pilihan ganda A–D (empat opsi yang diperiksa agar unik), filter tingkat dan kompetensi, soal acak, umpan balik, langkah perhitungan, statistik lokal.
- Kamus tambahan **13 istilah** dengan definisi dan contoh singkat. 52 flashcard sebelumnya tidak ditimpa; jumlah aktual kartu mengikuti API pembelajaran yang dapat dimuat pada browser.
- Petro: **1 visualisasi peralatan lab ilustratif** baru (buret, stand, labu Erlenmeyer, cairan, tetesan), pilihan kembali ke diagram SVG klasik. Tiga skenario sintetis V6.2 tetap ada dan **sembilan skenario sintetis baru ditambahkan (total 12)**. Semuanya variasi parameter pada model bilangan asam yang sama, bukan 12 metode eksperimen berbeda.
- Palet aksen lebih variatif: pine/teal, pasir hangat, amber, coral, lavender; kontras dan responsivitas diperhatikan. CSS baru terlingkup pada kelas komponen; beberapa override khusus Petro dan Flashcards.
- Semua model eksperimen bersifat edukatif dan **tidak** memprediksi hasil proses industri sungguhan. Tidak ada metode ASTM tersertifikasi.
- Tidak ada dataset rahasia, token, `.env`, backend Vercel, Gemini, RDKit, API, atau ChEMBL pribadi yang dimodifikasi.

## Instalasi (Windows PowerShell)

```powershell
cd 'D:\el kimiya'
$zip = "$env:USERPROFILE\Downloads\ElKimiya_V63_Experience_Final.zip"
$dest = Join-Path $env:TEMP 'elkimiya-v63-experience'
Expand-Archive -LiteralPath $zip -DestinationPath $dest -Force
python (Join-Path $dest 'install-v63.py') --project 'D:\el kimiya'
if ($LASTEXITCODE -ne 0) { throw 'Gagal install V6.3' }
node scripts/test-questionbank-v63.mjs
if ($LASTEXITCODE -ne 0) { throw 'Audit soal gagal' }
npm run release:build
if ($LASTEXITCODE -ne 0) { throw 'Build gagal' }
git status --short
```

Installer membuat **backup** di `private/v63-learning-backups/<timestamp>/` untuk semua file yang ditimpa, dan menolak mengubah berkas bila anchor integrasi tidak ditemukan. `private/` harus tetap gitignored.

## Git staging aman

```powershell
git add -- src/App.tsx src/main.tsx src/components/PetrochemicalExperimentLabV62.tsx src/lib/petroExperimentV62.ts src/components/PracticeBankV63.tsx src/components/ConceptGuideV63.tsx src/components/ExperimentGlassV63.tsx src/data/quizBankV63.ts src/experience-v63.css scripts/test-questionbank-v63.mjs docs/V63_LEARNING_EXPERIENCE_ID.md
git diff --cached --check
git diff --cached --stat
git commit -m "feat(learn): add bilingual 1152-question practice bank and colorful lab experience"
git push origin main
```

## Uji setelah deploy

1. `https://el-kimiya.vercel.app/#practice`: terbuka bank soal berisi **1.152 varian**, pilih A/B/C/D, cek benar/salah, filter, kategori dan level, lalu buka `Jalur belajar` serta `Lab klasik` untuk memastikan versi lama masih ada.
2. `https://el-kimiya.vercel.app/#flashcards`: lihat kamus definisi dulu, lanjutkan ke kartu V4.3 lama, tes buka/tutup kartu, filter topik dan bahasa.
3. `https://el-kimiya.vercel.app/#molecules`: buka Petrochemical Experiment Lab, pilih `Labu ilustratif`, tekan `+1`/`+5`/`+10`, rekam trial; ubah ke `Diagram klasik` dan pastikan desain awal tetap bisa digunakan. Uji Molecular Studio 2D/3D/RDKit/Firebase secara terpisah.
4. Tes desktop/mobile, offline behavior (konten lokal), dan toggling bahasa ID/EN. Bukti screenshot atau recording dari deployment publik diperlukan sebelum mengklaim PASS Vercel.

## Sumber pembelajaran

OpenStax *Chemistry 2e*: https://openstax.org/details/books/chemistry-2e. Bahan numerik dalam latihan adalah variasi sintetis yang dihitung dengan rumus standar, bukan soal yang diambil atau telah divalidasi oleh OpenStax.
