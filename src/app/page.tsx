'use client';

import Link from 'next/link';
import { ArrowRight, Check, Copy, ExternalLink } from 'lucide-react';
import { useState } from 'react';
import CatalyticMechanismSVG from '@/components/CatalyticMechanismSVG';
import EsmCascadeSVG from '@/components/EsmCascadeSVG';
import SoilMineralizationCutawaySVG from '@/components/SoilMineralizationCutawaySVG';
import type { DemoSequenceKey } from '@/data/demo-sequences';
import {
  MINERALIZATION_CLASSES,
  type MineralizationClassInfo,
  type PathwayStageId,
} from '@/data/mineralization-classes';

const PATHWAY_STAGES: ReadonlyArray<{
  id: PathwayStageId;
  stepNum: string;
  title: string;
  equation: string;
}> = [
  {
    id: 'depolymerization',
    stepNum: 'STEP I',
    title: 'Extracellular Depolymerization',
    equation: '(Polypeptide)ₙ + H₂O → Oligopeptides',
  },
  {
    id: 'oligopeptide',
    stepNum: 'STEP II',
    title: 'Peptide Monomerization',
    equation: 'H₃N⁺–Peptide–COO⁻ → Free L-Amino Acids',
  },
  {
    id: 'ammonification',
    stepNum: 'STEP III',
    title: 'Terminal Ammonification',
    equation: 'R–CONH₂ + H₂O → R–COO⁻ + NH₄⁺',
  },
];

const GATE_SUMMARY = [
  {
    gate: 'Gate I',
    title: 'Catalytic Enzyme Screen',
    cutoff: '<40% seq id',
    acc: '97.7%',
    mcc: '0.954',
    detail:
      'Separates 233,358 EC-annotated enzymes from 135,425 DIAMOND-decontaminated strict non-enzymes.',
  },
  {
    gate: 'Gate II',
    title: 'N-Mineralization Filter',
    cutoff: '<40% seq id',
    acc: '99.1%',
    mcc: '0.936',
    detail:
      'Isolates 11,187 target N-mineralization hydrolases against 222,170 other EC enzymes (incl. EC 3.4/3.5 controls).',
  },
  {
    gate: 'Gate III',
    title: '10-Class Functional Router',
    cutoff: '<60% seq id',
    acc: '97.9%',
    mcc: '0.975',
    detail:
      'Assigns qualifying proteins across nine EC 3.4 peptidase subclasses and EC 3.5.1 linear C–N amidohydrolases.',
  },
  {
    gate: 'Gate IV',
    title: 'Specialist EC Heads (M1–M10)',
    cutoff: '<60% seq id',
    acc: '96.1%',
    mcc: '0.955',
    detail:
      'Routes each sequence to its dedicated class-specific predictor covering 52 explicit four-digit ECs + Others.',
  },
] as const;

const ALL_EXPLICIT_ECS = MINERALIZATION_CLASSES.flatMap((cls) =>
  cls.ecs.map((ec) => ({
    ec,
    classKey: cls.key,
    code: cls.code,
    classId: cls.classId,
    className: cls.name,
    stageShort: cls.stageShort,
  })),
);

const CLI_SNIPPET = `git clone https://github.com/usubioinfo/minpred.git
cd minpred && uv sync --python 3.12
uv run minpred -i example/test.fasta -o MINpred_results`;

const BIBTEX = `@software{Duhan2026MINpred,
  author  = {Duhan, Naveen and Norton, Jeanette M. and Kaundal, Rakesh},
  title   = {MINpred: A Hierarchical Protein Language Model Framework for Predicting Nitrogen-Mineralization Enzymes},
  year    = {2026},
  version = {1.0.0},
  url     = {https://kaabil.net/minpred}
}`;

