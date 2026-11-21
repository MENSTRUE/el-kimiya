# El-Kīmiyā V4.0: compound data foundation

Goal: collect real **chemical property records**, not scrape PubChem's HTML and not generate imagined molecules. This stage is a **private data pipeline**. It does not alter any existing V3.9 UI, Firebase configuration, or AI model. No `datasets/` folder is added.

## Usage (PowerShell, from D:\el kimiya)

```powershell
py -3 -m unittest discover -s scripts -p test_collect_pubchem.py -v
py -3 scripts\collect_pubchem.py --limit 20
py -3 scripts\collect_pubchem.py --limit 0
```

Run `--limit 0` **after** checking the first 20, to complete all seeds. Already fetched names are cached in `lookup_state.json`; `--retry-errors` repeats only failed names. The script defaults to 1 request per second and does not require installing Python packages.

## Private outputs

- `private/compound_data/pubchem_compounds.csv` — spreadsheet-friendly data table.
- `private/compound_data/pubchem_compounds.json` — data records ready for a later local backend or search index.
- `private/compound_data/lookup_state.json` — resume ledger, errors and original queries.
- `private/compound_data/manifest.json` — provenance, counts, deduplication and failures.

The script does **not** upload to Firebase or GitHub. `private/` must remain gitignored. The optional *public* website feature must not assume that files on a developer's Windows disk are available to other visitors.

## Source / provenance

Data originate from the [PubChem PUG REST API](https://pubchem.ncbi.nlm.nih.gov/docs/pug-rest) by request over the public Internet. Queries include CID, MolecularFormula, MolecularWeight, ConnectivitySMILES, SMILES, IUPACName, InChIKey, XLogP, TPSA, HBondDonorCount, HBondAcceptorCount, RotatableBondCount and Charge. Fields may be missing; null values are retained. Each record has source URL, CID link and fetched time.

PubChem usage policy: [Programmatic access](https://pubchem.ncbi.nlm.nih.gov/docs/programmatic-access) asks clients not to exceed five requests/second. This script defaults to one request/second, uses bounded retries on 429/5xx, and pauses on server throttling. For millions of records, use [bulk download](https://pubchem.ncbi.nlm.nih.gov/docs/downloads) rather than sending millions of PUG REST requests.

## Quality / limitations

1. **Names can be ambiguous.** For each name, PUG REST resolves a CID. Audit that CID against what the name was meant to denote, especially salts, tautomers, stereoisomers and formulations.
2. Different names may return the same CID. The exported dataset deduplicates by CID and records duplicates in its manifest.
3. Missing properties are null; no guessed fields.
4. Descriptor values are not experimental confirmations of biological activity, efficacy, purity, or safety.
5. `ConnectivitySMILES` is a graph string; `SMILES` may contain stereochemical markers. Do not treat them as fully equivalent.
6. No claim is made that 20 educational names form a representative training corpus or can train a molecular discovery model.
7. Source chemistry and Islamic reflections should be separate evidence layers.

## Next milestone

- Audit first 20 names with CID URLs and failure report.
- Optional RDKit sanitization and standardization in an isolated environment.
- Connect the **curated** data to the existing El-Kīmiyā Molecular Intelligence Lab, initially in read-only mode.
- Only then design retrieval + grounded AI with citations and explicit inference source.
