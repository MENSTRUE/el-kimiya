# El-Kīmiyā V3.9 Molecular Intelligence Lab

## What is real and verified
- Users explicitly search **one or two compounds** by common name using the **NIH PubChem PUG REST** public API. The app shows CID, molecular formula, molecular weight, IUPAC name, XLogP, H-bond donor/acceptor counts, TPSA, and PubChem 2D structure image. Fields may be absent or estimated; they are not validated by this app.
- Users optionally request an educational explanation, comparison, or quiz via **Firebase AI Logic**, using the existing Firebase App Check pipeline and inference preferences. The UI displays the inference source **reported by Firebase** (`ON_DEVICE` or `IN_CLOUD`), not a simulated claim.
- The source records are linked to `https://pubchem.ncbi.nlm.nih.gov/compound/{CID}`.
- The app does **not** claim molecular generation, synthesis validation, toxicology prediction, scientific discovery, or an autonomous agent. It is a learning tool.

## Relation to source repository
The GitHub link `https://github.com/MENSTRUE/novel-chemiscal` returned 404 during development, so **no source code was copied from that repository**. This feature was developed independently, motivated by the idea of chemistry data + AI explanations. Genuine reuse requires read access and review of license, dependencies, model artifacts, credentials, and backend routes.

## How to test
1. Run `npm run verify` after installing the patch; installation automatically does this and rolls back on failure.
2. Run `npm run dev -- --port 5173` and open `http://localhost:5173/#molecules`.
3. Search `aspirin` and `caffeine`; inspect CID and PubChem links. Compare with `water` and `ethanol`.
4. Choose `Cloud only` (known to have worked on this user's setup, still requires App Check), run AI and check `Verified inference source: IN_CLOUD` when returned by the SDK. Test On-device only separately; it may not be supported.
5. Toggle ID/EN from the header and verify that the panel re-renders without modifying PubChem evidence.
6. Check browser console for CORS, quota, and App Check issues. If PubChem blocks a browser request, the UI reports an error rather than inventing data.

## Security & privacy
- No API tokens, local PDFs, or `private/` records are copied into the module.
- PubChem query terms are sent to NIH PubChem only after a search click. Data from NIH PubChem is also passed as context to Firebase AI **only when the user runs AI**.
- This is a browser client integration; do not claim server-side PubChem verification or scientific validity of LLM explanations.
- PubChem asks clients to limit request rate (no more than 5 requests per second). This component only sends at most two descriptor queries per user action, no polling.
- Existing deployment security preflight and `.gitignore` protections remain intact.

## Source
- https://pubchem.ncbi.nlm.nih.gov/docs/pug-rest
