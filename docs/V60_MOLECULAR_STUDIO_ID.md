# El-Kīmiyā V6 — Molecular Studio Core (public Web)

**Page:** `https://el-kimiya.vercel.app/#molecules` (after V6 is deployed).

## What works

- Selecting one of the 10 public ChEMBL samples automatically sends its SMILES to the Vercel RDKit Function and displays a genuine 2D skeletal depiction as SVG.
- Enter a custom SMILES and click **Gambar molekul / Draw molecule**. The descriptors and 2D SVG are derived from the same sanitized RDKit molecule.
- Download the 2D drawing as SVG or as a PNG generated from that SVG.
- Click the **3D** tab to request an approximate RDKit ETKDGv3 conformer. Rotate by dragging the HTML canvas, zoom in/out, reset view. This is a computed conformer, **not** X-ray/cryoEM/experimental geometry. Limit: 35 heavy atoms for 3D; 80 total parsed atoms for 2D.
- Add a research hypothesis in the notebook. Notes stay **only in the current browser's localStorage** per canonical SMILES. Do not rely on them for archival; browsers can clear local storage.
- ID/EN interface; explicit research ethics notice and outbound links to ChEMBL and PubChem.

## What this patch does NOT claim

- No freehand atom-and-bond drawing (Ketcher) in this core release. The SMILES text field is editable, and the 2D/3D viewing canvas is interactive; it is **not** a chemical diagram editor.
- No full local 2,897,819-compound database on Vercel. The 10 public sample entries are all that are bundled.
- No toxicity/halal/activity/synthesis verification based on descriptors.
- No additional Gemini usage; the existing Firebase AI Logic modules stay unchanged.
- 3D conformer generation is limited and may fail on complex molecular structures.

## Install on Windows

```powershell
cd 'D:\el kimiya'
$zip = "$env:USERPROFILE\Downloads\ElKimiya_V60_Molecular_Studio_PATCH.zip"
$dir = Join-Path $env:TEMP 'elkimiya-v60-studio'
Expand-Archive -LiteralPath $zip -DestinationPath $dir -Force
powershell.exe -NoProfile -ExecutionPolicy Bypass -File (Join-Path $dir 'install-v60-studio.ps1') -ProjectDir 'D:\el kimiya'
python -m unittest discover -s tests -p 'test_vercel_chemistry_v60.py' -v
npm run release:build
```

Optional local Vite preview: run `python -m uvicorn api.chemistry:app --host 127.0.0.1 --port 9000` in a separate shell alongside Vite. The public V6 component calls port 9000 only for localhost. The old private ChEMBL backend remains on 8000. Production uses same-origin `/api/chemistry`.

## Safe Git staging

```powershell
git add -- api/chemistry.py tests/test_vercel_chemistry_v60.py src/components/MolecularStudioV60.tsx src/components/MolecularIntelligenceLab.tsx src/molecular-studio-v60.css docs/V60_MOLECULAR_STUDIO_ID.md
git diff --cached --check
git diff --cached --stat
```

After verifying the diff and Python/Vite tests, commit/push to the existing `main` branch. Vercel builds from GitHub. Verify `/api/chemistry` GET reports `6.0.0`, test POST with `CCO`, then open `/#molecules` and test SVG/PNG and optional 3D on ethanol.

## Privacy/security/performance

The public function rejects excess SMILES lengths and atom/bond counts; there are no credentials or private databases in its deployed package. No notes leave the browser through this feature. Vercel Hobby quota/cold starts still apply. The core API generates 2D on explicit manual input submit or sample selection, not on every keystroke, to control function invocations. 3D generation only starts on explicit user request.
