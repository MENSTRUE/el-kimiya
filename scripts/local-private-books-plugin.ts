/**
 * El-Kīmiyā local-only PDF bridge.
 *
 * - Vite DEV SERVER ONLY (never runs in vite build / Firebase Hosting)
 * - Reads only eight allowlisted files from private/chemistry-books
 * - No filesystem-path parameter supplied by the browser
 * - No CORS; denies cross-origin requests; binds only to loopback (enforced in Vite config)
 * - Supports Range for native browser PDF preview
 *
 * IMPORTANT: do not expose the dev server to your LAN or a public host.
 */
import { createReadStream, existsSync, lstatSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import type { Plugin } from 'vite';

const PREFIX = '/__elkimiya_local_books__';
const BOOK_IDS = [
  'kuncoro-2021', 'kimia-dasar', 'yahdi-2020', 'cucu-2022',
  'uii-2017', 'kemenag-2013', 'kusuma-2020', 'water-2024',
] as const;
const MAX_FILE_BYTES = 80_000_000;

export function localPrivateBooksPlugin(): Plugin {
  const dir = path.resolve(process.cwd(), 'private', 'chemistry-books');

  function locateBooks(): Map<string, { file: string; size: number }> {
    const result = new Map<string, { file: string; size: number }>();
    if (!existsSync(dir) || !lstatSync(dir).isDirectory() || lstatSync(dir).isSymbolicLink()) return result;
    const names = readdirSync(dir).sort((a, b) => a.localeCompare(b));
    for (const id of BOOK_IDS) {
      const filename = names.find(name => name.startsWith(id + '__') && /\.pdf$/i.test(name));
      if (!filename) continue;
      const file = path.join(dir, filename);
      try {
        const info = lstatSync(file);
        if (info.isFile() && !info.isSymbolicLink() && info.size > 0 && info.size <= MAX_FILE_BYTES) {
          result.set(id, { file, size: info.size });
        }
      } catch { /* file was changed concurrently */ }
    }
    return result;
  }

  return {
    name: 'el-kimiya-private-pdf-localhost-only',
    apply: 'serve',
    configureServer(server) {
      // This plugin MUST NOT serve private files over a LAN or tunnel.
      const host = server.config.server.host;
      if (host !== '127.0.0.1' && host !== 'localhost') {
        throw new Error('Private PDF library requires Vite server.host = 127.0.0.1 (localhost only).');
      }
      server.middlewares.use((req, res, next) => {
        let pathname: string;
        try { pathname = new URL(req.url || '/', 'http://localhost').pathname; }
        catch { return next(); }
        if (pathname !== PREFIX + '/manifest.json' && !pathname.startsWith(PREFIX + '/pdf/')) return next();

        const hostHeader = String(req.headers.host || '').toLowerCase();
        const allowedHost = /^(localhost|127\.0\.0\.1)(:\d+)?$/.test(hostHeader);
        const origin = req.headers.origin;
        const sameOrigin = !origin || origin === `http://${hostHeader}`;
        const fetchSite = req.headers['sec-fetch-site'];
        res.setHeader('Cache-Control', 'no-store, private');
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
        res.setHeader('Referrer-Policy', 'no-referrer');
        if (!allowedHost || !sameOrigin || (fetchSite && !['same-origin', 'none'].includes(String(fetchSite)))) {
          res.statusCode = 403; res.end('Forbidden'); return;
        }
        if (req.method !== 'GET' && req.method !== 'HEAD') {
          res.statusCode = 405; res.setHeader('Allow', 'GET, HEAD'); res.end(); return;
        }
        const books = locateBooks();
        if (pathname === PREFIX + '/manifest.json') {
          const list = BOOK_IDS.filter(id => books.has(id)).map(id => ({
            bookId: id, url: `${PREFIX}/pdf/${id}`,
          }));
          const data = JSON.stringify({ schemaVersion: 1, books: list });
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.statusCode = 200;
          if (req.method === 'HEAD') { res.end(); return; }
          res.end(data); return;
        }
        const id = pathname.substring((PREFIX + '/pdf/').length);
        if (!BOOK_IDS.some(candidate => candidate === id)) {
          res.statusCode = 404; res.end('Not found'); return;
        }
        const entry = books.get(id);
        if (!entry) { res.statusCode = 404; res.end('Book not found locally'); return; }
        try {
          // One last check to fail closed if the file changed after discovery.
          const current = statSync(entry.file);
          if (!current.isFile() || current.size !== entry.size) throw new Error('File changed');
        } catch { res.statusCode = 404; res.end('Book unavailable'); return; }
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'inline');
        res.setHeader('Accept-Ranges', 'bytes');
        let start = 0, end = entry.size - 1;
        const range = req.headers.range;
        if (range) {
          const match = /^bytes=(\d*)-(\d*)$/.exec(range);
          if (!match || (!match[1] && !match[2])) {
            res.statusCode = 416; res.setHeader('Content-Range', `bytes */${entry.size}`); res.end(); return;
          }
          if (match[1]) {
            start = Number(match[1]);
            if (match[2]) end = Number(match[2]);
          } else {
            const suffix = Number(match[2]);
            start = Math.max(0, entry.size - suffix);
          }
          if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start > end || start >= entry.size) {
            res.statusCode = 416; res.setHeader('Content-Range', `bytes */${entry.size}`); res.end(); return;
          }
          end = Math.min(entry.size - 1, end);
          res.statusCode = 206;
          res.setHeader('Content-Range', `bytes ${start}-${end}/${entry.size}`);
        } else res.statusCode = 200;
        res.setHeader('Content-Length', String(end - start + 1));
        if (req.method === 'HEAD') { res.end(); return; }
        const stream = createReadStream(entry.file, { start, end });
        stream.on('error', () => { if (!res.headersSent) res.statusCode = 500; res.destroy(); });
        stream.pipe(res);
      });
    },
  };
}
