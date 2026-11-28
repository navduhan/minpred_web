'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Bookmark,
  Check,
  CheckCircle2,
  ClipboardPaste,
  Copy,
  Database,
  FileUp,
  FlaskConical,
  Info,
  Loader2,
  RotateCcw,
  ShieldCheck,
  Upload,
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

const PHASE_OPTIONS = [
  {
    value: 'Phase1' as const,
    title: 'Phase I · Enzyme Screen',
    badge: 'Phase I',
    description: 'Separates catalytic enzymes from non-enzymes.',
  },
  {
    value: 'Phase2' as const,
    title: 'Phases I–II · N-Mineralization Filter',
    badge: 'Phases I–II',
    description: 'Isolates nitrogen-mineralization hydrolases.',
  },
  {
    value: 'Phase3' as const,
    title: 'Phases I–III · 10 Enzyme Classes',
    badge: 'Phases I–III',
    description: 'Assigns 9 peptidase subclasses and amidohydrolases.',
  },
  {
    value: 'Phase4' as const,
    title: 'Phases I–IV · 4-Digit EC Prediction',
    badge: 'Phases I–IV',
    description: 'Predicts explicit four-digit EC numbers (M1–M10).',
  },
] as const;

type EnzymeClass = (typeof enzymeClassOptions)[number][0];
type PhaseLevel = (typeof PHASE_OPTIONS)[number]['value'];
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
  const [inputMode, setInputMode] = useState<'paste' | 'upload' | 'accession'>('paste');
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
  const [status, setStatus] = useState('Submitting job…');
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
  const accessionRef = useRef<HTMLTextAreaElement>(null);
  const errorRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const pressedOutsideDialog = useRef(false);

  const stats = useMemo(() => computeFastaStats(sequence), [sequence]);

  const activeExampleMeta = useMemo(() => {
    if (!selectedExample) return null;
    if (selectedExample === 'mixed') {
      return {
        badge: '10-Class Demo Set',
        summary: 'Loaded 10 Swiss-Prot sequences (1 per class) with Phase IV Auto-Route enabled.',
      };
    }
    const cls = MINERALIZATION_CLASSES.find((item) => item.key === selectedExample);
    if (!cls) return null;
    return {
      badge: `${cls.code} · ${cls.name}`,
      summary: `Loaded ${cls.name} (${cls.ecPrefix}) example with Phase IV restricted to ${cls.code}.`,
    };
  }, [selectedExample]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const preset = params.get('example');
    if (!preset) return;
    void Promise.resolve().then(() => {
      setInputMode('paste');
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
        setStatus('Resuming job monitoring…');
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
    if (dlg && !dlg.open) dlg.showModal();
  }

  function closeGuideModal() {
    const dlg = dialogRef.current;
    if (dlg?.open) {
      dlg.close();
      dlg.returnValue = '';
    }
  }

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

  async function fetchAccessionsData(accText: string) {
    setFetchingAccession(true);
    setError('');
    try {
      const response = await fetch(withBasePath('/api/accession'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessions: accText, database, db: database }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Accession retrieval failed.');
      const fasta = String(data.fasta || '').trim();
      setSequenceType('prot');
      setSequence(fasta);
      setSelectedExample('');
      setFileName('');
      return fasta;
    } catch (e: unknown) {
      focusError(e instanceof Error ? e.message : 'Accession retrieval failed.', accessionRef.current);
      return '';
    } finally {
      setFetchingAccession(false);
    }
  }

  async function fetchAccessions() {
    if (busy || fetchingAccession) return;
    if (!accessions.trim()) {
      return focusError('Enter at least one UniProtKB or NCBI Protein accession.', accessionRef.current);
    }
    await fetchAccessionsData(accessions);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;

    let seqToRun = sequence.trim();
    if (!seqToRun && inputMode === 'accession' && accessions.trim()) {
      const fetched = await fetchAccessionsData(accessions);
      if (!fetched) return;
      seqToRun = fetched;
    }

    if (!seqToRun.startsWith('>')) {
      return focusError(
        'Provide FASTA sequences starting with ">", upload a file, or enter valid accession IDs.',
        fastaRef.current ?? undefined,
      );
    }
    if (!securityConfig.loaded) {
      return focusError('Wait for verification to finish loading.');
    }
    if (securityConfig.error || (securityConfig.required && !securityConfig.siteKey)) {
      return focusError(securityConfig.error || 'Verification is not configured correctly.');
    }
    if (securityConfig.required && !turnstile) {
      return focusError('Complete the verification check before submitting.');
    }

    setBusy(true);
    setStatus('Submitting sequences…');
    setError('');
    try {
      const response = await fetch(withBasePath('/api/predict'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sequence: seqToRun,
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

  function handleDrop(event: React.DragEvent<HTMLElement>) {
    event.preventDefault();
    setDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (file) loadFile(file);
  }

  function clear() {
    setInputMode('paste');
    setSequenceType('prot');
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
    setInputMode('paste');
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
    if (next === 'nucl') {
      if (inputMode === 'accession') setInputMode('paste');
      if (selectedExample) {
        setSequence('');
        setSelectedExample('');
      }
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
    setInputMode('accession');
    setSequenceType('prot');
    setAccessions(accessionExamples[database].value);
    setSequence('');
    setError('');
    accessionRef.current?.focus();
  }

  return (
    <div className="space-y-8 py-6 pb-10">
      {/* Compact Single-Row Title Bar */}
      <header className="flex flex-col justify-between gap-3 border-b border-[var(--line-strong)] pb-5 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-[var(--navy)] sm:text-[1.68rem]">
            Sequence Prediction Workspace
          </h1>
          <p className="mt-1 text-[15px] text-[var(--ink-secondary)]">
            Soil nitrogen-mineralization enzyme &amp; EC prediction · Up to 10,000 sequences ·
            30-day private results retention
          </p>
        </div>
        <Link href="/help" className="text-sm font-bold text-[var(--teal)] hover:underline">
          Input rules &amp; quotas →
        </Link>
      </header>

      {error && (
        <div
          ref={errorRef}
          tabIndex={-1}
          role="alert"
          className="rounded-xl border border-red-200 bg-[var(--danger-soft)] px-4 py-3.5 text-sm font-semibold text-[var(--danger)] outline-none"
        >
          {error}
        </div>
      )}

      {busy && (
        <section aria-live="polite" className="surface p-5">
          <div className="flex items-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-[var(--teal)]" aria-hidden="true" />
            <div>
              <p className="text-base font-bold text-[var(--navy)]">{status}</p>
              <p className="mt-0.5 text-sm text-[var(--ink-secondary)]">
                Keep this tab open or copy your private bookmark link below to reopen results
                within 30 days.
              </p>
            </div>
          </div>
          {receipt && (
            <div className="mt-4 flex flex-col gap-3 rounded-xl border border-[var(--line-strong)] bg-[var(--surface)] p-3.5 sm:flex-row sm:items-center">
              <Bookmark className="h-4 w-4 shrink-0 text-[var(--ochre)]" aria-hidden="true" />
              <code className="min-w-0 flex-1 truncate font-mono text-xs text-[var(--navy)]">
                {receipt.url}
              </code>
              <button
                type="button"
                className="btn-outline-sharp py-2 px-3.5 text-sm"
                onClick={() =>
                  void navigator.clipboard.writeText(receipt.url).then(() => {
                    setCopied(true);
                    setTimeout(() => setCopied(false), 1500);
                  })
                }
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
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
        className="grid items-start gap-7 lg:grid-cols-12"
      >
        {/* LEFT COLUMN (7 cols): Clear Sequence Type + 3-Option Input Method + Editor */}
        <section
          className="surface space-y-6 p-5 sm:p-6 lg:col-span-7"
          aria-label="Sequence input workspace"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--line-strong)] pb-3.5">
            <div className="flex items-baseline gap-2.5">
              <span className="font-mono text-base font-bold text-[var(--teal)]">01</span>
              <h2 className="font-display text-xl font-bold text-[var(--navy)]">
                Query sequence input
              </h2>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => selectExample('mixed')}
                className="btn-amber py-2 px-3.5 text-sm"
              >
                <FlaskConical className="h-4 w-4" aria-hidden="true" />
                <span>Load 10-Class Demo</span>
              </button>
              <button type="button" onClick={clear} className="btn-ghost-rule py-2 px-3 text-sm">
                <RotateCcw className="h-4 w-4" aria-hidden="true" />
                <span>Reset</span>
              </button>
            </div>
          </div>

          {/* 1A. Clear Visible Radio Cards for Sequence Type (Protein vs Nucleotide) */}
          <fieldset className="space-y-2">
            <legend className="text-base font-bold text-[var(--ink)]">
              Choose sequence type:
            </legend>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {(
                [
                  ['prot', 'Protein Sequences (AA)', 'FASTA text or database IDs'],
                  ['nucl', 'Nucleotide (DNA / RNA)', 'Translated via TransDecoder'],
                ] as const
              ).map(([val, title, desc]) => {
                const active = sequenceType === val;
                return (
                  <label
                    key={val}
                    className={`flex cursor-pointer flex-col gap-1 rounded-xl border p-3.5 transition ${
                      active
                        ? 'border-2 border-[var(--teal)] bg-[var(--teal-soft)]'
                        : 'border-[var(--line-strong)] bg-white hover:border-[var(--teal)] hover:bg-[var(--surface)]'
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <input
                        type="radio"
                        name="sequenceType"
                        value={val}
                        checked={active}
                        onChange={() => changeSequenceType(val)}
                        className="h-4.5 w-4.5 shrink-0 accent-[var(--teal)]"
                      />
                      <span className="whitespace-nowrap text-[15px] font-bold text-[var(--navy)] sm:text-base">
                        {title}
                      </span>
                    </span>
                    <span className="pl-7 whitespace-nowrap text-[13.5px] leading-5 text-[var(--ink-secondary)]">
                      {desc}
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          {/* 1B. Clear 3-Option Rounded Input Method Selector (Single-Line Title + Subtitle) */}
          <div className="space-y-2">
            <span id="minpred-input-mode-label" className="block text-base font-bold text-[var(--ink)]">
              Choose input method (select one):
            </span>
            <div
              className="grid grid-cols-1 gap-3 sm:grid-cols-3"
              role="tablist"
              aria-labelledby="minpred-input-mode-label"
            >
              {[
                {
                  id: 'paste' as const,
                  label: 'Paste FASTA',
                  hint: 'FASTA sequences',
                  icon: ClipboardPaste,
                },
                {
                  id: 'upload' as const,
                  label: 'Upload File',
                  hint: '.fasta, .faa, .txt',
                  icon: FileUp,
                },
                {
                  id: 'accession' as const,
                  label: 'Accession IDs',
                  hint: 'UniProt or NCBI IDs',
                  icon: Database,
                },
              ].map((tab) => {
                const Icon = tab.icon;
                const selected = inputMode === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    onClick={() => {
                      setInputMode(tab.id);
                      if (tab.id === 'accession') setSequenceType('prot');
                      setError('');
                    }}
                    className={`flex cursor-pointer flex-col gap-1 rounded-xl border p-3.5 text-left transition ${
                      selected
                        ? 'border-2 border-[var(--navy)] bg-[var(--limestone)] shadow-[0_2px_8px_rgba(18,38,40,0.08)]'
                        : 'border-[var(--line-strong)] bg-white hover:border-[var(--teal)] hover:bg-[var(--surface)]'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span
                        aria-hidden="true"
                        className={`flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full border-2 ${
                          selected
                            ? 'border-[var(--navy)] bg-[var(--navy)]'
                            : 'border-[var(--field-border)] bg-white'
                        }`}
                      >
                        {selected && <span className="h-2 w-2 rounded-full bg-white" />}
                      </span>
                      <Icon
                        className={`h-4 w-4 shrink-0 ${
                          selected ? 'text-[var(--teal)]' : 'text-[var(--ink-secondary)]'
                        }`}
                        aria-hidden="true"
                      />
                      <span className="whitespace-nowrap text-[15px] font-bold text-[var(--navy)]">
                        {tab.label}
                      </span>
                    </span>
                    <span className="pl-6.5 whitespace-nowrap text-[13px] leading-5 text-[var(--ink-secondary)]">
                      {tab.hint}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {sequenceType === 'nucl' && (
            <div className="rounded-xl border border-[var(--teal)] bg-[var(--teal-soft)] px-4 py-3 text-sm leading-relaxed text-[var(--navy)]">
              <strong className="font-bold text-[var(--teal)]">ORF Translation Active:</strong>{' '}
              <code className="font-mono">TransDecoder.LongOrfs</code> translates candidate open
              reading frames (<code className="font-mono">A, C, G, T, U, N</code>) before running
              MINpred.
            </div>
          )}

          {/* TAB 1: PASTE FASTA */}
          {inputMode === 'paste' && (
            <div
              role="tabpanel"
              onDragOver={(e) => {
                e.preventDefault();
                if (!dragging) setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              className="space-y-3"
            >
              {/* Class Demo Bar (Protein mode) */}
              {sequenceType === 'prot' && (
                <div className="space-y-2.5 rounded-xl border border-[var(--line-strong)] bg-[var(--limestone)] p-3.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="mr-1 font-mono text-xs font-bold uppercase tracking-wider text-[var(--navy)]">
                        Class Examples:
                      </span>
                      {MINERALIZATION_CLASSES.map((cls) => {
                        const active = selectedExample === cls.key;
                        return (
                          <button
                            key={cls.key}
                            type="button"
                            onClick={() => selectExample(cls.key)}
                            title={`${cls.code} — ${cls.name} (${cls.ecPrefix})`}
                            className={`cursor-pointer rounded-md border px-2.5 py-1 font-mono text-xs font-bold transition ${
                              active
                                ? 'border-[var(--ochre-dark)] bg-[var(--pyrite)] text-[#0b181a]'
                                : 'border-[var(--line-strong)] bg-white text-[var(--navy)] hover:border-[var(--teal)] hover:bg-[var(--teal-soft)]'
                            }`}
                          >
                            {cls.code}
                          </button>
                        );
                      })}
                    </div>

                    <button
                      type="button"
                      onClick={openGuideModal}
                      className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-[var(--teal)] bg-white px-2.5 py-1 text-xs font-bold text-[var(--teal)] transition hover:bg-[var(--teal-soft)]"
                    >
                      <Info className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Class Guide</span>
                    </button>
                  </div>

                  {activeExampleMeta && (
                    <p className="border-t border-[var(--line)] pt-2 text-sm text-[var(--ink)]">
                      <strong className="font-bold text-[var(--navy)]">
                        {activeExampleMeta.badge}:
                      </strong>{' '}
                      {activeExampleMeta.summary}
                    </p>
                  )}
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-2">
                <label htmlFor="minpred-fasta" className="text-base font-bold text-[var(--navy)]">
                  FASTA sequences
                </label>

                {sequenceType === 'prot' && (
                  <div className="flex items-center gap-2">
                    <label
                      htmlFor="example-preset"
                      className="text-sm font-semibold text-[var(--ink-secondary)]"
                    >
                      Select by name:
                    </label>
                    <select
                      id="example-preset"
                      name="examplePreset"
                      value={selectedExample}
                      onChange={(e) => selectExample(e.target.value as ExampleSelection)}
                      className="field !w-auto max-w-[250px] !py-1.5 !px-3 text-sm font-semibold"
                    >
                      <option value="">Choose class example…</option>
                      {demoSequenceOptions.map(([key, label]) => (
                        <option key={key} value={key}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="relative">
                <textarea
                  ref={fastaRef}
                  id="minpred-fasta"
                  name="sequence"
                  rows={12}
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
                  className="field resize-y font-mono text-sm leading-6"
                />
                {dragging && (
                  <div className="pointer-events-none absolute inset-0 grid place-items-center rounded-xl border-2 border-dashed border-[var(--pyrite-indicator)] bg-[var(--ochre-soft)]/95 text-base font-bold text-[var(--navy)]">
                    Drop FASTA file to load sequences
                  </div>
                )}
              </div>

              <div
                id="fasta-stats"
                className="flex flex-wrap items-center justify-between gap-2 text-sm text-[var(--ink-secondary)]"
              >
                <span className="font-mono">
                  <strong className="font-bold text-[var(--navy)]">
                    {stats.records.toLocaleString()}
                  </strong>{' '}
                  record{stats.records === 1 ? '' : 's'} ·{' '}
                  <strong className="font-bold text-[var(--navy)]">
                    {stats.totalLength.toLocaleString()}
                  </strong>{' '}
                  {sequenceType === 'nucl' ? 'nt' : 'aa'}
                </span>
                <span className="font-mono text-xs font-bold text-[var(--teal)] sm:text-sm">
                  {sequenceType === 'nucl'
                    ? 'Alphabet: A, C, G, T, U, N'
                    : stats.maxLength > 1022
                      ? `Max ${stats.maxLength.toLocaleString()} aa · 1,022-aa windowing active`
                      : '20 standard AAs + X'}
                </span>
              </div>
            </div>
          )}

          {/* TAB 2: UPLOAD FILE */}
          {inputMode === 'upload' && (
            <div
              role="tabpanel"
              onDragOver={(e) => {
                e.preventDefault();
                if (!dragging) setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              className="space-y-4"
            >
              <div>
                <label htmlFor="minpred-file" className="block text-base font-bold text-[var(--navy)]">
                  Upload sequence FASTA file
                </label>
                <p className="mt-1 text-sm text-[var(--ink-secondary)]">
                  Supported formats: <code>.fasta</code>, <code>.fa</code>, <code>.faa</code>,{' '}
                  <code>.fna</code>, and <code>.txt</code> (up to 10,000 sequences).
                </p>
              </div>

              <label
                htmlFor="minpred-file"
                className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-11 text-center transition ${
                  dragging
                    ? 'border-[var(--pyrite-indicator)] bg-[var(--ochre-soft)]'
                    : 'border-[var(--line-strong)] bg-[var(--surface)] hover:border-[var(--teal)] hover:bg-[var(--teal-soft)]'
                }`}
              >
                <input
                  id="minpred-file"
                  type="file"
                  name="fastaFile"
                  accept=".fasta,.fa,.faa,.fna,.txt"
                  onChange={handleFileInput}
                  className="visually-hidden"
                />
                <Upload className="h-7 w-7 text-[var(--teal)]" aria-hidden="true" />
                <span className="mt-3 text-base font-bold text-[var(--navy)]">
                  {fileName ? `Selected: ${fileName}` : 'Choose or drop a FASTA file'}
                </span>
                <span className="mt-1 text-sm text-[var(--ink-secondary)]">
                  Click to browse from disk (≤5,000 aa/nt per sequence)
                </span>
              </label>

              {sequence && (
                <div className="space-y-2 border-t border-[var(--line)] pt-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 font-bold text-[var(--teal)]">
                      <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                      <span>
                        {stats.records.toLocaleString()} sequence{stats.records === 1 ? '' : 's'}{' '}
                        loaded
                      </span>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setSequence('');
                        setFileName('');
                      }}
                      className="font-semibold text-[var(--ink-secondary)] hover:text-[var(--navy)] hover:underline"
                    >
                      Clear file
                    </button>
                  </div>
                  <textarea
                    rows={5}
                    value={sequence}
                    onChange={(e) => setSequence(e.target.value)}
                    aria-label="Uploaded FASTA preview"
                    spellCheck={false}
                    className="field resize-y bg-[var(--surface)] font-mono text-sm leading-6"
                  />
                </div>
              )}
            </div>
          )}

          {/* TAB 3: ACCESSION IDs */}
          {inputMode === 'accession' && (
            <div role="tabpanel" className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-[var(--line-strong)] bg-[var(--limestone)] px-4 py-3">
                <fieldset className="flex flex-wrap items-center gap-5">
                  <legend className="visually-hidden">Source protein database</legend>
                  <span className="text-sm font-bold text-[var(--ink-secondary)]">
                    Source Database:
                  </span>
                  {(
                    [
                      ['uniprot', 'UniProtKB'],
                      ['ncbi', 'NCBI Protein'],
                    ] as const
                  ).map(([dbKey, dbLabel]) => (
                    <label
                      key={dbKey}
                      className="inline-flex cursor-pointer items-center gap-2 text-[15px] font-bold text-[var(--navy)] sm:text-base"
                    >
                      <input
                        type="radio"
                        name="database"
                        value={dbKey}
                        checked={database === dbKey}
                        onChange={() => setDatabase(dbKey)}
                        className="h-4.5 w-4.5 accent-[var(--teal)]"
                      />
                      <span>{dbLabel}</span>
                    </label>
                  ))}
                </fieldset>

                <button
                  type="button"
                  onClick={useAccessionExample}
                  className="text-sm font-bold text-[var(--ochre)] hover:underline"
                >
                  Load sample ID ({accessionExamples[database].value})
                </button>
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="protein-accessions"
                  className="block text-base font-bold text-[var(--navy)]"
                >
                  Protein accession identifiers (up to 100)
                </label>
                <p id="minpred-acc-hint" className="text-sm text-[var(--ink-secondary)]">
                  Separate multiple accessions with newlines, commas, or spaces. Sequences are
                  fetched automatically on submission, or preview them below.
                </p>
                <textarea
                  ref={accessionRef}
                  id="protein-accessions"
                  name="accessions"
                  rows={4}
                  value={accessions}
                  onChange={(e) => {
                    setAccessions(e.target.value);
                    setSequence('');
                    if (error) setError('');
                  }}
                  aria-describedby="minpred-acc-hint"
                  autoCorrect="off"
                  autoCapitalize="none"
                  spellCheck={false}
                  placeholder={`${accessionExamples[database].value}`}
                  className="field resize-y font-mono text-sm leading-6"
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="text-sm text-[var(--ink-secondary)]">
                  Optional sequence preview before starting prediction
                </span>
                <button
                  type="button"
                  disabled={fetchingAccession}
                  onClick={() => void fetchAccessions()}
                  className="btn-outline-sharp py-2 px-4 text-sm"
                >
                  {fetchingAccession ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <Database className="h-4 w-4" aria-hidden="true" />
                  )}
                  <span>{fetchingAccession ? 'Retrieving FASTA…' : 'Fetch & Preview FASTA'}</span>
                </button>
              </div>

              {sequence && (
                <div className="space-y-2 border-t border-[var(--line)] pt-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 font-bold text-[var(--teal)]">
                      <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                      <span>
                        {stats.records.toLocaleString()} FASTA sequence
                        {stats.records === 1 ? '' : 's'} ready
                      </span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setSequence('')}
                      className="font-semibold text-[var(--ink-secondary)] hover:text-[var(--navy)] hover:underline"
                    >
                      Clear preview
                    </button>
                  </div>
                  <textarea
                    rows={5}
                    value={sequence}
                    onChange={(e) => setSequence(e.target.value)}
                    aria-label="Fetched FASTA preview"
                    spellCheck={false}
                    className="field resize-y bg-[var(--surface)] font-mono text-sm leading-6"
                  />
                </div>
              )}
            </div>
          )}
        </section>

        {/* RIGHT COLUMN (5 cols): Clear Visible Phase Depth + Phase IV Routing + Launch */}
        <aside className="surface space-y-6 p-5 sm:p-6 lg:col-span-5">
          <div className="flex items-baseline gap-2.5 border-b border-[var(--line-strong)] pb-3.5">
            <span className="font-mono text-base font-bold text-[var(--teal)]">02</span>
            <h2 className="font-display text-xl font-bold text-[var(--navy)]">
              Prediction phases &amp; EC routing
            </h2>
          </div>

          {/* Cumulative Phase Depth with Clear Visible Radio Buttons */}
          <fieldset className="space-y-2.5">
            <legend className="visually-hidden">Prediction phase depth</legend>
            <div className="flex items-center justify-between">
              <span aria-hidden="true" className="text-base font-bold text-[var(--ink)]">
                Cumulative phase depth
              </span>
              <Link
                href="/help#phases"
                className="text-sm font-semibold text-[var(--teal)] hover:underline"
              >
                About phases
              </Link>
            </div>

            <div className="divide-y divide-[var(--line)] overflow-hidden rounded-xl border border-[var(--line-strong)] bg-white">
              {PHASE_OPTIONS.map((opt) => {
                const selected = level === opt.value;
                return (
                  <label
                    key={opt.value}
                    className={`flex cursor-pointer items-start gap-3 px-4 py-3 transition ${
                      selected ? 'bg-[var(--ochre-soft)]' : 'hover:bg-[var(--surface)]'
                    }`}
                  >
                    <input
                      type="radio"
                      name="level"
                      value={opt.value}
                      checked={selected}
                      onChange={() => setLevel(opt.value)}
                      className="mt-1 h-4.5 w-4.5 shrink-0 accent-[var(--teal)]"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block text-[15px] font-bold text-[var(--navy)] sm:text-base">
                        {opt.title}
                      </span>
                      <span className="mt-0.5 block text-sm leading-5 text-[var(--ink-secondary)]">
                        {opt.description}
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          {/* Phase IV Class Routing with Clear Visible Radio Buttons */}
          <fieldset
            disabled={level !== 'Phase4'}
            className={`space-y-2.5 ${level !== 'Phase4' ? 'opacity-60' : ''}`}
          >
            <legend className="visually-hidden">Phase IV four-digit EC routing</legend>
            <div className="flex items-center justify-between gap-2">
              <span aria-hidden="true" className="text-base font-bold text-[var(--ink)]">
                Phase IV EC routing
              </span>
              <button
                type="button"
                onClick={openGuideModal}
                className="inline-flex cursor-pointer items-center gap-1.5 text-sm font-semibold text-[var(--teal)] hover:underline"
              >
                <Info className="h-4 w-4" aria-hidden="true" />
                <span>Routing guide</span>
              </button>
            </div>

            {level !== 'Phase4' ? (
              <p className="rounded-xl border border-[var(--line-strong)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--ink-secondary)]">
                Select <strong>Complete Cascade (Phases I–IV)</strong> above to configure four-digit
                EC routing.
              </p>
            ) : (
              <div className="space-y-3">
                <div className="divide-y divide-[var(--line)] overflow-hidden rounded-xl border border-[var(--line-strong)] bg-white">
                  <label
                    className={`flex cursor-pointer items-start gap-3 px-4 py-3 transition ${
                      phase4Mode === 'automatic'
                        ? 'bg-[var(--teal-soft)]'
                        : 'hover:bg-[var(--surface)]'
                    }`}
                  >
                    <input
                      type="radio"
                      name="phase4Mode"
                      value="automatic"
                      checked={phase4Mode === 'automatic'}
                      onChange={() => changePhase4Mode('automatic')}
                      className="mt-1 h-4.5 w-4.5 shrink-0 accent-[var(--teal)]"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-[15px] font-bold text-[var(--navy)] sm:text-base">
                          Auto-Route All 10 Classes
                        </span>
                        <span className="rounded-md bg-white px-2 py-0.5 font-mono text-xs font-bold text-[var(--teal)]">
                          Recommended
                        </span>
                      </span>
                      <span className="mt-0.5 block text-sm leading-5 text-[var(--ink-secondary)]">
                        Routes each protein using its Phase III class.
                      </span>
                    </span>
                  </label>

                  <label
                    className={`flex cursor-pointer items-start gap-3 px-4 py-3 transition ${
                      phase4Mode === 'specific'
                        ? 'bg-[var(--teal-soft)]'
                        : 'hover:bg-[var(--surface)]'
                    }`}
                  >
                    <input
                      type="radio"
                      name="phase4Mode"
                      value="specific"
                      checked={phase4Mode === 'specific'}
                      onChange={() => changePhase4Mode('specific')}
                      className="mt-1 h-4.5 w-4.5 shrink-0 accent-[var(--teal)]"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block text-[15px] font-bold text-[var(--navy)] sm:text-base">
                        Restrict to One Class
                      </span>
                      <span className="mt-0.5 block text-sm leading-5 text-[var(--ink-secondary)]">
                        Runs Phase IV only on one chosen enzyme class.
                      </span>
                    </span>
                  </label>
                </div>

                {phase4Mode === 'specific' && (
                  <div className="space-y-1.5 rounded-xl border border-[var(--line-strong)] bg-[var(--surface)] p-3.5">
                    <label
                      htmlFor="enzyme-class-select"
                      className="block text-sm font-bold text-[var(--navy)]"
                    >
                      Target Phase IV enzyme class:
                    </label>
                    <select
                      id="enzyme-class-select"
                      name="enzymeClass"
                      value={enzymeClass}
                      onChange={(e) => changeEnzymeClass(e.target.value as EnzymeClass)}
                      className="field !py-2 text-sm font-semibold"
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
          <div className="space-y-4 border-t border-[var(--line-strong)] pt-4">
            <div>
              <div className="flex items-center justify-between text-sm">
                <span className="font-bold text-[var(--navy)]">Submission Verification</span>
                <span className="font-mono text-xs font-semibold text-[var(--ink-secondary)]">
                  30-day private link
                </span>
              </div>
              <div className="mt-2 min-h-8">
                {!securityConfig.loaded ? (
                  <div className="flex min-h-8 items-center gap-2 text-sm text-[var(--ink-secondary)]">
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    Loading verification…
                  </div>
                ) : securityConfig.error ? (
                  <p className="text-sm font-semibold text-[var(--danger)]">
                    {securityConfig.error}
                  </p>
                ) : securityConfig.required ? (
                  turnstile ? (
                    <span className="flex items-center gap-2 text-sm font-bold text-[var(--teal)]">
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
                  <span className="flex items-center gap-2 text-sm font-bold text-[var(--teal)]">
                    <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                    Ready to submit
                  </span>
                )}
              </div>
            </div>

            <button type="submit" disabled={busy} className="btn-amber w-full py-3.5 text-base">
              {busy ? (
                <>
                  <Loader2 className="h-4.5 w-4.5 animate-spin" aria-hidden="true" />
                  <span>Running prediction…</span>
                </>
              ) : (
                <>
                  <span>Start Prediction</span>
                  <ArrowRight className="h-4.5 w-4.5" aria-hidden="true" />
                </>
              )}
            </button>

            <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[var(--line-strong)] bg-[var(--teal-soft)] px-4 py-3 text-sm text-[var(--navy)]">
              <span>Screening &gt;10,000 sequences locally?</span>
              <Link href="/download" className="font-bold text-[var(--teal)] hover:underline">
                Download CLI Package →
              </Link>
            </div>
          </div>
        </aside>
      </form>

      {/* ==================== NATIVE MODAL DIALOG: CLASS & ROUTING GUIDE ==================== */}
      <dialog
        ref={dialogRef}
        aria-labelledby="class-guide-modal-title"
        onPointerDown={handleDialogPointerDown}
        onPointerUp={handleDialogPointerUp}
        {...({ closedby: 'any' } as Record<string, string>)}
      >
        <div className="flex max-h-[85dvh] flex-col">
          <div className="flex items-start justify-between gap-4 border-b border-[var(--line-strong)] bg-[var(--limestone)] px-6 py-4">
            <div>
              <p className="eyebrow">MINpred Reference Guide</p>
              <h1
                id="class-guide-modal-title"
                className="mt-0.5 font-display text-xl font-bold text-[var(--navy)]"
              >
                10 Enzyme Classes &amp; Phase IV EC Routing
              </h1>
            </div>
            <form method="dialog">
              <button
                value="close"
                autoFocus
                aria-label="Close guide"
                className="btn-ghost-rule py-1.5 px-3 text-sm"
              >
                <X className="h-4 w-4" aria-hidden="true" />
                <span>Close</span>
              </button>
            </form>
          </div>

          <div className="space-y-5 overflow-y-auto p-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-[var(--line-strong)] bg-[var(--surface)] p-4">
                <h2 className="text-base font-bold text-[var(--navy)]">
                  10-Class Demo vs. Individual Class Examples
                </h2>
                <p className="mt-1.5 text-sm leading-6 text-[var(--ink)]">
                  <strong>Load 10-Class Demo</strong> loads 10 curated proteins (1 from each class)
                  with automatic routing enabled. Clicking an individual code (<code>SEP</code>–
                  <code>AH</code>) loads a single representative sequence for that class.
                </p>
              </div>

              <div className="rounded-xl border border-[var(--line-strong)] bg-[var(--surface)] p-4">
                <h2 className="text-base font-bold text-[var(--navy)]">
                  Auto-Route vs. Restrict to One Class
                </h2>
                <p className="mt-1.5 text-sm leading-6 text-[var(--ink)]">
                  <strong>Auto-Route All 10 Classes</strong> uses each protein&apos;s Phase III
                  prediction to select the matching Phase IV EC model (<code>M1–M10</code>).{' '}
                  <strong>Restrict to One Class</strong> runs Phase IV only on proteins predicted as
                  your chosen class.
                </p>
              </div>
            </div>

            <div className="sci-table-wrap overflow-x-auto">
              <table className="sci-table">
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Enzyme Class</th>
                    <th>EC Prefix</th>
                    <th className="hidden sm:table-cell">Pathway Step</th>
                    <th className="text-right">Example</th>
                  </tr>
                </thead>
                <tbody>
                  {MINERALIZATION_CLASSES.map((cls) => (
                    <tr key={cls.key}>
                      <th scope="row" className="font-mono font-extrabold text-[var(--navy)]">
                        {cls.code}
                      </th>
                      <td>
                        <span className="font-bold text-[var(--ink)]">{cls.name}</span>
                        <span className="block text-xs text-[var(--ink-secondary)]">
                          {cls.ecs.length} explicit four-digit EC{cls.ecs.length === 1 ? '' : 's'} +
                          Others
                        </span>
                      </td>
                      <td className="font-mono font-bold text-[var(--teal)]">{cls.ecPrefix}</td>
                      <td className="hidden text-sm text-[var(--ink-secondary)] sm:table-cell">
                        {cls.stageShort}
                      </td>
                      <td className="text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => {
                            selectExample(cls.key);
                            closeGuideModal();
                          }}
                          className="btn-outline-sharp !min-h-0 py-1.5 px-3 text-xs"
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
      </dialog>
    </div>
  );
}
