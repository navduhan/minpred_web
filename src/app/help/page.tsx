import Link from 'next/link';
import type { ReactNode } from 'react';
import { ArrowRight, CircleAlert } from 'lucide-react';

const contents = [
  ['quick-start', 'Quick start'],
  ['input', 'Sequence input & quotas'],
  ['phases', 'Four prediction phases'],
  ['routing', 'Phase IV routing'],
  ['classes', '10 classes & EC labels'],
  ['results', 'Reading results'],
  ['structures', 'Protein structures'],
  ['standalone', 'Standalone CLI'],
  ['troubleshooting', 'Troubleshooting'],
  ['privacy', 'Privacy & retention'],
  ['limitations', 'Limitations'],
  ['citation', 'Citation & support'],
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
    'Classifies qualifying enzymes as Nitrogen Mineralization or Non-nitrogen Mineralization.',
  ],
  [
    'Phase III',
    'Enzyme class',
    'Assigns each qualifying mineralization enzyme to one of the ten classes below.',
  ],
  [
    'Phase IV',
    'EC assignment',
    'Selects the matching class-specific model (M1–M10) to predict an explicit four-digit EC label.',
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
    description: 'Hydrolyze internal peptide bonds through an aspartate-dependent mechanism.',
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
    description: 'Hydrolyze dipeptides into free amino acids.',
    ec: ['3.4.13.9', '3.4.13.19', '3.4.13.21', 'Others'],
  },
  {
    abbreviation: 'DPP',
    name: 'Dipeptidyl-peptidases',
    description: 'Release an N-terminal dipeptide from a peptide or protein.',
    ec: ['3.4.14.4', '3.4.14.5', '3.4.14.10', '3.4.14.11', 'Others'],
  },
  {
    abbreviation: 'MEP',
    name: 'Metalloendopeptidases',
    description: 'Use a metal cofactor to hydrolyze internal peptide bonds.',
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
    description: 'Metal-dependent metallocarboxypeptidases in the EC 3.4.17 subclass.',
    ec: ['3.4.17.21', 'Others'],
  },
  {
    abbreviation: 'OP',
    name: 'Omega peptidases',
    description: 'Hydrolyze terminal or isopeptide linkages in the EC 3.4.19 subclass.',
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
      className="scroll-mt-24 border-b border-[var(--line)] px-6 py-7 last:border-b-0 sm:px-8 sm:py-8"
    >
      <header className="mb-4 grid grid-cols-[2.5rem_1fr] items-baseline gap-3">
        <span className="font-mono text-sm font-extrabold tracking-wider text-[var(--ochre)]">
          {number}
        </span>
        <h2 className="font-display text-xl font-bold text-[var(--navy)] sm:text-2xl">{title}</h2>
      </header>
      <div className="space-y-4 text-[15.5px] leading-7 text-[var(--ink)] sm:ml-[3.25rem]">
        {children}
      </div>
    </section>
  );
}

function Code({ children }: { children: ReactNode }) {
  return (
    <pre className="overflow-x-auto rounded-xl border border-[var(--navy-dark)] bg-[#122628] p-4 font-mono text-[13.5px] leading-6 text-slate-100">
      {children}
    </pre>
  );
}

