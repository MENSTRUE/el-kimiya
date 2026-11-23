import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent, type PointerEvent } from 'react';
import {
  Atom, BookOpen, Box, Check, Copy, Download, FlaskConical, LoaderCircle,
  Maximize2, RotateCcw, ShieldCheck, Sparkles, ZoomIn, ZoomOut, AlertTriangle,
} from 'lucide-react';
import { useLanguage } from '../lib/language';
import { VisualMolecularBuilderV61, type BuilderResultV61 } from './VisualMolecularBuilderV61';
import '../molecular-studio-v60.css';

type Atom3D = { element: string; xyz: [number, number, number] };
type Bond3D = { a: number; b: number; order: number };
type Geometry3D = { atoms: Atom3D[]; bonds: Bond3D[]; method: string };
type Descriptor = {
  canonical_smiles_rdkit: string;
  molecular_formula_rdkit: string;
  molecular_weight_rdkit: number;
  logp_rdkit: number;
  tpsa_rdkit: number;
  h_bond_donors_rdkit: number;
  h_bond_acceptors_rdkit: number;
  rotatable_bonds_rdkit: number;
  atom_count_rdkit: number;
  svg_2d: string;
  molecule_3d: Geometry3D | null;
  descriptor_source: string;
};
type Sample = { chembl_id: string; canonical_smiles: string; record_url: string };
type ViewMode = '2d' | '3d';

// Vite localhost runs the V4.2 API on port 8000 and THIS small public V6 API
// separately on port 9000, avoiding accidental mixing of API contracts.
const API = ['localhost', '127.0.0.1'].includes(window.location.hostname)
  ? 'http://127.0.0.1:9000/api/chemistry'
  : '/api/chemistry';
const SAMPLES_URL = `${import.meta.env.BASE_URL.endsWith('/') ? import.meta.env.BASE_URL : `${import.meta.env.BASE_URL}/`}data/molecules/samples.json`;
const NOTES_KEY = 'elkimiya.molecular-studio.v6.notes';

function getDetail(data: unknown, fallback: string): string {
  return data && typeof data === 'object' && 'detail' in data ? String(data.detail) : fallback;
}
function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function svgBlob(svg: string) { return new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }); }
function safeFileName(value: string) { return value.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 40) || 'molecule'; }

