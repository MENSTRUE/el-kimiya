/**
 * El-Kīmiyā Research Mission V6.7: educational, synthetic records only.
 * No industrial experimental predictions or private-book content.
 */
import { evaluateTitration, SYNTHETIC_SCENARIOS } from './petroExperimentV62';

export const MISSION_KEY = 'elk.v67.researchMission.1';
export const MISSION_EVENT = 'elk:v67-mission';
export const DROP_SIZES = [0.03, 0.05, 0.08] as const;
export type DropSize = typeof DROP_SIZES[number];
export type Trial = {
  id: string; drops: number; dropVolumeMl: DropSize; volumeMl: number;
  acidNumber: number; resolution: number; status: 'before' | 'near' | 'after';
};
export type MissionState = {
  schema: 1; hypothesis: 'small' | 'large' | null;
  trials: Trial[]; reflection: string; selectedAnswer: number | null;
  checked: boolean; finished: boolean;
};
export const EMPTY_MISSION: MissionState = {
  schema: 1, hypothesis: null, trials: [], reflection: '',
  selectedAnswer: null, checked: false, finished: false,
};
export const QUIZ_CORRECT = 1; // B: larger drop volumes produce coarser one-drop resolution
export const baseScenario = SYNTHETIC_SCENARIOS[0];
export function measure(dropVolumeMl: DropSize, drops: number) {
  if (!DROP_SIZES.includes(dropVolumeMl)) throw new Error('Unsupported synthetic drop size');
  return evaluateTitration({ ...baseScenario, dropVolumeMl }, drops);
}
export function takeTrial(dropVolumeMl: DropSize, drops: number, id: string): Trial {
  if (!id || id.length > 90) throw new Error('Invalid trial ID');
  const r = measure(dropVolumeMl, drops);
  return {
    id, drops, dropVolumeMl, volumeMl: r.volumeMl,
    acidNumber: Number(r.acidNumberMgKohG.toFixed(6)),
    resolution: Number(r.resolutionMgKohGPerDrop.toFixed(6)), status: r.status,
  };
}
export function distinctSizes(trials: Trial[]): number {
  return new Set(trials.map(t => t.dropVolumeMl)).size;
}
export function canFinish(s: MissionState): boolean {
  return Boolean(s.hypothesis && s.trials.length >= 2 &&
    distinctSizes(s.trials) >= 2 && s.checked &&
    s.selectedAnswer === QUIZ_CORRECT && s.reflection.trim().length >= 20);
}
export function restoreMission(raw: string | null): MissionState {
  if (!raw) return {...EMPTY_MISSION};
  try {
    const x: unknown = JSON.parse(raw);
    if (!x || typeof x !== 'object' || Array.isArray(x)) return {...EMPTY_MISSION};
    const obj = x as Record<string, unknown>;
    if (obj.schema !== 1) return {...EMPTY_MISSION};
    const hypothesis = obj.hypothesis === 'small' || obj.hypothesis === 'large' ? obj.hypothesis : null;
    const trials: Trial[] = Array.isArray(obj.trials) ? obj.trials.slice(-24).filter((entry: unknown): entry is Trial => {
      if (!entry || typeof entry !== 'object') return false;
      const t = entry as Partial<Trial>;
      return typeof t.id === 'string' && t.id.length <= 90 &&
        DROP_SIZES.includes(t.dropVolumeMl as DropSize) && Number.isSafeInteger(t.drops) &&
        (t.drops as number) >= 0 && (t.drops as number) <= 2000 &&
        typeof t.acidNumber === 'number' && Number.isFinite(t.acidNumber);
    }) : [];
    const selectedAnswer = typeof obj.selectedAnswer === 'number' && Number.isInteger(obj.selectedAnswer) && obj.selectedAnswer >= 0 && obj.selectedAnswer < 4 ? obj.selectedAnswer : null;
    const reflection = typeof obj.reflection === 'string' ? obj.reflection.slice(0, 1200) : '';
    const state: MissionState = {schema: 1, hypothesis, trials, reflection, selectedAnswer, checked: obj.checked === true, finished: false};
    state.finished = obj.finished === true && canFinish(state);
    return state;
  } catch { return {...EMPTY_MISSION}; }
}
export function progressPercent(s: MissionState): number {
  const steps = [Boolean(s.hypothesis), distinctSizes(s.trials) >= 2,
    s.checked && s.selectedAnswer === QUIZ_CORRECT, s.reflection.trim().length >= 20,
    s.finished];
  return Math.round(steps.filter(Boolean).length / steps.length * 100);
}
export function reportMarkdown(s: MissionState, lang: 'id' | 'en'): string {
  const en = lang === 'en';
  const f = (n: number) => n.toFixed(4);
  const rows = s.trials.map((t,i)=>`| ${i + 1} | ${t.dropVolumeMl} | ${t.drops} | ${f(t.acidNumber)} | ${f(t.resolution)} | ${t.status} |`).join('\n');
  return [
    `# ${en ? 'El-Kīmiyā — Synthetic Research Mission Report' : 'El-Kīmiyā — Laporan Misi Penelitian Sintetis'}`,
    '', `**${en ? 'Scope' : 'Ruang lingkup'}:** ${en ? 'Educational arithmetic only. NOT physical measurement, ASTM D664 certification, or validated industrial prediction.' : 'Perhitungan edukatif saja. BUKAN pengukuran fisik, sertifikasi ASTM D664, atau prediksi industri tervalidasi.'}`,
    '', `## ${en ? 'Research question' : 'Pertanyaan penelitian'}`,
    en ? 'How does assumed virtual drop size affect one-drop resolution in a synthetic petroleum acid-number model?' : 'Bagaimana ukuran tetes virtual memengaruhi resolusi per tetes pada model sintetis bilangan asam petroleum?',
    '', `## ${en ? 'Hypothesis' : 'Hipotesis'}`,
    s.hypothesis === 'small' ? (en ? 'Smaller drops give finer resolution.' : 'Tetes lebih kecil menghasilkan resolusi lebih halus.') : s.hypothesis === 'large' ? (en ? 'Larger drops give finer resolution (not supported by the model).' : 'Tetes lebih besar menghasilkan resolusi lebih halus (tidak didukung model).') : '—',
    '', `## ${en ? 'Synthetic observations' : 'Pengamatan sintetis'}`,
    '| # | mL/drop | Drops | Acid number (mg KOH/g) | One-drop resolution (mg KOH/g) | Status |',
    '|---:|---:|---:|---:|---:|---|', rows || '| — | — | — | — | — | — |',
    '', `## ${en ? 'Interpretation' : 'Interpretasi'}`, s.reflection.trim() || '—',
    '', `## ${en ? 'Limitations' : 'Batasan'}`,
    en ? 'Fixed assumptions and fictional reference values; no real liquid, reagents, kinetics, calibration, uncertainty budget, ASTM execution, or process validation. Actual safety and production decisions need qualified experiments.' : 'Asumsi tetap dan nilai referensi fiktif; tidak ada bahan nyata, kinetika, kalibrasi, anggaran ketidakpastian, pelaksanaan ASTM, atau validasi proses. Keputusan keselamatan dan produksi membutuhkan pengujian oleh tenaga berkualifikasi.',
    '', `**${en ? 'Status' : 'Status'}:** ${s.finished ? (en ? 'Mission completed in this browser' : 'Misi selesai pada browser ini') : (en ? 'Draft' : 'Draf')}`,
    `**${en ? 'Source' : 'Sumber'}:** El-Kīmiyā V6.2 synthetic arithmetic model (AN = max(0, (V - Vblank) × N × 56.1 / m)).`,
  ].join('\n');
}
