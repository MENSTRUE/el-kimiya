# El-Kīmiyā — UI/UX Redesign Checklist

## Original audit

- Original components used very small type (including text at 6–10px) throughout desktop, landing and mobile views.
- The dashboard had no clear greeting hierarchy or prominent mobile learning actions.
- Original dark sidebar and numerous navy cards created too much visual density.
- The main molecule artwork showed an inconsistent depiction of CO₂ (only one C and O atom).
- Search field and support button lacked functional navigation.
- Brand assets were already approved and required preservation.

## Changes applied

- New type scale, readable interface labels, and distinct academic serif for editorial headings.
- One cohesive palette that harmonizes with the approved monochrome logo.
- New dashboard information architecture: welcome → main learning task → books → recommended lessons → supporting study tools.
- New scan and tutor shortcuts for touch and desktop.
- Clean H₂O molecule illustration with correct two-hydrogen bent geometry and approximately 104.5° bond angle.
- New responsive treatments for landing, sidebar, dashboard and cards.
- Basic real search-to-page behavior (not an external search service).
- Preserved existing study/demo routes, text selection, quiz state and mock hybrid scenarios.

## Testing before shipping to judges

1. `npm install`, `npm run dev`, `npm run build`.
2. Check at 360px, 390px, 768px, 1280px and 1440px.
3. Test all nav destinations, collapse, scan demo, flashcard flip, quiz responses, reader actions and hybrid scenarios.
4. Test both themes and keyboard focus.
5. Replace demo statistics and unverified textbook sources with tested content.
6. Integrate Firebase AI Logic runtime and App Check for hackathon compliance.
