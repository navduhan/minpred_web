'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  Bookmark,
  Check,
  Copy,
  Database,
  FileUp,
  Info,
  Loader2,
  RotateCcw,
  ShieldCheck,
  X,
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
import { MINERALIZATION_CLASSES } from '@/data/mineralization-classes';

const enzymeClassOptions = [
  ['amidohydrolases', 'AH · Amidohydrolases (EC 3.5.1)'],
  ['aminopeptidases', 'AP · Aminopeptidases (EC 3.4.11)'],
  ['aspartic', 'AEP · Aspartic endopeptidases (EC 3.4.23)'],
  ['cysteine', 'CEP · Cysteine endopeptidases (EC 3.4.22)'],
  ['dipeptidases', 'DP · Dipeptidases (EC 3.4.13)'],
  ['dipeptidyl', 'DPP · Dipeptidyl-peptidases (EC 3.4.14)'],
  ['metalloendopeptidases', 'MEP · Metalloendopeptidases (EC 3.4.24)'],
  ['metallopeptidases', 'MP · Metallopeptidases (EC 3.4.17)'],
  ['omega', 'OP · Omega peptidases (EC 3.4.19)'],
  ['serine', 'SEP · Serine endopeptidases (EC 3.4.21)'],
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
  const dialogRef = useRef<HTMLDialogElement>(null);
  const pressedOutsideDialog = useRef(false);

  const stats = useMemo(() => computeFastaStats(sequence), [sequence]);
  const activeGateNumber = phaseCards.find(([val]) => val === level)?.[1] ?? 4;

  const activeExampleMeta = useMemo(() => {
    if (!selectedExample) return null;
    if (selectedExample === 'mixed') {
      return {
        badge: '10-Class Demo Set',
        summary:
          'Loaded 10 curated Swiss-Prot sequences (1 representative protein from each of the 10 classes) with Phase IV Auto-Route enabled.',
      };
    }
    const cls = MINERALIZATION_CLASSES.find((item) => item.key === selectedExample);
    if (!cls) return null;
    return {
      badge: `${cls.code} · ${cls.name}`,
      summary: `Loaded 1 representative sequence for ${cls.name} (${cls.ecPrefix}; ${cls.ecs.length} explicit four-digit ECs) with Phase IV filtered to ${cls.code}.`,
    };
  }, [selectedExample]);

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

  function openGuideModal() {
    const dlg = dialogRef.current;
    if (dlg && !dlg.open) {
      dlg.showModal();
    }
  }

  function closeGuideModal() {
    const dlg = dialogRef.current;
    if (dlg?.open) {
      dlg.close();
      dlg.returnValue = '';
    }
  }

  // Light-dismiss fallback for browsers without native <dialog closedby="any"> (e.g. Safari)
  function isPointerOutsideDialog(event: React.PointerEvent<HTMLDialogElement>) {
    const dlg = dialogRef.current;
    if (!dlg) return false;
    const rect = dlg.getBoundingClientRect();
    return (
      event.clientX < rect.left ||
      event.clientX > rect.right ||
      event.clientY < rect.top ||
      event.clientY > rect.bottom
    );
  }

  function handleDialogPointerDown(event: React.PointerEvent<HTMLDialogElement>) {
    if (typeof HTMLDialogElement !== 'undefined' && 'closedBy' in HTMLDialogElement.prototype) {
      return;
    }
    pressedOutsideDialog.current = isPointerOutsideDialog(event);
  }

  function handleDialogPointerUp(event: React.PointerEvent<HTMLDialogElement>) {
    if (typeof HTMLDialogElement !== 'undefined' && 'closedBy' in HTMLDialogElement.prototype) {
      return;
    }
    if (pressedOutsideDialog.current && isPointerOutsideDialog(event)) {
      closeGuideModal();
    }
    pressedOutsideDialog.current = false;
  }

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
      return focusError(
        'Provide FASTA beginning with a header line (>), load a demo sequence, or upload a file.',
        fastaRef.current,
      );
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
    <div className="space-y-6 py-4 sm:py-6">
      {/* Compact Single-Line Masthead */}
      <header className="flex flex-col justify-between gap-2 border-b border-[var(--line)] pb-4 md:flex-row md:items-end">
        <div className="min-w-0">
          <p className="eyebrow">Sequence Analysis Workbench</p>
          <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-[var(--navy)] sm:text-[1.68rem] lg:whitespace-nowrap">
            Predict Nitrogen-Mineralization Enzymes
          </h1>
        </div>
        <p className="shrink-0 font-mono text-xs text-[var(--muted)] sm:whitespace-nowrap md:text-right">
          ≤10,000 sequences · ≤5,000 aa/nt per sequence
        </p>
      </header>

      {error && (
        <div
          ref={errorRef}
          tabIndex={-1}
          role="alert"
          className="border-l-4 border-[var(--danger)] bg-[var(--danger-soft)] px-4 py-3 text-sm font-semibold text-[var(--danger)] outline-none"
        >
          {error}
        </div>
      )}

      {busy && (
        <section aria-live="polite" className="surface p-5">
          <div className="flex items-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-[var(--teal)]" aria-hidden="true" />
            <div>
              <p className="text-sm font-bold text-[var(--navy)]">{status}</p>
              <p className="mt-0.5 text-xs text-[var(--muted)]">
                Keep this window open or copy the private bookmark link below to reopen your results
                anytime within 30 days.
              </p>
            </div>
          </div>
          {receipt && (
            <div className="mt-4 flex flex-col gap-3 border border-[var(--line)] bg-[var(--surface)] p-3 sm:flex-row sm:items-center">
              <Bookmark className="h-4 w-4 shrink-0 text-[var(--ochre)]" aria-hidden="true" />
              <code className="min-w-0 flex-1 truncate font-mono text-xs text-[var(--navy)]">
                {receipt.url}
              </code>
              <button
                type="button"
                className="btn-outline-sharp !min-h-0 !py-1.5 !px-3 !text-xs"
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
        <section className="surface space-y-4 p-5 sm:p-6" aria-label="Sequence input workspace">
          {/* Row 1: Sequence Type Segmented Radios + Upload + Clear */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--line)] pb-4">
            <fieldset className="inline-flex border border-[var(--line-strong)] bg-[var(--surface)] p-0.5">
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
                    className={`block px-3.5 py-1.5 text-xs font-bold transition ${
                      sequenceType === val
                        ? 'bg-[var(--navy)] text-white'
                        : 'text-[var(--muted)] hover:text-[var(--navy)]'
                    }`}
                  >
                    {label}
                  </span>
                </label>
              ))}
            </fieldset>

            <div className="flex flex-wrap items-center gap-2">
              <label className="btn-ghost-rule !min-h-0 !py-1.5 !px-3 !text-xs cursor-pointer">
                <FileUp className="h-3.5 w-3.5 text-[var(--teal)]" aria-hidden="true" />
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
                className="btn-ghost-rule !min-h-0 !py-1.5 !px-3 !text-xs"
              >
                <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                Clear
              </button>
            </div>
          </div>

          {/* Row 2: Inline Accession Quick-Fetch Bar (Protein) OR TransDecoder Banner (Nucleotide) */}
          {sequenceType === 'prot' ? (
            <div className="border border-[var(--line)] bg-[var(--surface)] p-3">
              <div className="flex flex-wrap items-center gap-2">
                <fieldset className="inline-flex border border-[var(--line-strong)] bg-white p-0.5">
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
                        className={`block px-2.5 py-1 font-mono text-xs font-bold transition ${
                          database === dbKey
                            ? 'bg-[var(--teal)] text-white'
                            : 'text-[var(--muted)] hover:text-[var(--navy)]'
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
                  className="field min-w-[190px] flex-1 !py-1.5 !px-3 font-mono text-xs"
                />

                <button
                  type="button"
                  onClick={useAccessionExample}
                  className="px-1.5 py-1 font-mono text-xs font-bold text-[var(--ochre)] underline underline-offset-4 hover:text-[var(--navy)]"
                >
                  {accessionExamples[database].value}
                </button>

                <button
                  type="button"
                  disabled={fetchingAccession}
                  onClick={() => void fetchAccessions()}
                  className="btn-navy !min-h-0 !py-1.5 !px-3.5 !text-xs"
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
            <div className="border-l-2 border-[var(--teal)] bg-[var(--teal-soft)] px-3.5 py-2.5 text-xs leading-relaxed text-[var(--navy)]">
              <strong className="font-bold text-[var(--teal)]">ORF Translation Active:</strong>{' '}
              <code className="font-mono">TransDecoder.LongOrfs</code> extracts candidate coding
              regions (<code className="font-mono">A, C, G, T, U, N</code>) into{' '}
              <code className="font-mono">translated_proteins.fasta</code> before running MINpred.
            </div>
          )}

          {/* Row 2b: Self-Explanatory Demo Loader Strip + Info Modal Trigger */}
          <div className="space-y-2 border border-[var(--line)] bg-[var(--limestone)]/65 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="mr-1 font-mono text-[11px] font-bold uppercase tracking-wider text-[var(--navy)]">
                  Load Demo:
                </span>

                {/* Mixed 10-Class Demo Button */}
                <button
                  type="button"
                  onClick={() => selectExample('mixed')}
                  title="Loads 10 curated proteins (1 from each of the 10 classes) to test automatic routing"
                  className={`border px-2.5 py-0.5 font-mono text-[11px] font-bold transition ${
                    selectedExample === 'mixed'
                      ? 'border-[var(--ochre-dark)] bg-[var(--pyrite)] text-[#0c1b1d]'
                      : 'border-[var(--navy)] bg-white text-[var(--navy)] hover:bg-[var(--limestone)]'
                  }`}
                >
                  10-Class Demo Set (10 seqs)
                </button>

                <span className="mx-0.5 text-[var(--line-strong)]" aria-hidden="true">
                  |
                </span>

                {/* Individual Class Shortcut Buttons */}
                {MINERALIZATION_CLASSES.map((cls) => {
                  const active = selectedExample === cls.key;
                  return (
                    <button
                      key={cls.key}
                      type="button"
                      onClick={() => selectExample(cls.key)}
                      title={`${cls.code} — ${cls.name} (${cls.ecPrefix}; ${cls.ecs.length} explicit ECs)`}
                      className={`border px-2 py-0.5 font-mono text-[11px] font-bold transition ${
                        active
                          ? 'border-[var(--ochre-dark)] bg-[var(--pyrite)] text-[#0c1b1d]'
                          : 'border-[var(--line-strong)] bg-white text-[var(--navy)] hover:border-[var(--navy)] hover:bg-[var(--limestone)]'
                      }`}
                    >
                      {cls.code}
                    </button>
                  );
                })}
              </div>

              {/* Info Icon Modal Trigger */}
              <button
                type="button"
                onClick={openGuideModal}
                className="inline-flex items-center gap-1 border border-[var(--teal)] bg-white px-2.5 py-0.5 font-mono text-[11px] font-bold text-[var(--teal)] transition hover:bg-[var(--teal-soft)]"
              >
                <Info className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Abbreviation &amp; Routing Guide</span>
              </button>
            </div>

            {activeExampleMeta && (
              <p className="border-t border-[var(--line)] pt-2 text-xs text-[var(--muted)]">
                <strong className="font-semibold text-[var(--navy)]">
                  {activeExampleMeta.badge}:
                </strong>{' '}
                {activeExampleMeta.summary}
              </p>
            )}
          </div>

          {/* Row 3: Full-Name Preset Selector + Drag-and-Drop FASTA Textarea */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              if (!dragging) setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            className={`space-y-2 transition ${
              dragging ? 'ring-2 ring-[var(--pyrite-indicator)] ring-offset-4' : ''
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label htmlFor="minpred-fasta" className="text-sm font-bold text-[var(--navy)]">
                FASTA Sequence Editor{' '}
                <span className="text-xs font-normal text-[var(--muted)]">
                  (paste or drag &amp; drop a file)
                </span>
              </label>

              <div className="flex items-center gap-2">
                <label
                  htmlFor="example-preset"
                  className="font-mono text-xs font-bold text-[var(--muted)]"
                >
                  By full name:
                </label>
                <select
                  id="example-preset"
                  name="examplePreset"
                  value={selectedExample}
                  onChange={(e) => selectExample(e.target.value as ExampleSelection)}
                  className="field !w-auto max-w-[260px] !py-1 !px-2.5 text-xs font-bold"
                >
                  <option value="">Choose example by class name…</option>
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
                className="field resize-y bg-[#fcfcfb] font-mono text-xs leading-6"
              />
              {dragging && (
                <div className="pointer-events-none absolute inset-0 grid place-items-center border-2 border-dashed border-[var(--pyrite-indicator)] bg-[var(--ochre-soft)]/95 text-sm font-extrabold text-[var(--navy)]">
                  Drop FASTA file to load sequences
                </div>
              )}
            </div>

            <div
              id="fasta-stats"
              className="flex flex-wrap items-center justify-between gap-2 font-mono text-xs text-[var(--muted)]"
            >
              <span>
                <strong className="font-bold text-[var(--navy)]">
                  {stats.records.toLocaleString()}
                </strong>{' '}
                record{stats.records === 1 ? '' : 's'} ·{' '}
                <strong className="font-bold text-[var(--navy)]">
                  {stats.totalLength.toLocaleString()}
                </strong>{' '}
                {sequenceType === 'nucl' ? 'nt' : 'aa'}
              </span>
              <span className="font-semibold text-[var(--teal)]">
                {sequenceType === 'nucl'
                  ? 'Alphabet: A, C, G, T, U, N'
                  : stats.maxLength > 1022
                    ? `Max ${stats.maxLength.toLocaleString()} aa · 1,022-aa windowing active`
                    : '20 standard AAs + X · >1,022 aa windowed'}
              </span>
            </div>
          </div>
        </section>

        {/* RIGHT COLUMN: Connected Cascade Selector, Clear Phase IV Routing & Launch Panel */}
        <aside className="surface space-y-5 p-5 sm:p-6 lg:sticky lg:top-24">
          <fieldset>
            <legend className="visually-hidden">Cascade depth</legend>
            <div className="flex items-center justify-between gap-2">
              <span aria-hidden="true" className="eyebrow">
                Cascade Depth
              </span>
              <span className="font-mono text-xs font-bold text-[var(--muted)]">
                {activeGateNumber === 1 ? 'Gate 1 active' : `Gates 1 → ${activeGateNumber} active`}
              </span>
            </div>
            <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
              Selecting a terminal phase executes all upstream binary and multi-class filters.
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2">
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
                      className={`border p-3 transition ${
                        selected
                          ? 'border-[var(--ochre-dark)] border-l-[3px] bg-[var(--ochre-soft)]'
                          : included
                            ? 'border-[var(--navy)] bg-[var(--limestone)]/65 hover:border-[var(--teal)]'
                            : 'border-[var(--line)] bg-white opacity-70 hover:opacity-100'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-mono text-xs font-extrabold text-[var(--navy)]">
                          {title}
                        </span>
                        <span
                          className={`font-mono text-[10px] font-bold uppercase ${
                            selected
                              ? 'text-[var(--ochre)]'
                              : included
                                ? 'text-[var(--teal)]'
                                : 'text-[var(--muted)]'
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

          {/* Phase IV Class Routing — Explicit Self-Explanatory Options */}
          <fieldset
            disabled={level !== 'Phase4'}
            className={`space-y-3 border border-[var(--line)] bg-[var(--surface)] p-3.5 transition ${
              level !== 'Phase4' ? 'opacity-55' : ''
            }`}
          >
            <legend className="visually-hidden">Phase IV four-digit EC routing</legend>
            <div className="flex items-center justify-between gap-2">
              <span
                aria-hidden="true"
                className="font-mono text-xs font-bold uppercase tracking-wider text-[var(--navy)]"
              >
                Phase IV EC Routing
              </span>
              <button
                type="button"
                onClick={openGuideModal}
                className="inline-flex items-center gap-1 font-mono text-[11px] font-bold text-[var(--teal)] hover:underline"
              >
                <Info className="h-3.5 w-3.5" aria-hidden="true" />
                <span>How routing works</span>
              </button>
            </div>

            {level !== 'Phase4' ? (
              <p className="text-xs leading-5 text-[var(--muted)]">
                Select <strong>Phase IV</strong> above to enable four-digit EC prediction.
              </p>
            ) : (
              <div className="space-y-2">
                <label className="block cursor-pointer">
                  <input
                    type="radio"
                    name="phase4Mode"
                    value="automatic"
                    checked={phase4Mode === 'automatic'}
                    onChange={() => changePhase4Mode('automatic')}
                    className="visually-hidden phase-radio"
                  />
                  <div
                    className={`border p-2.5 transition ${
                      phase4Mode === 'automatic'
                        ? 'border-[var(--navy)] border-l-[3px] bg-white'
                        : 'border-[var(--line)] bg-white/70 hover:border-[var(--line-strong)]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-[var(--navy)]">
                        Auto-Route Across All 10 Classes
                      </span>
                      <span className="bg-[var(--teal-soft)] px-1.5 py-0.5 font-mono text-[10px] font-bold text-[var(--teal)]">
                        Recommended
                      </span>
                    </div>
                    <p className="mt-1 text-[11.5px] leading-relaxed text-[var(--muted)]">
                      Phase III predicts each protein&apos;s class (<code className="font-mono">SEP</code>
                      –<code className="font-mono">AH</code>) and automatically routes it to its
                      matching EC model. Use for unknown or mixed inputs.
                    </p>
                  </div>
                </label>

                <label className="block cursor-pointer">
                  <input
                    type="radio"
                    name="phase4Mode"
                    value="specific"
                    checked={phase4Mode === 'specific'}
                    onChange={() => changePhase4Mode('specific')}
                    className="visually-hidden phase-radio"
                  />
                  <div
                    className={`border p-2.5 transition ${
                      phase4Mode === 'specific'
                        ? 'border-[var(--navy)] border-l-[3px] bg-white'
                        : 'border-[var(--line)] bg-white/70 hover:border-[var(--line-strong)]'
                    }`}
                  >
                    <span className="block text-xs font-bold text-[var(--navy)]">
                      Filter to One Specific Class
                    </span>
                    <p className="mt-1 text-[11.5px] leading-relaxed text-[var(--muted)]">
                      Runs Phase IV EC prediction <strong>only</strong> on proteins assigned to your
                      chosen class in Phase III (other classes stop at Phase III).
                    </p>
                  </div>
                </label>

                {phase4Mode === 'specific' && (
                  <div className="pt-1">
                    <label
                      htmlFor="enzyme-class-select"
                      className="mb-1 block font-mono text-[11px] font-bold text-[var(--navy)]"
                    >
                      Target Phase IV enzyme class:
                    </label>
                    <select
                      id="enzyme-class-select"
                      name="enzymeClass"
                      value={enzymeClass}
                      onChange={(e) => changeEnzymeClass(e.target.value as EnzymeClass)}
                      className="field !py-1.5 text-xs font-bold"
                    >
                      {enzymeClassOptions.map(([val, label]) => (
                        <option key={val} value={val}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )}
          </fieldset>

          {/* Verification & Submit */}
          <div className="space-y-3.5 border-t border-[var(--line)] pt-4">
            <div>
              <div className="flex items-center justify-between font-mono text-xs">
                <span className="font-bold text-[var(--navy)]">Submission Verification</span>
                <span className="text-[var(--muted)]">30-day private link</span>
              </div>
              <div className="mt-2 min-h-8">
                {!securityConfig.loaded ? (
                  <div className="flex min-h-8 items-center gap-2 text-xs text-[var(--muted)]">
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    Loading verification…
                  </div>
                ) : securityConfig.error ? (
                  <p className="text-xs font-semibold text-[var(--danger)]">
                    {securityConfig.error}
                  </p>
                ) : securityConfig.required ? (
                  turnstile ? (
                    <span className="flex items-center gap-2 font-mono text-xs font-bold text-[var(--teal)]">
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
                  <span className="flex items-center gap-2 font-mono text-xs font-semibold text-[var(--teal)]">
                    <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                    Ready to submit
                  </span>
                )}
              </div>
            </div>

            <button type="submit" disabled={busy} className="btn-amber w-full py-3 text-sm">
              {busy ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  Running prediction…
                </>
              ) : (
                <>
                  Start Prediction <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </>
              )}
            </button>

            <p className="text-center text-xs text-[var(--muted)]">
              Analyzing large proteomes (&gt;10,000 sequences)? Use the{' '}
              <a
                className="font-bold text-[var(--navy)] underline underline-offset-4 hover:text-[var(--teal)]"
                href={withBasePath('/download')}
              >
                standalone Python CLI
              </a>
              .
            </p>
          </div>
        </aside>
      </form>

      {/* ==================== NATIVE MODAL DIALOG: ABBREVIATION & PHASE IV ROUTING GUIDE ==================== */}
      <dialog
        ref={dialogRef}
        aria-labelledby="class-guide-modal-title"
        onPointerDown={handleDialogPointerDown}
        onPointerUp={handleDialogPointerUp}
        {...({ closedby: 'any' } as Record<string, string>)}
      >
        <div className="flex max-h-[85dvh] flex-col">
          {/* Sticky Modal Header */}
          <div className="flex items-start justify-between gap-4 border-b border-[var(--line)] bg-[var(--limestone)] px-5 py-4">
            <div>
              <p className="eyebrow">MINpred Reference Guide</p>
              <h1
                id="class-guide-modal-title"
                className="mt-0.5 font-display text-xl font-bold text-[var(--navy)]"
              >
                Class Abbreviations, Demo Sets &amp; Phase IV Routing
              </h1>
            </div>
            <form method="dialog">
              <button
                value="close"
                autoFocus
                aria-label="Close guide"
                className="btn-ghost-rule !min-h-0 !px-2.5 !py-1.5 !text-xs"
              >
                <X className="h-4 w-4" aria-hidden="true" />
                <span>Close</span>
              </button>
            </form>
          </div>

          {/* Scrollable Modal Content */}
          <div className="space-y-5 overflow-y-auto p-5">
            {/* Clear Explanation of All 10 vs Single-Class */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="border border-[var(--line)] border-l-[3px] border-l-[var(--teal)] bg-[var(--surface)] p-3.5">
                <h2 className="font-mono text-xs font-extrabold uppercase tracking-wider text-[var(--navy)]">
                  10-Class Demo Set vs. Single Shortcuts
                </h2>
                <p className="mt-1.5 text-xs leading-relaxed text-[var(--muted)]">
                  <strong className="text-[var(--ink)]">10-Class Demo Set (10 seqs)</strong> loads a
                  combined FASTA containing one verified Swiss-Prot protein from each of the 10
                  enzyme classes so you can preview full automatic routing in a single run. Clicking
                  an individual code (<code className="font-mono">SEP</code>–
                  <code className="font-mono">AH</code>) loads just one sequence for that class.
                </p>
              </div>

              <div className="border border-[var(--line)] border-l-[3px] border-l-[var(--pyrite-indicator)] bg-[var(--surface)] p-3.5">
                <h2 className="font-mono text-xs font-extrabold uppercase tracking-wider text-[var(--navy)]">
                  Auto-Route vs. Filter to One Class
                </h2>
                <p className="mt-1.5 text-xs leading-relaxed text-[var(--muted)]">
                  <strong className="text-[var(--ink)]">Auto-Route Across All 10 Classes</strong>{' '}
                  uses each protein&apos;s Phase III prediction to pick the matching Phase IV EC
                  model (<code className="font-mono">M1–M10</code>).{' '}
                  <strong className="text-[var(--ink)]">Filter to One Specific Class</strong> runs
                  Phase IV only on proteins predicted as that chosen class in Phase III (it never
                  forces other classes into that EC model).
                </p>
              </div>
            </div>

            {/* 10-Class Abbreviation Lookup Table with Direct Load Actions */}
            <div>
              <h2 className="mb-2 font-mono text-xs font-extrabold uppercase tracking-wider text-[var(--navy)]">
                Ten Nitrogen-Mineralization Enzyme Classes (Shortcuts SEP – AH)
              </h2>
              <div className="overflow-x-auto border border-[var(--line)]">
                <table className="w-full border-collapse text-left text-xs">
                  <thead>
                    <tr className="border-b border-[var(--line-strong)] bg-[var(--limestone)] font-mono text-[11px] uppercase tracking-wider text-[var(--navy)]">
                      <th scope="col" className="py-2.5 pr-3 pl-3 font-bold">
                        Code
                      </th>
                      <th scope="col" className="py-2.5 px-3 font-bold">
                        Full Enzyme Class Name
                      </th>
                      <th scope="col" className="py-2.5 px-3 font-bold">
                        IUBMB Subclass
                      </th>
                      <th scope="col" className="hidden py-2.5 px-3 font-bold sm:table-cell">
                        Pathway Step
                      </th>
                      <th scope="col" className="py-2.5 pr-3 pl-2 text-right font-bold">
                        Demo
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--line)]">
                    {MINERALIZATION_CLASSES.map((cls) => (
                      <tr key={cls.key} className="hover:bg-[var(--limestone)]/60">
                        <th
                          scope="row"
                          className="py-2.5 pr-3 pl-3 font-mono text-xs font-extrabold text-[var(--navy)]"
                        >
                          {cls.code}
                        </th>
                        <td className="py-2.5 px-3">
                          <span className="font-semibold text-[var(--ink)]">{cls.name}</span>
                          <span className="block text-[11px] text-[var(--muted)]">
                            {cls.ecs.length} explicit four-digit EC
                            {cls.ecs.length === 1 ? '' : 's'} + Others
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-mono text-xs font-semibold text-[var(--teal)]">
                          {cls.ecPrefix}
                        </td>
                        <td className="hidden py-2.5 px-3 font-mono text-[11px] text-[var(--muted)] sm:table-cell">
                          {cls.stageShort}
                        </td>
                        <td className="py-2.5 pr-3 pl-2 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => {
                              selectExample(cls.key);
                              closeGuideModal();
                            }}
                            className="border border-[var(--navy)] bg-white px-2 py-0.5 font-mono text-[11px] font-bold text-[var(--navy)] hover:bg-[var(--pyrite)] hover:text-[#0c1b1d]"
                          >
                            Load {cls.code}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </dialog>
    </div>
  );
}
