'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

import { CheckCircle2, Download, ExternalLink, FlaskConical, Loader2 } from 'lucide-react';
import { withBasePath } from '@/lib/base-path';
import { expiresAt, readJobBookmark, type JobBookmark } from '@/lib/job-bookmark';


type Value=string|number|boolean|null; type Row=Record<string,Value>;
type Result={jobId?:string;status?:string;error?:string;updatedAt?:string;results?:Record<string,Row[]>};
const layoutPreview: Result = {
  jobId: 'minpred_example_result', status: 'completed', updatedAt: new Date().toISOString(),
  results: {
    'Phase_1_dnn_log.tsv': [{ SampleID: 'minpred_example_1', Prediction: 'Enzyme', Enzyme: 99.4, 'Non-enzyme': 0.6 }],
    'Phase_2_dnn_log.tsv': [{ SampleID: 'minpred_example_1', Prediction: 'Nitrogen Mineralization', 'Nitrogen Mineralization': 97.8, 'Non-nitrogen Mineralization': 2.2 }],
    'Phase_3_dnn_log.tsv': [{ SampleID: 'minpred_example_1', Prediction: 'Serine endopeptidases', Amidohydrolases: 0.4, Aminopeptidases: 0.8, 'Aspartic endopeptidases': 0.6, 'Cysteine endopeptidases': 0.9, Dipeptidases: 0.5, 'Dipeptidyl-peptidases': 0.7, Metalloendopeptidases: 0.8, Metallopeptidases: 0.9, 'Omega peptidases': 0.8, 'Serine endopeptidases': 93.6 }],
    'Phase_4_serine_log.tsv': [{ SampleID: 'minpred_example_1', Enzyme_Class: 'Serine endopeptidases', Prediction: '3.4.21.53', '3.4.21.-': 0.8, '3.4.21.53': 91.2, '3.4.21.62': 1.4, '3.4.21.88': 0.9, '3.4.21.89': 0.7, '3.4.21.92': 1.1, '3.4.21.102': 0.8, '3.4.21.105': 0.9, '3.4.21.107': 0.6, Others: 1.6 }],
    'minpred_predictions.tsv': [{ SampleID: 'minpred_example_1', Prediction: 'preview-only output' }],
  },
};
const display=(value:Value|undefined)=>{const text=String(value??'').replaceAll('_',' ');return text.charAt(0).toUpperCase()+text.slice(1);};
const phase4Names:Record<string,string>={amidohydrolases:'Amidohydrolases',aminopeptidases:'Aminopeptidases',aspartic:'Aspartic endopeptidases',cysteine:'Cysteine endopeptidases',dipeptidases:'Dipeptidases',dipeptidyl:'Dipeptidyl-peptidases',metalloendopeptidases:'Metalloendopeptidases',metallopeptidases:'Metallopeptidases',omega:'Omega peptidases',serine:'Serine endopeptidases'};
const outcomeHeading=(phase:string)=>phase.includes('Phase_1')?'Predicted category':phase.includes('Phase_2')?'Predicted mineralization status':phase.includes('Phase_3')?'Predicted enzyme class':phase.includes('Phase_4')?'Predicted EC':'Prediction';
const heading=(h:string,phase:string)=>{const names:Record<string,string>={SampleID:'Sequence ID',Sequence_ID:'Sequence ID',Enzyme_Class:'Enzyme class',EC_Number:'Predicted EC',Prediction:outcomeHeading(phase)};return names[h]||display(h.replace(/^Prob_/,''));};
const rank=(n:string)=>n.includes('Phase_1')?1:n.includes('Phase_2')?2:n.includes('Phase_3')?3:n.includes('Phase_4')?4:9;
const meta=(n:string)=>{if(n.includes('Phase_1'))return ['Phase 1','Enzyme screen'];if(n.includes('Phase_2'))return ['Phase 2','Mineralization screen'];if(n.includes('Phase_3'))return ['Phase 3','Enzyme class'];if(n.includes('Phase_4')){const key=Object.keys(phase4Names).find(value=>n.includes(`_${value}_`));return ['Phase 4',key?`${phase4Names[key]} EC probabilities`:'EC probabilities'];}return ['Output',n];};
const interpretation=(phase:string)=>phase.includes('Phase_1')?'Probabilities are shown for both enzyme and non-enzyme outcomes.':phase.includes('Phase_2')?'Probabilities are shown for nitrogen-mineralization and non-mineralization outcomes.':phase.includes('Phase_3')?'Probabilities are shown for all 10 nitrogen-mineralization enzyme classes.':phase.includes('Phase_4')?'Probabilities are shown for every EC label within this routed enzyme class. Compare enzyme-class probabilities in Phase 3.':'';
const metadataColumns=new Set(['SampleID','Sequence_ID','Enzyme_Class','Prediction','EC_Number']);
const phase3Abbreviations:Record<string,string>={Amidohydrolases:'AH',Aminopeptidases:'AP','Aspartic endopeptidases':'AEP','Cysteine endopeptidases':'CEP',Dipeptidases:'DP','Dipeptidyl-peptidases':'DPP',Metalloendopeptidases:'MEP',Metallopeptidases:'MP','Omega peptidases':'OP','Serine endopeptidases':'SEP'};
const topProbabilityRanks=(row:Row,columns:string[])=>columns
  .filter(column=>!metadataColumns.has(column)&&typeof row[column]==='number'&&Number.isFinite(row[column]))
  .sort((a,b)=>Number(row[b])-Number(row[a]))
  .slice(0,3)
  .reduce<Record<string,number>>((r,column,index)=>({...r,[column]:index+1}),{});
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
  useEffect(()=>{let cancelled=false;void Promise.resolve().then(async()=>{const preview=new URLSearchParams(window.location.search).get('preview')==='layout';const b=preview?{jobId:'minpred_example_result',jobToken:'layout-preview'}:readJobBookmark();if(!cancelled)setBookmark(b);try{let d=preview?layoutPreview:b?await fetchJob(b):JSON.parse(localStorage.getItem('minpred_last_results')||'null') as Result|null;if(b&&!preview&&d)while(!cancelled&&(d.status==='queued'||d.status==='running')){await new Promise(r=>setTimeout(r,3000));d=await fetchJob(b);}if(d?.status==='failed')throw new Error(d.error||'Prediction failed.');if(!cancelled&&d){const available=Object.keys(d.results||{}).filter(file=>rank(file)<9).sort((a,c)=>rank(a)-rank(c));const requested=new URLSearchParams(window.location.hash.slice(1)).get('phase')||'';setData(d);setActive(available.includes(requested)?requested:available[0]||'');if(!preview)localStorage.setItem('minpred_last_results',JSON.stringify(d));}}catch(e:unknown){if(!cancelled)setError(e instanceof Error?e.message:'Unable to load result.');}finally{if(!cancelled)setLoaded(true);}});return()=>{cancelled=true};},[]);
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
  const files=useMemo(()=>Object.keys(data?.results||{}).filter(file=>rank(file)<9).sort((a,b)=>rank(a)-rank(b)),[data]);const rows=data?.results?.[active]||[];const isPhase4=active.includes('Phase_4');const columns=Object.keys(rows[0]||{}).filter(column=>!(isPhase4&&column==='EC_Number'&&rows.every(row=>String(row.EC_Number??'')===String(row.Prediction??''))));const expiry=data?.updatedAt?expiresAt(data.updatedAt):null;
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
  return <div className="results-page space-y-6 py-5 sm:py-10">
    <header className="border-t-4 border-[var(--mineral)] pt-7 sm:grid sm:grid-cols-[1fr_auto] sm:items-end sm:gap-8"><div><p className="flex items-center gap-2 text-[13px] font-bold uppercase tracking-[.16em] text-[var(--forest)]"><CheckCircle2 className="h-4 w-4"/>Prediction complete</p><h1 className="results-title mt-3 text-4xl text-[var(--forest-dark)] sm:text-5xl">MINpred results</h1><p className="mt-3 max-w-2xl text-lg leading-7 text-[#596267]">Phase predictions, class probabilities, EC annotations, and structure analysis for the submitted sequences.</p></div><Link href="/prediction" className="btn-secondary mt-5 sm:mt-0">New prediction</Link></header>
    {error&&<div role="alert" className="rounded-xl border border-[#e4b8b4] bg-[#fff7f6] p-4 text-sm font-semibold text-[var(--danger)]">{error}</div>}
    <section className="grid gap-4 border-y border-[var(--line)] py-5 sm:grid-cols-[minmax(0,1fr)_auto]"><div><p className="text-xs font-bold uppercase tracking-[.14em] text-[var(--mineral)]">Results ID</p><p className="mt-1.5 truncate font-mono text-sm font-medium text-[var(--forest-dark)]">{data.jobId}</p></div><div className="sm:text-right"><p className="text-xs font-bold uppercase tracking-[.14em] text-[var(--mineral)]">Available</p><p className="mt-1.5 text-base font-semibold">{expiry?`Until ${expiry.toLocaleDateString()}`:'For 30 days'}</p></div></section>
    <nav aria-label="Result phases" className="flex overflow-x-auto border-b border-[var(--line)]">{files.map(file=>{const [label,title]=meta(file);return <button key={file} onClick={()=>setActive(file)} className={`min-w-44 border-b-[3px] px-4 py-5 text-left transition ${active===file?'border-[var(--mineral)] text-[var(--forest-dark)]':'border-transparent text-[#5b6468] hover:text-[var(--forest)]'}`}><span className="text-xs font-bold uppercase tracking-[.11em]">{label}</span><span className="mt-1.5 block text-base font-semibold">{title}</span></button>})}</nav>
    <section className="overflow-hidden rounded-[1.5rem] border border-[var(--line)] bg-white"><div className="flex flex-col gap-4 border-b border-[var(--line)] p-6 sm:flex-row sm:items-center sm:justify-between"><div><p className="eyebrow !text-xs">{meta(active)[0]}</p><h2 className="results-title mt-1 text-2xl">{meta(active)[1]}</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-[#596267]">{interpretation(active)}</p><div className="probability-key mt-4" aria-label="Probability rank key"><span className="probability-key-title">Probability values (%)</span><span><i className="probability-dot probability-dot-1"/>1 Highest</span><span><i className="probability-dot probability-dot-2"/>2 Second</span><span><i className="probability-dot probability-dot-3"/>3 Third</span></div></div><div className="flex flex-wrap gap-2"><button className="btn-secondary" onClick={()=>save(tsv(rows),active)}><Download className="h-4 w-4"/>TSV</button><button className="btn-secondary" onClick={()=>save(csv(rows),active.replace(/\.tsv$/,'.csv'),'text/csv')}><Download className="h-4 w-4"/>CSV</button><button className="btn-secondary" onClick={()=>save(JSON.stringify(rows,null,2),active.replace(/\.tsv$/,'.json'),'application/json')}><Download className="h-4 w-4"/>JSON</button></div></div><div className="results-scroll overflow-x-auto"><table className="w-full min-w-[700px] text-left text-[15px]"><thead className="border-b border-[var(--line)] bg-[#f6f5f2]"><tr>{rows[0]&&columns.map(h=>{const abbreviation=active.includes('Phase_3')?phase3Abbreviations[h]:'';return <th key={h} className="max-w-32 px-4 py-3.5 text-[13px] font-bold tracking-[.01em] text-[var(--forest-dark)]" title={abbreviation?h:undefined}>{abbreviation?<abbr className="no-underline" aria-label={h}>{abbreviation}</abbr>:heading(h,active)}</th>})}{bookmark&&<th className="px-4 py-3.5 text-[13px] font-bold tracking-[.01em] text-[var(--forest-dark)]">Structure</th>}{isPhase4&&<th className="px-4 py-3.5 text-[13px] font-bold tracking-[.01em] text-[var(--forest-dark)]">Annotation</th>}</tr></thead><tbody className="divide-y divide-[var(--line)]">{rows.map((row,i)=>{const id=idOf(row),ec=String(row.EC_Number??row.Prediction??''),probabilityRanks=topProbabilityRanks(row,columns);return <tr key={i} className="hover:bg-[#faf9f6]">{columns.map(h=>{const probabilityRank=probabilityRanks[h];return <td key={h} className={`max-w-52 px-4 py-4 break-words font-medium ${probabilityRank?`probability-rank probability-rank-${probabilityRank}`:''}`} title={String(row[h]??'')}>{probabilityRank&&<span className="probability-rank-number" aria-label={`Rank ${probabilityRank}`}>{probabilityRank}</span>}<span>{/sample|sequence.?id|accession/i.test(h)?String(row[h]??''):display(row[h])}</span></td>})}{bookmark&&<td className="whitespace-nowrap px-4 py-4"><button className="mr-3 font-bold text-[var(--forest)]"  disabled={Boolean(structureBusy)} onClick={()=>void openStructure('secondary',id)}>{structureBusy==='secondary:'+id?'Predicting secondary…':structures[id]?.secondary==='ready'?'View secondary':structures[id]?.secondary==='running'?'Predicting secondary…':'Predict secondary'}</button><button className="font-bold text-[var(--mineral)]"  disabled={Boolean(structureBusy)} onClick={()=>void openStructure('tertiary',id)}>{structureBusy==='tertiary:'+id?'Predicting 3D…':structures[id]?.tertiary==='ready'?'View 3D':structures[id]?.tertiary==='running'?'Predicting 3D…':'Predict 3D'}</button></td>}{isPhase4&&<td className="whitespace-nowrap px-4 py-4">{links(ec).map(([label,url])=><a key={label} href={url} target="_blank" rel="noreferrer" className="mr-3 inline-flex items-center gap-1 font-bold text-[var(--forest)]">{label}<ExternalLink className="h-3 w-3"/></a>)}</td>}</tr>})}</tbody></table></div>{active.includes('Phase_3')&&<div className="border-t border-[var(--line)] bg-[#faf9f6] px-6 py-5"><p className="text-xs font-extrabold uppercase tracking-[.1em] text-[var(--forest-dark)]">Enzyme-class abbreviations</p><dl className="mt-3 grid gap-x-7 gap-y-2 text-sm sm:grid-cols-2 lg:grid-cols-5">{Object.entries(phase3Abbreviations).map(([name,abbreviation])=><div key={name} className="grid grid-cols-[2.5rem_1fr] gap-2"><dt className="font-extrabold text-[var(--mineral)]">{abbreviation}</dt><dd className="text-[#596267]">{name}</dd></div>)}</dl></div>}</section>
  </div>;
}
