# El-Kīmiyā — Hybrid AI Chemistry Learning Platform

**Understand Chemistry. Anywhere.** A chemistry-first learning experience combining an editorial Web study workspace, interactive practice, private references, and an experimental native Android client using Firebase AI Logic hybrid inference.

**Status (18 Nov 2026):** V3 source delivery. UI and pure-logic features are implemented; Firebase runtime requires your project and device setup. **Do not treat the demo scenario as actual inference.** No copyrighted full books or PDF indexes are shipped in this repository.

## Running on Windows (PowerShell)

```powershell
cd "D:\el kimiya"
npm install
npm run test:source
npm run typecheck
npm run build
npm run dev
```

For step-by-step instructions to apply a V3 ZIP over your existing Git repo, create a private book index, configure Firebase, run Android, and push safely, read **[docs/RUN_WINDOWS_ID.md](docs/RUN_WINDOWS_ID.md)**.

## Features

- **Web** — Responsive React/Vite TypeScript UI with the approved El-Kīmiyā logo, landing page, dashboard, learning reader, AI tutor, chemistry explorer, virtual equation balancing/pH practice, flashcards, notes and local progress (V2).
- **Bibliographic catalog (V3)** — Eight user-supplied reference books, categorized chemistry / Islam integration, with metadata and reproduction notes. Full book text is **not** in the public app.
- **Local PDF preview (V3)** — You may choose a PDF from your computer and read it *only in the current browser session*. No automatic OCR, no server upload.
- **Local PDF index (V3)** — Optional offline tool `scripts/build_private_index.py` extracts text from personally held PDFs into a local JSON file, ignored by Git. Import that JSON on the Library page to search indexed PDF pages, inspect excerpts and prepare a source-labeled AI prompt.
- **Web Firebase Hybrid AI (V2/V3)** — `src/lib/hybrid.ts` uses the real Firebase AI Logic `getGenerativeModel()` runtime with all four inference preferences and displays `response.inferenceSource`. Requires Firebase config and App Check. Chrome Desktop only for local Web model.
- **Native Android MVP (V3)** — Kotlin + Compose in `android/` with Firebase AI Logic Android hybrid SDK; select inference preference and display actual `inferenceSource`. It is a small tutor MVP, not yet parity with Web. Android SDK hybrid is experimental.

## Source privacy and rights

- Source PDFs, extracted JSON indexes, `.env`, and `android/app/google-services.json` are gitignored; **never commit them**.
- The catalog entries do not imply permission to re-host copyrighted textbooks. See [docs/BOOK_PROVENANCE.md](docs/BOOK_PROVENANCE.md).
- Source-grounded AI prompting is user-initiated and gated by disclosure: a Firebase hybrid request can process locally **or** in the cloud depending on mode, support and connectivity. Do not transmit book excerpts unless you have the right to do so.
- PDF page citations mean the one-based PDF page number extracted locally; printed book page numbers may differ. Qur’an/hadith citation accuracy and scientific claims require review.

## Firebase setup

1. Create Firebase project, register Web and Android apps, enable **AI Logic Gemini Developer API** and **App Check**.
2. Web: `Copy-Item .env.example .env`, fill **public** Firebase Web config and a reCAPTCHA App Check site key. On localhost only set `VITE_APPCHECK_DEBUG=true`, register its browser console token with Firebase App Check. Never commit debug token.
3. Android: download **private** `google-services.json` into `android/app/`, register the App Check Debug token from Logcat for local debug; register Play Integrity for release.
4. Run actual hybrid requests and verify `ON_DEVICE` vs `IN_CLOUD` on supported devices. Do not claim full hybrid success based on scenario animations.

Official API docs: [Web getting started](https://firebase.google.com/docs/ai-logic/hybrid/web/get-started), [Android getting started](https://firebase.google.com/docs/ai-logic/hybrid/android/get-started).

## Directory map

```text
src/               # Existing full Web app and new source-library UI
scripts/           # Source tests + private PDF indexing CLI
android/           # Kotlin / Jetpack Compose hybrid AI MVP (not a WebView)
public/brand/      # User-approved monochrome calligraphic logo
private/           # Local research index, NEVER commit
/docs/             # Run commands, book provenance and submission checklist
```

## Submitting

See [docs/HACKATHON_SUBMISSION.md](docs/HACKATHON_SUBMISSION.md). A source ZIP alone is **not** a hackathon submission; the delivered project still needs configured Firebase/App Check, live platform/device validation, hosted Web, public source and 3-minute YouTube demo.

License: Apache 2.0 applies to the authored source only, not third-party books.
