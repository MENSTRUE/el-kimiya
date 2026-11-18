# El-Kīmiyā — Interaction Design Blueprint V2

**16 November 2026 · Source audited:** `El-Kimiya_Studio_UIUX_Redesign_v1.zip` (`src/App.tsx` + `src/editorial.css`).

## Non-negotiable product principles

1. **Functional truth:** If a UI says Saved, persisted data must exist; if a quiz says Correct, its scoring must really validate the answer. Mark all mock AI, OCR, offline and data explicitly as demos until implemented.
2. **Purposeful motion:** Animation communicates navigation, causality, feedback, or learning—not decorative activity. Respect `prefers-reduced-motion`.
3. **Chemistry accuracy:** Visual models must indicate simplifications and avoid suggesting an unsupported 3D simulation.
4. **Offline clarity:** Cached textbooks, on-device inference and cloud operations are three separate capabilities. Display actual available functions, not blanket “offline AI.”
5. **One interaction language:** Consistent hover/press/focus, sheet/modal, toasts, transitions, disabled and error states across all screens.

## Verified V1 code observations

- `TutorPage` (`src/App.tsx` ~956): user input only switches the screen to a fixed salt-and-water demo answer. Respond to actual input or present clearly constrained sample prompts.
- `PracticePage` (~1362): `checked` triggers a universal “Exactly right” feedback even for wrong answers. Validate selected answer index; show correct/incorrect explanation distinctly.
- `ReaderPage` (~768): toolbar action buttons lack handlers; the flashcard action is inert. `saveNote` in `App` (~2019) only triggers a toast, not persistent storage.
- `FlashcardsPage` (~1592): clicking ratings increments counter but displays the same fixed question; implement an actual deck, card index, reset flip, and saved review state.
- `ExplorerPage` (~1488): “Drag to inspect” is static; the save and ask AI buttons are inert. Either implement controls or remove the claims.
- `ScanPage` (~1809): simulated capture/recognized text; gallery, flash and options buttons are inert. Clearly label demo and add actual browser file upload for the web prototype; mobile native camera later.
- `HybridPage` (~1152): scenarios are simulations; keep them demo-only until Firebase hybrid SDK is actually invoked and actual used inference provider is captured.
- `App` (~2013): navigation is a client state enum without URL/back history, saved data is not persisted, toast feedback is hardcoded.

## Interaction priorities — high-quality MVP

### 1. Dashboard → Library → Reader
- Hover: subtle book card shadow, 2px elevation, 150–200ms.
- Tap: selected card visually expands to chapter; maintain scroll position and back navigation.
- Reader: highlight selection; contextual toolbar with Explain, Note, Flashcard; actual note persistence; visible source provenance.
- Show a distinct pressed/focus state and a meaningful toast with a “View note” action.

### 2. Tutor and hybrid inference
- Four separate states: idle, connecting, generating, completed/failed.
- Show which provider actually handled the request, not merely the configured preference.
- Explain failover: unavailable local model, no connectivity, unsupported task, or quota/permission error.
- Cached responses are marked “Previously generated.” Support cancellation and retry.
- For on-device Web, target supported Chrome Desktop; for Android, validate supported device; both use Firebase AI Logic Hybrid Inference SDK. Never fake runtime execution.

### 3. Chemistry practice
- Eq balancing: adjust coefficients with stepper controls and live atom counts on both sides; correctness from conservation of atoms.
- Quiz: choose answer → check → immediate accurate feedback → explanation → next; keyboard accessible.
- pH: slider + legend and qualitative explanation. Label examples as educational approximations.
- Mini challenge should work by pointer and keyboard without forcing drag.

### 4. Chemistry explorer
- Select element → property panel responds with actual data; introduce selected state and comparison.
- For 3D: only display “drag to rotate” after implementing an actual 3D or interactive visualization; otherwise show a precise 2D model.
- Display bond definitions and geometry caveat, sources, formula and unit metadata.

### 5. Mobile scan + offline
- Mobile: camera permission explanation before permission request; crop and confirmation after capture; preserve scan state while switching tabs.
- OCR: distinguish detected text from verified textbook references. Give an edit/correct workflow.
- Offline: local downloaded materials and cached quizzes work reliably independent of local generative AI availability.
- When network recovers, pending sync shows conflict/retry/success states.

## Motion specifications (proposed defaults)

| Interaction | Target duration | Behavior |
| --- | --- | --- |
| Button press | 90–140ms | slight compression/shadow shift |
| Hover cards | 150–200ms | subtle elevation, no excessive tilt |
| Tab / filter | 160–220ms | shared underline + content fade |
| Sidebar toggle | 200–260ms | width/label transitions; no layout jumps |
| Modal/sheet | 220–300ms | short translation + fade |
| Navigation | 180–280ms | maintain spatial continuity |
| Flashcard flip | 280–380ms | user-triggered only, reduce-motion alternative |
| AI generation | state-based | actual progress/streaming if available; no fake spinner completing automatically |

Avoid continuous floating objects, pulsing everything, heavy page blur, parallax during reading, and hover-only essential actions.

## Responsive/UI quality gates

- Verify 360, 390, 768, 1280 and 1440 px widths; landscape and high text zoom; mobile safe areas and keyboard occlusion.
- Honor keyboard focus, Escape/back, pointer interactions, screen reader labels and visible error messages.
- WCAG 2.2 AA pointer targets at least 24×24 CSS px except listed exceptions; prefer ~44–48 CSS px for comfortable mobile primary actions.
- Contrast: target WCAG AA (4.5:1 for normal text; 3:1 large text and significant UI component boundaries).
- Respect `prefers-reduced-motion` and avoid severe motion triggers.
- Do not claim validation without running checks; run `npm install`, `npm run build`, keyboard checks, mobile responsiveness, and browser/device tests.

## Product visual direction

**Academic editorial × tactile science workspace**: official one-color navy calligraphic flask, ivory surfaces, crisp text hierarchy, restrained blue accents; no automatic AI sparkles as a general brand icon. Bring interest through lesson content, interactive molecules, source highlighting and responsive feedback instead of generic gradient dashboard cards.

## MVP must-pass user journeys

1. Open lesson → select concept → grounded explanation → save an actual note → find note under Saved Notes.
2. Solve balancing challenge incorrectly and correctly → corresponding accurate feedback, clear hint and next question.
3. Switch offline in demo → cached content remains available; non-supported AI clearly fails or uses real local mode when supported.
4. Scan/upload an example page → review/correct extracted text → ask for explanation → show sources/limitations.
5. On-device/cloud mode on a supported device → runtime evidence of the chosen/fallback provider, not a simulated badge.

## Research and standards

- Firebase Hybrid AI: https://firebase.google.com/docs/ai-logic/hybrid
- Firebase Android hybrid get started: https://firebase.google.com/docs/ai-logic/hybrid/android/get-started
- Firebase Web hybrid get started: https://firebase.google.com/docs/ai-logic/hybrid/web/get-started
- W3C WCAG 2.2: https://www.w3.org/TR/WCAG22/
- MDN prefers-reduced-motion: https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/prefers-reduced-motion
- Android shared element navigation: https://developer.android.com/develop/ui/compose/animation/shared-elements/navigation
- PhET chemistry examples: https://phet.colorado.edu/en/simulations/browse?subjects=chemistry

This document is an implementation plan and source review, **not** an assertion that the proposed interactions are already present or tested.
