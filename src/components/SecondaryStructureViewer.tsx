'use client';
import { useRef } from 'react';

type Secondary = { amino_acids: string; prediction: string; confidence: string };
type Segment = { state: string; start: number; end: number };

function segments(states: string): Segment[] {
  const result: Segment[] = [];
  for (let i = 0; i < states.length; i += 1) {
    const last = result.at(-1);
    if (last?.state === states[i]) last.end = i;
    else result.push({ state: states[i], start: i, end: i });
  }
  return result;
}

export default function SecondaryStructureViewer({ data }: { data: Secondary }) {
  const figure = useRef<HTMLDivElement>(null);
  function download(format: 'svg' | 'png') {
    const panels = Array.from(figure.current?.querySelectorAll('svg') || []);
    const content = panels.map((panel, i) => `<g transform="translate(0,${i * 155})">${panel.innerHTML}</g>`).join('');
    const height = panels.length * 155 + 40;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="940" height="${height}" viewBox="0 0 940 ${height}"><rect width="100%" height="100%" fill="white"/>${content}<text x="66" y="${height - 12}" font-family="Arial" font-size="12">H: helix · E: strand · C: coil · Confidence: 0 (low)–9 (high)</text></svg>`;
    const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
    const save = (href: string) => { const a = document.createElement('a'); a.href = href; a.download = `secondary-structure.${format}`; a.click(); };
    if (format === 'svg') { save(url); setTimeout(() => URL.revokeObjectURL(url), 1000); return; }
    const image = new Image();
    image.onload = () => { const canvas = document.createElement('canvas'); canvas.width = 1880; canvas.height = height * 2; const context = canvas.getContext('2d'); context?.drawImage(image, 0, 0, canvas.width, canvas.height); save(canvas.toDataURL('image/png')); URL.revokeObjectURL(url); };
    image.onerror = () => URL.revokeObjectURL(url);
    image.src = url;
  }
  const width = 940, left = 66, cell = 16, blockSize = 50;
  const blocks = Math.ceil(data.amino_acids.length / blockSize);
  return <div className="mt-5 space-y-4" aria-label="S4PRED secondary-structure cartoon">
    <div className="flex flex-wrap items-center gap-3 text-sm"><button className="btn-secondary" onClick={() => download('svg')}>Download SVG</button><button className="btn-secondary" onClick={() => download('png')}>Download PNG</button><span>Conf: confidence · Cart: structure · Pred: assignment · AA: sequence</span></div>
    <div ref={figure}>
    {Array.from({ length: blocks }, (_, block) => {
      const start = block * blockSize;
      const aa = data.amino_acids.slice(start, start + blockSize);
      const pred = data.prediction.slice(start, start + blockSize);
      const conf = data.confidence.slice(start, start + blockSize);
      return <div key={start} className="overflow-x-auto border-b border-[var(--line)] bg-white py-3">
        <svg viewBox={`0 0 ${width} 155`} className="min-w-[760px]" role="img" aria-label={`Residues ${start + 1} to ${start + aa.length}`}>
          <g fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace" fontSize="11" fill="#334155">
            <text x="8" y="37" fontWeight="700">Conf</text><text x="8" y="69" fontWeight="700">Cart</text><text x="8" y="101" fontWeight="700">Pred</text><text x="8" y="127" fontWeight="700">AA</text>
            {Array.from(conf).map((value,i)=>{const score=Number(value)||0;return <rect key={i} x={left+i*cell} y={42-score*3} width={cell-2} height={Math.max(1,score*3)} rx="1" fill={`hsl(207 62% ${78-score*4}%)`}><title>Residue {start+i+1}: confidence {score}</title></rect>})}
            {segments(pred).map((segment,i)=>{const x=left+segment.start*cell,w=(segment.end-segment.start+1)*cell;return segment.state==='H'?<rect key={i} x={x} y="57" width={w-1} height="15" rx="7" fill="#cc3333"><title>Helix</title></rect>:segment.state==='E'?<polygon key={i} points={`${x},57 ${x+w-9},57 ${x+w-1},64.5 ${x+w-9},72 ${x},72`} fill="#238443"><title>Strand</title></polygon>:<line key={i} x1={x} x2={x+w} y1="64.5" y2="64.5" stroke="#64748b" strokeWidth="4"><title>Coil</title></line>})}
            {Array.from(pred).map((value,i)=><text key={i} x={left+i*cell+3} y="101" fontWeight="700">{value}</text>)}
            {Array.from(aa).map((value,i)=><text key={i} x={left+i*cell+3} y="127" fontWeight="700">{value}<title>Residue {start+i+1}: {value}, {pred[i]}, confidence {conf[i]}</title></text>)}
            {Array.from(aa).map((_,i)=>(i===0||(start+i+1)%10===0)?<g key={i}><line x1={left+i*cell+6} x2={left+i*cell+6} y1="132" y2="137" stroke="#94a3b8"/><text x={left+i*cell-1} y="150" fontSize="9">{start+i+1}</text></g>:null)}
          </g>
        </svg>
      </div>;
    })}
    </div>
    <div className="flex flex-wrap gap-5 text-sm text-slate-700"><span>Helix (H)</span><span>Strand (E)</span><span>Coil (C)</span><span>Confidence: 0 (low)–9 (high); hover over a residue to see its score.</span></div>
  </div>;
}
