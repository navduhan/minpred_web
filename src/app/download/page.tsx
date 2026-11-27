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
      'Clone directly from usubioinfo/minpred. All 13 Keras (.keras) neural checkpoints and StandardScalers (.npz) are bundled inside src/minpred/models/ and verified via SHA-256 checksums.',
    commands: `# 1. Clone repository (includes all 13 bundled .keras + .npz checkpoints)
git clone https://github.com/usubioinfo/minpred.git
cd minpred

# 2. Sync Python 3.12 environment with uv and verify model SHA-256 manifest
uv sync --python 3.12
uv run minpred models-status

# 3. Run full four-phase EC prediction on the bundled example FASTA
uv run minpred -i example/test.fasta -o MINpred_results`,
  },
  {
    id: 'tarball',
    label: 'Versioned Tarball (.tar.gz)',
    summary:
      'Download the standalone source archive packaged from GitHub, verify its SHA-256 digest and commit hash, and install into an isolated Python environment.',
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
      'Install using standard Python venv + pip, restrict Phase IV to a specific enzyme class, or translate nucleotide/transcript FASTA automatically when TransDecoder is installed.',
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
    spec: 'Input protein or nucleotide FASTA path (20 standard AAs + X, or A/C/G/T/U/N).',
  },
  {
    flag: '-o, --outdir DIR',
    defaultVal: 'MINpred_results',
    required: false,
    spec: 'Destination directory for per-phase probability logs and consolidated TSV summary.',
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
    spec: 'Terminal cascade depth (1..4 or Phase1..Phase4); runs all preceding gates.',
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
    spec: 'Compute device selection (auto detects available accelerator or falls back to CPU).',
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
      'Consolidated per-sequence ledger reporting final cascade status, predicted functional class, and assigned four-digit EC.',
  },
  {
    filename: 'Phase_1_dnn_log.tsv',
    phase: 'Phase 1–4',
    description:
      'Catalytic enzyme gate probabilities (%) separating Enzymes from strict Non-enzymes across all submitted records.',
  },
  {
    filename: 'Phase_2_dnn_log.tsv',
    phase: 'Phase 2–4',
    description:
      'Nitrogen-mineralization filter probabilities (%) for candidates passing Phase I.',
  },
  {
    filename: 'Phase_3_dnn_log.tsv',
    phase: 'Phase 3–4',
    description:
      '10-class softmax probability matrix across Amidohydrolases (AH) and the nine EC 3.4 peptidase subclasses.',
  },
  {
    filename: 'Phase_4_<class>_log.tsv',
    phase: 'Phase 4',
    description:
      'Class-specific four-digit EC probability tables (M1–M10) covering 52 explicit ECs plus per-class Others.',
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
    <div className="space-y-8 py-4 sm:py-6">
      <header className="grid gap-6 border-b border-[var(--line)] pb-6 lg:grid-cols-[1.25fr_0.75fr] lg:items-start">
        <div className="space-y-3">
          <p className="eyebrow">Standalone CLI Distribution · Proteome &amp; Metagenome Scale</p>
          <h1 className="font-display text-3xl font-semibold leading-tight text-[var(--navy)] sm:text-4xl">
            Run MINpred locally from the command line
          </h1>
          <p className="max-w-2xl text-sm leading-relaxed text-[var(--muted)]">
            The standalone <code className="font-mono text-[var(--navy)]">minpred</code> Python
            package executes the identical four-phase ESM-2 (650M) + MLP hierarchy as the web
            portal, bundles all 13 SHA-256 verified <code className="font-mono">.keras</code>{' '}
            models and <code className="font-mono">.npz</code> StandardScalers inside the package,
            and supports unlimited batch sizes.
          </p>
        </div>

        <aside className="border border-[var(--line)] border-t-2 border-t-[var(--pyrite-indicator)] bg-[var(--surface)] p-5">
          <div className="flex items-baseline justify-between gap-2">
            <h2 className="font-mono text-xs font-extrabold uppercase tracking-wider text-[var(--navy)]">
              Versioned Source Archive
            </h2>
            <span className="font-mono text-[11px] font-bold text-[var(--teal)]">MIT License</span>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-[var(--muted)]">
            Packaged directly from the latest verified{' '}
            <code className="font-mono">usubioinfo/minpred</code> GitHub revision with all 13 neural
            checkpoints included:
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <a
              className="btn-amber !text-xs"
              href={withBasePath('/download/minpred-standalone.tar.gz')}
            >
              <Download className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Download .tar.gz</span>
            </a>
            <a
              href="https://github.com/usubioinfo/minpred"
              target="_blank"
              rel="noreferrer"
              className="btn-outline-sharp !text-xs"
            >
              <span>GitHub Repo</span>
              <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
            </a>
          </div>
          <div className="mt-3.5 flex flex-wrap gap-x-4 gap-y-1 border-t border-[var(--line)] pt-2.5 font-mono text-xs font-bold">
            <a
              className="text-[var(--navy)] underline underline-offset-4 hover:text-[var(--teal)]"
              href={withBasePath('/download/SHA256SUMS')}
            >
              SHA-256 Checksum
            </a>
            <a
              className="text-[var(--teal)] underline underline-offset-4 hover:text-[var(--navy)]"
              href={withBasePath('/download/REVISION.txt')}
            >
              Commit Revision
            </a>
          </div>
        </aside>
      </header>

      {/* Tabbed Installation Workflows */}
      <section
        aria-label="Standalone installation workflows"
        className="border border-[var(--line)] border-t-2 border-t-[var(--navy)] bg-white"
      >
        <div
          className="mp-tablist bg-[var(--limestone)] px-3 sm:px-5"
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
                  <p className="max-w-3xl text-sm leading-relaxed text-[var(--muted)]">
                    {tab.summary}
                  </p>

                  <div className="rounded-[2px] border border-[var(--navy-dark)] bg-[#142a2c] text-white">
                    <div className="flex items-center justify-between border-b border-white/15 px-3.5 py-2 font-mono text-[11px] text-slate-300">
                      <span>bash / zsh · Python ≥ 3.10 (3.12 recommended)</span>
                      <button
                        type="button"
                        onClick={() => void copyBlock(tab.id, tab.commands)}
                        className="inline-flex items-center gap-1 font-mono text-[11px] font-semibold text-slate-200 hover:text-white"
                      >
                        {copiedId === tab.id ? (
                          <>
                            <Check className="h-3.5 w-3.5 text-[#f5d07a]" aria-hidden="true" />
                            <span>Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                            <span>Copy commands</span>
                          </>
                        )}
                      </button>
                    </div>
                    <pre className="overflow-x-auto p-4 font-mono text-xs leading-6 text-slate-100">
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
        <div className="lg:col-span-7">
          <div className="mb-3 flex items-baseline justify-between gap-2">
            <h2 className="font-display text-xl font-bold text-[var(--navy)]">
              Command-Line Flags &amp; Subcommands
            </h2>
            <span className="font-mono text-[11px] text-[var(--muted)]">minpred --help</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse border-t-2 border-[var(--navy)] border-b border-[var(--line)] text-left text-xs">
              <thead>
                <tr className="border-b border-[var(--line-strong)] bg-[var(--limestone)] font-mono text-[11px] uppercase tracking-wider text-[var(--navy)]">
                  <th scope="col" className="py-2.5 pr-3 pl-2.5 font-bold">
                    Option
                  </th>
                  <th scope="col" className="py-2.5 px-2.5 font-bold">
                    Default
                  </th>
                  <th scope="col" className="py-2.5 pr-2.5 pl-2.5 font-bold">
                    Description
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--line)]">
                {CLI_FLAGS.map((row) => (
                  <tr key={row.flag} className="hover:bg-[var(--limestone)]/60">
                    <th
                      scope="row"
                      className="py-2.5 pr-3 pl-2.5 font-mono text-xs font-bold whitespace-nowrap text-[var(--navy)]"
                    >
                      {row.flag}
                    </th>
                    <td className="py-2.5 px-2.5 font-mono text-[11px] whitespace-nowrap">
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
                    <td className="py-2.5 pr-2.5 pl-2.5 leading-relaxed text-[var(--muted)]">
                      {row.spec}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="lg:col-span-5">
          <div className="mb-3 flex items-baseline justify-between gap-2">
            <h2 className="font-display text-xl font-bold text-[var(--navy)]">
              Generated Output Tables
            </h2>
            <span className="font-mono text-[11px] text-[var(--muted)]">Tab-separated (.tsv)</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse border-t-2 border-[var(--pyrite-indicator)] border-b border-[var(--line)] text-left text-xs">
              <thead>
                <tr className="border-b border-[var(--line-strong)] bg-[var(--limestone)] font-mono text-[11px] uppercase tracking-wider text-[var(--navy)]">
                  <th scope="col" className="py-2.5 pr-3 pl-2.5 font-bold">
                    File
                  </th>
                  <th scope="col" className="py-2.5 pr-2.5 pl-2 font-bold">
                    Contents
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--line)]">
                {OUTPUT_FILES.map((out) => (
                  <tr key={out.filename} className="hover:bg-[var(--limestone)]/60">
                    <th scope="row" className="py-2.5 pr-3 pl-2.5 align-top font-normal">
                      <span className="block font-mono text-xs font-bold text-[var(--navy)]">
                        {out.filename}
                      </span>
                      <span className="block font-mono text-[10px] font-semibold text-[var(--ochre)]">
                        {out.phase}
                      </span>
                    </th>
                    <td className="py-2.5 pr-2.5 pl-2 leading-relaxed text-[var(--muted)]">
                      {out.description}
                    </td>
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
