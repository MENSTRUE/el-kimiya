#!/usr/bin/env node
/**
 * Move App Check debug bypass out of .env into .env.development.local.
 * This avoids bundling the bypass during `vite build` (production).
 * No token values are logged, and no Firebase credentials are transmitted.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
const shared = '.env';
const local = '.env.development.local';
if (!existsSync(shared)) {
  console.log('[INFO] No .env found. Configure Firebase using .env.example.');
  process.exit(0);
}
const original = readFileSync(shared, 'utf8');
const tokenMatch = /^\s*VITE_APPCHECK_DEBUG_TOKEN\s*=\s*(.*?)\s*$/m.exec(original);
const debugMatch = /^\s*VITE_APPCHECK_DEBUG\s*=\s*(.*?)\s*$/m.exec(original);
const token = tokenMatch?.[1]?.trim() || '';
const hadDebugEnabled = (debugMatch?.[1] || '').trim().toLowerCase() === 'true';

// Keep public Firebase config in .env; remove all debug token definitions.
let sharedSafe = original.replace(/^\s*VITE_APPCHECK_DEBUG_TOKEN\s*=.*(?:\r?\n|$)/gm, '');
if (/^\s*VITE_APPCHECK_DEBUG\s*=/m.test(sharedSafe)) {
  sharedSafe = sharedSafe.replace(/^\s*VITE_APPCHECK_DEBUG\s*=.*$/gm, 'VITE_APPCHECK_DEBUG=false');
} else {
  sharedSafe = sharedSafe.trimEnd() + '\nVITE_APPCHECK_DEBUG=false\n';
}
if (sharedSafe !== original) writeFileSync(shared, sharedSafe);

if (token || hadDebugEnabled) {
  let dev = existsSync(local) ? readFileSync(local, 'utf8') : '';
  if (/(?:^|\n)\s*VITE_APPCHECK_DEBUG\s*=/m.test(dev)) {
    dev = dev.replace(/^\s*VITE_APPCHECK_DEBUG\s*=.*$/gm, 'VITE_APPCHECK_DEBUG=true');
  } else {
    dev = dev.trimEnd() + '\nVITE_APPCHECK_DEBUG=true\n';
  }
  if (token) {
    if (/^\s*VITE_APPCHECK_DEBUG_TOKEN\s*=/m.test(dev)) {
      dev = dev.replace(/^\s*VITE_APPCHECK_DEBUG_TOKEN\s*=.*$/gm, `VITE_APPCHECK_DEBUG_TOKEN=${token}`);
    } else {
      dev = dev.trimEnd() + `\nVITE_APPCHECK_DEBUG_TOKEN=${token}\n`;
    }
  }
  writeFileSync(local, dev);
  console.log('[PASS] Debug mode moved to .env.development.local (gitignored, development-only).');
} else {
  console.log('[PASS] Shared .env uses production-safe debug=false.');
}
