import { readFileSync, existsSync } from 'node:fs';
const app = readFileSync('src/App.tsx','utf8');
const main = readFileSync('src/main.tsx','utf8');
const brand = readFileSync('src/components/BrandMark.tsx','utf8');
const profile = readFileSync('src/components/GuestLearningSpaceV71.tsx','utf8');
const css = readFileSync('src/profile-studio-v71.css','utf8');
const assertions = [
  ['Guest profile imported', app.includes('GuestLearningSpaceV71')],
  ['Profile routed to real profile module', app.includes("if(page==='profile')return <GuestLearningSpaceV71")],
  ['Notes route preserved', app.includes("if(page==='notes')return <SimplePage")],
  ['V7.1 CSS imported after v70', main.indexOf("import './profile-studio-v71.css'") > main.indexOf("import './dark-contrast-v70.css'")],
  ['Approved navy SVG preserved', existsSync('public/brand/el-kimiya-approved-logo.svg') && brand.includes('el-kimiya-approved-logo.svg')],
  ['Approved white SVG preserved', existsSync('public/brand/el-kimiya-approved-logo-white.svg') && brand.includes('el-kimiya-approved-logo-white.svg')],
  ['Dark logo swaps genuine SVG variant', css.includes('.app.dark .brand-lockup-auto > img.brand-asset-white')],
  ['Logo not filtered in dark', css.includes('filter:none !important')],
  ['Profile is local-only', profile.includes('there is no account') || profile.includes('no account, cloud sync')],
  ['Progress uses local actual quiz keys', profile.includes('elkimiya.quizbank.v63.progress') && profile.includes('elk.stats')],
  ['Progress uses original course list', profile.includes("import { COURSE } from '../data/course-v45'")],
  ['No fake streak/XP metric', !/streak|fictive|fakeXp|demoXp/i.test(profile)],
  ['Bilingual UI', profile.includes("language === 'en'")],
  ['Nickname local storage', profile.includes('elk.profile.nickname.v71')],
  ['Goals local storage', profile.includes('elk.profile.goal.v71')],
];
let passed=0;
for (const [label, ok] of assertions) { console.log(`[${ok?'PASS':'FAIL'}] ${label}`);if(ok)passed++; }
if(passed !== assertions.length)process.exit(1);
console.log(`[PASS] ${passed}/${assertions.length} V7.1 assertions`);
