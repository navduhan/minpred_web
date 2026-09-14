'use client';

import { useEffect, useMemo, useState } from 'react';
import { Bookmark, Check, Copy, Database, FileUp, Loader2, Play, RotateCcw, ShieldCheck } from 'lucide-react';
import TurnstileWidget from '@/components/TurnstileWidget';
import { withBasePath } from '@/lib/base-path';
import { buildJobBookmark } from '@/lib/job-bookmark';
import { demoSequences } from '@/data/demo-sequences';

const enzymeClassOptions = [
  ['amidohydrolases', 'Amidohydrolases'],
  ['aminopeptidases', 'Aminopeptidases'],
  ['aspartic', 'Aspartic endopeptidases'],
  ['cysteine', 'Cysteine endopeptidases'],
  ['dipeptidases', 'Dipeptidases'],
  ['dipeptidyl', 'Dipeptidyl-peptidases'],
  ['metalloendopeptidases', 'Metalloendopeptidases'],
  ['metallopeptidases', 'Metallopeptidases'],
  ['omega', 'Omega peptidases'],
  ['serine', 'Serine endopeptidases'],
] as const;
type EnzymeClass = typeof enzymeClassOptions[number][0];

type Job = { jobId: string; jobToken?: string; status: 'queued'|'running'|'completed'|'failed'; message?: string; error?: string; results?: Record<string, Record<string,string|number>[]> };

async function parseResponse(response: Response) {
  const text = await response.text();
  try { return JSON.parse(text) as Job; } catch { throw new Error(`Prediction service returned ${response.status} ${response.statusText}.`); }
}
const wait = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));

async function poll(jobId: string, token: string, update: (message: string) => void) {
  for (;;) {
    const response = await fetch(withBasePath(`/api/predict?jobId=${encodeURIComponent(jobId)}`), { cache: 'no-store', headers: { 'X-MINpred-Job-Token': token } });
    const job = await parseResponse(response);
    if (!response.ok) throw new Error(job.error || 'Unable to read job status.');
    update(job.message || `Job ${job.status}`);
    if (job.status === 'completed' || job.status === 'failed') return job;
    await wait(3000);
  }
}

