'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  Bookmark,
  Check,
  Copy,
  Database,
  FileUp,
  Loader2,
  RotateCcw,
  ShieldCheck,
} from 'lucide-react';
import TurnstileWidget from '@/components/TurnstileWidget';
import { withBasePath } from '@/lib/base-path';
import { buildJobBookmark } from '@/lib/job-bookmark';
import {
  accessionExamples,
  demoSequenceOptions,
  demoSequences,
  mixedDemoSequence,
  type DemoSequenceKey,
} from '@/data/demo-sequences';

const enzymeClassOptions = [
  ['amidohydrolases', 'Amidohydrolases (EC 3.5.1)'],
  ['aminopeptidases', 'Aminopeptidases (EC 3.4.11)'],
  ['aspartic', 'Aspartic endopeptidases (EC 3.4.23)'],
  ['cysteine', 'Cysteine endopeptidases (EC 3.4.22)'],
  ['dipeptidases', 'Dipeptidases (EC 3.4.13)'],
  ['dipeptidyl', 'Dipeptidyl-peptidases (EC 3.4.14)'],
  ['metalloendopeptidases', 'Metalloendopeptidases (EC 3.4.24)'],
  ['metallopeptidases', 'Metallopeptidases (EC 3.4.17)'],
  ['omega', 'Omega peptidases (EC 3.4.19)'],
  ['serine', 'Serine endopeptidases (EC 3.4.21)'],
] as const;

const phaseCards = [
  ['Phase1', 1, 'Phase I', 'Enzyme vs. Non-enzyme'],
  ['Phase2', 2, 'Phase II', 'N-Mineralization screen'],
  ['Phase3', 3, 'Phase III', '10 Functional classes'],
  ['Phase4', 4, 'Phase IV', 'Class-specific 4-digit EC'],
] as const;

type EnzymeClass = (typeof enzymeClassOptions)[number][0];
type PhaseLevel = (typeof phaseCards)[number][0];
type ExampleSelection = '' | 'mixed' | DemoSequenceKey;

type Job = {
  jobId: string;
  jobToken?: string;
  status: 'queued' | 'running' | 'completed' | 'failed';
  message?: string;
  error?: string;
  results?: Record<string, Record<string, string | number>[]>;
};

async function parseResponse(response: Response) {
  const text = await response.text();
  try {
    return JSON.parse(text) as Job;
  } catch {
    throw new Error(`Prediction service returned ${response.status} ${response.statusText}.`);
  }
}

const wait = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));

async function poll(jobId: string, token: string, update: (message: string) => void) {
  for (;;) {
    const response = await fetch(withBasePath(`/api/predict?jobId=${encodeURIComponent(jobId)}`), {
      cache: 'no-store',
      headers: { 'X-MINpred-Job-Token': token },
    });
    const job = await parseResponse(response);
    if (!response.ok) throw new Error(job.error || 'Unable to read job status.');
    update(job.message || `Job ${job.status}`);
    if (job.status === 'completed' || job.status === 'failed') return job;
    await wait(3000);
  }
}

function computeFastaStats(raw: string) {
  let records = 0;
  let totalLength = 0;
  let maxLength = 0;
  let currentLength = 0;
  let inRecord = false;

  for (const rawLine of raw.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;
    if (line.startsWith('>')) {
      if (inRecord && currentLength > maxLength) maxLength = currentLength;
      records += 1;
      currentLength = 0;
      inRecord = true;
    } else if (inRecord) {
      const cleaned = line.replace(/\s+/g, '').replace(/\*$/, '');
      currentLength += cleaned.length;
      totalLength += cleaned.length;
    }
  }
  if (inRecord && currentLength > maxLength) maxLength = currentLength;
  return { records, totalLength, maxLength };
}

