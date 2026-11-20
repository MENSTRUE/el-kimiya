#!/usr/bin/env node
/** El-Kīmiyā V3.3: block deployment when local debug secrets remain. */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, resolve, relative } from 'node:path';

const root = resolve(process.cwd());
const checkDist = process.argv.includes('--dist');
const problems = [];
const envFiles = ['.env', '.env.production', '.env.local', '.env.production.local'];
const envVars = []; // Inspect EVERY env file, not just the value with highest precedence.
function parseEnv(path) {
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const match = /^\s*(VITE_[A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
    if (!match) continue;
    envVars.push([path, match[1], match[2].trim().replace(/^['"]|['"]$/g, '')]);
  }
}
for (const name of envFiles) parseEnv(join(root, name));
for (const [, name, value] of envVars) {
  if (name === 'VITE_APPCHECK_DEBUG_TOKEN' && value) {
    problems.push('VITE_APPCHECK_DEBUG_TOKEN masih terisi. Hapus baris token dari semua .env* sebelum build publik.');
  }
  if (name === 'VITE_APPCHECK_DEBUG' && value.toLowerCase() === 'true') {
    problems.push('VITE_APPCHECK_DEBUG=true. Set false sebelum build/deploy publik.');
  }
}
if (process.env.VITE_APPCHECK_DEBUG_TOKEN) problems.push('Environment OS memiliki VITE_APPCHECK_DEBUG_TOKEN.');
if (process.env.VITE_APPCHECK_DEBUG === 'true') problems.push('Environment OS memiliki VITE_APPCHECK_DEBUG=true.');

if (!existsSync(join(root, 'firebase.json'))) problems.push('firebase.json tidak ada.');
else {
  try {
    const config = JSON.parse(readFileSync(join(root, 'firebase.json'), 'utf8'));
    if (config.hosting?.public !== 'dist') problems.push('Hosting public harus dist.');
  } catch { problems.push('firebase.json bukan JSON valid.'); }
}

try {
  const tracked = execFileSync('git', ['ls-files', '-z'], { cwd: root }).toString().split('\0').filter(Boolean);
  const banned = tracked.filter(p =>
    /^\.env(?:$|\.(?!example$))/.test(p) ||
    /(?:^|\/)google-services\.json$/.test(p) ||
    /(?:^|\/)(?:private|books-private)\//.test(p) ||
    /\.pdf$/i.test(p)
  );
  if (banned.length) problems.push(`Git melacak file yang harus privat (${banned.length} file). Periksa git ls-files.`);
} catch { console.log('[INFO] Git tracked-file check skipped (no Git available).'); }

if (checkDist) {
  const dist = join(root, 'dist');
  if (!existsSync(join(dist, 'index.html'))) problems.push('dist/index.html belum ada; jalankan npm run build.');
  if (existsSync(dist)) {
    function visit(p) {
      for (const entry of readdirSync(p)) {
        const full = join(p, entry);
        if (statSync(full).isDirectory()) visit(full);
        else if (/\.(?:pdf|env|pem|key|p12|p8)$/i.test(entry) || entry === 'google-services.json') {
          problems.push(`File tidak boleh dideploy: ${relative(dist, full)}`);
        }
      }
    }
    visit(dist);
  }
}

if (problems.length) {
  for (const p of problems) console.error('[BLOCK] ' + p);
  console.error('RELEASE BLOCKED — hapus konfigurasi debug/artefak privat. Tidak ada kredensial yang dicetak.');
  process.exitCode = 1;
} else {
  console.log('[PASS] Release security preflight: no active App Check debug setting, no tracked private data, Hosting dist configured.');
  if (checkDist) console.log('[PASS] dist artifact scan completed.');
}