export default function Help() {
  return (
    <div className="space-y-8 py-6 pb-10">
      {/* Compact User Guide Header */}
      <header className="flex flex-col justify-between gap-4 border-b border-[var(--line-strong)] pb-5 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-[var(--navy)] sm:text-[1.68rem]">
            MINpred User Guide &amp; Quotas
          </h1>
          <p className="mt-1 text-[15px] text-[var(--ink-secondary)]">
            Sequence input formats, four-phase EC routing, structure prediction &amp; server limits
          </p>
        </div>
        <Link href="/prediction" className="btn-amber shrink-0">
          <span>Open Prediction Workspace</span>
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </header>

      <div className="grid items-start gap-8 lg:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="lg:sticky lg:top-24">
          <nav aria-label="Help contents" className="surface p-4">
            <p className="eyebrow border-b border-[var(--line)] pb-2">Guide Index</p>
            <ol className="mt-2 divide-y divide-[var(--line)] text-sm">
              {contents.map(([id, label], index) => (
                <li key={id}>
                  <a
                    href={`#${id}`}
                    className="grid grid-cols-[2rem_1fr] items-baseline py-2.5 font-semibold text-[var(--ink-secondary)] transition hover:text-[var(--teal)]"
                  >
                    <span className="font-mono text-xs font-bold text-[var(--ochre)]">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <span>{label}</span>
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        </aside>

        <div className="surface overflow-hidden">
          <Section id="quick-start" number="01" title="Quick start">
            <ol className="list-decimal space-y-2 pl-5">
              <li>
                Open{' '}
                <Link className="font-bold text-[var(--teal)] hover:underline" href="/prediction">
                  Predict
                </Link>{' '}
                and choose <strong>Protein Sequences (AA)</strong> or{' '}
                <strong>Nucleotide (DNA / RNA)</strong>.
              </li>
              <li>
                Paste FASTA sequences, upload a file, fetch UniProtKB/NCBI accessions, or load an
                example set.
              </li>
              <li>
                Keep <strong>Complete Cascade (Phases I–IV)</strong> and{' '}
                <strong>Auto-Route All 10 Classes</strong> selected for full four-digit EC
                prediction.
              </li>
              <li>
                Submit the job and save your private{' '}
                <code className="font-mono">#job=...&amp;token=...</code> URL to revisit or export
                TSV/CSV/JSON tables within 30 days.
              </li>
            </ol>
          </Section>

          <Section id="input" number="02" title="Sequence input &amp; server quotas">
            <p>
              <strong>Protein FASTA:</strong> Each record must start with <code className="font-mono">&gt;</code>{' '}
              followed by standard amino-acid letters (plus <code className="font-mono">X</code>).
            </p>
            <p>
              <strong>Nucleotide FASTA:</strong> Select <strong>Nucleotide (DNA / RNA)</strong> for
              transcripts or contigs (<code className="font-mono">A, C, G, T, U, N</code>);{' '}
              <code className="font-mono">TransDecoder.LongOrfs</code> extracts open reading frames
              automatically prior to prediction.
            </p>
            <div className="sci-table-wrap">
              <table className="sci-table">
                <thead>
                  <tr>
                    <th>Quota</th>
                    <th>Web Server Limit</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Sequences per job</td>
                    <td className="font-mono font-bold text-[var(--navy)]">10,000</td>
                  </tr>
                  <tr>
                    <td>Total residues or bases per job</td>
                    <td className="font-mono font-bold text-[var(--navy)]">50,000,000</td>
                  </tr>
                  <tr>
                    <td>Maximum length per sequence</td>
                    <td className="font-mono font-bold text-[var(--navy)]">5,000 aa / nt</td>
                  </tr>
                  <tr>
                    <td>Protein accessions per fetch</td>
                    <td className="font-mono font-bold text-[var(--navy)]">100 IDs</td>
                  </tr>
                  <tr>
                    <td>Active jobs per client</td>
                    <td className="font-mono font-bold text-[var(--navy)]">2</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Section>

          <Section id="phases" number="03" title="Four prediction phases">
            <p>
              Selecting a phase executes all preceding filters in sequence; downstream tables
              contain only sequences that passed earlier phases:
            </p>
            <div className="divide-y divide-[var(--line)] rounded-xl border border-[var(--line-strong)] bg-[var(--surface)] px-4">
              {phases.map(([phase, title, text], index) => (
                <article
                  key={phase}
                  className="grid gap-2 py-4 sm:grid-cols-[2.4rem_185px_1fr] sm:items-baseline"
                >
                  <span className="inline-grid h-7 w-7 place-items-center rounded-md bg-[var(--navy)] font-mono text-xs font-bold text-white">
                    {index + 1}
                  </span>
                  <div>
                    <p className="font-mono text-xs font-bold uppercase tracking-wider text-[var(--ochre)]">
                      {phase}
                    </p>
                    <h3 className="text-base font-bold text-[var(--navy)]">{title}</h3>
                  </div>
                  <p className="text-[15px]">{text}</p>
                </article>
              ))}
            </div>
          </Section>

          <Section id="routing" number="04" title="Phase IV EC routing">
            <div className="grid gap-4 md:grid-cols-2">
              <article className="rounded-xl border border-[var(--line-strong)] bg-[var(--surface)] p-4">
                <h3 className="text-base font-bold text-[var(--navy)]">
                  Auto-Route All 10 Classes
                </h3>
                <p className="mt-1.5 text-sm leading-6">
                  Each qualifying protein follows its Phase III class prediction to the matching
                  Phase IV specialist model (<code className="font-mono">M1–M10</code>). Recommended
                  for genomes, metagenomes, and mixed batches.
                </p>
              </article>
              <article className="rounded-xl border border-[var(--line-strong)] bg-[var(--surface)] p-4">
                <h3 className="text-base font-bold text-[var(--navy)]">Restrict to One Class</h3>
                <p className="mt-1.5 text-sm leading-6">
                  Runs Phase IV EC prediction only on sequences assigned to the selected class in
                  Phase III; unmatched sequences remain at Phase III without forced EC assignment.
                </p>
              </article>
            </div>
          </Section>

          <Section id="classes" number="05" title="10 enzyme classes &amp; 52 explicit ECs">
            <div className="divide-y divide-[var(--line)] border-y border-[var(--line)]">
              {enzymeClasses.map((group) => (
                <article
                  key={group.name}
                  className="grid gap-3 py-4 xl:grid-cols-[3.5rem_215px_1fr]"
                >
                  <span className="font-mono text-sm font-extrabold text-[var(--ochre)]">
                    {group.abbreviation}
                  </span>
                  <div>
                    <h3 className="text-base font-bold text-[var(--navy)]">{group.name}</h3>
                    <p className="mt-0.5 text-sm leading-6 text-[var(--ink-secondary)]">
                      {group.description}
                    </p>
                  </div>
                  <div className="flex flex-wrap content-start gap-1.5">
                    {group.ec.map((label) => (
                      <code
                        key={label}
                        className={`rounded-md border px-2 py-0.5 font-mono text-xs ${
                          label === 'Others'
                            ? 'border-dashed border-[var(--field-border)] text-[var(--ink-secondary)]'
                            : 'border-[var(--line-strong)] bg-[var(--surface)] font-bold text-[var(--navy)]'
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

          <Section id="results" number="06" title="Reading &amp; exporting results">
            <p>
              Result tables display calibrated neural probabilities (%) across all classes or EC
              numbers in the selected phase, highlighting the top three scores per sequence and
              linking Phase IV predictions directly to NCBI, UniProtKB, BRENDA, KEGG, and JGI IMG.
            </p>
          </Section>

          <Section id="structures" number="07" title="Secondary &amp; 3D structure prediction">
            <p>
              <strong>Secondary structure (S4PRED):</strong> Predicts Helix (<code className="font-mono">H</code>),
              Strand (<code className="font-mono">E</code>), and Coil (<code className="font-mono">C</code>)
              states with per-residue confidence scores and SVG/PNG export.
            </p>
            <p>
              <strong>3D structure:</strong> Uses ESMFold (≤400 aa) or SWISS-MODEL (&gt;400 aa when
              configured) in an interactive 3D viewer with PDB download.
            </p>
          </Section>

          <Section id="standalone" number="08" title="Standalone CLI quick reference">
            <Code>{`# Verify SHA-256 checksums of all 13 bundled .keras + .npz files
minpred models-status

# Full four-phase EC prediction on protein FASTA
minpred -i proteins.fasta -o MINpred_results

# Restrict Phase IV to serine endopeptidases
minpred -i proteins.fasta -o MINpred_results -p 4 -c serine

# Nucleotide contigs or transcripts via TransDecoder
minpred -i transcripts.fasta -o MINpred_nucl -t nucleotide`}</Code>
          </Section>

          <Section id="troubleshooting" number="09" title="Troubleshooting">
            <div className="divide-y divide-[var(--line)] overflow-hidden rounded-xl border border-[var(--line-strong)]">
              {[
                [
                  'FASTA input is rejected',
                  'Ensure every sequence starts with a unique >identifier header, contains at least 10 residues, and matches the selected sequence type.',
                ],
                [
                  'No downstream Phase II–IV rows appear',
                  'Sequences predicted as Non-enzyme in Phase I or Non-mineralization in Phase II are filtered out by design. Check earlier phase tabs for probabilities.',
                ],
                [
                  'Nucleotide FASTA yields zero proteins',
                  'Short or non-coding fragments may contain no qualifying open reading frame under TransDecoder.LongOrfs.',
                ],
                [
                  'Result link cannot be reopened',
                  'Include the complete URL with its #job=...&token=... fragment; saved jobs expire automatically after 30 days.',
                ],
              ].map(([title, body], idx) => (
                <details
                  key={title}
                  name="minpred-troubleshooting"
                  open={idx === 0}
                  className="bg-white px-4 py-3.5"
                >
                  <summary className="cursor-pointer text-base font-bold text-[var(--navy)]">
                    {title}
                  </summary>
                  <p className="mt-2 text-sm leading-6 text-[var(--ink-secondary)]">{body}</p>
                </details>
              ))}
            </div>
          </Section>

          <Section id="privacy" number="10" title="Privacy &amp; retention">
            <p>
              Jobs are protected by a 256-bit capability token kept in the URL hash fragment (
              <code className="font-mono">#job=...&amp;token=...</code>) and deleted automatically
              after 30 days.
            </p>
          </Section>

          <Section id="limitations" number="11" title="Limitations">
            <div className="flex gap-3 rounded-xl border border-[var(--ochre-border)] bg-[var(--ochre-soft)] p-4 text-sm leading-6 text-[var(--ink)]">
              <CircleAlert className="mt-0.5 h-5 w-5 shrink-0 text-[var(--ochre)]" />
              <p>
                MINpred predicts catalytic potential from primary sequence representations; it does
                not measure expression or in-situ soil enzyme rates, and is scoped to the 10
                documented nitrogen-mineralization enzyme classes.
              </p>
            </div>
          </Section>

          <Section id="citation" number="12" title="Citation &amp; support">
            <blockquote className="rounded-xl border border-[var(--line-strong)] bg-[var(--surface)] p-4 text-[15px] leading-7 text-[var(--ink)]">
              Duhan, N., Norton, J. M., &amp; Kaundal, R. (2026).{' '}
              <em className="font-semibold text-[var(--navy)]">
                MINpred: A Hierarchical Protein Language Model Framework for Predicting
                Nitrogen-Mineralization Enzymes
              </em>{' '}
              (v1.0.0). Available at{' '}
              <a
                className="font-mono text-sm font-bold text-[var(--teal)] hover:underline"
                href="https://kaabil.net/minpred"
                target="_blank"
                rel="noreferrer"
              >
                https://kaabil.net/minpred
              </a>{' '}
              and{' '}
              <a
                className="font-mono text-sm font-bold text-[var(--teal)] hover:underline"
                href="https://github.com/usubioinfo/minpred"
                target="_blank"
                rel="noreferrer"
              >
                https://github.com/usubioinfo/minpred
              </a>
              .
            </blockquote>
            <p className="text-sm">
              Contact:{' '}
              <a
                className="font-bold text-[var(--navy)] hover:underline"
                href="mailto:naveen.duhan@usu.edu"
              >
                naveen.duhan@usu.edu
              </a>{' '}
              · Issues:{' '}
              <a
                className="font-bold text-[var(--ochre)] hover:underline"
                href="https://github.com/usubioinfo/minpred/issues"
                target="_blank"
                rel="noreferrer"
              >
                github.com/usubioinfo/minpred/issues
              </a>
            </p>
          </Section>
        </div>
      </div>
    </div>
  );
}
