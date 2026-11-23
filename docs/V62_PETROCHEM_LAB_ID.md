# El-Kīmiyā V6.2 — Petrochemical Experiment Lab (educational prototype)

## The problem

Petroleum formulation and QC workflows may involve physical repetitions, time and sample consumption. A useful beginner tool can organize **hypotheses, synthetic what-if calculations and experimental logs before any real tests**. It cannot certify a product or replace experimentally validated process models.

## New experience

Open `https://el-kimiya.vercel.app/#molecules`, expand **Petrochemical Experiment Lab**, choose a *fictional* sample, and add virtual drops with +1/+5/+10. The app calculates a **simplified acid-number equivalent** model, visualizes a target window based only on one-drop resolution, compares recorded synthetic trials, exports JSON, and optionally calls Firebase AI Logic to explain the results and limitations. No server storage, account, private ChEMBL data, or new API is required.

**All earlier V6.0 / V6.1 functions are preserved**, including SMILES input, drag-and-drop molecular object builder (if installed), 2D SVG, 3D viewer, RDKit descriptors, ChEMBL samples, Firebase tutor and notebook. The new lab is a standalone client-side React component inserted above Molecular Studio; the same existing `#molecules` page is used.

## What the model computes

`AN [mg KOH/g] = max(0, (Vtotal − Vblank) [mL] × N [eq/L] × 56.1 / sample mass [g])`.

For a **fictional reference acid number**, the theoretical target titrant volume is calculated by algebraic inversion. The UI's *near / below / overshot* labels are **mathematical teaching categories for that fictional reference**, not real laboratory endpoints, pass/fail specifications, repeatability tolerances, or petroleum performance. The model's reported one-drop resolution and half-drop interval are **only quantization effects**; they omit instrument, operator, solvent, sample-matrix and endpoint-detection uncertainty. Fixed drop volume is an illustrative assumption and needs empirical calibration in actual work.

The simulation is **not ASTM D664 compliance**. ASTM D664-24 describes *potentiometric* acid-number testing for applicable petroleum products; its test method, scope, limitations and licensed procedures are not implemented here. Its standard explicitly warns that the acid number does not directly predict corrosiveness or real-world service behavior. [Official ASTM D664 page](https://store.astm.org/standards/d664).

For credible industrial-grade capabilities later, use **licensed method implementation, validated lab measurements, uncertainty and bias assessment, a defined applicability domain, benchmark comparisons, qualified review and data governance**. The public demo must never invent a success rate, money saved, corrosion prediction, toxicity result or validated “digital twin.”

## Hybrid AI

The explicit `Explain this experiment` button calls the **existing Firebase AI Logic Hybrid Inference SDK** with the user's chosen preference and displays the actual provider (`ON_DEVICE` or `IN_CLOUD`) only after SDK response. AI output is not taken as ground truth; a network/device/provider failure leaves deterministic calculations working. Verify App Check for your Vercel domain before submission; a `Firebase configured` badge alone does not prove successful inference.

## Install without deleting previous features

```powershell
cd 'D:\el kimiya'
$zip="$env:USERPROFILE\Downloads\ElKimiya_V62_Petrochemical_Experiment_Lab.zip"
$dir="$env:TEMP\elkimiya-v62-petrolab"
Expand-Archive -LiteralPath $zip -DestinationPath $dir -Force
python (Join-Path $dir 'install-v62-petrolab.py') --project 'D:\el kimiya'
node scripts/test-petrolab-v62.mjs
npm run release:build
```

Do **not** run `git add .` because `private/`, backup files and Android state are not release artifacts. Stage only:

```powershell
git add -- src/lib/petroExperimentV62.ts src/components/PetrochemicalExperimentLabV62.tsx src/petro-experiment-v62.css src/components/MolecularIntelligenceLab.tsx scripts/test-petrolab-v62.mjs docs/V62_PETROCHEM_LAB_ID.md
git diff --cached --check
git diff --cached --stat
git commit -m "feat(lab): add V6.2 synthetic petrochemical QC experiment sandbox"
git push origin main
```

Verify new Vercel deployment **Ready**, refresh `#molecules`, test +1/+5/+10, case switching, repeat log, JSON export, language switch and real Hybrid AI result. Confirm **existing** 2D/3D, SMILES, V6.1 builder and flashcards remain working. This sandbox has no server requirements and is not meant for industrial decisions.

## Competition priority

#BuildHybridAI requires demonstrated Firebase AI Logic hybrid inference. The novel lab workflow is valuable *only if the real on-device/cloud routes remain verifiably functional*. Prepare a <=3-minute English-language/subtitled video, functional web URL, open-source repository/license, relevant evidence and a transparent limitations section. Deadline: November 30 2026 at 14:00 PST = December 1 2026 05:00 WIB. [Official rules](https://firebasehybridaihackathon.devpost.com/rules).
