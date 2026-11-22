import { useMemo, useState, type ChangeEvent } from 'react';
import {
  ArrowRight, Atom, BookOpen, BookmarkPlus, CheckCircle2,
  CircleHelp, Database, FlaskConical, GitCompareArrows,
  Layers3, RotateCcw, Search, Sparkles, Target, X,
} from 'lucide-react';
import { useLanguage } from '../lib/language';
import { ELEMENTS, type ChemicalElement, type ElementCategory } from '../data/elements-v45';
import '../study-v45.css';

type Props = {
  onSave: (title: string, content: string, source: string) => void;
  onAsk: (prompt: string) => void;
  onOpenMolecules: () => void;
};
const CATEGORY: Record<ElementCategory, { id: string; en: string }> = {
  alkali: { id: 'Logam alkali', en: 'Alkali metal' },
  'alkaline-earth': { id: 'Alkali tanah', en: 'Alkaline earth' },
  transition: { id: 'Logam transisi', en: 'Transition metal' },
  'post-transition': { id: 'Logam pascatransisi', en: 'Post-transition metal' },
  metalloid: { id: 'Metaloid', en: 'Metalloid' },
  nonmetal: { id: 'Nonlogam', en: 'Nonmetal' },
  halogen: { id: 'Halogen', en: 'Halogen' },
  noble: { id: 'Gas mulia', en: 'Noble gas' },
  lanthanide: { id: 'Lantanida', en: 'Lanthanide' },
  actinide: { id: 'Aktinida', en: 'Actinide' },
};
const COMPOUNDS = [
  { id: 'water', nameId: 'Air', nameEn: 'Water', formula: 'H₂O', elements: [1, 8], bondId: 'Kovalen polar', bondEn: 'Polar covalent', factId: 'Bentuk bengkok; molekul secara keseluruhan bersifat polar.', factEn: 'Bent geometry; the overall molecule is polar.' },
  { id: 'carbon', nameId: 'Karbon dioksida', nameEn: 'Carbon dioxide', formula: 'CO₂', elements: [6, 8], bondId: 'Kovalen', bondEn: 'Covalent', factId: 'Molekul linear; dipol ikatan simetris saling meniadakan.', factEn: 'Linear molecule; symmetric bond dipoles cancel.' },
  { id: 'salt', nameId: 'Natrium klorida', nameEn: 'Sodium chloride', formula: 'NaCl', elements: [11, 17], bondId: 'Kisi ionik', bondEn: 'Ionic lattice', factId: 'Padatan memiliki kisi ionik, bukan molekul NaCl diskret.', factEn: 'Solid forms an ionic lattice rather than discrete NaCl molecules.' },
  { id: 'methane', nameId: 'Metana', nameEn: 'Methane', formula: 'CH₄', elements: [6, 1], bondId: 'Kovalen', bondEn: 'Covalent', factId: 'Atom karbon pusat memiliki geometri tetrahedral.', factEn: 'Central carbon atom has tetrahedral geometry.' },
  { id: 'ammonia', nameId: 'Amonia', nameEn: 'Ammonia', formula: 'NH₃', elements: [7, 1], bondId: 'Kovalen polar', bondEn: 'Polar covalent', factId: 'Geometri piramida trigonal akibat pasangan elektron bebas pada nitrogen.', factEn: 'Trigonal pyramidal geometry due to nitrogen’s lone pair.' },
  { id: 'oxygen', nameId: 'Oksigen', nameEn: 'Oxygen', formula: 'O₂', elements: [8], bondId: 'Kovalen nonpolar', bondEn: 'Nonpolar covalent', factId: 'Molekul diatomik dengan ikatan rangkap O=O.', factEn: 'Diatomic molecule with an O=O double bond.' },
] as const;
const MISSIONS = [
  { number: 11, options: [11, 12, 19] },
  { number: 8, options: [8, 6, 7] },
  { number: 26, options: [25, 26, 27] },
  { number: 17, options: [9, 17, 16] },
  { number: 79, options: [47, 78, 79] },
];
const firstTwentyShells: number[][] = [
  [1], [2], [2, 1], [2, 2], [2, 3], [2, 4], [2, 5], [2, 6], [2, 7], [2, 8],
  [2, 8, 1], [2, 8, 2], [2, 8, 3], [2, 8, 4], [2, 8, 5], [2, 8, 6], [2, 8, 7], [2, 8, 8], [2, 8, 8, 1], [2, 8, 8, 2],
];
const categoryLabel = (c: ElementCategory, en: boolean) => CATEGORY[c][en ? 'en' : 'id'];

