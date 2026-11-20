# El-Kīmiyā: automatic local PDF library (V3.4)

## Purpose

When Vite runs locally, the UI automatically discovers eight private PDFs under:

`D:\el kimiya\private\chemistry-books`

No need to click **Choose local PDF folder** every session. The PDF preview still uses the native browser PDF viewer.

## Requirements

- Run `npm run dev -- --port 5173` from the project root.
- Open `http://localhost:5173/#library` or `http://127.0.0.1:5173/#library` on **the same laptop**.
- The eight PDF files from the previous import must exist under `private/chemistry-books` and begin with IDs such as `kuncoro-2021__...pdf`.
- Vite must bind to `127.0.0.1`. The plugin refuses to start when configured for a public/LAN host.

## Privacy/security

The Vite development server makes the eight private PDF files readable to **other pages under this local origin**. Use it only on a trusted machine. The middleware rejects cross-origin requests and restricts file selection to eight allowlisted IDs. It is **not** an authentication service.

The middleware is `apply: 'serve'`: production `vite build` / Firebase Hosting do **not** contain the route and never ship any PDF bytes. Files in `private/` remain ignored by Git and excluded from `dist/`.

**On the public Firebase website**, browser security prohibits silently reading arbitrary files from users' computers. Therefore, users must still select their own folder/files, or you must license content for redistribution and implement a separate hosted library.

Do not place copyrighted books in `public/`, `dist/`, a public Git repository, or Firebase Hosting without permission.

## How to verify

1. Restart Vite, open `http://localhost:5173/#library`.
2. Expect `Project PDFs connected automatically` and `8/8 PDFs connected`.
3. Select any of the eight book cards and click **View PDF again**.
4. Optional local smoke test: open `http://localhost:5173/__elkimiya_local_books__/manifest.json`; it should return only 8 book IDs/URLs, **not PDF content or local file paths**.
5. `npm run verify`, `git status -sb`, and confirm no PDFs in `dist/`.

If zero PDFs connect: check the `private/chemistry-books` folder, restart Vite, and ensure you're opening the local URL rather than the deployed Firebase URL.

PDF text indexing / AI Tutor RAG remains a separate private workflow (`python scripts/build_private_index.py`). Simply attaching PDFs does not turn them into an AI knowledge base.
