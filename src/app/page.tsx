'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowRight,
  BookOpen,
  Boxes,
  CheckCircle2,
  FlaskConical,
  Layers,
  Sparkles,
  Terminal,
} from 'lucide-react';
import mineralizationHero from '../../public/minpred-mineralization-hero.png';
import type { DemoSequenceKey } from '@/data/demo-sequences';

type ClassEntry = {
  key: DemoSequenceKey;
  code: string;
  short: string;
  name: string;
  ecPrefix: string;
  stage: 'depolymerization' | 'oligopeptide' | 'ammonification';
  reaction: string;
  description: string;
  proteins: string;
  mcc: string;
  auroc: string;
  ecs: readonly string[];
};

const CLASSES: readonly ClassEntry[] = [
  {
    key: 'serine',
    code: 'C06',
    short: 'SEP',
    name: 'Serine endopeptidases',
    ecPrefix: 'EC 3.4.21',
    stage: 'depolymerization',
    reaction: 'Polymeric protein → Oligopeptides (internal Ser-dependent cleavage)',
    description:
      'Extracellular subtilisins, trypsins, and leader/signal peptidases that initiate high-molecular-weight soil protein depolymerization.',
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
    code: 'C09',
    short: 'MEP',
    name: 'Metalloendopeptidases',
    ecPrefix: 'EC 3.4.24',
    stage: 'depolymerization',
    reaction: 'Polymeric protein → Oligopeptides (Zn²⁺/metal-activated internal cleavage)',
    description:
      'Thermolysins, fungal deuterolysins, and neutral metalloproteases abundant across saprotrophic soil bacteria and fungi.',
    proteins: '1,647',
    mcc: '0.994',
    auroc: '1.000',
    ecs: ['3.4.24.3', '3.4.24.11', '3.4.24.28', '3.4.24.39', '3.4.24.59', '3.4.24.64', '3.4.24.69', '3.4.24.84'],
  },
  {
    key: 'cysteine',
    code: 'C07',
    short: 'CEP',
    name: 'Cysteine endopeptidases',
    ecPrefix: 'EC 3.4.22',
    stage: 'depolymerization',
    reaction: 'Polymeric protein → Oligopeptides (thiol-dependent internal hydrolysis)',
    description:
      'Papain-like, cathepsin, and clostripain thiol proteases active in reducing microsites and cellular organic-nitrogen turnover.',
    proteins: '921',
    mcc: '0.977',
    auroc: '1.000',
    ecs: ['3.4.22.15', '3.4.22.28', '3.4.22.50', '3.4.22.66'],
  },
  {
    key: 'aspartic',
    code: 'C08',
    short: 'AEP',
    name: 'Aspartic endopeptidases',
    ecPrefix: 'EC 3.4.23',
    stage: 'depolymerization',
    reaction: 'Polymeric protein → Oligopeptides (acidic dyad internal cleavage)',
    description:
      'Acidic endopeptidases and lipoprotein signal peptidases catalyzing peptide cleavage across acidic forest and rhizosphere soils.',
    proteins: '894',
    mcc: '0.987',
    auroc: '1.000',
    ecs: ['3.4.23.24', '3.4.23.36', '3.4.23.43'],
  },
  {
    key: 'aminopeptidases',
    code: 'C01',
    short: 'AP',
    name: 'Aminopeptidases',
    ecPrefix: 'EC 3.4.11',
    stage: 'oligopeptide',
    reaction: 'Oligopeptides → Free N-terminal L-amino acids',
    description:
      'Leucyl, alanyl, prolyl, and methionyl aminopeptidases liberating assimilable monomeric amino acids from oligopeptide termini.',
    proteins: '1,195',
    mcc: '0.978',
    auroc: '1.000',
    ecs: ['3.4.11.2', '3.4.11.4', '3.4.11.5', '3.4.11.9', '3.4.11.18', '3.4.11.21'],
  },
  {
    key: 'omega',
    code: 'C05',
    short: 'OP',
    name: 'Omega peptidases',
    ecPrefix: 'EC 3.4.19',
    stage: 'oligopeptide',
    reaction: 'Isopeptide / pyroglutamyl termini → Unblocked peptides & amino acids',
    description:
      'Pyroglutamyl-peptidases, γ-glutamyl hydrolases, and ubiquitin/isopeptide hydrolases cleaving non-α-peptide linkages.',
    proteins: '727',
    mcc: '0.969',
    auroc: '1.000',
    ecs: ['3.4.19.3', '3.4.19.12', '3.4.19.13'],
  },
  {
    key: 'dipeptidyl',
    code: 'C03',
    short: 'DPP',
    name: 'Dipeptidyl-peptidases',
    ecPrefix: 'EC 3.4.14',
    stage: 'oligopeptide',
    reaction: 'Oligopeptides → Dipeptides (N-terminal Xaa-Yaa release)',
    description:
      'Dipeptidyl and tripeptidyl exopeptidases (expanded in Bacteroidota saprotrophs) processing oligopeptides into assimilable dipeptides.',
    proteins: '226',
    mcc: '0.822',
    auroc: '0.997',
    ecs: ['3.4.14.4', '3.4.14.5', '3.4.14.10', '3.4.14.11'],
  },
  {
    key: 'metallopeptidases',
    code: 'C04',
    short: 'MP',
    name: 'Metallopeptidases',
    ecPrefix: 'EC 3.4.17',
    stage: 'oligopeptide',
    reaction: 'Oligopeptides → Free C-terminal amino acids',
    description:
      'Metal-dependent metallocarboxypeptidases (including glutamate carboxypeptidases) releasing C-terminal residues from peptides.',
    proteins: '193',
    mcc: '0.911',
    auroc: '0.994',
    ecs: ['3.4.17.21'],
  },
  {
    key: 'dipeptidases',
    code: 'C02',
    short: 'DP',
    name: 'Dipeptidases',
    ecPrefix: 'EC 3.4.13',
    stage: 'oligopeptide',
    reaction: 'Dipeptides → Two monomeric amino acids',
    description:
      'Xaa-Pro, cysteinylglycine, and broad-specificity cytosolic/periplasmic dipeptidases completing peptide monomerization.',
    proteins: '191',
    mcc: '0.826',
    auroc: '0.992',
    ecs: ['3.4.13.9', '3.4.13.19', '3.4.13.21'],
  },
  {
    key: 'amidohydrolases',
    code: 'C10',
    short: 'AH',
    name: 'Amidohydrolases',
    ecPrefix: 'EC 3.5.1',
    stage: 'ammonification',
    reaction: 'Urea, Gln, Asn & linear amides → Plant-available NH₄⁺',
    description:
      'Urease, glutaminase, L-asparaginase, amidase, penicillin amidase, and muramoyl-L-alanine amidase driving terminal ammonification.',
    proteins: '2,139',
    mcc: '0.988',
    auroc: '1.000',
    ecs: ['3.5.1.1', '3.5.1.2', '3.5.1.4', '3.5.1.5', '3.5.1.11', '3.5.1.28'],
  },
] as const;

