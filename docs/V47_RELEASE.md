# El-Kimiya V4.7 — Public Web Release and Judging QA

## Scope

Fixes the most serious public deployment gap: the V4.4 flashcard and question bank previously required the user's localhost FastAPI. Firebase Hosting users cannot call that server. V4.7 creates a **public read-only snapshot** of the *already validated* V4.3 learning bank (13 chapters, 65 draft questions, 52 flashcards in both ID/EN). The Learning Journey from V4.5 is unchanged and continues working without a network request.

The full 2,897,819-record ChEMBL SQLite database **remains local**. A separate, explicitly labeled **small public molecule sample** is available on hosted Web. Other molecular features use PubChem remote services and may need Internet access.

The Firebase hybrid inferencing path remains in `src/lib/hybrid.ts`. No fake model result, fake App Check or UI-only provider receipt is added. V4.6 Teach-Back remains the focal feature to demonstrate for judges.

## Windows: run in D:\el kimiya (V4.6 must be installed)

1. Install the patch using `tools/install-v47.ps1 -ProjectDir 'D:\el kimiya'`. This backs up files and builds the project.
2. Start FastAPI in a second PowerShell terminal:
   `powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts/start-backend-learning-v43.ps1`
3. In the project directory, export the PUBLIC-SAFE data:
   `node scripts/export-learning-v47.mjs`
   `node scripts/export-molecules-v47.mjs`
4. Run release gates:
   `npm run typecheck`
   `npm run build`
   `node scripts/v47-web-gate.mjs --strict --live`
5. Launch `npm run dev`, test `#practice`, `#flashcards`, `#explorer`, and `#molecules` in ID and EN.
6. Deploy using your own Firebase Hosting configuration only after real Firebase App Check and hybrid SDK tests. After deployment run:
   `node scripts/v47-web-gate.mjs --strict --hosted=https://YOUR-PROJECT.web.app/`

### Release-blocking browser checklist (manual)

- Open hosted site in a fresh Incognito window, verify 13 lessons, 65 questions, and 52 cards are available in both ID/EN.
- Verify chapter 2 is locked before completing chapter 1; intentionally answer incorrectly and confirm it stays locked; answer correctly to unlock; reload and ensure saved progress persists.
- Verify all 118 periodic elements are available; try search, category filter, comparison, and Element Detective.
- Try molecule sample search and inspect the explicit scope disclosure; do not present a 2.89M live database claim on public Hosting.
- In Chrome Desktop compatible with Gemini Nano 4, run Firebase **On-device only** and record provider `ON_DEVICE` if actually available. Run **Cloud only** with consent, and record `IN_CLOUD`. If local fails, show the real SDK error; test automatic fallback separately with `Prefer on-device`.
- Confirm App Check attestation, Firestore or auth **only if actually implemented**; do not advertise simulated features.
- Check browser console for errors, test 360px mobile width and desktop. Host URL and video must load when signed out.
- YouTube demo: English narration/subtitles, max 3 minutes; public repo and license. Describe what was built during the contest.

### Publication policy

The exported question records deliberately exclude answer keys, explanations, personal progress and secrets. Public static files are not suitable for secure high-stakes grading; the separate V4.5 learning checks are educational-only and locally graded. All content is an editorial draft and needs subject-expert review before scientific approval claims.

The `scripts/.v47-backups/` directory contains local safety backups and must not be committed. `public/data/learning/` and `public/data/molecules/` *should* be committed or deployed as non-sensitive public assets, after reviewing their content. Never commit `.env`, `google-services.json`, private books/PDFs or database files.

## Rollback

Backups are under `scripts/.v47-backups/<timestamp>/`. Restore any changed original files from there (preserving the relative path). Newly added V4.7 source files can be removed after restoring `StudyExperienceV44.tsx`, `MolecularIntelligenceLab.tsx` and `vite.config.ts`. This does not touch prior V4.5/V4.6 changes.
