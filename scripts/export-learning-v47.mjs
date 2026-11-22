#!/usr/bin/env node
/**
 * Export SAFE, read-only, bilingual educational material from a running local
 * V4.3 API. No credentials, quiz solutions, private progress or PDFs are copied.
 * Aborts rather than publishing a partial or answer-leaking bank.
 */
import { mkdir, readFile, rename, writeFile, rm } from 'node:fs/promises';
import { resolve, join, dirname } from 'node:path';
import { randomUUID } from 'node:crypto';

const PROJECT = resolve(import.meta.dirname, '..');
const BASE = (process.env.ELKIMIYA_API_BASE || 'http://127.0.0.1:8000/api/v1/learning').replace(/\/$/, '');
const DEST = resolve(PROJECT, 'public', 'data', 'learning');
const LANGS = ['id','en'];
const EXPECTED = { topics: 13, questions: 65, flashcards: 52 };
const SENSITIVE = /^(correct_choice_id|correct_answer|correct_option|answer_key|is_correct|solution|explanation|password|access_token|refresh_token|api_key|secret)$/i;

async function fetchJson(path) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), 8000);
  try {
    const result = await fetch(`${BASE}${path}`, { signal: controller.signal, headers: { Accept: 'application/json' } });
    if (!result.ok) throw new Error(`HTTP ${result.status} ${path}`);
    return await result.json();
  } finally { clearTimeout(id); }
}
function assert(value, msg) { if (!value) throw new Error(msg); }
function text(value, max = 6000) { return typeof value === 'string' ? value.slice(0, max) : ''; }
function unique(items, label) {
  const ids = items.map(x => x.id);
  assert(ids.length === new Set(ids).size && ids.every(Boolean), `${label}: duplicate/missing IDs`);
}
function forbidKeys(obj, context) {
  if (!obj || typeof obj !== 'object') return;
  for (const [key, val] of Object.entries(obj)) {
    if (SENSITIVE.test(key)) throw new Error(`${context}: forbidden field ${key} (answer leak)`);
    if (val && typeof val === 'object') forbidKeys(val, `${context}.${key}`);
  }
}
function sanitizeSources(raw) {
  if (!Array.isArray(raw)) return [];
  return raw.map(x => ({ id: text(x?.id, 80), title: text(x?.title, 200), url: text(x?.url, 1000) }))
    .filter(x => x.url.startsWith('https://'));
}
function normalizeCatalog(items) {
  return items.map(x => ({
    id: text(x.id || x.topic_id || x.slug, 80),
    title: text(x.title || x.name, 300),
    summary: text(x.summary || x.description || x.overview || x.intro),
    question_count: Number(x.question_count ?? x.questions_count ?? 0),
    flashcard_count: Number(x.flashcard_count ?? x.flashcards_count ?? 0),
  }));
}
function normalizeQuiz(items) {
  return items.map(x => {
    forbidKeys(x, `quiz:${x?.id ?? '?'}`);
    return {
      id: text(x.id || x.question_id, 80),
      topic_id: text(x.topic_id || x.topic, 80),
      prompt: text(x.prompt || x.question),
      choices: (Array.isArray(x.choices) ? x.choices : []).map((c, i) =>
        typeof c === 'string' ? { id: String.fromCharCode(65+i), text: text(c, 1000) } :
        { id: text(c?.id || c?.choice_id || c?.key, 32) || String.fromCharCode(65+i), text: text(c?.text || c?.label || c?.content, 1000) }
      ),
    };
  });
}
function normalizeCards(items) {
  return items.map(x => ({
    id: text(x.id || x.card_id, 80), topic_id: text(x.topic_id || x.topic, 80),
    front: text(x.front || x.question), back: text(x.back || x.answer),
    sources: sanitizeSources(x.sources),
  }));
}
async function listAll(resource, lang, expectedCount) {
  let lastErr;
  for (const size of [100, 65, 50, 25]) {
    try {
      const results = [];
      const seen = new Set();
      for (let offset = 0; offset <= expectedCount; offset += size) {
        const data = await fetchJson(`/${resource}?lang=${lang}&limit=${size}&offset=${offset}`);
        const batch = data?.[resource === 'flashcards' ? 'cards' : 'questions'];
        assert(Array.isArray(batch), `${resource}: missing array`);
        let added = 0;
        for (const item of batch) {
          const id = item?.id || item?.card_id || item?.question_id;
          if (id && !seen.has(id)) { seen.add(id); results.push(item); added++; }
        }
        if (!batch.length || results.length >= expectedCount) break;
        if (added === 0) throw new Error(`${resource}: offset pagination not supported, only ${results.length}/${expectedCount} accessible`);
        if (batch.length < size) break;
      }
      if (results.length === expectedCount) return results;
      lastErr = new Error(`${resource} ${lang}: only ${results.length}/${expectedCount} records`);
    } catch(e) { lastErr = e; }
  }
  throw lastErr;
}

