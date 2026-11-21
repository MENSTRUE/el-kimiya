/** V4.2 integration into existing V3.9 molecule panel. Idempotent, exact anchors. */
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {join} from 'node:path';
const root=process.argv[2];
if(!root) throw new Error('Usage: node scripts/apply-v42.mjs <project-root>');
const target=join(root,'src','components','MolecularIntelligenceLab.tsx');
if(!existsSync(target)) throw new Error('V3.9 MolecularIntelligenceLab.tsx missing. Install V3.9 first.');
let text=readFileSync(target,'utf8');
const prefix="import { useLanguage } from '../lib/language';";
const entry='    <section className="mi39-card">';
if(!text.includes('MolecularBackendPanel')) {
  for(const [name,anchor] of [['language import',prefix],['first compound section',entry]]){
    if(text.split(anchor).length!==2)throw new Error(`V4.2 integration anchor '${name}' missing or repeated: aborting without overwriting source`);
  }
  text=text.replace(prefix,prefix+"\nimport { MolecularBackendPanel } from './MolecularBackendPanel';");
  text=text.replace(entry,'    <MolecularBackendPanel/>\n'+entry);
  writeFileSync(target,text,'utf8');
  console.log('[PATCHED] V3.9 Molecular Intelligence Lab -> V4.2 backend panel');
} else {
  if(!text.includes('<MolecularBackendPanel/>'))throw new Error('Partial V4.2 integration detected');
  console.log('[SKIP] V4.2 integration already present');
}