function MolecularCanvas3D({ geometry, label }: { geometry: Geometry3D; label: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dragRef = useRef<{ x: number; y: number } | null>(null);
  const [yaw, setYaw] = useState(0.45);
  const [pitch, setPitch] = useState(-0.22);
  const [zoom, setZoom] = useState(1);
  const positions = useMemo(() => {
    const n = geometry.atoms.length || 1;
    const mean = geometry.atoms.reduce((acc, a) => [acc[0] + a.xyz[0], acc[1] + a.xyz[1], acc[2] + a.xyz[2]] as [number, number, number], [0, 0, 0]);
    const center = mean.map(v => v / n);
    const xyz = geometry.atoms.map(a => [a.xyz[0] - center[0], a.xyz[1] - center[1], a.xyz[2] - center[2]]);
    const extent = Math.max(2, ...xyz.flatMap(p => p.map(Math.abs)));
    return { xyz, extent };
  }, [geometry]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const W = canvas.width;
    const H = canvas.height;
    ctx.fillStyle = '#f8fbfc';
    ctx.fillRect(0, 0, W, H);
    // Faint graph paper makes the spatial reference visually explicit.
    ctx.strokeStyle = '#e9f0f3';
    ctx.lineWidth = 1;
    for (let i = 0; i <= W; i += 38) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, H); ctx.stroke(); }
    for (let i = 0; i <= H; i += 38) { ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(W, i); ctx.stroke(); }

    const sy = Math.sin(yaw), cy = Math.cos(yaw), sx = Math.sin(pitch), cx = Math.cos(pitch);
    const factor = (Math.min(W, H) * 0.37 * zoom) / positions.extent;
    const screen = positions.xyz.map(([x, y, z]) => {
      const rx = x * cy + z * sy;
      const rz = -x * sy + z * cy;
      const ry = y * cx - rz * sx;
      const depth = y * sx + rz * cx;
      const perspective = 1 / (1 + Math.max(-0.65, depth / (positions.extent * 8)));
      return { x: W / 2 + rx * factor * perspective, y: H / 2 - ry * factor * perspective, depth, perspective };
    });
    const orderedBonds = geometry.bonds.map(b => ({ ...b, depth: (screen[b.a].depth + screen[b.b].depth) / 2 })).sort((a, b) => a.depth - b.depth);
    for (const bond of orderedBonds) {
      const a = screen[bond.a], b = screen[bond.b];
      if (!a || !b) continue;
      ctx.lineCap = 'round';
      ctx.strokeStyle = '#8ba3ae';
      ctx.lineWidth = Math.max(3, 6 * zoom);
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      if (bond.order >= 1.8) {
        const dx = b.x - a.x, dy = b.y - a.y, len = Math.max(1, Math.hypot(dx, dy));
        ctx.strokeStyle = '#dbe6ea'; ctx.lineWidth = 2.2;
        ctx.beginPath(); ctx.moveTo(a.x + (-dy / len) * 3, a.y + (dx / len) * 3);
        ctx.lineTo(b.x + (-dy / len) * 3, b.y + (dx / len) * 3); ctx.stroke();
      }
    }
    const palette: Record<string, string> = { C: '#395c6b', O: '#e15b54', N: '#477cc3', H: '#e2e8ea', S: '#d5a43e', P: '#dd8b48', F: '#48a873', Cl: '#48a873', Br: '#98634a', I: '#8f6fa9' };
    const sorted = geometry.atoms.map((atom, i) => ({ atom, i, ...screen[i] })).sort((a, b) => a.depth - b.depth);
    for (const a of sorted) {
      const r = (a.atom.element === 'H' ? 7 : 13) * Math.min(1.55, zoom) * a.perspective;
      const gradient = ctx.createRadialGradient(a.x - r * .28, a.y - r * .32, Math.max(1, r * .1), a.x, a.y, r);
      gradient.addColorStop(0, '#fff');
      gradient.addColorStop(.28, palette[a.atom.element] ?? '#80929e');
      gradient.addColorStop(1, '#223b4c');
      ctx.fillStyle = gradient; ctx.beginPath(); ctx.arc(a.x, a.y, Math.max(2, r), 0, Math.PI * 2); ctx.fill();
      if (a.atom.element !== 'C' && a.atom.element !== 'H') {
        ctx.fillStyle = '#fff'; ctx.font = `bold ${Math.max(10, 12 * Math.min(1.35, zoom))}px system-ui`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(a.atom.element, a.x, a.y);
      }
    }
  }, [geometry, positions, yaw, pitch, zoom]);

  const pointerDown = (event: PointerEvent<HTMLCanvasElement>) => {
    dragRef.current = { x: event.clientX, y: event.clientY };
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const pointerMove = (event: PointerEvent<HTMLCanvasElement>) => {
    if (!dragRef.current) return;
    const dx = event.clientX - dragRef.current.x;
    const dy = event.clientY - dragRef.current.y;
    dragRef.current = { x: event.clientX, y: event.clientY };
    setYaw(v => v + dx * 0.012);
    setPitch(v => Math.max(-1.45, Math.min(1.45, v + dy * 0.012)));
  };
  return <div className="v60-canvas3d">
    <canvas ref={canvasRef} width={900} height={540} onPointerDown={pointerDown} onPointerMove={pointerMove}
      onPointerUp={() => { dragRef.current = null; }} onPointerCancel={() => { dragRef.current = null; }}
      aria-label={`Interactive 3D ball-and-stick illustration: ${label}`} role="img"/>
    <div className="v60-canvas3d-controls">
      <button type="button" onClick={() => setZoom(z => Math.min(2.3, z + .2))} aria-label="Zoom 3D in"><ZoomIn size={17}/></button>
      <button type="button" onClick={() => setZoom(z => Math.max(.6, z - .2))} aria-label="Zoom 3D out"><ZoomOut size={17}/></button>
      <button type="button" onClick={() => { setYaw(.45); setPitch(-.22); setZoom(1); }} aria-label="Reset 3D rotation"><RotateCcw size={17}/></button>
    </div>
  </div>;
}

