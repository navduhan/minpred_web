import Link from 'next/link';
import type { ReactNode } from 'react';
import { ArrowRight, CircleAlert } from 'lucide-react';

const contents = [
  ['quick-start', 'Quick start'],
  ['input', 'Sequence input'],
  ['phases', 'Prediction phases'],
  ['routing', 'Phase IV routing'],
  ['classes', 'Classes and EC labels'],
  ['results', 'Reading results'],
  ['structures', 'Protein structures'],
  ['example', 'Worked example'],
  ['standalone', 'Standalone usage'],
  ['troubleshooting', 'Troubleshooting'],
  ['privacy', 'Privacy and retention'],
  ['limitations', 'Interpretation and limitations'],
  ['citation', 'Citation and support'],
] as const;

const phases = [
  [
    'Phase I',
    'Enzyme screen',
    'Classifies every submitted protein as Enzyme or Non-enzyme. Only proteins predicted as enzymes continue.',
  ],
  [
    'Phase II',
    'Mineralization screen',
    'Classifies qualifying enzymes as Nitrogen Mineralization or Non-nitrogen Mineralization. Only the nitrogen-mineralization group continues.',
  ],
  [
    'Phase III',
    'Enzyme class',
    'Assigns each qualifying protein to one of the ten enzyme classes documented below.',
  ],
  [
    'Phase IV',
    'EC assignment',
    'Uses the Phase III class to select a class-specific model (M1–M10) and predict a four-digit EC label.',
  ],
] as const;

const enzymeClasses = [
  {
    abbreviation: 'AH',
    name: 'Amidohydrolases',
    description: 'Hydrolyze non-peptide carbon–nitrogen bonds, including urea and linear amides.',
    ec: ['3.5.1.1', '3.5.1.2', '3.5.1.4', '3.5.1.5', '3.5.1.11', '3.5.1.28', 'Others'],
  },
  {
    abbreviation: 'AP',
    name: 'Aminopeptidases',
    description: 'Remove amino-acid residues from the amino terminus of peptides or proteins.',
    ec: ['3.4.11.2', '3.4.11.4', '3.4.11.5', '3.4.11.9', '3.4.11.18', '3.4.11.21', 'Others'],
  },
  {
    abbreviation: 'AEP',
    name: 'Aspartic endopeptidases',
    description: 'Hydrolyze internal peptide bonds through an aspartate-dependent catalytic mechanism.',
    ec: ['3.4.23.24', '3.4.23.36', '3.4.23.43', 'Others'],
  },
  {
    abbreviation: 'CEP',
    name: 'Cysteine endopeptidases',
    description: 'Use a catalytic cysteine to hydrolyze internal peptide bonds.',
    ec: ['3.4.22.15', '3.4.22.28', '3.4.22.50', '3.4.22.66', 'Others'],
  },
  {
    abbreviation: 'DP',
    name: 'Dipeptidases',
    description: 'Hydrolyze dipeptides into their component amino acids.',
    ec: ['3.4.13.9', '3.4.13.19', '3.4.13.21', 'Others'],
  },
  {
    abbreviation: 'DPP',
    name: 'Dipeptidyl-peptidases',
    description: 'Release a dipeptide from the amino terminus of a peptide or protein.',
    ec: ['3.4.14.4', '3.4.14.5', '3.4.14.10', '3.4.14.11', 'Others'],
  },
  {
    abbreviation: 'MEP',
    name: 'Metalloendopeptidases',
    description: 'Use a metal ion to catalyze hydrolysis of internal peptide bonds.',
    ec: [
      '3.4.24.3',
      '3.4.24.11',
      '3.4.24.28',
      '3.4.24.39',
      '3.4.24.59',
      '3.4.24.64',
      '3.4.24.69',
      '3.4.24.84',
      'Others',
    ],
  },
  {
    abbreviation: 'MP',
    name: 'Metallopeptidases',
    description: 'Metal-dependent metallocarboxypeptidases represented by the EC 3.4.17 group.',
    ec: ['3.4.17.21', 'Others'],
  },
  {
    abbreviation: 'OP',
    name: 'Omega peptidases',
    description: 'Hydrolyze specialized terminal or isopeptide linkages in the EC 3.4.19 group.',
    ec: ['3.4.19.3', '3.4.19.12', '3.4.19.13', 'Others'],
  },
  {
    abbreviation: 'SEP',
    name: 'Serine endopeptidases',
    description: 'Use a catalytic serine to hydrolyze internal peptide bonds.',
    ec: [
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
      'Others',
    ],
  },
] as const;

