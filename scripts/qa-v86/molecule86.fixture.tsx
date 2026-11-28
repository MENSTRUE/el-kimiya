import React from 'react'
import { createRoot } from 'react-dom/client'
import { LanguageProvider, LanguageSwitch } from '../../src/lib/language'
import { MolecularStudioV60 } from '../../src/components/MolecularStudioV60'
import '../../src/index.css'
import '../../src/editorial.css'
import '../../src/interactive.css'
import '../../src/dark-contrast-v70.css'
import '../../src/v8/visual84.css'
import '../../src/v8/design85.css'
import '../../src/v8/theme86.css'
const dark = new URLSearchParams(location.search).get('dark') === 'true';
document.documentElement.dataset.elkTheme = dark ? 'dark' : 'light';
createRoot(document.getElementById('root')!).render(<LanguageProvider><div className={dark?'app dark':'app'}><div className="page-entrance"><LanguageSwitch/><MolecularStudioV60/></div></div></LanguageProvider>);
