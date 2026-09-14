'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

import { CheckCircle2, Download, ExternalLink, FlaskConical, Loader2 } from 'lucide-react';
import { withBasePath } from '@/lib/base-path';
import { expiresAt, readJobBookmark, type JobBookmark } from '@/lib/job-bookmark';


type Value=string|number|boolean|null; type Row=Record<string,Value>;
type Result={jobId?:string;status?:string;error?:string;updatedAt?:string;results?:Record<string,Row[]>};
const display=(value:Value|undefined)=>{const text=String(value??'').replaceAll('_',' ');return text.charAt(0).toUpperCase()+text.slice(1);};
const heading=(h:string)=>{const names:Record<string,string>={SampleID:'Sequence ID',Sequence_ID:'Sequence ID',EC_Number:'EC number'};return (names[h]||display(h.replace(/^Prob_/,'')))+(h.startsWith('Prob_')?' (%)':'');};
const rank=(n:string)=>n.includes('Phase_1')?1:n.includes('Phase_2')?2:n.includes('Phase_3')?3:n.includes('Phase_4')?4:9;
const meta=(n:string)=>n.includes('Phase_1')?['Phase 1','Enzyme screen']:n.includes('Phase_2')?['Phase 2','Mineralization screen']:n.includes('Phase_3')?['Phase 3','Enzyme class']:n.includes('Phase_4')?['Phase 4','EC assignment']:['Output',n];
const idOf=(row:Row)=>String(row.SampleID??row.Sequence_ID??'');
const tsv=(rows:Row[])=>rows.length?[Object.keys(rows[0]).join('\t'),...rows.map(r=>Object.keys(rows[0]).map(k=>String(r[k]??'')).join('\t'))].join('\n'):'';
const csv=(rows:Row[])=>rows.length?[Object.keys(rows[0]),...rows.map(r=>Object.keys(rows[0]).map(k=>r[k]??''))].map(row=>row.map(value=>`"${String(value).replaceAll('"','""')}"`).join(',')).join('\n'):'';
function save(content:string,name:string,type='text/tab-separated-values'){const url=URL.createObjectURL(new Blob([content],{type}));const a=document.createElement('a');a.href=url;a.download=name;a.click();URL.revokeObjectURL(url);}
async function fetchJob(b:JobBookmark){const response=await fetch(withBasePath(`/api/predict?jobId=${encodeURIComponent(b.jobId)}`),{cache:'no-store',headers:{'X-MINpred-Job-Token':b.jobToken}});const data=await response.json() as Result;if(!response.ok)throw new Error(data.error||'Result was not found.');return data;}
const links=(ec:string)=>[['NCBI',`https://www.ncbi.nlm.nih.gov/protein/?term=${encodeURIComponent(ec)}`],['UniProt',`https://www.uniprot.org/uniprotkb?query=${encodeURIComponent(ec)}`],['BRENDA',`https://www.brenda-enzymes.org/enzyme.php?ecno=${encodeURIComponent(ec)}`],['KEGG',`https://www.genome.jp/dbget-bin/www_bget?ec:${encodeURIComponent(ec)}`],['JGI',`https://img.jgi.doe.gov/cgi-bin/m/main.cgi?section=FindFunctions&page=EnzymeGenomeList&gtype=isolate&ec_number=EC:${encodeURIComponent(ec)}`]];

