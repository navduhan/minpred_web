'use client';

import { useCallback, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import SecondaryStructureViewer from '@/components/SecondaryStructureViewer';
import { withBasePath } from '@/lib/base-path';

type Structure = {
  sampleId: string;
  sequence: string;
  amino_acids: string;
  prediction: string;
  confidence: string;
  pdb: string;
  method: string;
};

const Viewer = dynamic(() => import('@/components/StructureViewer'), { ssr: false });

export default function StructurePage() {
  const [data, setData] = useState<Structure | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [info, setInfo] = useState({
    job: '',
    token: '',
    sample: '',
    kind: 'secondary',
    phase: '',
  });

  useEffect(() => {
    const p = new URLSearchParams(window.location.hash.slice(1));
    void Promise.resolve().then(() =>
      setInfo({
        job: p.get('job') || '',
        token: p.get('token') || '',
        sample: p.get('sample') || '',
        kind: p.get('kind') === 'tertiary' ? 'tertiary' : 'secondary',
        phase: p.get('phase') || '',
      }),
    );
  }, []);

  const load = useCallback(async () => {
    setBusy(true);
    setError('');
    try {
      const r = await fetch(withBasePath('/api/structure/' + info.kind), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-MINpred-Job-Token': info.token,
        },
        body: JSON.stringify({ jobId: info.job, sampleId: info.sample }),
      });
      const value = await r.json();
      if (!r.ok) throw new Error(value.error || 'Structure unavailable.');
      setData(value);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Structure unavailable.');
    } finally {
      setBusy(false);
    }
  }, [info]);

  useEffect(() => {
    if (!info.job) return;
    let cancelled = false;
    void Promise.resolve().then(() => {
      if (cancelled) return;
      try {
        const saved = JSON.parse(sessionStorage.getItem('minpred_structure_view') || 'null');
        if (
          saved?.job === info.job &&
          saved?.sample === info.sample &&
          saved?.kind === info.kind
        ) {
          setData(saved.data);
          return;
        }
      } catch {
        // Fall back to server cache
      }
      void load();
    });
    return () => {
      cancelled = true;
    };
  }, [info, load]);

  const back =
    withBasePath('/results') +
    '#' +
    new URLSearchParams({ job: info.job, token: info.token, phase: info.phase });

  return (
    <div className="space-y-6 py-4 sm:py-6">
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-[var(--line)] pb-5">
        <div>
          <p className="eyebrow">
            {info.kind === 'secondary'
              ? 'S4PRED Single-Sequence 2D Topology'
              : 'Predicted 3D Atomic Coordinates'}
          </p>
          <h1 className="mt-1.5 font-display text-3xl font-semibold text-[var(--navy)]">
            {info.kind === 'secondary' ? 'Secondary structure' : 'Three-dimensional structure'}
          </h1>
          {info.sample ? (
            <p className="mt-1 font-mono text-xs font-bold break-all text-[var(--teal)]">
              {info.sample}
            </p>
          ) : null}
        </div>
        <a href={back} className="btn-outline-sharp text-xs">
          ← Back to results ledger
        </a>
      </header>

      {!data && !error && (
        <p role="status" className="font-mono text-xs text-[var(--muted)]">
          Loading structure coordinates…
        </p>
      )}
      {error && (
        <div className="space-y-3 border-l-4 border-[var(--danger)] bg-[var(--danger-soft)] p-4">
          <p role="alert" className="text-sm font-semibold text-[var(--danger)]">
            {error}
          </p>
          <button
            type="button"
            className="btn-outline-sharp text-xs"
            disabled={busy || !info.job}
            onClick={() => void load()}
          >
            Retry loading
          </button>
        </div>
      )}
      {data &&
        (info.kind === 'secondary' ? (
          <div className="space-y-4">
            <button
              type="button"
              className="btn-outline-sharp text-xs"
              onClick={() => {
                const a = document.createElement('a');
                const url = URL.createObjectURL(
                  new Blob(
                    [
                      `>${data.sampleId}\nAA: ${data.amino_acids}\nPred: ${data.prediction}\nConf: ${data.confidence}\n`,
                    ],
                    { type: 'text/plain' },
                  ),
                );
                a.href = url;
                a.download = 'secondary-structure.txt';
                a.click();
                setTimeout(() => URL.revokeObjectURL(url), 1000);
              }}
            >
              Download S4PRED text
            </button>
            <SecondaryStructureViewer data={data} />
          </div>
        ) : (
          <div className="space-y-3">
            {data.method ? (
              <p className="font-mono text-xs font-semibold text-[var(--muted)]">
                Model source: <span className="text-[var(--navy)]">{data.method}</span>
              </p>
            ) : null}
            <Viewer pdb={data.pdb} sequence={data.sequence} sampleId={data.sampleId} />
          </div>
        ))}
    </div>
  );
}
