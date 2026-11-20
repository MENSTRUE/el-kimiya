/** Match locally selected chemistry PDFs to the eight bibliography cards.
 * No PDF is fetched over a network or placed in the production bundle.
 */
const normalize = (value: string): string =>
  value.normalize('NFKD').toLowerCase().replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ').trim();

const aliases: {id: string; patterns: string[]}[] = [
  {id: 'kuncoro-2021', patterns: ['dasar dasar kimia islam', 'kuncoro']},
  {id: 'kimia-dasar', patterns: ['buku kimia dasar']},
  {id: 'yahdi-2020', patterns: ['eksperimen kimia']},
  {id: 'cucu-2022', patterns: ['integrasi sains cucu', 'integrasi sains islam dalam pembelajaran kimia']},
  {id: 'uii-2017', patterns: ['refleksi nilai', 'aplikasi ilmu kimia']},
  {id: 'kemenag-2013', patterns: ['makanan minuman', 'makanan dan minuman dalam perspektif']},
  {id: 'kusuma-2020', patterns: ['buku kajian sains', 'kajian sains 2020']},
  {id: 'water-2024', patterns: ['kimia air dalam cairan tubuh']},
];

export const expectedLocalBookCount = aliases.length;

export function identifyLocalBook(name: string): string | null {
  if (!/\.pdf$/i.test(name)) return null;
  const safe = normalize(name.split(/[\\/]/).pop() ?? name);
  for (const entry of aliases) {
    if (safe.startsWith(normalize(entry.id) + ' ')) return entry.id;
    if (entry.patterns.some(pattern => safe.includes(normalize(pattern)))) return entry.id;
  }
  return null;
}
