import Link from 'next/link';
import type { ReactNode } from 'react';
import { ArrowRight, BookOpen, CheckCircle2, CircleAlert } from 'lucide-react';

const contents = [
  ['quick-start', 'Quick start'], ['input', 'Sequence input'], ['phases', 'Prediction phases'],
  ['routing', 'Phase IV routing'], ['classes', 'Classes and EC labels'], ['results', 'Reading results'],
  ['structures', 'Protein structures'], ['example', 'Worked example'], ['standalone', 'Standalone usage'],
  ['troubleshooting', 'Troubleshooting'], ['privacy', 'Privacy and retention'],
  ['limitations', 'Interpretation and limitations'], ['citation', 'Citation and support'],
] as const;

const phases = [
  ['Phase I', 'Enzyme screen', 'Classifies every submitted protein as Enzyme or Non-enzyme. Only proteins predicted as enzymes continue.'],
  ['Phase II', 'Mineralization screen', 'Classifies qualifying enzymes as Nitrogen Mineralization or Non-nitrogen Mineralization. Only the nitrogen-mineralization group continues.'],
  ['Phase III', 'Enzyme class', 'Assigns each qualifying protein to one of the ten enzyme classes documented below.'],
  ['Phase IV', 'EC assignment', 'Uses the Phase III class to select a class-specific model and predict an EC label.'],
] as const;

const enzymeClasses = [
  { abbreviation: 'AH', name: 'Amidohydrolases', description: 'Hydrolyze non-peptide carbon–nitrogen bonds, including linear amides.', ec: ['3.5.1.1','3.5.1.2','3.5.1.4','3.5.1.5','3.5.1.11','3.5.1.28','3.5.1.68'] },
  { abbreviation: 'AP', name: 'Aminopeptidases', description: 'Remove amino-acid residues from the amino terminus of peptides or proteins.', ec: ['3.4.11.-','3.4.11.1','3.4.11.2','3.4.11.4','3.4.11.5','3.4.11.6','3.4.11.9','3.4.11.10','3.4.11.18','3.4.11.19','3.4.11.24','Others'] },
  { abbreviation: 'AEP', name: 'Aspartic endopeptidases', description: 'Hydrolyze internal peptide bonds through an aspartate-dependent catalytic mechanism.', ec: ['3.4.23.-','3.4.23.12','3.4.23.21','3.4.23.24','3.4.23.36','3.4.23.43','3.4.23.51','Others'] },
  { abbreviation: 'CEP', name: 'Cysteine endopeptidases', description: 'Use a catalytic cysteine to hydrolyze internal peptide bonds.', ec: ['3.4.22.-','3.4.22.8','3.4.22.10','3.4.22.37','3.4.22.40','3.4.22.49','3.4.22.68','3.4.22.70','3.4.22.71','Others'] },
  { abbreviation: 'DP', name: 'Dipeptidases', description: 'Hydrolyze dipeptides into their component amino acids.', ec: ['3.4.13.-','3.4.13.9','3.4.13.19','3.4.13.20','3.4.13.21','3.4.13.22','Others'] },
  { abbreviation: 'DPP', name: 'Dipeptidyl-peptidases', description: 'Release a dipeptide from the amino terminus of a peptide or protein.', ec: ['3.4.14.-','3.4.14.1','3.4.14.5','3.4.14.10','3.4.14.11','3.4.14.12','Others'] },
  { abbreviation: 'MEP', name: 'Metalloendopeptidases', description: 'Use a metal ion to catalyze hydrolysis of internal peptide bonds.', ec: ['3.4.24.-','3.4.24.3','3.4.24.13','3.4.24.39','3.4.24.40','3.4.24.55','3.4.24.64','3.4.24.75','3.4.24.84','Others'] },
  { abbreviation: 'MP', name: 'Metallopeptidases', description: 'Metal-dependent exopeptidases represented by the EC 3.4.17 group.', ec: ['3.4.17.-','3.4.17.11','3.4.17.13','3.4.17.14','3.4.17.18','3.4.17.19','3.4.17.21','3.4.17.24','Others'] },
  { abbreviation: 'OP', name: 'Omega peptidases', description: 'Hydrolyze specialized terminal or isopeptide linkages in the EC 3.4.19 group.', ec: ['3.4.19.-','3.4.19.1','3.4.19.2','3.4.19.9','3.4.19.11','3.4.19.12','Others'] },
  { abbreviation: 'SEP', name: 'Serine endopeptidases', description: 'Use a catalytic serine to hydrolyze internal peptide bonds.', ec: ['3.4.21.-','3.4.21.53','3.4.21.62','3.4.21.88','3.4.21.89','3.4.21.92','3.4.21.102','3.4.21.105','3.4.21.107','Others'] },
] as const;

