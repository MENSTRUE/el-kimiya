#!/usr/bin/env node
/**
 * El-Kimiya V4.8 -- automated real-Chrome Firebase hybrid E2E checks.
 * Runs actual UI; never fakes model receipts or claims device fallback without proof.
 * Test prompts are safe, canned chemistry statements. No secrets are logged.
 * A dedicated persistent Chrome profile may need one-time App Check enrollment and model download.
 */
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const args = process.argv.slice(2);
const flag = (f) => args.includes(f);
const val = (p) => args.find((a) => a.startsWith(p))?.slice(p.length);
const wantsFull = flag('--full');
const onlySmoke = flag('--smoke');
const wantCloud = wantsFull || flag('--cloud');
const wantDevice = wantsFull || flag('--device');
const wantOffline = wantsFull || flag('--offline');
const wantFallback = wantsFull || flag('--fallback');
const wantQuality = wantsFull || flag('--quality');
const runAI = !onlySmoke && (wantCloud || wantDevice || wantOffline || wantFallback || wantQuality);
const base = (val('--url=') || 'http://127.0.0.1:8443').replace(/\/$/, '');
const hosted = val('--hosted=');
const cdpUrl = val('--cdp=');
const profile = resolve(root, 'private', 'qa-v48-chrome-profile');
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const outputDir = resolve(root, 'private', 'qa-v48-reports', timestamp);
const started = new Date().toISOString();
const cases = [];
const browserErrors = [];
let remoteBrowser = null;
let browserContext = null;
let page = null;
const timeout = Math.max(30000, Math.min(300000, Number(val('--timeout=') || '180000')));
function add(name, status, details='', evidence={}) {
  const entry = { name, status, details, ...evidence };
  cases.push(entry);
  const colorless = `${status.padEnd(5)} ${name}${details ? ` — ${details}` : ''}`;
  process.stdout.write(`[${colorless}]\n`);
  return entry;
}
function clean(raw) {
  return String(raw || '').replace(/(?:AIza)[a-zA-Z0-9_-]{12,}/g,'[REDACTED_API_KEY]')
    .replace(/(token|apikey|secret|authorization)(\s*[=:]\s*)\S+/gi, '$1$2[REDACTED]')
    .slice(0, 450);
}
function receiptSource(str) {
  if (/Perangkat\s*[·•]|On-device\s*[·•]/i.test(str)) return 'ON_DEVICE';
  if (/Cloud\s*[·•]/i.test(str)) return 'IN_CLOUD';
  return null;
}
const input = 'Materi adalah segala sesuatu yang memiliki massa dan menempati ruang. Contohnya batu dan air, sedangkan cahaya tidak termasuk materi.';
const wrong = 'Materi adalah massa dari suatu ruang. Karena ruang mempunyai ukuran, maka semua ruang kosong termasuk materi meskipun tidak memiliki massa.';

async function runMode(label, mode, expected, prompt = input, offline = false) {
  try {
    if (!page) throw new Error('Browser page not ready');
    // Force a real mode transition so previous receipts are removed before each test.
    await page.locator('#v46-inference-mode').selectOption(mode === 'On-device only' ? 'Cloud only' : 'On-device only');
    await page.locator('#v46-inference-mode').selectOption(mode);
    await page.locator('#v46-explain').fill(prompt);
    // This checkbox records the user's explicit opt-in via --cloud/--full flags.
    // Consent only for modes which can call the cloud.
    if (mode !== 'On-device only') await page.locator('.v46-consent input[type=checkbox]').check();
    if (offline) await browserContext.setOffline(true);
    try {
      const button = page.locator('.v46-run');
      await button.waitFor({ state:'visible', timeout:15000 });
      if (!(await button.isEnabled())) throw new Error('Run button disabled (Firebase config or consent missing).');
      await button.click();
      const receipt = page.locator('.v46-receipt').first();
      await receipt.waitFor({ state:'visible', timeout });
      const title = await receipt.locator('.v46-receipt-header strong').innerText();
      const source = receiptSource(title);
      const errorEl = receipt.locator('.v46-error');
      const error = await errorEl.count() ? clean(await errorEl.innerText()) : null;
      const model = await receipt.locator('.v46-model').count() ? clean(await receipt.locator('.v46-model').innerText()) : null;
      const reply = await receipt.locator('.v46-answer').count() ? await receipt.locator('.v46-answer').innerText() : '';
      const time = await receipt.locator('.v46-time').count() ? await receipt.locator('.v46-time').innerText() : null;
      let result;
      if (error || !source || !reply.trim()) result = add(label, 'FAIL', error || 'SDK source or response missing', { requested:mode, source, model, time });
      else if (expected === 'ANY' || expected === source) result = add(label, 'PASS', `${source}, ${time}`, { requested:mode, source, model, time });
      else result = add(label, 'FAIL', `Expected ${expected}, got ${source}`, { requested:mode, source, model, time });
      if (reply) result.replyExcerpt = clean(reply.slice(0, 700));
      try { await page.screenshot({ path: resolve(outputDir, `${label.replace(/[^a-z0-9-]/gi, '_')}.png`), fullPage: false }); } catch { /* Screenshot optional */ }
      return { ...result, fullReply: reply };
    } finally {
      if (offline) await browserContext.setOffline(false);
    }
  } catch (error) {
    try { if (offline && browserContext) await browserContext.setOffline(false); } catch {}
    const status = /offline-model-not-prepared|not ready/i.test(String(error)) ? 'SKIP' : 'FAIL';
    return add(label, status, clean(error instanceof Error ? error.message : error), { requested:mode });
  }
}

