'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, Download, ExternalLink, FlaskConical, Loader2 } from 'lucide-react';
import { withBasePath } from '@/lib/base-path';
import { expiresAt, readJobBookmark, type JobBookmark } from '@/lib/job-bookmark';

type Value = string | number | boolean | null;
type Row = Record<string, Value>;
type Result = {
  jobId?: string;
  status?: string;
  error?: string;
  updatedAt?: string;
  results?: Record<string, Row[]>;
};

const layoutPreview: Result = {
  jobId: 'minpred_example_result',
  status: 'completed',
  updatedAt: new Date().toISOString(),
  results: {
    'Phase_1_dnn_log.tsv': [
      { SampleID: 'minpred_example_1', Prediction: 'Enzyme', Enzyme: 99.4, 'Non-enzyme': 0.6 },
    ],
    'Phase_2_dnn_log.tsv': [
      {
        SampleID: 'minpred_example_1',
        Prediction: 'Nitrogen Mineralization',
        'Nitrogen Mineralization': 97.8,
        'Non-nitrogen Mineralization': 2.2,
      },
    ],
    'Phase_3_dnn_log.tsv': [
      {
        SampleID: 'minpred_example_1',
        Prediction: 'Serine endopeptidases',
        Amidohydrolases: 0.4,
        Aminopeptidases: 0.8,
        'Aspartic endopeptidases': 0.6,
        'Cysteine endopeptidases': 0.9,
        Dipeptidases: 0.5,
        'Dipeptidyl-peptidases': 0.7,
        Metalloendopeptidases: 0.8,
        Metallopeptidases: 0.9,
        'Omega peptidases': 0.8,
        'Serine endopeptidases': 93.6,
      },
    ],
    'Phase_4_serine_log.tsv': [
      {
        SampleID: 'minpred_example_1',
        Enzyme_Class: 'Serine endopeptidases',
        Prediction: '3.4.21.53',
        '3.4.21.1': 0.2,
        '3.4.21.4': 0.3,
        '3.4.21.26': 0.4,
        '3.4.21.53': 91.2,
        '3.4.21.62': 1.4,
        '3.4.21.88': 0.6,
        '3.4.21.89': 0.5,
        '3.4.21.90': 0.3,
        '3.4.21.91': 0.3,
        '3.4.21.92': 0.8,
        '3.4.21.97': 0.4,
        '3.4.21.102': 0.7,
        '3.4.21.105': 0.7,
        '3.4.21.107': 0.6,
        Others: 1.6,
      },
    ],
    'minpred_predictions.tsv': [{ SampleID: 'minpred_example_1', Prediction: 'preview-only output' }],
  },
};

const display = (value: Value | undefined) => {
  const text = String(value ?? '').replaceAll('_', ' ');
  return text.charAt(0).toUpperCase() + text.slice(1);
};

const phase4Names: Record<string, string> = {
  amidohydrolases: 'Amidohydrolases',
  aminopeptidases: 'Aminopeptidases',
  aspartic: 'Aspartic endopeptidases',
  cysteine: 'Cysteine endopeptidases',
  dipeptidases: 'Dipeptidases',
  dipeptidyl: 'Dipeptidyl-peptidases',
  metalloendopeptidases: 'Metalloendopeptidases',
  metallopeptidases: 'Metallopeptidases',
  omega: 'Omega peptidases',
  serine: 'Serine endopeptidases',
};

const outcomeHeading = (phase: string) =>
  phase.includes('Phase_1')
    ? 'Predicted category'
    : phase.includes('Phase_2')
      ? 'Predicted mineralization status'
      : phase.includes('Phase_3')
        ? 'Predicted enzyme class'
        : phase.includes('Phase_4')
          ? 'Predicted EC'
          : 'Prediction';

const heading = (h: string, phase: string) => {
  const names: Record<string, string> = {
    SampleID: 'Sequence ID',
    Sequence_ID: 'Sequence ID',
    Enzyme_Class: 'Enzyme class',
    EC_Number: 'Predicted EC',
    Prediction: outcomeHeading(phase),
  };
  return names[h] || display(h.replace(/^Prob_/, ''));
};

