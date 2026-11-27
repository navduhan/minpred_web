'use client';

import { useEffect } from 'react';
import { withBasePath } from '@/lib/base-path';

function isStaleChunkError(err: Error & { digest?: string }) {
  const msg = `${err?.name || ''} ${err?.message || ''}`;
  return /ChunkLoadError|Loading chunk|Failed to fetch dynamically imported module|Importing a module script failed|not find module/i.test(
    msg,
  );
}

export default function RouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (!isStaleChunkError(error)) return;
    try {
      const guardKey = `minpred_chunk_reload_${window.location.pathname}`;
      const lastReload = Number(sessionStorage.getItem(guardKey) || '0');
      if (Date.now() - lastReload > 15_000) {
        sessionStorage.setItem(guardKey, String(Date.now()));
        window.location.reload();
      }
    } catch {
      window.location.reload();
    }
  }, [error]);

  return (
    <div className="mx-auto max-w-2xl py-16">
      <section className="surface space-y-4 p-8">
        <p className="eyebrow">Application Recovery</p>
        <h1 className="font-display text-2xl font-bold text-[var(--navy)]">
          Page update detected — reload required
        </h1>
        <p className="text-sm leading-relaxed text-[var(--muted)]">
          A newer version of MINpred was deployed while this tab was open, or a temporary network
          interruption occurred during navigation. Reloading fetches the updated interface cleanly.
        </p>
        <div className="flex flex-wrap gap-2.5 pt-1">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="btn-amber text-xs"
          >
            Reload Page
          </button>
          <button type="button" onClick={() => reset()} className="btn-outline-sharp text-xs">
            Try Again
          </button>
          <a href={withBasePath('/prediction')} className="btn-ghost-rule text-xs">
            Open Predict Directly →
          </a>
        </div>
      </section>
    </div>
  );
}
