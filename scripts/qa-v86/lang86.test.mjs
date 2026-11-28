import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import ts from 'typescript';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const read=(p)=>fs.readFileSync(path.join(root,p),'utf8');

// Execute the production dictionary, direction set, and translation function
// in isolation; no browser, account, Firebase or source-document modifications.
function translator() {
 const src=ts.createSourceFile('language.tsx',read('src/lib/language.tsx'),ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
 const declarations=[];
 for(const node of src.statements){
  if(ts.isVariableStatement(node)&&node.declarationList.declarations.some(d=>['languagePairs','idSources'].includes(d.name.getText(src))))declarations.push(node.getText(src).replace(/^export /,''));
  if(ts.isFunctionDeclaration(node)&&node.name?.text==='translate')declarations.push(node.getText(src).replace(/^export /,''));
 }
 assert.equal(declarations.length,3);
 const text=ts.transpileModule("let active='id';\n"+declarations.join('\n')+"\n({translate,setLanguage:(v)=>{active=v;}})",{compilerOptions:{target:ts.ScriptTarget.ES2020}}).outputText;
 return vm.runInNewContext(text);
}
test('private library and reader Indonesian source keys translate only in EN mode',()=>{
 const i18n=translator();
 const cases={
  'Lanjutkan membaca':'Continue reading','Hubungkan PDF':'Connect PDF','Layar penuh':'Full screen',
  'Mode membaca':'Reading mode','Lihat PDF asli':'View original PDF','Diskusikan di AI Tutor':'Discuss with AI Tutor',
  'Sembunyikan panel':'Hide sidebar'
 };
 for(const [id,en] of Object.entries(cases)){
  i18n.setLanguage('id');assert.equal(i18n.translate(id),id);
  i18n.setLanguage('en');assert.equal(i18n.translate(id),en);
 }
});
test('faith UI uses correct direction for Indonesian-authored labels',()=>{
 const i18n=translator();
 const cases={"01 / LANDASAN AL-QUR'AN":"01 / QUR'ANIC FOUNDATION","Rujukan Al-Qur'an":"Qur'anic reference",'01 · Mengamati':'01 · Observing','02 · Memanfaatkan':'02 · Applying','03 · Menjaga':'03 · Protecting','Tersalin':'Copied','Salin pesan hikmah':'Copy reflection'};
 for(const [id,en] of Object.entries(cases)){
  i18n.setLanguage('id');assert.equal(i18n.translate(id),id);
  i18n.setLanguage('en');assert.equal(i18n.translate(id),en);
 }
});
test('English source labels have meaningful Indonesian copy; source formulas and unknown user text are preserved',()=>{
 const t=translator();t.setLanguage('id');
 assert.equal(t.translate('Import JSON'),'Impor JSON');
 assert.equal(t.translate('EL-KĪMIYĀ · READING STUDIO'),'EL-KĪMIYĀ · RUANG BACA');
 assert.equal(t.translate('DIGITAL READING · PDF PAGE'),'BACAAN DIGITAL · HALAMAN PDF');
 const content='H₂O + NaCl · اَلَمْ تَرَوْا';
 assert.equal(t.translate(content),content);
 t.setLanguage('en');assert.equal(t.translate('Import JSON'),'Import JSON');assert.equal(t.translate(content),content);
});
test('known visible and accessible UI labels do not bypass localization',()=>{
 const books=read('src/components/BookResearchPanel.tsx');
 const reader=read('src/components/PrivateReadingWorkspace.tsx');
 const faith=read('src/components/ChemistryFaithPage.tsx');
 const lab=read('src/components/StudyExperienceV44.tsx');
 for(const [src,pattern] of [[books,/aria-label="Cari buku"/],[books,/placeholder="Cari judul, penulis, atau topik kimia\.\.\."/],[books,/\{showResearch \? 'Tutup pencarian' : 'Buka pencarian buku'\}/],[reader,/title=\{favorite\?'Hapus favorit':'Tambah favorit'\}/],[reader,/\{copied\?'Referensi disalin':'Salin referensi halaman'\}/],[faith,/<span>\{item\.short\}<\/span>/],[faith,/\{copied \? 'Tersalin' : 'Salin pesan hikmah'\}/],[lab,/> Retry \/ Coba lagi<\/button>/]])assert.doesNotMatch(src,pattern);
});