try {
  const health = await fetchJson('/health');
  for (const [key,value] of Object.entries(EXPECTED)) {
    assert(health[key] === value, `${key}: expected ${value}, got ${health[key]}`);
  }
  const assets = {};
  const identities = {};
  for (const lang of LANGS) {
    const catalog = await fetchJson(`/catalog?lang=${lang}`);
    assert(Array.isArray(catalog.topics), `Catalog ${lang}: missing topics`);
    const questions = normalizeQuiz(await listAll('questions', lang, EXPECTED.questions));
    const cards = normalizeCards(await listAll('flashcards', lang, EXPECTED.flashcards));
    const topics = normalizeCatalog(catalog.topics);
    assert(topics.length === EXPECTED.topics, `Catalog ${lang}: expected ${EXPECTED.topics} topics, got ${topics.length}`);
    assert(questions.length === EXPECTED.questions && cards.length === EXPECTED.flashcards, `Incomplete ${lang} bank`);
    unique(topics, `${lang} topics`); unique(questions, `${lang} questions`); unique(cards, `${lang} cards`);
    assert(questions.every(q => q.prompt && q.topic_id && q.choices.length === 4 && q.choices.every(c => c.text)), `${lang}: invalid quiz`);
    assert(cards.every(c => c.front && c.back), `${lang}: blank cards`);
    identities[lang] = {
      topics: topics.map(x=>x.id).sort().join('|'),
      questions: questions.map(x=>x.id).sort().join('|'),
      cards: cards.map(x=>x.id).sort().join('|'),
    };
    assets[lang] = {
      'health.json': EXPECTED,
      'catalog.json': { topics },
      'questions.json': { questions },
      'flashcards.json': { cards },
      'sources.json': { sources: sanitizeSources((await fetchJson('/sources')).sources) },
    };
  }
  for (const key of ['topics','questions','cards']) assert(identities.id[key] === identities.en[key], `ID/EN ${key} keys differ`);
  // Everything validated. Write to temporary staging, then swap directories.
  const staging = resolve(PROJECT, 'public','data',`.learning-v47-stage-${randomUUID()}`);
  await mkdir(staging, { recursive: true });
  try {
    for (const lang of LANGS) {
      await mkdir(join(staging,lang), { recursive: true });
      for (const [name, json] of Object.entries(assets[lang])) {
        await writeFile(join(staging,lang,name), JSON.stringify(json, null, 2)+'\n','utf8');
      }
    }
    await writeFile(join(staging,'provenance.json'), JSON.stringify({
      source: 'El-Kimiya V4.3 local learning API',
      exported_at: new Date().toISOString(),
      editorial_status: 'original_draft_needs_subject_expert_review',
      counts: EXPECTED,
      excluded: ['quiz correct answers','user progress','credentials','private PDFs','ChEMBL bulk database'],
    },null,2)+'\n','utf8');
    const backup = resolve(PROJECT,'scripts','.v47-backups',`learning-${Date.now()}`);
    await mkdir(dirname(backup),{recursive:true});
    try { await rename(DEST,backup); console.log(`[BACKUP] ${backup}`); }
    catch (error) { if (error?.code !== 'ENOENT') throw error; }
    await rename(staging,DEST);
  } catch(error) { await rm(staging,{recursive:true,force:true}); throw error; }
  console.log(`[PASS] Exported ${EXPECTED.topics} topics / ${EXPECTED.questions} questions / ${EXPECTED.flashcards} cards in ID and EN`);
  console.log('[PASS] No answers, secrets, private books or personal progress exported');
  console.log(`NEXT: npm run build && node scripts/v47-web-gate.mjs`);
} catch(error) {
  console.error('[FAIL]',error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
