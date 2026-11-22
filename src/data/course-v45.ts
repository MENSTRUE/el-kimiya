/**
 * El-Kīmiyā V4.5 — original, concise educational learning text.
 * This is independently authored draft material, NOT an expert-certified question bank.
 * The 65-question V4.3 bank stays separate and ungraded in the existing V4.4 view.
 */
export type Bi = { id: string; en: string };
export type QuickCheck = { question: Bi; choices: Bi[]; correct: number; why: Bi };
export type CourseUnit = {
  id: string; title: Bi; objective: Bi; sections: { title: Bi; body: Bi }[];
  checks: [QuickCheck, QuickCheck]; reference: string;
};
const bi = (id: string, en: string): Bi => ({ id, en });
const check = (q: Bi, a: Bi[], correct: number, why: Bi): QuickCheck => ({ question: q, choices: a, correct, why });
export const COURSE: CourseUnit[] = [
  {
    id: 'matter', title: bi('Materi & Pengukuran', 'Matter & Measurement'),
    objective: bi('Bedakan zat, sifat fisika, dan perubahan kimia.', 'Distinguish substances, physical properties, and chemical changes.'),
    reference: 'https://openstax.org/books/chemistry-2e/pages/1-introduction',
    sections: [
      { title: bi('Apa itu materi?', 'What is matter?'), body: bi('Materi mempunyai massa dan menempati ruang. Materi dapat berupa zat murni atau campuran.', 'Matter has mass and occupies space. It can be a pure substance or a mixture.') },
      { title: bi('Sifat fisika dan kimia', 'Physical and chemical properties'), body: bi('Massa jenis dan titik leleh adalah sifat fisika. Kemampuan bereaksi adalah sifat kimia.', 'Density and melting point are physical properties. Reactivity is a chemical property.') },
      { title: bi('Contoh sehari-hari', 'Everyday example'), body: bi('Es mencair tanpa mengubah identitas H₂O. Besi berkarat membentuk zat baru.', 'Ice melts without changing the identity of H₂O. Rusting iron produces new substances.') },
    ],
    checks: [
      check(bi('Mana perubahan fisika?', 'Which is a physical change?'), [bi('Es mencair', 'Ice melting'), bi('Besi berkarat', 'Iron rusting'), bi('Kayu terbakar', 'Wood burning')], 0, bi('Perubahan wujud tidak mengubah komposisi H₂O.', 'A change of state does not alter H₂O composition.')),
      check(bi('Contoh sifat fisika adalah…', 'An example of a physical property is…'), [bi('Reaktivitas terhadap oksigen', 'Reactivity with oxygen'), bi('Massa jenis', 'Density'), bi('Kemampuan terbakar', 'Flammability')], 1, bi('Massa jenis dapat diukur tanpa mengubah identitas kimia zat.', 'Density can be measured without changing chemical identity.')),
    ],
  },
  {
    id: 'atoms', title: bi('Atom, Ion & Isotop', 'Atoms, Ions & Isotopes'),
    objective: bi('Pahami proton, neutron, elektron, dan nomor atom.', 'Understand protons, neutrons, electrons, and atomic number.'),
    reference: 'https://openstax.org/books/chemistry-2e/pages/2-atoms-molecules-and-ions',
    sections: [
      { title: bi('Struktur atom', 'Atomic structure'), body: bi('Inti atom berisi proton dan neutron. Elektron berada pada daerah di sekitar inti.', 'The nucleus contains protons and neutrons. Electrons occupy regions around the nucleus.') },
      { title: bi('Nomor atom', 'Atomic number'), body: bi('Nomor atom Z menunjukkan jumlah proton dan menentukan identitas unsur.', 'Atomic number Z equals the number of protons and determines element identity.') },
      { title: bi('Ion dan isotop', 'Ions and isotopes'), body: bi('Ion terbentuk saat jumlah elektron berubah. Isotop satu unsur mempunyai jumlah neutron berbeda.', 'Ions result from changes in electron count. Isotopes of an element differ in neutron count.') },
    ],
    checks: [
      check(bi('Nomor atom menunjukkan jumlah…', 'Atomic number identifies the number of…'), [bi('Proton', 'Protons'), bi('Neutron', 'Neutrons'), bi('Proton + neutron', 'Protons + neutrons')], 0, bi('Z adalah jumlah proton dalam inti.', 'Z is the number of protons in the nucleus.')),
      check(bi('Dua isotop karbon berbeda pada jumlah…', 'Two carbon isotopes differ in their number of…'), [bi('Proton', 'Protons'), bi('Neutron', 'Neutrons'), bi('Muatan inti', 'Nuclear charge')], 1, bi('Isotop unsur yang sama memiliki proton sama tetapi neutron berbeda.', 'Isotopes have the same proton count but different neutron counts.')),
    ],
  },
  {
    id: 'periodic', title: bi('Tabel Periodik & Elektron', 'Periodic Table & Electrons'),
    objective: bi('Kenali golongan, periode, dan kemiripan sifat unsur.', 'Identify groups, periods, and similarities among elements.'),
    reference: 'https://openstax.org/books/chemistry-2e/pages/6-electronic-structure-and-periodic-properties-of-elements',
    sections: [
      { title: bi('Urutan unsur', 'Element order'), body: bi('Tabel periodik mengurutkan unsur menurut nomor atom. Setiap kotak mewakili satu unsur.', 'The periodic table orders elements by atomic number. Each cell represents an element.') },
      { title: bi('Golongan dan periode', 'Groups and periods'), body: bi('Kolom vertikal disebut golongan; baris horizontal disebut periode. Unsur segolongan sering memiliki kemiripan kimia.', 'Vertical columns are groups; horizontal rows are periods. Elements in one group often share chemical traits.') },
      { title: bi('Jelajahi tanpa situs lain', 'Explore without another website'), body: bi('Buka Eksplorasi Kimia untuk memilih 118 unsur, mencari simbol, dan mengamati golongan serta periode.', 'Open Chemistry Explorer to browse 118 elements, search symbols, and inspect groups and periods.') },
    ],
    checks: [
      check(bi('Kolom vertikal tabel periodik disebut…', 'A vertical column in the periodic table is a…'), [bi('Periode', 'Period'), bi('Golongan', 'Group'), bi('Isotop', 'Isotope')], 1, bi('Golongan adalah kolom vertikal pada tabel periodik.', 'A group is a vertical column.')),
      check(bi('Tabel periodik modern disusun berdasarkan…', 'The modern periodic table is ordered by…'), [bi('Nomor atom', 'Atomic number'), bi('Massa jenis', 'Density'), bi('Titik leleh', 'Melting point')], 0, bi('Urutannya berdasarkan jumlah proton (nomor atom).', 'It is ordered by proton count (atomic number).')),
    ],
  },
  {
    id: 'bonding', title: bi('Ikatan & Bentuk Molekul', 'Bonds & Molecular Shape'),
    objective: bi('Bandingkan ikatan ionik, kovalen, dan polaritas molekul.', 'Compare ionic and covalent bonds and molecular polarity.'),
    reference: 'https://openstax.org/books/chemistry-2e/pages/7-chemical-bonding-and-molecular-geometry',
    sections: [
      { title: bi('Ikatan ionik', 'Ionic bonding'), body: bi('Gaya tarik elektrostatik antara ion bermuatan berlawanan mempertahankan struktur ionik.', 'Electrostatic attraction between oppositely charged ions holds ionic structures together.') },
      { title: bi('Ikatan kovalen', 'Covalent bonding'), body: bi('Atom berbagi pasangan elektron pada ikatan kovalen. Berbagi elektron tidak selalu sama rata.', 'Atoms share electron pairs in covalent bonds. Sharing is not necessarily equal.') },
      { title: bi('Bentuk menentukan sifat', 'Shape affects properties'), body: bi('Air memiliki geometri bengkok. Dipol ikatan O–H tidak saling meniadakan, sehingga H₂O polar.', 'Water has a bent geometry. O–H bond dipoles do not cancel, so H₂O is polar.') },
    ],
    checks: [
      check(bi('Ikatan kovalen melibatkan…', 'A covalent bond involves…'), [bi('Berbagi pasangan elektron', 'Sharing electron pairs'), bi('Perubahan nomor atom', 'Changing atomic number'), bi('Perubahan neutron', 'Changing neutron count')], 0, bi('Ikatan kovalen terbentuk melalui elektron yang dibagi.', 'Covalent bonding involves shared electrons.')),
      check(bi('Mengapa molekul H₂O polar?', 'Why is H₂O polar?'), [bi('Molekulnya selalu linear', 'It is always linear'), bi('Sudut bengkok membuat dipol tidak hilang', 'Bent geometry leaves a net dipole'), bi('Semua ikatan O–H nonpolar', 'All O–H bonds are nonpolar')], 1, bi('Dipol O–H tidak meniadakan akibat geometri bengkok.', 'Bent geometry prevents bond dipoles from canceling.')),
    ],
  },
  {
    id: 'stoich', title: bi('Mol & Stoikiometri', 'Moles & Stoichiometry'),
    objective: bi('Hubungkan jumlah partikel dan penyetaraan reaksi.', 'Relate particle amount to balancing chemical equations.'),
    reference: 'https://openstax.org/books/chemistry-2e/pages/4-stoichiometry-of-chemical-reactions',
    sections: [
      { title: bi('Satuan jumlah zat', 'Amount of substance'), body: bi('Satu mol mengandung tepat 6,02214076 × 10²³ entitas elementer yang ditentukan.', 'One mole contains exactly 6.02214076 × 10²³ specified elementary entities.') },
      { title: bi('Massa molar', 'Molar mass'), body: bi('Massa molar menghubungkan mol dan massa zat dalam satuan g/mol.', 'Molar mass connects amount of substance and mass in g/mol.') },
      { title: bi('Setarakan persamaan', 'Balance equations'), body: bi('Ubah koefisien, bukan indeks rumus, agar jumlah tiap atom sama di kedua sisi. Contoh: 2H₂ + O₂ → 2H₂O.', 'Adjust coefficients, not subscripts, to conserve each atom. Example: 2H₂ + O₂ → 2H₂O.') },
    ],
    checks: [
      check(bi('Pada penyetaraan persamaan, yang diubah adalah…', 'When balancing equations, change the…'), [bi('Indeks kimia', 'Subscripts'), bi('Koefisien', 'Coefficients'), bi('Simbol unsur', 'Element symbols')], 1, bi('Mengubah indeks akan mengubah identitas zat.', 'Changing subscripts changes substance identity.')),
      check(bi('Persamaan H₂ + O₂ → H₂O yang setara adalah…', 'The balanced H₂ + O₂ → H₂O equation is…'), [bi('2H₂ + O₂ → 2H₂O', '2H₂ + O₂ → 2H₂O'), bi('H₂ + O₂ → 2H₂O', 'H₂ + O₂ → 2H₂O'), bi('H₂ + 2O₂ → H₂O', 'H₂ + 2O₂ → H₂O')], 0, bi('Empat H dan dua O terdapat pada kedua sisi.', 'Four H and two O atoms appear on both sides.')),
    ],
  },
  {
    id: 'solutions', title: bi('Larutan & Konsentrasi', 'Solutions & Concentration'),
    objective: bi('Pahami pelarut, zat terlarut, dan pengenceran.', 'Understand solvent, solute, and dilution.'),
    reference: 'https://openstax.org/books/chemistry-2e/pages/11-solutions-and-colloids',
    sections: [
      { title: bi('Komponen larutan', 'Solution components'), body: bi('Zat terlarut tersebar dalam pelarut sehingga terbentuk campuran homogen.', 'Solute is dispersed in solvent, producing a homogeneous mixture.') },
      { title: bi('Molaritas', 'Molarity'), body: bi('Molaritas adalah mol zat terlarut per liter larutan, dengan satuan mol/L.', 'Molarity is moles of solute per liter of solution, in mol/L.') },
      { title: bi('Pengenceran', 'Dilution'), body: bi('Pada pengenceran ideal tanpa reaksi, penambahan pelarut menurunkan konsentrasi tetapi tidak mengubah mol zat terlarut.', 'In ideal dilution without reaction, adding solvent lowers concentration without changing solute moles.') },
    ],
    checks: [
      check(bi('Dalam air garam, zat terlarut umumnya adalah…', 'In salt water, the solute is usually…'), [bi('Air', 'Water'), bi('Garam', 'Salt'), bi('Gelas', 'Glass')], 1, bi('Garam merupakan zat terlarut, air pelarut.', 'Salt is the solute, water is the solvent.')),
      check(bi('Menambah pelarut tanpa mengubah jumlah zat terlarut akan…', 'Adding solvent without changing solute amount will…'), [bi('Menaikkan konsentrasi', 'Increase concentration'), bi('Menurunkan konsentrasi', 'Lower concentration'), bi('Mengubah unsur', 'Change the element')], 1, bi('Volume naik saat mol zat terlarut tetap.', 'Volume increases while solute moles stay the same.')),
    ],
  },
  {
    id: 'acids', title: bi('Asam, Basa & pH', 'Acids, Bases & pH'),
    objective: bi('Tafsirkan pH dan sifat larutan asam-basa.', 'Interpret pH and acid–base properties.'),
    reference: 'https://openstax.org/books/chemistry-2e/pages/14-acid-base-equilibria',
    sections: [
      { title: bi('Makna pH', 'What pH means'), body: bi('pH berkaitan secara logaritmik dengan aktivitas ion hidrogen. Untuk larutan berair biasa, pH lebih rendah berarti lebih asam.', 'pH is logarithmically related to hydrogen-ion activity. For typical aqueous solutions, lower pH means greater acidity.') },
      { title: bi('Netral pada 25 °C', 'Neutral at 25 °C'), body: bi('Air murni mendekati pH 7 pada suhu 25 °C. Nilai pH netral bergantung pada temperatur.', 'Pure water is approximately pH 7 at 25 °C. Neutral pH depends on temperature.') },
      { title: bi('Skala tidak linear', 'A logarithmic scale'), body: bi('Selisih satu satuan pH mencerminkan kira-kira faktor sepuluh dalam aktivitas ion hidrogen.', 'A one-unit pH difference corresponds to roughly a tenfold hydrogen-ion activity change.') },
    ],
    checks: [
      check(bi('Dalam larutan berair biasa, pH 3 dibanding pH 5 bersifat…', 'In typical water solutions, pH 3 versus pH 5 is…'), [bi('Lebih asam', 'More acidic'), bi('Lebih basa', 'More basic'), bi('Sama', 'The same')], 0, bi('pH lebih rendah menunjukkan aktivitas ion hidrogen lebih tinggi.', 'Lower pH indicates higher hydrogen-ion activity.')),
      check(bi('Air murni pada 25 °C kira-kira memiliki pH…', 'Pure water at 25 °C has approximately pH…'), [bi('1', '1'), bi('7', '7'), bi('14', '14')], 1, bi('Kondisi netral air murni mendekati pH 7 pada 25 °C.', 'Pure water is about pH 7 at 25 °C.')),
    ],
  },
  {
    id: 'gases', title: bi('Gas & Hukum Gas', 'Gases & Gas Laws'),
    objective: bi('Hubungkan tekanan, volume, dan temperatur mutlak.', 'Relate pressure, volume, and absolute temperature.'),
    reference: 'https://openstax.org/books/chemistry-2e/pages/9-gases',
    sections: [
      { title: bi('Sifat gas', 'Gas properties'), body: bi('Gas mengisi wadahnya; partikel bergerak dan bertumbukan dengan dinding wadah.', 'Gases fill their container; particles move and collide with its walls.') },
      { title: bi('Hubungan P dan V', 'Pressure and volume'), body: bi('Untuk gas ideal dengan n dan T tetap, tekanan berbanding terbalik dengan volume.', 'For an ideal gas at fixed n and T, pressure varies inversely with volume.') },
      { title: bi('Gunakan Kelvin', 'Use Kelvin'), body: bi('Hukum gas menggunakan temperatur mutlak (Kelvin), bukan nilai Celsius langsung.', 'Gas laws use absolute temperature (Kelvin), not Celsius directly.') },
    ],
    checks: [
      check(bi('Jika volume gas ideal turun pada suhu tetap, tekanannya…', 'If ideal-gas volume decreases at fixed temperature, pressure…'), [bi('Naik', 'Increases'), bi('Turun', 'Decreases'), bi('Selalu nol', 'Always becomes zero')], 0, bi('Hukum Boyle: P berbanding terbalik dengan V (n dan T konstan).', 'Boyle’s law: P is inversely proportional to V at constant n and T.')),
      check(bi('Temperatur untuk persamaan gas ideal dinyatakan dalam…', 'Temperature in the ideal gas equation uses…'), [bi('Celsius', 'Celsius'), bi('Kelvin', 'Kelvin'), bi('Persen', 'Percent')], 1, bi('Persamaan gas menggunakan skala temperatur mutlak.', 'Gas equations use absolute temperature.')),
    ],
  },
  {
    id: 'energy', title: bi('Energi & Termokimia', 'Energy & Thermochemistry'),
    objective: bi('Bedakan proses endotermik dan eksotermik.', 'Distinguish endothermic and exothermic processes.'),
    reference: 'https://openstax.org/books/chemistry-2e/pages/5-thermochemistry',
    sections: [
      { title: bi('Pertukaran energi', 'Energy transfer'), body: bi('Reaksi kimia dapat menyerap atau melepas energi ke lingkungan.', 'Chemical reactions can absorb or release energy to the surroundings.') },
      { title: bi('Eksotermik', 'Exothermic'), body: bi('Proses eksotermik melepaskan kalor. Pada tekanan konstan, perubahan entalpi sistem bernilai negatif.', 'Exothermic processes release heat. At constant pressure, system enthalpy change is negative.') },
      { title: bi('Endotermik', 'Endothermic'), body: bi('Proses endotermik menyerap kalor; perubahan entalpi sistem bernilai positif pada tekanan konstan.', 'Endothermic processes absorb heat; system enthalpy change is positive at constant pressure.') },
    ],
    checks: [
      check(bi('Proses eksotermik…', 'An exothermic process…'), [bi('Melepaskan kalor', 'Releases heat'), bi('Selalu menghilangkan materi', 'Always destroys matter'), bi('Selalu menyerap kalor', 'Always absorbs heat')], 0, bi('Energi berpindah dari sistem ke lingkungan sebagai kalor.', 'Energy transfers from system to surroundings as heat.')),
      check(bi('Pada tekanan konstan, ΔH sistem eksotermik adalah…', 'At constant pressure, ΔH of an exothermic system is…'), [bi('Positif', 'Positive'), bi('Negatif', 'Negative'), bi('Selalu nol', 'Always zero')], 1, bi('Pelepasan kalor memberikan ΔH negatif untuk sistem.', 'Released heat corresponds to negative system ΔH.')),
    ],
  },
  {
    id: 'kinetics', title: bi('Laju Reaksi & Katalis', 'Reaction Rate & Catalysts'),
    objective: bi('Pahami laju reaksi, suhu, dan katalis.', 'Understand reaction rate, temperature, and catalysts.'),
    reference: 'https://openstax.org/books/chemistry-2e/pages/12-kinetics',
    sections: [
      { title: bi('Laju reaksi', 'Reaction rate'), body: bi('Laju reaksi menggambarkan perubahan konsentrasi pereaksi atau produk terhadap waktu.', 'Reaction rate describes change in reactant or product concentration with time.') },
      { title: bi('Faktor yang memengaruhi', 'What affects rate'), body: bi('Konsentrasi, temperatur, luas permukaan, dan sifat pereaksi dapat memengaruhi laju.', 'Concentration, temperature, surface area, and reactant identity can affect reaction rate.') },
      { title: bi('Peran katalis', 'Catalysts'), body: bi('Katalis mempercepat reaksi melalui jalur alternatif dengan energi aktivasi lebih rendah dan tidak habis secara netto.', 'Catalysts speed reactions via alternative pathways with lower activation energy and are not consumed overall.') },
    ],
    checks: [
      check(bi('Katalis umumnya…', 'A catalyst typically…'), [bi('Meningkatkan energi aktivasi', 'Increases activation energy'), bi('Menurunkan energi aktivasi jalur reaksi', 'Lowers pathway activation energy'), bi('Mengubah proton unsur', 'Changes element protons')], 1, bi('Katalis menyediakan jalur reaksi dengan penghalang energi lebih rendah.', 'A catalyst provides a lower-energy reaction pathway.')),
      check(bi('Laju reaksi berhubungan dengan…', 'Reaction rate concerns…'), [bi('Perubahan konsentrasi terhadap waktu', 'Concentration change over time'), bi('Nomor atom', 'Atomic number'), bi('Warna wadah saja', 'Only container color')], 0, bi('Laju mengukur perubahan sistem per satuan waktu.', 'Rate measures change per unit time.')),
    ],
  },
  {
    id: 'redox', title: bi('Oksidasi & Reduksi', 'Oxidation & Reduction'),
    objective: bi('Pahami perpindahan elektron dan bilangan oksidasi.', 'Understand electron transfer and oxidation numbers.'),
    reference: 'https://openstax.org/books/chemistry-2e/pages/17-electrochemistry',
    sections: [
      { title: bi('Dua proses berpasangan', 'Paired processes'), body: bi('Oksidasi dan reduksi berlangsung bersama pada reaksi redoks.', 'Oxidation and reduction occur together in redox reactions.') },
      { title: bi('Oksidasi', 'Oxidation'), body: bi('Oksidasi secara klasik didefinisikan sebagai pelepasan elektron atau kenaikan bilangan oksidasi.', 'Oxidation is classically electron loss or an increase in oxidation number.') },
      { title: bi('Reduksi', 'Reduction'), body: bi('Reduksi adalah penerimaan elektron atau penurunan bilangan oksidasi.', 'Reduction is electron gain or a decrease in oxidation number.') },
    ],
    checks: [
      check(bi('Oksidasi secara klasik berarti…', 'Oxidation classically means…'), [bi('Menerima elektron', 'Gaining electrons'), bi('Melepas elektron', 'Losing electrons'), bi('Menghilangkan neutron', 'Removing neutrons')], 1, bi('Oksidasi: pelepasan elektron.', 'Oxidation: loss of electrons.')),
      check(bi('Reduksi adalah…', 'Reduction is…'), [bi('Menerima elektron', 'Gaining electrons'), bi('Melepas elektron', 'Losing electrons'), bi('Menciptakan proton', 'Creating protons')], 0, bi('Reduksi: penerimaan elektron.', 'Reduction: gain of electrons.')),
    ],
  },
  {
    id: 'organic', title: bi('Kimia Organik Dasar', 'Organic Chemistry Basics'),
    objective: bi('Kenali kerangka karbon dan gugus fungsi.', 'Recognize carbon frameworks and functional groups.'),
    reference: 'https://openstax.org/books/chemistry-2e/pages/20-organic-chemistry',
    sections: [
      { title: bi('Keunikan karbon', 'Carbon chemistry'), body: bi('Karbon dapat membentuk kerangka rantai dan cincin dengan beragam jenis ikatan.', 'Carbon can form chains and rings with varied bonding patterns.') },
      { title: bi('Hidrokarbon', 'Hydrocarbons'), body: bi('Hidrokarbon tersusun hanya dari unsur karbon dan hidrogen.', 'Hydrocarbons contain only carbon and hydrogen.') },
      { title: bi('Gugus fungsi', 'Functional groups'), body: bi('Gugus fungsi menghubungkan struktur molekul dan kecenderungan reaksi; alkohol mengandung gugus hidroksil yang terikat pada karbon jenuh.', 'Functional groups link structure with reactivity; alcohols have a hydroxyl group attached to a saturated carbon.') },
    ],
    checks: [
      check(bi('Hidrokarbon terdiri atas unsur…', 'Hydrocarbons contain…'), [bi('C dan H', 'C and H'), bi('H dan O saja', 'Only H and O'), bi('Na dan Cl', 'Na and Cl')], 0, bi('Hidrokarbon hanya mengandung karbon dan hidrogen.', 'Hydrocarbons contain only carbon and hydrogen.')),
      check(bi('Molekul yang hanya mengandung C dan H termasuk…', 'A compound containing only C and H is a…'), [bi('Hidrokarbon', 'Hydrocarbon'), bi('Garam ionik NaCl', 'NaCl ionic salt'), bi('Oksida logam', 'Metal oxide')], 0, bi('Ini definisi kelas hidrokarbon.', 'This matches the hydrocarbon definition.')),
    ],
  },
  {
    id: 'safety', title: bi('Keselamatan & Etika Kimia', 'Chemistry Safety & Ethics'),
    objective: bi('Kenali prinsip dasar keselamatan dan batas data.', 'Recognize basic safety and scientific-data limits.'),
    reference: 'https://openstax.org/books/chemistry-2e/pages/1-introduction',
    sections: [
      { title: bi('Keselamatan dahulu', 'Safety first'), body: bi('Ikuti prosedur laboratorium resmi, petunjuk pengajar, dan lembar data keselamatan yang relevan.', 'Follow approved lab procedures, instructor guidance, and relevant safety data sheets.') },
      { title: bi('Jangan mencampur tanpa panduan', 'Do not mix without guidance'), body: bi('Jangan menguji campuran kimia tak dikenal atau menghirup zat untuk mengidentifikasinya.', 'Do not experiment with unknown chemical mixtures or smell chemicals to identify them.') },
      { title: bi('Jujur pada bukti', 'Be honest about evidence'), body: bi('Sifat yang dihitung komputer tidak sama dengan hasil uji laboratorium. Catat sumber dan keterbatasan.', 'Computer-computed properties are not laboratory measurements. Record sources and limitations.') },
    ],
    checks: [
      check(bi('Sebelum memakai bahan kimia tak dikenal, tindakan yang tepat…', 'Before handling unfamiliar chemicals, you should…'), [bi('Mencampurnya dengan bahan lain', 'Mix them with others'), bi('Periksa petunjuk dan SDS', 'Check guidance and SDS'), bi('Menghirup uapnya', 'Inhale the vapors')], 1, bi('Informasi keselamatan harus diperiksa lebih dulu.', 'Safety information should be reviewed first.')),
      check(bi('Prediksi sifat RDKit adalah…', 'An RDKit property calculation is…'), [bi('Pengukuran eksperimen', 'An experimental measurement'), bi('Deskriptor terhitung', 'A computed descriptor'), bi('Bukti keamanan senyawa', 'Proof of compound safety')], 1, bi('Perhitungan tidak menggantikan pengujian eksperimental.', 'Calculations do not replace experimental testing.')),
    ],
  },
];
export function localize(b: Bi, language: 'id' | 'en'): string { return b[language]; }
