# El-Kīmiyā V6.5 — Real Progress Dashboard + Private PDF Text Reader

## Problem resolved

- The original dashboard showed demonstration figures like a fictional study duration / streak. V6.5 changes the **dashboard route** to a separate `DashboardRealV65` reading saved activity from this browser, with truthful zero and empty states. The original component is retained but not the default route.
- The private reading studio's **Text** tab depended on a pre-built local index. The V6.5 **Teks Nyaman** tab extracts a text layer from the already-opened PDF using `pdfjs-dist`, then offers font-family, font-size, and line-spacing controls.
- Users can optionally import a per-book JSON generated **locally** by `scripts/export_private_books_v65.py`. JSON filename is `<book-id>.json`, matching `src/data/books.ts` IDs.

## User flow

### On Vercel

1. Visit `/#library` and select **Buka PDF sendiri** from an existing catalogue card.
2. Select a PDF in the native local file picker; the browser creates a local object URL. It is not uploaded.
3. Inside the reader, choose **Teks Nyaman**, adjust font, copy text, switch back to **Dokumen**, and move between PDF pages.
4. If the PDF is scanned/image-only, PDF.js will not invent text. You will see a no-text warning. OCR is not included.
5. Optional: import `<book-id>.json` via the reader's **Impor JSON privat** button, which loads text into browser memory. The ID is checked against the selected book.

### On local Windows laptop

1. Keep all eight original PDFs under `D:\el kimiya\private\chemistry-books`. Do not move them to `public/` or commit them.
2. Run `python -m pip install "pymupdf>=1.24,<2"` in your VENV.
3. Run `python scripts/export_private_books_v65.py --project "D:\el kimiya"`.
4. JSON is written to `private/chemistry-text-v65/<book-id>.json`; generated data stays local.
5. Run `python scripts/build_private_index.py` if you want to preserve the *existing* local-private-index search functionality. JSON exports are a separate format and do not replace the index.

## Limitations

- Dashboard data is **browser-local**. A different device or cleared storage may show zero. Some `elk.stats` and V6.3 counters represent the same quiz attempts; the dashboard avoids adding them together to prevent obvious double-counting.
- PDF text layers may omit table layouts, equations, images, headers, or column ordering; use original PDF for authoritative pagination and formatting. No OCR runs automatically.
- This release is not a secure multi-user document server. The PDF never enters Vercel hosting. JSON exports are user-owned local files, not public library data.
- For public distribution of book text, obtain explicit rights/licensing before uploading any content.
- Source-level checks cannot establish that all browser UI flows work; verify manually in Chrome after Vercel deployment.

## Rollback

Installer backups are created in `private/v65-reader-backups/<timestamp>/` as `App.tsx` and `PrivateReadingWorkspace.tsx`. If build fails, restore only those two files from the newest backup and delete the three added UI files if desired. Do not reset unrelated changes.

## Test

`node scripts/test-v65.mjs`, `python -m unittest discover -s tests -p test_export_private_books_v65.py -v`, and `npm run release:build`.
