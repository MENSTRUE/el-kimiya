// Browser tests on production components and CSS. Only the chemistry API response
// is a deterministic geometry fixture; no real login, backend, or AI claims.
import {chromium} from 'playwright';
import {createServer} from 'vite';
import assert from 'node:assert/strict';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
const server = await createServer({configFile:false,plugins:[react(),tailwindcss()],server:{host:'127.0.0.1',port:4198,strictPort:true},logLevel:'error'});
await server.listen();
let browser;
const descriptor={canonical_smiles_rdkit:'CCO',molecular_formula_rdkit:'C2H6O',molecular_weight_rdkit:46,logp_rdkit:0,tpsa_rdkit:20,h_bond_donors_rdkit:1,h_bond_acceptors_rdkit:1,rotatable_bonds_rdkit:0,atom_count_rdkit:3,svg_2d:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 100"><path d="M20 60L90 20L160 60" fill="none" stroke="black"/></svg>',descriptor_source:'fixture'};
const geometry={atoms:[{element:'C',xyz:[-1,0,0]},{element:'C',xyz:[0,0,0]},{element:'O',xyz:[1,1,0]}],bonds:[{a:0,b:1,order:1},{a:1,b:2,order:1}],method:'fixture'};
function lum(color){const v=color.match(/[\d.]+/g).slice(0,3).map(Number).map(n=>{const x=n/255;return x<=.04045?x/12.92:Math.pow((x+.055)/1.055,2.4)});return v[0]*.2126+v[1]*.7152+v[2]*.0722;}
try{
 browser=await chromium.launch({headless:true,executablePath:process.env.ELK_QA_CHROMIUM||undefined,args:['--no-sandbox','--disable-dev-shm-usage']});
 for (const dark of [true,false]) for(const language of ['id','en']) for(const viewport of [{width:390,height:844},{width:360,height:740},{width:840,height:412}]) {
  const p=await browser.newPage({viewport,isMobile:true,deviceScaleFactor:1,hasTouch:true});
  await p.addInitScript(lang=>localStorage.setItem('elk.language',lang==='id'?'Bahasa Indonesia':'English'),language);
  await p.route('**/*',r=>{
   const u=new URL(r.request().url());
   if(u.pathname==='/api/chemistry')return r.fulfill({json:{...descriptor,molecule_3d:r.request().postDataJSON().include_3d?geometry:null},headers:{'Access-Control-Allow-Origin':'*'}});
   if(u.origin==='http://127.0.0.1:4198')return r.continue();
   return r.abort();
  });
  await p.goto('http://127.0.0.1:4198/scripts/qa-v86/molecule86.html?dark='+dark);
  const open=p.locator('[data-elk-molecule-open="builder"]:visible');
  await open.waitFor({timeout:4000});
  assert.equal(await p.locator('.v61-drop-zone:visible').count(),0,'Mobile card must not show a miniature graph');
  await open.click();
  const modal=p.locator('[data-elk-molecule-fullscreen="builder"]');
  await modal.waitFor();
  const box=await modal.boundingBox();
  assert(box.x<2&&box.y<2&&box.width>=viewport.width-2&&box.height>=viewport.height-2,'Fullscreen fills viewport');
  const svg=modal.locator('.v61-drop-zone svg');
  const gbox=await svg.boundingBox();
  assert(gbox.width>=viewport.width-34&&gbox.height>=230,'Canvas is primary mobile workspace');
  const colors=await svg.evaluate(e=>{const style=getComputedStyle(e.parentElement), bond=e.querySelector('.v61-edge line');return [getComputedStyle(bond).stroke,style.backgroundColor]});
  const l=colors.map(lum);assert((Math.max(...l)+.05)/(Math.min(...l)+.05)>=4.5,'Molecule bond needs contrast '+colors.join(' / '));
  const count=modal.locator('.v61-submit > span');
  await modal.getByRole('button',{name:language==='id'?'Benzena':'Benzene',exact:true}).click();
  assert.match(await count.textContent(),/6/,'Preset changes actual graph');
  const selectedPalette=modal.locator('.v61-piece-grid button[aria-pressed=true]');
  const colorsSelected=await selectedPalette.evaluate(e=>[getComputedStyle(e.querySelector('small')).color,getComputedStyle(e).backgroundColor]);
  const ls=colorsSelected.map(lum);assert((Math.max(...ls)+.05)/(Math.min(...ls)+.05)>=4.5,'Selected palette text needs contrast '+colorsSelected.join(' / '));
  if(dark&&language==='id'&&viewport.width===390&&process.env.ELK_QA_SCREENSHOTS) await p.screenshot({path:'/tmp/v86-builder.png'});
  const oldViewBox=await svg.getAttribute('viewBox');
  await modal.getByRole('button',{name:language==='id'?'Perbesar rangka':'Zoom graph in'}).click();
  assert.notEqual(await svg.getAttribute('viewBox'),oldViewBox,'Zoom changes actual graph viewBox');
  await modal.getByRole('button',{name:language==='id'?'Geser tampilan':'Pan view'}).click();
  const oldCamera=await svg.getAttribute('viewBox');
  await svg.scrollIntoViewIfNeeded();
  const touchRect=await svg.boundingBox();
  const builderCDP=await p.context().newCDPSession(p);
  const bx=touchRect.x+touchRect.width/2,by=Math.min(touchRect.y+touchRect.height/2,viewport.height-60);
  await builderCDP.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:bx,y:by,id:1}]});
  await builderCDP.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:bx+32,y:by+15,id:1}]});
  await builderCDP.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  assert.notEqual(await svg.getAttribute('viewBox'),oldCamera,'Builder pan changes actual viewBox');
  await modal.getByRole('button',{name:language==='id'?'Geser tampilan':'Pan view'}).click();
  await modal.getByRole('button',{name:language==='id'?'Muat semua':'Fit all'}).click();
  await modal.locator('.v61-piece-grid button').filter({hasText:language==='id'?'Oksigen':'Oxygen'}).tap();
  await svg.tap({position:{x:Math.round(gbox.width*.73),y:Math.round(gbox.height*.25)}});
  assert.match(await count.textContent(),/7 atom/,'Touch insertion adds actual atom');
  await p.keyboard.press('Escape');
  await modal.waitFor({state:'hidden'});
  await open.click();
  assert.match(await count.textContent(),/7 atom/,'Graph survives exit/re-entry');
  await p.goBack();await modal.waitFor({state:'hidden'});
  assert.equal(await p.evaluate(()=>document.documentElement.style.overflow),'');
  await p.getByRole('button',{name:'3D',exact:true}).click();
  const viewer=p.locator('[data-elk-molecule-open="viewer"]:visible');await viewer.waitFor({timeout:5000});
  await viewer.click();
  const view=p.locator('[data-elk-molecule-fullscreen="viewer"]');await view.waitFor();
  const canvas=view.locator('canvas');const rect=await canvas.boundingBox();
  assert(rect.width>=viewport.width-10&&rect.height>=(viewport.height<440?200:450),'3D canvas fills fullscreen');
  if(dark&&language==='id'&&viewport.width===390&&process.env.ELK_QA_SCREENSHOTS) await p.screenshot({path:'/tmp/v86-viewer.png'});
  const initial=await canvas.evaluate(e=>e.toDataURL());
  await view.getByRole('button',{name:language==='id'?'Perbesar 3D':'Zoom 3D in'}).click();
  assert.notEqual(await canvas.evaluate(e=>e.toDataURL()),initial,'Zoom changes actual pixels');
  // CDP multi-touch performs pinch and two-finger translation; 3D image changes.
  const client=await p.context().newCDPSession(p);const cx=rect.x+rect.width/2,cy=rect.y+rect.height/2;
  const before=await canvas.evaluate(e=>e.toDataURL());
  await client.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:cx-30,y:cy,id:1},{x:cx+30,y:cy,id:2}]});
  await client.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:cx-55,y:cy+35,id:1},{x:cx+70,y:cy+35,id:2}]});
  await client.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  await p.waitForTimeout(100);
  assert.notEqual(await canvas.evaluate(e=>e.toDataURL()),before,'Touch gesture zoom/pan changes drawing');
  await view.locator('[data-elk-drawer-close]').click();
  await view.waitFor({state:'hidden'});
  await p.close();
  console.log('[PASS]',dark?'dark':'light',language,viewport.width+'x'+viewport.height);
 }
 const desktop=await browser.newPage({viewport:{width:1280,height:900}});
 await desktop.route('**/api/chemistry',r=>r.fulfill({json:{...descriptor,molecule_3d:null},headers:{'Access-Control-Allow-Origin':'*'}}));
 await desktop.goto('http://127.0.0.1:4198/scripts/qa-v86/molecule86.html');
 await desktop.locator('.v61-drop-zone:visible').waitFor();
 assert.equal(await desktop.locator('[data-elk-molecule-fullscreen]').count(),0);
 await desktop.close();console.log('[PASS] desktop inline builder');
}finally{await browser?.close();await server.close();}
