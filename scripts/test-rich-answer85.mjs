import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createRequire} from 'node:module';
const root=resolve(process.argv[2]||'.');
const require=createRequire(resolve(root,'package.json'));
const ts=require('typescript');
const React=require('react');
const {renderToStaticMarkup}=require('react-dom/server');
const source=readFileSync(resolve(root,'src/v8/RichAnswer85.tsx'),'utf8');
const js=ts.transpileModule(source.replace(/^import\s+['"][^'"]+\.css['"];?\s*$/gm,''),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext,jsx:ts.JsxEmit.ReactJSX}}).outputText
 .replace(/(\bfrom\s+|\bimport\s+)(['"])([^'"]+)\2/g,(whole,prefix,_quote,specifier)=>{
 const uri=specifier.startsWith('.')?pathToFileURL(resolve(root,'src/v8',specifier.replace(/\.ts$/,'')+'.ts')).href:import.meta.resolve(specifier);
 return prefix+JSON.stringify(uri);
 });
const {RichAnswer85}=await import('data:text/javascript;base64,'+Buffer.from(js).toString('base64'));
const render=text=>renderToStaticMarkup(React.createElement(RichAnswer85,{text}));
const screenshot=String.raw`### 1. Ikatan Ionik

**Penjelasan:** Terjadi **transfer elektron**.

* Pertama
* Kedua

**Contoh:** $\text{HCl}$ dan $\text{NaOH}$.

$$
\ce{2H2 + O2 -> 2H2O}
$$

\[\begin{aligned}
\Delta H &= H_{produk}-H_{reaktan} \\
pH &=-\log[H^+]
\end{aligned}\]

\(\frac{n}{V}\)

| Model | Rumus |
| --- | ---: |
| Molekul | $\ce{SO4^{2-}}$ |

1. Satu
   - anak
2. Dua

~~garis~~ dan **tebal *miring***.
`;
const result=render(screenshot);
assert.match(result,/<h5[^>]*>1\. Ikatan Ionik<\/h5>/);
assert.match(result,/<strong>transfer elektron<\/strong>/);
assert.match(result,/<ul>/);
assert.match(result,/<ol(?:\s[^>]*)?>/);
assert.match(result,/<table>/);
assert.match(result,/<del>garis<\/del>/);
assert.match(result,/<strong>tebal <em>miring<\/em><\/strong>/);
assert.ok((result.match(/class="katex"/g)||[]).length>=6,'actual KaTeX outputs incl mhchem, aligned, inline math');
assert.match(result,/<math /);
assert.match(result,/class="katex-display"/);
assert.match(result,/<mfrac>/);
assert.match(result,/<mtable/);
assert.match(result,/<msub>/);
assert.doesNotMatch(result,/class="katex-error"/);
console.log('PASS real React-Markdown GFM + actual KaTeX MathML and HTML, mhchem reactions, aligned equations, inline/display notation');

const code=render('Code: `\\(raw\\)`\n\n```python\n**literal** \\(x\\) $y$\n```\n\n\\(\\frac{a}{b}\\)');
assert.match(code,/<code>\\\(raw\\\)<\/code>/);
assert.match(code,/<pre><code[^>]*>\*\*literal\*\* \\\(x\\\) \$y\$/);
assert.equal((code.match(/class="katex"/g)||[]).length,1);
console.log('PASS code spans/fences stay literal; only actual equations render');

const hostile=String.raw`Hello <script>alert(1)</script> <iframe src=x onload=alert(1)></iframe>

[click](javascript:alert%281%29) [external](https://example.invalid) ![bad](https://remote.invalid/image.png)

$\href{javascript:alert(1)}{bad}$ $\includegraphics{https://remote.invalid/math.png}$ $\htmlClass{evil}{x}$

$\doesnotexist{HCl}$
`;
const unsafe=render(hostile);
assert.match(unsafe,/&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
assert.doesNotMatch(unsafe,/<(?:script|iframe|img|a)\b/i);
assert.doesNotMatch(unsafe,/<[^>]*\s(?:href|src|onload|onclick|onerror)=/i);
assert.match(unsafe,/click/);
assert.match(unsafe,/bad/);
assert.match(unsafe,/<span[^>]*class="katex-error rich85-math-plain"[^>]*>\$\\doesnotexist\{HCl\}\$<\/span>/,'malformed equation retains literal delimiters, command and braces');
assert.match(unsafe,/<span[^>]*class="katex-error rich85-math-plain"[^>]*>\$\\includegraphics\{https:\/\/remote\.invalid\/math\.png\}\$<\/span>/,'unsafe privileged math remains full literal text');
console.log('PASS hostile HTML, URLs and TeX trust commands inert; malformed equation readable');

const long='A'.repeat(100001)+'<script>unsafe()</script>';
const plain=render(long);
assert.match(plain,/A{100001}&lt;script&gt;unsafe\(\)&lt;\/script&gt;/);
assert.doesNotMatch(plain,/<script\b/);
console.log('PASS oversized answer falls back to complete escaped text');
