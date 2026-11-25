import fs from 'node:fs';
const checks={
 'src/App.tsx':['ELKIMIYA_WEB_V80','setPage("about")','v8-settings','<AccountPanel','<ModulerPage','<PublishedContent kind="question"','policy?.guidance[language]'],
 'src/main.tsx':['<PlatformProvider><App /></PlatformProvider>',"import './v8/platform.css'"],
 'src/lib/hybrid.ts':['export function setupAppCheck()','getGenerativeModel','generateContent(prompt)','response.inferenceSource'],
 'src/v8/platform.tsx':['onAuthStateChanged','v8Roles',"where('status','==','published')"],
 'src/v8/Workspace.tsx':['createUserWithEmailAndPassword','signInWithPopup','setDoc','deleteDoc','readBackup','serverTimestamp'],
 'firestore-v8.rules':['allow list, create, update, delete: if false','moduler() && content','if own(uid)','request.query.limit <= 100'],
 'src/components/GuestLearningSpaceV71.tsx':['ELKIMIYA_V80_LOCAL_PROFILE'],
};
let failures=0;
for(const [file,markers] of Object.entries(checks)){const data=fs.existsSync(file)?fs.readFileSync(file,'utf8'):'';for(const marker of markers){const pass=data.includes(marker);console.log(`[${pass?'PASS':'FAIL'}] ${file}: ${marker}`);if(!pass)failures++;}}
const config=JSON.parse(fs.readFileSync('firebase.json','utf8'));if(config.firestore?.rules!=='firestore-v8.rules'){console.error('[FAIL] Firestore rules config');failures++;}
if(failures)process.exit(1);console.log('[PASS] V8 source gate only; no Firebase runtime claims.');
