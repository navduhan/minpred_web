import type { DemoSequenceKey } from '@/data/demo-sequences';

export type CleavageMode =
  | 'endopeptidase'
  | 'metalloendo'
  | 'cysendo'
  | 'aspendo'
  | 'nterm_mono'
  | 'nterm_di'
  | 'omega'
  | 'cterm_mono'
  | 'dipeptide'
  | 'amide';

export type PathwayStageId = 'depolymerization' | 'oligopeptide' | 'ammonification';

export type MineralizationClassInfo = {
  key: DemoSequenceKey;
  code: 'SEP' | 'MEP' | 'CEP' | 'AEP' | 'AP' | 'DPP' | 'OP' | 'MP' | 'DP' | 'AH';
  classId: string;
  modelHead: string;
  name: string;
  ecPrefix: string;
  stage: PathwayStageId;
  stageShort: 'Step 1 · Endo' | 'Step 2 · Exo/Di' | 'Step 3 · Amide';
  stageLabel: string;
  compartment: string;
  scissileFormula: string;
  cleavageMode: CleavageMode;
  cofactorOrDyad: string;
  productLabel: string;
  summary: string;
  mechanism: string;
  canonicalExamples: readonly string[];
  conservedMotifs: readonly string[];
  proteins: string;
  mcc: string;
  auroc: string;
  ecs: readonly string[];
};

