'use client';

import { Check, Copy, Download, ExternalLink } from 'lucide-react';
import { type KeyboardEvent, useEffect, useRef, useState } from 'react';
import { withBasePath } from '@/lib/base-path';

type InstallTabId = 'github' | 'tarball' | 'venv';

const INSTALL_TABS: ReadonlyArray<{
  id: InstallTabId;
  label: string;
  summary: string;
  commands: string;
}> = [
  {
    id: 'github',
    label: 'GitHub + uv',
    summary:
      'Clone from usubioinfo/minpred. All 13 Keras (.keras) models and StandardScalers (.npz) are bundled inside src/minpred/models/ with SHA-256 verification.',
    commands: `# 1. Clone repository (includes all 13 bundled .keras + .npz checkpoints)
git clone https://github.com/usubioinfo/minpred.git
cd minpred

# 2. Sync Python 3.12 environment with uv and verify model SHA-256 manifest
uv sync --python 3.12
uv run minpred models-status

# 3. Run four-phase EC prediction on the example FASTA
uv run minpred -i example/test.fasta -o MINpred_results`,
  },
  {
    id: 'tarball',
    label: 'Standalone Archive (.tar.gz)',
    summary:
      'Download the versioned standalone archive, verify its SHA-256 checksum, and install into an isolated Python environment.',
    commands: `# 1. Download standalone archive, commit revision & SHA-256 checksum
curl -fLO https://kaabil.net/minpred/download/minpred-standalone.tar.gz
curl -fLO https://kaabil.net/minpred/download/SHA256SUMS
curl -fLO https://kaabil.net/minpred/download/REVISION.txt
sha256sum -c SHA256SUMS

# 2. Extract minpred/ directory and install
tar -xzf minpred-standalone.tar.gz
cd minpred
pip install .

# 3. Verify bundled weights and run prediction
minpred models-status
minpred -i proteome.faa -o MINpred_results`,
  },
  {
    id: 'venv',
    label: 'Standard venv + Nucleotide Mode',
    summary:
      'Install using standard Python venv + pip, restrict Phase IV to one enzyme class, or translate nucleotide FASTA via TransDecoder.',
    commands: `# 1. Create a standard Python virtual environment and install
python3 -m venv .venv
source .venv/bin/activate
pip install --upgrade pip
pip install git+https://github.com/usubioinfo/minpred.git

# 2. Restrict Phase IV EC prediction to one enzyme class (e.g. serine)
minpred -i proteins.fasta -o results_serine -p 4 -c serine

# 3. Screen nucleotide transcripts or contigs (requires TransDecoder on PATH)
minpred -i transcripts.fna -o results_nucl -t nucleotide`,
  },
];

const CLI_FLAGS = [
  {
    flag: '-i, --input FASTA',
    defaultVal: 'Required',
    required: true,
    spec: 'Input protein or nucleotide FASTA path.',
  },
  {
    flag: '-o, --outdir DIR',
    defaultVal: 'MINpred_results',
    required: false,
    spec: 'Output directory for per-phase probability logs and consolidated TSV summary.',
  },
  {
    flag: '-f, --outfile FILE',
    defaultVal: 'MINpred_results.tsv',
    required: false,
    spec: 'Filename for the consolidated summary report written inside --outdir.',
  },
  {
    flag: '-p, --phase {1..4}',
    defaultVal: 'Phase4',
    required: false,
    spec: 'Terminal cascade depth (1..4 or Phase1..Phase4); runs all preceding phases.',
  },
  {
    flag: '-c, --enzyme-class',
    defaultVal: 'all',
    required: false,
    spec: 'Phase IV routing: all (automatic Phase III handoff) or one of the 10 class keys.',
  },
  {
    flag: '-t, --seq-type',
    defaultVal: 'protein',
    required: false,
    spec: 'protein or nucleotide (invokes TransDecoder.LongOrfs before ESM-2 embedding).',
  },
  {
    flag: '-d, --device DEV',
    defaultVal: 'auto',
    required: false,
    spec: 'Compute device selection (auto detects accelerator or falls back to CPU).',
  },
  {
    flag: 'models-status',
    defaultVal: 'Subcommand',
    required: false,
    spec: 'Verify SHA-256 integrity of all 13 bundled .keras models and .npz scalers.',
  },
] as const;

