# El-Kīmiyā V3.5 — Library Experience

## Why this release

The V3.4 implementation auto-connects eight PDF books but presents dense bibliographic cards, requires selecting a book and then finding the reading action, and offers a basic modal PDF preview. V3.5 improves real usability without changing the Firebase AI integration.

## Functional improvements

- **One click to read:** click a connected book card to open a large, accessible reading overlay. The title, classification and original metadata remain visible. Native browser PDF rendering is used; no PDF is uploaded.
- **Continue reading:** a remembered PDF page is stored in browser localStorage only, and the hero action returns to that page. The viewer includes next/previous buttons, direct page entry, save-page, open-in-new-tab, and Escape to close.
- **Honest progress:** the app tracks *the manually bookmarked page*, not automatically detected PDF scroll progress. Changing the page selector never implies that the user read earlier pages.
- **Library discovery:** search by title, author and topics; filter by catalog category, favorites, and books with saved progress; sort by title or length.
- **Favorites:** simple browser-local persistence; no account or backend required.
- **Source research:** the existing private JSON index and user consent gate before sending excerpts to cloud AI are preserved behind a progressive-disclosure panel.
- **UI polish:** custom editorial book covers (NOT copied textbook covers), navy/cream visual language, responsive layout, hover and reduced-motion support.

## Data/privacy boundaries

- The V3.4 private book plugin still serves allowlisted PDFs only in `vite dev` bound to loopback (`127.0.0.1`) and same-origin requests. It is not part of Firebase Hosting output.
- Browsers on other devices and public Hosting cannot automatically read `D:\el kimiya\private\chemistry-books`. They require choosing local files or an explicit licensed distribution system.
- PDF bytes never enter localStorage. Only book IDs, favorite IDs and page numbers do.
- PDF scroll position cannot be tracked from a native PDF iframe; `Simpan halaman` remembers the chosen page selector. Users can open the PDF in a new tab for native browser toolbar features.
- This is a reader and study UX patch, **not** proof of working on-device inference. Firebase AI status remains separate.
- Do not commit source textbooks, private indexes, `.env`, `.env.development.local`, debug tokens, or other secrets to GitHub. Respect each source's copyright terms.

## Verification

Run:

```powershell
cd 'D:\el kimiya'
node scripts/check-library-v35.mjs
npm run verify
npm run dev -- --port 5173
```

Open `http://localhost:5173/#library`. Confirm `8/8` PDFs connected, click a card, navigate to PDF page 3, save the page, close, refresh and click Continue. Then test search, favorites and `Import JSON` only if your private index exists.

Expected: static + typecheck + build success. Full browser UX must be confirmed on your machine, using your local PDFs.
