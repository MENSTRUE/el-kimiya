import { useEffect, useId, useRef, useState, type DragEvent, type PointerEvent as ReactPointerEvent } from 'react';
import { AlertTriangle, Atom, Check, FlaskConical, Grip, LoaderCircle, Redo2, RotateCcw, Trash2, Undo2, Maximize2, ZoomIn, ZoomOut, Move } from 'lucide-react';
import { useLanguage } from '../lib/language';
import '../visual-molecular-builder-v61.css';
import '../v8/molecule86.css';
import { MoleculeFullscreen86, useMoleculeFullscreen86 } from './MoleculeFullscreen86';

/** A small, deterministic atom-and-bond graph, not a freehand drawing program.
 * RDKit on the server is the authority for chemical validity and SMILES.
 */
type Element = 'C' | 'N' | 'O' | 'S' | 'F' | 'Cl' | 'Br';
type Node = { id: number; element: Element; x: number; y: number };
type Edge = { id: number; a: number; b: number; order: 1 | 2 | 3 };
type Graph = { nodes: Node[]; edges: Edge[] };
type History = { past: Graph[]; present: Graph; future: Graph[] };
type Piece = 'bond' | 'slash' | 'double' | 'triple' | 'benzene' | 'cyclohexane' | 'ethyl' | 'OH' | 'NH2' | Element;
type Pick = { type: 'node' | 'edge'; id: number } | null;

export type BuilderResultV61 = {
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
  molecule_3d: null;
  descriptor_source: string;
};

const W = 760, H = 410, STEP = 68;
const API = ['localhost', '127.0.0.1'].includes(window.location.hostname)
  ? 'http://127.0.0.1:9000/api/chemistry' : '/api/chemistry';
