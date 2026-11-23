# El-Kīmiyā V6.7 — final integrated research journey (ID/EN)

## Product thesis
Learn → ask a research question → state a hypothesis → run a **synthetic** numerical investigation → interpret results → optionally consult Firebase Hybrid AI → export an educational report.

### What is new
- Landing page marketing navigation scrolls within marketing sections. No anchor/hash-router collision.
- **Start Learning** leads to choice-based onboarding (library, mission, quiz, molecular lab).
- **Try Guest Mode** explains there is no real account or cloud-sync and proceeds to dashboard only after an explicit action.
- Research Mission is visible as a separate sidebar entry and on the real-progress Dashboard.
- Mission uses the existing V6.2 acid-number *arithmetic* model and V6.6 contained-glassware illustration. No new server required.
- Mission requires two distinct assumed drop sizes, an A–D knowledge check and an interpretation before completion. State is browser-local, no invented learning hours or streaks.
- Firebase AI Logic is **optional** and surfaces the returned actual inference source (ON_DEVICE / IN_CLOUD) or an explicit error; mission works without it.
- Export Markdown and JSON; browser Print / Save as PDF; optional copy to Saved Notes.
- Accessible language toggle (ID/EN), responsive layouts and reduced-motion styles.

### What is deliberately not claimed
- NOT a validated digital twin, physical titration, ASTM D664 test, industrial process prediction, real experiment, or safety recommendation.
- No new expert-reviewed chemistry dataset, automatic private PDF upload, real authentication, cloud progress synchronization, or guaranteed on-device AI availability.
- Print-to-PDF uses the browser's print dialog, not a backend PDF generator.

## Compatibility / privacy
- Requires current V6.6 El-Kīmiyā React/Vite repository.
- Preserves all V6.6 features, RDKit, Firebase, personal PDF reader, flashcards, question bank and 3D viewer.
- Does not read or upload `/private`, `.env`, personal books or JSON indexes.
- Only changes `src/App.tsx`, `src/components/DashboardRealV65.tsx`, `src/lib/language.tsx`; all others added.

## Local QA

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File '<extracted>\install-and-check-v67.ps1' -ProjectDir 'D:\el kimiya'
```

Test true browser behavior after Vercel Ready: marketing navbar stays on landing, two entry routes differ, mission 2 trials and report reload, print and export, AI verified on public URL, no private PDF leak.

## User story for a <= 3 minute demo
00:00 motivation → 00:20 landing onboarding → 00:40 read original public chemistry material → 01:00 Research Mission hypothesis → 01:20 two synthetic trials, comparison → 01:50 optional Firebase AI actual inference path → 02:15 report/export → 02:30 RDKit 2D/3D brief → 02:50 limitations and privacy.
