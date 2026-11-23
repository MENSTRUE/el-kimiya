/**
 * El-Kimiya Petrochemical Lab V6.2 — transparent educational mass-equivalence model.
 * NOT ASTM D664, NOT a petroleum process simulator, NOT predictive QC certification.
 * All reference values supplied by synthetic case studies or the learner.
 */
export type SyntheticScenario = {
  id: string;
  labelId: string;
  labelEn: string;
  referenceAcidNumber: number; // mg KOH / g, synthetic hypothetical reference
  sampleMassG: number;
  titrantNormality: number; // eq/L
  dropVolumeMl: number;
  blankMl: number;
};

export type EducationalStatus = 'before' | 'near' | 'after';
export type TitrationObservation = {
  drops: number;
  volumeMl: number;
  correctedVolumeMl: number;
  acidNumberMgKohG: number;
  referenceAcidNumber: number;
  theoreticalEndpointMl: number;
  theoreticalEndpointDrops: number;
  differenceMgKohG: number;
  resolutionMgKohGPerDrop: number;
  oneDropUncertaintyMgKohG: number;
  status: EducationalStatus;
  completion: number;
};

export const SYNTHETIC_SCENARIOS: SyntheticScenario[] = [
  { id: 'a', labelId: 'Sampel minyak A · sintetis', labelEn: 'Oil sample A · synthetic', referenceAcidNumber: .9, sampleMassG: 10, titrantNormality: .1, dropVolumeMl: .05, blankMl: .05 },
  { id: 'b', labelId: 'Sampel campuran B · sintetis', labelEn: 'Blend sample B · synthetic', referenceAcidNumber: 1.4, sampleMassG: 8, titrantNormality: .1, dropVolumeMl: .05, blankMl: .08 },
  { id: 'c', labelId: 'Sampel rendah asam C · sintetis', labelEn: 'Low-acid sample C · synthetic', referenceAcidNumber: .35, sampleMassG: 12, titrantNormality: .1, dropVolumeMl: .03, blankMl: .04 },
  // ELKIMIYA_V63_12_SCENARIOS · extra educational cases only, NOT real refinery measurements
  { id: 'd', labelId: 'Umpan kilang D · sintetis', labelEn: 'Refinery feed D · synthetic', referenceAcidNumber: .65, sampleMassG: 9.5, titrantNormality: .1, dropVolumeMl: .04, blankMl: .04 },
  { id: 'e', labelId: 'Minyak dasar E · sintetis', labelEn: 'Base oil E · synthetic', referenceAcidNumber: .25, sampleMassG: 12, titrantNormality: .08, dropVolumeMl: .03, blankMl: .03 },
  { id: 'f', labelId: 'Campuran F · sintetis', labelEn: 'Blend F · synthetic', referenceAcidNumber: 1.85, sampleMassG: 7, titrantNormality: .12, dropVolumeMl: .025, blankMl: .06 },
  { id: 'g', labelId: 'Keasaman rendah G · sintetis', labelEn: 'Low-acid G · synthetic', referenceAcidNumber: .15, sampleMassG: 15, titrantNormality: .08, dropVolumeMl: .02, blankMl: .03 },
  { id: 'h', labelId: 'Minyak berat H · sintetis', labelEn: 'Heavy oil H · synthetic', referenceAcidNumber: 3.4, sampleMassG: 6, titrantNormality: .14, dropVolumeMl: .05, blankMl: .1 },
  { id: 'i', labelId: 'Sampel proses I · sintetis', labelEn: 'Process sample I · synthetic', referenceAcidNumber: .95, sampleMassG: 11, titrantNormality: .1, dropVolumeMl: .035, blankMl: .05 },
  { id: 'j', labelId: 'Kalibrasi J · sintetis', labelEn: 'Calibration challenge J · synthetic', referenceAcidNumber: 1.15, sampleMassG: 8, titrantNormality: .1, dropVolumeMl: .07, blankMl: .08 },
  { id: 'k', labelId: 'Presisi K · sintetis', labelEn: 'Precision case K · synthetic', referenceAcidNumber: .55, sampleMassG: 14, titrantNormality: .05, dropVolumeMl: .015, blankMl: .05 },
  { id: 'l', labelId: 'Cek ulang L · sintetis', labelEn: 'Recheck case L · synthetic', referenceAcidNumber: 2.35, sampleMassG: 8, titrantNormality: .15, dropVolumeMl: .03, blankMl: .07 },
];

