'use client';

import { useEffect, useRef, useState } from 'react';
import type { Stage, StructureComponent } from 'ngl';

const representations = ['cartoon','backbone','ball+stick','contact','helixorient','hyperball','label','licorice','line','point','ribbon','rocket','rope','spacefill','surface','trace','tube'] as const;
const colors = ['atomindex','bfactor','chainid','chainindex','chainname','densityfit','electrostatic','element','entityindex','entitytype','geoquality','hydrophobicity','modelindex','moleculetype','occupancy','random','residueindex','resname','sstruc','uniform','value','volume'];
const labels: Record<string,string> = {atomindex:'Atom index',bfactor:'B-factor / stored confidence',chainid:'Chain ID',chainindex:'Chain index',chainname:'Chain name',densityfit:'Density fit',entityindex:'Entity index',entitytype:'Entity type',geoquality:'Geometric quality',modelindex:'Model index',moleculetype:'Molecule type',residueindex:'Residue index',resname:'Residue name',sstruc:'Secondary structure',helixorient:'Helix orientation','ball+stick':'Ball + stick'};
function download(blob:Blob,name:string){const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}

export default function StructureViewer({ pdb, sequence='', sampleId='structure' }: { pdb: string; sequence?:string; sampleId?:string }) {
  const container = useRef<HTMLDivElement>(null);
  const stageRef=useRef<Stage|null>(null), componentRef=useRef<StructureComponent|null>(null);
  const [ready,setReady]=useState(false),[error,setError]=useState(''),[saving,setSaving]=useState(false);
  const [representation,setRepresentation]=useState<typeof representations[number]>('cartoon'),[color,setColor]=useState('atomindex'),[background,setBackground]=useState('#f0f0f0'),[selected,setSelected]=useState<string[]>([]);
  const matches=['CXXCH','CXXC'].map(name=>({name,ranges:Array.from(sequence.matchAll(new RegExp(name.replaceAll('X','[A-Z]'),'g')),m=>({start:m.index+1,end:m.index+m[0].length}))}));
  const selection=matches.filter(m=>selected.includes(m.name)).flatMap(m=>m.ranges.map(r=>`${r.start}-${r.end}`)).join(' or ');
  const filename=sampleId.replace(/[^a-zA-Z0-9_.-]/g,'_');
  useEffect(() => {
    if (!container.current || !pdb) return;
    let disposed = false;
    let stage: import('ngl').Stage | undefined;
    void import('ngl').then((NGL) => {
      if (disposed || !container.current) return;
      const currentStage = new NGL.Stage(container.current, { backgroundColor: '#f0f0f0' });
      stage = currentStage;
      stageRef.current=currentStage;
      return currentStage.loadFile(new Blob([pdb], { type: 'text/plain' }), { ext: 'pdb' }).then((component) => {
        if (disposed || !component) return;
        componentRef.current=component as StructureComponent;
        setReady(true);
        component.autoView();
      });
    }).catch(()=>{if(!disposed)setError('Unable to display this structure. Check WebGL support or download the PDB file.');});
    const resize = () => stage?.handleResize(); window.addEventListener('resize', resize);
    const observer=new ResizeObserver(resize);observer.observe(container.current);
    return () => { disposed = true; observer.disconnect(); window.removeEventListener('resize', resize); stage?.dispose(); stageRef.current=null;componentRef.current=null; };
  }, [pdb]);
  useEffect(()=>{if(!ready||!componentRef.current)return;componentRef.current.removeAllRepresentations();componentRef.current.addRepresentation(representation,{colorScheme:color});if(selection)componentRef.current.addRepresentation('ball+stick',{sele:selection,color:'#00a6d6',aspectRatio:2});},[ready,representation,color,selection]);
  useEffect(()=>{if(ready)stageRef.current?.setParameters({backgroundColor:background});},[ready,background]);
  useEffect(()=>{if(ready&&selection)componentRef.current?.autoView(selection);},[ready,selection]);
  async function exportImage(format:'png'|'svg'){
    if(!stageRef.current)return;setSaving(true);setError('');
    try{const blob=await stageRef.current.makeImage({factor:2,antialias:true,transparent:false});
      if(format==='png')download(blob,`${filename}.png`);
      else{const data=await new Promise<string>((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(String(r.result));r.onerror=reject;r.readAsDataURL(blob);});const bitmap=await createImageBitmap(blob);download(new Blob([`<svg xmlns="http://www.w3.org/2000/svg" width="${bitmap.width}" height="${bitmap.height}"><image href="${data}" width="100%" height="100%"/></svg>`],{type:'image/svg+xml'}),`${filename}.svg`);bitmap.close();}
    }catch{setError('Image export failed. Please try again.');}finally{setSaving(false);}
  }
  return <div className="space-y-4">
    <div className="grid gap-4 sm:grid-cols-3">
      <label className="text-sm font-semibold">Representation<select className="field mt-1" value={representation} disabled={!ready} onChange={e=>setRepresentation(e.target.value as typeof representation)}>{representations.map(v=><option key={v} value={v}>{labels[v]||v}</option>)}</select></label>
      <label className="text-sm font-semibold">Colour scheme<select className="field mt-1" value={color} disabled={!ready} onChange={e=>setColor(e.target.value)}>{colors.map(v=><option key={v} value={v} disabled={['densityfit','geoquality','value','volume'].includes(v)}>{labels[v]||v}{['densityfit','geoquality','value','volume'].includes(v)?' (requires additional data)':''}</option>)}</select></label>
      <label className="text-sm font-semibold">Background<select className="field mt-1" value={background} onChange={e=>setBackground(e.target.value)}>{[['#f0f0f0','Very light grey'],['#ddd','Light grey'],['#ffffff','White'],['#000000','Black'],['#e0e0e0','Light silver']].map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></label>
    </div>
    <div className="flex flex-wrap gap-2"><button className="btn-secondary" onClick={()=>download(new Blob([pdb],{type:'chemical/x-pdb'}),`${filename}.pdb`)}>Download PDB</button><button className="btn-secondary" disabled={!ready||saving} onClick={()=>void exportImage('png')}>Save PNG</button><button className="btn-secondary" disabled={!ready||saving} onClick={()=>void exportImage('svg')}>Save SVG</button><button className="btn-secondary" disabled={!ready} onClick={()=>stageRef.current?.autoView()}>Reset view</button></div>
    <p className="text-xs text-slate-600">Drag to rotate; scroll or pinch to zoom. SVG export contains the rendered image, as in the original viewer.</p>
    {sequence&&<fieldset className="rounded border border-[var(--line)] p-3"><legend className="px-1 text-sm font-semibold">Highlight sequence motifs</legend><div className="flex flex-wrap gap-5">{matches.map(m=><label key={m.name} className="text-sm"><input type="checkbox" className="mr-2" disabled={!m.ranges.length} checked={selected.includes(m.name)} onChange={e=>setSelected(prev=>e.target.checked?[...prev,m.name]:prev.filter(x=>x!==m.name))}/>{m.name}: {m.ranges.length?m.ranges.map(r=>`${r.start}-${r.end}`).join(', '):'No matches'}</label>)}</div><p className="mt-2 text-xs text-slate-600">Sequence-pattern matches appear in cyan; they do not establish cofactor binding.</p></fieldset>}
    {error&&<p role="alert" className="text-sm text-[var(--danger)]">{error}</p>}
    {!ready&&!error&&<p role="status">Loading 3D structure…</p>}
    <div ref={container} className="h-[600px] w-full rounded-lg border border-[var(--line)]" aria-label="Interactive three-dimensional protein structure" />
  </div>;
}
