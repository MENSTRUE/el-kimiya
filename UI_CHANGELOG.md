# El-Kīmiyā — Interaction Redesign V2

**16 November 2026 — authored source update from Studio Edition V1**

### Correctness fixes

- Removed universal “Exactly right” response; now evaluates chosen quiz answer for three distinct balanced chemical equations.
- Added editable 1–6 stoichiometry coefficient steppers and live element count verification.
- Replaced flashcard counter-only interaction with a real changing deck, flip, ratings and completion.
- Notes are now saved, searched, copied and removed through browser-local storage.
- Made reader chapter selection, passage actions, larger text, bookmark and flashcard generation functional.
- Replaced falsely interactive 3D drag label with accurately described 2D molecule models and element data.
- Replaced scanner fake OCR with actual image selection and **manual** text review.
- Enabled `.txt/.md` import, local preview, delete, and note creation; no copyrighted text bundled.
- Separated curated demo tutoring from optional real Firebase AI Logic requests.
- Added verified provider reporting from Firebase `response.inferenceSource` when configured.
- Added new progress counters for locally answered quizzes and reviewed flashcards.
- Added browser hash history/back and cross-platform navigation.

### Visual and UX work

- Preserved user-approved monochrome El-Kīmiyā Arabic flask SVG.
- Added `src/interactive.css` for measured transitions, focus states, helper panels, mobile steps and cards.
- Added device-responsive coefficient practice, scan review, notes browser, live Firebase check and accessibility controls.
- Added opt-in reduced motion and maintained system `prefers-reduced-motion`.
- Kept original `src/index.css` and Studio V1 `src/editorial.css` intact.
- Added production service worker for visited app-shell resources, not AI responses.

### Status / limitations

Pure TypeScript/TSX syntax, CSS syntax and chemistry demo data tests passed. **Full install/build and end-to-end browser testing remain unverified.** Real Firebase setup, App Check and a supported device are required to demonstrate hybrid inference. No native Android code is included in this web/mobile-responsive package.
