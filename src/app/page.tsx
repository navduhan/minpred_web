import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Database, Dna, LockKeyhole, ScanSearch } from 'lucide-react';
import mineralizationHero from '../../public/minpred-mineralization-hero.png';

const stages = [
  ['I', 'Enzyme screen', 'Enzyme or non-enzyme', 'DPC + NMBroto'],
  ['II', 'Mineralization screen', 'Nitrogen mineralization or other enzyme', 'DPC + NMBroto'],
  ['III', 'Enzyme family', 'One of ten mineralization-related classes', 'DPC + NMBroto'],
  ['IV', 'EC assignment', 'Class-specific Enzyme Commission label', 'CKSAAP'],
];

export default function Home() {
  return <div className="pb-16">
    <section className="reveal grid min-h-[620px] items-center gap-10 border-b border-[var(--line)] py-16 sm:py-20 lg:grid-cols-[.92fr_1.08fr] lg:py-24">
      <div><p className="eyebrow">Sequence-based nitrogen mineralization annotation</p><h1 className="mt-6 max-w-3xl font-display text-5xl font-semibold leading-[1.02] text-[var(--forest-dark)] sm:text-6xl lg:text-7xl">Predict enzymes involved in nitrogen mineralization.</h1><p className="mt-7 max-w-2xl text-lg leading-8 text-[var(--muted)]">MINpred screens protein and nucleotide sequences, identifies mineralization-related enzyme classes, and assigns class-specific EC labels through a four-phase workflow.</p><div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 border-y border-[var(--line)] py-4 text-xs font-semibold text-[var(--forest)]"><span>10 enzyme classes</span><span>69 named EC labels</span><span>Protein and nucleotide input</span></div><div className="mt-9 flex flex-wrap gap-3"><Link href="/prediction" className="btn-primary">Start prediction <ArrowRight className="h-4 w-4"/></Link><Link href="/help" className="btn-secondary">Methods and EC reference</Link></div></div>
      <figure className="relative"><div className="absolute inset-x-[12%] bottom-[8%] top-[10%] rounded-full bg-[#ebe8df] blur-3xl"/><Image src={mineralizationHero} alt="Protein sequence and enzyme structures connected to nitrogen mineralization in soil" className="relative h-auto w-full object-contain" priority/><figcaption className="relative mt-2 text-right text-[10px] uppercase tracking-[.16em] text-[var(--muted)]">Sequence · enzyme class · EC assignment</figcaption></figure>
    </section>

    <section id="workflow" className="scroll-mt-28 border-y border-[var(--line)] py-14"><div className="mb-12 flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><div><p className="eyebrow">Prediction pathway</p><h2 className="mt-2 font-display text-4xl font-semibold">One sequence, four decisions</h2></div><p className="max-w-md text-sm leading-6 text-[var(--muted)]">Phase IV is automatic. Each Phase III class prediction is sent to its corresponding EC model.</p></div><div className="relative grid gap-9 md:grid-cols-4"><div className="absolute left-0 right-0 top-5 hidden h-px bg-[#c8cac8] md:block"/>{stages.map(([number,title,detail,feature],index)=><article key={number} className="relative"><span className="relative z-10 grid h-10 w-10 place-items-center rounded-full border-4 border-[var(--canvas)] bg-[var(--forest)] font-mono text-xs font-bold text-white">{index+1}</span><p className="mt-7 font-mono text-[9px] uppercase tracking-[.18em] text-[var(--mineral)]">{feature}</p><h3 className="mt-2 text-lg font-extrabold">{title}</h3><p className="mt-2 text-sm leading-6 text-[var(--muted)]">{detail}</p></article>)}</div></section>

    <section className="py-16"><p className="eyebrow">Input and results</p><div className="mt-4 divide-y divide-[var(--line)] border-t border-[var(--line)]">{[[Dna,'Protein or nucleotide FASTA','TransDecoder.LongOrfs translates nucleotide records before prediction.'],[Database,'Protein accession retrieval','Retrieve sequences from UniProtKB or NCBI Protein.'],[LockKeyhole,'Private results','Return to a result with its token-protected link and export TSV, CSV, or JSON.'],[ScanSearch,'Protein structure tools','Examine predicted secondary structure and interactive three-dimensional models.']].map(([Icon,title,text])=><article key={String(title)} className="grid gap-4 py-6 sm:grid-cols-[48px_250px_1fr] sm:items-center"><Icon className="h-5 w-5 text-[var(--mineral)]"/><h3 className="text-base font-extrabold">{String(title)}</h3><p className="text-sm leading-6 text-[var(--muted)]">{String(text)}</p></article>)}</div></section>

    <section className="flex flex-col items-start justify-between gap-6 bg-[var(--forest-dark)] px-7 py-9 text-white sm:flex-row sm:items-center"><div><h2 className="font-display text-3xl font-semibold">Analyze a sequence</h2><p className="mt-2 text-sm text-[#d5dadc]">Protein and nucleotide FASTA are accepted.</p></div><Link href="/prediction" className="inline-flex items-center gap-2 bg-white px-5 py-3 text-sm font-extrabold text-[var(--forest-dark)]">Open MINpred <ArrowRight className="h-4 w-4"/></Link></section>
  </div>;
}