const STAGES = [
  {
    id: 'depolymerization',
    step: 'Step 1',
    title: 'Polypeptide Depolymerization',
    subtitle: 'Endopeptidases (C06–C09)',
  },
  {
    id: 'oligopeptide',
    step: 'Step 2',
    title: 'Oligopeptide & Dipeptide Cleavage',
    subtitle: 'Exopeptidases & dipeptidases (C01–C05)',
  },
  {
    id: 'ammonification',
    step: 'Step 3',
    title: 'Deamination & NH₄⁺ Release',
    subtitle: 'Linear C–N amidohydrolases (C10)',
  },
] as const;

const CASCADE_STEPS = [
  {
    gate: 'Gate I',
    name: 'Catalytic Enzyme Screen',
    scope: 'Enzyme vs. DIAMOND-decontaminated non-enzyme',
    cutoff: '<40% seq id',
    metric: 'MCC 0.954 · AUROC 0.998',
    widthClass: 'w-full',
  },
  {
    gate: 'Gate II',
    name: 'N-Mineralization Filter',
    scope: 'Target N-hydrolases vs. 222,170 other EC enzymes (incl. EC 3.4/3.5 controls)',
    cutoff: '<40% seq id',
    metric: 'MCC 0.936 · AUROC 0.998',
    widthClass: 'sm:w-[94%]',
  },
  {
    gate: 'Gate III',
    name: '10-Class Functional Router',
    scope: 'Assigns C01–C10 peptidase & amidohydrolase families',
    cutoff: '<60% seq id',
    metric: 'MCC 0.975 · Macro AUROC 0.998',
    widthClass: 'sm:w-[88%]',
  },
  {
    gate: 'Gate IV',
    name: 'Class-Specific 4-Digit EC (M1–M10)',
    scope: '52 explicit IUBMB four-digit ECs + class-conditional Others',
    cutoff: '<60% seq id',
    metric: '96.1% Acc · MCC 0.955',
    widthClass: 'sm:w-[82%]',
  },
] as const;

