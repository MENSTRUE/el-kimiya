export type StudyCard = { id: string; question: string; answer: string; detail: string; topic: string };
export const starterCards: StudyCard[] = [
  { id: 'ionic', topic: 'Chemical bonding', question: 'What is an ionic bond?', answer: 'An electrostatic attraction between oppositely charged ions.', detail: 'Typically formed after electron transfer. The attraction holds ions in a lattice.', },
  { id: 'covalent', topic: 'Chemical bonding', question: 'What is a covalent bond?', answer: 'A bond formed by sharing one or more pairs of electrons.', detail: 'The shared electrons are attracted to nuclei of both atoms.', },
  { id: 'polarity', topic: 'Molecular properties', question: 'Why is water polar?', answer: 'Water has polar O–H bonds and a bent molecular shape.', detail: 'Bond dipoles do not cancel, creating a molecular dipole.', },
  { id: 'ph', topic: 'Acids & bases', question: 'What is the pH of neutral pure water at 25°C?', answer: 'Approximately pH 7.', detail: 'The neutrality point varies with temperature.', },
  { id: 'atom', topic: 'Atomic structure', question: 'What is the atomic number?', answer: 'The number of protons in an atom’s nucleus.', detail: 'It determines the identity of an element.', },
  { id: 'mass', topic: 'Stoichiometry', question: 'What does molar mass measure?', answer: 'Mass of one mole of a substance (g/mol).', detail: 'It links particle amount to measurable mass.', },
];
export type Quiz = { id: string; question: string; equation: string; choices: string[]; correct: number; explanation: string; hint: string };
export const quizzes: Quiz[] = [
  { id: 'water', question: 'Which coefficients balance this equation?', equation: 'H₂ + O₂ → H₂O', choices: ['1, 1, 1','2, 1, 2','2, 2, 1','1, 2, 2'], correct: 1, hint: 'Balance oxygen first, then count hydrogen atoms on each side.', explanation: '2H₂ + O₂ → 2H₂O: four H and two O on each side.' },
  { id: 'ammonia', question: 'Which coefficients balance this equation?', equation: 'N₂ + H₂ → NH₃', choices: ['1, 2, 2','2, 3, 2','1, 3, 2','1, 1, 2'], correct: 2, hint: 'Two nitrogen atoms require two NH₃; count hydrogen next.', explanation: 'N₂ + 3H₂ → 2NH₃: two N and six H on each side.' },
  { id: 'sodium', question: 'Which coefficients balance this equation?', equation: 'Na + Cl₂ → NaCl', choices: ['1, 1, 2','2, 1, 2','2, 2, 1','1, 2, 1'], correct: 1, hint: 'Chlorine appears in pairs on the reactant side.', explanation: '2Na + Cl₂ → 2NaCl: two Na and two Cl atoms on each side.' },
];
export const elements = [
  {symbol:'H',number:1,name:'Hydrogen',mass:'1.008',kind:'Nonmetal',fact:'The lightest element; forms covalent bonds in water.'},
  {symbol:'C',number:6,name:'Carbon',mass:'12.011',kind:'Nonmetal',fact:'Can form four covalent bonds in many compounds.'},
  {symbol:'N',number:7,name:'Nitrogen',mass:'14.007',kind:'Nonmetal',fact:'Makes up most of Earth’s atmosphere as N₂.'},
  {symbol:'O',number:8,name:'Oxygen',mass:'15.999',kind:'Nonmetal',fact:'Commonly forms two covalent bonds in water.'},
  {symbol:'Na',number:11,name:'Sodium',mass:'22.990',kind:'Alkali metal',fact:'Forms Na⁺ ions in sodium chloride.'},
  {symbol:'Cl',number:17,name:'Chlorine',mass:'35.45',kind:'Halogen',fact:'Forms Cl⁻ ions in sodium chloride.'},
];
export type DemoAnswer = { title:string; summary:string; steps:string[]; example:string; topic:string };
const demoAnswers: {pattern:RegExp; answer:DemoAnswer}[] = [
  {pattern:/salt|nacl|dissolv/i,answer:{title:'Why salt dissolves in water',summary:'Polar water molecules attract sodium and chloride ions and can pull them from the crystal lattice.',steps:['NaCl contains Na⁺ and Cl⁻ ions.','Polar water molecules orient around the ions.','Hydration can overcome lattice attractions and disperse ions.'],example:'NaCl(s) → Na⁺(aq) + Cl⁻(aq)',topic:'Solution chemistry'}},
  {pattern:/ionic|covalent|bond/i,answer:{title:'Ionic vs covalent bonding',summary:'Ionic bonding involves attraction between charged ions; covalent bonding involves shared electron pairs.',steps:['In an ionic bond, electron transfer can create oppositely charged ions.','In a covalent bond, nuclei attract shared electrons.','Real bonding has a range of ionic and covalent character.'],example:'NaCl: predominantly ionic · H₂: covalent',topic:'Chemical bonding'}},
  {pattern:/balance|equation|stoichiomet/i,answer:{title:'Balancing chemical equations',summary:'Choose coefficients so every element has equal atom counts on both sides.',steps:['Write the unbalanced equation.','Count each type of atom.','Adjust coefficients—not subscripts—and recount.'],example:'2H₂ + O₂ → 2H₂O',topic:'Stoichiometry'}},
  {pattern:/ph|acid|base|alkali/i,answer:{title:'Understanding the pH scale',summary:'pH is a logarithmic measure related to hydrogen ion activity in a solution.',steps:['Lower pH indicates greater acidity in typical aqueous solutions.','Near pH 7 is neutral for pure water at 25°C.','Higher pH typically indicates basic conditions.'],example:'Pure water at 25°C: approximately pH 7',topic:'Acids & bases'}},
  {pattern:/atom|electron|proton|periodic/i,answer:{title:'Understanding atoms',summary:'An atom consists of a nucleus containing protons and usually neutrons, surrounded by electrons.',steps:['The number of protons identifies the element.','Electrons determine much of its chemistry.','Valence electrons influence bonding.'],example:'Carbon has atomic number 6 (six protons).',topic:'Atomic structure'}},
];
export function getDemoAnswer(prompt:string): DemoAnswer | null { return demoAnswers.find(item=>item.pattern.test(prompt))?.answer ?? null; }
