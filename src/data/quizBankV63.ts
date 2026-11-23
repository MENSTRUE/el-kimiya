/**
 * El-Kimiya V6.3: transparent, deterministic bilingual educational calculation bank.
 * 12 formula families x 96 numerical variants = 1,152 exercises.
 * These are NOT 1,152 independently reviewed concepts or exam-validated items.
 * Sources point to OpenStax Chemistry 2e for conceptual reading; synthetic values are generated locally.
 */
export type BiText = { id: string; en: string };
export type ExerciseV63 = {
  id: string;
  family: string;
  topic: BiText;
  level: 'dasar' | 'menengah' | 'lanjutan';
  prompt: BiText;
  choices: BiText[];
  correct: number;
  explanation: BiText;
  source: string;
  audit: { a: number; b: number; expected: number };
};
const bi = (id: string, en: string): BiText => ({ id, en });
const source = 'https://openstax.org/details/books/chemistry-2e';
const round4 = (n: number) => Number(n.toFixed(4));
const fmt = (n: number) => Number(n.toFixed(4)).toString();
const families = [
  { key:'mass-from-moles', topic:bi('Mol & massa', 'Moles & mass'), level:'dasar', unit:'g',
    exercise:(a:number,b:number) => {
      const n=a/2, mm=10+5*b, value=mm*n;
      return {value, text:bi(`Sampel hipotetis memiliki ${fmt(n)} mol dengan massa molar ${mm} g/mol. Berapa massanya?`, `A hypothetical sample contains ${fmt(n)} mol and has molar mass ${mm} g/mol. What is its mass?`), why:bi(`m = n × M = ${fmt(n)} × ${mm} = ${fmt(value)} g.`, `m = n × M = ${fmt(n)} × ${mm} = ${fmt(value)} g.`)};
    }},
  { key:'moles-from-mass', topic:bi('Mol & massa', 'Moles & mass'), level:'dasar', unit:'mol',
    exercise:(a:number,b:number) => {
      const value=a/2, mm=12+6*b, m=value*mm;
      return {value, text:bi(`Sampel hipotetis bermassa ${fmt(m)} g dengan massa molar ${mm} g/mol. Berapa mol zatnya?`, `A hypothetical sample weighs ${fmt(m)} g with molar mass ${mm} g/mol. How many moles are present?`), why:bi(`n = m / M = ${fmt(m)} / ${mm} = ${fmt(value)} mol.`, `n = m / M = ${fmt(m)} / ${mm} = ${fmt(value)} mol.`)};
    }},
  { key:'molarity', topic:bi('Larutan & konsentrasi', 'Solutions & concentration'), level:'menengah', unit:'mol/L',
    exercise:(a:number,b:number) => {
      const n=a*0.05, liters=b*0.25, value=n/liters;
      return {value, text:bi(`${fmt(n)} mol zat terlarut terdapat dalam ${fmt(liters)} L larutan ideal. Berapa molaritasnya?`, `${fmt(n)} mol of solute is present in ${fmt(liters)} L of ideal solution. What is the molarity?`), why:bi(`C = n/V = ${fmt(n)}/${fmt(liters)} = ${fmt(value)} mol/L.`, `C = n/V = ${fmt(n)}/${fmt(liters)} = ${fmt(value)} mol/L.`)};
    }},
  { key:'dilution', topic:bi('Larutan & konsentrasi', 'Solutions & concentration'), level:'menengah', unit:'mL',
    exercise:(a:number,b:number) => {
      const c1=a*0.1+0.5, v1=20*b, c2=c1/2, value=2*v1;
      return {value, text:bi(`Pengenceran hipotetis: ${fmt(v1)} mL larutan ${fmt(c1)} M diencerkan sampai ${fmt(c2)} M. Berapa volume akhirnya?`, `Hypothetical dilution: ${fmt(v1)} mL of ${fmt(c1)} M solution is diluted to ${fmt(c2)} M. What is the final volume?`), why:bi(`C₁V₁ = C₂V₂, maka V₂ = (${fmt(c1)} × ${fmt(v1)})/${fmt(c2)} = ${fmt(value)} mL.`, `C₁V₁ = C₂V₂, so V₂ = (${fmt(c1)} × ${fmt(v1)})/${fmt(c2)} = ${fmt(value)} mL.`)};
    }},
  { key:'density', topic:bi('Sifat materi', 'Properties of matter'), level:'dasar', unit:'g/mL',
    exercise:(a:number,b:number) => {
      const value=0.5+a*0.1, volume=b*5, mass=value*volume;
      return {value, text:bi(`Cairan model bermassa ${fmt(mass)} g dan bervolume ${volume} mL. Berapa massa jenisnya?`, `A model liquid has mass ${fmt(mass)} g and volume ${volume} mL. What is its density?`), why:bi(`ρ = m/V = ${fmt(mass)}/${volume} = ${fmt(value)} g/mL.`, `ρ = m/V = ${fmt(mass)}/${volume} = ${fmt(value)} g/mL.`)};
    }},
  { key:'mass-percent', topic:bi('Komposisi campuran', 'Mixture composition'), level:'menengah', unit:'%',
    exercise:(a:number,b:number) => {
      const solute=a*2, solvent=b*3, total=solute+solvent, value=solute/total*100;
      return {value, text:bi(`Campuran model memiliki ${solute} g zat terlarut dan ${solvent} g pelarut. Berapa persen massa zat terlarut?`, `A model mixture contains ${solute} g solute and ${solvent} g solvent. What is the solute mass percentage?`), why:bi(`% massa = ${solute}/(${solute}+${solvent}) × 100 = ${fmt(value)}%.`, `Mass % = ${solute}/(${solute}+${solvent}) × 100 = ${fmt(value)}%.`)};
    }},
  { key:'reaction-yield', topic:bi('Stoikiometri & rendemen', 'Stoichiometry & yield'), level:'menengah', unit:'%',
    exercise:(a:number,b:number) => {
      const theoretical=(a+5)*10, actual=theoretical*(b+1)/10, value=(b+1)*10;
      return {value, text:bi(`Perhitungan model memberi hasil teoritis ${theoretical} g dan hasil aktual ${fmt(actual)} g. Berapa persen rendemennya?`, `A model calculation gives ${theoretical} g theoretical yield and ${fmt(actual)} g actual yield. What is the percent yield?`), why:bi(`Rendemen = ${fmt(actual)}/${theoretical} × 100 = ${fmt(value)}%.`, `Yield = ${fmt(actual)}/${theoretical} × 100 = ${fmt(value)}%.`)};
    }},
  { key:'boyle', topic:bi('Hukum gas', 'Gas laws'), level:'menengah', unit:'atm',
    exercise:(a:number,b:number) => {
      const p1=1+a*.5, v1=b*2, v2=(b+2)*2, value=p1*v1/v2;
      return {value, text:bi(`Gas ideal bersuhu tetap memiliki P₁=${fmt(p1)} atm, V₁=${v1} L dan V₂=${v2} L. Berapa P₂?`, `An isothermal ideal gas has P₁=${fmt(p1)} atm, V₁=${v1} L and V₂=${v2} L. What is P₂?`), why:bi(`Hukum Boyle: P₂ = P₁V₁/V₂ = ${fmt(p1)} × ${v1}/${v2} = ${fmt(value)} atm.`, `Boyle's law: P₂ = P₁V₁/V₂ = ${fmt(p1)} × ${v1}/${v2} = ${fmt(value)} atm.`)};
    }},
  { key:'heat', topic:bi('Termokimia', 'Thermochemistry'), level:'menengah', unit:'J',
    exercise:(a:number,b:number) => {
      const mass=a*10, heatCapacity=b*0.2, dt=(a%6+3)*5, value=mass*heatCapacity*dt;
      return {value, text:bi(`Model kalorimetri: m=${mass} g, kalor jenis c=${fmt(heatCapacity)} J/(g·°C), ΔT=${dt} °C. Berapa kalor q?`, `Calorimetry model: m=${mass} g, specific heat c=${fmt(heatCapacity)} J/(g·°C), ΔT=${dt} °C. What is heat q?`), why:bi(`q = mcΔT = ${mass} × ${fmt(heatCapacity)} × ${dt} = ${fmt(value)} J.`, `q = mcΔT = ${mass} × ${fmt(heatCapacity)} × ${dt} = ${fmt(value)} J.`)};
    }},
  { key:'neutralization', topic:bi('Asam & basa', 'Acids & bases'), level:'menengah', unit:'mL',
    exercise:(a:number,b:number) => {
      const ca=a*.1, va=b*10, cb=.5, value=ca*va/cb;
      return {value, text:bi(`Perhitungan netralisasi 1:1: asam monoprotik ${fmt(ca)} M sebanyak ${va} mL, basa monoprotik ${fmt(cb)} M. Berapa volume basa ekivalen secara teoritis?`, `1:1 neutralization calculation: monoprotic acid ${fmt(ca)} M, ${va} mL, and monoprotic base ${fmt(cb)} M. What is the theoretical equivalent base volume?`), why:bi(`CₐVₐ = CᵦVᵦ sehingga Vᵦ = ${fmt(ca)} × ${va}/${fmt(cb)} = ${fmt(value)} mL; hanya perhitungan ideal.`, `CₐVₐ = CᵦVᵦ, so Vᵦ = ${fmt(ca)} × ${va}/${fmt(cb)} = ${fmt(value)} mL; ideal arithmetic only.`)};
    }},
  { key:'ideal-gas', topic:bi('Hukum gas', 'Gas laws'), level:'lanjutan', unit:'atm',
    exercise:(a:number,b:number) => {
      const mol=a*.1, temp=250+b*10, volume=10, R=.082057, value=mol*R*temp/volume;
      return {value, text:bi(`Gas ideal dalam model: n=${fmt(mol)} mol, T=${temp} K, V=${volume} L, R=0,082057 L·atm/(mol·K). Berapa tekanan?`, `Ideal-gas model: n=${fmt(mol)} mol, T=${temp} K, V=${volume} L, R=0.082057 L·atm/(mol·K). What is the pressure?`), why:bi(`P = nRT/V = ${fmt(mol)} × 0,082057 × ${temp}/${volume} ≈ ${fmt(value)} atm.`, `P = nRT/V = ${fmt(mol)} × 0.082057 × ${temp}/${volume} ≈ ${fmt(value)} atm.`)};
    }},
  { key:'petroleum-acid', topic:bi('Pengukuran petrokimia', 'Petrochemical measurement'), level:'lanjutan', unit:'mg KOH/g',
    exercise:(a:number,b:number) => {
      const mass=2*a+4, volume=(b+1)*.5, blank=.1, normality=.1, value=(volume-blank)*normality*56.1/mass;
      return {value, text:bi(`Studi kasus sintetis bilangan asam: V=${fmt(volume)} mL, blanko=${blank} mL, N=${normality} eq/L, m=${mass} g. Berapa AN model?`, `Synthetic acid-number case: V=${fmt(volume)} mL, blank=${blank} mL, N=${normality} eq/L, m=${mass} g. What is the model AN?`), why:bi(`AN = (V−blanko) × N × 56,1/m = (${fmt(volume)}−${blank}) × ${normality} × 56,1/${mass} ≈ ${fmt(value)} mg KOH/g. Bukan uji ASTM.`, `AN = (V−blank) × N × 56.1/m = (${fmt(volume)}−${blank}) × ${normality} × 56.1/${mass} ≈ ${fmt(value)} mg KOH/g. Not an ASTM test.`)};
    }},
] as const;