export default function Home() {
  const [selectedKey, setSelectedKey] = useState<DemoSequenceKey>('amidohydrolases');
  const activeClass = CLASSES.find((item) => item.key === selectedKey) ?? CLASSES[9];

  return (
    <div className="space-y-12 py-4 pb-14 sm:space-y-16 sm:py-8">
      {/* BAND 1: Full-Bleed White Showcase Stage with Seamless Soil-Protein Illustration */}
      <section className="reveal overflow-hidden rounded-2xl border border-[var(--line)] bg-white shadow-[0_20px_55px_rgba(15,36,57,.07)]">
        <div className="relative grid items-center lg:grid-cols-[1.12fr_.88fr]">
          <div className="relative z-10 p-6 sm:p-10 lg:py-12 lg:pl-12 lg:pr-6">
            <div className="inline-flex flex-wrap items-center gap-2 rounded-full border border-[#b8dce5] bg-[var(--mineral-soft)] px-3.5 py-1 text-xs font-bold text-[var(--mineral)]">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Polymeric Protein → Peptides → Amino Acids → NH₄⁺</span>
            </div>

            <h1 className="mt-5 font-display text-4xl font-bold leading-[1.06] text-[var(--forest-dark)] sm:text-5xl">
              Hierarchical EC annotation for soil nitrogen mineralization.
            </h1>

            <p className="mt-4 max-w-xl text-base leading-7 text-[var(--muted)] sm:text-[17px]">
              MINpred pairs overlap-averaged 33-layer <strong>ESM-2 (650M)</strong> sequence representations with{' '}
              <strong>13 regularized neural classifiers</strong> to resolve extracellular peptidases and linear C–N
              amidohydrolases down to four-digit Enzyme Commission numbers—without alignment databases.
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link href="/prediction" className="btn-primary !px-5 !py-3">
                Open Prediction Workbench <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link href="/prediction?example=mixed" className="btn-secondary !px-4 !py-3">
                <FlaskConical className="h-4 w-4 text-[var(--mineral)]" aria-hidden="true" />
                Try 10-Class Demo
              </Link>
              <Link
                href="/download"
                className="px-2 py-2 text-xs font-extrabold text-[var(--forest)] underline decoration-[var(--mineral)] underline-offset-4 hover:text-[var(--forest-dark)]"
              >
                Standalone Python CLI →
              </Link>
            </div>
          </div>

          {/* Right Artwork Stage (white-seamless blend into bottom-right corner) */}
          <div className="relative flex min-h-[260px] items-end justify-end bg-white pt-2 lg:min-h-[410px]">
            <Image
              src={mineralizationHero}
              alt="Folded enzyme structure depolymerizing soil organic nitrogen into plant-available ammonium near roots"
              className="h-auto max-h-[380px] w-full object-contain object-right-bottom"
              priority
            />
          </div>
        </div>

        {/* Integrated 4-Column Telemetry Strip */}
        <dl className="grid grid-cols-2 divide-x divide-y divide-[var(--line)] border-t border-[var(--line)] bg-[#f8fafd] lg:grid-cols-4 lg:divide-y-0">
          {[
            ['457,321', 'Swiss-Prot 2026_04 QC sequences', '135,425 strict non-enzymes'],
            ['13 Neural Heads', 'Bundled .keras + .npz weights', 'Phases I–III + M1–M10'],
            ['10 Classes · 52 ECs', 'EC 3.4 peptidases & EC 3.5.1', 'Plus class-specific Others'],
            ['0.936–0.975 MCC', 'Homology-disjoint test splits', '<40% / <60% single-linkage'],
          ].map(([value, title, sub]) => (
            <div key={title} className="px-5 py-4 sm:px-6">
              <dt className="text-xs font-bold text-[var(--forest-dark)]">{title}</dt>
              <dd className="mt-1 font-display text-2xl font-bold text-[var(--forest)]">{value}</dd>
              <p className="mt-0.5 font-mono text-[11px] text-[var(--muted)]">{sub}</p>
            </div>
          ))}
        </dl>
      </section>

      {/* BAND 2: Interactive Soil N-Mineralization Pathway & 10-Class EC Explorer */}
      <section className="space-y-5" aria-labelledby="repertoire-heading">
        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
          <div>
            <p className="eyebrow">Biochemical Scope &amp; Phase IV Coverage</p>
            <h2
              id="repertoire-heading"
              className="mt-1 font-display text-3xl font-bold text-[var(--forest-dark)]"
            >
              Explore the 10 nitrogen-mineralization classes
            </h2>
          </div>
          <p className="max-w-md text-xs leading-5 text-[var(--muted)] sm:text-right">
            Select any functional class along the three biochemical cleavage steps to inspect its explicit four-digit
            EC coverage and held-out test metrics.
          </p>
        </div>

        <div className="grid items-start gap-6 lg:grid-cols-[1.05fr_1.15fr]">
          {/* Left: 3 Biochemical Stages with Radio Class Selector */}
          <fieldset className="surface p-4 sm:p-5 space-y-4">
            <legend className="visually-hidden">Select a nitrogen-mineralization enzyme class</legend>
            {STAGES.map((stage) => {
              const stageClasses = CLASSES.filter((c) => c.stage === stage.id);
              return (
                <div key={stage.id} className="space-y-2">
                  <div className="flex items-baseline justify-between border-b border-[var(--line)] pb-1.5">
                    <span className="text-xs font-extrabold text-[var(--forest-dark)]">
                      <span className="mr-1.5 font-mono text-[var(--mineral)]">{stage.step} ·</span>
                      {stage.title}
                    </span>
                    <span className="font-mono text-[11px] text-[var(--muted)]">{stage.subtitle}</span>
                  </div>
                  <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                    {stageClasses.map((cls) => {
                      const active = cls.key === selectedKey;
                      return (
                        <label key={cls.key} className="cursor-pointer">
                          <input
                            type="radio"
                            name="explorerClass"
                            value={cls.key}
                            checked={active}
                            onChange={() => setSelectedKey(cls.key)}
                            className="visually-hidden seg-radio"
                          />
                          <span
                            className={`flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-xs transition ${
                              active
                                ? 'border-[var(--forest)] bg-[var(--forest)] text-white shadow-sm'
                                : 'border-[var(--line)] bg-[var(--canvas)] text-[var(--forest-dark)] hover:border-[var(--mineral)] hover:bg-white'
                            }`}
                          >
                            <span className="truncate font-bold">
                              <span
                                className={`mr-1.5 font-mono text-[11px] ${
                                  active ? 'text-sky-200' : 'text-[var(--mineral)]'
                                }`}
                              >
                                {cls.code}
                              </span>
                              {cls.name}
                            </span>
                            <span
                              className={`shrink-0 font-mono text-[11px] ${
                                active ? 'text-sky-100' : 'text-[var(--muted)]'
                              }`}
                            >
                              {cls.ecs.length} EC{cls.ecs.length === 1 ? '' : 's'}
                            </span>
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </fieldset>

          {/* Right: Live Selected Class Inspection Card */}
          <article className="surface p-6 sm:p-7 space-y-5 lg:sticky lg:top-24" aria-live="polite">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--line)] pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="rounded bg-[var(--mineral-soft)] px-2 py-0.5 font-mono text-xs font-extrabold text-[var(--mineral)]">
                    {activeClass.code} · {activeClass.short}
                  </span>
                  <span className="font-mono text-xs font-bold text-[var(--muted)]">
                    {activeClass.ecPrefix}
                  </span>
                </div>
                <h3 className="mt-2 font-display text-2xl font-bold text-[var(--forest-dark)]">
                  {activeClass.name}
                </h3>
              </div>

              <div className="flex gap-2 text-right font-mono text-xs">
                <div className="rounded-lg border border-[var(--line)] bg-[var(--canvas)] px-3 py-1.5">
                  <div className="text-[10px] uppercase text-[var(--muted)]">Test MCC</div>
                  <div className="font-extrabold text-[var(--forest)]">{activeClass.mcc}</div>
                </div>
                <div className="rounded-lg border border-[var(--line)] bg-[var(--canvas)] px-3 py-1.5">
                  <div className="text-[10px] uppercase text-[var(--muted)]">AUROC</div>
                  <div className="font-extrabold text-[var(--mineral)]">{activeClass.auroc}</div>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-[#b8dce5] bg-[var(--mineral-soft)]/65 px-3.5 py-2.5 text-xs">
              <span className="font-extrabold text-[var(--mineral)]">Catalytic role: </span>
              <span className="font-semibold text-[var(--forest-dark)]">{activeClass.reaction}</span>
            </div>

            <p className="text-sm leading-6 text-[var(--muted)]">{activeClass.description}</p>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-extrabold text-[var(--forest-dark)]">
                  Explicit Phase IV EC outputs ({activeClass.ecs.length}) + class-conditional Others
                </span>
                <span className="font-mono text-[var(--muted)]">
                  {activeClass.proteins} Swiss-Prot seqs
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {activeClass.ecs.map((ec) => (
                  <a
                    key={ec}
                    href={`https://www.brenda-enzymes.org/enzyme.php?ecno=${ec}`}
                    target="_blank"
                    rel="noreferrer"
                    title={`View EC ${ec} in BRENDA`}
                    className="rounded-md border border-[var(--line)] bg-[var(--canvas)] px-2.5 py-1 font-mono text-xs font-bold text-[var(--forest-dark)] transition hover:border-[var(--mineral)] hover:bg-white hover:text-[var(--mineral)]"
                  >
                    {ec}
                  </a>
                ))}
                <span className="rounded-md border border-dashed border-[var(--field-border)] px-2.5 py-1 font-mono text-xs text-[var(--muted)]">
                  Others
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--line)] pt-4">
              <Link
                href={`/prediction?example=${activeClass.key}`}
                className="btn-primary !py-2.5 !px-4 !text-xs"
              >
                Load {activeClass.name} example in Workbench{' '}
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
              <Link
                href="/help#classes"
                className="text-xs font-bold text-[var(--forest)] underline underline-offset-4 hover:text-[var(--forest-dark)]"
              >
                Full EC reference →
              </Link>
            </div>
          </article>
        </div>
      </section>

      {/* BAND 3: Asymmetric Architectural Bento Grid (Funnel Cascade + Sliding-Window + Ecosystem) */}
      <section className="grid gap-6 lg:grid-cols-12" aria-label="Architecture and deployment">
        {/* Left 7 Cols: Dark USU Navy Stepped Funnel Card */}
        <div className="rounded-2xl bg-[#0f2439] p-6 text-white shadow-[0_18px_45px_rgba(15,36,57,.16)] sm:p-8 lg:col-span-7">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/12 pb-4">
            <div>
              <p className="font-mono text-xs font-bold uppercase tracking-[.14em] text-sky-300">
                Hierarchical Screening Funnel
              </p>
              <h2 className="mt-1 font-display text-2xl font-bold text-white sm:text-3xl">
                Cumulative four-gate filtering
              </h2>
            </div>
            <span className="rounded-md bg-white/10 px-2.5 py-1 font-mono text-xs font-semibold text-sky-200">
              1,280-d ESM-2 · AdamW MLP
            </span>
          </div>

          <p className="mt-3 text-xs leading-5 text-slate-300 sm:text-sm">
            Every query sequence is embedded once on GPU and routed sequentially—non-enzymes and non-target EC 3.4 /
            3.5 hydrolases are rejected before fine-grained EC assignment.
          </p>

          <div className="mt-5 space-y-2.5">
            {CASCADE_STEPS.map((step) => (
              <div
                key={step.gate}
                className={`${step.widthClass} rounded-xl border border-white/12 bg-white/[0.06] px-4 py-3 transition hover:bg-white/[0.1]`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="rounded bg-[#0b7285] px-2 py-0.5 font-mono text-xs font-bold text-white">
                      {step.gate}
                    </span>
                    <h3 className="text-sm font-extrabold text-white">{step.name}</h3>
                  </div>
                  <div className="flex items-center gap-2 font-mono text-xs">
                    <span className="text-slate-300">{step.cutoff}</span>
                    <span className="rounded bg-sky-400/15 px-2 py-0.5 font-bold text-sky-200">
                      {step.metric}
                    </span>
                  </div>
                </div>
                <p className="mt-1 text-xs text-slate-300">{step.scope}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Right 5 Cols: Two Stacked Method & Tooling Bento Cards */}
        <div className="grid gap-6 lg:col-span-5">
          {/* Card A: Overlap-Averaged Sliding Window (>1,022 aa) */}
          <article className="surface p-6 space-y-3">
            <div className="flex items-center justify-between">
              <span className="eyebrow !text-[11px]">Full-Length Representation</span>
              <Layers className="h-4 w-4 text-[var(--mineral)]" aria-hidden="true" />
            </div>
            <h3 className="font-display text-xl font-bold text-[var(--forest-dark)]">
              Zero-truncation windowing for long proteases
            </h3>
            <p className="text-xs leading-5 text-[var(--muted)] sm:text-sm">
              Extracellular soil proteases frequently exceed ESM-2&apos;s native 1,022-residue context limit. MINpred
              averages overlapping 1,022-aa windows at a 511-aa stride plus a terminal window{' '}
              <code className="font-mono text-xs">[L−1022:L]</code>, preserving C-terminal catalytic domains with
              94.7%–100% test accuracy.
            </p>
            <div className="space-y-1.5 rounded-lg border border-[var(--line)] bg-[var(--canvas)] p-3 font-mono text-[11px]">
              <div className="flex items-center justify-between text-[var(--forest-dark)]">
                <span>Window 1 · [1 … 1,022]</span>
                <span className="h-2 w-28 rounded bg-[#1b365d]" />
              </div>
              <div className="flex items-center justify-between text-[var(--mineral)]">
                <span>Window 2 · [512 … 1,533]</span>
                <span className="h-2 w-28 translate-x-2 rounded bg-[#0b7285]" />
              </div>
              <div className="flex items-center justify-between text-[var(--muted)]">
                <span>Terminal · [L−1,022 … L]</span>
                <span className="h-2 w-24 translate-x-4 rounded bg-[#4a5d73]" />
              </div>
            </div>
          </article>

          {/* Card B: Standalone Python CLI & Web Structure Suite */}
          <article className="surface p-6 space-y-3">
            <div className="flex items-center justify-between">
              <span className="eyebrow !text-[11px]">Workstation, HPC &amp; Structure Suite</span>
              <Terminal className="h-4 w-4 text-[var(--forest)]" aria-hidden="true" />
            </div>
            <h3 className="font-display text-xl font-bold text-[var(--forest-dark)]">
              Web server + offline-ready Python CLI
            </h3>
            <p className="text-xs leading-5 text-[var(--muted)]">
              Inspect web predictions with interactive <strong>S4PRED</strong> secondary structures and{' '}
              <strong>ESMFold / SWISS-MODEL</strong> 3D models, or screen complete microbial proteomes locally with all
              13 checkpoints bundled inside the package:
            </p>
            <pre className="overflow-x-auto rounded-lg bg-[#0f2439] p-3 font-mono text-xs leading-5 text-sky-100">
              <code>{`uv run minpred -i proteome.faa -o results`}</code>
            </pre>
            <div className="flex flex-wrap items-center gap-4 pt-1 text-xs font-bold">
              <Link
                href="/download"
                className="inline-flex items-center gap-1 text-[var(--forest)] underline underline-offset-4 hover:text-[var(--forest-dark)]"
              >
                <Boxes className="h-3.5 w-3.5" aria-hidden="true" /> Download CLI &amp; .tar.gz
              </Link>
              <Link
                href="/help"
                className="inline-flex items-center gap-1 text-[var(--mineral)] underline underline-offset-4 hover:text-[var(--forest-dark)]"
              >
                <BookOpen className="h-3.5 w-3.5" aria-hidden="true" /> Documentation &amp; API limits
              </Link>
              <span className="inline-flex items-center gap-1 text-[var(--muted)]">
                <CheckCircle2 className="h-3.5 w-3.5 text-[var(--mineral)]" aria-hidden="true" /> MIT Licensed
              </span>
            </div>
          </article>
        </div>
      </section>
    </div>
  );
}
