import Link from 'next/link';
import { ArrowRight, Database, Dna, LockKeyhole, ScanSearch } from 'lucide-react';

const stages = [
  ['I', 'Enzyme screen', 'Enzyme or non-enzyme', 'DPC + NMBroto'],
  ['II', 'Mineralization screen', 'Nitrogen mineralization or other enzyme', 'DPC + NMBroto'],
  ['III', 'Enzyme family', 'One of ten mineralization-related classes', 'DPC + NMBroto'],
  ['IV', 'EC assignment', 'Class-specific Enzyme Commission label', 'CKSAAP'],
];

export default function Home() {
  return <div className="pb-16">
    <section className="reveal relative min-h-[650px] overflow-hidden py-16 sm:py-24">
      <div className="absolute right-[-110px] top-12 h-[520px] w-[520px] rounded-full border-[90px] border-[#dfeae5]" />
      <div className="absolute right-[120px] top-[255px] h-3 w-3 rounded-full bg-[var(--mineral)] shadow-[0_0_0_16px_rgba(22,119,210,.12)]" />
      <div className="relative grid gap-14 lg:grid-cols-[90px_1fr_340px] lg:items-center">
        <p className="hidden -rotate-90 whitespace-nowrap font-mono text-[10px] uppercase tracking-[.25em] text-[var(--forest)] lg:block">MINpred · version 1.0 · KAABiL Lab</p>
        <div><p className="eyebrow">Nitrogen mineralization enzyme prediction</p><h1 className="mt-6 max-w-4xl font-display text-6xl font-semibold leading-[.96] text-[var(--forest-dark)] sm:text-7xl lg:text-8xl">From protein sequence<br/><span className="text-[var(--mineral)]">to EC annotation.</span></h1><p className="mt-8 max-w-2xl text-lg leading-8 text-[var(--muted)]">MINpred applies four deep-learning models to screen proteins, identify mineralization-related enzyme classes, and assign EC numbers.</p><div className="mt-10 flex flex-wrap gap-3"><Link href="/prediction" className="btn-primary">Start prediction <ArrowRight className="h-4 w-4"/></Link><Link href="/help" className="btn-secondary">Methods and usage</Link></div></div>
        <div className="relative hidden h-[420px] lg:block"><div className="absolute left-1/2 top-0 h-full w-px bg-[#a9c8be]" />{['DPC','NMBroto','CKSAAP'].map((label,index)=><div key={label} className="absolute left-1/2 flex -translate-x-1/2 items-center gap-4" style={{top:`${65+index*125}px`}}><span className="h-4 w-4 rounded-full border-4 border-white bg-[var(--mineral)] shadow-[0_0_0_1px_#c66a3d]"/><span className="absolute left-8 whitespace-nowrap font-mono text-[10px] font-bold tracking-[.16em] text-[var(--forest)]">{label}</span></div>)}<span className="absolute bottom-1 left-1/2 -translate-x-1/2 bg-[var(--forest-dark)] px-3 py-2 font-mono text-xs font-bold text-white">EC</span></div>
      </div>
    </section>

    <section id="workflow" className="scroll-mt-28 border-y border-[var(--line)] py-14"><div className="mb-12 flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><div><p className="eyebrow">Prediction pathway</p><h2 className="mt-2 font-display text-4xl font-semibold">One sequence, four decisions</h2></div><p className="max-w-md text-sm leading-6 text-[var(--muted)]">Phase IV is automatic. Each Phase III class prediction is sent to its corresponding EC model.</p></div><div className="relative grid gap-9 md:grid-cols-4"><div className="absolute left-0 right-0 top-5 hidden h-px bg-[#a9c8be] md:block"/>{stages.map(([number,title,detail,feature],index)=><article key={number} className="relative"><span className="relative z-10 grid h-10 w-10 place-items-center rounded-full border-4 border-[var(--canvas)] bg-[var(--forest)] font-mono text-xs font-bold text-white">{index+1}</span><p className="mt-7 font-mono text-[9px] uppercase tracking-[.18em] text-[var(--mineral)]">{feature}</p><h3 className="mt-2 text-lg font-extrabold">{title}</h3><p className="mt-2 text-sm leading-6 text-[var(--muted)]">{detail}</p></article>)}</div></section>

    <section className="py-16"><p className="eyebrow">Input and results</p><div className="mt-4 divide-y divide-[var(--line)] border-t border-[var(--line)]">{[[Dna,'Protein or nucleotide FASTA','TransDecoder.LongOrfs translates nucleotide records before prediction.'],[Database,'Protein accession retrieval','Retrieve sequences from UniProtKB or NCBI Protein.'],[LockKeyhole,'Private results','Return to a result with its token-protected link and export TSV, CSV, or JSON.'],[ScanSearch,'Protein structure tools','Examine predicted secondary structure and interactive three-dimensional models.']].map(([Icon,title,text])=><article key={String(title)} className="grid gap-4 py-6 sm:grid-cols-[48px_250px_1fr] sm:items-center"><Icon className="h-5 w-5 text-[var(--mineral)]"/><h3 className="text-base font-extrabold">{String(title)}</h3><p className="text-sm leading-6 text-[var(--muted)]">{String(text)}</p></article>)}</div></section>

    <section className="flex flex-col items-start justify-between gap-6 bg-[var(--forest-dark)] px-7 py-9 text-white sm:flex-row sm:items-center"><div><h2 className="font-display text-3xl font-semibold">Analyze a sequence</h2><p className="mt-2 text-sm text-[#b9cde1]">Protein and nucleotide FASTA are accepted.</p></div><Link href="/prediction" className="inline-flex items-center gap-2 bg-white px-5 py-3 text-sm font-extrabold text-[var(--forest-dark)]">Open MINpred <ArrowRight className="h-4 w-4"/></Link></section>
  </div>;
}
