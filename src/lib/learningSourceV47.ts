/**
 * Public-safe Learning API transport for El-Kimiya.
 * Local development: use the real V4.3 FastAPI when available.
 * Firebase Hosting: read pre-exported, read-only JSON assets.
 * No localhost calls from a public domain, no fabricated lesson content.
 */
const LOCAL_API = 'http://127.0.0.1:8000/api/v1/learning';
const SUPPORTED = new Set(['health', 'catalog', 'questions', 'flashcards', 'sources']);

type Payload = Record<string, unknown>;
function isRecord(value: unknown): value is Payload {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

async function readJSON(url: string, signal?: AbortSignal): Promise<unknown> {
  const res = await fetch(url, { signal, headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} (${url})`);
  const data: unknown = await res.json();
  if (!isRecord(data)) throw new Error(`Unexpected JSON from ${url}`);
  return data;
}

export async function readLearningV47(path: string, signal?: AbortSignal): Promise<unknown> {
  const parsed = new URL(path, 'https://elkimiya.invalid');
  const resource = parsed.pathname.replace(/^\/+|\/+$/g, '');
  if (!SUPPORTED.has(resource)) throw new Error(`Unsupported learning resource: ${resource}`);
  const rawLanguage = parsed.searchParams.get('lang');
  const lang = rawLanguage === 'en' ? 'en' : 'id';
  const base = import.meta.env.BASE_URL.endsWith('/')
    ? import.meta.env.BASE_URL : `${import.meta.env.BASE_URL}/`;
  const staticUrl = `${base}data/learning/${lang}/${resource}.json`;
  const local = ['127.0.0.1', 'localhost'].includes(window.location.hostname);

  // On localhost, prefer the actual API. If it is down, a validated offline
  // export can power the learning experience (but not mutations/progress sync).
  if (local) {
    try { return await readJSON(`${LOCAL_API}${path}`, signal); }
    catch (error) {
      if (signal?.aborted) throw error;
      try { return await readJSON(staticUrl, signal); }
      catch {
        const why = error instanceof Error ? error.message : String(error);
        throw new Error(`Learning API is offline and no exported learning data is installed. ${why}`);
      }
    }
  }

  // Never point a public website at a visitor's 127.0.0.1.
  try { return await readJSON(staticUrl, signal); }
  catch {
    throw new Error('Published learning data is missing. Run the V4.7 export before deployment.');
  }
}
