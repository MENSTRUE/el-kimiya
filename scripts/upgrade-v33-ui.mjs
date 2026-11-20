#!/usr/bin/env node
/** Safely update only the misleading demo copy in existing El-Kīmiyā UI. */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
const file = 'src/App.tsx';
if (!existsSync(file)) throw new Error('src/App.tsx not found. Run from project root.');
let code = readFileSync(file, 'utf8');
const oldText = 'El-Kīmiyā chooses a suitable available path while keeping you informed. This prototype\n          simulates routing and does not execute a real model.';
const newText = 'The cards below simulate routing for learning. Scroll to LIVE SDK VERIFICATION\n          for real Firebase requests and verified cloud/on-device inference results.';
if (code.includes(oldText)) {
  code = code.replace(oldText, newText);
} else if (!code.includes(newText)) {
  throw new Error('UI text differs from GitHub V3.2; App.tsx left untouched.');
}
const needle = '        {running&&<p role="status">';
const note = "        {preference === 'On-device only' && <p>On-device mode needs compatible Chrome Desktop (139+), Prompt API enabled, and local model download. This mode never claims cloud fallback as local success.</p>}\n";
if (!code.includes(note)) {
  if (!code.includes(needle)) throw new Error('LIVE test section changed; App.tsx left untouched.');
  code = code.replace(needle, note + needle);
}
writeFileSync(file, code);
console.log('[PASS] UI clarifies real-vs-simulated inference and local requirements.');
