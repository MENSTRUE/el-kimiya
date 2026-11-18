# El-Kīmiyā interactive V2 — implementation & QA notes

## User journeys

1. **Save a note:** Dashboard → Library → Reader → select passage → Save note → Saved Notes; refresh and confirm persistence.
2. **Practice correctly:** Practice Lab → select 2,1,2 for `H₂ + O₂ → H₂O` → Correct. Repeat with 1,1,1 → Wrong; only the correct option is highlighted.
3. **Check conservation:** Practice Lab → coefficient steppers, set [2,1,2] → both atom counts match; set [1,1,1] → mismatch.
4. **Flashcards:** Reader → Make flashcard → Flashcards → flip → rate → next card; refresh and rating remains locally.
5. **Captured passage:** Mobile Scan → upload JPEG/PNG from gallery or phone camera → manually type/review content → Save note or Create flashcard → inspect result.
6. **Actual hybrid:** Configure Firebase `.env` and App Check → Hybrid AI → live test → see `inferenceSource`. Repeat in Cloud only, then Prefer on-device on compatible Chrome Desktop.

## Test checks not executed in the current authoring environment

- `npm install`, `npm run build` and `npm run typecheck` against real dependencies.
- Full Chrome/Firefox responsive browser flows and keyboard screen-reader tests.
- Firebase request App Check verification with actual project credentials.
- Android-native app and AICore/Google AI model download.

Do not claim any of these passed unless run on your environment. Check DevTools console, screenshot 360/390/768/1280/1440 px, Chrome web offline fallback, actual request provider and failure cases.

## Critical design integrity

- Official SVG brand asset is unchanged and displayed through `BrandMark`.
- Curated response vs live model provider is shown explicitly.
- No fabricated Gontor textbook citations.
- Uploaded image is never silently OCR'd or sent to a server.
- Real local notes and stats remain in browser localStorage, not synced.
