# V3.7 Chemistry & Faith — QS. Luqman 31:20

## Scope
- New dedicated `#faith` page with Arabic QS Luqman 20, careful original Indonesian paraphrase (NOT a verbatim translation), external link to official Kemenag Quran.
- Five practical benefits of chemistry, three interactive case studies, a personal reflection integrated with the application's existing Save Notes functionality.
- Entry points: sidebar, public landing, dashboard, private Library, and global search.
- Existing V3.6 Reading Studio / PDF.js / automatic private PDF bridge / Firebase config untouched.
- No new npm dependencies. All chemical facts are illustrative educational content, not laboratory instructions.

## Source & epistemic boundary
- Kemenag Bimas Islam: https://bimasislam.kemenag.go.id/al-quran/luqman (surah 31, ayat 20).
- Verse text transcribed from Kemenag Quran. Indonesian meaning is a *paraphrase*, not the Kemenag official text. Users can click through to official text and interpretation.
- QS 31:20 is not a chemistry verse making statements about modern atomic or molecular theory. Chemistry examples and faith reflection are shown under separate labels.
- If you add tafsir later, cite an identifiable authoritative tafsir rather than AI-invented interpretation.

## Verification
- Run `npm run verify`, then open `http://localhost:5173/#faith`.
- Check RTL Arabic rendering, active tab switching, note saves to the existing Saved Notes page, Kemenag link, mobile layout, navigation and reduced-motion settings.
- No auto-deploy or Git push is done.