const rank = (n: string) =>
  n.includes('Phase_1')
    ? 1
    : n.includes('Phase_2')
      ? 2
      : n.includes('Phase_3')
        ? 3
        : n.includes('Phase_4')
          ? 4
          : 9;

const meta = (n: string) => {
  if (n.includes('Phase_1')) return ['Phase I', 'Enzyme screen'];
  if (n.includes('Phase_2')) return ['Phase II', 'Mineralization screen'];
  if (n.includes('Phase_3')) return ['Phase III', 'Enzyme class'];
  if (n.includes('Phase_4')) {
    const key = Object.keys(phase4Names).find((value) => n.includes(`_${value}_`));
    return ['Phase IV', key ? `${phase4Names[key]} EC probabilities` : 'EC probabilities'];
  }
  return ['Output', n];
};

const interpretation = (phase: string) =>
  phase.includes('Phase_1')
    ? 'Probabilities are shown for both enzyme and non-enzyme outcomes.'
    : phase.includes('Phase_2')
      ? 'Probabilities are shown for nitrogen-mineralization and non-mineralization outcomes.'
      : phase.includes('Phase_3')
        ? 'Probabilities are shown for all 10 nitrogen-mineralization enzyme classes.'
        : phase.includes('Phase_4')
          ? 'Probabilities are shown for every EC label within this routed enzyme class. Compare enzyme-class probabilities in Phase III.'
          : '';

const metadataColumns = new Set([
  'SampleID',
  'Sequence_ID',
  'Enzyme_Class',
  'Prediction',
  'EC_Number',
]);

const phase3Abbreviations: Record<string, string> = {
  Amidohydrolases: 'AH',
  Aminopeptidases: 'AP',
  'Aspartic endopeptidases': 'AEP',
  'Cysteine endopeptidases': 'CEP',
  Dipeptidases: 'DP',
  'Dipeptidyl-peptidases': 'DPP',
  Metalloendopeptidases: 'MEP',
  Metallopeptidases: 'MP',
  'Omega peptidases': 'OP',
  'Serine endopeptidases': 'SEP',
};

const topProbabilityRanks = (row: Row, columns: string[]) =>
  columns
    .filter(
      (column) =>
        !metadataColumns.has(column) &&
        typeof row[column] === 'number' &&
        Number.isFinite(row[column]),
    )
    .sort((a, b) => Number(row[b]) - Number(row[a]))
    .slice(0, 3)
    .reduce<Record<string, number>>((r, column, index) => ({ ...r, [column]: index + 1 }), {});

const idOf = (row: Row) => String(row.SampleID ?? row.Sequence_ID ?? '');
const tsv = (rows: Row[]) =>
  rows.length
    ? [
        Object.keys(rows[0]).join('\t'),
        ...rows.map((r) =>
          Object.keys(rows[0])
            .map((k) => String(r[k] ?? ''))
            .join('\t'),
        ),
      ].join('\n')
    : '';
const csv = (rows: Row[]) =>
  rows.length
    ? [Object.keys(rows[0]), ...rows.map((r) => Object.keys(rows[0]).map((k) => r[k] ?? ''))]
        .map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(','))
        .join('\n')
    : '';

