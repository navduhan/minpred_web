'use client';

import Link from 'next/link';
import { ArrowRight, ExternalLink, RotateCcw, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import {
  MINERALIZATION_CLASSES,
  type PathwayStageId,
} from '@/data/mineralization-classes';

const STAGE_FILTERS: ReadonlyArray<{
  id: 'all' | PathwayStageId;
  label: string;
}> = [
  { id: 'all', label: 'All Stages (10)' },
  { id: 'depolymerization', label: 'Step I · Depolymerization (4)' },
  { id: 'oligopeptide', label: 'Step II · Peptide Cleavage (5)' },
  { id: 'ammonification', label: 'Step III · Ammonification (1)' },
];

const ecDatabaseLinks = (ec: string) => [
  ['BRENDA', `https://www.brenda-enzymes.org/enzyme.php?ecno=${encodeURIComponent(ec)}`],
  ['KEGG', `https://www.genome.jp/dbget-bin/www_bget?ec:${encodeURIComponent(ec)}`],
  ['UniProt', `https://www.uniprot.org/uniprotkb?query=ec:${encodeURIComponent(ec)}`],
] as const;

export default function EcNumbersPage() {
  const [query, setQuery] = useState('');
  const [stageFilter, setStageFilter] = useState<'all' | PathwayStageId>('all');
  const [classFilter, setClassFilter] = useState<string>('all');

  const normalizedQuery = query.trim().toLowerCase();

  const filteredClasses = useMemo(() => {
    return MINERALIZATION_CLASSES.map((cls) => {
      if (stageFilter !== 'all' && cls.stage !== stageFilter) return null;
      if (classFilter !== 'all' && cls.code !== classFilter) return null;

      if (!normalizedQuery) {
        return { ...cls, matchedEcs: cls.ecs };
      }

      const classMatches =
        cls.code.toLowerCase().includes(normalizedQuery) ||
        cls.name.toLowerCase().includes(normalizedQuery) ||
        cls.ecPrefix.toLowerCase().includes(normalizedQuery) ||
        cls.stageLabel.toLowerCase().includes(normalizedQuery) ||
        cls.canonicalExamples.some((ex) => ex.toLowerCase().includes(normalizedQuery));

      const matchingEcs = cls.ecs.filter((ec) => ec.toLowerCase().includes(normalizedQuery));

      if (!classMatches && matchingEcs.length === 0) return null;

      return {
        ...cls,
        matchedEcs: classMatches ? cls.ecs : matchingEcs,
      };
    }).filter((item): item is NonNullable<typeof item> => item !== null);
  }, [stageFilter, classFilter, normalizedQuery]);

  const flatMatchedEcs = useMemo(
    () =>
      filteredClasses.flatMap((cls) =>
        cls.matchedEcs.map((ec) => ({
          ec,
          code: cls.code,
          className: cls.name,
          key: cls.key,
          stageShort: cls.stageShort,
        })),
      ),
    [filteredClasses],
  );

  const hasFilters = query.trim() !== '' || stageFilter !== 'all' || classFilter !== 'all';

  const resetFilters = () => {
    setQuery('');
    setStageFilter('all');
    setClassFilter('all');
  };

  return (
    <div className="space-y-8 py-6 pb-10">
      {/* Compact Header */}
      <header className="flex flex-col justify-between gap-4 border-b border-[var(--line-strong)] pb-5 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-[var(--navy)] sm:text-[1.68rem]">
            Enzyme Classes &amp; 52 Four-Digit EC Numbers
          </h1>
          <p className="mt-1 text-[15px] text-[var(--ink-secondary)]">
            Phase III enzyme categories (EC 3.4 peptidases &amp; EC 3.5.1 amidohydrolases) and
            Phase IV four-digit EC coverage
          </p>
        </div>

        <Link href="/prediction" className="btn-amber shrink-0">
          <span>Predict Sequences</span>
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </header>

      {/* Semantic <search> Filter Toolbar */}
      <search aria-label="Filter enzyme classes and EC numbers" className="surface p-5">
        <form
          role="search"
          action="/minpred/ec-numbers"
          method="get"
          onSubmit={(e) => e.preventDefault()}
          className="space-y-4"
        >
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex-1 space-y-1.5">
              <label
                htmlFor="ec-search-input"
                className="block text-sm font-bold text-[var(--navy)]"
              >
                Search by EC number, enzyme class, or representative enzyme
              </label>
              <div className="relative">
                <Search
                  className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-[var(--teal)]"
                  aria-hidden="true"
                />
                <input
                  id="ec-search-input"
                  name="q"
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  autoCorrect="off"
                  autoCapitalize="none"
                  spellCheck={false}
                  placeholder="e.g. 3.4.21.62, 3.5.1.5, Urease, SEP, Aminopeptidases"
                  className="field !pl-10 text-[15px]"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {STAGE_FILTERS.map((st) => {
                const active = stageFilter === st.id;
                return (
                  <button
                    key={st.id}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setStageFilter(st.id)}
                    className={`cursor-pointer rounded-lg border px-3.5 py-2.5 text-sm font-bold transition ${
                      active
                        ? 'border-[var(--navy)] bg-[var(--navy)] text-white'
                        : 'border-[var(--line-strong)] bg-white text-[var(--navy)] hover:border-[var(--teal)] hover:bg-[var(--teal-soft)]'
                    }`}
                  >
                    {st.label}
                  </button>
                );
              })}

              {hasFilters && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="btn-ghost-rule py-2 px-3 text-sm"
                >
                  <RotateCcw className="h-4 w-4" aria-hidden="true" />
                  <span>Reset</span>
                </button>
              )}
            </div>
          </div>

          {/* Quick Class Filter Pills */}
          <div className="flex flex-wrap items-center gap-2 border-t border-[var(--line)] pt-3.5">
            <span className="mr-1 font-mono text-xs font-bold uppercase tracking-wider text-[var(--ink-secondary)]">
              Class:
            </span>
            <button
              type="button"
              aria-pressed={classFilter === 'all'}
              onClick={() => setClassFilter('all')}
              className={`cursor-pointer rounded-md border px-2.5 py-1 font-mono text-xs font-bold transition ${
                classFilter === 'all'
                  ? 'border-[var(--teal)] bg-[var(--teal)] text-white'
                  : 'border-[var(--line-strong)] bg-[var(--surface)] text-[var(--navy)] hover:border-[var(--teal)]'
              }`}
            >
              All 10
            </button>
            {MINERALIZATION_CLASSES.map((cls) => {
              const active = classFilter === cls.code;
              return (
                <button
                  key={cls.code}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setClassFilter(active ? 'all' : cls.code)}
                  title={cls.name}
                  className={`cursor-pointer rounded-md border px-2.5 py-1 font-mono text-xs font-bold transition ${
                    active
                      ? 'border-[var(--ochre-dark)] bg-[var(--pyrite)] text-[#0b181a]'
                      : 'border-[var(--line-strong)] bg-white text-[var(--navy)] hover:border-[var(--teal)] hover:bg-[var(--teal-soft)]'
                  }`}
                >
                  {cls.code} ({cls.ecs.length})
                </button>
              );
            })}

            <span
              aria-live="polite"
              className="ml-auto font-mono text-xs font-bold text-[var(--teal)]"
            >
              Showing {filteredClasses.length} class{filteredClasses.length === 1 ? '' : 'es'} ·{' '}
              {flatMatchedEcs.length} explicit EC{flatMatchedEcs.length === 1 ? '' : 's'}
            </span>
          </div>
        </form>
      </search>

      {/* Responsive Class & EC Catalog Table */}
      <section aria-labelledby="ec-class-table-heading" className="space-y-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2
            id="ec-class-table-heading"
            className="font-display text-xl font-bold text-[var(--navy)]"
          >
            Phase III Classes &amp; Phase IV Specialist Heads (M1–M10)
          </h2>
          <p className="text-sm text-[var(--ink-secondary)]">
            Click any EC badge to open its enzyme entry in BRENDA
          </p>
        </div>

        {filteredClasses.length === 0 ? (
          <div className="surface p-8 text-center">
            <p className="text-base font-bold text-[var(--navy)]">
              No enzyme classes or EC numbers match &ldquo;{query}&rdquo;.
            </p>
            <button type="button" onClick={resetFilters} className="btn-outline-sharp mt-4 text-sm">
              Show all 10 classes &amp; 52 ECs
            </button>
          </div>
        ) : (
          <div
            tabIndex={0}
            role="region"
            aria-labelledby="ec-class-table-heading"
            className="mp-table-region rounded-xl border border-[var(--line-strong)] bg-white"
          >
            <table className="mp-table mp-table-responsive sci-table">
              <thead>
                <tr>
                  <th scope="col">Code</th>
                  <th scope="col">Enzyme Class &amp; Reaction Stage</th>
                  <th scope="col">Subclass</th>
                  <th scope="col">Explicit Four-Digit EC Numbers</th>
                  <th scope="col" className="text-right">
                    Demo
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredClasses.map((cls) => (
                  <tr key={cls.key}>
                    <th scope="row" className="whitespace-nowrap">
                      <span className="inline-block rounded-md bg-[var(--navy)] px-2.5 py-1 font-mono text-xs font-extrabold text-white">
                        {cls.code}
                      </span>
                      <span className="mt-1 block font-mono text-xs font-semibold text-[var(--ink-secondary)]">
                        Head {cls.modelHead}
                      </span>
                    </th>
                    <td data-label="Enzyme Class">
                      <span className="block text-[15.5px] font-bold text-[var(--navy)]">
                        {cls.name}
                      </span>
                      <span className="mt-0.5 block font-mono text-xs font-semibold text-[var(--ochre)]">
                        {cls.stageLabel}
                      </span>
                      <span className="mt-1 block text-sm leading-relaxed text-[var(--ink)]">
                        {cls.canonicalExamples.join(' · ')}
                      </span>
                    </td>
                    <td data-label="Subclass" className="whitespace-nowrap">
                      <span className="font-mono text-sm font-bold text-[var(--teal)]">
                        {cls.ecPrefix}
                      </span>
                      <span className="mt-0.5 block text-xs text-[var(--ink-secondary)]">
                        {cls.cofactorOrDyad}
                      </span>
                    </td>
                    <td data-label="Explicit ECs">
                      <div className="flex flex-wrap gap-1.5">
                        {cls.matchedEcs.map((ec) => (
                          <a
                            key={ec}
                            href={`https://www.brenda-enzymes.org/enzyme.php?ecno=${encodeURIComponent(ec)}`}
                            target="_blank"
                            rel="noreferrer"
                            title={`Open EC ${ec} in BRENDA`}
                            className="inline-flex items-center gap-1 rounded-md border border-[var(--line-strong)] bg-[var(--surface)] px-2.5 py-1 font-mono text-xs font-bold text-[var(--navy)] transition hover:border-[var(--teal)] hover:bg-[var(--teal-soft)]"
                          >
                            <span>{ec}</span>
                            <ExternalLink className="h-3 w-3 text-[var(--teal)]" aria-hidden="true" />
                          </a>
                        ))}
                        <span className="rounded-md border border-dashed border-[var(--field-border)] bg-white px-2.5 py-1 font-mono text-xs font-semibold text-[var(--ink-secondary)]">
                          + Others
                        </span>
                      </div>
                    </td>
                    <td data-label="Demo" className="text-right whitespace-nowrap">
                      <Link
                        href={`/prediction?example=${cls.key}`}
                        className="btn-outline-sharp !min-h-0 py-1.5 px-3 text-xs"
                      >
                        <span>Load {cls.code} →</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Individual Four-Digit EC Cross-Database Cards */}
      {flatMatchedEcs.length > 0 && (
        <section
          aria-labelledby="explicit-ec-cards-heading"
          className="space-y-3 border-t border-[var(--line-strong)] pt-8"
        >
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2
              id="explicit-ec-cards-heading"
              className="font-display text-xl font-bold text-[var(--navy)]"
            >
              Four-Digit EC Cross-Database Directory ({flatMatchedEcs.length})
            </h2>
            <p className="text-sm text-[var(--ink-secondary)]">
              Direct enzyme annotation links to BRENDA, KEGG, and UniProtKB
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {flatMatchedEcs.map((item) => (
              <div
                key={item.ec}
                className="flex flex-col justify-between rounded-xl border border-[var(--line-strong)] bg-white p-3.5 transition hover:border-[var(--teal)]"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-base font-extrabold text-[var(--navy)]">
                      EC {item.ec}
                    </span>
                    <span
                      className={`rounded-md px-2 py-0.5 font-mono text-xs font-bold ${
                        item.code === 'AH'
                          ? 'bg-[var(--ochre-soft)] text-[var(--ochre)]'
                          : 'bg-[var(--teal-soft)] text-[var(--teal)]'
                      }`}
                    >
                      {item.code}
                    </span>
                  </div>
                  <p className="mt-1 text-sm font-medium text-[var(--ink-secondary)]">
                    {item.className}
                  </p>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-[var(--line)] pt-2.5 font-mono text-xs font-bold">
                  {ecDatabaseLinks(item.ec).map(([db, url]) => (
                    <a
                      key={db}
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-0.5 text-[var(--teal)] hover:text-[var(--navy)] hover:underline"
                    >
                      <span>{db}</span>
                      <ExternalLink className="h-3 w-3" aria-hidden="true" />
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
