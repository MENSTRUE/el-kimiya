import fs from 'node:fs';
const r=(f)=>fs.readFileSync(f,'utf8');
const app=r('src/App.tsx');
const css=r('src/mobile-polish-v69.css');
const scan=r('src/components/ScanStudioV69.tsx');
const main=r('android/app/src/main/java/com/menstrue/elkimiya/MainActivity.kt');
const manifest=r('android/app/src/main/AndroidManifest.xml');
const sw=r('public/sw.js');
const tests=[
 ['React ScanStudio imported', app.includes('import { ScanStudioV69 }')],
 ['Scan route is React V6.9 UI',app.includes('return <ScanStudioV69 ')],
 ['Scan has manual transcription disclaimer',scan.includes('OCR is not enabled')],
 ['Scan saves local note and flashcard',scan.includes('addNote(')&&scan.includes('addCard(')],
 ['Scan camera and gallery available',scan.includes('capture="environment"')&&scan.includes('Choose from gallery')],
 ['Android camera FileProvider wired',main.includes('ELKIMIYA_V69_CAMERA_CAPTURE')&&main.includes('MediaStore.ACTION_IMAGE_CAPTURE')],
 ['Android Manifest FileProvider secure',manifest.includes('android:exported="false"')&&manifest.includes('elkimiya_capture_paths')],
 ['EntryFlow dark contrast exists',css.includes('.app.dark .entry67-choices button')],
 ['Mission dark contrast exists',css.includes('.app.dark .mission67-body')],
 ['Scan responsive styles exist',css.includes('.scan69-preview-placeholder')],
 ['No fake OCR network',!scan.includes('tesseract')&&!scan.includes('fetch(')],
 ['PWA shell cache version bumped',sw.includes('el-kimiya-app-shell-v3')],
];
for(const [name,ok] of tests) console.log(`[${ok?'PASS':'FAIL'}] ${name}`);
if(tests.some(([,ok])=>!ok))process.exit(1);
console.log(`[PASS] ${tests.length}/${tests.length} V6.9 source checks. Next npm build + deploy + device QA.`)
