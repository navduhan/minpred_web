'use client';

import type { DemoSequenceKey } from '@/data/demo-sequences';

const BASALT = '#142a2c';
const VERDIGRIS = '#0f6865';
const PYRITE = '#c58a17';
const PYRITE_DARK = '#9a670c';

const CASCADE_TRACKS: ReadonlyArray<{
  key: DemoSequenceKey;
  code: string;
  ecCount: string;
  stageTone: 'endo' | 'exo' | 'amide';
}> = [
  { key: 'serine', code: 'SEP', ecCount: '14 ECs', stageTone: 'endo' },
  { key: 'metalloendopeptidases', code: 'MEP', ecCount: '8 ECs', stageTone: 'endo' },
  { key: 'cysteine', code: 'CEP', ecCount: '4 ECs', stageTone: 'endo' },
  { key: 'aspartic', code: 'AEP', ecCount: '3 ECs', stageTone: 'endo' },
  { key: 'aminopeptidases', code: 'AP', ecCount: '6 ECs', stageTone: 'exo' },
  { key: 'dipeptidyl', code: 'DPP', ecCount: '4 ECs', stageTone: 'exo' },
  { key: 'omega', code: 'OP', ecCount: '3 ECs', stageTone: 'exo' },
  { key: 'metallopeptidases', code: 'MP', ecCount: '1+Oth', stageTone: 'exo' },
  { key: 'dipeptidases', code: 'DP', ecCount: '3 ECs', stageTone: 'exo' },
  { key: 'amidohydrolases', code: 'AH', ecCount: '6 ECs', stageTone: 'amide' },
];