function save(content: string, name: string, type = 'text/tab-separated-values') {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

async function fetchJob(b: JobBookmark) {
  const response = await fetch(withBasePath(`/api/predict?jobId=${encodeURIComponent(b.jobId)}`), {
    cache: 'no-store',
    headers: { 'X-MINpred-Job-Token': b.jobToken },
  });
  const data = (await response.json()) as Result;
  if (!response.ok) throw new Error(data.error || 'Result was not found.');
  return data;
}

const links = (ec: string) => [
  ['NCBI', `https://www.ncbi.nlm.nih.gov/protein/?term=${encodeURIComponent(ec)}`],
  ['UniProt', `https://www.uniprot.org/uniprotkb?query=${encodeURIComponent(ec)}`],
  ['BRENDA', `https://www.brenda-enzymes.org/enzyme.php?ecno=${encodeURIComponent(ec)}`],
  ['KEGG', `https://www.genome.jp/dbget-bin/www_bget?ec:${encodeURIComponent(ec)}`],
  [
    'JGI',
    `https://img.jgi.doe.gov/cgi-bin/m/main.cgi?section=FindFunctions&page=EnzymeGenomeList&gtype=isolate&ec_number=EC:${encodeURIComponent(ec)}`,
  ],
];

export default function ResultsPage() {
  const [data, setData] = useState<Result | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState('');
  const [active, setActive] = useState('');
  const [structures, setStructures] = useState<
    Record<string, { secondary: string; tertiary: string }>
  >({});
  const [structureBusy, setStructureBusy] = useState('');
  const [bookmark, setBookmark] = useState<JobBookmark | null>(null);

  useEffect(() => {
    let cancelled = false;
    void Promise.resolve().then(async () => {
      const preview = new URLSearchParams(window.location.search).get('preview') === 'layout';
      const b = preview
        ? { jobId: 'minpred_example_result', jobToken: 'layout-preview' }
        : readJobBookmark();
      if (!cancelled) setBookmark(b);
      try {
        let d = preview
          ? layoutPreview
          : b
            ? await fetchJob(b)
            : (JSON.parse(localStorage.getItem('minpred_last_results') || 'null') as Result | null);
        if (b && !preview && d) {
          while (!cancelled && (d.status === 'queued' || d.status === 'running')) {
            await new Promise((r) => setTimeout(r, 3000));
            d = await fetchJob(b);
          }
        }
        if (d?.status === 'failed') throw new Error(d.error || 'Prediction failed.');
        if (!cancelled && d) {
          const available = Object.keys(d.results || {})
            .filter((file) => rank(file) < 9)
            .sort((a, c) => rank(a) - rank(c));
          const requested = new URLSearchParams(window.location.hash.slice(1)).get('phase') || '';
          setData(d);
          setActive(available.includes(requested) ? requested : available[0] || '');
          if (!preview) localStorage.setItem('minpred_last_results', JSON.stringify(d));
        }
      } catch (e: unknown) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Unable to load result.');
      } finally {
        if (!cancelled) setLoaded(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!bookmark) return;
    let cancelled = false;
    const refresh = async () => {
      try {
        const response = await fetch(
          withBasePath('/api/structure/status?jobId=' + encodeURIComponent(bookmark.jobId)),
          { cache: 'no-store', headers: { 'X-MINpred-Job-Token': bookmark.jobToken } },
        );
        if (response.ok && !cancelled) setStructures(await response.json());
      } catch {
        // Keep last known status when transient network hiccup occurs
      }
    };
    void refresh();
    const timer = setInterval(() => void refresh(), 5000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [bookmark]);

  const files = useMemo(
    () =>
      Object.keys(data?.results || {})
        .filter((file) => rank(file) < 9)
        .sort((a, b) => rank(a) - rank(b)),
    [data],
  );
  const rows = data?.results?.[active] || [];
  const isPhase4 = active.includes('Phase_4');
  const columns = Object.keys(rows[0] || {}).filter(
    (column) =>
      !(
        isPhase4 &&
        column === 'EC_Number' &&
        rows.every((row) => String(row.EC_Number ?? '') === String(row.Prediction ?? ''))
      ),
  );
  const expiry = data?.updatedAt ? expiresAt(data.updatedAt) : null;

  async function openStructure(kind: 'secondary' | 'tertiary', sampleId: string) {
    if (!bookmark || structureBusy) return;
    setStructureBusy(kind + ':' + sampleId);
    setError('');
    try {
      const response = await fetch(withBasePath('/api/structure/' + kind), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-MINpred-Job-Token': bookmark.jobToken,
        },
        body: JSON.stringify({ jobId: bookmark.jobId, sampleId }),
      });
      const value = await response.json();
      if (!response.ok) throw new Error(value.error || 'Structure prediction failed.');
      try {
        sessionStorage.setItem(
          'minpred_structure_view',
          JSON.stringify({ job: bookmark.jobId, sample: sampleId, kind, data: value }),
        );
      } catch {
        // Server cache remains available if sessionStorage is restricted
      }
      const fragment = new URLSearchParams({
        job: bookmark.jobId,
        token: bookmark.jobToken,
        sample: sampleId,
        kind,
        phase: active,
      });
      window.location.assign(withBasePath('/structure') + '#' + fragment);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Structure prediction failed.');
    } finally {
      setStructureBusy('');
    }
  }

  if (!loaded) {
    return (
      <div className="py-20 text-center">
        <Loader2 className="mx-auto h-7 w-7 animate-spin text-[var(--navy)]" />
      </div>
    );
  }

  if (!data || !files.length) {
    return (
      <div className="mx-auto max-w-3xl py-14">
        <section className="surface p-10 text-center">
          <FlaskConical className="mx-auto h-8 w-8 text-[var(--ochre)]" />
          <h1 className="mt-4 font-display text-3xl font-semibold text-[var(--navy)]">
            No results loaded
          </h1>
          <p className="mt-2 text-sm text-[var(--muted)]">
            {error || 'Submit protein or nucleotide FASTA sequences to generate cascade results.'}
          </p>
          <Link href="/prediction" className="btn-ochre mt-6">
            Open Analyze Sequences
          </Link>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-6 py-4 sm:py-6">
      <header className="border-b border-[var(--line)] pb-5 sm:grid sm:grid-cols-[1fr_auto] sm:items-end sm:gap-8">
        <div>
          <p className="eyebrow flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-[var(--teal)]" />
            Cascade Execution Complete
          </p>
          <h1 className="mt-2 font-display text-3xl font-semibold text-[var(--navy)] sm:text-4xl">
            MINpred prediction ledger
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--muted)]">
            Phase-resolved probabilities, functional enzyme classes, four-digit EC assignments, and
            on-demand S4PRED / 3D structural models.
          </p>
        </div>
        <Link href="/prediction" className="btn-outline-sharp mt-4 sm:mt-0">
          New Prediction →
        </Link>
      </header>

      {error && (
        <div
          role="alert"
          className="border-l-4 border-[var(--danger)] bg-[var(--danger-soft)] p-3.5 text-sm font-semibold text-[var(--danger)]"
        >
          {error}
        </div>
      )}

      <section className="grid gap-4 border-y border-[var(--line)] bg-[var(--surface)] px-4 py-3.5 sm:grid-cols-[minmax(0,1fr)_auto]">
        <div>
          <p className="font-mono text-[11px] font-bold uppercase tracking-wider text-[var(--ochre)]">
            Job Identifier
          </p>
          <p className="mt-0.5 truncate font-mono text-xs font-semibold text-[var(--navy)]">
            {data.jobId}
          </p>
        </div>
        <div className="sm:text-right">
          <p className="font-mono text-[11px] font-bold uppercase tracking-wider text-[var(--teal)]">
            Private Link Retention
          </p>
          <p className="mt-0.5 font-mono text-xs font-semibold text-[var(--ink)]">
            {expiry ? `Until ${expiry.toLocaleDateString()}` : '30 days'}
          </p>
        </div>
      </section>

      <section className="surface">
        <nav
          aria-label="Result phases"
          className="flex overflow-x-auto border-b border-[var(--line)] bg-[var(--surface)] px-2 sm:px-4"
        >
          {files.map((file) => {
            const [label, title] = meta(file);
            const isActive = active === file;
            return (
              <button
                key={file}
                type="button"
                onClick={() => setActive(file)}
                className={`min-w-40 border-b-[3px] px-4 py-3.5 text-left transition ${
                  isActive
                    ? 'border-[var(--ochre)] bg-white text-[var(--navy)]'
                    : 'border-transparent text-[var(--muted)] hover:text-[var(--navy)]'
                }`}
              >
                <span className="font-mono text-[11px] font-extrabold uppercase tracking-wider text-[var(--ochre)]">
                  {label}
                </span>
                <span className="mt-0.5 block text-sm font-bold">{title}</span>
              </button>
            );
          })}
        </nav>

        <div className="flex flex-col gap-4 border-b border-[var(--line)] p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="eyebrow">{meta(active)[0]}</p>
            <h2
              id="results-phase-heading"
              className="mt-1 font-display text-2xl font-bold text-[var(--navy)]"
            >
              {meta(active)[1]}
            </h2>
            <p className="mt-1.5 max-w-3xl text-xs leading-relaxed text-[var(--muted)]">
              {interpretation(active)}
            </p>
            <div className="probability-key mt-3" aria-label="Probability rank key">
              <span className="probability-key-title">Probability rank (%)</span>
              <span>
                <i className="probability-dot probability-dot-1" />1 Highest
              </span>
              <span>
                <i className="probability-dot probability-dot-2" />2 Second
              </span>
              <span>
                <i className="probability-dot probability-dot-3" />3 Third
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="btn-outline-sharp !min-h-0 !py-1.5 !px-3 !text-xs"
              onClick={() => save(tsv(rows), active)}
            >
              <Download className="h-3.5 w-3.5" />
              TSV
            </button>
            <button
              type="button"
              className="btn-outline-sharp !min-h-0 !py-1.5 !px-3 !text-xs"
              onClick={() => save(csv(rows), active.replace(/\.tsv$/, '.csv'), 'text/csv')}
            >
              <Download className="h-3.5 w-3.5" />
              CSV
            </button>
            <button
              type="button"
              className="btn-outline-sharp !min-h-0 !py-1.5 !px-3 !text-xs"
              onClick={() =>
                save(
                  JSON.stringify(rows, null, 2),
                  active.replace(/\.tsv$/, '.json'),
                  'application/json',
                )
              }
            >
              <Download className="h-3.5 w-3.5" />
              JSON
            </button>
          </div>
        </div>

        <div
          tabIndex={0}
          role="region"
          aria-labelledby="results-phase-heading"
          className="mp-table-region"
        >
          <table className="mp-table min-w-[700px] text-left text-sm">
            <thead className="border-b border-[var(--line-strong)] bg-[var(--surface)]">
              <tr>
                {rows[0] &&
                  columns.map((h) => {
                    const abbreviation = active.includes('Phase_3') ? phase3Abbreviations[h] : '';
                    return (
                      <th
                        key={h}
                        scope="col"
                        className="max-w-36 border-b border-[var(--line-strong)] px-3.5 py-3 font-mono text-xs font-bold tracking-wide text-[var(--navy)]"
                        title={abbreviation ? h : undefined}
                      >
                        {abbreviation ? (
                          <abbr className="no-underline" aria-label={h}>
                            {abbreviation}
                          </abbr>
                        ) : (
                          heading(h, active)
                        )}
                      </th>
                    );
                  })}
                {bookmark && (
                  <th
                    scope="col"
                    className="border-b border-[var(--line-strong)] px-3.5 py-3 font-mono text-xs font-bold tracking-wide text-[var(--navy)]"
                  >
                    Structure
                  </th>
                )}
                {isPhase4 && (
                  <th
                    scope="col"
                    className="border-b border-[var(--line-strong)] px-3.5 py-3 font-mono text-xs font-bold tracking-wide text-[var(--navy)]"
                  >
                    Annotation
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--line)]">
              {rows.map((row, i) => {
                const id = idOf(row);
                const ec = String(row.EC_Number ?? row.Prediction ?? '');
                const probabilityRanks = topProbabilityRanks(row, columns);
                return (
                  <tr key={i}>
                    {columns.map((h, colIdx) => {
                      const probabilityRank = probabilityRanks[h];
                      const isRowHeader = colIdx === 0;
                      const cellText = /sample|sequence.?id|accession/i.test(h)
                        ? String(row[h] ?? '')
                        : display(row[h]);

                      if (isRowHeader) {
                        return (
                          <th
                            key={h}
                            scope="row"
                            className="max-w-52 border-b border-[var(--line)] px-3.5 py-3 font-mono text-xs font-bold break-words text-[var(--navy)]"
                            title={String(row[h] ?? '')}
                          >
                            {cellText}
                          </th>
                        );
                      }

                      return (
                        <td
                          key={h}
                          className={`max-w-52 border-b border-[var(--line)] px-3.5 py-3 text-xs break-words font-medium ${
                            probabilityRank
                              ? `probability-rank probability-rank-${probabilityRank}`
                              : ''
                          }`}
                          title={String(row[h] ?? '')}
                        >
                          {probabilityRank && (
                            <span
                              className="probability-rank-number"
                              aria-label={`Rank ${probabilityRank}`}
                            >
                              {probabilityRank}
                            </span>
                          )}
                          <span>{cellText}</span>
                        </td>
                      );
                    })}
                    {bookmark && (
                      <td className="border-b border-[var(--line)] px-3.5 py-3 text-xs whitespace-nowrap">
                        <button
                          type="button"
                          className="mr-3 font-mono font-bold text-[var(--navy)] underline decoration-[var(--navy)]/40 underline-offset-2 hover:text-[var(--ochre)]"
                          disabled={Boolean(structureBusy)}
                          onClick={() => void openStructure('secondary', id)}
                        >
                          {structureBusy === 'secondary:' + id
                            ? 'Predicting 2D…'
                            : structures[id]?.secondary === 'ready'
                              ? 'View 2D'
                              : structures[id]?.secondary === 'running'
                                ? 'Predicting 2D…'
                                : 'Predict 2D'}
                        </button>
                        <button
                          type="button"
                          className="font-mono font-bold text-[var(--teal)] underline decoration-[var(--teal)]/40 underline-offset-2 hover:text-[var(--ochre)]"
                          disabled={Boolean(structureBusy)}
                          onClick={() => void openStructure('tertiary', id)}
                        >
                          {structureBusy === 'tertiary:' + id
                            ? 'Predicting 3D…'
                            : structures[id]?.tertiary === 'ready'
                              ? 'View 3D'
                              : structures[id]?.tertiary === 'running'
                                ? 'Predicting 3D…'
                                : 'Predict 3D'}
                        </button>
                      </td>
                    )}
                    {isPhase4 && (
                      <td className="border-b border-[var(--line)] px-3.5 py-3 font-mono text-xs whitespace-nowrap">
                        {links(ec).map(([label, url]) => (
                          <a
                            key={label}
                            href={url}
                            target="_blank"
                            rel="noreferrer"
                            className="mr-3 inline-flex items-center gap-0.5 font-bold text-[var(--navy)] hover:text-[var(--ochre)] hover:underline"
                          >
                            {label}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        ))}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {active.includes('Phase_3') && (
          <div className="border-t border-[var(--line)] bg-[var(--surface)] px-5 py-4">
            <p className="font-mono text-[11px] font-extrabold uppercase tracking-wider text-[var(--navy)]">
              Phase III Class Abbreviations
            </p>
            <dl className="mt-2.5 grid gap-x-6 gap-y-1.5 text-xs sm:grid-cols-2 lg:grid-cols-5">
              {Object.entries(phase3Abbreviations).map(([name, abbreviation]) => (
                <div key={name} className="grid grid-cols-[2.3rem_1fr] gap-1.5">
                  <dt className="font-mono font-extrabold text-[var(--ochre)]">{abbreviation}</dt>
                  <dd className="text-[var(--muted)]">{name}</dd>
                </div>
              ))}
            </dl>
          </div>
        )}
      </section>
    </div>
  );
}