export default function PredictionPage() {
  const [sequenceType,setSequenceType]=useState<'prot'|'nucl'>('prot');
  const [mode, setMode] = useState<'paste'|'upload'|'accession'>('paste');
  const [sequence, setSequence] = useState('');
  const [accessions, setAccessions] = useState('');
  const [database, setDatabase] = useState<'uniprot'|'ncbi'>('uniprot');
  const [level, setLevel] = useState('Phase4');
  const [phase4Mode, setPhase4Mode] = useState<'automatic'|'specific'>('automatic');
  const [enzymeClass, setEnzymeClass] = useState<EnzymeClass>('amidohydrolases');
  const [fileName, setFileName] = useState('');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('Preparing secure submission…');
  const [error, setError] = useState('');
  const [turnstile, setTurnstile] = useState('');
  const [resetKey, setResetKey] = useState(0);
  const [securityConfig, setSecurityConfig] = useState({ loaded: false, required: true, siteKey: '', error: '' });
  const [receipt, setReceipt] = useState<{jobId:string;url:string}|null>(null);
  const [copied, setCopied] = useState(false);
  const count = useMemo(() => (sequence.match(/^>/gm) || []).length, [sequence]);

  useEffect(() => {
    let cancelled = false;
    void Promise.resolve().then(() => {
      const raw = localStorage.getItem('minpred_active_job');
      if (!raw || cancelled) return;
      try {
        const active = JSON.parse(raw) as {jobId:string;jobToken:string};
        if (!active.jobId || !active.jobToken) return;
        setBusy(true); setStatus('Resuming private job monitoring…');
        const url = buildJobBookmark(active); setReceipt({jobId:active.jobId,url});
        void poll(active.jobId, active.jobToken, setStatus).then((job) => {
          if (cancelled) return;
          localStorage.removeItem('minpred_active_job');
          if (job.status === 'failed') throw new Error(job.error || 'Prediction failed.');
          localStorage.setItem('minpred_last_results', JSON.stringify(job));
          window.location.assign(url);
        }).catch((e: unknown) => { if (!cancelled) { setBusy(false); setError(e instanceof Error ? e.message : 'Unable to resume job.'); } });
      } catch { localStorage.removeItem('minpred_active_job'); }
    });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    void fetch(withBasePath('/api/security-config'), { cache: 'no-store' })
      .then(async (response) => {
        const config = await response.json() as { turnstileRequired?: boolean; turnstileSiteKey?: string };
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
        if (!cancelled) setSecurityConfig({ loaded: true, required: true, siteKey: '', error: 'Verification is temporarily unavailable.' });
      });
    return () => { cancelled = true; };
  }, []);

  async function fetchAccessions() {
    if (!accessions.trim()) return setError('Enter at least one accession.');
    setBusy(true); setStatus('Retrieving protein sequences…'); setError('');
    try {
      const response = await fetch(withBasePath('/api/accession'), { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({accessions,database:database,db:database}) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Accession retrieval failed.');
      setSequenceType('prot');setSequence(data.fasta); setMode('paste');
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Accession retrieval failed.'); }
    finally { setBusy(false); }
  }

  async function submit() {
    if (!sequence.trim().startsWith('>')) return setError('Provide FASTA beginning with a header line (>).');
    if (!securityConfig.loaded) return setError('Wait for the anti-bot verification to load.');
    if (securityConfig.required && !securityConfig.siteKey) return setError('Anti-bot verification is not configured correctly.');
    if (securityConfig.required && !turnstile) return setError('Complete the anti-bot check before submitting.');
    setBusy(true); setStatus('Submitting your sequences…'); setError('');
    try {
      const response = await fetch(withBasePath('/api/predict'), { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({sequence,sequenceType,level,enzymeClass:level==='Phase4'&&phase4Mode==='specific'?enzymeClass:'all',turnstileToken:turnstile}) });
      const job = await parseResponse(response);
      if (!response.ok || !job.jobToken) throw new Error(job.error || 'Job submission failed.');
      const active = {jobId:job.jobId,jobToken:job.jobToken};
      localStorage.setItem('minpred_active_job', JSON.stringify(active));
      const url = buildJobBookmark(active); setReceipt({jobId:job.jobId,url});
      const complete = await poll(job.jobId, job.jobToken, setStatus);
      localStorage.removeItem('minpred_active_job');
      if (complete.status === 'failed') throw new Error(complete.error || 'Prediction failed.');
      localStorage.setItem('minpred_last_results', JSON.stringify(complete));
      window.location.assign(url);
    } catch (e: unknown) { setBusy(false); setError(e instanceof Error ? e.message : 'Prediction failed.'); setTurnstile(''); setResetKey((v)=>v+1); }
  }

  function upload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]; if (!file) return;
    setFileName(file.name); const reader = new FileReader();
    reader.onload = () => { setSequence(String(reader.result || '').trim()); }; reader.readAsText(file);
  }

  function clear() { setSequence(''); setAccessions(''); setFileName(''); setError(''); setReceipt(null); setLevel('Phase4'); setPhase4Mode('automatic'); setEnzymeClass('amidohydrolases'); }

  function loadExample() {
    setSequenceType('prot');
    setSequence(demoSequences.amidohydrolases);
    setMode('paste');
  }

  return <div className="mx-auto max-w-5xl space-y-8 py-5 sm:py-10">
    <header className="text-center"><p className="eyebrow">MINpred analysis</p><h1 className="mt-3 font-display text-5xl font-semibold text-[var(--forest-dark)]">Predict enzyme function</h1><p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-[var(--muted)]">Add a protein or nucleotide sequence, choose the result you need, and submit the analysis.</p></header>
    {error && <div role="alert" className="rounded-xl border border-[#e2b9bf] bg-[#fff7f7] px-4 py-3 text-sm font-semibold text-[var(--danger)]">{error}</div>}
    <section className="overflow-hidden rounded-[2rem] border border-[var(--line)] bg-white shadow-[0_24px_70px_rgba(45,42,38,.08)]">
      <div className="border-b border-[var(--line)] p-6 sm:p-8"><div className="grid gap-6 sm:grid-cols-[1fr_1.5fr]"><div><p className="eyebrow">Step 1</p><h2 className="mt-1 font-display text-2xl font-semibold">Choose the input</h2></div><div className="grid gap-4 sm:grid-cols-2"><label className="text-sm font-bold">Sequence type<select className="field mt-2" value={sequenceType} onChange={e=>setSequenceType(e.target.value as 'prot'|'nucl')}><option value="prot">Protein</option><option value="nucl">Nucleotide</option></select></label><fieldset><legend className="text-sm font-bold">Input method</legend><div className="mt-2 grid grid-cols-3 gap-1 rounded-xl bg-[var(--mist)] p-1">{(['paste','upload','accession'] as const).map(item=><button key={item} type="button" onClick={()=>setMode(item)} className={`rounded-lg px-2 py-3 text-xs font-bold capitalize ${mode===item?'bg-white text-[var(--forest)] shadow-sm':'text-[var(--muted)]'}`}>{item}</button>)}</div></fieldset></div></div>{sequenceType==='nucl'&&<p className="mt-4 rounded-xl bg-[var(--mineral-soft)] px-4 py-3 text-xs text-[var(--muted)]">TransDecoder.LongOrfs translates nucleotide records before MINpred analysis.</p>}</div>
      <div className="border-b border-[var(--line)] p-6 sm:p-8"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="eyebrow">Step 2</p><h2 className="mt-1 font-display text-2xl font-semibold">Add sequence data</h2></div><div className="flex gap-2"><button type="button" onClick={loadExample} className="btn-secondary">Load example</button><button type="button" onClick={clear} className="btn-secondary"><RotateCcw className="h-3.5 w-3.5"/>Clear</button></div></div>
        {mode==='accession'&&<div className="mt-6 grid gap-3 sm:grid-cols-[150px_1fr_auto]"><select className="field" value={database} onChange={(e)=>setDatabase(e.target.value as 'uniprot'|'ncbi')}><option value="uniprot">UniProtKB</option><option value="ncbi">NCBI Protein</option></select><input className="field" value={accessions} onChange={(e)=>setAccessions(e.target.value)} placeholder="Enter one or more accessions"/><button type="button" onClick={fetchAccessions} className="btn-secondary"><Database className="h-4 w-4"/>Retrieve</button></div>}
        {mode==='upload'&&<label className="mt-6 flex min-h-28 cursor-pointer items-center justify-center gap-4 rounded-2xl border border-dashed border-[#b8b4ad] bg-[#faf9f7] px-5 text-center"><FileUp className="h-6 w-6 text-[var(--forest)]"/><span><b className="block text-sm">Choose a FASTA file</b><span className="text-xs text-[var(--muted)]">{fileName||'.fasta, .fa, .faa, or .txt'}</span></span><input className="sr-only" type="file" accept=".fasta,.fa,.faa,.txt" onChange={upload}/></label>}
        <textarea id="minpred-fasta" aria-label="FASTA sequence" rows={11} className="field mt-6 resize-y font-mono text-xs leading-6" value={sequence} onChange={(e)=>setSequence(e.target.value)} placeholder=">protein_id&#10;MSEQUENCE..."/><p className="mt-2 text-xs text-[var(--muted)]">{count?`${count} record${count===1?'':'s'} detected`:sequenceType==='nucl'?'Accepted symbols: A, C, G, T, U, and N.':'Standard amino acids and X are accepted.'}</p></div>
      <div className="p-6 sm:p-8"><div><p className="eyebrow">Step 3</p><div className="mt-1 flex flex-col justify-between gap-1 sm:flex-row sm:items-end"><h2 className="font-display text-2xl font-semibold">Choose the result</h2><p className="text-xs leading-5 text-[var(--muted)]">Each option includes the preceding phases.</p></div><div className="mt-5 grid gap-3 sm:grid-cols-2">{[['Phase1','Phase I','Enzyme or non-enzyme'],['Phase2','Phase II','Nitrogen mineralization screening'],['Phase3','Phase III','Mineralization enzyme class'],['Phase4','Phase IV','Class-specific EC assignment']].map(([value,phase,label])=><label key={value} className={`flex cursor-pointer items-center gap-4 rounded-xl border px-4 py-3 ${level===value?'border-[var(--forest)] bg-[#f1f3f4]':'border-[var(--line)]'}`}><input type="radio" name="level" value={value} checked={level===value} onChange={()=>setLevel(value)} className="h-4 w-4 accent-[#46545c]"/><span><strong className="block text-sm">{phase}</strong><span className="text-xs text-[var(--muted)]">{label}</span></span></label>)}</div></div>
        {level==='Phase4'&&<fieldset className="mt-5 rounded-2xl bg-[var(--mist)] p-4"><legend className="px-1 text-sm font-bold">How should the enzyme class be chosen?</legend><div className="mt-2 grid gap-3 sm:grid-cols-2"><label className={`cursor-pointer rounded-xl border bg-white p-4 ${phase4Mode==='automatic'?'border-[var(--forest)] ring-1 ring-[var(--forest)]':'border-[var(--line)]'}`}><span className="flex items-start gap-3"><input type="radio" name="phase4-mode" checked={phase4Mode==='automatic'} onChange={()=>setPhase4Mode('automatic')} className="mt-0.5 h-4 w-4 accent-[#46545c]"/><span><strong className="block text-sm">Determine automatically</strong><span className="mt-1 block text-xs leading-5 text-[var(--muted)]">Use the Phase III prediction for each sequence.</span></span></span></label><label className={`cursor-pointer rounded-xl border bg-white p-4 ${phase4Mode==='specific'?'border-[var(--forest)] ring-1 ring-[var(--forest)]':'border-[var(--line)]'}`}><span className="flex items-start gap-3"><input type="radio" name="phase4-mode" checked={phase4Mode==='specific'} onChange={()=>setPhase4Mode('specific')} className="mt-0.5 h-4 w-4 accent-[#46545c]"/><span><strong className="block text-sm">Use a specific class</strong><span className="mt-1 block text-xs leading-5 text-[var(--muted)]">Apply one selected class model to all sequences.</span></span></span></label></div>{phase4Mode==='specific'&&<label htmlFor="phase4-class" className="mt-4 block text-sm font-bold">Select enzyme class<select id="phase4-class" className="field mt-2" value={enzymeClass} onChange={event=>setEnzymeClass(event.target.value as EnzymeClass)}>{enzymeClassOptions.map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label>}</fieldset>}
        <div className="mt-7 flex flex-col gap-4 border-t border-[var(--line)] pt-6 sm:flex-row sm:items-center sm:justify-between"><div className="min-h-[65px]">{!securityConfig.loaded?<div className="flex min-h-[65px] items-center gap-2 text-xs"><Loader2 className="h-4 w-4 animate-spin"/>Loading verification...</div>:securityConfig.error?<p className="text-xs text-[var(--danger)]">{securityConfig.error}</p>:securityConfig.required?<TurnstileWidget siteKey={securityConfig.siteKey} resetKey={resetKey} onToken={setTurnstile}/>:<span className="flex items-center gap-2 text-xs text-[var(--muted)]"><ShieldCheck className="h-4 w-4"/>Ready to submit. Results are retained for 30 days.</span>}</div><button type="button" disabled={busy||!securityConfig.loaded||Boolean(securityConfig.error)} onClick={submit} className="btn-primary min-w-48 px-6 py-3">{busy?<Loader2 className="h-4 w-4 animate-spin"/>:<Play className="h-4 w-4"/>}{busy?'Running...':'Start prediction'}</button></div>
      </div>
    </section>
    {busy && <section aria-live="polite" className="surface p-5"><div className="flex items-center gap-3"><Loader2 className="h-5 w-5 animate-spin text-[var(--forest)]"/><div><p className="text-sm font-bold text-[var(--forest-dark)]">{status}</p><p className="mt-1 text-xs text-slate-500">You may keep this page open or bookmark the private result link.</p></div></div>{receipt&&<div className="mt-4 flex flex-col gap-3 rounded-xl bg-[#f4f8fb] p-4 sm:flex-row sm:items-center"><Bookmark className="h-4 w-4 text-[var(--mineral)]"/><code className="min-w-0 flex-1 truncate text-xs">{receipt.url}</code><button type="button" className="btn-secondary" onClick={()=>void navigator.clipboard.writeText(receipt.url).then(()=>{setCopied(true);setTimeout(()=>setCopied(false),1500)})}>{copied?<Check className="h-4 w-4"/>:<Copy className="h-4 w-4"/>}{copied?'Copied':'Copy'}</button></div>}</section>}
    <p className="border-t border-[var(--line)] pt-5 text-sm text-slate-600">For large datasets, we recommend using the <a className="font-semibold underline" href={withBasePath('/download')}>standalone tool</a> on your computer or cluster.</p>
  </div>;
}