export function ChemistryExplorerV45({ onSave, onAsk, onOpenMolecules }: Props) {
  const { language } = useLanguage();
  const en = language === 'en';
  const tx = (id: string, english: string) => en ? english : id;
  const [view, setView] = useState<'table' | 'compound' | 'challenge'>('table');
  const [element, setElement] = useState(8);
  const [compare, setCompare] = useState<number | null>(null);
  const [pickComparison, setPickComparison] = useState(false);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<ElementCategory | 'all'>('all');
  const [compound, setCompound] = useState('water');
  const [missionIndex, setMissionIndex] = useState(0);
  const [missionAnswer, setMissionAnswer] = useState<number | null>(null);
  const [missionScore, setMissionScore] = useState(0);
  const selected = ELEMENTS[element - 1];
  const compared = compare === null ? null : ELEMENTS[compare - 1];
  const currentCompound = COMPOUNDS.find(c => c.id === compound) || COMPOUNDS[0];
  const remaining = MISSIONS[missionIndex];
  const missionTarget = remaining ? ELEMENTS[remaining.number - 1] : null;
  const showName = (e: ChemicalElement) => en ? e.nameEn : e.nameId;
  const tableMatches = useMemo(() => new Set(ELEMENTS.filter(e =>
    (category === 'all' || e.category === category) &&
    `${e.number} ${e.symbol} ${e.nameId} ${e.nameEn}`.toLowerCase().includes(query.trim().toLowerCase())
  ).map(e => e.number)), [category, query]);
  const choose = (n: number) => {
    if (pickComparison && n !== element) { setCompare(n); setPickComparison(false); return; }
    setElement(n);
    if (compare === n) setCompare(null);
  };
  const save = () => onSave(showName(selected), `${showName(selected)} (${selected.symbol}), Z=${selected.number}; ${tx('periode', 'period')} ${selected.period > 7 ? selected.period - 2 : selected.period}, ${tx('golongan', 'group')} ${selected.group}. ${categoryLabel(selected.category, en)}.`, 'El-Kīmiyā · local periodic explorer (RDKit reference values)');
  const saveCompound = () => onSave(en ? currentCompound.nameEn : currentCompound.nameId, `${currentCompound.formula} · ${en ? currentCompound.factEn : currentCompound.factId}`, 'El-Kīmiyā · educational compound catalog');
  return <main className="v45-root" aria-label={tx('Eksplorasi Kimia Internal', 'Built-in Chemistry Explorer')}>
    <section className="v45-hero v45-periodic-hero"><div className="v45-hero-main"><span className="v45-kicker"><Atom size={16}/>{tx('LAB KIMIA DIGITAL · TANPA REDIRECT', 'DIGITAL CHEMISTRY LAB · NO REDIRECT')}</span><h2>{tx('Tabel periodik hidup. Semua dalam satu aplikasi.', 'A living periodic table. All in one app.')}</h2><p>{tx('Jelajahi 118 unsur, bandingkan sifat, pelajari senyawa, dan mainkan tantangan identifikasi tanpa meninggalkan El-Kīmiyā.', 'Explore 118 elements, compare properties, study compounds, and play identification challenges without leaving El-Kīmiyā.')}</p></div><div className="v45-periodic-hero-art" aria-hidden="true"><b>118</b><span>{tx('unsur', 'elements')}</span><Atom size={42}/></div></section>
    <div className="v45-explorer-nav" role="tablist" aria-label={tx('Mode eksplorasi', 'Explorer mode')}>
      <button role="tab" aria-selected={view === 'table'} className={view === 'table' ? 'is-active' : ''} onClick={() => setView('table')}><Atom size={18}/>{tx('Tabel periodik', 'Periodic table')}</button>
      <button role="tab" aria-selected={view === 'compound'} className={view === 'compound' ? 'is-active' : ''} onClick={() => setView('compound')}><FlaskConical size={18}/>{tx('6 senyawa', '6 compounds')}</button>
      <button role="tab" aria-selected={view === 'challenge'} className={view === 'challenge' ? 'is-active' : ''} onClick={() => setView('challenge')}><Target size={18}/>{tx('Tantangan unsur', 'Element detective')}</button>
    </div>

    {view === 'table' && <div className="v45-table-layout"><section className="v45-surface v45-table-main">
      <div className="v45-section-head"><div><span className="v45-kicker">{tx('EKSPLORASI INTERAKTIF', 'INTERACTIVE EXPLORER')}</span><h3>{tx('118 unsur kimia', '118 chemical elements')}</h3><p>{tx('Klik suatu unsur untuk membaca detailnya. Pencarian tidak mengubah posisi tabel.', 'Select an element to inspect it. Search does not change its table position.')}</p></div><label className="v45-search"><Search size={17}/><input value={query} onChange={(e: ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)} placeholder={tx('Cari nama, simbol, Z...', 'Search name, symbol, Z...')}/>{query && <button onClick={() => setQuery('')} aria-label={tx('Hapus pencarian', 'Clear search')}><X size={14}/></button>}</label></div>
      <div className="v45-category-strip"><button className={category === 'all' ? 'is-active' : ''} onClick={() => setCategory('all')}>{tx('Semua', 'All')} · 118</button>{(Object.keys(CATEGORY) as ElementCategory[]).map(key => <button key={key} className={category === key ? 'is-active' : ''} onClick={() => setCategory(key)}><span className={`v45-legend-dot v45-cat-${key}`}/>{categoryLabel(key, en)}</button>)}</div>
      <div className="v45-table-scroll"><div className="v45-periodic-grid" role="group" aria-label={tx('Tabel periodik 118 unsur', '118-element periodic table')}>
        {Array.from({ length: 18 }, (_, i) => <span className="v45-column-label" key={`col-${i}`} style={{ gridColumn: i + 2, gridRow: 1 }}>{i + 1}</span>)}
        {Array.from({ length: 9 }, (_, i) => <span className="v45-row-label" key={`row-${i}`} style={{ gridColumn: 1, gridRow: i + 2 }}>{i < 7 ? i + 1 : i === 7 ? 'Ln' : 'An'}</span>)}
        {ELEMENTS.map(e => <button key={e.number} className={`v45-element v45-cat-${e.category} ${element === e.number ? 'is-selected' : ''} ${tableMatches.has(e.number) ? '' : 'is-dimmed'}`} style={{ gridColumn: e.group + 1, gridRow: e.period + 1 }} onClick={() => choose(e.number)} aria-label={`${e.number}. ${showName(e)} (${e.symbol})`} aria-pressed={element === e.number} title={`${e.number} · ${showName(e)}`}><small>{e.number}</small><strong>{e.symbol}</strong></button>)}
      </div></div>
      <div className="v45-periodic-note"><CircleHelp size={16}/><span>{tx('Lantanida dan aktinida ditampilkan di dua baris tersendiri. Massa atom adalah nilai pendekatan referensi RDKit; unsur radioaktif sintetis dapat memakai nomor massa representatif.', 'Lanthanides and actinides appear in separate rows. Mass values are approximate RDKit reference values; synthetic radioactive elements may use representative mass numbers.')}</span></div>
    </section><aside className="v45-surface v45-element-panel"><div className="v45-element-detail-top"><span className={`v45-selected-element v45-cat-${selected.category}`}><small>{selected.number}</small><strong>{selected.symbol}</strong></span><div><span className="v45-kicker">{tx('UNSUR TERPILIH', 'SELECTED ELEMENT')}</span><h3>{showName(selected)}</h3><p>{categoryLabel(selected.category, en)}</p></div></div>
      <div className="v45-element-facts"><div><span>{tx('Nomor atom', 'Atomic number')}</span><strong>{selected.number}</strong></div><div><span>{tx('Massa atom relatif ≈', 'Relative atomic mass ≈')}</span><strong>{selected.mass}</strong></div><div><span>{tx('Periode', 'Period')}</span><strong>{selected.period > 7 ? selected.period - 2 : selected.period}</strong></div><div><span>{tx('Golongan', 'Group')}</span><strong>{selected.group}</strong></div></div>
      {selected.number <= 20 && <div className="v45-shells"><span className="v45-kicker">{tx('SUSUNAN KULIT SEDERHANA', 'SIMPLIFIED ELECTRON SHELLS')}</span><div>{firstTwentyShells[selected.number - 1].map((count, i) => <span key={i}>{['K', 'L', 'M', 'N'][i]} <b>{count}e⁻</b></span>)}</div><small>{tx('Pendekatan kulit sederhana untuk unsur 1–20, bukan orbital 3D.', 'Simple shell model for elements 1–20, not 3D orbitals.')}</small></div>}
      <div className="v45-element-actions"><button className="v45-secondary" onClick={save}><BookmarkPlus size={16}/>{tx('Simpan', 'Save')}</button><button className="v45-primary" onClick={() => { setPickComparison(v => !v); setCompare(null); }}><GitCompareArrows size={16}/>{pickComparison ? tx('Pilih unsur lain →', 'Select another →') : tx('Bandingkan', 'Compare')}</button></div>
      {compared && <div className="v45-compare"><strong>{tx('Perbandingan', 'Comparison')}</strong><div><span>{showName(selected)} ({selected.symbol})</span><span>{showName(compared)} ({compared.symbol})</span></div><div><small>{tx('Nomor atom', 'Atomic number')} {selected.number} / {compared.number}</small><small>{tx('Golongan', 'Group')} {selected.group} / {compared.group}</small></div><button onClick={() => setCompare(null)}>{tx('Tutup perbandingan', 'Close comparison')} <X size={14}/></button></div>}
      <button className="v45-element-question" onClick={() => onAsk(tx(`Jelaskan sifat kimia dasar unsur ${selected.nameId} (${selected.symbol}) berdasarkan nomor atom ${selected.number} dan golongan ${selected.group}. Jelaskan keterbatasan data.`, `Explain basic chemical properties of ${selected.nameEn} (${selected.symbol}), atomic number ${selected.number}, group ${selected.group}. Explain limitations.`))}><Sparkles size={18}/>{tx('Diskusikan dengan tutor AI', 'Discuss with AI tutor')}<ArrowRight size={16}/></button>
    </aside></div>}

    {view === 'compound' && <section className="v45-compound-view"><div className="v45-section-head"><div><span className="v45-kicker">{tx('KATALOG INTERNAL', 'BUILT-IN LIBRARY')}</span><h3>{tx('6 senyawa dasar', '6 foundational compounds')}</h3><p>{tx('Pilih satu senyawa untuk melihat penyusunnya. Ini ilustrasi rumus, bukan model ikatan 3D.', 'Choose a compound to inspect constituent elements. This illustrates formulas, not 3D bonding.')}</p></div><button className="v45-secondary" onClick={onOpenMolecules}><Database size={16}/>{tx('Lab ChEMBL lanjutan', 'Advanced ChEMBL lab')}</button></div><div className="v45-compound-cards">{COMPOUNDS.map(c => <button key={c.id} className={compound === c.id ? 'is-selected' : ''} onClick={() => setCompound(c.id)}><span className="v45-formula">{c.formula}</span><strong>{en ? c.nameEn : c.nameId}</strong><small>{en ? c.bondEn : c.bondId}</small><span>{tx('Pelajari', 'Study')} <ArrowRight size={15}/></span></button>)}</div><div className="v45-surface v45-compound-detail"><div><span className="v45-kicker">{tx('DETAIL SENYAWA', 'COMPOUND DETAILS')}</span><h3>{en ? currentCompound.nameEn : currentCompound.nameId} · {currentCompound.formula}</h3><p>{en ? currentCompound.factEn : currentCompound.factId}</p><strong>{tx('Unsur penyusun', 'Constituent elements')}</strong><div className="v45-compound-elements">{currentCompound.elements.map(n => { const el = ELEMENTS[n - 1]; return <button key={n} onClick={() => { setElement(n); setView('table'); }}><b>{el.symbol}</b><span>{showName(el)}</span><ArrowRight size={14}/></button>; })}</div></div><div className="v45-compound-actions"><button className="v45-secondary" onClick={saveCompound}><BookmarkPlus size={16}/>{tx('Simpan catatan', 'Save note')}</button><button className="v45-primary" onClick={() => onAsk(tx(`Jelaskan ${currentCompound.nameId} (${currentCompound.formula}) dalam bahasa Indonesia, serta ikatannya. Bedakan penjelasan dan bukti eksperimental.`, `Explain ${currentCompound.nameEn} (${currentCompound.formula}), including bonding. Separate educational explanations from experimental evidence.`))}><Sparkles size={16}/>{tx('Tanya tutor AI', 'Ask AI tutor')}</button></div></div></section>}

    {view === 'challenge' && <section className="v45-surface v45-challenge"><span className="v45-kicker"><Target size={16}/>{tx('TANTANGAN INTERAKTIF', 'INTERACTIVE CHALLENGE')}</span><h3>{tx('Detektif Unsur', 'Element Detective')}</h3><p>{tx('Jawab 5 misi identifikasi. Semua penilaian lokal memakai data unsur di aplikasi, bukan respons AI palsu.', 'Solve 5 identification missions. Scores are local and use built-in element data, not simulated AI responses.')}</p><div className="v45-challenge-score"><span>{Math.min(missionIndex + 1, MISSIONS.length)}/{MISSIONS.length} {tx('misi', 'missions')}</span><strong>{missionScore} {tx('poin', 'points')}</strong></div>{missionTarget ? <><div className="v45-mission-prompt"><span>{tx('TEMUKAN UNSUR DENGAN NOMOR ATOM', 'FIND THE ELEMENT WITH ATOMIC NUMBER')}</span><strong>{missionTarget.number}</strong></div><div className="v45-mission-choices">{remaining.options.map(n => { const el = ELEMENTS[n - 1]; return <button key={n} disabled={missionAnswer !== null} className={`${missionAnswer === n ? 'is-selected' : ''} ${missionAnswer !== null && n === missionTarget.number ? 'is-correct' : ''}`} onClick={() => { setMissionAnswer(n); if (n === missionTarget.number) setMissionScore(s => s + 1); }}><strong>{el.symbol}</strong><span>{showName(el)}</span></button>; })}</div>{missionAnswer !== null && <div className="v45-mission-result"><CheckCircle2 size={20}/><div><strong>{missionAnswer === missionTarget.number ? tx('Tepat!', 'Correct!') : tx('Belum tepat.', 'Not quite.')}</strong><p>{tx('Jawaban:', 'Answer:')} {showName(missionTarget)} ({missionTarget.symbol}), {tx('golongan', 'group')} {missionTarget.group}.</p></div><button className="v45-primary" onClick={() => { setMissionIndex(i => i + 1); setMissionAnswer(null); }}>{tx('Misi berikutnya', 'Next mission')}<ArrowRight size={15}/></button></div>}</> : <div className="v45-mission-done"><CheckCircle2 size={32}/><h4>{tx('Misi selesai!', 'Mission complete!')}</h4><p>{missionScore}/5 {tx('jawaban benar', 'correct answers')}</p><button className="v45-primary" onClick={() => { setMissionIndex(0); setMissionAnswer(null); setMissionScore(0); }}><RotateCcw size={17}/>{tx('Main lagi', 'Play again')}</button></div>}</section>}
    <footer className="v45-footer"><span><BookOpen size={16}/>{tx('Tabel periodik & permainan berjalan di aplikasi; tidak perlu mengunjungi situs lain.', 'The table and challenges run in-app; no external site required.')}</span><details><summary>{tx('Catatan sumber data', 'Data provenance')}</summary><p>{tx('Nomor atom dan simbol disediakan sebagai data statis aplikasi. Nilai massa relatif adalah pendekatan dari tabel periodik RDKit 2025.09.4; perlu audit ahli terhadap IUPAC/CIAAW sebelum dirilis sebagai konten tersertifikasi.', 'Atomic numbers and symbols are included as static app data. Relative mass values approximate RDKit 2025.09.4 reference values; expert audit against IUPAC/CIAAW is needed before any certification claims.')}</p></details></footer>
  </main>;
}