export default function HomePage() {
  const [selectedKey, setSelectedKey] = useState<DemoSequenceKey>('serine');
  const [highlightedEc, setHighlightedEc] = useState<string>('3.4.21.62');
  const [copiedBib, setCopiedBib] = useState(false);
  const [copiedCli, setCopiedCli] = useState(false);

  const activeClass: MineralizationClassInfo =
    MINERALIZATION_CLASSES.find((item) => item.key === selectedKey) ?? MINERALIZATION_CLASSES[0];

  const handleSelectClass = (key: DemoSequenceKey) => {
    setSelectedKey(key);
    const found = MINERALIZATION_CLASSES.find((item) => item.key === key);
    if (found && !found.ecs.includes(highlightedEc)) {
      setHighlightedEc(found.ecs[0]);
    }
  };

  const handleSelectEcTile = (classKey: DemoSequenceKey, ec: string) => {
    setSelectedKey(classKey);
    setHighlightedEc(ec);
  };

  const copyBibtex = async () => {
    try {
      await navigator.clipboard.writeText(BIBTEX);
      setCopiedBib(true);
      window.setTimeout(() => setCopiedBib(false), 2200);
    } catch {
      // Clipboard unavailable in restricted contexts
    }
  };

  const copyCliCommand = async () => {
    try {
      await navigator.clipboard.writeText(CLI_SNIPPET);
      setCopiedCli(true);
      window.setTimeout(() => setCopiedCli(false), 2200);
    } catch {
      // Clipboard unavailable in restricted contexts
    }
  };

  return (
    <div className="bg-white pb-6">
      {/* ==================== SECTION 1: MONOGRAPH HERO + 4-STAT LEDGER + SOIL CUTAWAY SVG ==================== */}
      <section aria-labelledby="home-monograph-title" className="pt-6 sm:pt-8">
        <div className="grid gap-6 pb-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
          <div className="space-y-3">
            <span className="inline-block border-l-[3px] border-[var(--teal)] bg-[var(--teal-soft)] px-2.5 py-1 font-mono text-[11px] font-bold uppercase tracking-wider text-[var(--teal)]">
              Soil Organic Nitrogen Turnover · EC 3.4 Peptidases &amp; EC 3.5.1 Amidohydrolases
            </span>
            <h1
              id="home-monograph-title"
              className="font-display text-3xl font-bold leading-[1.1] text-[var(--navy)] sm:text-4xl lg:text-[2.55rem]"
            >
              Hierarchical Enzyme Commission annotation for soil nitrogen mineralization.
            </h1>
          </div>

          <div className="space-y-4 lg:border-l lg:border-[var(--line)] lg:pl-6">
            <p className="text-sm leading-relaxed text-[var(--muted)]">
              Polymeric proteins and amides represent over 40% of surface soil organic nitrogen.
              MINpred pairs overlap-averaged <strong>ESM-2 (650M)</strong> sequence representations
              with <strong>13 regularized neural classifiers</strong> to resolve uncharacterized
              sequences down to explicit four-digit EC numbers without alignment databases.
            </p>
            <div className="flex flex-wrap items-center gap-2.5">
              <Link href="/prediction" className="btn-amber">
                <span>Predict FASTA Sequences</span>
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link href="/prediction?example=mixed" className="btn-outline-sharp">
                <span>10-Class Benchmark</span>
              </Link>
              <Link
                href="/download"
                className="px-1.5 py-1 font-mono text-xs font-bold text-[var(--teal)] underline underline-offset-4 hover:text-[var(--navy)]"
              >
                Standalone CLI →
              </Link>
            </div>
          </div>
        </div>

        {/* 4-Stat Inline Monograph Rule Strip */}
        <dl className="grid grid-cols-2 divide-x divide-y divide-[var(--line)] border-y-2 border-[var(--navy)] bg-[var(--limestone)] lg:grid-cols-4 lg:divide-y-0">
          {[
            ['457,321', 'Swiss-Prot 2026_04 QC sequences', '135,425 decontaminated non-enzymes'],
            ['13 Neural Heads', 'Bundled .keras + .npz weights', 'Gates I–III + M1–M10 specialists'],
            ['10 Classes · 52 ECs', 'Explicit four-digit IUBMB scope', 'Plus class-conditional Others'],
            ['0.936–0.975 MCC', 'Homology-disjoint test splits', '5 single-linkage super-cluster seeds'],
          ].map(([val, label, note]) => (
            <div key={label} className="px-4 py-3.5 sm:px-5">
              <dt className="font-mono text-[11px] font-bold uppercase tracking-wider text-[var(--muted)]">
                {label}
              </dt>
              <dd className="mt-0.5 font-display text-2xl font-bold text-[var(--navy)]">{val}</dd>
              <p className="font-mono text-[11px] text-[var(--teal)]">{note}</p>
            </div>
          ))}
        </dl>

        {/* Full-Width Interactive Soil-to-Root Mineralization Cutaway SVG */}
        <figure className="border-b border-[var(--line)] bg-white pt-3 pb-2">
          <div className="mb-2 flex flex-col justify-between gap-1 text-xs sm:flex-row sm:items-center">
            <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-[var(--navy)]">
              Interactive Rhizosphere Nitrogen-Mineralization Cutaway
            </span>
            <span className="text-xs text-[var(--muted)]">
              Click any enzyme complex in the figure—or choose from the 3 reaction steps below—to
              inspect its active-site cleavage.
            </span>
          </div>
          <SoilMineralizationCutawaySVG selected={selectedKey} onSelect={handleSelectClass} />
        </figure>

        {/* ==================== 3-STAGE BIOCHEMICAL REACTION BAR + 3-COLUMN HORIZONTAL READOUT ==================== */}
        <div className="border-x border-b-2 border-[var(--line)] border-b-[var(--navy)]">
          {/* 3 Biochemical Reaction Steps Grouping the 10 Classes */}
          <div
            className="grid divide-y divide-[var(--line)] border-b border-[var(--line)] bg-[var(--limestone)] md:grid-cols-3 md:divide-x md:divide-y-0"
            role="group"
            aria-label="Select enzyme class by biochemical reaction stage"
          >
            {PATHWAY_STAGES.map((stage) => {
              const stageClasses = MINERALIZATION_CLASSES.filter((c) => c.stage === stage.id);
              const stageActive = activeClass.stage === stage.id;
              return (
                <div
                  key={stage.id}
                  className={`p-3.5 sm:p-4 ${stageActive ? 'bg-[var(--ochre-soft)]/70' : ''}`}
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="font-mono text-[11px] font-extrabold tracking-wider text-[var(--ochre)]">
                      {stage.stepNum}
                    </span>
                    <span className="font-mono text-[10.5px] text-[var(--muted)]">
                      {stage.equation}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs font-bold text-[var(--navy)]">{stage.title}</p>

                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {stageClasses.map((cls) => {
                      const active = cls.key === selectedKey;
                      return (
                        <button
                          key={cls.key}
                          type="button"
                          aria-pressed={active}
                          onClick={() => handleSelectClass(cls.key)}
                          className={`border px-2.5 py-1 font-mono text-xs font-extrabold transition ${
                            active
                              ? 'border-[var(--navy)] bg-[var(--navy)] text-white'
                              : 'border-[var(--line-strong)] bg-white text-[var(--navy)] hover:border-[var(--navy)] hover:bg-[var(--limestone)]'
                          }`}
                        >
                          <span>{cls.code}</span>
                          <span
                            className={`ml-1.5 text-[10px] font-semibold ${
                              active ? 'text-[#f5d07a]' : 'text-[var(--muted)]'
                            }`}
                          >
                            {cls.ecs.length}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* 3-Column Horizontal Specimen & Scissile-Bond Readout */}
          <div
            aria-live="polite"
            className="grid divide-y divide-[var(--line)] bg-white lg:grid-cols-12 lg:divide-x lg:divide-y-0"
          >
            {/* Col 1: Class Identity, Summary & Motifs */}
            <div className="space-y-3 p-5 lg:col-span-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="bg-[var(--navy)] px-2 py-0.5 font-mono text-xs font-extrabold text-white">
                  {activeClass.code} · {activeClass.classId}
                </span>
                <span className="font-mono text-xs font-bold text-[var(--teal)]">
                  {activeClass.ecPrefix}
                </span>
                <span className="font-mono text-[11px] text-[var(--muted)]">
                  ({activeClass.proteins} seqs)
                </span>
              </div>

              <h2 className="font-display text-2xl font-bold text-[var(--navy)]">
                {activeClass.name}
              </h2>

              <p className="text-xs leading-relaxed text-[var(--ink)] sm:text-[13px]">
                {activeClass.summary}
              </p>

              <div className="border-t border-[var(--line)] pt-2.5">
                <p className="font-mono text-[10.5px] font-bold uppercase tracking-wider text-[var(--ochre)]">
                  Diagnostic Active-Site Motifs
                </p>
                <ul className="mt-1.5 space-y-1">
                  {activeClass.conservedMotifs.map((motif) => (
                    <li
                      key={motif}
                      className="flex items-baseline gap-2 font-mono text-[11.5px] text-[var(--ink)]"
                    >
                      <span
                        className="inline-block h-1.5 w-1.5 shrink-0 bg-[var(--pyrite)]"
                        aria-hidden="true"
                      />
                      <span>{motif}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Col 2: Scissile-Bond Schematic SVG + Mechanism */}
            <div className="flex flex-col justify-between space-y-3.5 p-5 lg:col-span-5">
              <div className="space-y-2.5">
                <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-[var(--navy)]">
                  Scissile Bond &amp; Catalytic Cleavage Topology
                </span>
                <CatalyticMechanismSVG
                  mode={activeClass.cleavageMode}
                  compartment={activeClass.compartment}
                  cofactorOrDyad={activeClass.cofactorOrDyad}
                  productLabel={activeClass.productLabel}
                />
                <p className="text-xs leading-relaxed text-[var(--muted)]">
                  {activeClass.mechanism}
                </p>
              </div>

              <div className="border-t border-[var(--line)] pt-2.5">
                <span className="font-mono text-[10.5px] font-bold uppercase tracking-wider text-[var(--teal)]">
                  Representative Soil &amp; Microbial Exemplars:{' '}
                </span>
                <span className="font-mono text-[11.5px] text-[var(--ink)]">
                  {activeClass.canonicalExamples.join(' · ')}
                </span>
              </div>
            </div>

            {/* Col 3: Held-Out Metrics, Explicit BRENDA Chips & Specimen Launcher */}
            <div className="flex flex-col justify-between space-y-4 bg-[var(--surface)] p-5 lg:col-span-3">
              <div className="space-y-3.5">
                <div className="grid grid-cols-2 divide-x divide-[var(--line)] border border-[var(--line)] bg-white text-center font-mono">
                  <div className="py-2">
                    <div className="text-[10px] font-bold uppercase text-[var(--muted)]">
                      Test MCC
                    </div>
                    <div className="text-sm font-extrabold text-[var(--navy)]">
                      {activeClass.mcc}
                    </div>
                  </div>
                  <div className="py-2">
                    <div className="text-[10px] font-bold uppercase text-[var(--muted)]">
                      AUROC
                    </div>
                    <div className="text-sm font-extrabold text-[var(--teal)]">
                      {activeClass.auroc}
                    </div>
                  </div>
                </div>

                <div>
                  <p className="font-mono text-[10.5px] font-bold uppercase tracking-wider text-[var(--navy)]">
                    Head {activeClass.modelHead} · {activeClass.ecs.length} Explicit ECs
                  </p>
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {activeClass.ecs.map((ec) => (
                      <a
                        key={ec}
                        href={`https://www.brenda-enzymes.org/enzyme.php?ecno=${ec}`}
                        target="_blank"
                        rel="noreferrer"
                        title={`Open EC ${ec} in BRENDA`}
                        className={`border px-1.5 py-0.5 font-mono text-[11px] font-bold transition ${
                          highlightedEc === ec
                            ? 'border-[var(--ochre-dark)] bg-[var(--pyrite)] text-[#0c1b1d]'
                            : 'border-[var(--line-strong)] bg-white text-[var(--navy)] hover:border-[var(--navy)]'
                        }`}
                      >
                        {ec}
                      </a>
                    ))}
                    <span className="border border-dashed border-[var(--field-border)] bg-white px-1.5 py-0.5 font-mono text-[11px] text-[var(--muted)]">
                      Others
                    </span>
                  </div>
                </div>
              </div>

              <Link
                href={`/prediction?example=${activeClass.key}`}
                className="btn-ochre w-full !text-xs"
              >
                <span>Load {activeClass.code} Specimen →</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== SECTION 2: FULL-WIDTH COMPUTATIONAL CASCADE + 4 GATE BENCHMARK STRIP ==================== */}
      <section aria-labelledby="cascade-section-heading" className="pt-12">
        <div className="flex flex-col justify-between gap-3 pb-4 lg:flex-row lg:items-end">
          <div>
            <p className="eyebrow">Alignment-Free Architecture &amp; Homology-Disjoint Validation</p>
            <h2
              id="cascade-section-heading"
              className="mt-1 font-display text-2xl font-bold text-[var(--navy)] sm:text-3xl"
            >
              Overlap-averaged ESM-2 windowing &amp; cumulative four-gate screening
            </h2>
          </div>
          <p className="max-w-xl text-xs leading-relaxed text-[var(--muted)] lg:text-right">
            Proteins exceeding 1,022 residues are encoded across overlapping 1,022-aa windows
            (511-aa stride + terminal <code className="font-mono">[L−1022:L]</code>), preserving
            94.7%–100.0% test accuracy on long multi-domain soil proteases.
          </p>
        </div>

        <div className="border border-[var(--line)] border-t-2 border-t-[var(--navy)] bg-white">
          <div className="p-4 sm:p-6">
            <EsmCascadeSVG selected={selectedKey} onSelect={handleSelectClass} />
          </div>

          {/* 4 Aligned Gate Columns Directly Beneath the Cascade Plate */}
          <div className="grid divide-y divide-[var(--line)] border-t border-[var(--line)] bg-[var(--limestone)] sm:grid-cols-2 sm:divide-x lg:grid-cols-4 lg:divide-y-0">
            {GATE_SUMMARY.map((g) => (
              <div key={g.gate} className="p-4 sm:p-5">
                <div className="flex items-baseline justify-between gap-2 font-mono text-xs">
                  <span className="font-extrabold uppercase text-[var(--teal)]">{g.gate}</span>
                  <span className="text-[11px] font-semibold text-[var(--muted)]">{g.cutoff}</span>
                </div>
                <h3 className="mt-1 font-display text-lg font-bold text-[var(--navy)]">
                  {g.title}
                </h3>
                <div className="mt-2 flex items-baseline gap-3 border-y border-[var(--line)] bg-white px-2.5 py-1.5 font-mono text-xs">
                  <span>
                    Acc <strong className="text-[var(--navy)]">{g.acc}</strong>
                  </span>
                  <span className="text-[var(--line-strong)]">·</span>
                  <span>
                    MCC <strong className="text-[var(--ochre)]">{g.mcc}</strong>
                  </span>
                </div>
                <p className="mt-2.5 text-xs leading-relaxed text-[var(--muted)]">{g.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== SECTION 3: PERIODIC ATLAS OF ALL 52 EXPLICIT FOUR-DIGIT ECs ==================== */}
      <section aria-labelledby="periodic-ec-heading" className="border-b border-[var(--line)] py-12">
        <div className="flex flex-col justify-between gap-2 pb-5 sm:flex-row sm:items-end">
          <div>
            <p className="eyebrow">Phase IV Specialist Nomenclature Scope</p>
            <h2
              id="periodic-ec-heading"
              className="mt-1 font-display text-2xl font-bold text-[var(--navy)] sm:text-3xl"
            >
              Periodic Reference Grid of the 52 Explicit Four-Digit ECs
            </h2>
          </div>
          <p className="font-mono text-xs text-[var(--muted)]">
            Click any EC tile to inspect its parent enzyme class above ·{' '}
            <a
              href={`https://www.brenda-enzymes.org/enzyme.php?ecno=${highlightedEc}`}
              target="_blank"
              rel="noreferrer"
              className="font-bold text-[var(--ochre)] underline underline-offset-4 hover:text-[var(--navy)]"
            >
              Inspect {highlightedEc} in BRENDA ↗
            </a>
          </p>
        </div>

        <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-9">
          {ALL_EXPLICIT_ECS.map((item) => {
            const isExact = item.ec === highlightedEc;
            const isSameClass = item.classKey === selectedKey;
            return (
              <button
                key={item.ec}
                type="button"
                onClick={() => handleSelectEcTile(item.classKey, item.ec)}
                className={`border p-2 text-left transition ${
                  isExact
                    ? 'border-[var(--ochre-dark)] bg-[var(--ochre-soft)] shadow-[inset_3px_0_0_var(--pyrite-indicator)]'
                    : isSameClass
                      ? 'border-[var(--navy)] bg-[var(--limestone)]'
                      : 'border-[var(--line)] bg-white hover:border-[var(--navy)] hover:bg-[var(--limestone)]'
                }`}
              >
                <div className="flex items-center justify-between font-mono text-[10px] font-extrabold">
                  <span
                    className={
                      item.code === 'AH' ? 'text-[var(--ochre)]' : 'text-[var(--teal)]'
                    }
                  >
                    {item.code}
                  </span>
                  <span className="text-[var(--muted)]">{item.classId}</span>
                </div>
                <div className="mt-1 font-mono text-xs font-extrabold text-[var(--navy)]">
                  {item.ec}
                </div>
                <div className="mt-0.5 truncate text-[10px] text-[var(--muted)]">
                  {item.stageShort}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* ==================== SECTION 4: 3-COLUMN MONOGRAPH COLOPHON ==================== */}
      <section
        aria-label="Proteome discovery, standalone CLI, and citation"
        className="grid gap-8 pt-10 lg:grid-cols-3"
      >
        {/* Column 1: 30 Reference Proteomes Application */}
        <div className="space-y-2.5 border-t-2 border-[var(--teal)] pt-4">
          <p className="font-mono text-[11px] font-bold uppercase tracking-widest text-[var(--teal)]">
            Ecological Genome Application
          </p>
          <h3 className="font-display text-xl font-bold text-[var(--navy)]">
            30 Bacterial &amp; Archaeal Soil Proteomes
          </h3>
          <p className="text-xs leading-relaxed text-[var(--muted)] sm:text-[13px]">
            Applied across <strong>128,830 proteins</strong> spanning Nitrososphaerota,
            Actinomycetota, Bacteroidota, Bacillota, and Pseudomonadota, MINpred identified{' '}
            <strong>3,896 mineralization enzymes</strong>, assigned{' '}
            <strong>2,128 explicit four-digit ECs</strong>, and uncovered{' '}
            <strong>369 uncharacterized hypothetical proteins</strong> representing candidate soil
            hydrolases.
          </p>
        </div>

        {/* Column 2: Standalone Python CLI */}
        <div className="space-y-2.5 border-t-2 border-[var(--navy)] pt-4">
          <div className="flex items-baseline justify-between gap-2">
            <p className="font-mono text-[11px] font-bold uppercase tracking-widest text-[var(--navy)]">
              Standalone Python CLI
            </p>
            <Link
              href="/download"
              className="font-mono text-xs font-bold text-[var(--teal)] hover:underline"
            >
              .tar.gz &amp; SHA-256 →
            </Link>
          </div>
          <div className="rounded-[2px] border border-[var(--navy-dark)] bg-[#142a2c] text-white">
            <div className="flex items-center justify-between border-b border-white/15 px-3 py-1.5 font-mono text-[11px] text-slate-300">
              <span>bash / zsh</span>
              <button
                type="button"
                onClick={() => void copyCliCommand()}
                className="inline-flex items-center gap-1 font-mono text-[11px] font-semibold text-slate-200 hover:text-white"
              >
                {copiedCli ? (
                  <>
                    <Check className="h-3 w-3 text-[#f5d07a]" aria-hidden="true" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3" aria-hidden="true" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
            <pre className="overflow-x-auto px-3 py-2.5 font-mono text-[11.5px] leading-5 text-slate-100">
              <code>{CLI_SNIPPET}</code>
            </pre>
          </div>
        </div>

        {/* Column 3: Citation & BibTeX */}
        <div className="space-y-3 border-t-2 border-[var(--pyrite-indicator)] pt-4">
          <p className="font-mono text-[11px] font-bold uppercase tracking-widest text-[var(--ochre)]">
            Citation &amp; Reproducibility
          </p>
          <p className="text-xs leading-relaxed text-[var(--ink)] sm:text-[13px]">
            Duhan, N., Norton, J. M., &amp; Kaundal, R. (2026).{' '}
            <em className="font-semibold text-[var(--navy)]">
              MINpred: A Hierarchical Protein Language Model Framework for Predicting
              Nitrogen-Mineralization Enzymes
            </em>{' '}
            (v1.0.0). Utah State University.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => void copyBibtex()}
              className="btn-outline-sharp !min-h-0 !py-1.5 !px-3 !text-xs"
            >
              {copiedBib ? (
                <>
                  <Check className="h-3.5 w-3.5 text-[var(--teal)]" aria-hidden="true" />
                  <span>Copied BibTeX</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Copy BibTeX</span>
                </>
              )}
            </button>
            <a
              href="https://github.com/usubioinfo/minpred"
              target="_blank"
              rel="noreferrer"
              className="btn-ghost-rule !min-h-0 !py-1.5 !px-3 !text-xs"
            >
              <span>GitHub</span>
              <ExternalLink className="h-3 w-3" aria-hidden="true" />
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
