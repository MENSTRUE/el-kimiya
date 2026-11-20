# El-Kīmiyā V3.8 · Bahasa Indonesia / English

## Scope
- A functional **ID | EN language switch** in the landing page and app header, plus a synchronized Language & region Settings control.
- Local language preference saved in existing `localStorage['elk.language']` (`English` / `Bahasa Indonesia`).
- App UI translations including navigation, dashboard, study tools, V3.6 Reading Studio, V3.7 Chemistry & Faith.
- Arabic Qur'an text, formulas, citations, and original user PDF text **are not translated**. This is not a PDF machine translation tool.
- AI Tutor live requests receive an explicit chosen-language instruction, subject to actual model behavior. Already-generated answers and private source excerpts remain intact.
- UI content dictionaries are in `src/lib/language.tsx`; translators can refine phrases there. Missing terms display their original text rather than inventing translations.

## Verification
- `node scripts/check-v38.mjs`
- `npm run verify`
- Test `/#landing`, `/#dashboard`, `/#library`, `/#faith`, `/#tutor`, `/#settings` and open a book into Reading Studio.
- Toggle ID/EN and refresh. Ensure the choice persists and no PDF/source data change.

## Security
- No source PDFs, generated PDF indexes, `.env` secrets, or Firebase credentials are added to this patch.
- V3.8 does not upload or translate private documents; existing PDF consent protections remain unchanged.
