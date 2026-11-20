import fs from 'node:fs';
const read=(p)=>fs.readFileSync(p,'utf8');
const main=read('src/main.tsx');
const app=read('src/App.tsx');
const dict=read('src/lib/language.tsx');
const faith=read('src/components/ChemistryFaithPage.tsx');
const library=read('src/components/BookResearchPanel.tsx');
const reader=read('src/components/PrivateReadingWorkspace.tsx');
const css=read('src/language-v38.css');
const checks=[
  ['LanguageProvider wraps App', main.includes('<LanguageProvider><App /></LanguageProvider>')],
  ['Language selector appears in app header and landing', (app.match(/<LanguageSwitch\s*\/>/g)||[]).length>=2],
  ['Language selector appears in full-screen reading studio',reader.includes('<LanguageSwitch />')],
  ['Settings uses same language state',app.includes("const {language:uiLanguage,setLanguage:setUiLanguage}=useLanguage()")],
  ['Saved locale and HTML lang',dict.includes("const STORAGE_KEY = 'elk.language'") && dict.includes('document.documentElement.lang=language')],
  ['Indonesian and English translations present',dict.includes('"Dashboard": "Dasbor"') && dict.includes('"Kimia & Keimanan": "Chemistry & Faith"')],
  ['Faith page translated without altering Arabic source',faith.includes('t(example.science)')&&faith.includes('{LUQMAN_20_ARABIC}')],
  ['Library and PDF reader integrated',library.includes('t(')&&reader.includes('t(')],
  ['Reading notes do not shadow translator',reader.includes('.map(([p,noteContent])=>') && !reader.includes('.map(([p,t])=><button')],
  ['Live tutor instructed to use chosen language',app.includes("Answer in ${language === 'id' ? 'Bahasa Indonesia' : 'English'}")],
  ['Language switch has focus styles',css.includes(':focus-visible')],
  ['Private directory ignored by Git',read('.gitignore').includes('private/')],
  ['No PDF exposed by bilingual UI',!main.includes('private/chemistry-books')&&!app.includes('/private/chemistry-books')],
];
let failures=0;
for(const [label,pass] of checks){ console.log(`${pass?'[PASS]':'[FAIL]'} ${label}`);if(!pass)failures++; }
if(failures)process.exit(1);
console.log('V3.8 STATIC CHECKS PASS (verify browser and npm build separately)');
