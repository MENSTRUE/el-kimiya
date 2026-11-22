import { useState, type FormEvent } from 'react';
import { Calculator, FlaskConical, LoaderCircle, ShieldCheck } from 'lucide-react';
import { useLanguage } from '../lib/language';
import '../public-rdkit-v49.css';

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
  descriptor_source: string;
};

export function PublicRDKitV49() {
  const { language } = useLanguage();
  const en = language === 'en';
  const tx = (id: string, english: string) => en ? english : id;
  const [smiles, setSmiles] = useState('CCO');
  const [result, setResult] = useState<Descriptor | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const run = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy || !smiles.trim()) return;
    setBusy(true); setError(''); setResult(null);
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 18000);
    try {
      const resp = await fetch('/api/chemistry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ smiles: smiles.trim() }),
        signal: controller.signal,
      });
      const data: unknown = await resp.json().catch(() => null);
      if (!resp.ok) {
        const detail = data && typeof data === 'object' && 'detail' in data
          ? String(data.detail) : `HTTP ${resp.status}`;
        throw new Error(detail);
      }
      if (!data || typeof data !== 'object' || !('molecular_formula_rdkit' in data)) {
        throw new Error(tx('Respons API tidak sesuai.', 'Unexpected API response.'));
      }
      setResult(data as Descriptor);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      window.clearTimeout(timeout);
      setBusy(false);
    }
  };

  const metrics: [string, string | number][] = result ? [
    [tx('Rumus molekul', 'Molecular formula'), result.molecular_formula_rdkit],
    [tx('Massa molekul', 'Molecular weight'), `${result.molecular_weight_rdkit} g/mol`],
    ['LogP (RDKit)', result.logp_rdkit],
    ['TPSA', `${result.tpsa_rdkit} Å²`],
    [tx('Donor ikatan H', 'H-bond donors'), result.h_bond_donors_rdkit],
    [tx('Akseptor ikatan H', 'H-bond acceptors'), result.h_bond_acceptors_rdkit],
    [tx('Ikatan rotasi', 'Rotatable bonds'), result.rotatable_bonds_rdkit],
    [tx('Jumlah atom', 'Atom count'), result.atom_count_rdkit],
  ] : [];

  return <section className="v49-rdkit" aria-label="Live RDKit descriptor calculator">
    <div className="v49-rdkit-head">
      <div><span className="v49-rdkit-label"><FlaskConical size={16}/> {tx('KALKULATOR RDKIT · SERVERLESS NYATA','LIVE RDKIT · SERVERLESS CALCULATOR')}</span>
        <h2>{tx('Hitung sifat molekul langsung.', 'Calculate molecular properties live.')}</h2>
        <p>{tx('Masukkan SMILES untuk perhitungan RDKit Python pada Vercel Functions. Data tidak disimpan.', 'Enter SMILES for real Python RDKit calculations on Vercel Functions. Input is not stored.')}</p>
      </div>
      <span className="v49-rdkit-icon"><Calculator size={28}/></span>
    </div>
    <form onSubmit={(e) => void run(e)} className="v49-rdkit-form">
      <label htmlFor="v49-smiles">SMILES</label>
      <div><input id="v49-smiles" maxLength={256} autoComplete="off" spellCheck={false} value={smiles} onChange={e => setSmiles(e.target.value)} placeholder="CCO" aria-describedby="v49-note"/>
        <button type="submit" disabled={busy || !smiles.trim()}>{busy ? <LoaderCircle size={16} className="v49-spin"/> : <Calculator size={16}/>} {busy ? tx('Menghitung…','Computing…') : tx('Hitung RDKit','Calculate')}</button>
      </div>
      <p id="v49-note">{tx('Contoh: CCO (etanol), O (air), CC(=O)O (asam asetat). Maksimal 256 karakter, 80 atom.', 'Examples: CCO (ethanol), O (water), CC(=O)O (acetic acid). Max 256 characters, 80 atoms.')}</p>
    </form>
    {error && <p role="alert" className="v49-rdkit-error">{tx('API belum siap atau SMILES tidak valid: ', 'API unavailable or invalid SMILES: ')}{error}</p>}
    {result && <div role="status"><div className="v49-rdkit-metrics">{metrics.map(([key,value]) => <div key={key}><span>{key}</span><strong>{value}</strong></div>)}</div>
      <p className="v49-rdkit-canonical"><strong>Canonical SMILES:</strong> <code>{result.canonical_smiles_rdkit}</code></p>
      <p className="v49-rdkit-disclaimer"><ShieldCheck size={16}/> {tx('Hasil dihitung dari struktur input, bukan hasil eksperimen atau prediksi toksisitas, aktivitas biologis, dan kelayakan sintesis.', 'Computed structure descriptors, not experiments or toxicity, activity, or synthesis feasibility predictions.')}</p>
    </div>}
  </section>;
}