const PALETTE: { kind: Piece; id: string; en: string; symbol: string }[] = [
  { kind: 'slash', id: 'Ikatan miring', en: 'Diagonal bond', symbol: '╱' },
  { kind: 'bond', id: 'Ikatan tunggal', en: 'Single bond', symbol: '—' },
  { kind: 'double', id: 'Ikatan rangkap', en: 'Double bond', symbol: '═' },
  { kind: 'triple', id: 'Ikatan tiga', en: 'Triple bond', symbol: '≡' },
  { kind: 'benzene', id: 'Cincin benzena', en: 'Benzene ring', symbol: '⌬' },
  { kind: 'cyclohexane', id: 'Cincin sikloheksana', en: 'Cyclohexane ring', symbol: '⬡' },
  { kind: 'ethyl', id: 'Rantai C₂', en: 'Two-carbon chain', symbol: 'C₂' },
  { kind: 'OH', id: 'Gugus hidroksil', en: 'Hydroxyl group', symbol: 'OH' },
  { kind: 'NH2', id: 'Gugus amino', en: 'Amino group', symbol: 'NH₂' },
  { kind: 'C', id: 'Karbon', en: 'Carbon', symbol: 'C' },
  { kind: 'O', id: 'Oksigen', en: 'Oxygen', symbol: 'O' },
  { kind: 'N', id: 'Nitrogen', en: 'Nitrogen', symbol: 'N' },
  { kind: 'S', id: 'Sulfur', en: 'Sulfur', symbol: 'S' },
  { kind: 'F', id: 'Fluorin', en: 'Fluorine', symbol: 'F' },
  { kind: 'Cl', id: 'Klorin', en: 'Chlorine', symbol: 'Cl' },
  { kind: 'Br', id: 'Bromin', en: 'Bromine', symbol: 'Br' },
];
const colors: Record<Element, string> = { C: 'var(--m86-carbon)', O: 'var(--m86-oxygen)', N: 'var(--m86-nitrogen)', S: 'var(--m86-sulfur)', F: 'var(--m86-halogen)', Cl: 'var(--m86-halogen)', Br: 'var(--m86-bromine)' };
const initial = (): Graph => ({
  nodes: [{ id: 1, element: 'C', x: 292, y: 250 }, { id: 2, element: 'C', x: 351, y: 216 }],
  edges: [{ id: 1, a: 1, b: 2, order: 1 }],
});
const clone = (g: Graph): Graph => ({ nodes: g.nodes.map(n => ({ ...n })), edges: g.edges.map(b => ({ ...b })) });
const bound = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const distance = (x: number, y: number, node: Node) => Math.hypot(x - node.x, y - node.y);
const nextNode = (g: Graph) => Math.max(0, ...g.nodes.map(n => n.id)) + 1;
const nextEdge = (g: Graph) => Math.max(0, ...g.edges.map(b => b.id)) + 1;
function preset(which: 'ethanol' | 'benzene' | 'acid'): Graph {
  if (which === 'ethanol') return {
    nodes: [
      { id: 1, element: 'C', x: 275, y: 246 },
      { id: 2, element: 'C', x: 335, y: 212 },
      { id: 3, element: 'O', x: 397, y: 246 },
    ],
    edges: [{ id: 1, a: 1, b: 2, order: 1 }, { id: 2, a: 2, b: 3, order: 1 }],
  };
  if (which === 'acid') return {
    nodes: [
      { id: 1, element: 'C', x: 280, y: 245 },
      { id: 2, element: 'C', x: 348, y: 245 },
      { id: 3, element: 'O', x: 390, y: 188 },
      { id: 4, element: 'O', x: 402, y: 300 },
    ],
    edges: [
      { id: 1, a: 1, b: 2, order: 1 },
      { id: 2, a: 2, b: 3, order: 2 },
      { id: 3, a: 2, b: 4, order: 1 },
    ],
  };
  const ring = { nodes: [] as Node[], edges: [] as Edge[] };
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 3) * i - Math.PI / 6;
    ring.nodes.push({ id: i + 1, element: 'C', x: 375 + Math.cos(a) * 76, y: 215 + Math.sin(a) * 76 });
    ring.edges.push({ id: i + 1, a: i + 1, b: (i + 1) % 6 + 1, order: i % 2 ? 1 : 2 });
  }
  return ring;
}
function nearest(g: Graph, x: number, y: number): Node | null {
  return [...g.nodes].sort((a, b) => distance(x, y, a) - distance(x, y, b))[0] ?? null;
}
function attach(g: Graph, anchor: Node | null, element: Element, x: number, y: number, order: 1 | 2 | 3 = 1) {
  const id = nextNode(g);
  if (anchor) {
    const angle = Math.atan2(y - anchor.y, x - anchor.x);
    const direction = distance(x, y, anchor) < 17 ? -Math.PI / 6 : Math.round(angle / (Math.PI / 6)) * (Math.PI / 6);
    x = anchor.x + STEP * Math.cos(direction);
    y = anchor.y + STEP * Math.sin(direction);
    // Try alternate directions to avoid stacking atoms on top of one another.
    for (let k = 0; k < 10 && g.nodes.some(n => Math.hypot(n.x - x, n.y - y) < 21); k++) {
      const a = direction + (k % 2 ? -1 : 1) * Math.ceil((k + 1) / 2) * Math.PI / 3;
      x = anchor.x + STEP * Math.cos(a);
      y = anchor.y + STEP * Math.sin(a);
    }
    g.edges.push({ id: nextEdge(g), a: anchor.id, b: id, order });
  }
  g.nodes.push({ id, element, x: bound(x, 40, W - 40), y: bound(y, 40, H - 40) });
  return g.nodes[g.nodes.length - 1];
}
function putPiece(source: Graph, kind: Piece, x: number, y: number, selected: number | null): Graph {
  const g = clone(source);
  x = bound(x, 40, W - 40); y = bound(y, 40, H - 40);
  const closest = nearest(g, x, y);
  const anchor = closest && distance(x, y, closest) < 115 ? closest
    : (g.nodes.find(n => n.id === selected) ?? closest);
  if (g.nodes.length >= 55) return g;
  if (!g.nodes.length && ['bond', 'slash', 'double', 'triple'].includes(kind)) {
    const first = attach(g, null, 'C', x - 35, y + (kind === 'slash' ? 18 : 0));
    attach(g, first, 'C', x + 35, y - (kind === 'slash' ? 18 : 0), kind === 'double' ? 2 : kind === 'triple' ? 3 : 1);
    return g;
  }
  if (kind === 'benzene' || kind === 'cyclohexane') {
    // Connect a fresh ring to an existing node (no accidental overlapping/fused ring).
    const a = anchor && Math.atan2(y - anchor.y, x - anchor.x);
    const centerX = anchor && distance(x, y, anchor) < 105 ? anchor.x + 128 * Math.cos(a || -0.5) : x;
    const centerY = anchor && distance(x, y, anchor) < 105 ? anchor.y + 128 * Math.sin(a || -0.5) : y;
    const first = nextNode(g), edge0 = nextEdge(g);
    for (let i = 0; i < 6; i++) {
      const theta = i * Math.PI / 3 - Math.PI / 6;
      g.nodes.push({ id: first + i, element: 'C', x: bound(centerX + 47 * Math.cos(theta), 30, W - 30), y: bound(centerY + 47 * Math.sin(theta), 30, H - 30) });
      g.edges.push({ id: edge0 + i, a: first + i, b: first + (i + 1) % 6, order: kind === 'benzene' && i % 2 === 0 ? 2 : 1 });
    }
    if (anchor) {
      const nearestRing = g.nodes.filter(n => n.id >= first).sort((n1, n2) => distance(anchor.x, anchor.y, n1) - distance(anchor.x, anchor.y, n2))[0];
      g.edges.push({ id: nextEdge(g), a: anchor.id, b: nearestRing.id, order: 1 });
    }
    return g;
  }
  const implicit: Record<string, Element> = { OH: 'O', NH2: 'N', ethyl: 'C' };
  const element = implicit[kind] ?? (['C', 'N', 'O', 'S', 'F', 'Cl', 'Br'].includes(kind) ? kind : 'C');
  const isAtom = ['C', 'N', 'O', 'S', 'F', 'Cl', 'Br'].includes(kind);
  // Drop a specific atom token onto a node to change its element instead of adding a node.
  if (isAtom && closest && distance(x, y, closest) < 19) {
    g.nodes = g.nodes.map(n => n.id === closest.id ? { ...n, element: element as Element } : n);
    return g;
  }
  const order = kind === 'double' ? 2 : kind === 'triple' ? 3 : 1;
  const created = attach(g, anchor, element as Element, x, y, order);
  if (kind === 'ethyl' && g.nodes.length < 65) {
    attach(g, created, 'C', created.x + 56, created.y - 35);
  }
  return g;
}
function validateShape(g: Graph): string | null {
  if (!g.nodes.length) return 'No atoms in the assembly';
  if (g.nodes.length > 80 || g.edges.length > 160) return 'Molecule exceeds demo limits';
  return null;
}
function graphPayload(g: Graph) {
  const indices = new Map(g.nodes.map((n, i) => [n.id, i]));
  return {
    atoms: g.nodes.map(n => ({ element: n.element })),
    bonds: g.edges.map(b => ({ a: indices.get(b.a), b: indices.get(b.b), order: b.order })),
  };
}

