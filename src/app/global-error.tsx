'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    const msg = `${error?.name || ''} ${error?.message || ''}`;
    if (
      /ChunkLoadError|Loading chunk|Failed to fetch dynamically imported module|Importing a module script failed|not find module/i.test(
        msg,
      )
    ) {
      try {
        const key = 'minpred_global_chunk_reload';
        const last = Number(sessionStorage.getItem(key) || '0');
        if (Date.now() - last > 15_000) {
          sessionStorage.setItem(key, String(Date.now()));
          window.location.reload();
        }
      } catch {
        window.location.reload();
      }
    }
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          padding: '4rem 1.5rem',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif',
          background: '#ffffff',
          color: '#142425',
        }}
      >
        <div
          style={{
            maxWidth: '36rem',
            margin: '0 auto',
            border: '1px solid #d6d3c9',
            borderTop: '3px solid #142a2c',
            padding: '2rem',
          }}
        >
          <h1 style={{ fontSize: '1.35rem', margin: '0 0 0.75rem', color: '#142a2c' }}>
            MINpred was updated — please reload
          </h1>
          <p style={{ fontSize: '0.9rem', lineHeight: 1.55, color: '#4f6162', margin: '0 0 1.25rem' }}>
            This browser tab cached an earlier page version before the latest deployment. Reloading
            loads the current build cleanly.
          </p>
          <div style={{ display: 'flex', gap: '0.6rem' }}>
            <button
              type="button"
              onClick={() => window.location.reload()}
              style={{
                background: '#c58a17',
                color: '#0c1b1d',
                border: '1px solid #a8730e',
                padding: '0.55rem 1rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Reload Page
            </button>
            <button
              type="button"
              onClick={() => reset()}
              style={{
                background: '#ffffff',
                color: '#142a2c',
                border: '1px solid #142a2c',
                padding: '0.55rem 1rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Try Again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
