import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Database, Dna, LockKeyhole, ScanSearch } from 'lucide-react';
import mineralizationHero from '../../public/minpred-mineralization-hero.png';

const cascadeGates = [
  ['I', 'Enzyme Screen', 'MCC 0.954 · <40% id'],
  ['II', 'N-Mineralization Filter', 'MCC 0.936 · EC 3.4 / 3.5'],
  ['III', '10 Functional Classes', 'MCC 0.975 · C01–C10'],
  ['IV', '4-Digit EC Assignment', '96.1% Acc · 52 ECs'],
] as const;

const stages = [
  ['I', 'Enzyme screen', 'Enzyme or non-enzyme', 'ESM-2 (650M) · MLP'],
  ['II', 'Mineralization screen', 'Nitrogen mineralization or other enzyme', 'ESM-2 (650M) · MLP'],
  ['III', 'Enzyme family', 'One of ten mineralization-related classes', 'ESM-2 (650M) · MLP'],
  ['IV', 'EC assignment', 'Class-specific 4-digit EC label', 'ESM-2 (650M) · MLP'],
];

export default function Home() {
  return (
    <div className="pb-16">
      <section className="reveal grid items-center gap-10 border-b border-[var(--line)] py-12 sm:py-16 lg:grid-cols-[1.08fr_.92fr] lg:py-20">
        <div>
          <p className="eyebrow">Alignment-free nitrogen mineralization annotation</p>
          <h1 className="mt-4 max-w-3xl font-display text-4xl font-bold leading-[1.06] text-[var(--forest-dark)] sm:text-5xl lg:text-6xl">
            Predict enzymes involved in nitrogen mineralization.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-[var(--muted)]">
            MINpred embeds protein and translated nucleotide sequences once with overlap-averaged ESM-2 (650M),
            identifies mineralization-related enzyme classes, and assigns class-specific four-digit EC labels through a
            four-phase cascade.
          </p>
          <div className="mt-7 flex flex-wrap gap-x-6 gap-y-2 border-y border-[var(--line)] py-3.5 text-xs font-bold text-[var(--forest)]">
            <span>10 enzyme classes</span>
            <span>52 explicit 4-digit EC labels</span>
            <span>Protein and nucleotide input</span>
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/prediction" className="btn-primary">
              Start prediction <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/help" className="btn-secondary">
              Methods and EC reference
            </Link>
          </div>
        </div>

        <div className="space-y-4">
          <div className="surface p-5 sm:p-6">
            <div className="flex items-center justify-between gap-4 border-b border-[var(--line)] pb-3.5">
              <div>
                <p className="eyebrow !text-[11px]">Hierarchical Architecture</p>
                <h2 className="mt-0.5 font-display text-lg font-bold text-[var(--forest-dark)]">4-Gate Cascade</h2>
              </div>
              <span className="rounded-md bg-[var(--mineral-soft)] px-2.5 py-1 font-mono text-xs font-bold text-[var(--mineral)]">
                1,280-d ESM-2
              </span>
            </div>
            <div className="mt-4 space-y-2.5">
              {cascadeGates.map(([gate, title, metric]) => (
                <div
                  key={gate}
                  className="flex items-center justify-between gap-3 rounded-lg border border-[var(--line)] bg-[var(--canvas)] px-3.5 py-2.5 text-sm"
                >
                  <div className="flex items-center gap-3">
                    <span className="grid h-6 w-7 place-items-center rounded bg-[var(--mineral-soft)] font-mono text-xs font-bold text-[var(--mineral)]">
                      {gate}
                    </span>
                    <span className="font-bold text-[var(--forest-dark)]">{title}</span>
                  </div>
                  <span className="font-mono text-xs font-semibold text-[var(--muted)]">{metric}</span>
                </div>
              ))}
            </div>
          </div>

          <figure className="surface relative overflow-hidden p-4">
            <Image
              src={mineralizationHero}
              alt="Protein sequence and enzyme structures connected to nitrogen mineralization in soil"
              className="h-auto max-h-56 w-full object-contain"
              priority
            />
            <figcaption className="mt-2 text-right font-mono text-[11px] uppercase tracking-[.14em] text-[var(--muted)]">
              Sequence · enzyme class · EC assignment
            </figcaption>
          </figure>
        </div>
      </section>

      <section id="workflow" className="scroll-mt-28 border-b border-[var(--line)] py-14">
        <div className="mb-12 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <p className="eyebrow">Prediction pathway</p>
            <h2 className="mt-2 font-display text-4xl font-bold text-[var(--forest-dark)]">One sequence, four decisions</h2>
          </div>
          <p className="max-w-md text-sm leading-6 text-[var(--muted)]">
            Phase IV is automatic. Each Phase III class prediction is sent to its corresponding EC model.
          </p>
        </div>
        <div className="relative grid gap-9 md:grid-cols-4">
          <div className="absolute left-0 right-0 top-5 hidden h-px bg-[var(--line)] md:block" />
          {stages.map(([number, title, detail, feature], index) => (
            <article key={number} className="relative">
              <span className="relative z-10 grid h-10 w-10 place-items-center rounded-full border-4 border-[var(--canvas)] bg-[var(--forest)] font-mono text-xs font-bold text-white">
                {index + 1}
              </span>
              <p className="mt-7 font-mono text-[10px] font-bold uppercase tracking-[.16em] text-[var(--mineral)]">
                {feature}
              </p>
              <h3 className="mt-2 text-lg font-extrabold text-[var(--forest-dark)]">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="py-16">
        <p className="eyebrow">Input and results</p>
        <div className="mt-4 divide-y divide-[var(--line)] border-t border-[var(--line)]">
          {[
            [Dna, 'Protein or nucleotide FASTA', 'TransDecoder.LongOrfs translates nucleotide records before prediction.'],
            [Database, 'Protein accession retrieval', 'Retrieve sequences from UniProtKB or NCBI Protein.'],
            [LockKeyhole, 'Private results', 'Return to a result with its token-protected link and export TSV, CSV, or JSON.'],
            [ScanSearch, 'Protein structure tools', 'Examine predicted secondary structure and interactive three-dimensional models.'],
          ].map(([Icon, title, text]) => (
            <article key={String(title)} className="grid gap-4 py-6 sm:grid-cols-[48px_250px_1fr] sm:items-center">
              <Icon className="h-5 w-5 text-[var(--mineral)]" />
              <h3 className="text-base font-extrabold text-[var(--forest-dark)]">{String(title)}</h3>
              <p className="text-sm leading-6 text-[var(--muted)]">{String(text)}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="flex flex-col items-start justify-between gap-6 rounded-xl bg-[var(--forest-dark)] px-7 py-9 text-white shadow-[0_16px_40px_rgba(15,36,57,.16)] sm:flex-row sm:items-center">
        <div>
          <h2 className="font-display text-3xl font-bold">Analyze a sequence</h2>
          <p className="mt-2 text-sm text-slate-300">Protein and nucleotide FASTA are accepted.</p>
        </div>
        <Link
          href="/prediction"
          className="inline-flex items-center gap-2 rounded-lg bg-white px-5 py-3 text-sm font-extrabold text-[var(--forest-dark)] transition hover:-translate-y-0.5 hover:bg-sky-50"
        >
          Open MINpred <ArrowRight className="h-4 w-4" />
        </Link>
      </section>
    </div>
  );
}
