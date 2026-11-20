#!/usr/bin/env node
/** Bind Vite dev to loopback so a browser-only debug bypass is NOT served to LAN. */
import { readFileSync, writeFileSync } from 'node:fs';
const file='vite.config.ts';
const code=readFileSync(file,'utf8');
const oldText = "server: {\n      host: process.env.FIGMA_DEV_SERVER_HOST || '0.0.0.0',";
const newText = "server: {\n      // V3.3: bind to loopback so App Check dev tokens cannot be read over LAN.\n      host: '127.0.0.1',";
if (code.includes(newText)) {
  console.log('[PASS] Vite dev server already localhost-only.');
} else if(code.includes(oldText)) {
  writeFileSync(file,code.replace(oldText,newText));
  console.log('[PASS] Vite dev host restricted to 127.0.0.1.');
} else {
  throw new Error('Unexpected vite.config.ts server.host; not changing it blindly.');
}