async function main() {
  await mkdir(outputDir, {recursive:true});
  console.log(`El-Kimiya V4.8 E2E | ${started}\nWeb: ${base}\nQA Chrome profile: ${profile}\n`);
  try {
    try {
      const response = await fetch(base, {signal:AbortSignal.timeout(8000)});
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      add('frontend-http', 'PASS', `HTTP ${response.status}`);
    } catch(e) { add('frontend-http','FAIL', clean(e.message)); return; }
    try {
      const response = await fetch('http://127.0.0.1:8000/api/v1/learning/health', { signal:AbortSignal.timeout(5000) });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const h = await response.json();
      const valid = h.topics === 13 && h.questions === 65 && h.flashcards === 52;
      add('learning-backend', valid ? 'PASS' : 'FAIL', `topics=${h.topics}, questions=${h.questions}, cards=${h.flashcards}`);
    } catch(e) { add('learning-backend','FAIL',clean(e.message)); }
    if (hosted) {
      try {
        const expected = ['data/learning/id/catalog.json','data/learning/en/flashcards.json','data/molecules/samples.json'];
        for (const route of expected) {
          const address = new URL(route, hosted.endsWith('/') ? hosted : hosted + '/').href;
          const r = await fetch(address, {signal:AbortSignal.timeout(10000)});
          if(!r.ok || !/application\/json/i.test(r.headers.get('content-type') || '')) throw new Error(`${route}: unexpected HTTP ${r.status} or content-type`);
          await r.json();
        }
        add('hosted-static-data','PASS',`3 JSON files reachable at ${hosted}`);
      } catch(e) { add('hosted-static-data','FAIL',clean(e.message)); }
    } else add('hosted-static-data', 'SKIP','Set --hosted=https://your-domain/ after deployment');
    if (!runAI) return;
    if (cdpUrl) {
      remoteBrowser = await chromium.connectOverCDP(cdpUrl);
      browserContext = remoteBrowser.contexts()[0];
      if (!browserContext) throw new Error('No browser context via Chrome CDP');
      console.log('[INFO] Attached to manually launched Chrome QA. Browser will remain open.');
    } else {
      browserContext = await chromium.launchPersistentContext(profile, {
        channel: 'chrome', headless: false,
        viewport: { width: 1366, height: 880 },
        acceptDownloads: false,
        args: ['--no-first-run'],
      });
    }
    page = browserContext.pages()[0] || await browserContext.newPage();
    page.on('pageerror', (e) => browserErrors.push(clean(e.message)));
    await page.goto(`${base}/#practice`, {waitUntil:'domcontentloaded',timeout:25000});
    await page.locator('.v45-root').waitFor({timeout:25000});
    if (cdpUrl) {
      const readiness = await page.evaluate(async () => {
        if (typeof LanguageModel === 'undefined') return 'API missing';
        try { return await LanguageModel.availability(); }
        catch (error) { return 'Error: ' + String(error); }
      });
      console.log('[CDP PRECHECK] Prompt API availability: ' + readiness);
    }
    await page.locator('.v46-toggle').first().click();
    await page.locator('#v46-explain').waitFor({state:'visible',timeout:10000});
    add('browser-journey', 'PASS','Learning Journey and AI Teach-Back accessible');

    let deviceOk = false;
    if (wantCloud) await runMode('cloud-only', 'Cloud only','IN_CLOUD');
    if (wantDevice || wantOffline) {
      const r = await runMode('device-only', 'On-device only','ON_DEVICE');
      deviceOk = r.status === 'PASS';
    }
    if (wantOffline) {
      if (deviceOk) await runMode('offline-device', 'On-device only','ON_DEVICE', input + ' Jelaskan kembali secara singkat.', true);
      else add('offline-device','SKIP','Device model did not pass in this QA Chrome profile. Offline inference not tested.');
    }
    if (wantFallback) {
      const r = await runMode('prefer-device-route', 'Prefer on-device','ANY');
      if (r.status === 'PASS' && r.source === 'IN_CLOUD') {
        add('automatic-fallback-evidence', deviceOk ? 'REVIEW' : 'PASS', deviceOk
          ? 'Prefer-device used cloud but device-only was also available. Investigate routing; fallback cause NOT proven.'
          : 'Device-only did not succeed and prefer-device returned cloud; fallback behavior observed, cause requires review.');
      } else if (r.status === 'PASS' && r.source === 'ON_DEVICE') {
        add('automatic-fallback-evidence','SKIP','Local model available, so automatic cloud fallback was not exercised.');
      } else add('automatic-fallback-evidence','SKIP','No successful routing receipt; fallback not proven.');
    }
    if (wantQuality) {
      const r = await runMode('misconception-feedback', 'Cloud only', 'IN_CLOUD', wrong);
      if (r.status === 'PASS') {
        // Heuristic flag only. This is NOT expert verification or semantic grading.
        const flagged = /(keliru|tidak tepat|kurang tepat|miskonsepsi|bukan definisi|salah|tidak benar|incorrect|not accurate|misconception|inaccurate|not correct)/i.test(r.fullReply);
        add('feedback-quality-heuristic', flagged ? 'REVIEW' : 'WARN', flagged
          ? 'Possible misconception correction found. Human review still mandatory.'
          : 'No explicit correction phrase found; inspect screenshot and response manually.');
      } else add('feedback-quality-heuristic','SKIP','Cloud output unavailable, cannot inspect misconception feedback.');
    }
    if (browserErrors.length) add('uncaught-browser-errors','WARN',`${browserErrors.length} page error(s) captured (see report)`);
    else add('uncaught-browser-errors','PASS','No pageerror events during QA');
  } catch (err) { add('test-harness','FAIL',clean(err instanceof Error ? err.message : err)); }
  finally {
    if (!cdpUrl && browserContext) try { await browserContext.close(); } catch {}
    const report = {
      product:'El-Kimiya', version:'4.8', started, finished:new Date().toISOString(),
      web:base, hosted:hosted ?? null,
      note:'Browser UI automation; model source is SDK-reported through app. Offline uses Playwright network emulation, not a physically disconnected device. Output QA Chrome profile may differ from your normal Chrome.',
      cases, browserErrors,
      totals: Object.fromEntries(['PASS','FAIL','WARN','REVIEW','SKIP'].map(s=>[s,cases.filter(x=>x.status===s).length])),
    };
    await writeFile(resolve(outputDir,'report.json'),JSON.stringify(report,null,2),'utf-8');
    const summary = ['EL-KIMIYA V4.8 E2E RESULTS',`Web ${base}`, ...cases.map(c=>`${c.status.padEnd(6)} ${c.name}: ${c.details || ''}`), '',`Report: ${resolve(outputDir,'report.json')}`].join('\n');
    await writeFile(resolve(outputDir,'summary.txt'),summary,'utf-8');
    console.log('\n'+summary);
    const failures = cases.filter(x=>x.status==='FAIL').length;
    if (failures) process.exitCode = 1;
    else if (runAI && !cases.some(x=>x.name==='cloud-only' && x.status==='PASS') && wantCloud) process.exitCode = 2;
  }
}
await main();