export const MINERALIZATION_CLASSES: readonly MineralizationClassInfo[] = [
  {
    key: 'serine',
    code: 'SEP',
    classId: 'C06',
    modelHead: 'M6',
    name: 'Serine Endopeptidases',
    ecPrefix: 'EC 3.4.21',
    stage: 'depolymerization',
    stageShort: 'Step 1 · Endo',
    stageLabel: 'Step 1 · Extracellular Depolymerization',
    compartment: 'Extracellular Soil Matrix',
    scissileFormula: 'H₃N⁺–P₃–P₂–P₁ ✂ P₁′–P₂′–P₃′–COO⁻',
    cleavageMode: 'endopeptidase',
    cofactorOrDyad: 'Ser–His–Asp Triad',
    productLabel: 'Oligopeptides',
    summary:
      'Secreted alkaline subtilisins, trypsins, and membrane signal peptidases that initiate rate-limiting cleavage of high-molecular-weight polymeric soil proteins into soluble oligopeptides.',
    mechanism:
      'Nucleophilic Ser-OH, polarized by a His–Asp proton-relay triad, attacks internal peptide carbonyls to form a covalent tetrahedral acyl-enzyme intermediate stabilized by an oxyanion hole.',
    canonicalExamples: [
      'Subtilisin AprE (Bacillus)',
      'Proteinase K (Tritirachium)',
      'Signal peptidase I LepB',
      'Streptomyces trypsin-like protease',
    ],
    conservedMotifs: [
      'Catalytic triad Asp–His–Ser (MEROPS S8 / S1)',
      'Backbone NH oxyanion hole',
      'Ser–Lys catalytic dyad (Signal peptidase S26)',
    ],
    proteins: '2,868',
    mcc: '0.977',
    auroc: '1.000',
    ecs: [
      '3.4.21.1',
      '3.4.21.4',
      '3.4.21.26',
      '3.4.21.53',
      '3.4.21.62',
      '3.4.21.88',
      '3.4.21.89',
      '3.4.21.90',
      '3.4.21.91',
      '3.4.21.92',
      '3.4.21.97',
      '3.4.21.102',
      '3.4.21.105',
      '3.4.21.107',
    ],
  },
  {
    key: 'metalloendopeptidases',
    code: 'MEP',
    classId: 'C09',
    modelHead: 'M9',
    name: 'Metalloendopeptidases',
    ecPrefix: 'EC 3.4.24',
    stage: 'depolymerization',
    stageShort: 'Step 1 · Endo',
    stageLabel: 'Step 1 · Extracellular Depolymerization',
    compartment: 'Extracellular Soil Matrix',
    scissileFormula: 'H₃N⁺–P₃–P₂–P₁ ✂ P₁′–P₂′–P₃′–COO⁻',
    cleavageMode: 'metalloendo',
    cofactorOrDyad: 'Zn²⁺ · HEXXH',
    productLabel: 'Oligopeptides',
    summary:
      'Extracellular zinc-dependent thermolysins, bacillolysins, and fungal deuterolysins dominating neutral-to-alkaline agricultural and grassland protein depolymerization.',
    mechanism:
      'A catalytic Zn²⁺ cofactor coordinated by two His and a third Glu/His polarizes a bound water molecule while an adjacent active-site Glu acts as general base for direct single-step internal peptide hydrolysis.',
    canonicalExamples: [
      'Thermolysin / Bacillolysin NprE (Bacillus)',
      'Neutral protease II NpiIC (Aspergillus)',
      'Pseudolysin LasB (Pseudomonas)',
    ],
    conservedMotifs: [
      'HEXXH + distal Glu/Asp Zn²⁺ ligands (M4)',
      'HEXXH + third His deuterolysin motif (M35)',
      'S₁′ hydrophobic specificity pocket',
    ],
    proteins: '1,647',
    mcc: '0.994',
    auroc: '1.000',
    ecs: [
      '3.4.24.3',
      '3.4.24.11',
      '3.4.24.28',
      '3.4.24.39',
      '3.4.24.59',
      '3.4.24.64',
      '3.4.24.69',
      '3.4.24.84',
    ],
  },
  {
    key: 'cysteine',
    code: 'CEP',
    classId: 'C07',
    modelHead: 'M7',
    name: 'Cysteine Endopeptidases',
    ecPrefix: 'EC 3.4.22',
    stage: 'depolymerization',
    stageShort: 'Step 1 · Endo',
    stageLabel: 'Step 1 · Extracellular Depolymerization',
    compartment: 'Reducing Soil Microsites & Necromass',
    scissileFormula: 'H₃N⁺–P₃–P₂–P₁ ✂ P₁′–P₂′–P₃′–COO⁻',
    cleavageMode: 'cysendo',
    cofactorOrDyad: 'Cys-S⁻ · His⁺ Dyad',
    productLabel: 'Oligopeptides',
    summary:
      'Papain-like, cathepsin, and clostripain thiol endopeptidases active across anoxic/reducing soil aggregates, root turnover zones, and microbial necromass recycling.',
    mechanism:
      'A preformed Cys-thiolate / His-imidazolium ion pair attacks internal scissile peptide bonds via a covalent acyl-thioester intermediate, followed by His-assisted hydrolytic deacylation.',
    canonicalExamples: [
      'Clostripain ClosI (Clostridium)',
      'Papain / Cathepsin-fold thiol proteases (C1)',
      'Caspase-like & legumain endopeptidases',
    ],
    conservedMotifs: [
      'Catalytic Cys–His dyad + Asn orienter',
      'Conserved Gln oxyanion residue',
      'MEROPS C1, C11 & C14 folds',
    ],
    proteins: '921',
    mcc: '0.977',
    auroc: '1.000',
    ecs: ['3.4.22.15', '3.4.22.28', '3.4.22.50', '3.4.22.66'],
  },
  {
    key: 'aspartic',
    code: 'AEP',
    classId: 'C08',
    modelHead: 'M8',
    name: 'Aspartic Endopeptidases',
    ecPrefix: 'EC 3.4.23',
    stage: 'depolymerization',
    stageShort: 'Step 1 · Endo',
    stageLabel: 'Step 1 · Extracellular Depolymerization',
    compartment: 'Acidic Forest & Rhizosphere Horizons',
    scissileFormula: 'H₃N⁺–P₃–P₂–P₁ ✂ P₁′–P₂′–P₃′–COO⁻',
    cleavageMode: 'aspendo',
    cofactorOrDyad: 'Asp⁻ · Asp-OH Dyad',
    productLabel: 'Oligopeptides',
    summary:
      'Fungal pepsin-like acid proteases and prokaryotic membrane signal/prepilin peptidases driving polypeptide cleavage in low-pH forest, peat, and rhizosphere soils.',
    mechanism:
      'Two coplanar catalytic Asp carboxylates (one ionized, one protonated) activate an inter-dyad water molecule for general acid–base attack without forming a covalent enzyme–substrate intermediate.',
    canonicalExamples: [
      'Aspergillopepsin I PepA (Aspergillus)',
      'Lipoprotein signal peptidase LspA',
      'Type IV prepilin peptidase PilD',
    ],
    conservedMotifs: [
      'Paired Asp-Thr/Ser-Gly (DTG/DSG) motifs',
      'Flexible β-hairpin active-site flap (A1)',
      'Membrane-embedded Asp dyad (A8 / A24)',
    ],
    proteins: '894',
    mcc: '0.987',
    auroc: '1.000',
    ecs: ['3.4.23.24', '3.4.23.36', '3.4.23.43'],
  },
  {
    key: 'aminopeptidases',
    code: 'AP',
    classId: 'C01',
    modelHead: 'M1',
    name: 'Aminopeptidases',
    ecPrefix: 'EC 3.4.11',
    stage: 'oligopeptide',
    stageShort: 'Step 2 · Exo/Di',
    stageLabel: 'Step 2 · Oligopeptide & Dipeptide Cleavage',
    compartment: 'Microbial Cell Envelope & Periplasm',
    scissileFormula: 'H₃N⁺–[P₁] ✂ P₁′–P₂′–P₃′–COO⁻',
    cleavageMode: 'nterm_mono',
    cofactorOrDyad: '2×Zn²⁺ / Co²⁺ / Mn²⁺',
    productLabel: 'Free N-term L-AA',
    summary:
      'Leucyl, alanyl, prolyl, and methionyl exopeptidases (standard soil LAP enzyme-assay markers) that liberate directly assimilable L-amino acids from the unblocked N-terminus of oligopeptides.',
    mechanism:
      'Anchors the free N-terminal α-amino group in a negatively charged pocket while a mono- or dinuclear metal center (Zn²⁺, Co²⁺, or Mn²⁺) hydrolyzes the first peptide bond sequentially.',
    canonicalExamples: [
      'Leucyl aminopeptidase PepA (Streptomyces / Pseudomonas)',
      'Membrane alanyl aminopeptidase PepN',
      'Methionyl aminopeptidase Map',
      'Prolyl iminopeptidase Pip',
    ],
    conservedMotifs: [
      'GAMEN N-terminal recognition motif (M1)',
      'NTDAEGRL binuclear Zn²⁺ cluster (M17)',
      'Co²⁺/Mn²⁺ pita-bread fold (M24A)',
    ],
    proteins: '1,195',
    mcc: '0.978',
    auroc: '1.000',
    ecs: ['3.4.11.2', '3.4.11.4', '3.4.11.5', '3.4.11.9', '3.4.11.18', '3.4.11.21'],
  },
  {
    key: 'dipeptidyl',
    code: 'DPP',
    classId: 'C03',
    modelHead: 'M3',
    name: 'Dipeptidyl-Peptidases',
    ecPrefix: 'EC 3.4.14',
    stage: 'oligopeptide',
    stageShort: 'Step 2 · Exo/Di',
    stageLabel: 'Step 2 · Oligopeptide & Dipeptide Cleavage',
    compartment: 'Periplasm & Outer Membrane',
    scissileFormula: 'H₃N⁺–[P₂–P₁] ✂ P₁′–P₂′–COO⁻',
    cleavageMode: 'nterm_di',
    cofactorOrDyad: 'Ser–Asp–His / Zn²⁺',
    productLabel: 'Xaa–Yaa Dipeptide',
    summary:
      'N-terminal dipeptide-releasing exopeptidases strongly expanded across Bacteroidota and fungal soil saprotrophs that feed peptide permease uptake pathways.',
    mechanism:
      'A conserved Glu-rich N-terminal anchor positions the substrate α-NH₃⁺ exactly two residue lengths from a Ser–Asp–His triad (S9B) or HELLGH Zn²⁺ site (M49), excising intact Xaa–Yaa dipeptides.',
    canonicalExamples: [
      'Dipeptidyl-peptidase IV DppIV (Flavobacterium / Chitinophaga)',
      'Dipeptidyl-peptidase III Dpp3 (Yeast / Fungi)',
      'Xaa-Pro dipeptidyl-peptidase PepX',
    ],
    conservedMotifs: [
      '8-blade β-propeller + α/β-hydrolase (S9B)',
      'GWSYG nucleophilic Ser elbow',
      'HELLGH zinc-binding hexapeptide (M49)',
    ],
    proteins: '226',
    mcc: '0.822',
    auroc: '0.997',
    ecs: ['3.4.14.4', '3.4.14.5', '3.4.14.10', '3.4.14.11'],
  },
  {
    key: 'omega',
    code: 'OP',
    classId: 'C05',
    modelHead: 'M5',
    name: 'Omega Peptidases',
    ecPrefix: 'EC 3.4.19',
    stage: 'oligopeptide',
    stageShort: 'Step 2 · Exo/Di',
    stageLabel: 'Step 2 · Oligopeptide & Dipeptide Cleavage',
    compartment: 'Periplasmic & Cytosolic Scavenging',
    scissileFormula: 'pGlu / γ-Glu / Iso-[X] ✂ Peptide–COO⁻',
    cleavageMode: 'omega',
    cofactorOrDyad: 'Cys–His–Asp / Ntn',
    productLabel: 'Unblocked Peptide',
    summary:
      'Specialized peptidases cleaving non-α peptide bonds, cyclized pyroglutamyl caps, γ-glutamyl linkages, and ubiquitin/isopeptide branches resistant to canonical aminopeptidases.',
    mechanism:
      'Hydrolyzes amide bonds involving side-chain carboxylates (γ-Glu, β-Asp), N-terminal 5-oxoproline rings, or C-terminal Gly-isopeptide conjugates via Cys–His–Asp or N-terminal nucleophile chemistry.',
    canonicalExamples: [
      'Pyroglutamyl-peptidase I Pcp (Bacillus / Pseudomonas)',
      'γ-Glutamyl hydrolase Ggh',
      'Ubiquitin C-terminal hydrolase Ubp / Uch',
    ],
    conservedMotifs: [
      'Cys–His–Glu/Asp pyroglutamyl triad (C15)',
      'Class I glutamine amidotransferase-like fold (C26)',
      'UCH Cys–His–Asp crossover loop (C12/C19)',
    ],
    proteins: '727',
    mcc: '0.969',
    auroc: '1.000',
    ecs: ['3.4.19.3', '3.4.19.12', '3.4.19.13'],
  },
  {
    key: 'metallopeptidases',
    code: 'MP',
    classId: 'C04',
    modelHead: 'M4',
    name: 'Metallopeptidases (Carboxy)',
    ecPrefix: 'EC 3.4.17',
    stage: 'oligopeptide',
    stageShort: 'Step 2 · Exo/Di',
    stageLabel: 'Step 2 · Oligopeptide & Dipeptide Cleavage',
    compartment: 'Extracellular & Periplasmic Interface',
    scissileFormula: 'H₃N⁺–P₃–P₂–P₁ ✂ [P₁′]–COO⁻',
    cleavageMode: 'cterm_mono',
    cofactorOrDyad: 'Zn²⁺ · Arg Clamp',
    productLabel: 'Free C-term L-AA',
    summary:
      'Metal-dependent metallocarboxypeptidases (including glutamate carboxypeptidases) that trim monomeric amino acids from the C-terminus of oligopeptides.',
    mechanism:
      'Positively charged Arg/Asn side chains salt-bridge the substrate C-terminal α-carboxylate while an active-site Zn²⁺ polarizes the penultimate carbonyl for C-terminal exolytic cleavage.',
    canonicalExamples: [
      'Glutamate carboxypeptidase Gcp / Cpg2 (Pseudomonas / Fungi)',
      'Thermostable carboxypeptidase Csp',
      'Metallocarboxypeptidase M14 / M20',
    ],
    conservedMotifs: [
      'HXXE + His Zn²⁺ coordination (M14)',
      'Dinuclear Zn²⁺ His/Asp/Glu bridge (M20)',
      'Conserved C-terminal COO⁻ Arg-clamp',
    ],
    proteins: '193',
    mcc: '0.911',
    auroc: '0.994',
    ecs: ['3.4.17.21'],
  },
  {
    key: 'dipeptidases',
    code: 'DP',
    classId: 'C02',
    modelHead: 'M2',
    name: 'Dipeptidases',
    ecPrefix: 'EC 3.4.13',
    stage: 'oligopeptide',
    stageShort: 'Step 2 · Exo/Di',
    stageLabel: 'Step 2 · Oligopeptide & Dipeptide Cleavage',
    compartment: 'Microbial Cytosol & Periplasm',
    scissileFormula: 'H₃N⁺–[P₁] ✂ [P₁′]–COO⁻',
    cleavageMode: 'dipeptide',
    cofactorOrDyad: '2×Zn²⁺ / Mn²⁺ Ruler',
    productLabel: '2 × Free L-AA',
    summary:
      'Strict length-gated dipeptidases and Xaa-Pro prolidases that split imported dipeptides into two free monomeric L-amino acids ready for deamination or biosynthesis.',
    mechanism:
      'Simultaneously engages both the N-terminal α-NH₃⁺ and C-terminal α-COO⁻ within a closed active-site cavity, restricting catalysis exclusively to two-residue dipeptides.',
    canonicalExamples: [
      'Xaa-Pro dipeptidase / Prolidase PepQ',
      'Broad-specificity dipeptidase PepD / PepV',
      'Cys-Gly metallodipeptidase Dug1',
    ],
    conservedMotifs: [
      'Dual N-NH₃⁺ / C-COO⁻ electrostatic ruler',
      'Dinuclear Mn²⁺/Zn²⁺ pita-bread fold (M24B)',
      'M20A homodimeric lid domain',
    ],
    proteins: '191',
    mcc: '0.826',
    auroc: '0.992',
    ecs: ['3.4.13.9', '3.4.13.19', '3.4.13.21'],
  },
  {
    key: 'amidohydrolases',
    code: 'AH',
    classId: 'C10',
    modelHead: 'M10',
    name: 'Amidohydrolases',
    ecPrefix: 'EC 3.5.1',
    stage: 'ammonification',
    stageShort: 'Step 3 · Amide',
    stageLabel: 'Step 3 · Terminal Deamination & Ammonification',
    compartment: 'Microbial Cytosol & Rhizosphere Solution',
    scissileFormula: 'R–C(=O)–NH₂ + H₂O ✂ R–COO⁻ + NH₄⁺',
    cleavageMode: 'amide',
    cofactorOrDyad: '2×Ni²⁺ / Ser–Lys / Thr',
    productLabel: 'Bioavailable NH₄⁺',
    summary:
      'Ureases, glutaminases, L-asparaginases, aliphatic amidases, and peptidoglycan amidohydrolases catalyzing the final C–N bond cleavage that releases plant-assimilable ammonium (NH₄⁺).',
    mechanism:
      'Hydrolyzes non-peptide linear carbon–nitrogen amide bonds in urea, L-Gln, L-Asn, and short amides via binuclear Ni²⁺ hydroxide bridging (urease) or Ser/Thr/Cys acyl-enzyme nucleophiles.',
    canonicalExamples: [
      'Urease UreABC (Streptomyces / Nitrososphaera)',
      'Glutaminase GlsA (EC 3.5.1.2)',
      'L-Asparaginase AnsA/B (EC 3.5.1.1)',
      'Aliphatic amidase AmiE & Muramoyl amidase',
    ],
    conservedMotifs: [
      'Carbamylated Lys + binuclear Ni²⁺ TIM barrel (Urease)',
      'GGSS(S/G)GS amidase signature Ser–cisSer–Lys',
      'N-terminal Thr catalytic triad (Asparaginase)',
    ],
    proteins: '2,139',
    mcc: '0.988',
    auroc: '1.000',
    ecs: ['3.5.1.1', '3.5.1.2', '3.5.1.4', '3.5.1.5', '3.5.1.11', '3.5.1.28'],
  },
] as const;
