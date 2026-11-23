# El-Kīmiyā V6.1 — Visual Molecular Assembly (additive)

**Page**: `https://el-kimiya.vercel.app/#molecules`

## What this release adds

- A **Visual Molecular Builder** at the top of the Molecular Studio main workspace.
- Drag pieces from a palette to an SVG workspace; or click a piece then click its desired position on the workspace. Both input methods work on desktop; click selection is an alternative for touch/keyboard.
- Ready-made **diagonal/single/double/triple bonds, benzene, cyclohexane, two-carbon chain, –OH, –NH₂, C, N, O, S, F, Cl and Br**.
- Select and drag atoms to reposition the schematic; click bonds to cycle single → double → triple. Change an atom by dropping an element token directly on it. Undo/redo, selected-object deletion and reset are included.
- Carbon endpoints are implicit, consistent with a **skeletal formula**. Oxygen/nitrogen/heteroatoms are explicit.
- **Validate & open in viewer** sends the simple atom-and-bond graph to the **same Vercel RDKit `/api/chemistry` function**. RDKit sanitizes chemistry and computes canonical SMILES, descriptors, SVG 2D, and optional 3D using the existing viewer's button. An invalid valence/connection results in a real 422 validation error, not fabricated data.
- Quick presets for ethanol, benzene and acetic acid. UI text is bilingual ID/EN.
- Existing V6 ChEMBL collection, typed SMILES, 2D SVG/PNG export, 3D viewer, notebook, PubChem search, flashcards, and Firebase Hybrid AI remain in place.

## What is NOT covered

- Not a complete Ketcher-grade editor. There are **no reaction arrows, atom charges, multicomponent mixtures, isotopes or stereochemical wedge bonds** in the visual builder. Complex structures still require typed SMILES or specialist chemistry editors.
- Drag-and-drop is browser-native HTML DnD. Touch devices can use **click-to-select, tap-to-place**. No unrestricted drawing of arbitrary lines.
- The public ChEMBL collection remains 10 example compounds; the 2.89-million-compound private SQLite is not hosted.
- Properties are RDKit computations; **not experimental measurements, toxicity, halal status or synthesis feasibility**.
- New graph validation uses the same Vercel Python Function, subject to Hobby quotas and standard cold-start/processing times.

## Setup on Windows

1. Put `ElKimiya_V61_Visual_Molecular_Builder_FINAL.zip` in Downloads.
2. From PowerShell:

```powershell
cd 'D:\el kimiya'
$zip = "$env:USERPROFILE\Downloads\ElKimiya_V61_Visual_Molecular_Builder_FINAL.zip"
$dest = "$env:TEMP\elkimiya-v61-builder"
Expand-Archive -LiteralPath $zip -DestinationPath $dest -Force
python (Join-Path $dest 'install-v61-builder.py') --project 'D:\el kimiya'
python -m unittest discover -s tests -p 'test_vercel_chemistry_v61.py' -v
python -m unittest discover -s tests -p 'test_vercel_chemistry_v60.py' -v
npm run release:build
git status --short
```

3. Verify staged-only files and push:

```powershell
git add -- api/chemistry.py src/components/MolecularStudioV60.tsx src/components/VisualMolecularBuilderV61.tsx src/visual-molecular-builder-v61.css tests/test_vercel_chemistry_v61.py docs/V61_VISUAL_MOLECULAR_BUILDER_ID.md
git diff --cached --check
git diff --cached --stat
git commit -m "feat(studio): add V6.1 drag-and-drop molecular assembly"
git push origin main
```

4. On Vercel, check the new commit is **Ready** before testing the public API and UI. Verify `GET /api/chemistry` includes `visual_assembly_v61` in capabilities. Use the preset **Ethanol → Validate → 2D → 3D** and **Benzene → Validate**.

## QA and rollback

Installer saves a copy of overwritten files under `private/v61-builder-backups/<timestamp>` (gitignored). Only the listed files are staged; do not use `git add .` as private data and Android changes may exist locally.

Existing V6.0 public `POST /api/chemistry {"smiles":"CCO"}` contract is unchanged; the new `assembly` form is **alternative**, never mandatory. Backend limits 80 atoms and 160 bonds; the builder UI further caps edits to keep the interactive sketch small.

After QA, verify the **Firebase AI Logic IN_CLOUD and ON_DEVICE routes separately** on the production domain. The Visual Builder does not replace or prove hybrid inference.

### Hackathon submission essentials

Official Devpost deadline: **Nov 30, 2026 2:00 p.m. PST = Dec 1, 2026 05:00 WIB**. Demo video **max 3 minutes**, publicly hosted YouTube, in **English or English subtitles**. Public repo with an open-source LICENSE (existing Apache 2.0), public hosted app, English description and actual Firebase AI Logic runtime call are required. Reference: https://firebasehybridaihackathon.devpost.com/.
