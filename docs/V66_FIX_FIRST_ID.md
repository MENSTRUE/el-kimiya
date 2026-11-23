# El-Kīmiyā V6.6 — Fix First

## Why

The existing public library displayed eight private-PDF catalogue entries but no directly readable public materials. The old library teaser/demo cards were prominent and included demonstration progress that could be mistaken for real user progress. The V6.3 glassware illustration included a liquid clipping path not matching the visible vessel and showed colored liquid at zero drops. The reset control lacked visible contrast in some styles.

## Changes

1. `#library`: original authored `src/data/course-v45.ts` lessons are immediately readable for anyone, in Indonesian and English; a genuine 13-lesson public shelf, not claimed to be eight private PDFs or a full copy of OpenStax.
2. Keyword search works without AI; an opt-in, browser-only Hugging Face Transformers.js model (multilingual MiniLM) can re-rank lesson titles and content on request. Remote library and model are fetched from CDN/HF only after a click; if unavailable, keyword search remains available. No private PDFs or tokens are sent to HF. Result is retrieval ranking, not a generated answer.
3. Reader: font sizing, font family, short lesson practice checks, external source links, direct call to existing Firebase chemistry Tutor via the already-used `askAbout` route.
4. Existing private PDF catalogue/reader remains accessible under a clearly labelled disclosure; TXT/MD tools and old sample cards stay available under disclosures instead of dominating the public reading experience. V6.5 browser private reading and JSON extraction remain intact.
5. Petrochemical demo: new glassware renderer uses matching interior SVG clip path and displays NO liquid at zero volume/drops, capped at plausible height; light high-contrast Reset styling. Model math, controls, history and AI route unchanged.

## Non-goals and limitations

- Hugging Face browser inference is *not* the hackathon's Firebase Hybrid AI requirement. Firebase must still be demonstrated separately and accurately.
- A downloaded embedding model can be large, slow, unavailable, or blocked on restricted networks. No model is downloaded on initial visit. Query and indexed documents consist only of original course text; private PDFs are not indexed by this feature.
- The public lessons are concise, original **educational drafts**, not validated full textbooks or certified curriculum.
- No predictive petrochimical digital twin or ASTM compliance is claimed. SVG illustration has no experimental truth.
- The eight local PDFs and extracted JSON remain in `private/` and should not be committed or copied into `public/`.

## Verify

`python install-v66.py --project "D:\el kimiya" --dry-run`
`python install-v66.py --project "D:\el kimiya"`
`node scripts/test-v66.mjs`
`npm run release:build`

After Vercel Ready: open `/#library`, read a lesson with no PDF selected, try keyword search, optionally test Hugging Face search after model download, test Tutor/Practice routes, expand Private PDF catalogue; then open `/#molecules` and check zero drops, high drops, and Reset button.

## Copyright

Original course text resides in `course-v45.ts`; external chapter links merely point to OpenStax Chemistry 2e for manual source verification. No copyrighted private book was republished.
