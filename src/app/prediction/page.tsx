'use client';

import { useEffect, useMemo, useState } from 'react';
import { Bookmark, Check, Copy, Database, FileUp, Loader2, Play, RotateCcw, ShieldCheck } from 'lucide-react';
import TurnstileWidget from '@/components/TurnstileWidget';
import { withBasePath } from '@/lib/base-path';
import { buildJobBookmark } from '@/lib/job-bookmark';
import { demoSequences } from '@/data/demo-sequences';

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
      const response = await fetch(withBasePath('/api/predict'), { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({sequence,sequenceType,level,enzymeClass:'all',turnstileToken:turnstile}) });
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

  function clear() { setSequence(''); setAccessions(''); setFileName(''); setError(''); setReceipt(null); setLevel('Phase4'); }

  function loadExample() {
    setSequenceType('prot');
    setSequence(demoSequences.amidohydrolases);
    setMode('paste');
  }

  return <div className="space-y-8 py-5 sm:py-10">
    <header className="grid gap-5 border-b border-[var(--line)] pb-8 lg:grid-cols-[1fr_360px] lg:items-end"><div><p className="eyebrow">MINpred analysis</p><h1 className="mt-3 font-display text-5xl font-semibold text-[var(--forest-dark)]">Submit sequences</h1></div><p className="text-sm leading-6 text-[var(--muted)]">Choose a prediction endpoint, add protein or nucleotide FASTA, and submit the job to the configured research cluster.</p></header>
    {error && <div role="alert" className="border-l-4 border-[var(--danger)] bg-[#fff4f4] px-4 py-3 text-sm font-semibold text-[var(--danger)]">{error}</div>}
    <section className="overflow-hidden border-y border-[var(--line)] bg-white">
      <div className="grid md:grid-cols-4">{[['Phase1','Enzyme screen'],['Phase2','Mineralization screen'],['Phase3','Enzyme class'],['Phase4','Automatic EC assignment']].map(([value,label],i)=><label key={value} className={`relative cursor-pointer px-5 py-5 md:border-r md:last:border-r-0 ${level===value?'bg-[#eaf4ff]':'bg-white'}`}><input type="radio" name="level" value={value} checked={level===value} onChange={()=>setLevel(value)} className="sr-only"/><span className="font-mono text-[10px] text-[var(--mineral)]">0{i+1}</span><strong className="mt-1 block text-sm text-[var(--forest-dark)]">{label}</strong>{level===value&&<span className="absolute inset-x-0 bottom-0 h-1 bg-[var(--mineral)]"/>}</label>)}</div>
      <div className="grid border-t border-[var(--line)] lg:grid-cols-[220px_1fr]">
        <aside className="border-b border-[var(--line)] bg-[#f4f8fc] p-5 lg:border-b-0 lg:border-r"><p className="font-mono text-[10px] font-bold uppercase tracking-[.16em] text-[var(--muted)]">Input source</p><div className="mt-5 space-y-1">{(['paste','upload','accession'] as const).map(item=><button key={item} type="button" onClick={()=>setMode(item)} className={`block w-full border-l-2 px-3 py-2 text-left text-sm font-bold capitalize ${mode===item?'border-[var(--mineral)] bg-white text-[var(--forest)]':'border-transparent text-[var(--muted)]'}`}>{item}</button>)}</div><label className="mt-8 block text-xs font-bold">Sequence type<select className="field mt-2 text-xs" value={sequenceType} onChange={e=>setSequenceType(e.target.value as 'prot'|'nucl')}><option value="prot">Protein</option><option value="nucl">Nucleotide</option></select></label>{sequenceType==='nucl'&&<p className="mt-3 text-xs leading-5 text-[var(--muted)]">TransDecoder.LongOrfs translates nucleotide records before prediction.</p>}<button type="button" onClick={clear} className="mt-8 flex items-center gap-2 text-xs font-bold text-[var(--muted)]"><RotateCcw className="h-3.5 w-3.5"/>Clear input</button></aside>
        <div className="p-5 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="eyebrow">Sequence data</p><h2 className="mt-1 text-xl font-extrabold">FASTA input</h2></div><button type="button" onClick={loadExample} className="btn-secondary">Load example</button></div>
          {mode==='accession'&&<div className="mt-6 grid gap-3 sm:grid-cols-[150px_1fr_auto]"><select className="field" value={database} onChange={(e)=>setDatabase(e.target.value as 'uniprot'|'ncbi')}><option value="uniprot">UniProtKB</option><option value="ncbi">NCBI Protein</option></select><input className="field" value={accessions} onChange={(e)=>setAccessions(e.target.value)} placeholder="Enter one or more accessions"/><button type="button" onClick={fetchAccessions} className="btn-secondary"><Database className="h-4 w-4"/>Retrieve</button></div>}
          {mode==='upload'&&<label className="mt-6 flex min-h-28 cursor-pointer items-center justify-center gap-4 border border-dashed border-[#8fb4d8] bg-[#f7fbff] px-5 text-center"><FileUp className="h-6 w-6 text-[var(--forest)]"/><span><b className="block text-sm">Choose a FASTA file</b><span className="text-xs text-[var(--muted)]">{fileName||'.fasta, .fa, .faa, or .txt'}</span></span><input className="sr-only" type="file" accept=".fasta,.fa,.faa,.txt" onChange={upload}/></label>}
          <textarea id="minpred-fasta" aria-label="FASTA sequence" rows={13} className="field mt-6 resize-y font-mono text-xs leading-6" value={sequence} onChange={(e)=>setSequence(e.target.value)} placeholder=">protein_id&#10;MSEQUENCE..."/><p className="mt-2 text-xs text-[var(--muted)]">{count?`${count} record${count===1?'':'s'} detected`:sequenceType==='nucl'?'Accepted nucleotide symbols: A, C, G, T, U, and N.':'Standard amino acids and X are accepted.'}</p>
        </div>
      </div>
      <div className="grid items-center gap-5 border-t border-[var(--line)] bg-[var(--forest-dark)] px-5 py-5 text-white sm:grid-cols-[1fr_auto_auto] sm:px-8"><div><p className="text-sm font-bold">{level==='Phase4'?'Phase IV routes each Phase III class to the matching EC model.':`${level} stops after the selected prediction endpoint.`}</p><p className="mt-1 text-xs text-[#a9bfd5]">Private results are retained for 30 days.</p></div><div className="min-h-[65px]">{!securityConfig.loaded?<div className="flex min-h-[65px] items-center gap-2 text-xs"><Loader2 className="h-4 w-4 animate-spin"/>Loading verification...</div>:securityConfig.error?<p className="text-xs text-red-200">{securityConfig.error}</p>:securityConfig.required?<TurnstileWidget siteKey={securityConfig.siteKey} resetKey={resetKey} onToken={setTurnstile}/>:<span className="flex items-center gap-2 text-xs text-[#a9bfd5]"><ShieldCheck className="h-4 w-4"/>Ready to submit</span>}</div><button type="button" disabled={busy||!securityConfig.loaded||Boolean(securityConfig.error)} onClick={submit} className="flex items-center justify-center gap-2 bg-[var(--mineral)] px-6 py-3 text-sm font-black text-white hover:bg-[#0f63b6] disabled:opacity-60">{busy?<Loader2 className="h-4 w-4 animate-spin"/>:<Play className="h-4 w-4"/>}{busy?'Running...':'Start prediction'}</button></div>
    </section>
    {busy && <section aria-live="polite" className="surface p-5"><div className="flex items-center gap-3"><Loader2 className="h-5 w-5 animate-spin text-[var(--forest)]"/><div><p className="text-sm font-bold text-[var(--forest-dark)]">{status}</p><p className="mt-1 text-xs text-slate-500">You may keep this page open or bookmark the private result link.</p></div></div>{receipt&&<div className="mt-4 flex flex-col gap-3 rounded-xl bg-[#f4f8fb] p-4 sm:flex-row sm:items-center"><Bookmark className="h-4 w-4 text-[var(--mineral)]"/><code className="min-w-0 flex-1 truncate text-xs">{receipt.url}</code><button type="button" className="btn-secondary" onClick={()=>void navigator.clipboard.writeText(receipt.url).then(()=>{setCopied(true);setTimeout(()=>setCopied(false),1500)})}>{copied?<Check className="h-4 w-4"/>:<Copy className="h-4 w-4"/>}{copied?'Copied':'Copy'}</button></div>}</section>}
    <p className="border-t border-[var(--line)] pt-5 text-sm text-slate-600">For large datasets, we recommend using the <a className="font-semibold underline" href={withBasePath('/download')}>standalone tool</a> on your computer or cluster.</p>
  </div>;
}