const MG_KOH_PER_MILLIEQUIVALENT = 56.1;
export function finiteBetween(x: number, min: number, max: number): boolean {
  return Number.isFinite(x) && x >= min && x <= max;
}

export function validateScenario(s: SyntheticScenario): string | null {
  if (!finiteBetween(s.sampleMassG, 1, 30)) return 'Sample mass must be 1–30 g';
  if (!finiteBetween(s.titrantNormality, .01, .5)) return 'Titrant normality must be 0.01–0.50 eq/L';
  if (!finiteBetween(s.dropVolumeMl, .005, .1)) return 'Calibrated drop size must be 0.005–0.10 mL';
  if (!finiteBetween(s.blankMl, 0, .5)) return 'Blank volume must be 0–0.5 mL';
  if (!finiteBetween(s.referenceAcidNumber, .05, 5)) return 'Synthetic reference must be 0.05–5 mg KOH/g';
  return null;
}

export function acidNumberFromVolume(volumeMl: number, sampleMassG: number, normality: number, blankMl = 0): number {
  if (!Number.isFinite(volumeMl) || volumeMl < 0 || !Number.isFinite(blankMl) || blankMl < 0 ||
      !Number.isFinite(sampleMassG) || sampleMassG <= 0 || !Number.isFinite(normality) || normality <= 0) {
    throw new Error('Invalid titration quantity');
  }
  return Math.max(0, (volumeMl - blankMl) * normality * MG_KOH_PER_MILLIEQUIVALENT / sampleMassG);
}

/** The calibration band describes drop-volume resolution ONLY, not total analytical uncertainty. */
export function evaluateTitration(s: SyntheticScenario, drops: number): TitrationObservation {
  const validation = validateScenario(s);
  if (validation) throw new Error(validation);
  if (!Number.isSafeInteger(drops) || drops < 0 || drops > 2000) throw new Error('Drops must be an integer from 0–2000');
  const theoreticalEndpointMl = (s.referenceAcidNumber * s.sampleMassG) / (s.titrantNormality * MG_KOH_PER_MILLIEQUIVALENT) + s.blankMl;
  const volumeMl = drops * s.dropVolumeMl;
  const acidNumberMgKohG = acidNumberFromVolume(volumeMl, s.sampleMassG, s.titrantNormality, s.blankMl);
  const resolutionMgKohGPerDrop = s.dropVolumeMl * s.titrantNormality * MG_KOH_PER_MILLIEQUIVALENT / s.sampleMassG;
  const diff = acidNumberMgKohG - s.referenceAcidNumber;
  const allowed = resolutionMgKohGPerDrop * .55 + 1e-10;
  const status: EducationalStatus = Math.abs(diff) <= allowed ? 'near' : diff < 0 ? 'before' : 'after';
  return {
    drops,
    volumeMl,
    correctedVolumeMl: Math.max(0, volumeMl - s.blankMl),
    acidNumberMgKohG,
    referenceAcidNumber: s.referenceAcidNumber,
    theoreticalEndpointMl,
    theoreticalEndpointDrops: theoreticalEndpointMl / s.dropVolumeMl,
    differenceMgKohG: diff,
    resolutionMgKohGPerDrop,
    oneDropUncertaintyMgKohG: resolutionMgKohGPerDrop / 2,
    status,
    completion: Math.max(0, Math.min(1.5, theoreticalEndpointMl > 0 ? volumeMl / theoreticalEndpointMl : 0)),
  };
}

export function summarizeRuns(values: number[], target: number) {
  const clean = values.filter(Number.isFinite);
  if (!clean.length) return null;
  const mean = clean.reduce((a, b) => a + b, 0) / clean.length;
  const min = Math.min(...clean);
  const max = Math.max(...clean);
  const absError = Math.abs(mean - target);
  return { count: clean.length, mean, range: max - min, absError };
}
