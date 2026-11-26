import assert from 'node:assert/strict';
import { chromium } from 'playwright';
const base=(process.argv[2]||'http://127.0.0.1:4173').replace(/\/$/,'');
const browser=await chromium.launch({channel:'chrome',headless:true});
const routes=['dashboard','mission','library','faith','reader','tutor','hybrid','practice','explorer','molecules','flashcards','progress','notes','settings','scan','profile','about','moduler','onboarding'];
async function at(page,hash,selector){
 await page.goto(base+'/#'+hash,{waitUntil:'domcontentloaded'});
 await page.locator(selector).waitFor({state:'visible',timeout:25000});
}
async function guest(){
 const context=await browser.newContext();
 try{
  const page=await context.newPage();
  await at(page,'landing','.landing-page[data-web-version="8.2"]');
  await page.getByRole('button',{name:/^(Guest preview|Pratinjau tamu)$/}).click();
  await page.locator('.v82-guest-preview').waitFor();
  assert.equal(await page.locator('.sidebar,.v81-admin-nav').count(),0);
  assert.equal(await page.getByRole('button',{name:/Open guest workspace|Buka ruang belajar tamu/i}).count(),0);
  await page.locator('.v82-preview-actions .primary-button').click();
  await page.locator('.v81-auth[data-web-version="8.2"]').waitFor();
  assert.equal(await page.locator('.sidebar,.v81-admin-nav').count(),0);
  assert.equal(await page.getByRole('button',{name:/Google|Continue as guest|Lanjut sebagai tamu/i}).count(),0);
  await page.locator('.v81-back').click();
  await page.locator('.landing-page').waitFor();
  for(const route of routes){
   await at(page,route,'.v81-auth[data-web-version="8.2"]');
   await page.waitForURL(/#account$/);
   assert.equal(await page.locator('.sidebar,.v81-admin-nav').count(),0,route);
  }
  for(const route of ['register','reset'])await at(page,route,'.v81-auth[data-web-version="8.2"]');
  console.log('[PASS] Live browser: public preview, email-only auth, homepage return, all protected guest URLs blocked.');
 }finally{await context.close();}
}
async function account(role,email,password){
 if(!email||!password)return false;
 const context=await browser.newContext();
 try{
  const page=await context.newPage();
  await at(page,'account','.v81-auth[data-web-version="8.2"]');
  await page.locator('input[type=email]').fill(email);
  await page.locator('input[type=password]').fill(password);
  await page.locator('.v81-submit').click();
  const selector=role==='moduler'?'.v81-admin-nav':'.sidebar';
  await page.locator(selector).waitFor({state:'visible',timeout:45000});
  await page.waitForURL(role==='moduler'?/#moduler$/:/#dashboard$/);
  await page.locator(role==='moduler'?'.v81-admin-nav .v82-home':'.sidebar .v82-session-nav button').first().click();
  await page.locator('.landing-page[data-web-version="8.2"]').waitFor();
  await page.getByRole('button',{name:/^(Open workspace|Buka ruang kerja)$/}).click();
  await page.locator(selector).waitFor();
  await page.locator(role==='moduler'?'.v81-admin-nav .v81-admin-logout':'.sidebar .v82-session-nav .v81-exit').last().click();
  await page.locator('.landing-page[data-web-version="8.2"]').waitFor();
  await page.getByRole('button',{name:/^(Guest preview|Pratinjau tamu)$/}).waitFor();
  await at(page,'dashboard','.v81-auth[data-web-version="8.2"]');
  console.log('[PASS] '+role+': authenticated workspace, homepage without sign-out, reopen workspace, sign-out, guest lock.');
  return true;
 }finally{await context.close();}
}
try{
 await guest();
 const learner=await account('user',process.env.ELK_QA_LEARNER_EMAIL,process.env.ELK_QA_LEARNER_PASSWORD);
 const moduler=await account('moduler',process.env.ELK_QA_MODULER_EMAIL,process.env.ELK_QA_MODULER_PASSWORD);
 if(!learner||!moduler)console.log('[SKIP] Account runtime tests require the corresponding ELK_QA_*_EMAIL and PASSWORD environment variables. No credentials are embedded.');
}finally{await browser.close();}