/** Numerical alternatives avoid duplicate answers; the answer position rotates deterministically. */
function buildChoices(value: number, unit: string, seed: number) {
  const expected = fmt(value);
  const step = Math.max(0.1, Math.abs(value) * 0.3);
  const candidates = [value*.5, value*2, value+step, Math.max(0, value-step), value*1.5, value+step*2, value*3];
  const distractors: string[] = [];
  for (const item of candidates) {
    const candidate = fmt(item);
    if (!distractors.includes(candidate) && candidate !== expected && item >= 0) distractors.push(candidate);
    if (distractors.length === 3) break;
  }
  if (distractors.length !== 3) throw new Error('Insufficient distinct distractors');
  const correct = seed % 4;
  const choices = [...distractors.map(s => `${s} ${unit}`)];
  choices.splice(correct, 0, `${expected} ${unit}`);
  return { correct, choices: choices.map(label => bi(label, label)) };
}

export const QUIZ_FAMILIES_V63: { key: string; topic: BiText }[] = families.map(f => ({ key: f.key, topic: f.topic }));
export function generateQuestionBankV63(): ExerciseV63[] {
  const bank: ExerciseV63[] = [];
  for (let familyIndex=0; familyIndex<families.length; familyIndex++) {
    const family = families[familyIndex];
    for (let i=0; i<96; i++) {
      const a=i%12+1, b=Math.floor(i/12)+1;
      const { value, text, why } = family.exercise(a,b);
      const choices=buildChoices(value, family.unit, i*3+familyIndex);
      bank.push({
        id:`v63-${family.key}-${String(i+1).padStart(3,'0')}`,
        family:family.key, topic:family.topic, level:family.level,
        prompt:text, choices:choices.choices, correct:choices.correct,
        explanation:why, source,
        audit:{a,b,expected:round4(value)},
      });
    }
  }
  return bank;
}
export const QUESTION_BANK_V63 = generateQuestionBankV63();