export default function PredictionPage() {
  const [sequenceType, setSequenceType] = useState<'prot' | 'nucl'>('prot');
  const [sequence, setSequence] = useState('');
  const [accessions, setAccessions] = useState('');
  const [database, setDatabase] = useState<'uniprot' | 'ncbi'>('uniprot');
  const [fetchingAccession, setFetchingAccession] = useState(false);
  const [selectedExample, setSelectedExample] = useState<ExampleSelection>('');
  const [level, setLevel] = useState<PhaseLevel>('Phase4');
  const [phase4Mode, setPhase4Mode] = useState<'automatic' | 'specific'>('automatic');
  const [enzymeClass, setEnzymeClass] = useState<EnzymeClass>('amidohydrolases');
  const [fileName, setFileName] = useState('');
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('Preparing secure submission…');
  const [error, setError] = useState('');
  const [turnstile, setTurnstile] = useState('');
  const [resetKey, setResetKey] = useState(0);
  const [securityConfig, setSecurityConfig] = useState({
    loaded: false,
    required: true,
    siteKey: '',
    error: '',
  });
  const [receipt, setReceipt] = useState<{ jobId: string; url: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const fastaRef = useRef<HTMLTextAreaElement>(null);
  const accessionRef = useRef<HTMLInputElement>(null);
  const errorRef = useRef<HTMLDivElement>(null);

  const stats = useMemo(() => computeFastaStats(sequence), [sequence]);
  const activeGateNumber = phaseCards.find(([val]) => val === level)?.[1] ?? 4;

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const preset = params.get('example');
    if (!preset) return;
    void Promise.resolve().then(() => {
      if (preset === 'mixed') {
        setSelectedExample('mixed');
        setSequenceType('prot');
        setSequence(mixedDemoSequence);
        setLevel('Phase4');
        setPhase4Mode('automatic');
      } else if (Object.prototype.hasOwnProperty.call(demoSequences, preset)) {
        const key = preset as DemoSequenceKey;
        setSelectedExample(key);
        setSequenceType('prot');
        setSequence(demoSequences[key].fasta);
        setLevel('Phase4');
        setPhase4Mode('specific');
        setEnzymeClass(key);
      }
    });
  }, []);

  useEffect(() => {
    let cancelled = false;
    void Promise.resolve().then(() => {
      const raw = localStorage.getItem('minpred_active_job');
      if (!raw || cancelled) return;
      try {
        const active = JSON.parse(raw) as { jobId: string; jobToken: string };
        if (!active.jobId || !active.jobToken) return;
        setBusy(true);
        setStatus('Resuming private job monitoring…');
        const url = buildJobBookmark(active);
        setReceipt({ jobId: active.jobId, url });
        void poll(active.jobId, active.jobToken, setStatus)
          .then((job) => {
            if (cancelled) return;
            localStorage.removeItem('minpred_active_job');
            if (job.status === 'failed') throw new Error(job.error || 'Prediction failed.');
            localStorage.setItem('minpred_last_results', JSON.stringify(job));
            window.location.assign(url);
          })
          .catch((e: unknown) => {
            if (!cancelled) {
              setBusy(false);
              setError(e instanceof Error ? e.message : 'Unable to resume job.');
            }
          });
      } catch {
        localStorage.removeItem('minpred_active_job');
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    void fetch(withBasePath('/api/security-config'), { cache: 'no-store' })
      .then(async (response) => {
        const config = (await response.json()) as {
          turnstileRequired?: boolean;
          turnstileSiteKey?: string;
        };
        if (!response.ok) throw new Error('Unable to load verification settings.');
        if (!cancelled) {
          setSecurityConfig({
            loaded: true,
            required: config.turnstileRequired === true,
            siteKey: typeof config.turnstileSiteKey === 'string' ? config.turnstileSiteKey : '',
            error: '',
          });
        }
      })
      .catch(() => {
        if (!cancelled) {
          setSecurityConfig({
            loaded: true,
            required: true,
            siteKey: '',
            error: 'Verification is temporarily unavailable.',
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function focusError(message: string, target?: HTMLElement | null) {
    setError(message);
    if (target) {
      target.focus();
    } else {
      window.requestAnimationFrame(() => errorRef.current?.focus());
    }
  }

  async function fetchAccessions() {
    if (sequenceType === 'nucl' || busy || fetchingAccession) return;
    if (!accessions.trim()) {
      return focusError('Enter at least one UniProtKB or NCBI Protein accession.', accessionRef.current);
    }
    setFetchingAccession(true);
    setError('');
    try {
      const response = await fetch(withBasePath('/api/accession'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessions, database, db: database }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Accession retrieval failed.');
      setSequenceType('prot');
      setSequence(String(data.fasta || '').trim());
      setSelectedExample('');
      setFileName('');
    } catch (e: unknown) {
      focusError(e instanceof Error ? e.message : 'Accession retrieval failed.', accessionRef.current);
    } finally {
      setFetchingAccession(false);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    if (!sequence.trim().startsWith('>')) {
      return focusError('Provide FASTA beginning with a header line (>), load an example, or upload a file.', fastaRef.current);
    }
    if (!securityConfig.loaded) {
      return focusError('Wait for the anti-bot verification to finish loading.');
    }
    if (securityConfig.error || (securityConfig.required && !securityConfig.siteKey)) {
      return focusError(securityConfig.error || 'Anti-bot verification is not configured correctly.');
    }
    if (securityConfig.required && !turnstile) {
      return focusError('Complete the verification check in the right panel before submitting.');
    }

    setBusy(true);
    setStatus('Submitting your sequences…');
    setError('');
    try {
      const response = await fetch(withBasePath('/api/predict'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sequence,
          sequenceType,
          level,
          enzymeClass: level === 'Phase4' && phase4Mode === 'specific' ? enzymeClass : 'all',
          turnstileToken: turnstile,
        }),
      });
      const job = await parseResponse(response);
      if (!response.ok || !job.jobToken) throw new Error(job.error || 'Job submission failed.');
      const active = { jobId: job.jobId, jobToken: job.jobToken };
      localStorage.setItem('minpred_active_job', JSON.stringify(active));
      const url = buildJobBookmark(active);
      setReceipt({ jobId: job.jobId, url });
      const complete = await poll(job.jobId, job.jobToken, setStatus);
      localStorage.removeItem('minpred_active_job');
      if (complete.status === 'failed') throw new Error(complete.error || 'Prediction failed.');
      localStorage.setItem('minpred_last_results', JSON.stringify(complete));
      window.location.assign(url);
    } catch (e: unknown) {
      setBusy(false);
      focusError(e instanceof Error ? e.message : 'Prediction failed.');
      setTurnstile('');
      setResetKey((v) => v + 1);
    }
  }

  function loadFile(file: File) {
    setFileName(file.name);
    setError('');
    const reader = new FileReader();
    reader.onload = () => {
      setSequence(String(reader.result || '').trim());
      setSelectedExample('');
    };
    reader.readAsText(file);
  }

  function handleFileInput(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) loadFile(file);
    event.target.value = '';
  }

  function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (file) loadFile(file);
  }

  function clear() {
    setSequence('');
    setAccessions('');
    setFileName('');
    setError('');
    setReceipt(null);
    setLevel('Phase4');
    setPhase4Mode('automatic');
    setEnzymeClass('amidohydrolases');
    setSelectedExample('');
  }

  function selectExample(choice: ExampleSelection) {
    setSelectedExample(choice);
    setError('');
    setFileName('');
    if (!choice) return;
    setSequenceType('prot');
    if (choice === 'mixed') {
      setSequence(mixedDemoSequence);
      setLevel('Phase4');
      setPhase4Mode('automatic');
    } else {
      setSequence(demoSequences[choice].fasta);
      setLevel('Phase4');
      setPhase4Mode('specific');
      setEnzymeClass(choice);
    }
  }

  function changeSequenceType(next: 'prot' | 'nucl') {
    setSequenceType(next);
    setError('');
    if (next === 'nucl' && selectedExample) {
      setSequence('');
      setSelectedExample('');
    }
  }

  function changePhase4Mode(nextMode: 'automatic' | 'specific') {
    setPhase4Mode(nextMode);
    if (selectedExample && level === 'Phase4') {
      if (nextMode === 'automatic') {
        setSelectedExample('mixed');
        setSequence(mixedDemoSequence);
      } else {
        setSelectedExample(enzymeClass);
        setSequence(demoSequences[enzymeClass].fasta);
      }
    }
  }

  function changeEnzymeClass(nextClass: EnzymeClass) {
    setEnzymeClass(nextClass);
    if (selectedExample && level === 'Phase4' && phase4Mode === 'specific') {
      setSelectedExample(nextClass);
      setSequence(demoSequences[nextClass].fasta);
    }
  }

  function useAccessionExample() {
    setSequenceType('prot');
    setAccessions(accessionExamples[database].value);
    setError('');
    accessionRef.current?.focus();
  }

  return (
    <div className="space-y-6 py-4 sm:py-8">
      <header className="flex flex-col justify-between gap-2 border-b border-[var(--line)] pb-5 sm:flex-row sm:items-end">
        <div>
          <p className="eyebrow">MINpred Workbench</p>
          <h1 className="mt-1.5 font-display text-3xl font-bold text-[var(--forest-dark)] sm:text-4xl">
            Predict nitrogen mineralization enzyme function
          </h1>
        </div>
        <p className="max-w-md text-xs leading-5 text-[var(--muted)] sm:text-right">
          Paste, upload, drag-and-drop, or fetch sequences by accession, then choose your cascade depth.
        </p>
      </header>

      {error && (
        <div
          ref={errorRef}
          tabIndex={-1}
          role="alert"
          className="rounded-lg border border-[#e2b9bf] bg-[#fff7f7] px-4 py-3 text-sm font-semibold text-[var(--danger)] outline-none"
        >
          {error}
        </div>
      )}

      {busy && (
        <section aria-live="polite" className="surface p-5">
          <div className="flex items-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-[var(--forest)]" aria-hidden="true" />
            <div>
              <p className="text-sm font-bold text-[var(--forest-dark)]">{status}</p>
              <p className="mt-1 text-xs text-[var(--muted)]">
                You may keep this page open or bookmark the private result link below.
              </p>
            </div>
          </div>
          {receipt && (
            <div className="mt-4 flex flex-col gap-3 rounded-lg border border-[var(--line)] bg-[var(--canvas)] p-3.5 sm:flex-row sm:items-center">
              <Bookmark className="h-4 w-4 shrink-0 text-[var(--mineral)]" aria-hidden="true" />
              <code className="min-w-0 flex-1 truncate text-xs text-[var(--forest-dark)]">{receipt.url}</code>
              <button
                type="button"
                className="btn-secondary !py-1.5 !px-3 !text-xs"
                onClick={() =>
                  void navigator.clipboard.writeText(receipt.url).then(() => {
                    setCopied(true);
                    setTimeout(() => setCopied(false), 1500);
                  })
                }
              >
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? 'Copied' : 'Copy link'}
              </button>
            </div>
          )}
        </section>
      )}

      <form
        method="post"
        onSubmit={handleSubmit}
        noValidate
        className="grid items-start gap-6 lg:grid-cols-[1.48fr_1fr]"
      >
        {/* LEFT COLUMN: Unified Sequence Input Studio */}
        <section className="surface p-5 sm:p-6 space-y-4" aria-label="Sequence input workspace">
          {/* Row 1: Sequence Type Segmented Radios + Upload + Clear */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <fieldset className="inline-flex rounded-lg border border-[var(--line)] bg-[var(--mist)] p-1">
              <legend className="visually-hidden">Sequence type</legend>
              {(
                [
                  ['prot', 'Protein FASTA (AA)'],
                  ['nucl', 'Nucleotide · TransDecoder'],
                ] as const
              ).map(([val, label]) => (
                <label key={val} className="cursor-pointer">
                  <input
                    type="radio"
                    name="sequenceType"
                    value={val}
                    checked={sequenceType === val}
                    onChange={() => changeSequenceType(val)}
                    className="visually-hidden seg-radio"
                  />
                  <span
                    className={`block rounded-md px-3.5 py-2 text-xs font-bold transition ${
                      sequenceType === val
                        ? 'bg-[var(--forest)] text-white shadow-sm'
                        : 'text-[var(--muted)] hover:text-[var(--forest-dark)]'
                    }`}
                  >
                    {label}
                  </span>
                </label>
              ))}
            </fieldset>

            <div className="flex flex-wrap items-center gap-2">
              <label className="btn-secondary !py-2 !px-3 !text-xs cursor-pointer">
                <FileUp className="h-3.5 w-3.5 text-[var(--mineral)]" aria-hidden="true" />
                <span>{fileName ? `File: ${fileName}` : 'Upload .fasta / .faa'}</span>
                <input
                  type="file"
                  name="fastaFile"
                  accept=".fasta,.fa,.faa,.fna,.txt"
                  onChange={handleFileInput}
                  className="visually-hidden"
                />
              </label>
              <button
                type="button"
                onClick={clear}
                className="btn-secondary !py-2 !px-3 !text-xs"
              >
                <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                Clear
              </button>
            </div>
          </div>

          {/* Row 2: Inline Accession Quick-Fetch Bar (Protein) OR TransDecoder Banner (Nucleotide) */}
          {sequenceType === 'prot' ? (
            <div className="rounded-lg border border-[var(--line)] bg-[var(--canvas)] p-3">
              <div className="flex flex-wrap items-center gap-2">
                <fieldset className="inline-flex rounded-md border border-[var(--line)] bg-white p-0.5">
                  <legend className="visually-hidden">Accession database</legend>
                  {(
                    [
                      ['uniprot', 'UniProtKB'],
                      ['ncbi', 'NCBI'],
                    ] as const
                  ).map(([dbKey, dbLabel]) => (
                    <label key={dbKey} className="cursor-pointer">
                      <input
                        type="radio"
                        name="database"
                        value={dbKey}
                        checked={database === dbKey}
                        onChange={() => setDatabase(dbKey)}
                        className="visually-hidden seg-radio"
                      />
                      <span
                        className={`block rounded px-2.5 py-1.5 text-xs font-bold transition ${
                          database === dbKey
                            ? 'bg-[var(--mineral)] text-white'
                            : 'text-[var(--muted)] hover:text-[var(--forest-dark)]'
                        }`}
                      >
                        {dbLabel}
                      </span>
                    </label>
                  ))}
                </fieldset>

                <label htmlFor="protein-accessions" className="visually-hidden">
                  Fetch protein accessions from {database === 'uniprot' ? 'UniProtKB' : 'NCBI Protein'}
                </label>
                <input
                  ref={accessionRef}
                  id="protein-accessions"
                  name="accessions"
                  type="text"
                  value={accessions}
                  onChange={(e) => {
                    setAccessions(e.target.value);
                    if (error) setError('');
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
                      e.preventDefault();
                      void fetchAccessions();
                    }
                  }}
                  autoCorrect="off"
                  autoCapitalize="none"
                  spellCheck={false}
                  enterKeyHint="go"
                  placeholder={`Fetch accession(s), e.g. ${accessionExamples[database].value} (up to 100)`}
                  className="field min-w-[200px] flex-1 !py-1.5 !px-3 text-xs font-mono"
                />

                <button
                  type="button"
                  onClick={useAccessionExample}
                  className="px-1.5 py-1 text-xs font-bold text-[var(--mineral)] underline underline-offset-4 hover:text-[var(--forest-dark)]"
                >
                  Try {accessionExamples[database].value}
                </button>

                <button
                  type="button"
                  disabled={fetchingAccession}
                  onClick={() => void fetchAccessions()}
                  className="btn-primary !py-1.5 !px-3.5 !text-xs"
                >
                  {fetchingAccession ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                  ) : (
                    <Database className="h-3.5 w-3.5" aria-hidden="true" />
                  )}
                  <span>{fetchingAccession ? 'Fetching…' : 'Fetch'}</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-[#b4dce6] bg-[var(--mineral-soft)] px-3.5 py-2.5 text-xs leading-5 text-[var(--forest-dark)]">
              <strong className="font-bold text-[var(--mineral)]">ORF Translation Active:</strong>{' '}
              <code className="font-mono">TransDecoder.LongOrfs</code> extracts candidate coding regions (
              <code className="font-mono">A, C, G, T, U, N</code>) into{' '}
              <code className="font-mono">translated_proteins.fasta</code> before running MINpred.
            </div>
          )}

          {/* Row 3: Example Selector + Drag-and-Drop FASTA Textarea */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              if (!dragging) setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            className={`space-y-2 rounded-lg transition ${
              dragging ? 'ring-2 ring-[var(--mineral)] ring-offset-4' : ''
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label htmlFor="minpred-fasta" className="text-sm font-bold text-[var(--forest-dark)]">
                FASTA Workspace{' '}
                <span className="text-xs font-normal text-[var(--muted)]">
                  (paste or drag &amp; drop a file)
                </span>
              </label>

              <div className="flex items-center gap-2">
                <label htmlFor="example-preset" className="text-xs font-bold text-[var(--muted)]">
                  Example:
                </label>
                <select
                  id="example-preset"
                  name="examplePreset"
                  value={selectedExample}
                  onChange={(e) => selectExample(e.target.value as ExampleSelection)}
                  className="field !w-auto max-w-[260px] !py-1.5 !pl-2.5 !pr-8 text-xs font-bold"
                >
                  <option value="">Choose an example set…</option>
                  {demoSequenceOptions.map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="relative">
              <textarea
                ref={fastaRef}
                id="minpred-fasta"
                name="sequence"
                rows={11}
                value={sequence}
                onChange={(e) => {
                  setSequence(e.target.value);
                  setSelectedExample('');
                  if (error) setError('');
                }}
                autoCorrect="off"
                autoCapitalize="none"
                spellCheck={false}
                aria-describedby="fasta-stats"
                placeholder={
                  sequenceType === 'nucl'
                    ? '>transcript_01\nATGAAACTGATTCGTAAAGAC...'
                    : '>protein_id\nMRIDDILAPVKEALADGRPLTVYGLGNP...'
                }
                className="field resize-y bg-[#fbfdff] font-mono text-xs leading-6"
              />
              {dragging && (
                <div className="pointer-events-none absolute inset-0 grid place-items-center rounded-lg border-2 border-dashed border-[var(--mineral)] bg-[var(--mineral-soft)]/90 text-sm font-extrabold text-[var(--forest-dark)]">
                  Drop FASTA file to load sequences
                </div>
              )}
            </div>

            <div
              id="fasta-stats"
              className="flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--muted)]"
            >
              <span>
                <strong className="font-bold text-[var(--forest-dark)]">
                  {stats.records.toLocaleString()}
                </strong>{' '}
                record{stats.records === 1 ? '' : 's'} ·{' '}
                <strong className="font-bold text-[var(--forest-dark)]">
                  {stats.totalLength.toLocaleString()}
                </strong>{' '}
                {sequenceType === 'nucl' ? 'nt' : 'aa'}{' '}
                <span className="opacity-80">(max 10,000 seqs · 5,000/seq)</span>
              </span>
              <span className="font-mono font-semibold text-[var(--mineral)]">
                {sequenceType === 'nucl'
                  ? 'Accepted: A, C, G, T, U, N'
                  : stats.maxLength > 1022
                    ? `Longest: ${stats.maxLength.toLocaleString()} aa · sliding-window active`
                    : '20 standard AAs + X · >1,022 aa windowed'}
              </span>
            </div>
          </div>
        </section>

        {/* RIGHT COLUMN: Connected Cascade Selector, Phase IV Routing & Launch Panel */}
        <aside className="surface space-y-5 p-5 sm:p-6 lg:sticky lg:top-24">
          <fieldset>
            <legend className="visually-hidden">Cascade depth</legend>
            <div className="flex items-center justify-between gap-2">
              <span aria-hidden="true" className="eyebrow !text-xs">Cascade Depth</span>
              <span className="font-mono text-xs font-bold text-[var(--muted)]">
                {activeGateNumber === 1 ? 'Gate 1 active' : `Gates 1 → ${activeGateNumber} active`}
              </span>
            </div>
            <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
              Selecting a terminal phase automatically runs all preceding screening gates.
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2.5">
              {phaseCards.map(([value, num, title, subtitle]) => {
                const selected = level === value;
                const included = num <= activeGateNumber;
                return (
                  <label key={value} className="cursor-pointer">
                    <input
                      type="radio"
                      name="level"
                      value={value}
                      checked={selected}
                      onChange={() => setLevel(value)}
                      className="visually-hidden phase-radio"
                    />
                    <div
                      className={`rounded-lg border p-3 transition ${
                        selected
                          ? 'border-[var(--forest)] bg-[var(--mineral-soft)] ring-1 ring-[var(--forest)]'
                          : included
                            ? 'border-[#9dc6d1] bg-[#f4fbfd] hover:border-[var(--mineral)]'
                            : 'border-[var(--line)] bg-white opacity-70 hover:opacity-100'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-sm font-extrabold text-[var(--forest-dark)]">{title}</span>
                        <span
                          className={`font-mono text-[11px] font-bold ${
                            included ? 'text-[var(--mineral)]' : 'text-[var(--muted)]'
                          }`}
                        >
                          {selected ? 'Target' : included ? '✓ Run' : 'Skip'}
                        </span>
                      </div>
                      <p className="mt-1 text-xs leading-4 text-[var(--muted)]">{subtitle}</p>
                    </div>
                  </label>
                );
              })}
            </div>
          </fieldset>

          {/* Phase IV Class Routing */}
          <fieldset
            disabled={level !== 'Phase4'}
            className={`rounded-lg border border-[var(--line)] bg-[var(--canvas)] p-3.5 space-y-2.5 transition ${
              level !== 'Phase4' ? 'opacity-55' : ''
            }`}
          >
            <legend className="visually-hidden">Phase IV class routing</legend>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span aria-hidden="true" className="text-xs font-extrabold text-[var(--forest-dark)]">
                Phase IV Class Routing
              </span>
              <div className="inline-flex rounded-md border border-[var(--line)] bg-white p-0.5">
                {(
                  [
                    ['automatic', 'Auto (All 10)'],
                    ['specific', '1 Class'],
                  ] as const
                ).map(([modeKey, modeLabel]) => (
                  <label key={modeKey} className="cursor-pointer">
                    <input
                      type="radio"
                      name="phase4Mode"
                      value={modeKey}
                      checked={phase4Mode === modeKey}
                      onChange={() => changePhase4Mode(modeKey)}
                      className="visually-hidden seg-radio"
                    />
                    <span
                      className={`block rounded px-2.5 py-1 text-xs font-bold transition ${
                        phase4Mode === modeKey
                          ? 'bg-[var(--forest)] text-white'
                          : 'text-[var(--muted)] hover:text-[var(--forest-dark)]'
                      }`}
                    >
                      {modeLabel}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {level !== 'Phase4' ? (
              <p className="text-xs leading-5 text-[var(--muted)]">
                Select <strong>Phase IV</strong> above to configure four-digit EC routing.
              </p>
            ) : phase4Mode === 'automatic' ? (
              <p className="text-xs leading-5 text-[var(--muted)]">
                Each qualifying protein automatically routes from its Phase III class prediction to the
                corresponding EC model (<code className="font-mono">M1–M10</code>).
              </p>
            ) : (
              <div className="space-y-1.5">
                <label htmlFor="enzyme-class-select" className="text-xs font-semibold text-[var(--muted)]">
                  Target Phase IV enzyme class
                </label>
                <select
                  id="enzyme-class-select"
                  name="enzymeClass"
                  value={enzymeClass}
                  onChange={(e) => changeEnzymeClass(e.target.value as EnzymeClass)}
                  className="field !py-2 text-xs font-bold"
                >
                  {enzymeClassOptions.map(([val, label]) => (
                    <option key={val} value={val}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </fieldset>

          {/* Verification & Submit */}
          <div className="space-y-3.5 border-t border-[var(--line)] pt-4">
            <div>
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-[var(--forest-dark)]">Submission verification</span>
                <span className="text-[var(--muted)]">30-day private link</span>
              </div>
              <div className="mt-2 min-h-8">
                {!securityConfig.loaded ? (
                  <div className="flex min-h-8 items-center gap-2 text-xs text-[var(--muted)]">
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    Loading verification…
                  </div>
                ) : securityConfig.error ? (
                  <p className="text-xs font-semibold text-[var(--danger)]">{securityConfig.error}</p>
                ) : securityConfig.required ? (
                  turnstile ? (
                    <span className="flex items-center gap-2 text-xs font-bold text-[var(--mineral)]">
                      <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                      Verification complete
                    </span>
                  ) : (
                    <TurnstileWidget
                      siteKey={securityConfig.siteKey}
                      resetKey={resetKey}
                      onToken={setTurnstile}
                    />
                  )
                ) : (
                  <span className="flex items-center gap-2 text-xs font-semibold text-[var(--mineral)]">
                    <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                    Ready to submit on GPU cluster
                  </span>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={busy}
              className="btn-primary w-full py-3 text-sm"
            >
              {busy ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  Running prediction…
                </>
              ) : (
                <>
                  Start prediction <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </>
              )}
            </button>

            <p className="text-center text-xs text-[var(--muted)]">
              Analyzing whole proteomes (&gt;10,000 ORFs)? Use the{' '}
              <a className="font-bold text-[var(--forest)] underline underline-offset-4" href={withBasePath('/download')}>
                standalone CLI
              </a>
              .
            </p>
          </div>
        </aside>
      </form>
    </div>
  );
}
