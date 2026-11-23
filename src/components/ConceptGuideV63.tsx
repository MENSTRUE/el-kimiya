import { useMemo, useState } from 'react';
import { Atom, BookOpen, ChevronDown, FlaskConical, Layers3, Lightbulb, Search, Sparkles } from 'lucide-react';
import { useLanguage } from '../lib/language';
import '../experience-v63.css';

type Bi = { id: string; en: string };
const bi = (id: string, en: string): Bi => ({ id, en });
type Concept = { term: string; category: Bi; meaning: Bi; example: Bi };
const concepts: Concept[] = [
  { term:'pH', category:bi('Asam & basa','Acids & bases'), meaning:bi('Ukuran logaritmik yang berkaitan dengan aktivitas ion hidrogen dalam larutan.','A logarithmic measure related to hydrogen-ion activity in a solution.'),example:bi('Air murni pada 25 °C bersifat netral dengan pH sekitar 7.','Pure water is neutral at 25 °C with pH about 7.') },
  { term:'Asam Brønsted / Brønsted acid', category:bi('Asam & basa','Acids & bases'),meaning:bi('Zat yang menyumbangkan proton (H⁺) kepada zat lain.','A proton (H⁺) donor to another substance.'),example:bi('HCl dapat menyumbangkan proton kepada air dalam larutan.','HCl can donate a proton to water in solution.') },
  { term:'Basa Brønsted / Brønsted base', category:bi('Asam & basa','Acids & bases'),meaning:bi('Zat yang menerima proton (H⁺) dari zat lain.','A proton (H⁺) acceptor from another substance.'),example:bi('NH₃ menerima proton membentuk NH₄⁺.','NH₃ accepts a proton to form NH₄⁺.') },
  { term:'Mol / Mole', category:bi('Jumlah zat','Amount of substance'),meaning:bi('Satuan SI jumlah zat. Satu mol mengandung tepat 6,02214076 × 10²³ entitas elementer.','The SI unit of amount of substance. One mole contains exactly 6.02214076 × 10²³ elementary entities.'),example:bi('Massa 1 mol H₂O sekitar 18,015 g.','The mass of 1 mol H₂O is about 18.015 g.') },
  { term:'Molaritas / Molarity',category:bi('Larutan','Solutions'),meaning:bi('Jumlah mol zat terlarut per liter larutan (mol/L).','Moles of solute per liter of solution (mol/L).'),example:bi('0,5 mol dalam 1 L larutan → 0,5 M.','0.5 mol in 1 L of solution → 0.5 M.') },
  { term:'Ikatan kovalen / Covalent bond',category:bi('Ikatan kimia','Chemical bonding'), meaning:bi('Ikatan melalui pemakaian bersama pasangan elektron oleh atom.','A bond involving the sharing of electron pairs between atoms.'),example:bi('Ikatan O–H pada air bersifat kovalen polar.','The O–H bond in water is polar covalent.') },
  { term:'Ikatan ionik / Ionic bonding',category:bi('Ikatan kimia','Chemical bonding'), meaning:bi('Tarikan elektrostatik antara ion bermuatan berlawanan.','Electrostatic attraction between oppositely charged ions.'),example:bi('Kristal NaCl terdiri dari kisi ion Na⁺ dan Cl⁻.','NaCl crystals contain a lattice of Na⁺ and Cl⁻ ions.') },
  { term:'Stoikiometri / Stoichiometry',category:bi('Reaksi kimia','Reactions'),meaning:bi('Hubungan kuantitatif antara pereaksi dan produk berdasarkan persamaan setara.','Quantitative relationships between reactants and products in a balanced equation.'),example:bi('2 mol H₂ bereaksi dengan 1 mol O₂ pada persamaan pembentukan air.','2 mol H₂ react with 1 mol O₂ in the water-formation equation.') },
  { term:'Rendemen / Yield',category:bi('Reaksi kimia','Reactions'),meaning:bi('Perbandingan hasil aktual terhadap hasil teoritis, sering dinyatakan dalam persen.','The ratio of actual to theoretical yield, often expressed as a percentage.'),example:bi('Hasil aktual 8 g dari teoritis 10 g → 80%.','Actual yield 8 g from a theoretical 10 g → 80%.') },
  { term:'SMILES',category:bi('Informatika kimia','Cheminformatics'), meaning:bi('Notasi teks yang merepresentasikan graf struktur molekul secara ringkas.','A compact textual notation representing a molecular structure graph.'),example:bi('CCO merepresentasikan struktur etanol.','CCO represents the structure of ethanol.') },
  { term:'LogP',category:bi('Sifat molekul','Molecular properties'), meaning:bi('Logaritma koefisien partisi oktanol–air pada kondisi definisi tertentu, berkaitan dengan lipofilisitas.','The logarithm of a defined octanol–water partition coefficient, related to lipophilicity.'),example:bi('LogP yang dihitung RDKit merupakan deskriptor komputasional, bukan pengukuran eksperimen.','RDKit calculated LogP is a computational descriptor, not an experimental measurement.') },
  { term:'TPSA',category:bi('Sifat molekul','Molecular properties'), meaning:bi('Perkiraan luas permukaan polar topologis berdasarkan fragmen struktur molekul.','A topological estimate of polar surface area based on molecular fragments.'),example:bi('TPSA sering dilaporkan dalam Å² pada studi deskriptor molekul.','TPSA is often reported in Å² in molecular descriptor studies.') },
  { term:'Bilangan asam / Acid number',category:bi('Petrokimia','Petrochemistry'), meaning:bi('Besaran yang dilaporkan sebagai massa ekuivalen KOH per massa sampel menurut definisi metode pengujian.','A quantity reported as KOH-equivalent mass per sample mass under a defined test method.'),example:bi('Model simulasi El-Kīmiyā bukan hasil uji ASTM atau penilaian mutu minyak nyata.','El-Kīmiyā’s simulation is not an ASTM test result or actual oil-quality assessment.') },
];
export function ConceptGuideV63() {
  const { language } = useLanguage();
  const en = language === 'en';
  const tx = (id: string, english: string) => en ? english : id;
  const localize = (value: Bi) => en ? value.en : value.id;
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState<string | null>('pH');
  const [expanded, setExpanded] = useState(false);
  const visible = useMemo(() => concepts.filter(c => (`${c.term} ${c.meaning.id} ${c.meaning.en}`).toLowerCase().includes(query.toLowerCase())), [query]);
  return <section className="v63-glossary" aria-label={tx('Peta konsep kimia', 'Chemistry concept guide')}>
    <header className="v63-glossary-hero">
      <div><span className="v63-kicker"><BookOpen size={16}/>{tx('KARTU HAFALAN · KAMUS KONSEP', 'FLASHCARDS · CONCEPT GLOSSARY')}</span>
        <h2>{tx('Kenali istilahnya. Pahami maknanya.', 'Know the term. Understand the idea.')}</h2>
        <p>{tx('pH, asam Brønsted, LogP, hingga bilangan asam bukan sekadar kata yang harus dihafal. Mulai dari definisi dan contoh, lalu lanjutkan ke 52 flashcard belajar di bawah.',
          'From pH and Brønsted acids to LogP and acid number: start with clear definitions and examples, then continue to the 52 study flashcards below.')}</p>
      </div><div className="v63-glossary-mark" aria-hidden="true"><Atom size={42}/><span>H₂O · NaCl · CO₂</span></div>
    </header>
    <div className="v63-glossary-bar"><span><Layers3 size={16}/>{concepts.length} {tx('konsep pilihan', 'featured concepts')}</span><label><Search size={16}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder={tx('Cari istilah...', 'Search a term...')}/></label><button type="button" onClick={()=>setExpanded(x=>!x)}>{expanded?tx('Ringkas', 'Collapse'):tx('Tampilkan semua', 'Expand all')}<ChevronDown size={14}/></button></div>
    <div className="v63-glossary-grid">{visible.map(item => {
      const show = expanded || open === item.term;
      return <article key={item.term} className={show?'is-open':''}><button type="button" aria-expanded={show} onClick={()=>{setExpanded(false);setOpen(v=>v===item.term?null:item.term);}}>
        <span className="v63-term-icon">{item.category.id==='Petrokimia'?<FlaskConical size={18}/>:<Sparkles size={18}/>}</span><span><small>{localize(item.category)}</small><strong>{item.term}</strong></span><ChevronDown size={17} className="v63-term-chevron"/>
      </button>{show&&<div className="v63-term-detail"><p>{localize(item.meaning)}</p><div><Lightbulb size={16}/><span><b>{tx('Contoh: ', 'Example: ')}</b>{localize(item.example)}</span></div></div>}</article>;
    })}</div>
    {!visible.length&&<p className="v63-no-concepts">{tx('Tidak ada istilah yang cocok.', 'No matching terms.')}</p>}
    <p className="v63-glossary-credit">{tx('Kamus pengantar · rujukan konsep', 'Introductory glossary · reference')}: <a href="https://openstax.org/details/books/chemistry-2e" target="_blank" rel="noreferrer">OpenStax Chemistry 2e</a>. {tx('Kartu hafalan versi lama tetap tersedia di bawah.', 'The existing flashcards remain available below.')}</p>
  </section>;
}
