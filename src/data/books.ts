/** Bibliography transcribed from the users' provided PDFs, not public content. */
export type SourceBook = {
  id: string; title: string; author: string; pdfPages: number;
  role: 'Main chemistry course' | 'Islamic integration' | 'Chemistry applications' | 'Supporting reference';
  topics: string[]; sourceNote: string; rights: 'restricted' | 'noncommercial-copy-permitted';
};
export const sourceBooks: SourceBook[] = [
  {
    id:'kuncoro-2021', title:'Dasar-Dasar Kimia Islam Jilid 1', author:'Kuncoro Hadi · 2021', pdfPages:102,
    role:'Main chemistry course',
    topics:['Introduction to chemistry','Atomic models','Electron configuration','Periodic table','Chemical bonding','Electrolytes','Redox','Chemical laws','Hydrocarbons'],
    sourceNote:'Contents from the uploaded PDF, printed table of contents p. v. Chapter starts are NOT the same as PDF page numbers.',
    rights:'restricted'
  },
  {
    id:'kimia-dasar', title:'Buku Kimia Dasar', author:'Provided textbook PDF · author not verified', pdfPages:160,
    role:'Main chemistry course', topics:['Atomic theory','Molecules','Fundamental chemical laws'],
    sourceNote:'Verified opening chapter: Lahirnya Teori Atom (PDF p. 1). Full bibliographic metadata requires review.',
    rights:'restricted'
  },
  {
    id:'yahdi-2020', title:'Eksperimen Kimia 1', author:'Yahdi · Sanabil · 2020', pdfPages:205,
    role:'Main chemistry course', topics:['Laboratory safety','Basic laboratory techniques','Mixture separation','Solution concentration','Matter and changes','Thermochemistry','Gas laws','Chemical equilibrium'],
    sourceNote:'Contents from the uploaded PDF, table of contents PDF pp. 5–6.', rights:'restricted'
  },
  {
    id:'cucu-2022', title:'Integrasi Sains-Islam dalam Pembelajaran Kimia', author:'Cucu Zenab Subarkah · 2022', pdfPages:141,
    role:'Islamic integration', topics:['Islamic perspectives','Chemistry teaching','Halal and thayyib','Learning methodology'],
    sourceNote:'Educational integration reference, not a substitute for a general chemistry textbook.', rights:'restricted'
  },
  {
    id:'uii-2017', title:'Refleksi Nilai-Nilai Keislaman pada Perkembangan dan Aplikasi Ilmu Kimia', author:'Editor Is Fatimah · Universitas Islam Indonesia · 2017', pdfPages:242,
    role:'Chemistry applications', topics:['Green chemistry','Electrochemistry','Activated carbon','Biomolecules','Chemical bonding','Nanomaterials','Environmental stewardship','Halal product sensors'],
    sourceNote:'Contents from the uploaded PDF, table of contents PDF p. 7.', rights:'restricted'
  },
  {
    id:'kemenag-2013', title:'Makanan dan Minuman dalam Perspektif Al-Qur’an dan Sains', author:'Kemenag RI & LIPI · 2013', pdfPages:202,
    role:'Islamic integration', topics:['Food chemistry','Nutrition','Food and drink','Tafsir ilmi'],
    sourceNote:'Issued by Lajnah Pentashihan Mushaf Al-Qur’an. Scripture commentary and chemical facts require separate review.', rights:'restricted'
  },
  {
    id:'kusuma-2020', title:'Kajian Sains dalam Perspektif Al-Qur’an', author:'Hamdan Hadi Kusuma · Lawwana · 2020', pdfPages:211,
    role:'Supporting reference', topics:['Chemistry of rocks','Iron','Petroleum','Science-Islam integration'],
    sourceNote:'Only Chapter IV specifically covers chemistry; other chapters concern physics, biology and math.', rights:'noncommercial-copy-permitted'
  },
  {
    id:'water-2024', title:'Kimia Air dalam Cairan Tubuh Manusia: Perspektif Alquran', author:'Imelda Fajriati · chapter excerpt · 2024', pdfPages:24,
    role:'Supporting reference', topics:['Water H₂O','Molecular shape','Hydrogen bonding','Body fluids'],
    sourceNote:'A 24-page chapter excerpt, NOT the entire book. Qur’an references need independent verse verification.',rights:'restricted'
  }
];
export function bookById(id: string): SourceBook|undefined {return sourceBooks.find(book=>book.id===id);}