function Section({
  id,
  number,
  title,
  children,
}: {
  id: string;
  number: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      className="scroll-mt-24 border-b border-[var(--line)] px-6 py-7 last:border-b-0 sm:px-8 sm:py-9"
    >
      <header className="mb-5 grid grid-cols-[2.5rem_1fr] items-baseline gap-3">
        <span className="font-mono text-xs font-extrabold tracking-widest text-[var(--ochre)]">
          {number}
        </span>
        <h2 className="font-display text-xl font-bold text-[var(--navy)] sm:text-2xl">{title}</h2>
      </header>
      <div className="space-y-4 text-sm leading-relaxed text-[var(--muted)] sm:ml-[3.25rem]">
        {children}
      </div>
    </section>
  );
}

function Code({ children }: { children: ReactNode }) {
  return (
    <pre className="overflow-x-auto rounded-[2px] border border-[var(--navy-dark)] bg-[#142a2c] p-4 font-mono text-xs leading-6 text-slate-100">
      {children}
    </pre>
  );
}

export default function Help() {
  return (
    <div className="py-4 sm:py-6">
      <header className="border-b border-[var(--line)] pb-6 sm:grid sm:grid-cols-[1fr_280px] sm:items-end sm:gap-10">
        <div>
          <p className="eyebrow">Documentation &amp; Technical Reference Manual</p>
          <h1 className="mt-2 max-w-3xl font-display text-3xl font-semibold leading-tight text-[var(--navy)] sm:text-4xl">
            MINpred workflow, EC coverage &amp; interpretation guide
          </h1>
          <p className="mt-2.5 max-w-3xl text-sm leading-relaxed text-[var(--muted)]">
            Protocols for formatting protein or nucleotide FASTA inputs, operating the four-phase
            ESM-2 (650M) neural cascade, interpreting class and four-digit EC probabilities, and
            inspecting S4PRED 2D and ESMFold / SWISS-MODEL 3D structures.
          </p>
        </div>
        <div className="mt-5 border-l-2 border-[var(--ochre)] pl-4 text-xs leading-relaxed text-[var(--muted)] sm:mt-0">
          <strong className="block font-mono uppercase tracking-wider text-[var(--navy)]">
            First test run
          </strong>
          Load the 10-class benchmark panel in Analyze Sequences with Phase IV automatic routing.
        </div>
      </header>

      <div className="mt-8 grid items-start gap-8 lg:grid-cols-[225px_minmax(0,1fr)]">
        <aside className="lg:sticky lg:top-20">
          <nav aria-label="Help contents">
            <p className="eyebrow">On this page</p>
            <ol className="mt-3 border-l border-[var(--line)] text-xs leading-5">
              {contents.map(([id, label], index) => (
                <li key={id}>
                  <a
                    href={`#${id}`}
                    className="grid grid-cols-[1.8rem_1fr] border-l-2 border-transparent px-3.5 py-1.5 text-[var(--muted)] transition hover:border-[var(--ochre)] hover:bg-[var(--surface)] hover:text-[var(--navy)]"
                  >
                    <span className="font-mono text-[11px] font-bold text-[var(--ochre)]">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <span>{label}</span>
                  </a>
                </li>
              ))}
            </ol>
          </nav>
          <Link href="/prediction" className="btn-ochre mt-5 w-full text-xs">
            Analyze Sequences <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </aside>

        <div className="surface">
          <Section id="quick-start" number="01" title="Quick start">
            <ol className="list-decimal space-y-2 pl-5 text-[var(--ink)]">
              <li>
                Open{' '}
                <Link className="font-semibold text-[var(--ochre)] underline underline-offset-4" href="/prediction">
                  Analyze Sequences
                </Link>{' '}
                and select <strong>Protein FASTA (AA)</strong> or{' '}
                <strong>Nucleotide · TransDecoder</strong>.
              </li>
              <li>
                Paste FASTA sequences, upload a file, fetch UniProtKB/NCBI accessions, or click a
                held-out specimen code (<code className="font-mono">SEP</code>–
                <code className="font-mono">AH</code>).
              </li>
              <li>
                Choose your terminal phase. Keep <strong>Phase IV</strong> with{' '}
                <strong>Auto (All 10)</strong> for end-to-end four-digit EC annotation.
              </li>
              <li>
                Complete verification and execute the cascade. Save your private{' '}
                <code className="font-mono">#job=...&amp;token=...</code> bookmark link and export
                TSV/CSV/JSON tables.
              </li>
            </ol>
          </Section>

          <Section id="input" number="02" title="Sequence input &amp; request limits">
            <h3 className="font-bold text-[var(--navy)]">Protein FASTA</h3>
            <p>
              Each record begins with <code className="font-mono">&gt;</code> and a unique
              identifier, followed by an amino-acid sequence. The workbench accepts the 20 standard
              amino acids and <code className="font-mono">X</code> in upper or lower case (
              <code className="font-mono">X</code> positions are stripped prior to ESM-2
              tokenization). Remove alignment gaps or residue numbers.
            </p>
            <h3 className="font-bold text-[var(--navy)]">Nucleotide FASTA</h3>
            <p>
              Select <strong>Nucleotide · TransDecoder</strong> for DNA, RNA, or transcript FASTA
              containing <code className="font-mono">A, C, G, T, U, N</code>.{' '}
              <code className="font-mono">TransDecoder.LongOrfs</code> extracts candidate open
              reading frames into <code className="font-mono">translated_proteins.fasta</code>{' '}
              before running MINpred; result rows therefore carry predicted ORF identifiers.
            </p>
            <h3 className="font-bold text-[var(--navy)]">Default web limits</h3>
            <dl className="grid grid-cols-[1fr_auto] gap-x-6 gap-y-2 border border-[var(--line)] bg-[var(--surface)] p-4 font-mono text-xs">
              <dt className="text-[var(--ink)]">Sequences per request</dt>
              <dd className="font-bold text-[var(--navy)]">10,000</dd>
              <dt className="text-[var(--ink)]">Total residues or bases</dt>
              <dd className="font-bold text-[var(--navy)]">50,000,000</dd>
              <dt className="text-[var(--ink)]">Residues or bases per sequence</dt>
              <dd className="font-bold text-[var(--navy)]">5,000</dd>
              <dt className="text-[var(--ink)]">Protein accessions per lookup</dt>
              <dd className="font-bold text-[var(--navy)]">100</dd>
              <dt className="text-[var(--ink)]">Active jobs per client</dt>
              <dd className="font-bold text-[var(--navy)]">2</dd>
            </dl>
          </Section>

          <Section id="phases" number="03" title="The four prediction phases">
            <p>
              Selecting a phase runs all preceding filters and stops at that phase. Downstream
              tables include only proteins that passed every earlier gate.
            </p>
            <div className="divide-y divide-[var(--line)] border-y border-[var(--line)]">
              {phases.map(([phase, title, text], index) => (
                <article
                  key={phase}
                  className="grid gap-2 py-4 sm:grid-cols-[2.2rem_175px_1fr] sm:items-baseline"
                >
                  <span className="inline-grid h-6 w-6 place-items-center rounded-[2px] bg-[var(--navy)] font-mono text-xs font-bold text-white">
                    {index + 1}
                  </span>
                  <div>
                    <p className="font-mono text-[11px] font-bold uppercase tracking-wider text-[var(--ochre)]">
                      {phase}
                    </p>
                    <h3 className="font-bold text-[var(--navy)]">{title}</h3>
                  </div>
                  <p>{text}</p>
                </article>
              ))}
            </div>
          </Section>

          <Section id="routing" number="04" title="Phase IV routing">
            <div className="grid gap-4 md:grid-cols-2">
              <article className="border border-[var(--line)] border-t-2 border-t-[var(--navy)] bg-[var(--surface)] p-4">
                <h3 className="font-bold text-[var(--navy)]">Auto (All 10)</h3>
                <p className="mt-1.5 text-xs leading-relaxed">
                  Each qualifying protein follows its own Phase III class assignment to the
                  corresponding specialist Phase IV model (<code className="font-mono">M1–M10</code>
                  ). Recommended for genomes, metagenomes, and mixed inputs.
                </p>
              </article>
              <article className="border border-[var(--line)] border-t-2 border-t-[var(--ochre)] bg-[var(--surface)] p-4">
                <h3 className="font-bold text-[var(--navy)]">Specific Class</h3>
                <p className="mt-1.5 text-xs leading-relaxed">
                  Applies the chosen Phase IV EC head only to proteins assigned to that class in
                  Phase III; it never bypasses upstream filters or forces unmatched sequences into
                  that class.
                </p>
              </article>
            </div>
          </Section>

          <Section id="classes" number="05" title="Ten classes and explicit EC outputs">
            <p>
              MINpred resolves 52 explicit four-digit IUBMB EC numbers plus class-conditional{' '}
              <code className="font-mono">Others</code> outputs across nine EC 3.4 peptidase
              subclasses and EC 3.5.1 linear C–N amidohydrolases:
            </p>
            <div className="divide-y divide-[var(--line)] border-y border-[var(--line)]">
              {enzymeClasses.map((group) => (
                <article
                  key={group.name}
                  className="grid gap-3 py-4 xl:grid-cols-[3rem_205px_1fr]"
                >
                  <span className="font-mono text-xs font-extrabold text-[var(--ochre)]">
                    {group.abbreviation}
                  </span>
                  <div>
                    <h3 className="font-bold text-[var(--navy)]">{group.name}</h3>
                    <p className="mt-0.5 text-xs leading-5">{group.description}</p>
                  </div>
                  <div className="flex flex-wrap content-start gap-1.5">
                    {group.ec.map((label) => (
                      <code
                        key={label}
                        className={`border px-2 py-0.5 font-mono text-[11px] ${
                          label === 'Others'
                            ? 'border-dashed border-[var(--field-border)] text-[var(--muted)]'
                            : 'border-[var(--line-strong)] bg-[var(--surface)] font-semibold text-[var(--navy)]'
                        }`}
                      >
                        {label}
                      </code>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </Section>

          <Section id="results" number="06" title="Reading and exporting results">
            <dl className="space-y-3">
              <div>
                <dt className="font-bold text-[var(--navy)]">Sequence ID</dt>
                <dd>
                  Connects each protein across Phase I–IV tables (sticky first column during
                  horizontal scrolling).
                </dd>
              </div>
              <div>
                <dt className="font-bold text-[var(--navy)]">Probability values (%)</dt>
                <dd>
                  Calibrated neural probabilities are shown for all outputs in the active head.
                  Pyrite-gold (<code className="font-mono">1</code>), mineral-verdigris (
                  <code className="font-mono">2</code>), and basalt (<code className="font-mono">3</code>
                  ) rank badges mark the top three scores per row.
                </dd>
              </div>
              <div>
                <dt className="font-bold text-[var(--navy)]">External database cross-links</dt>
                <dd>
                  Phase IV rows link directly to NCBI Protein, UniProtKB, BRENDA, KEGG, and JGI IMG
                  for the predicted EC number, and tables export cleanly as TSV, CSV, or JSON.
                </dd>
              </div>
            </dl>
          </Section>

          <Section id="structures" number="07" title="Secondary and 3D structure inspection">
            <p>
              <strong className="text-[var(--navy)]">Secondary structure (S4PRED):</strong> Runs
              locally inside the web container, reporting per-residue Helix (<code className="font-mono">H</code>
              ), Strand (<code className="font-mono">E</code>), and Coil (<code className="font-mono">C</code>)
              states plus confidence scores (0–9) with text, PNG, and SVG export.
            </p>
            <p>
              <strong className="text-[var(--navy)]">Three-dimensional folding:</strong> Uses
              ESMFold for sequences up to 400 residues and SWISS-MODEL homology modeling for longer
              proteins when configured, rendered in an interactive WebGL viewer with PDB export.
            </p>
          </Section>

          <Section id="example" number="08" title="Worked benchmark example">
            <ol className="list-decimal space-y-1.5 pl-5">
              <li>
                Open <Link className="font-semibold underline" href="/prediction?example=mixed">Analyze Sequences with the 10-Class Benchmark</Link>.
              </li>
              <li>
                Verify <strong>Phase IV</strong> and <strong>Auto (All 10)</strong> are active,
                complete Turnstile verification, and click <strong>Execute MINpred Cascade</strong>.
              </li>
              <li>
                Inspect Phase I → II → III retention, then switch across the ten specialist Phase IV
                EC tabs to audit four-digit EC probabilities.
              </li>
            </ol>
          </Section>

          <Section id="standalone" number="09" title="Standalone CLI quick reference">
            <p>
              Install from <Link className="font-semibold underline" href="/download">Standalone CLI</Link>{' '}
              to run offline or proteome-scale analyses with all 13 bundled checkpoints:
            </p>
            <Code>{`# Verify SHA-256 checksums of all 13 bundled .keras + .npz files
minpred models-status

# Full four-phase EC prediction on protein FASTA
minpred -i proteins.fasta -o MINpred_results

# Restrict Phase IV to serine endopeptidases
minpred -i proteins.fasta -o MINpred_results -p 4 -c serine

# Nucleotide contigs or transcripts via TransDecoder
minpred -i transcripts.fasta -o MINpred_nucl -t nucleotide`}</Code>
          </Section>

          <Section id="troubleshooting" number="10" title="Troubleshooting">
            <div className="divide-y divide-[var(--line)] border border-[var(--line)]">
              {[
                [
                  'FASTA input is rejected',
                  'Ensure every sequence starts with a unique >identifier header, contains at least 10 residues, and matches the selected alphabet (Protein vs. Nucleotide).',
                ],
                [
                  'No downstream Phase II–IV rows appear',
                  'Sequences predicted as Non-enzyme in Phase I or Non-nitrogen Mineralization in Phase II are filtered out by design. Inspect the preceding phase table for probabilities.',
                ],
                [
                  'Nucleotide FASTA yields zero proteins',
                  'Short or non-coding fragments may contain no qualifying open reading frame under TransDecoder.LongOrfs.',
                ],
                [
                  'Result link cannot be reopened',
                  'Both the job ID and cryptographic #token=... fragment from the original private bookmark URL are required; jobs expire automatically after 30 days.',
                ],
              ].map(([title, body], idx) => (
                <details
                  key={title}
                  name="minpred-troubleshooting"
                  open={idx === 0}
                  className="bg-white px-4 py-3"
                >
                  <summary className="cursor-pointer font-bold text-[var(--navy)]">{title}</summary>
                  <p className="mt-2 text-xs leading-relaxed text-[var(--muted)]">{body}</p>
                </details>
              ))}
            </div>
          </Section>

          <Section id="privacy" number="11" title="Privacy and retention">
            <p>
              Each web submission is protected by a 256-bit ownership token kept in the URL fragment
              (<code className="font-mono">#job=...&amp;token=...</code>) so tokens are not leaked
              in external HTTP Referer headers. Job directories are purged automatically after 30
              days. Tertiary-structure requests transmit only the selected protein sequence to
              ESMFold or SWISS-MODEL.
            </p>
          </Section>

          <Section id="limitations" number="12" title="Interpretation and limitations">
            <div className="flex gap-3 border-l-2 border-[var(--ochre)] bg-[var(--ochre-soft)] p-4 text-xs leading-relaxed text-[var(--ink)]">
              <CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-[var(--ochre)]" />
              <p>
                MINpred predicts catalytic potential from primary sequence representations; it does
                not directly measure transcriptional expression, in-situ soil enzyme kinetics, or
                ecosystem mineralization flux, and its scope is bounded to the ten documented
                nitrogen-mineralization classes.
              </p>
            </div>
          </Section>

          <Section id="citation" number="13" title="Citation, reproducibility &amp; support">
            <blockquote className="border-l-2 border-[var(--ochre)] pl-4 text-[var(--ink)]">
              Duhan, N., Norton, J. M., &amp; Kaundal, R. (2026).{' '}
              <em className="font-semibold text-[var(--navy)]">
                MINpred: A Hierarchical Protein Language Model Framework for Predicting
                Nitrogen-Mineralization Enzymes
              </em>{' '}
              (Version 1.0.0). Available at{' '}
              <a
                className="font-mono text-xs underline underline-offset-2"
                href="https://kaabil.net/minpred"
                target="_blank"
                rel="noreferrer"
              >
                https://kaabil.net/minpred
              </a>{' '}
              and{' '}
              <a
                className="font-mono text-xs underline underline-offset-2"
                href="https://github.com/usubioinfo/minpred"
                target="_blank"
                rel="noreferrer"
              >
                https://github.com/usubioinfo/minpred
              </a>
              .
            </blockquote>
            <p className="text-xs">
              For technical support, contact{' '}
              <a
                className="font-semibold text-[var(--navy)] underline underline-offset-4"
                href="mailto:naveen.duhan@usu.edu"
              >
                Naveen Duhan
              </a>{' '}
              or open an issue on{' '}
              <a
                className="font-semibold text-[var(--ochre)] underline underline-offset-4"
                href="https://github.com/usubioinfo/minpred/issues"
                target="_blank"
                rel="noreferrer"
              >
                github.com/usubioinfo/minpred
              </a>
              .
            </p>
          </Section>
        </div>
      </div>
    </div>
  );
}
