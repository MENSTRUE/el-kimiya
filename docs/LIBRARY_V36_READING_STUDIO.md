# El-Kīmiyā V3.6 · Immersive Reading Studio

## What's changed

- Click a book card to replace the catalog with a full inline reading workspace. No modal overlays.
- Mozilla PDF.js renders pages to canvas rather than showing the browser's built-in PDF viewer inside an iframe.
- Native El-Kīmiyā reading controls: previous/next, page number, zoom, keyboard arrow keys, sidebar, fullscreen.
- When present, PDF outlines become a navigable table of contents.
- A **private** JSON index supports full-book search, page-specific excerpts and selectable text mode. PDF remains the authoritative source for images/equations/tables.
- Page number is automatically persisted in the existing browser-local progress state.
- Page annotations can be written, saved and revisited privately in browser localStorage.
- Research workflows and explicit consent before sending excerpts to Firebase AI remain unchanged.

## Installation

Run the packaged `install-library-v36.ps1` with `-ProjectDir "D:\el kimiya"` from Windows PowerShell 5.1 or later.
The installer backs up changed source files, adds pinned `pdfjs-dist@5.4.624`, runs the project's existing tests/typecheck/build and security checks. On failure, source and package manifests are restored. Node modules may remain after rollback and `npm install` may be needed to reconcile.

## Private index (JSON)

`private/chemistry-books` contains the original PDF books copied during V3.4.
The installer attempts to generate `private/chemistry_index.json` with `scripts/build_private_index.py` if PyMuPDF is available.

If index creation is skipped:

```powershell
cd "D:\el kimiya"
py -m pip install pymupdf
py scripts\build_private_index.py --input-dir private\chemistry-books --output private\chemistry_index.json
```

Restart Vite, open `http://localhost:5173/#library`, click a book and use **Cari isi**. No manual JSON upload necessary locally.

JSON is for searchable text and exact PDF page references. **It is not a replacement for PDF**. Text extraction has limitations for scans, math notation, multilingual fonts and tables. The original PDF page must be checked for authoritative citations.

## Safety

- `private/` and `*.pdf` are Git-ignored; do not commit or host PDFs or extracted JSON.
- Local plugin routes `/__elkimiya_local_books__/pdf/:id` and `/__elkimiya_local_books__/index.json` only run in Vite development and check the loopback host/origin. Never expose Vite dev server to LAN or a tunnel.
- No Firebase/AI request is needed to open or render PDFs.
- **Discuss in AI Tutor** provides book name and page reference but does not claim to have read source bytes automatically. For grounded AI responses use the explicit private search + consent workflow.
- A public Firebase Hosting build includes the reading UI and PDF.js worker, not private PDFs or private JSON. Users must attach their own legal PDFs.
- Do not commit `VITE_APPCHECK_DEBUG_TOKEN` or any Firebase debug credential.

## Acceptance tests

1. Install patch and see `V3.6 ... PASS` after TypeScript/build checks.
2. Start Vite on localhost; open My Library and verify 8/8 PDFs connected.
3. Click book — catalog is replaced by Reading Studio, **no browser PDF toolbar**.
4. Click next page; verify canvas changes; use zoom, page number, Full Screen and Back.
5. Close/reopen book; verify saved reading position.
6. If JSON exists, search for `ikatan`, select a result and switch Document/Text mode.
7. Verify production `dist/` contains no `chemistry_index.json` or PDF books.
8. Manually verify Chrome/Edge at desktop and mobile widths; static checks cannot prove UI behavior.
