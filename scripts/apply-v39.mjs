import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
const root = process.argv[2];
if (!root) throw new Error('Usage: node apply-v39.mjs <project-dir>');
function patch(path, edits) {
 const target=join(root,path);
 let data=readFileSync(target,'utf8');
 for(const [oldText, newText, purpose] of edits) {
   const count = data.split(oldText).length - 1;
   if (count!==1) throw new Error(`[V3.9] ${path}: ${purpose}: expected one anchor, found ${count}. No more files will be modified; installer will restore backup.`);
   data=data.replace(oldText,newText);
 }
 writeFileSync(target,data,'utf8');
 console.log(`[PATCHED] ${path}`);
}
patch('src/App.tsx',[
 ['import { ChemistryFaithPage } from "./components/ChemistryFaithPage";', 'import { ChemistryFaithPage } from "./components/ChemistryFaithPage";\nimport { MolecularIntelligenceLab } from "./components/MolecularIntelligenceLab";', 'import Molecular Lab'],
 ['  | "explorer"\n','  | "explorer"\n  | "molecules"\n','Page route type'],
 ['  { id: "explorer", label: "Chemistry Explorer", icon: Atom },','  { id: "explorer", label: "Chemistry Explorer", icon: Atom },\n  { id: "molecules", label: "Molecular Intelligence Lab", icon: FlaskConical },','Sidebar navigation'],
 ['    explorer: "Chemistry explorer",','    explorer: "Chemistry explorer",\n    molecules: "Molecular Intelligence Lab",','Header page title'],
 ['    {label:"Molecular explorer",meta:"Chemistry explorer",to:"explorer"},','    {label:"Molecular explorer",meta:"Chemistry explorer",to:"explorer"},\n    {label:"Molecular Intelligence Lab",meta:"PubChem and Firebase AI",to:"molecules"},','Header search'],
 ["'explorer','flashcards'","'explorer','molecules','flashcards'",'Hash whitelist'],
 ["    if(page==='explorer')return <ExplorerPage setPage={setPage} addNote={addNote} askAbout={askAbout}/>;","    if(page==='explorer')return <ExplorerPage setPage={setPage} addNote={addNote} askAbout={askAbout}/>;\n    if(page==='molecules')return <MolecularIntelligenceLab/>;",'Page renderer'],
]);
patch('src/lib/language.tsx',[
 ['  "Chemistry Explorer": "Eksplorasi Kimia",','  "Chemistry Explorer": "Eksplorasi Kimia",\n  "Molecular Intelligence Lab": "Laboratorium AI Molekul",','Bilingual sidebar and header'],
]);
console.log('[PASS] El-Kimiya V3.9 route and bilingual integration complete');