const OUTPUT_FILES = [
  {
    filename: 'MINpred_results.tsv',
    phase: 'All runs',
    description:
      'Consolidated per-sequence summary reporting final phase status, predicted enzyme class, and four-digit EC.',
  },
  {
    filename: 'Phase_1_dnn_log.tsv',
    phase: 'Phase 1–4',
    description: 'Enzyme vs. Non-enzyme probabilities (%) across all submitted records.',
  },
  {
    filename: 'Phase_2_dnn_log.tsv',
    phase: 'Phase 2–4',
    description: 'Nitrogen-mineralization probabilities (%) for candidates passing Phase I.',
  },
  {
    filename: 'Phase_3_dnn_log.tsv',
    phase: 'Phase 3–4',
    description: '10-class probability matrix across Amidohydrolases (AH) and nine peptidase classes.',
  },
  {
    filename: 'Phase_4_<class>_log.tsv',
    phase: 'Phase 4',
    description: 'Class-specific four-digit EC probability tables (M1–M10) covering 52 ECs + Others.',
  },
] as const;

export default function DownloadPage() {
  const [selectedTab, setSelectedTab] = useState<InstallTabId>('github');
  const [copiedId, setCopiedId] = useState('');
  const panelsRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<Record<InstallTabId, HTMLButtonElement | null>>({
    github: null,
    tarball: null,
    venv: null,
  });

  const copyBlock = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      window.setTimeout(() => setCopiedId(''), 2000);
    } catch {
      // Ignore clipboard permission errors
    }
  };

  const selectAndRevealTab = (id: InstallTabId, focus = false) => {
    setSelectedTab(id);
    const btn = tabRefs.current[id];
    if (btn) {
      if (focus) btn.focus();
      btn.scrollIntoView({
        block: 'nearest',
        inline: 'nearest',
        container: 'nearest',
      } as ScrollIntoViewOptions);
    }
  };

  useEffect(() => {
    const container = panelsRef.current;
    if (!container) return;
    const onBeforeMatch = (event: Event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      const panel = target.closest<HTMLElement>('[role="tabpanel"][data-tab-id]');
      const matchedId = panel?.dataset.tabId as InstallTabId | undefined;
      if (matchedId) {
        setSelectedTab(matchedId);
        tabRefs.current[matchedId]?.scrollIntoView({
          block: 'nearest',
          inline: 'nearest',
          container: 'nearest',
        } as ScrollIntoViewOptions);
      }
    };
    container.addEventListener('beforematch', onBeforeMatch);
    return () => container.removeEventListener('beforematch', onBeforeMatch);
  }, []);

  const handleTabKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const idx = INSTALL_TABS.findIndex((t) => t.id === selectedTab);
    if (idx === -1) return;
    let nextIdx = -1;
    if (event.key === 'ArrowRight') nextIdx = (idx + 1) % INSTALL_TABS.length;
    else if (event.key === 'ArrowLeft')
      nextIdx = (idx - 1 + INSTALL_TABS.length) % INSTALL_TABS.length;
    else if (event.key === 'Home') nextIdx = 0;
    else if (event.key === 'End') nextIdx = INSTALL_TABS.length - 1;
    if (nextIdx !== -1) {
      event.preventDefault();
      selectAndRevealTab(INSTALL_TABS[nextIdx].id, true);
    }
  };

  return (
    <div className="space-y-8 py-6 pb-10">
      {/* Compact CLI Header */}
      <header className="flex flex-col justify-between gap-4 border-b border-[var(--line-strong)] pb-5 lg:flex-row lg:items-center">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-[var(--navy)] sm:text-[1.68rem]">
            Standalone CLI Package (<code>minpred</code>)
          </h1>
          <p className="mt-1 text-[15px] text-[var(--ink-secondary)]">
            Local Python distribution with all 13 bundled neural checkpoints for proteome &amp;
            metagenome batch runs
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <a
            className="btn-amber"
            href={withBasePath('/download/minpred-standalone.tar.gz')}
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            <span>Download .tar.gz</span>
          </a>
          <a
            href="https://github.com/usubioinfo/minpred"
            target="_blank"
            rel="noreferrer"
            className="btn-outline-sharp"
          >
            <span>GitHub Repo</span>
            <ExternalLink className="h-4 w-4" aria-hidden="true" />
          </a>
          <a
            className="px-2 py-1 font-mono text-xs font-bold text-[var(--teal)] hover:underline"
            href={withBasePath('/download/SHA256SUMS')}
          >
            SHA-256
          </a>
        </div>
      </header>

      {/* Tabbed Installation Workflows */}
      <section
        aria-label="Standalone installation workflows"
        className="surface overflow-hidden"
      >
        <div
          className="mp-tablist bg-[var(--limestone)] px-4"
          role="tablist"
          aria-label="Installation method"
          onKeyDown={handleTabKeyDown}
        >
          {INSTALL_TABS.map((tab) => {
            const active = selectedTab === tab.id;
            return (
              <button
                key={tab.id}
                ref={(el) => {
                  tabRefs.current[tab.id] = el;
                }}
                id={`install-tab-${tab.id}`}
                type="button"
                role="tab"
                tabIndex={active ? 0 : -1}
                aria-selected={active}
                onClick={() => selectAndRevealTab(tab.id)}
                className="mp-tab"
              >
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        <div ref={panelsRef}>
          {INSTALL_TABS.map((tab) => {
            const active = selectedTab === tab.id;
            return (
              <div
                key={tab.id}
                role="tabpanel"
                data-tab-id={tab.id}
                aria-labelledby={`install-tab-${tab.id}`}
                hidden={!active ? ('until-found' as unknown as boolean) : undefined}
              >
                <div className="space-y-4 p-5 sm:p-6">
                  <p className="max-w-3xl text-[15px] leading-relaxed text-[var(--ink)]">
                    {tab.summary}
                  </p>

                  <div className="overflow-hidden rounded-xl border border-[var(--navy-dark)] bg-[#122628] text-white">
                    <div className="flex items-center justify-between border-b border-white/15 px-4 py-2.5 font-mono text-xs text-slate-200">
                      <span>bash / zsh · Python ≥ 3.10 (3.12 recommended)</span>
                      <button
                        type="button"
                        onClick={() => void copyBlock(tab.id, tab.commands)}
                        className="inline-flex cursor-pointer items-center gap-1.5 font-mono text-xs font-semibold text-white hover:text-[#f5d07a]"
                      >
                        {copiedId === tab.id ? (
                          <>
                            <Check className="h-4 w-4 text-[#f5d07a]" aria-hidden="true" />
                            <span>Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-4 w-4" aria-hidden="true" />
                            <span>Copy commands</span>
                          </>
                        )}
                      </button>
                    </div>
                    <pre className="overflow-x-auto p-4 font-mono text-[13.5px] leading-6 text-slate-100">
                      <code>{tab.commands}</code>
                    </pre>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Two-Column CLI Options & Output Files Reference */}
      <section
        aria-label="Command-line flags and output files"
        className="grid gap-8 lg:grid-cols-12"
      >
        <div className="space-y-3 lg:col-span-7">
          <div className="flex items-baseline justify-between gap-2">
            <h2 className="font-display text-xl font-bold text-[var(--navy)]">
              Command-Line Flags &amp; Subcommands
            </h2>
            <span className="font-mono text-xs font-semibold text-[var(--ink-secondary)]">
              minpred --help
            </span>
          </div>

          <div className="sci-table-wrap overflow-x-auto">
            <table className="sci-table">
              <thead>
                <tr>
                  <th>Option</th>
                  <th>Default</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                {CLI_FLAGS.map((row) => (
                  <tr key={row.flag}>
                    <th scope="row" className="font-mono text-sm font-bold whitespace-nowrap text-[var(--navy)]">
                      {row.flag}
                    </th>
                    <td className="font-mono text-xs whitespace-nowrap">
                      <span
                        className={
                          row.required
                            ? 'font-bold text-[var(--ochre)]'
                            : 'font-semibold text-[var(--teal)]'
                        }
                      >
                        {row.defaultVal}
                      </span>
                    </td>
                    <td>{row.spec}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-3 lg:col-span-5">
          <div className="flex items-baseline justify-between gap-2">
            <h2 className="font-display text-xl font-bold text-[var(--navy)]">
              Generated Output Tables
            </h2>
            <span className="font-mono text-xs font-semibold text-[var(--ink-secondary)]">
              Tab-separated (.tsv)
            </span>
          </div>

          <div className="sci-table-wrap overflow-x-auto">
            <table className="sci-table">
              <thead>
                <tr>
                  <th>File</th>
                  <th>Contents</th>
                </tr>
              </thead>
              <tbody>
                {OUTPUT_FILES.map((out) => (
                  <tr key={out.filename}>
                    <th scope="row" className="font-normal">
                      <span className="block font-mono text-sm font-bold text-[var(--navy)]">
                        {out.filename}
                      </span>
                      <span className="block font-mono text-xs font-bold text-[var(--ochre)]">
                        {out.phase}
                      </span>
                    </th>
                    <td>{out.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
