# El-Kīmiyā — Studio Edition

A redesigned web and mobile-responsive UI prototype for **El-Kīmiyā**, an educational chemistry learning workspace. The existing Figma Make / React + Vite codebase has been preserved and refined: no backend, login service, cloud model, or real Firebase connection has been added.

## Design concept

**Chemistry meets scholarly editorial design.** The approved navy Arabic flask calligram is the single brand mark, paired with warm paper-like backgrounds, restrained science-blue surfaces, generous typography, and a real textbook-first interaction hierarchy. The existing product's educational demo flows are maintained.

### Redesigned

- Landing page: new editorial headline, accessible spacing, high-fidelity product showcase, and web/mobile narrative.
- Shell: light scholarly sidebar, updated brand usage, clearer active states, and compact top navigation.
- Dashboard: new editorial welcome area, quick actions, typography, section rhythm, cards, and a technically correct **H₂O** molecule illustration (replacing the former inconsistent C—O / CO₂ graphic).
- Web search: route-aware demo search for selected lessons and tools (type a term, click a result or press Enter).
- Mobile: distinct welcome hierarchy, quick actions, larger text, tighter card composition, bottom navigation and accessible scan action.
- Library, reader, tutor, practice, explorer, flashcards and hybrid pages: baseline readability and visual-consistency adjustments.
- Dark mode: compatibility styles included for the updated components.

### What is not implemented

All AI results, study statistics, camera captures, sample books and hybrid inference states in this prototype are **demonstrations**. In particular, there is no Firebase AI Logic SDK or App Check integration in the supplied original ZIP or this UI redesign. Do not claim this demo satisfies the hackathon's runtime requirements until genuine hybrid inference has been implemented and tested.

## Run locally (Windows PowerShell)

```powershell
cd "PATH\TO\el-kimiya-studio"
npm install
npm run dev
```

Open the localhost address printed by Vite (default can be `http://localhost:8443` because this export is configured for Figma Make). Run `npm run build` for the production build. Requires a compatible version of Node.js (Vite 8 generally requires a current Node.js 20.19+ or 22.12+).

## Where to edit

- `src/App.tsx` — existing routed screens, interactions and the new welcome / molecule components.
- `src/index.css` — original design system and component layouts, retained intact for compatibility.
- `src/editorial.css` — **all Studio Edition visual changes**; remove its import to return to the original appearance.
- `src/main.tsx` — imports `editorial.css` after the original stylesheet.
- `src/components/BrandMark.tsx` — references the approved SVGs.
- `public/brand/` — previously approved official logo, app icons and favicons.

## Integration with Figma Make

Import the revised source files or open the whole repository in a React/Vite-compatible environment. **Do not ask Figma to recreate the logo.** Use the existing SVG files under `public/brand/`. If applying the updates to an already-running Figma Make project, preserve its `.figma` configuration and replace `App.tsx`, `main.tsx`, and add `editorial.css`.

## Validation carried out

- Original ZIP contents inspected.
- JSX/TSX **syntax** checked using the local TypeScript transpiler.
- Both CSS files parsed with no top-level syntax errors.
- ZIP integrity checked after packaging.

**Limitations:** An actual `npm install`, Vite build, automated browser render and interactive QA were not completed in the sandbox due to unavailable dependency registry/network/browser setup. Run the project locally to complete runtime and responsive checks. This does not guarantee a successful production build.

## Source integrity

The user-approved El-Kīmiyā calligram remains as provided in the uploaded project. This redesign does not modify SVG paths, recolor its geometry, or create a replacement mark.