export default function ResultsPage(){
  const [data,setData]=useState<Result|null>(null),[loaded,setLoaded]=useState(false),[error,setError]=useState(''),[active,setActive]=useState('');
  const [structures,setStructures] = useState<Record<string, {secondary:string;tertiary:string}>>({});
  const [structureBusy,setStructureBusy]=useState('');
  const [bookmark,setBookmark]=useState<JobBookmark|null>(null);
  useEffect(()=>{let cancelled=false;void Promise.resolve().then(async()=>{const b=readJobBookmark();if(!cancelled)setBookmark(b);try{let d=b?await fetchJob(b):JSON.parse(localStorage.getItem('minpred_last_results')||'null') as Result|null;if(b&&d)while(!cancelled&&(d.status==='queued'||d.status==='running')){await new Promise(r=>setTimeout(r,3000));d=await fetchJob(b);}if(d?.status==='failed')throw new Error(d.error||'Prediction failed.');if(!cancelled&&d){setData(d);setActive(new URLSearchParams(window.location.hash.slice(1)).get('phase')||Object.keys(d.results||{}).sort((a,c)=>rank(a)-rank(c))[0]||'');localStorage.setItem('minpred_last_results',JSON.stringify(d));}}catch(e:unknown){if(!cancelled)setError(e instanceof Error?e.message:'Unable to load result.');}finally{if(!cancelled)setLoaded(true);}});return()=>{cancelled=true};},[]);
  useEffect(() => {
    if (!bookmark) return;
    let cancelled = false;
    const refresh = async () => {
      try {
        const response = await fetch(withBasePath('/api/structure/status?jobId=' + encodeURIComponent(bookmark.jobId)), { cache: 'no-store', headers: {'X-MINpred-Job-Token': bookmark.jobToken} });
        if (response.ok && !cancelled) setStructures(await response.json());
      } catch { /* Keep the last known status when the connection is interrupted. */ }
    };
    void refresh();
    const timer = setInterval(() => void refresh(), 5000);
    return () => { cancelled = true; clearInterval(timer); };
  }, [bookmark]);
  const files=useMemo(()=>Object.keys(data?.results||{}).sort((a,b)=>rank(a)-rank(b)),[data]);const rows=data?.results?.[active]||[];const columns=Object.keys(rows[0]||{});const expiry=data?.updatedAt?expiresAt(data.updatedAt):null;
  async function openStructure(kind:'secondary'|'tertiary',sampleId:string){
    if(!bookmark||structureBusy)return;
    setStructureBusy(kind+':'+sampleId);setError('');
    try{
      const response=await fetch(withBasePath('/api/structure/'+kind),{method:'POST',headers:{'Content-Type':'application/json','X-MINpred-Job-Token':bookmark.jobToken},body:JSON.stringify({jobId:bookmark.jobId,sampleId})});
      const value=await response.json();
      if(!response.ok)throw new Error(value.error||'Structure prediction failed.');
      try{sessionStorage.setItem('minpred_structure_view',JSON.stringify({job:bookmark.jobId,sample:sampleId,kind,data:value}));}catch{/* The viewer can retrieve the server-cached result if storage is unavailable. */}
      const fragment=new URLSearchParams({job:bookmark.jobId,token:bookmark.jobToken,sample:sampleId,kind,phase:active});
      window.location.assign(withBasePath('/structure')+'#'+fragment);
    }catch(e){setError(e instanceof Error?e.message:'Structure prediction failed.');}finally{setStructureBusy('');}
  }
  if(!loaded)return <div className="py-20 text-center"><Loader2 className="mx-auto h-7 w-7 animate-spin text-[var(--forest)]"/></div>;
  if(!data||!files.length)return <div className="mx-auto max-w-3xl py-16"><section className="surface p-10 text-center"><FlaskConical className="mx-auto h-8 w-8 text-[var(--mineral)]"/><h1 className="mt-5 font-display text-4xl font-semibold">No results available</h1><p className="mt-3 text-sm text-slate-600">{error||'Submit protein FASTA to create results.'}</p><Link href="/prediction" className="btn-primary mt-7">Start prediction</Link></section></div>;
  return <div className="space-y-6 py-5 sm:py-8">
    <header className="rounded-[1.75rem] border-l-4 border-[var(--mineral)] bg-[var(--forest-dark)] px-6 py-8 text-white"><p className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[.18em] text-[#d6dfdc]"><CheckCircle2 className="h-4 w-4"/>Prediction complete</p><h1 className="mt-2 font-display text-4xl font-semibold">MINpred results</h1><p className="mt-2 text-sm text-slate-300">Review phase predictions, class probabilities, EC annotations, and protein structures.</p></header>
    {error&&<div role="alert" className="rounded-xl border border-[#e4b8b4] bg-[#fff7f6] p-4 text-sm font-semibold text-[var(--danger)]">{error}</div>}
    <section className="grid gap-3 sm:grid-cols-2"><div className="surface p-5"><p className="eyebrow">Results ID</p><p className="mt-3 truncate font-mono text-xs font-bold">{data.jobId}</p></div><div className="surface p-5"><p className="eyebrow">Available</p><p className="mt-3 text-sm font-bold">{expiry?`Until ${expiry.toLocaleDateString()}`:'For 30 days'}</p></div></section>
    <nav className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">{files.map(file=>{const [label,title]=meta(file);return <button key={file} onClick={()=>setActive(file)} className={`rounded-xl border p-4 text-left ${active===file?'border-[var(--forest)] bg-[var(--forest)] text-white':'border-[var(--line)] bg-white'}`}><span className="text-[10px] font-black uppercase">{label}</span><span className="mt-1 block text-sm font-bold">{title}</span></button>})}</nav>
    <section className="surface overflow-hidden"><div className="flex flex-col gap-4 border-b p-5 sm:flex-row sm:items-center sm:justify-between"><div><p className="eyebrow">{meta(active)[0]}</p><h2 className="font-display text-2xl font-semibold">{meta(active)[1]}</h2></div><div className="flex flex-wrap gap-2"><button className="btn-secondary" onClick={()=>save(tsv(rows),active)}><Download className="h-4 w-4"/>TSV</button><button className="btn-secondary" onClick={()=>save(csv(rows),active.replace(/\.tsv$/,'.csv'),'text/csv')}><Download className="h-4 w-4"/>CSV</button><button className="btn-secondary" onClick={()=>save(JSON.stringify(rows,null,2),active.replace(/\.tsv$/,'.json'),'application/json')}><Download className="h-4 w-4"/>JSON</button></div></div><div className="overflow-x-auto"><table className="w-full min-w-[700px] text-left text-xs"><thead className="bg-[var(--mist)]"><tr>{rows[0]&&columns.map(h=><th key={h} className="max-w-32 px-3 py-3 font-semibold">{heading(h)}</th>)}{bookmark&&<th className="px-4 py-3">STRUCTURE</th>}{active.includes('Phase_4')&&<th className="px-4 py-3">ANNOTATION</th>}</tr></thead><tbody className="divide-y">{rows.map((row,i)=>{const id=idOf(row),ec=String(row.EC_Number??row.Prediction??'');return <tr key={i}>{columns.map(h=><td key={h} className="max-w-52 px-3 py-3 break-words" title={String(row[h]??'')}>{/sample|sequence.?id|accession/i.test(h)?String(row[h]??''):display(row[h])}</td>)}{bookmark&&<td className="whitespace-nowrap px-4 py-3"><button className="mr-3 font-bold text-[var(--forest)]"  disabled={Boolean(structureBusy)} onClick={()=>void openStructure('secondary',id)}>{structureBusy==='secondary:'+id?'Predicting secondary…':structures[id]?.secondary==='ready'?'View secondary':structures[id]?.secondary==='running'?'Predicting secondary…':'Predict secondary'}</button><button className="font-bold text-[var(--mineral)]"  disabled={Boolean(structureBusy)} onClick={()=>void openStructure('tertiary',id)}>{structureBusy==='tertiary:'+id?'Predicting 3D…':structures[id]?.tertiary==='ready'?'View 3D':structures[id]?.tertiary==='running'?'Predicting 3D…':'Predict 3D'}</button></td>}{active.includes('Phase_4')&&<td className="whitespace-nowrap px-4 py-3">{links(ec).map(([label,url])=><a key={label} href={url} target="_blank" rel="noreferrer" className="mr-3 inline-flex items-center gap-1 font-bold text-[var(--forest)]">{label}<ExternalLink className="h-3 w-3"/></a>)}</td>}</tr>})}</tbody></table></div></section>
  </div>;
}
