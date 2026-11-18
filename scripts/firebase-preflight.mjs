#!/usr/bin/env node
/** Offline Firebase setup diagnostics. Never prints API keys or App Check tokens. */
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
const envArg = process.argv.indexOf('--env');
const path = resolve(envArg >= 0 ? (process.argv[envArg + 1] || '.env') : '.env');
function readEnv(path) {
  if (!existsSync(path)) return null;
  const values = {};
  for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*(?:export\s+)?(VITE_[A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!match) continue;
    let value = match[2].trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
    values[match[1]] = value;
  }
  return values;
}
function valid(v) { return !!v && !/^(YOUR_|REPLACE_|<|\$\{)/i.test(v); }
let failed = false;
const report = (okay, msg) => { console.log(`${okay ? '[PASS]' : '[FAIL]'} ${msg}`); if (!okay) failed = true; };
const version = process.versions.node.split('.').map(Number);
report(version[0] > 24 || (version[0] === 24 && version[1] >= 12), `Node >= 24.12 required for installed Firebase; current ${process.version}`);
const config = readEnv(path);
report(config !== null, '.env exists (create by copying .env.example)');
if (config) {
  for (const field of ['VITE_FIREBASE_API_KEY', 'VITE_FIREBASE_PROJECT_ID', 'VITE_FIREBASE_APP_ID']) {
    report(valid(config[field]), `${field} is set`);
  }
  const kind = (config.VITE_APPCHECK_PROVIDER || 'v3').toLowerCase();
  report(['v3','enterprise'].includes(kind), 'App Check provider is v3 or enterprise');
  report(valid(config.VITE_FIREBASE_APPCHECK_SITE_KEY || config.VITE_FIREBASE_RECAPTCHA_SITE_KEY), 'App Check public site key is set');
  if (config.VITE_APPCHECK_DEBUG === 'true') console.log('[INFO] Debug token enabled for LOCAL development. Register generated token in Firebase Console. Do not publish it.');
  console.log('[INFO] Env formatting only; this does NOT verify API activation, domain authorization, App Check registration, or model access.');
}
console.log(existsSync('android/app/google-services.json') ? '[INFO] Android google-services.json exists locally' : '[INFO] Android google-services.json missing (required before Android runtime).');
if (failed) { console.error('Firebase preflight incomplete. Follow docs/FIREBASE_LIVE_SETUP.md.'); process.exitCode = 1; }
else console.log('LOCAL CONFIG CHECK PASS. Next: Hybrid AI > Run real inference test in Chrome.');
