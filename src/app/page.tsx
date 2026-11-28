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

const PHASE_SUMMARY = [
  {
    phase: 'Phase I',
    title: 'Enzyme Screen',
    output: 'Enzyme vs. Non-enzyme',
    detail:
      'Classifies submitted protein or ORF sequences and passes predicted enzymes to Phase II.',
  },
  {
    phase: 'Phase II',
    title: 'N-Mineralization Filter',
    output: 'N-Mineralization vs. Other',
    detail:
      'Isolates nitrogen-mineralization hydrolases from non-mineralization enzymes.',
  },
  {
    phase: 'Phase III',
    title: '10-Class Router',
    output: 'SEP … AH (10 classes)',
    detail:
      'Assigns qualifying enzymes across nine EC 3.4 peptidase classes and EC 3.5.1 amidohydrolases.',
  },
  {
    phase: 'Phase IV',
    title: 'Specialist EC Heads (M1–M10)',
    output: '52 4-Digit ECs + Others',
    detail:
      'Routes each enzyme to its class-specific model for four-digit EC prediction.',
  },
] as const;

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
  const [copiedBib, setCopiedBib] = useState(false);
  const [copiedCli, setCopiedCli] = useState(false);

  const activeClass: MineralizationClassInfo =
    MINERALIZATION_CLASSES.find((item) => item.key === selectedKey) ?? MINERALIZATION_CLASSES[0];

  const copyBibtex = async () => {
    try {
      await navigator.clipboard.writeText(BIBTEX);
      setCopiedBib(true);
      window.setTimeout(() => setCopiedBib(false), 2200);
    } catch {
      // Clipboard unavailable
    }
  };

  const copyCliCommand = async () => {
    try {
      await navigator.clipboard.writeText(CLI_SNIPPET);
      setCopiedCli(true);
      window.setTimeout(() => setCopiedCli(false), 2200);
    } catch {
      // Clipboard unavailable
    }
  };

  return (
    <div className="space-y-12 py-6 pb-10">
      {/* ==================== SECTION 1: HEADER + PRACTICAL CAPABILITIES + INTERACTIVE PATHWAY ==================== */}
      <section aria-labelledby="home-monograph-title" className="space-y-6">
        <div className="flex flex-col justify-between gap-4 border-b border-[var(--line-strong)] pb-5 lg:flex-row lg:items-center">
          <div className="min-w-0 space-y-1.5">
            <h1
              id="home-monograph-title"
              className="font-display text-2xl font-bold tracking-tight text-[var(--navy)] sm:text-3xl"
            >
              MINpred:{' '}
              <span className="text-[var(--teal)]">
                Soil Nitrogen-Mineralization Enzyme &amp; EC Prediction
              </span>
            </h1>
            <p className="max-w-4xl text-base leading-7 text-[var(--ink)]">
              Predicts 10 nitrogen-mineralization enzyme classes (EC 3.4 peptidases &amp; EC 3.5.1
              amidohydrolases) and 52 four-digit EC numbers from protein or nucleotide FASTA
              sequences using ESM-2 representations.
            </p>
          </div>

          <div className="shrink-0">
            <Link href="/prediction" className="btn-amber py-3 px-6 text-base">
              <span>Predict Sequences</span>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>

        {/* Rounded 4-Capability Summary Row (Server Capabilities Only) */}
        <dl className="grid grid-cols-2 divide-x divide-y divide-[var(--line)] overflow-hidden rounded-xl border border-[var(--line-strong)] bg-[var(--limestone)] lg:grid-cols-4 lg:divide-y-0">
          {[
            ['10 Classes', 'Enzyme Categories', '9 EC 3.4 peptidases & EC 3.5.1'],
            ['52 Explicit ECs', 'Four-Digit EC Coverage', 'Plus class-specific Others'],
            ['4 Phases', 'Prediction Cascade', 'ESM-2 (1,280-D) + 13 neural heads'],
            ['Protein & DNA/RNA', 'Supported Inputs', 'FASTA, file upload & accession IDs'],
          ].map(([val, label, note]) => (
            <div key={label} className="px-4 py-4 sm:px-5">
              <dt className="font-mono text-xs font-bold uppercase tracking-wider text-[var(--ink-secondary)]">
                {label}
              </dt>
              <dd className="mt-1 font-display text-2xl font-bold text-[var(--navy)]">{val}</dd>
              <p className="mt-0.5 text-sm font-medium text-[var(--teal)]">{note}</p>
            </div>
          ))}
        </dl>

        {/* Rounded Interactive Pathway Container */}
        <div className="overflow-hidden rounded-2xl border border-[var(--line-strong)] bg-white shadow-[0_2px_12px_rgba(18,38,40,0.04)]">
          {/* Cutaway Header & SVG */}
          <figure className="border-b border-[var(--line)] bg-white p-4 sm:p-5">
            <div className="mb-3 flex flex-col justify-between gap-1 sm:flex-row sm:items-center">
              <span className="eyebrow">Soil Nitrogen-Mineralization Pathway</span>
              <span className="text-sm font-medium text-[var(--ink-secondary)]">
                Click any enzyme in the diagram or select a class below
              </span>
            </div>
            <SoilMineralizationCutawaySVG selected={selectedKey} onSelect={setSelectedKey} />
          </figure>

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
                  className={`p-4 ${stageActive ? 'bg-[var(--ochre-soft)]' : ''}`}
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="font-mono text-xs font-extrabold tracking-wider text-[var(--ochre)]">
                      {stage.stepNum}
                    </span>
                    <span className="font-mono text-xs font-semibold text-[var(--ink-secondary)]">
                      {stage.equation}
                    </span>
                  </div>
                  <p className="mt-1 text-[15px] font-bold text-[var(--navy)]">{stage.title}</p>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {stageClasses.map((cls) => {
                      const active = cls.key === selectedKey;
                      return (
                        <button
                          key={cls.key}
                          type="button"
                          aria-pressed={active}
                          onClick={() => setSelectedKey(cls.key)}
                          className={`cursor-pointer rounded-lg border px-3 py-1.5 font-mono text-[13.5px] font-bold transition ${
                            active
                              ? 'border-[var(--navy)] bg-[var(--navy)] text-white'
                              : 'border-[var(--line-strong)] bg-white text-[var(--navy)] hover:border-[var(--teal)] hover:bg-[var(--teal-soft)]'
                          }`}
                        >
                          <span>{cls.code}</span>
                          <span
                            className={`ml-1.5 text-xs font-semibold ${
                              active ? 'text-[#f5d07a]' : 'text-[var(--teal)]'
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

          {/* 3-Column Horizontal Class & Scissile-Bond Readout */}
          <div
            aria-live="polite"
            className="grid divide-y divide-[var(--line)] bg-white lg:grid-cols-12 lg:divide-x lg:divide-y-0"
          >
            {/* Col 1: Class Identity, Summary & Motifs */}
            <div className="space-y-3.5 p-5 lg:col-span-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-md bg-[var(--navy)] px-2.5 py-1 font-mono text-xs font-bold text-white">
                  {activeClass.code} · {activeClass.classId}
                </span>
                <span className="font-mono text-sm font-bold text-[var(--teal)]">
                  {activeClass.ecPrefix}
                </span>
              </div>

              <h2 className="font-display text-2xl font-bold text-[var(--navy)]">
                {activeClass.name}
              </h2>

              <p className="text-[15px] leading-relaxed text-[var(--ink)]">
                {activeClass.summary}
              </p>

              <div className="border-t border-[var(--line)] pt-3">
                <p className="font-mono text-xs font-bold uppercase tracking-wider text-[var(--ochre)]">
                  Diagnostic Active-Site Motifs
                </p>
                <ul className="mt-2 space-y-1.5">
                  {activeClass.conservedMotifs.map((motif) => (
                    <li
                      key={motif}
                      className="flex items-baseline gap-2 font-mono text-[13px] text-[var(--ink)]"
                    >
                      <span
                        className="inline-block h-2 w-2 shrink-0 rounded-sm bg-[var(--pyrite-indicator)]"
                        aria-hidden="true"
                      />
                      <span>{motif}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Col 2: Scissile-Bond Schematic SVG + Mechanism */}
            <div className="flex flex-col justify-between space-y-4 p-5 lg:col-span-5">
              <div className="space-y-3">
                <span className="font-mono text-xs font-bold uppercase tracking-wider text-[var(--navy)]">
                  Scissile Bond &amp; Catalytic Cleavage
                </span>
                <CatalyticMechanismSVG
                  mode={activeClass.cleavageMode}
                  compartment={activeClass.compartment}
                  cofactorOrDyad={activeClass.cofactorOrDyad}
                  productLabel={activeClass.productLabel}
                />
                <p className="text-[14.5px] leading-relaxed text-[var(--ink)]">
                  {activeClass.mechanism}
                </p>
              </div>

              <div className="border-t border-[var(--line)] pt-3 text-sm">
                <span className="font-mono text-xs font-bold uppercase tracking-wider text-[var(--teal)]">
                  Representative Enzymes:{' '}
                </span>
                <span className="font-mono text-[13px] font-medium text-[var(--ink)]">
                  {activeClass.canonicalExamples.join(' · ')}
                </span>
              </div>
            </div>

            {/* Col 3: Reaction Product, Explicit EC Chips & Example Launcher */}
            <div className="flex flex-col justify-between space-y-4 bg-[var(--surface)] p-5 lg:col-span-3">
              <div className="space-y-4">
                <div className="rounded-xl border border-[var(--line-strong)] bg-white p-3 font-mono">
                  <div className="text-xs font-bold uppercase text-[var(--ink-secondary)]">
                    Reaction Product
                  </div>
                  <div className="mt-0.5 text-sm font-extrabold text-[var(--navy)]">
                    {activeClass.productLabel}
                  </div>
                  <div className="mt-1 text-xs font-semibold text-[var(--teal)]">
                    {activeClass.stageShort} · {activeClass.cofactorOrDyad}
                  </div>
                </div>

                <div>
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="font-mono text-xs font-bold uppercase tracking-wider text-[var(--navy)]">
                      Head {activeClass.modelHead} · {activeClass.ecs.length} ECs
                    </p>
                    <Link
                      href="/ec-numbers"
                      className="text-xs font-bold text-[var(--teal)] hover:underline"
                    >
                      All 52 ECs →
                    </Link>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {activeClass.ecs.map((ec) => (
                      <a
                        key={ec}
                        href={`https://www.brenda-enzymes.org/enzyme.php?ecno=${ec}`}
                        target="_blank"
                        rel="noreferrer"
                        title={`Open EC ${ec} in BRENDA`}
                        className="rounded-md border border-[var(--line-strong)] bg-white px-2 py-0.5 font-mono text-xs font-bold text-[var(--navy)] transition hover:border-[var(--teal)] hover:bg-[var(--teal-soft)]"
                      >
                        {ec}
                      </a>
                    ))}
                    <span className="rounded-md border border-dashed border-[var(--field-border)] bg-white px-2 py-0.5 font-mono text-xs font-medium text-[var(--ink-secondary)]">
                      Others
                    </span>
                  </div>
                </div>
              </div>

              <Link
                href={`/prediction?example=${activeClass.key}`}
                className="btn-ochre w-full text-sm"
              >
                <span>Load {activeClass.code} Example →</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== SECTION 2: FOUR-PHASE ESM-2 ARCHITECTURE ==================== */}
      <section aria-labelledby="cascade-section-heading" className="space-y-4">
        <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-end">
          <div>
            <p className="eyebrow">Prediction Workflow</p>
            <h2
              id="cascade-section-heading"
              className="mt-1 font-display text-2xl font-bold text-[var(--navy)] sm:text-[1.7rem]"
            >
              Four-phase ESM-2 classification pipeline
            </h2>
          </div>
          <p className="max-w-xl text-[15px] leading-6 text-[var(--ink-secondary)] lg:text-right">
            Sequences longer than 1,022 residues are encoded across overlapping 1,022-aa windows
            (511-aa stride) before passing through four sequential neural stages.
          </p>
        </div>

        <div className="overflow-hidden rounded-2xl border border-[var(--line-strong)] bg-white shadow-[0_2px_12px_rgba(18,38,40,0.04)]">
          <div className="p-4 sm:p-6">
            <EsmCascadeSVG selected={selectedKey} onSelect={setSelectedKey} />
          </div>

          {/* 4 Aligned Phase Columns */}
          <div className="grid divide-y divide-[var(--line)] border-t border-[var(--line-strong)] bg-[var(--limestone)] sm:grid-cols-2 sm:divide-x lg:grid-cols-4 lg:divide-y-0">
            {PHASE_SUMMARY.map((g) => (
              <div key={g.phase} className="p-5">
                <span className="font-mono text-xs font-extrabold uppercase text-[var(--teal)]">
                  {g.phase}
                </span>
                <h3 className="mt-1 font-display text-lg font-bold text-[var(--navy)]">
                  {g.title}
                </h3>
                <div className="mt-2 rounded-lg border border-[var(--line-strong)] bg-white px-3 py-1.5 font-mono text-xs font-bold text-[var(--navy)]">
                  {g.output}
                </div>
                <p className="mt-2.5 text-sm leading-relaxed text-[var(--ink)]">{g.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== SECTION 3: STANDALONE CLI + PRIMARY REFERENCE ==================== */}
      <section
        aria-label="Standalone CLI and citation"
        className="grid gap-6 border-t border-[var(--line-strong)] pt-10 lg:grid-cols-2"
      >
        <div className="space-y-3 rounded-2xl border border-[var(--line-strong)] bg-[var(--surface)] p-5">
          <div className="flex items-baseline justify-between gap-2">
            <p className="eyebrow">Standalone Python CLI</p>
            <Link
              href="/download"
              className="text-sm font-bold text-[var(--teal)] hover:underline"
            >
              Download .tar.gz →
            </Link>
          </div>
          <div className="overflow-hidden rounded-xl border border-[var(--navy-dark)] bg-[#122628] text-white">
            <div className="flex items-center justify-between border-b border-white/15 px-3.5 py-2 font-mono text-xs text-slate-200">
              <span>bash / zsh</span>
              <button
                type="button"
                onClick={() => void copyCliCommand()}
                className="inline-flex cursor-pointer items-center gap-1.5 font-mono text-xs font-semibold text-white hover:text-[#f5d07a]"
              >
                {copiedCli ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-[#f5d07a]" aria-hidden="true" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
            <pre className="overflow-x-auto px-3.5 py-3 font-mono text-[13px] leading-6 text-slate-100">
              <code>{CLI_SNIPPET}</code>
            </pre>
          </div>
        </div>

        <div className="flex flex-col justify-between space-y-3 rounded-2xl border border-[var(--line-strong)] bg-[var(--surface)] p-5">
          <div className="space-y-2">
            <p className="eyebrow">Primary Reference</p>
            <p className="text-[15px] leading-relaxed text-[var(--ink)]">
              Duhan, N., Norton, J. M., &amp; Kaundal, R. (2026).{' '}
              <em className="font-semibold text-[var(--navy)]">
                MINpred: A Hierarchical Protein Language Model Framework for Predicting
                Nitrogen-Mineralization Enzymes
              </em>{' '}
              (v1.0.0). Utah State University.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5 pt-1">
            <button
              type="button"
              onClick={() => void copyBibtex()}
              className="btn-outline-sharp py-2 px-4 text-sm"
            >
              {copiedBib ? (
                <>
                  <Check className="h-4 w-4 text-[var(--teal)]" aria-hidden="true" />
                  <span>Copied BibTeX</span>
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" aria-hidden="true" />
                  <span>Copy BibTeX</span>
                </>
              )}
            </button>
            <a
              href="https://github.com/usubioinfo/minpred"
              target="_blank"
              rel="noreferrer"
              className="btn-ghost-rule py-2 px-4 text-sm"
            >
              <span>GitHub</span>
              <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