function Section({id, number, title, children}:{id:string; number:string; title:string; children:ReactNode}) {
  return <section id={id} className="scroll-mt-28 border-b border-[var(--line)] px-6 py-8 last:border-b-0 sm:px-9 sm:py-10">
    <header className="mb-6 grid grid-cols-[2.5rem_1fr] items-start gap-3"><span className="pt-1 text-xs font-black tracking-[.12em] text-[var(--mineral)]">{number}</span><h2 className="text-2xl font-bold tracking-[-.018em] text-[var(--forest-dark)] sm:text-3xl">{title}</h2></header>
    <div className="ml-[3.25rem] space-y-4 text-[15px] leading-7 text-[#596267]">{children}</div>
  </section>;
}

function Code({children}:{children:ReactNode}) { return <pre className="overflow-x-auto rounded-xl bg-[var(--forest-dark)] p-4 font-mono text-[13px] leading-6 text-white">{children}</pre>; }

export default function Help() {
  return <div className="py-6 sm:py-10">
    <header className="border-y border-[var(--line)] py-9 sm:grid sm:grid-cols-[1fr_270px] sm:items-end sm:gap-10">
      <div><p className="eyebrow flex items-center gap-2"><BookOpen className="h-4 w-4"/> User guide</p><h1 className="mt-4 max-w-3xl text-4xl font-bold tracking-[-.025em] text-[var(--forest-dark)] sm:text-5xl">Using MINpred</h1><p className="mt-4 max-w-3xl text-lg leading-8 text-[var(--muted)]">Prepare protein or nucleotide sequences, choose the appropriate phase, and interpret mineralization-enzyme, class, EC, and structure results.</p></div>
      <div className="mt-7 border-l-2 border-[var(--mineral)] pl-5 text-sm leading-6 text-[var(--muted)] sm:mt-0"><strong className="block text-[var(--forest-dark)]">Need a first run?</strong>Use the mixed example with Phase IV and automatic class selection.</div>
    </header>

    <div className="mt-8 grid items-start gap-8 lg:grid-cols-[230px_minmax(0,1fr)]">
      <aside className="lg:sticky lg:top-24"><nav aria-label="Help contents"><p className="eyebrow">On this page</p><ol className="mt-4 border-l border-[var(--line)] text-sm leading-5">{contents.map(([id,label],index)=><li key={id}><a href={`#${id}`} className="grid grid-cols-[1.8rem_1fr] border-l-2 border-transparent px-4 py-2 text-[var(--muted)] transition hover:border-[var(--mineral)] hover:bg-white hover:text-[var(--forest-dark)]"><span className="text-[11px] font-bold text-[var(--mineral)]">{String(index+1).padStart(2,'0')}</span><span>{label}</span></a></li>)}</ol></nav><Link href="/prediction" className="btn-primary mt-6 w-full">Start prediction <ArrowRight className="h-4 w-4"/></Link></aside>

      <main className="overflow-hidden rounded-[1.5rem] border border-[var(--line)] bg-white shadow-[0_20px_55px_rgba(44,49,52,.07)]">
        <Section id="quick-start" number="01" title="Quick start">
          <ol className="list-decimal space-y-2 pl-5"><li>Open <Link className="font-semibold underline underline-offset-4" href="/prediction">Prediction</Link> and choose Protein or Nucleotide.</li><li>Paste FASTA, upload a file, or retrieve protein accessions. Use a supplied example to test the interface.</li><li>Select the last phase you need. Choose Phase IV with Determine automatically for the complete hierarchy.</li><li>Complete the verification and start the prediction. Processing time depends on input size, the compute queue, and structure services.</li><li>Keep the complete private results link and download the tables you need.</li></ol>
        </Section>

        <Section id="input" number="02" title="Sequence input">
          <h3 className="font-bold text-[var(--forest-dark)]">Protein FASTA</h3><p>Each record begins with <code>&gt;</code> and a unique identifier, followed by an amino-acid sequence. The form accepts the 20 standard amino acids and X in upper or lower case. X residues are removed before prediction. Do not include alignment gaps, residue numbers, or terminal stop symbols.</p>
          <h3 className="font-bold text-[var(--forest-dark)]">Nucleotide FASTA</h3><p>Select Nucleotide for DNA, RNA, or transcript FASTA containing A, C, G, T, U, or N. TransDecoder.LongOrfs identifies open reading frames and writes <code className="rounded bg-[var(--mist)] px-1.5 py-0.5">translated_proteins.fasta</code> before MINpred runs. Results therefore use predicted-protein identifiers. One nucleotide record can yield several proteins or no qualifying ORF.</p>
          <h3 className="font-bold text-[var(--forest-dark)]">Accessions and examples</h3><p>Accession retrieval accepts protein identifiers from UniProtKB or NCBI Protein. Multiple identifiers can be separated by spaces, commas, or new lines. Review the returned FASTA before submission. The mixed example contains one representative sequence for each of the ten Phase IV enzyme classes; individual class examples are also available.</p>
          <h3 className="font-bold text-[var(--forest-dark)]">Default request limits</h3><dl className="grid grid-cols-[1fr_auto] gap-x-6 gap-y-2 rounded-xl bg-[var(--mist)] p-4 text-sm"><dt>Sequences per request</dt><dd className="font-semibold text-[var(--forest-dark)]">10,000</dd><dt>Total residues or bases</dt><dd className="font-semibold text-[var(--forest-dark)]">50,000,000</dd><dt>Residues or bases per sequence</dt><dd className="font-semibold text-[var(--forest-dark)]">5,000</dd><dt>Protein accessions per lookup</dt><dd className="font-semibold text-[var(--forest-dark)]">100</dd><dt>Active jobs per client</dt><dd className="font-semibold text-[var(--forest-dark)]">2</dd></dl><p>Administrators can change these limits. For repeated analyses or large datasets, use the <Link className="font-semibold underline underline-offset-4" href="/download">standalone tool</Link>.</p>
        </Section>

        <Section id="phases" number="03" title="The four prediction phases">
          <p>Selecting a phase runs the preceding filters and stops at that phase. A downstream table contains only proteins that passed the required earlier filters.</p><div className="divide-y divide-[var(--line)] border-y border-[var(--line)]">{phases.map(([phase,title,text],index)=><article key={phase} className="grid gap-2 py-5 sm:grid-cols-[2.5rem_185px_1fr]"><span className="grid h-8 w-8 place-items-center rounded-full bg-[var(--forest)] text-xs font-bold text-white">{index+1}</span><div><p className="text-[11px] font-black uppercase tracking-[.1em] text-[var(--mineral)]">{phase}</p><h3 className="font-bold text-[var(--forest-dark)]">{title}</h3></div><p>{text}</p></article>)}</div><p>A Phase IV request does not guarantee a Phase IV row for every input sequence. If no proteins pass a filter, later phases may have no result table.</p>
        </Section>

        <Section id="routing" number="04" title="Phase IV routing">
          <div className="grid gap-5 md:grid-cols-2"><article className="rounded-xl border border-[var(--line)] p-5"><h3 className="font-bold text-[var(--forest-dark)]">Determine automatically</h3><p className="mt-2">Each sequence follows its own Phase III prediction to the corresponding Phase IV EC model. This is the appropriate choice for mixed or unknown inputs.</p></article><article className="rounded-xl border border-[var(--line)] p-5"><h3 className="font-bold text-[var(--forest-dark)]">Use a specific class</h3><p className="mt-2">MINpred applies the selected Phase IV model only to sequences assigned to that class in Phase III. It does not bypass earlier filters or force unmatched sequences into the class.</p></article></div><p>If no sequence matches the selected class, the job can complete without a Phase IV table. Use automatic routing unless the intended class is already known.</p>
        </Section>

        <Section id="classes" number="05" title="Ten classes and their EC outputs">
          <p>Phase III selects one enzyme class. Phase IV predicts among the EC labels provided by that class-specific model. MINpred covers 69 specific EC numbers plus wildcard and <code>Others</code> outputs; it is not a predictor for every EC number.</p>
          <div className="divide-y divide-[var(--line)] border-y border-[var(--line)]">{enzymeClasses.map(group=><article key={group.name} className="grid gap-4 py-5 xl:grid-cols-[3rem_215px_1fr]"><span className="font-black text-[var(--mineral)]">{group.abbreviation}</span><div><h3 className="font-bold text-[var(--forest-dark)]">{group.name}</h3><p className="mt-1 text-xs leading-5">{group.description}</p></div><div className="flex flex-wrap content-start gap-1.5">{group.ec.map(label=><code key={label} className={`rounded-lg border px-2 py-1 text-[11px] ${label==='Others'?'border-dashed border-[#b9b5ab] text-[var(--muted)]':'border-[var(--line)] bg-[var(--canvas)] text-[var(--forest-dark)]'}`}>{label}</code>)}</div></article>)}</div>
          <div className="rounded-xl bg-[var(--mist)] p-5 text-sm"><p><strong className="text-[var(--forest-dark)]">Reading an EC label:</strong> the positions describe progressively narrower enzyme categories. For example, <code>3.4.11.1</code> falls within hydrolases (3), peptide-bond hydrolases (3.4), and aminopeptidases (3.4.11).</p><p className="mt-2"><code>3.4.11.-</code> represents the broader subgroup without a specific fourth-level assignment. <code>Others</code> groups represented records outside the named labels. Confirm current nomenclature in the <a className="font-semibold underline underline-offset-4" href="https://www.enzyme-database.org/" target="_blank" rel="noreferrer">IUBMB Enzyme Nomenclature database</a>.</p></div>
        </Section>

        <Section id="results" number="06" title="Reading and downloading results">
          <dl className="space-y-4"><div><dt className="font-bold text-[var(--forest-dark)]">Sequence ID</dt><dd>The identifier used to connect a protein across phase tables. Nucleotide submissions use translated ORF identifiers.</dd></div><div><dt className="font-bold text-[var(--forest-dark)]">Predicted category, class, or EC</dt><dd>The highest-scoring output for that phase. A missing downstream row usually means that the sequence did not pass an earlier filter or did not match a selected Phase IV class.</dd></div><div><dt className="font-bold text-[var(--forest-dark)]">Probability values (%)</dt><dd>Scores are displayed as percentages for all outputs in the active model. Gold, slate-blue, and terracotta markers identify the highest, second, and third values in each row. Phase I and II contain only two outputs. The markers show relative order, not confidence thresholds or experimental certainty.</dd></div><div><dt className="font-bold text-[var(--forest-dark)]">Phase III abbreviations</dt><dd>AH, AP, AEP, CEP, DP, DPP, MEP, MP, OP, and SEP are expanded directly below the Phase III table.</dd></div><div><dt className="font-bold text-[var(--forest-dark)]">Structure and annotation</dt><dd>Structure actions are optional and do not change the classification. Phase IV database links search the predicted EC in NCBI, UniProt, BRENDA, KEGG, and JGI.</dd></div></dl><p>Use TSV for a tab-delimited table, CSV for spreadsheet software, or JSON for scripts. Exports retain the original field names and values. Keep sequence identifiers unchanged when joining results across phases.</p>
        </Section>

        <Section id="structures" number="07" title="Secondary and three-dimensional structures">
          <h3 className="font-bold text-[var(--forest-dark)]">Secondary structure — S4PRED</h3><p>Select Predict secondary for a result row. AA is the amino-acid sequence, Pred is the residue assignment, Cart is the graphical representation, and Conf is the per-residue predictor score from 0 to 9. H denotes helix, E strand, and C coil. The result can be downloaded as text, PNG, or SVG.</p>
          <h3 className="font-bold text-[var(--forest-dark)]">Three-dimensional structure</h3><p>MINpred tries ESMFold for proteins up to 400 residues. Longer proteins use SWISS-MODEL; when configured, SWISS-MODEL also provides a fallback if ESMFold is unavailable. Template availability and service queues can affect whether and when a model is returned.</p><p>The interactive viewer supports rotation, zoom, representation and color controls, and PDB, PNG, or SVG export. Predicted coordinates are computational models, not experimental structures.</p>
        </Section>

        <Section id="example" number="08" title="Worked example">
          <ol className="list-decimal space-y-2 pl-5"><li>Open Prediction and keep Protein selected.</li><li>Choose Paste sequence, then select <strong>Mixed panel · all 10 Phase IV classes</strong> from the example menu.</li><li>Select Phase IV and <strong>Determine automatically</strong>.</li><li>Complete verification and start the prediction.</li><li>Read Phase I first, then follow retained sequence IDs through Phases II and III. Phase IV is separated by the class-specific EC model used for each routed sequence.</li><li>Use the colored rank markers to compare scores within a row, and download the tables before the displayed expiry date.</li></ol><p>The examples demonstrate the input and output workflow. They are not a performance benchmark and do not substitute for independent validation.</p>
        </Section>

        <Section id="standalone" number="09" title="Standalone usage">
          <p>The command-line tool uses the same four-phase hierarchy and supports automatic or class-restricted Phase IV analysis.</p><Code>{`# Protein FASTA, automatic routing through Phase IV
minpred -i proteins.fasta -od results -l Phase4

# Restrict Phase IV to one class
minpred -i proteins.fasta -od results -l Phase4 -n serine

# Nucleotide or transcript FASTA through TransDecoder
minpred -i transcripts.fasta --sequence-type nucleotide -od results -l Phase4`}</Code><p>Run <code>minpred download-models all</code> to retrieve all model files in advance and <code>minpred models-status</code> to verify them. TransDecoder is an external dependency for nucleotide input.</p>
        </Section>

        <Section id="troubleshooting" number="10" title="Troubleshooting">
          <div className="space-y-3">{[
            ['FASTA is rejected', 'Confirm that every record has a unique header and a non-empty sequence. Remove alignment gaps, spaces inside sequences, residue numbers, and stop symbols. Check that the selected sequence type matches the alphabet.'],
            ['No downstream rows', 'Review the preceding phase. A sequence must pass each earlier filter, and class-restricted Phase IV also requires a matching Phase III assignment.'],
            ['Nucleotide input produces no proteins', 'TransDecoder may not find a qualifying open reading frame in short, incomplete, or non-coding records. Inspect the TransDecoder log and translated_proteins.fasta in a standalone run.'],
            ['Prediction remains queued or fails', 'Compute availability, SSH, SLURM, model files, or the cluster environment may be unavailable. Keep the job ID and exact error text for support; avoid repeatedly submitting the same large input.'],
            ['Structure prediction fails', 'Classification results remain available. Retry later. Long proteins require a configured SWISS-MODEL token, and the interactive viewer requires browser WebGL support.'],
            ['Results cannot be reopened', 'Use the complete original private link. It may be incomplete, expired, or associated with another deployment. A job ID alone is not sufficient.'],
          ].map(([title,body])=><details key={title} className="rounded-xl border border-[var(--line)] px-4 py-3"><summary className="cursor-pointer font-bold text-[var(--forest-dark)]">{title}</summary><p className="mt-2">{body}</p></details>)}</div>
        </Section>

        <Section id="privacy" number="11" title="Privacy and result retention">
          <p>Anyone with the complete result link can access that job. Keep it private and do not include it in public issue reports. Submitted sequences and results are deleted after 30 days by default; download important tables before the displayed availability date.</p><p>Classification runs on the configured compute cluster. A tertiary-structure request sends the selected protein sequence to ESMFold or SWISS-MODEL. Do not request external structure prediction for confidential sequences unless you are authorized to share them with those services.</p>
        </Section>

        <Section id="limitations" number="12" title="Interpretation and limitations">
          <div className="flex gap-3 rounded-xl border border-[#dfd3ba] bg-[#fcf8ef] p-4"><CircleAlert className="mt-1 h-5 w-5 shrink-0 text-[var(--mineral)]"/><p>MINpred provides sequence-based predictions. It does not measure enzyme activity, substrate specificity, gene expression, reaction rate, metabolic flux, or nitrogen mineralization in an environmental sample.</p></div><p>Coverage is limited to the documented classes and EC outputs. An unfamiliar, fragmentary, or out-of-scope protein can still receive a high model score. Each later phase depends on earlier routing, so uncertainty accumulates through the hierarchy.</p><p>Interpret predictions with sequence quality, reference annotations, homology, domain evidence, genomic context, and experimental results where available.</p>
        </Section>

        <Section id="citation" number="13" title="Citation, reproducibility, and support">
          <p>When reporting an analysis, record MINpred version 1.0.0, the webserver URL and access date, input type, selected phase, Phase IV routing choice, and the downloaded result tables. For standalone work, also record the software revision and model status.</p>
          <blockquote className="border-l-2 border-[var(--mineral)] pl-5 text-[var(--forest-dark)]">Duhan, N., Norton, J. M., &amp; Kaundal, R. (2026). <em>MINpred: TFLite models for nitrogen mineralization-related enzyme classification</em> (Version 1.0.0). Zenodo. <a className="underline underline-offset-4" href="https://doi.org/10.5281/zenodo.21897103" target="_blank" rel="noreferrer">https://doi.org/10.5281/zenodo.21897103</a></blockquote>
          <div className="flex gap-3 rounded-xl bg-[var(--mist)] p-4"><CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-[var(--forest)]"/><p>For assistance, contact <a className="font-semibold underline underline-offset-4" href="mailto:naveen.duhan@usu.edu">Naveen Duhan</a>. Report software issues through the <a className="font-semibold underline underline-offset-4" href="https://github.com/usubioinfo/minpred_web/issues" target="_blank" rel="noreferrer">webserver issue tracker</a> or <a className="font-semibold underline underline-offset-4" href="https://github.com/usubioinfo/minpred/issues" target="_blank" rel="noreferrer">standalone issue tracker</a>. Do not include private tokens, credentials, or confidential sequences.</p></div>
        </Section>
      </main>
    </div>
  </div>;
}
