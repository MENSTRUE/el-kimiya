import { useEffect, useMemo, useState } from 'react';
import { Atom, Beaker, BrainCircuit, Download, Droplets, FlaskConical, Info, LoaderCircle, RotateCcw, ShieldCheck, Target, TrendingUp } from 'lucide-react';
import { useLanguage } from '../lib/language';
import { firebaseConfigured, runHybridInference, type InferencePreference, type InferenceResult } from '../lib/hybrid';
import { evaluateTitration, summarizeRuns, SYNTHETIC_SCENARIOS, validateScenario, type SyntheticScenario } from '../lib/petroExperimentV62';
import '../petro-experiment-v62.css';

type Run = { id: string; scenarioId: string; drops: number; volumeMl: number; acidNumber: number; status: string; time: string };
const STORAGE_KEY = 'elkimiya.petrolab.v62.trials';
const f = (n: number, decimals = 3) => n.toLocaleString('en-US', { maximumFractionDigits: decimals, minimumFractionDigits: 0 });
function downloadJson(data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = 'elkimiya-petro-lab-educational-report.json';
  document.body.appendChild(a); a.click(); a.remove(); window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function PetrochemicalExperimentLabV62() {
  const { language } = useLanguage();
  const en = language === 'en';
  const tx = (id: string, english: string) => en ? english : id;
  const [opened, setOpened] = useState(false);
  const [scenario, setScenario] = useState<SyntheticScenario>(SYNTHETIC_SCENARIOS[0]);
  const [drops, setDrops] = useState(0);
  const [runs, setRuns] = useState<Run[]>(() => {
    try { const saved: unknown = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '[]');
      return Array.isArray(saved) ? saved.filter((r: unknown) => r && typeof r === 'object' && 'acidNumber' in r && Number.isFinite((r as Run).acidNumber)).slice(-12) as Run[] : [];
    } catch { return []; }
  });
  const [aiPreference, setAiPreference] = useState<InferencePreference>('Prefer on-device');
  const [aiBusy, setAiBusy] = useState(false);
  const [aiOutput, setAiOutput] = useState<InferenceResult | null>(null);
  const [aiError, setAiError] = useState('');
  const [notice, setNotice] = useState('');
  const validation = useMemo(() => validateScenario(scenario), [scenario]);
  const result = useMemo(() => {
    if (validation) return null;
    try { return evaluateTitration(scenario, drops); } catch { return null; }
  }, [scenario, drops, validation]);
  const comparisonKey = [scenario.id, scenario.referenceAcidNumber, scenario.sampleMassG, scenario.titrantNormality, scenario.dropVolumeMl, scenario.blankMl].join('|');
  const ownRuns = runs.filter(run => run.scenarioId === comparisonKey);
  const summary = summarizeRuns(ownRuns.map(r => r.acidNumber), scenario.referenceAcidNumber);

  useEffect(() => {
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(runs.slice(-12))); } catch { /* session still works without storage */ }
  }, [runs]);

  const choose = (id: string) => {
    const next = SYNTHETIC_SCENARIOS.find(s => s.id === id);
    if (!next) return;
    setScenario(next); setDrops(0); setAiOutput(null); setAiError(''); setNotice('');
  };
  const update = (field: keyof Pick<SyntheticScenario, 'sampleMassG' | 'titrantNormality' | 'dropVolumeMl' | 'blankMl' | 'referenceAcidNumber'>, value: number) => {
    setScenario(previous => ({ ...previous, [field]: value })); setDrops(0); setAiOutput(null); setNotice('');
  };
  const addDrops = (amount: number) => {
    setDrops(prev => Math.min(2000, Math.max(0, prev + amount))); setAiOutput(null); setNotice('');
  };
  const record = () => {
    if (!result || !drops) return;
    const item: Run = { id: `${Date.now()}-${runs.length}`, scenarioId: comparisonKey, drops, volumeMl: result.volumeMl,
      acidNumber: Number(result.acidNumberMgKohG.toFixed(6)), status: result.status, time: new Date().toISOString() };
    setRuns(prev => [...prev, item].slice(-12));
    setNotice(tx('Percobaan virtual dicatat di browser ini.', 'Virtual trial recorded in this browser.'));
  };
  const askAi = async () => {
    if (!result || aiBusy || !firebaseConfigured) return;
    setAiBusy(true); setAiOutput(null); setAiError('');
    const prompt = `${en ? 'Answer in English' : 'Jawab dalam Bahasa Indonesia'}. You are an educational chemistry tutor. Explain an illustrative, entirely synthetic petroleum-product quality-control TITRATION planning example, not a real ASTM test. Inputs: sample mass ${scenario.sampleMassG} g, titrant normality ${scenario.titrantNormality} eq/L, calibrated volume per drop ${scenario.dropVolumeMl} mL, blank ${scenario.blankMl} mL, fictional reference acid number ${scenario.referenceAcidNumber} mg KOH/g. After ${drops} virtual drops, calculated acid number ${result.acidNumberMgKohG.toFixed(3)} mg KOH/g. Status ${result.status}; one-drop resolution ${result.resolutionMgKohGPerDrop.toFixed(4)} mg KOH/g. In 4 short sentences: interpret the arithmetic, explain effect of drop calibration, suggest an educational next measurement to reduce measurement error, and state this is NOT an actual oil quality, corrosion, industrial safety or ASTM D664 certification. No physical lab protocols, chemical mixing instructions, or hazardous procedures.`;
    try { setAiOutput(await runHybridInference(prompt, aiPreference)); }
    catch (err) { setAiError(err instanceof Error ? err.message : String(err)); }
    finally { setAiBusy(false); }
  };
  const statusText = !result ? tx('Periksa input', 'Check inputs') : result.status === 'before' ? tx('Belum mencapai target simulasi', 'Below simulated target') :
    result.status === 'near' ? tx('Mendekati target simulasi', 'Near simulated target') : tx('Melewati target simulasi · ulangi', 'Overshot simulated target · retry');
  const statusColor = result?.status === 'near' ? 'good' : result?.status === 'after' ? 'bad' : 'neutral';
  const meter = result ? Math.min(100, result.completion * 100) : 0;
  return <section id="petro-v62" className="petro62" aria-label="Petrochemical educational experiment planner">
    <header className="petro62-intro">
      <div><div className="petro62-kicker"><Beaker size={16}/> {tx('BARU · PETROCHEMICAL EXPERIMENT LAB','NEW · PETROCHEMICAL EXPERIMENT LAB')}</div>
        <h2>{tx('Uji ide sebelum memakai bahan nyata.', 'Explore an idea before using real materials.')}</h2>
        <p>{tx('Contoh studi kasus QC minyak: berapa tetes yang dibutuhkan, kapan melewati titik target, dan seberapa besar pengaruh kalibrasi? Semua contoh menggunakan data sintetis, bukan keputusan industri.',
          'An illustrative oil-QC case: how many virtual drops reach the target, what happens when you overshoot, and why calibration matters. Synthetic data only, not an industrial decision.')}</p>
      </div>
      <button type="button" className="petro62-open" onClick={() => setOpened(v => !v)} aria-expanded={opened}>
        <Droplets size={18}/>{opened ? tx('Tutup eksperimen','Close experiment') : tx('Mulai eksperimen virtual','Launch virtual experiment')}
      </button>
    </header>
    <div className="petro62-trust"><ShieldCheck size={15}/>{tx('Model matematika edukatif · bukan digital twin tervalidasi, bukan ASTM D664, bukan prediksi keberhasilan proses nyata',
      'Educational arithmetic model · not a validated digital twin, not ASTM D664, not a real process success prediction')}</div>
    {opened && <div className="petro62-body">
      <div className="petro62-design">
        <div className="petro62-title"><Target size={18}/><h3>{tx('01 · Desain eksperimen', '01 · Experiment design')}</h3></div>
        <label className="petro62-field petro62-full">{tx('Skenario sintetis', 'Synthetic scenario')}
          <select value={scenario.id} onChange={e => choose(e.target.value)}>{SYNTHETIC_SCENARIOS.map(s => <option key={s.id} value={s.id}>{en ? s.labelEn : s.labelId}</option>)}</select>
        </label>
        <div className="petro62-fields">
          <label className="petro62-field">{tx('Massa sampel (g)', 'Sample mass (g)')}<input type="number" min="1" max="30" step="0.5" value={scenario.sampleMassG} onChange={e => update('sampleMassG', Number(e.target.value))}/></label>
          <label className="petro62-field">{tx('Normalitas (eq/L)', 'Normality (eq/L)')}<input type="number" min="0.01" max="0.5" step="0.01" value={scenario.titrantNormality} onChange={e => update('titrantNormality', Number(e.target.value))}/></label>
          <label className="petro62-field">{tx('Ukuran tetes (mL)', 'Drop size (mL)')}<input type="number" min="0.005" max="0.1" step="0.005" value={scenario.dropVolumeMl} onChange={e => update('dropVolumeMl', Number(e.target.value))}/></label>
          <label className="petro62-field">{tx('Volume blanko (mL)', 'Blank volume (mL)')}<input type="number" min="0" max="0.5" step="0.01" value={scenario.blankMl} onChange={e => update('blankMl', Number(e.target.value))}/></label>
          <label className="petro62-field petro62-full">{tx('Nilai referensi buatan (mg KOH/g)', 'Fictional reference (mg KOH/g)')}<input type="number" min="0.05" max="5" step="0.05" value={scenario.referenceAcidNumber} onChange={e => update('referenceAcidNumber', Number(e.target.value))}/></label>
        </div>
        {validation && <p role="alert" className="petro62-warning">{validation}</p>}
        <p className="petro62-small"><Info size={13}/> {tx('Tidak ada rekomendasi bahan nyata. Volume tetes harus dikalibrasi sendiri pada percobaan sungguhan; angka bawaan hanya asumsi.',
          'No real-world reagent recommendation. Real drop volumes require calibration; preset values are assumptions.')}</p>
      </div>
      <div className="petro62-run">
        <div className="petro62-title"><FlaskConical size={18}/><h3>{tx('02 · Teteskan secara virtual', '02 · Add virtual drops')}</h3></div>
        <div className="petro62-beaker" aria-hidden="true">
          <svg viewBox="0 0 380 168" width="100%" xmlns="http://www.w3.org/2000/svg">
            <defs><linearGradient id="petro-liquid" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor={result?.status === 'after' ? '#f4b0a2' : '#a2d8e8'}/><stop offset="100%" stopColor={result?.status === 'after' ? '#de8f7c' : '#3c92b0'}/></linearGradient></defs>
            <path d="M176 8 L204 8 L201 48 L179 48 Z" fill="#D0E4EA" stroke="#5C8392" strokeWidth="2"/>
            <path d="M190 48 L190 75" stroke="#367287" strokeWidth="3" strokeLinecap="round"/>
            {drops > 0 && <path className="petro62-drop" d="M190 84 C183 93 184 100 190 103 C196 100 197 93 190 84 Z" fill="#409CB8"/>}
            <path d="M111 100 L124 154 Q190 165 256 154 L269 100" fill="#EFF8FA" stroke="#6F9DA9" strokeWidth="3" strokeLinejoin="round"/>
            <path d={`M${124 - meter*.05} ${151 - meter*.33} Q190 ${156 - meter*.33} ${256 + meter*.05} ${151 - meter*.33} L256 152 Q190 161 124 152 Z`} fill="url(#petro-liquid)" opacity=".85"/>
            <path d="M101 99 H279" stroke="#6F9DA9" strokeWidth="3" strokeLinecap="round"/>
            <text x="22" y="36" fontSize="13" fill="currentColor" fontWeight="600">{f(drops,0)} {en ? 'drops' : 'tetes'}</text>
            <text x="357" y="36" textAnchor="end" fontSize="13" fill="currentColor">{result ? f(result.volumeMl,3) : '—'} mL</text>
          </svg>
          <div className="petro62-progress"><div style={{ width: `${meter}%` }}/></div>
        </div>
        <div className="petro62-buttons"><button type="button" onClick={() => addDrops(1)} disabled={!result || drops >= 2000}><Droplets size={17}/> +1 {tx('tetes','drop')}</button>
          <button type="button" onClick={() => addDrops(5)} disabled={!result || drops >= 2000}>+5 {tx('tetes','drops')}</button>
          <button type="button" onClick={() => addDrops(10)} disabled={!result || drops >= 2000}>+10</button>
          <button type="button" className="subtle" onClick={() => { setDrops(0); setAiOutput(null); setNotice(''); }}><RotateCcw size={16}/> {tx('Ulang','Reset')}</button></div>
        <div className={`petro62-state ${statusColor}`} role="status">{statusText}</div>
        <div className="petro62-stats"><div><small>{tx('Bilangan asam terhitung','Calculated acid number')}</small><strong>{result ? f(result.acidNumberMgKohG) : '—'}</strong><span>mg KOH/g</span></div>
          <div><small>{tx('Referensi sintetis','Synthetic reference')}</small><strong>{f(scenario.referenceAcidNumber)}</strong><span>mg KOH/g</span></div>
          <div><small>{tx('Target teoritis','Theoretical target')}</small><strong>{result ? f(result.theoreticalEndpointDrops,1) : '—'}</strong><span>{tx('tetes','drops')}</span></div>
          <div><small>{tx('Resolusi 1 tetes','One-drop resolution')}</small><strong>{result ? f(result.resolutionMgKohGPerDrop,4) : '—'}</strong><span>mg KOH/g</span></div></div>
        <p className="petro62-formula">AN = max(0, (V − Vblank) × N × 56.1 / m). {tx('Perhitungan ekuivalen sederhana, bukan prosedur ASTM.', 'Simplified equivalent calculation, not an ASTM procedure.')}</p>
        <button type="button" className="petro62-record" disabled={!result || drops === 0} onClick={record}>{tx('Catat percobaan virtual', 'Record virtual trial')}</button>
        {notice && <p className="petro62-small" role="status">{notice}</p>}
      </div>
      <div className="petro62-review">
        <div className="petro62-title"><TrendingUp size={18}/><h3>{tx('03 · Evaluasi dan ulangi', '03 · Review and repeat')}</h3></div>
        <p className="petro62-small">{tx('Catat percobaan dengan jumlah tetes berbeda. Bandingkan hasil, kalibrasi ukuran tetes, dan ulangi. Semua angka observasi adalah hasil simulasi.',
          'Record trials with different drop counts. Compare estimates, calibrate the assumed drop size, and repeat. Every observation is simulated.')}</p>
        <div className="petro62-history">{ownRuns.length ? ownRuns.slice(-6).map((r, i) => <div key={r.id}><span>#{i+1} · {f(r.drops,0)} {tx('tetes','drops')}</span><strong>{f(r.acidNumber)} mg KOH/g</strong><small>{r.status === 'after' ? tx('Melewati target','Overshot') : r.status === 'near' ? tx('Dekat target','Near target') : tx('Di bawah target','Below target')}</small></div>) : <p>{tx('Belum ada percobaan tersimpan.','No trials saved yet.')}</p>}</div>
        {summary && <div className="petro62-summary">{tx('Rata-rata', 'Mean')}: <strong>{f(summary.mean)} mg KOH/g</strong> · {tx('Rentang', 'Range')}: <strong>{f(summary.range)}</strong> · {tx('Selisih target', 'Reference difference')}: <strong>{f(summary.absError)}</strong></div>}
        <button type="button" className="petro62-export" onClick={() => downloadJson({kind: 'EL_KIMIYA_V62_SYNTHETIC_EDUCATIONAL_REPORT', method: 'Simplified acid-number equivalent arithmetic; not ASTM D664', not_a_real_test: true, scenario, current: result, trials: ownRuns, assumptions: ['fictional reference acid number', 'fixed per-drop volume', 'single-equivalent conversion', 'no chemical kinetics or physical titration curve', 'no regulatory or process decision'], generated_at: new Date().toISOString() })}><Download size={16}/>{tx('Ekspor laporan JSON', 'Export JSON report')}</button>
        <div className="petro62-ai"><div className="petro62-title"><BrainCircuit size={18}/><h3>{tx('04 · Diskusi dengan Hybrid AI', '04 · Discuss with Hybrid AI')}</h3></div>
          <p className="petro62-small">{tx('AI hanya menjelaskan perhitungan dan ketidakpastian; bukan mengesahkan hasil percobaan industri.',
            'AI explains the calculation and its uncertainty; it cannot validate a physical industrial experiment.')}</p>
          <select aria-label={tx('Pilih rute inferensi','Select inference route')} value={aiPreference} onChange={e => setAiPreference(e.target.value as InferencePreference)}>
            <option value="Prefer on-device">Prefer on-device</option><option value="On-device only">On-device only</option><option value="Prefer cloud">Prefer cloud</option><option value="Cloud only">Cloud only</option>
          </select>
          <button type="button" onClick={() => void askAi()} disabled={!result || !firebaseConfigured || aiBusy} className="petro62-ask">{aiBusy ? <LoaderCircle size={16} className="petro62-spinner"/> : <BrainCircuit size={16}/>} {tx('Jelaskan hasil percobaan', 'Explain this experiment')}</button>
          {!firebaseConfigured && <p className="petro62-warning">{tx('Firebase belum dikonfigurasi di browser ini. Simulasi matematika tetap berfungsi.','Firebase is not configured. The math sandbox still works.')}</p>}
          {aiError && <p role="alert" className="petro62-warning">{aiError}</p>}
          {aiOutput && <div className="petro62-answer"><strong>Firebase AI Logic · {aiOutput.provider}</strong><p>{aiOutput.text}</p></div>}
        </div>
      </div>
    </div>}
    <footer className="petro62-footer"><Atom size={14}/>{tx('Inspirasi: pengujian bilangan asam pada produk petroleum; rujukan ASTM D664. Bukan implementasi metode standar tersebut.',
      'Inspired by petroleum acid-number testing; reference: ASTM D664. This is not an implementation of that standard.')}
      <a href="https://store.astm.org/standards/d664" target="_blank" rel="noopener noreferrer">{tx('Rujukan standar', 'Standard reference')}</a></footer>
  </section>;
}