export default function EsmCascadeSVG({
  selected,
  onSelect,
}: {
  selected: DemoSequenceKey;
  onSelect: (key: DemoSequenceKey) => void;
}) {
  const gx = 198;
  const gy = 38;
  const cellSize = 11.4;
  const gridDim = 14;

  return (
    <svg
      viewBox="0 0 820 278"
      className="block w-full select-none bg-white"
      role="img"
      aria-label="MINpred computational cascade: overlap-averaged 1,022-residue sliding windows into 1,280-D ESM-2 embeddings, Gate I enzyme filter, Gate II mineralization filter, and Gate III/IV 10-class EC specialist heads"
    >
      {/* STAGE A: LONG POLYPEPTIDE & OVERLAPPING 1,022-AA WINDOWS */}
      <g aria-hidden="true">
        <line x1="18" y1="62" x2="158" y2="62" stroke={BASALT} strokeWidth="2" />
        {Array.from({ length: 11 }, (_, idx) => {
          const cx = 24 + idx * 12.6;
          const fill = idx % 3 === 0 ? PYRITE : idx % 2 === 0 ? VERDIGRIS : BASALT;
          return <circle key={idx} cx={cx.toFixed(1)} cy="62" r="3.6" fill={fill} />;
        })}
        <text
          x="18"
          y="48"
          fontSize="9.5"
          fontWeight="800"
          fill="#4f6162"
          fontFamily="ui-monospace, SFMono-Regular, monospace"
        >
          FASTA (UP TO 5,000 AA)
        </text>

        <rect x="18" y="88" width="84" height="16" rx="2" fill={BASALT} />
        <text
          x="60"
          y="99.5"
          textAnchor="middle"
          fontSize="8.5"
          fontWeight="800"
          fill="#ffffff"
          fontFamily="ui-monospace, SFMono-Regular, monospace"
        >
          [1 … 1022]
        </text>
        <polyline points="102,96 170,96 170,82 188,82" fill="none" stroke={BASALT} strokeWidth="1.6" />
        <polygon points="186,78.5 193,82 186,85.5" fill={BASALT} />

        <rect x="42" y="114" width="84" height="16" rx="2" fill={VERDIGRIS} />
        <text
          x="84"
          y="125.5"
          textAnchor="middle"
          fontSize="8.5"
          fontWeight="800"
          fill="#ffffff"
          fontFamily="ui-monospace, SFMono-Regular, monospace"
        >
          [512 … 1533]
        </text>
        <line x1="126" y1="122" x2="188" y2="122" stroke={VERDIGRIS} strokeWidth="1.6" />
        <polygon points="186,118.5 193,122 186,125.5" fill={VERDIGRIS} />

        <rect x="66" y="140" width="84" height="16" rx="2" fill={PYRITE} stroke={BASALT} strokeWidth="1" />
        <text
          x="108"
          y="151.5"
          textAnchor="middle"
          fontSize="8.5"
          fontWeight="800"
          fill="#0c1b1d"
          fontFamily="ui-monospace, SFMono-Regular, monospace"
        >
          [L−1022 … L]
        </text>
        <polyline
          points="150,148 170,148 170,162 188,162"
          fill="none"
          stroke={PYRITE_DARK}
          strokeWidth="1.6"
        />
        <polygon points="186,158.5 193,162 186,165.5" fill={PYRITE_DARK} />

        <text
          x="86"
          y="182"
          textAnchor="middle"
          fontSize="8.5"
          fontWeight="700"
          fill="#4f6162"
          fontFamily="ui-monospace, SFMono-Regular, monospace"
        >
          511-aa stride · mean pool
        </text>
      </g>

      <text
        x="88"
        y="258"
        textAnchor="middle"
        fontSize="9.5"
        fontWeight="800"
        fill="#4f6162"
        fontFamily="ui-monospace, SFMono-Regular, monospace"
      >
        01 · WINDOWED INPUT
      </text>

      {/* STAGE B: 33-LAYER ESM-2 (650M) 1,280-D LATTICE */}
      <g aria-hidden="true">
        {Array.from({ length: gridDim }, (_, r) =>
          Array.from({ length: gridDim }, (__, c) => {
            const isPrimary = (r * 7 + c * 3) % 11 === 0;
            const isTeal = (r * 5 + c * 9) % 7 === 0;
            const isNavy = (r + c) % 4 === 0;
            const fill = isPrimary ? PYRITE : isTeal ? VERDIGRIS : isNavy ? BASALT : '#e5e2d9';
            return (
              <rect
                key={`${r}-${c}`}
                x={(gx + c * cellSize).toFixed(1)}
                y={(gy + r * cellSize).toFixed(1)}
                width={(cellSize - 1.8).toFixed(1)}
                height={(cellSize - 1.8).toFixed(1)}
                fill={fill}
              />
            );
          }),
        )}
      </g>
      <text
        x={gx + (gridDim * cellSize) / 2}
        y="258"
        textAnchor="middle"
        fontSize="9.5"
        fontWeight="800"
        fill="#4f6162"
        fontFamily="ui-monospace, SFMono-Regular, monospace"
      >
        02 · ESM-2 650M (1,280-D)
      </text>

      {/* STAGE C: SEQUENTIAL BINARY GATES I & II */}
      <g aria-hidden="true">
        {[56, 180].map((ry) => (
          <g key={ry}>
            <line x1="364" y1={ry} x2="404" y2={ry} stroke="#d6d3c9" strokeWidth="2.2" />
            <line x1="404" y1={ry - 6} x2="404" y2={ry + 6} stroke="#9ca39c" strokeWidth="2.4" />
          </g>
        ))}

        <line x1="364" y1="96" x2="484" y2="96" stroke={BASALT} strokeWidth="2.2" />
        <line x1="364" y1="118" x2="484" y2="118" stroke={VERDIGRIS} strokeWidth="2.2" />
        <line x1="364" y1="140" x2="484" y2="140" stroke={PYRITE_DARK} strokeWidth="2.2" />

        {[74, 162].map((ry) => (
          <g key={ry}>
            <line
              x1="364"
              y1={ry}
              x2="466"
              y2={ry}
              stroke="#9ca39c"
              strokeWidth="1.8"
              strokeDasharray="3 2"
            />
            <line x1="466" y1={ry - 6} x2="466" y2={ry + 6} stroke="#687677" strokeWidth="2.4" />
          </g>
        ))}

        <rect x="412" y="28" width="20" height="196" rx="2" fill={BASALT} />
        <text
          x="422"
          y="126"
          textAnchor="middle"
          fontSize="9"
          fontWeight="800"
          fill="#ffffff"
          fontFamily="ui-monospace, SFMono-Regular, monospace"
          transform="rotate(-90 422 126)"
        >
          GATE I · ENZYME (0.954)
        </text>

        <rect x="474" y="28" width="20" height="196" rx="2" fill={VERDIGRIS} />
        <text
          x="484"
          y="126"
          textAnchor="middle"
          fontSize="9"
          fontWeight="800"
          fill="#ffffff"
          fontFamily="ui-monospace, SFMono-Regular, monospace"
          transform="rotate(-90 484 126)"
        >
          GATE II · N-MIN (0.936)
        </text>
      </g>

      <text
        x="452"
        y="258"
        textAnchor="middle"
        fontSize="9.5"
        fontWeight="800"
        fill="#4f6162"
        fontFamily="ui-monospace, SFMono-Regular, monospace"
      >
        03 · GATES I–II (&lt;40% ID)
      </text>

      {/* STAGE D: GATE III 10-CLASS ROUTER & GATE IV EC HEADS */}
      {CASCADE_TRACKS.map((t, idx) => {
        const y = 26 + idx * 22.8;
        const gateY = 92 + (idx - 4.5) * 9.5;
        const active = selected === t.key;
        const toneColor =
          t.stageTone === 'endo' ? BASALT : t.stageTone === 'exo' ? VERDIGRIS : PYRITE_DARK;

        return (
          <g
            key={t.key}
            onClick={() => onSelect(t.key)}
            className="svg-enzyme"
            role="button"
            tabIndex={0}
            aria-label={`Select ${t.code} (${t.ecCount})`}
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onSelect(t.key)}
          >
            <path
              d={`M 494 ${gateY.toFixed(1)} C 538 ${gateY.toFixed(1)}, 548 ${y.toFixed(1)}, 588 ${y.toFixed(1)}`}
              fill="none"
              stroke={active ? PYRITE_DARK : toneColor}
              strokeWidth={active ? '2.6' : '1.35'}
              opacity={active ? '1' : '0.48'}
            />

            <g transform={`translate(0, ${y.toFixed(1)})`}>
              <line
                x1="588"
                y1="0"
                x2="668"
                y2="0"
                stroke={active ? PYRITE_DARK : '#d6d3c9'}
                strokeWidth={active ? '2.3' : '1.4'}
              />

              {t.stageTone === 'endo' ? (
                <polygon points="622,-5.5 634,0 622,5.5 626,0" fill={active ? PYRITE_DARK : BASALT} />
              ) : t.stageTone === 'exo' ? (
                <circle cx="628" cy="0" r="4.8" fill={active ? PYRITE_DARK : VERDIGRIS} />
              ) : (
                <polygon points="628,-6 634,4 622,4" fill={PYRITE_DARK} />
              )}

              <text
                x="678"
                y="4"
                fontSize="11"
                fontWeight="800"
                fill={active ? PYRITE_DARK : BASALT}
                fontFamily="ui-monospace, SFMono-Regular, monospace"
              >
                {t.code}
              </text>

              <rect
                x="722"
                y="-8.5"
                width="78"
                height="17"
                rx="2"
                fill={active ? PYRITE : '#f5f2eb'}
                stroke={active ? PYRITE_DARK : '#d6d3c9'}
                strokeWidth="1.2"
              />
              <text
                x="761"
                y="3.5"
                textAnchor="middle"
                fontSize="9.5"
                fontWeight="800"
                fill={active ? '#0c1b1d' : '#142a2c'}
                fontFamily="ui-monospace, SFMono-Regular, monospace"
              >
                {t.ecCount}
              </text>
            </g>
          </g>
        );
      })}

      <text
        x="686"
        y="258"
        textAnchor="middle"
        fontSize="9.5"
        fontWeight="800"
        fill="#4f6162"
        fontFamily="ui-monospace, SFMono-Regular, monospace"
      >
        04 · GATES III–IV (52 ECs · 96.1%)
      </text>
    </svg>
  );
}