export function MolecularStudioV60() {
  const { language } = useLanguage();
  const en = language === 'en';
  const tx = (id: string, english: string) => en ? english : id;
  const [samples, setSamples] = useState<Sample[]>([]);
  const [selected, setSelected] = useState('custom');
  const [smiles, setSmiles] = useState('CCO');
  const [result, setResult] = useState<Descriptor | null>(null);
  const [view, setView] = useState<ViewMode>('2d');
  const [zoom2d, setZoom2d] = useState(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [sampleWarning, setSampleWarning] = useState('');
  const [note, setNote] = useState('');
  const [saveMessage, setSaveMessage] = useState('');
  const [copied, setCopied] = useState(false);
  const controllerRef = useRef<AbortController | null>(null);
  const cache = useRef(new Map<string, Descriptor>());

  const analyze = useCallback(async (input: string, include3d = false) => {
    const value = input.trim();
    if (!value) { setError('Enter SMILES'); return; }
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    setBusy(true); setError(''); setSaveMessage('');
    if (!include3d) { setResult(null); setView('2d'); setZoom2d(1); }
    const cached = cache.current.get(value);
    if (cached && (!include3d || cached.molecule_3d)) {
      setResult(cached); if (include3d) setView('3d');
      setBusy(false); controllerRef.current = null; return;
    }
    const timer = window.setTimeout(() => controller.abort(), include3d ? 28000 : 18000);
    try {
      const resp = await fetch(API, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ smiles: value, include_3d: include3d }), signal: controller.signal,
      });
      const data: unknown = await resp.json().catch(() => null);
      if (!resp.ok) throw new Error(getDetail(data, `HTTP ${resp.status}`));
      if (!data || typeof data !== 'object' || !('svg_2d' in data) || typeof data.svg_2d !== 'string' || !data.svg_2d.includes('<svg')) {
        throw new Error('The chemistry API did not return a valid SVG structure');
      }
      if (controllerRef.current !== controller) return;
      const computed = data as Descriptor;
      setResult(computed);
      cache.current.set(value, computed);
      cache.current.set(computed.canonical_smiles_rdkit, computed);
      if (include3d) setView('3d');
    } catch (err) {
      if (controllerRef.current === controller) setError(err instanceof Error ? err.message : String(err));
    } finally {
      window.clearTimeout(timer);
      if (controllerRef.current === controller) { setBusy(false); controllerRef.current = null; }
    }
  }, []);

  useEffect(() => {
    let active = true;
    const loadSamples = async () => {
      try {
        const response = await fetch(SAMPLES_URL);
        if (!response.ok) throw new Error('Sample file missing');
        const data: { examples?: Sample[] } = await response.json();
        if (!active) return;
        const list = Array.isArray(data.examples) ? data.examples : [];
        setSamples(list);
        const first = list.find(item => item.chembl_id === 'CHEMBL100') ?? list[0];
        if (first) {
          setSmiles(first.canonical_smiles); setSelected(first.chembl_id);
          void analyze(first.canonical_smiles);
        } else { void analyze('CCO'); }
      } catch {
        if (active) { setSampleWarning('Public ChEMBL samples unavailable. Try the ethanol example.'); void analyze('CCO'); }
      }
    };
    void loadSamples();
    return () => { active = false; controllerRef.current?.abort(); };
  }, [analyze]);

  useEffect(() => {
    setNote(''); setSaveMessage('');
    if (!result) return;
    try {
      const stored: unknown = JSON.parse(window.localStorage.getItem(NOTES_KEY) || '{}');
      if (stored && typeof stored === 'object' && result.canonical_smiles_rdkit in stored) {
        const text = (stored as Record<string, unknown>)[result.canonical_smiles_rdkit];
        if (typeof text === 'string') setNote(text);
      }
    } catch { /* Storage unavailable (private mode); note entry remains usable. */ }
  }, [result?.canonical_smiles_rdkit]);

  // V6.1: Visual Builder returns a chemically validated RDKit result.
  // Existing SMILES, samples, 2D/3D, Firebase and notebook stay untouched.
  const acceptAssembly = useCallback((built: BuilderResultV61) => {
    controllerRef.current?.abort();
    controllerRef.current = null;
    setBusy(false);
    setSelected('custom');
    setSmiles(built.canonical_smiles_rdkit);
    setResult(built);
    cache.current.set(built.canonical_smiles_rdkit, built);
    setView('2d');
    setZoom2d(1);
    setError('');
  }, []);
  const choose = (item: Sample) => {
    setSelected(item.chembl_id); setSmiles(item.canonical_smiles);
    void analyze(item.canonical_smiles);
  };
  const useExample = (value: string) => {
    setSelected('custom'); setSmiles(value);
    void analyze(value);
  };
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setSelected('custom'); void analyze(smiles);
  };
  const ask3d = () => {
    if (!result || busy) return;
    if (result.molecule_3d) { setView('3d'); return; }
    void analyze(result.canonical_smiles_rdkit, true);
  };
  const exportSvg = () => {
    if (!result) return;
    saveBlob(svgBlob(result.svg_2d), `${safeFileName(selected === 'custom' ? result.molecular_formula_rdkit : selected)}-RDKit.svg`);
  };
  const exportPng = () => {
    if (!result) return;
    const file = `${safeFileName(selected === 'custom' ? result.molecular_formula_rdkit : selected)}-RDKit.png`;
    const url = URL.createObjectURL(svgBlob(result.svg_2d));
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas'); canvas.width = 1520; canvas.height = 1020;
      const ctx = canvas.getContext('2d');
      if (!ctx) { URL.revokeObjectURL(url); return; }
      ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(blob => { if (blob) saveBlob(blob, file); }, 'image/png');
      URL.revokeObjectURL(url);
    };
    img.onerror = () => { URL.revokeObjectURL(url); setError('PNG conversion failed; download the SVG instead.'); };
    img.src = url;
  };
  const saveNote = () => {
    if (!result) return;
    try {
      const previous: Record<string, string> = JSON.parse(window.localStorage.getItem(NOTES_KEY) || '{}');
      const entries = Object.entries(previous).filter(([key, value]) => typeof key === 'string' && typeof value === 'string');
      const capped = Object.fromEntries(entries.slice(-40));
      capped[result.canonical_smiles_rdkit] = note.slice(0, 1600);
      window.localStorage.setItem(NOTES_KEY, JSON.stringify(capped));
      setSaveMessage(tx('Catatan tersimpan di browser ini', 'Note saved in this browser'));
    } catch { setSaveMessage(tx('Browser menolak penyimpanan lokal', 'Browser blocked local storage')); }
  };
  const copySmiles = () => {
    if (!result) return;
    void navigator.clipboard.writeText(result.canonical_smiles_rdkit).then(() => {
      setCopied(true); window.setTimeout(() => setCopied(false), 1500);
    }).catch(() => setError('Clipboard unavailable'));
  };
  const metrics = result ? [
    [tx('Rumus molekul', 'Molecular formula'), result.molecular_formula_rdkit],
    [tx('Massa molar', 'Molar mass'), `${result.molecular_weight_rdkit} g/mol`],
    ['LogP', String(result.logp_rdkit)],
    ['TPSA', `${result.tpsa_rdkit} Å²`],
    [tx('Donor H', 'H-bond donors'), String(result.h_bond_donors_rdkit)],
    [tx('Akseptor H', 'H-bond acceptors'), String(result.h_bond_acceptors_rdkit)],
    [tx('Ikatan rotasi', 'Rotatable bonds'), String(result.rotatable_bonds_rdkit)],
    [tx('Atom', 'Atoms'), String(result.atom_count_rdkit)],
  ] : [];
  return <section className="v60-studio" aria-label="El-Kimiya Molecular Studio V6">
    <header className="v60-hero">
      <div><span className="v60-eyebrow"><Atom size={15}/> EL-KĪMIYĀ · MOLECULAR STUDIO V6</span>
        <h2>{tx('Dari kode menjadi molekul.', 'From code to molecule.')}</h2>
        <p>{tx('Tulis SMILES atau buka sampel ChEMBL. Struktur 2D dibuat RDKit, geometri 3D bisa diputar, dan pengamatanmu disimpan secara lokal.', 'Type SMILES or open a ChEMBL sample. RDKit draws the 2D structure, estimates an interactive 3D conformer, and keeps your notes locally.')}</p>
      </div><div className="v60-hero-mark"><Atom size={58}/><span>2D <b>+</b> 3D</span></div>
    </header>
    <div className="v60-workspace">
      <aside className="v60-sidebar">
        <div className="v60-side-heading"><BookOpen size={17}/>{tx('Koleksi molekul', 'Molecule library')}<span>{samples.length}</span></div>
        <div className="v60-examples"><button type="button" onClick={() => useExample('CCO')}>CCO · {tx('Etanol','Ethanol')}</button><button type="button" onClick={() => useExample('O')}>O · {tx('Air','Water')}</button><button type="button" onClick={() => useExample('c1ccccc1')}>{tx('Benzena','Benzene')}</button></div>
        <p className="v60-subtle">{tx('10 contoh ChEMBL publik · bukan pencarian semua 2,89 juta data', '10 public ChEMBL examples · not a search of all 2.89M records')}</p>
        <div className="v60-sample-list">
          {samples.map(item => <button type="button" className={selected === item.chembl_id ? 'v60-selected' : ''} key={item.chembl_id} onClick={() => choose(item)}><span>{item.chembl_id}</span><small>{item.canonical_smiles}</small></button>)}
        </div>
        {sampleWarning && <p className="v60-subtle">{sampleWarning}</p>}
      </aside>
      <div className="v60-main">
        <VisualMolecularBuilderV61 onResult={acceptAssembly} />
        <form className="v60-editor" onSubmit={submit}>
          <label htmlFor="v60-smiles"><FlaskConical size={16}/>{tx('Editor SMILES', 'SMILES editor')}</label>
          <div><input id="v60-smiles" value={smiles} maxLength={256} spellCheck={false} autoComplete="off" onChange={e => { setSmiles(e.target.value); setSelected('custom'); }} placeholder="CCO"/>
            <button type="submit" disabled={busy || !smiles.trim()}>{busy ? <LoaderCircle size={16} className="v60-loading"/> : <Sparkles size={16}/>} {tx('Gambar molekul', 'Draw molecule')}</button></div>
          <small>{tx('Gambar otomatis saat memilih sampel; untuk SMILES yang diketik, tekan Gambar molekul.', 'Automatic drawing on sample selection; for typed SMILES, select Draw molecule.')} · {tx('Maks. 256 karakter', 'Max. 256 characters')}</small>
        </form>
        <div className="v60-artboard" id="v60-artboard">
          <div className="v60-artbar"><div className="v60-tabs"><button type="button" aria-pressed={view === '2d'} className={view === '2d' ? 'on' : ''} onClick={() => setView('2d')}><Atom size={15}/> 2D</button><button type="button" aria-pressed={view === '3d'} className={view === '3d' ? 'on' : ''} onClick={ask3d} disabled={!result || busy}><Box size={15}/> 3D {busy && <LoaderCircle size={13} className="v60-loading"/>}</button></div>
            <div className="v60-actions"><button type="button" onClick={() => setZoom2d(z => Math.min(2.4, z + .2))} disabled={view !== '2d' || !result} title="Zoom in"><ZoomIn size={17}/></button><button type="button" onClick={() => setZoom2d(z => Math.max(.55, z - .2))} disabled={view !== '2d' || !result} title="Zoom out"><ZoomOut size={17}/></button><button type="button" onClick={() => { setZoom2d(1); setView('2d'); }} disabled={!result} title="Reset view"><Maximize2 size={17}/></button></div></div>
          <div className="v60-art-content" aria-live="polite">
            {busy && !result ? <div className="v60-placeholder"><LoaderCircle size={35} className="v60-loading"/><span>{tx('RDKit menggambar struktur…','RDKit is drawing the structure…')}</span></div> :
              result ? (view === '3d' && result.molecule_3d ? <MolecularCanvas3D geometry={result.molecule_3d} label={result.molecular_formula_rdkit}/> :
                <div className="v60-svg-stage"><img src={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(result.svg_2d)}`} style={{ transform: `scale(${zoom2d})` }} alt={`${tx('Struktur 2D RDKit molekul', 'RDKit 2D molecular structure')} ${result.molecular_formula_rdkit}`}/></div>) :
                <div className="v60-placeholder"><Atom size={42}/><span>{tx('Pilih sampel atau tulis SMILES', 'Select a sample or enter SMILES')}</span></div>}
          </div>
          <div className="v60-artfooter"><span><ShieldCheck size={15}/>{view === '3d' ? tx('Konformer perkiraan ETKDG · bukan struktur eksperimen', 'ETKDG estimated conformer · not measured structure') : tx('Gambar struktur dihasilkan RDKit, bukan AI generatif', 'Structural drawing generated by RDKit, not generative AI')}</span>
            <div><button type="button" onClick={exportSvg} disabled={!result}><Download size={15}/> SVG</button><button type="button" onClick={exportPng} disabled={!result}><Download size={15}/> PNG</button></div></div>
        </div>
        {error && <p className="v60-alert" role="alert"><AlertTriangle size={17}/>{error}</p>}
        {result && <>
          <div className="v60-info-title"><strong>{selected !== 'custom' ? selected : result.molecular_formula_rdkit}</strong><button type="button" onClick={copySmiles}>{copied ? <Check size={14}/> : <Copy size={14}/>} {copied ? tx('Disalin','Copied') : tx('Salin SMILES', 'Copy SMILES')}</button></div>
          <div className="v60-metrics">{metrics.map(([name, value]) => <div key={name}><small>{name}</small><strong>{value}</strong></div>)}</div>
          <div className="v60-canonical"><strong>Canonical SMILES</strong><code>{result.canonical_smiles_rdkit}</code></div>
        </>}
      </div>
    </div>
    <div className="v60-bottom">
      <div className="v60-note-card"><h3><BookOpen size={19}/>{tx('Buku catatan peneliti muda', 'Young researcher notebook')}</h3>
        <p>{tx('Apa hipotesismu? Apa yang harus divalidasi? Catatan disimpan hanya pada browser ini, per molekul.', 'What is your hypothesis? What needs validation? Notes are saved in this browser only, per molecule.')}</p>
        <textarea value={note} onChange={e => { setNote(e.target.value); setSaveMessage(''); }} maxLength={1600} disabled={!result} placeholder={tx('Contoh: Mengapa gugus -OH memengaruhi kelarutan? Perlu sumber literatur…','Example: Why does -OH affect solubility? Need literature evidence…')}/>
        <div className="v60-note-actions"><span>{saveMessage || `${note.length}/1600`}</span><button type="button" disabled={!result} onClick={saveNote}><Check size={15}/>{tx('Simpan catatan','Save note')}</button></div>
      </div>
      <div className="v60-ethics-card"><span className="v60-eyebrow"><ShieldCheck size={16}/>{tx('ADAB PENELITIAN & LITERASI SAINS','RESEARCH ETHICS & SCIENTIFIC LITERACY')}</span><h3>{tx('Ilmu membawa amanah.', 'Knowledge comes with responsibility.')}</h3>
        <p>{tx('Pisahkan data terukur, perhitungan, dan hipotesis. Jangan menyimpulkan kehalalan, keamanan, atau toksisitas hanya dari SMILES.', 'Distinguish measurements, computations, and hypotheses. Never infer halal status, safety, or toxicity from a SMILES string alone.')}</p>
        <p>{tx('Langkah berikutnya: bandingkan dengan sumber ChEMBL, PubChem, dan literatur ilmiah. ', 'Next step: verify against ChEMBL, PubChem, and scientific literature. ')}
          <a href="https://www.ebi.ac.uk/chembl/" target="_blank" rel="noopener noreferrer">ChEMBL</a> · <a href="https://pubchem.ncbi.nlm.nih.gov/" target="_blank" rel="noopener noreferrer">PubChem</a></p>
        <small>{tx('V6.1: builder molekul sederhana, bukan editor stereo profesional atau prediktor klinis.', 'V6.1: simple assembly, not a professional stereo editor or clinical predictor.')}</small>
      </div>
    </div>
  </section>;
}
