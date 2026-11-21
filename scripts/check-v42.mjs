import {readFileSync,existsSync} from 'node:fs';
const r=p=>readFileSync(p,'utf8');
const checks=[
 ['V4.2 backend component integrated', r('src/components/MolecularIntelligenceLab.tsx').includes('<MolecularBackendPanel/>')],
 ['Local-only backend bridge',r('src/lib/molecularBackend.ts').includes('backendAvailableHere')],
 ['ChEMBL database opened read-only',r('backend/app/repository.py').includes('mode=ro')],
 ['No arbitrary agent SQL or shell tools',!r('backend/app/agent.py').includes('subprocess') && r('backend/app/agent.py').includes('Unknown tool (not allowlisted)')],
 ['Existing hybrid Firebase preserved',existsSync('src/lib/hybrid.ts')],
 ['Private data still ignored',r('.gitignore').includes('private/')],
 ['Backend venv ignored',r('.gitignore').includes('backend/.venv/')],
 ['No backend key in Vite client',!r('src/lib/molecularBackend.ts').includes('GEMINI_API_KEY')],
 ['Backend CORS explicitly restricted',r('backend/app/main.py').includes('http://localhost:5173')],
];
let fails=0;
for(const [label,ok] of checks){console.log(`${ok?'[PASS]':'[FAIL]'} ${label}`);if(!ok)fails++}
if(fails)process.exit(1);
console.log('EL-KIMIYA V4.2 INTEGRATION CHECKS PASS');