export function VisualMolecularBuilderV61({ onResult }: { onResult: (result: BuilderResultV61) => void }) {
  const { language } = useLanguage();
  const en = language === 'en';
  const tx = (id: string, english: string) => en ? english : id;
  const [opened, setOpened] = useState(true);
  const [active, setActive] = useState<Piece>('slash');
  const [history, setHistory] = useState<History>({ past: [], present: initial(), future: [] });
  const [picked, setPicked] = useState<Pick>({ type: 'node', id: 2 });
  const [working, setWorking] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const svgRef = useRef<SVGSVGElement>(null);
  const rootRef = useRef<HTMLElement>(null);
  const gridId = useId().replace(/:/g, '');
  const full = useMoleculeFullscreen86('builder');
  const [camera, setCamera] = useState({ x: W / 2, y: H / 2, zoom: 2 });
  const [panMode, setPanMode] = useState(false);
  const [boardSize, setBoardSize] = useState({ w: W, h: H });
  const panRef = useRef<{ x: number; y: number; cameraX: number; cameraY: number; scale: number } | null>(null);
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const update = () => {
      const r = svg.getBoundingClientRect();
      if (r.width && r.height) setBoardSize({ w: r.width, h: r.height });
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(svg);
    return () => observer.disconnect();
  }, [full.expanded, opened]);
  const viewScale = Math.min(boardSize.w / W, boardSize.h / H) * camera.zoom;
  const spanX = boardSize.w / viewScale, spanY = boardSize.h / viewScale;
  const viewBox = full.expanded ? `${camera.x - spanX / 2} ${camera.y - spanY / 2} ${spanX} ${spanY}` : `0 0 ${W} ${H}`;
  const dragRef = useRef<{ id: number; start: Graph; moved: boolean } | null>(null);
  const revisionRef = useRef(0);
  const { nodes, edges } = history.present;
  const selectedAtom = picked?.type === 'node' ? picked.id : null;

  function commit(action: (old: Graph) => Graph) {
    revisionRef.current++;
    setHistory(h => {
      const newer = action(h.present);
      if (JSON.stringify(newer) === JSON.stringify(h.present)) return h;
      return { past: [...h.past.slice(-35), clone(h.present)], present: newer, future: [] };
    });
    setSuccess(''); setError('');
  }
  function point(clientX: number, clientY: number): [number, number] {
    const svg = svgRef.current;
    const matrix = svg?.getScreenCTM();
    if (!svg || !matrix) return [W / 2, H / 2];
    const p = svg.createSVGPoint();
    p.x = clientX; p.y = clientY;
    const local = p.matrixTransform(matrix.inverse());
    return [local.x, local.y];
  }
  function insert(kind: Piece, x: number, y: number) {
    commit(g => putPiece(g, kind, x, y, selectedAtom));
    setPicked(null);
  }
  function undo() {
    revisionRef.current++;
    setHistory(h => h.past.length ? { past: h.past.slice(0, -1), present: h.past[h.past.length - 1], future: [clone(h.present), ...h.future] } : h);
    setPicked(null); setError(''); setSuccess('');
  }
  function redo() {
    revisionRef.current++;
    setHistory(h => h.future.length ? { past: [...h.past, clone(h.present)], present: h.future[0], future: h.future.slice(1) } : h);
    setPicked(null); setError(''); setSuccess('');
  }
  function removeSelected() {
    if (!picked) return;
    commit(g => ({
      nodes: picked.type === 'node' ? g.nodes.filter(n => n.id !== picked.id) : g.nodes,
      edges: g.edges.filter(b => picked.type === 'edge' ? b.id !== picked.id : b.a !== picked.id && b.b !== picked.id),
    }));
    setPicked(null);
  }
  function cycleBond(id: number) {
    commit(g => ({ nodes: clone(g).nodes, edges: g.edges.map(b => b.id === id ? { ...b, order: (b.order === 3 ? 1 : b.order + 1) as 1 | 2 | 3 } : { ...b }) }));
    setPicked({ type: 'edge', id });
  }
  function down(event: ReactPointerEvent<SVGCircleElement>, id: number) {
    event.stopPropagation();
    dragRef.current = { id, start: clone(history.present), moved: false };
    setPicked({ type: 'node', id });
    event.currentTarget.setPointerCapture(event.pointerId);
  }
  function move(event: ReactPointerEvent<SVGCircleElement>) {
    if (!dragRef.current) return;
    const [x, y] = point(event.clientX, event.clientY);
    const id = dragRef.current.id;
    const before = dragRef.current.start.nodes.find(n => n.id === id);
    if (!before || Math.hypot(x - before.x, y - before.y) < 4 && !dragRef.current.moved) return;
    dragRef.current.moved = true;
    revisionRef.current++;
    setHistory(h => ({ ...h, present: {
      nodes: h.present.nodes.map(n => n.id === id ? { ...n, x: bound(x, 28, W - 28), y: bound(y, 28, H - 28) } : n),
      edges: h.present.edges,
    } }));
  }
  function up() {
    const dragging = dragRef.current;
    dragRef.current = null;
    if (dragging?.moved) {
      setHistory(h => ({ past: [...h.past.slice(-35), dragging.start], present: h.present, future: [] }));
      setError(''); setSuccess('');
    }
  }
  async function analyze() {
    const problem = validateShape(history.present);
    if (problem) { setError(!history.present.nodes.length ? tx('Belum ada atom pada rangka', problem) : tx('Molekul melebihi batas builder', problem)); return; }
    setWorking(true); setError(''); setSuccess('');
    const submittedRevision = revisionRef.current;
    const abort = new AbortController();
    const timeout = window.setTimeout(() => abort.abort(), 22000);
    try {
      const response = await fetch(API, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assembly: graphPayload(history.present), include_3d: false }), signal: abort.signal,
      });
      const payload: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        const reason = payload && typeof payload === 'object' && 'detail' in payload ? String(payload.detail) : `HTTP ${response.status}`;
        throw new Error(reason);
      }
      if (!payload || typeof payload !== 'object' || !('canonical_smiles_rdkit' in payload) || !('svg_2d' in payload)) {
        throw new Error(tx('Respons API molekul tidak sesuai', 'Unexpected molecular API response'));
      }
      if (revisionRef.current !== submittedRevision) throw new Error(tx('Struktur berubah selama validasi. Jalankan lagi.', 'Structure changed during validation. Please validate again.'));
      const data = payload as BuilderResultV61;
      onResult(data);
      setSuccess(`${data.molecular_formula_rdkit} · ${data.canonical_smiles_rdkit}`);
      if (full.expanded) full.close();
      window.setTimeout(() => document.getElementById('v60-artboard')?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      window.clearTimeout(timeout); setWorking(false);
    }
  }
  const caption = tx('Tarik objek ke area kerja, atau pilih objek lalu klik. Ujung garis adalah karbon (C). Klik atom untuk memilih, tarik untuk menggeser; klik ikatan untuk mengubah orde.', 'Drag a piece onto the workspace or select a piece and click. Bond endpoints are carbon (C). Select or move an atom; click a bond to change its order.');
  const openFull = () => {
    setOpened(true);
    full.open();
  };
  const tools = <>
      <div className="v61-quick" aria-label={tx('Contoh molekul', 'Molecule examples')}>
        <span>{tx('Mulai cepat:', 'Quick start:')}</span>
        <button type="button" onClick={() => { commit(() => preset('ethanol')); setPicked(null); }}>{tx('Etanol','Ethanol')}</button>
        <button type="button" onClick={() => { commit(() => preset('benzene')); setPicked(null); }}>{tx('Benzena','Benzene')}</button>
        <button type="button" onClick={() => { commit(() => preset('acid')); setPicked(null); }}>{tx('Asam asetat','Acetic acid')}</button>
      </div>
      <div className="v61-layout">
        <aside className="v61-palette" aria-label={tx("Objek molekul yang dapat diseret", "Draggable molecular pieces")}>
          <strong>{tx('Objek kimia', 'Molecular pieces')}</strong>
          <p>{tx('Tarik atau pilih objek','Drag or select a piece')}</p>
          <div className="v61-piece-grid">{PALETTE.map(item => <button key={item.kind} type="button" draggable aria-pressed={active === item.kind}
            className={active === item.kind ? 'v61-active' : ''}
            onDragStart={(e: DragEvent<HTMLButtonElement>) => { setActive(item.kind); e.dataTransfer.setData('text/plain', item.kind); e.dataTransfer.effectAllowed = 'copy'; }}
            onClick={() => setActive(item.kind)} title={tx(item.id, item.en)}>
            <b>{item.symbol}</b><small>{tx(item.id, item.en)}</small>
          </button>)}</div>
        </aside>
        <div className="v61-board-wrap">
          <div className="v61-toolbar"><span><Atom size={16}/>{tx('Area perakitan', 'Assembly workspace')}</span>
            <div>
              <button type="button" onClick={undo} disabled={!history.past.length} aria-label={tx('Urungkan','Undo')} title={tx('Urungkan','Undo')}><Undo2 size={16}/></button>
              <button type="button" onClick={redo} disabled={!history.future.length} aria-label={tx('Ulangi','Redo')} title={tx('Ulangi','Redo')}><Redo2 size={16}/></button>
              <button type="button" onClick={removeSelected} disabled={!picked} aria-label={tx('Hapus objek terpilih','Delete selected')} title={tx('Hapus objek terpilih','Delete selected')}><Trash2 size={16}/></button>
              <button type="button" onClick={() => { commit(() => initial()); setPicked(null); }} aria-label={tx('Reset rangka','Reset skeleton')} title={tx('Reset rangka','Reset skeleton')}><RotateCcw size={16}/></button>
            </div></div>
          {full.expanded && <div className="molecule86-board-tools" role="group" aria-label={tx('Kontrol tampilan rangka', 'Graph view controls')}>
            <button type="button" onClick={() => setCamera(c => ({...c, zoom: bound(c.zoom * 1.25, .7, 4)}))} aria-label={tx('Perbesar rangka', 'Zoom graph in')}><ZoomIn size={19}/></button>
            <button type="button" onClick={() => setCamera(c => ({...c, zoom: bound(c.zoom / 1.25, .7, 4)}))} aria-label={tx('Perkecil rangka', 'Zoom graph out')}><ZoomOut size={19}/></button>
            <button type="button" aria-pressed={panMode} onClick={() => setPanMode(p => !p)} aria-label={tx('Geser tampilan', 'Pan view')}><Move size={19}/><span>{tx('Geser','Pan')}</span></button>
            <button type="button" onClick={() => setCamera({x: W / 2,y:H / 2,zoom:1})}>{tx('Muat semua','Fit all')}</button>
          </div>}
          <div className="v61-drop-zone" onDragOver={e => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; }} onDrop={e => { e.preventDefault(); const kind = e.dataTransfer.getData('text/plain') as Piece; if (PALETTE.some(p => p.kind === kind)) { const [x,y] = point(e.clientX,e.clientY); insert(kind,x,y); } }}>
            <svg ref={svgRef} viewBox={viewBox} role="img" aria-label={tx('Rangka molekul. Pilih atau seret objek untuk merakit.', 'Skeletal molecular graph. Select or drag pieces to assemble.')}
                data-pan={panMode && full.expanded ? 'true' : 'false'}
                onPointerDown={e => {
                  if (!full.expanded || !panMode) return;
                  panRef.current = { x:e.clientX,y:e.clientY,cameraX:camera.x,cameraY:camera.y,scale:viewScale };
                  e.currentTarget.setPointerCapture(e.pointerId);
                }}
                onPointerMove={e => {
                  const pan = panRef.current;
                  if (!pan) return;
                  setCamera(c => ({...c,x:bound(pan.cameraX-(e.clientX-pan.x)/pan.scale,0,W),y:bound(pan.cameraY-(e.clientY-pan.y)/pan.scale,0,H)}));
                }}
                onPointerUp={() => { panRef.current=null; }} onPointerCancel={() => { panRef.current=null; }}
                onClick={e => {
                  if (full.expanded && panMode) return;
                  const [x,y] = point(e.clientX,e.clientY); insert(active,x,y);
                }}>
              <defs><pattern id={gridId} width="24" height="24" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="1" fill="var(--m86-grid)"/></pattern></defs>
              <rect x="0" y="0" width={W} height={H} fill={`url(#${gridId})`}/>
              {edges.map(edge => {
                const a = nodes.find(n => n.id === edge.a), b = nodes.find(n => n.id === edge.b);
                if (!a || !b) return null;
                const dx = b.x-a.x, dy = b.y-a.y, len = Math.max(1, Math.hypot(dx,dy)), nx = -dy / len, ny = dx / len;
                const offsets = edge.order === 1 ? [0] : edge.order === 2 ? [-4.2,4.2] : [-6.7,0,6.7];
                return <g key={edge.id} className={picked?.type === 'edge' && picked.id === edge.id ? 'v61-picked-edge' : 'v61-edge'}>
                  {offsets.map(offset => <line key={offset} x1={a.x+nx*offset} y1={a.y+ny*offset} x2={b.x+nx*offset} y2={b.y+ny*offset} strokeWidth={full.expanded ? 3 : 2.65} vectorEffect={full.expanded ? "non-scaling-stroke" : undefined} stroke="currentColor" strokeLinecap="round" pointerEvents="none"/>)}
                  <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="transparent" strokeWidth={full.expanded ? 22 : 17} vectorEffect={full.expanded ? "non-scaling-stroke" : undefined} onClick={e => {if (full.expanded && panMode) return; e.stopPropagation(); cycleBond(edge.id);}}><title>{tx('Klik untuk ubah orde ikatan','Click to cycle bond order')}</title></line>
                </g>;
              })}
              {nodes.map(node => <g key={node.id}>
                {node.element !== 'C' && <circle cx={node.x} cy={node.y} r={18} fill="var(--m86-board)"/>}
                {node.element !== 'C' && <text x={node.x} y={node.y + 5} textAnchor="middle" fontWeight="800" fontSize={18} fill={colors[node.element]} pointerEvents="none">{node.element}</text>}
                {picked?.type === 'node' && picked.id === node.id && <circle cx={node.x} cy={node.y} r={21} fill="none" stroke="var(--m86-picked)" strokeWidth={2} strokeDasharray="4 3" pointerEvents="none"/>}
                <circle cx={node.x} cy={node.y} r={20} fill="transparent" className="v61-node-target"
                  onClick={e => { if (full.expanded && panMode) return; e.stopPropagation(); setPicked({type:'node',id:node.id}); }}
                  onPointerDown={e => { if (!(full.expanded && panMode)) down(e,node.id); }} onPointerMove={move} onPointerUp={up} onPointerCancel={up}>
                  <title>{node.element}: {tx('seret untuk memindahkan / pilih untuk menyambung','drag to move / select to attach')}</title>
                </circle>
              </g>)}
            </svg>
          </div>
          <p className="v61-guide">{full.expanded && panMode ? tx('Seret kanvas untuk menggeser. Nonaktifkan Geser untuk merakit.', 'Drag the canvas to pan. Turn off Pan to edit the graph.') : caption}</p>
          <div className="v61-submit"><span>{nodes.length} {tx('atom','atoms')} · {edges.length} {tx('ikatan','bonds')}</span>
            <button type="button" onClick={() => void analyze()} disabled={working || !nodes.length}>{working ? <LoaderCircle size={17} className="v61-spin"/> : <FlaskConical size={17}/>}{working ? tx('Memvalidasi…','Validating…') : tx('Validasi & kirim ke viewer','Validate & open in viewer')}</button>
          </div>
          {error && <p className="v61-error" role="alert"><AlertTriangle size={16}/>{error}</p>}
          {success && <p className="v61-success" role="status"><Check size={16}/>{tx('RDKit valid: ','RDKit validated: ')}{success}</p>}
        </div>
      </div>
      <p className="v61-caveat">{tx('Builder untuk molekul kecil dan senyawa sederhana. Ikatan stereokimia, reaksi kimia, muatan dan struktur kompleks tetap gunakan SMILES atau perangkat lunak khusus. Tidak ada prediksi keamanan, sintesis, atau kehalalan.', 'Builder for small, simple molecular structures. Use SMILES or specialist tools for stereochemistry, reactions, formal charges and complex molecules. No safety, synthesis or halal predictions.')}</p>
    </>;
  return <section ref={rootRef} className="v61-builder" aria-label={tx('Perakit molekul visual', 'Visual molecular assembly builder')}>
    <div className="v61-title">
      <div><span><Grip size={16}/> {tx('V8.6 · PERAKITAN MOLEKUL', 'V8.6 · MOLECULAR BUILDER')}</span>
        <h3>{tx('Rakit molekul tanpa mengetik SMILES.', 'Assemble molecules without typing SMILES.')}</h3>
        <p>{tx('Objek siap pakai → snap ke rangka karbon → validasi kimia RDKit.', 'Ready-made pieces → snap to carbon skeleton → RDKit chemistry validation.')}</p>
      </div>
      <div className="molecule86-launch-row">
        <button type="button" onClick={() => setOpened(o => !o)} aria-expanded={opened} className="v61-toggle molecule86-desktop-toggle">{opened ? tx('Sembunyikan','Collapse') : tx('Buka builder','Open builder')}</button>
        <button type="button" className="molecule86-launch" data-elk-molecule-open="builder" aria-haspopup="dialog" aria-expanded={full.expanded} onClick={openFull}><Maximize2 size={18}/>{tx('Buka perakit layar penuh','Open fullscreen builder')}</button>
      </div>
    </div>
    <p className="molecule86-mobile-summary">{nodes.length} {tx('atom','atoms')} · {edges.length} {tx('ikatan','bonds')} — {tx('Rakit di ruang kerja khusus dengan kontrol sentuh besar.', 'Build in a dedicated workspace with large touch controls.')}</p>
    {!full.expanded && opened && <div className="molecule86-inline-builder">{tools}</div>}
    {full.expanded && <MoleculeFullscreen86 kind="builder" title={tx('Perakit molekul','Molecular builder')} anchor={rootRef.current} onClose={full.close}>
      <section className="v61-builder molecule86-builder-content">{tools}</section>
    </MoleculeFullscreen86>}
  </section>;
}
