'use client';

import type { CleavageMode } from '@/data/mineralization-classes';

const BASALT = '#142a2c';
const VERDIGRIS = '#0f6865';
const PYRITE = '#c58a17';
const PYRITE_DARK = '#9a670c';
const STEEL = '#5a7270';

function ScissileCutMarker({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x}, ${y})`}>
      <line
        x1="0"
        y1="-22"
        x2="0"
        y2="22"
        stroke={PYRITE_DARK}
        strokeWidth="2"
        strokeDasharray="3.5 2.5"
      />
      <polygon points="-5,-22 5,-22 0,-13" fill={PYRITE_DARK} />
      <polygon points="-5,22 5,22 0,13" fill={PYRITE_DARK} />
    </g>
  );
}

export default function CatalyticMechanismSVG({
  mode,
  compartment,
  cofactorOrDyad,
  productLabel,
}: {
  mode: CleavageMode;
  compartment: string;
  cofactorOrDyad: string;
  productLabel: string;
}) {
  const midY = 44;

  return (
    <div className="w-full">
      <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2 font-mono text-[11px] text-[var(--muted)]">
        <span>{mode === 'amide' ? 'Amide Substrate' : 'NH₃⁺ (N-term)'}</span>
        <span className="font-semibold text-[var(--navy)]">{compartment}</span>
        <span>{mode === 'amide' ? 'Mineralized Product' : 'COO⁻ (C-term)'}</span>
      </div>

      <svg
        viewBox="0 0 560 88"
        className="block w-full select-none border border-[var(--line)] bg-white"
        role="img"
        aria-label={`Scissile bond schematic: ${cofactorOrDyad} yielding ${productLabel}`}
      >
        {mode === 'amide' ? (
          <g>
            <rect x="24" y={midY - 14} width="126" height="28" rx="2" fill={BASALT} />
            <text
              x="87"
              y={midY + 4}
              textAnchor="middle"
              fontSize="11.5"
              fontWeight="800"
              fill="#ffffff"
              fontFamily="ui-monospace, SFMono-Regular, monospace"
            >
              R–C(=O)
            </text>

            <line x1="150" y1={midY} x2="212" y2={midY} stroke={PYRITE_DARK} strokeWidth="4" />
            <ScissileCutMarker x={181} y={midY} />

            <rect
              x="212"
              y={midY - 14}
              width="66"
              height="28"
              rx="2"
              fill={PYRITE}
              stroke={BASALT}
              strokeWidth="1.2"
            />
            <text
              x="245"
              y={midY + 4}
              textAnchor="middle"
              fontSize="11.5"
              fontWeight="800"
              fill="#0c1b1d"
              fontFamily="ui-monospace, SFMono-Regular, monospace"
            >
              –NH₂
            </text>

            <line x1="296" y1={midY} x2="368" y2={midY} stroke={BASALT} strokeWidth="2.2" />
            <polygon points="366,39 376,44 366,49" fill={BASALT} />
            <text
              x="334"
              y={midY - 10}
              textAnchor="middle"
              fontSize="9.5"
              fontWeight="800"
              fill={VERDIGRIS}
              fontFamily="ui-monospace, SFMono-Regular, monospace"
            >
              + H₂O
            </text>

            <rect x="388" y={midY - 14} width="74" height="28" rx="2" fill={STEEL} />
            <text
              x="425"
              y={midY + 4}
              textAnchor="middle"
              fontSize="11"
              fontWeight="800"
              fill="#ffffff"
              fontFamily="ui-monospace, SFMono-Regular, monospace"
            >
              R–COO⁻
            </text>

            <rect
              x="472"
              y={midY - 15}
              width="66"
              height="30"
              rx="15"
              fill={PYRITE}
              stroke={BASALT}
              strokeWidth="1.6"
            />
            <text
              x="505"
              y={midY + 4}
              textAnchor="middle"
              fontSize="12"
              fontWeight="800"
              fill="#0c1b1d"
              fontFamily="ui-monospace, SFMono-Regular, monospace"
            >
              NH₄⁺
            </text>
          </g>
        ) : mode === 'dipeptide' ? (
          <g>
            <line x1="48" y1={midY} x2="320" y2={midY} stroke="#9ca39c" strokeWidth="3" />
            <rect
              x="64"
              y={midY - 14}
              width="96"
              height="28"
              rx="14"
              fill={VERDIGRIS}
              stroke={BASALT}
              strokeWidth="1.5"
            />
            <text
              x="112"
              y={midY + 4}
              textAnchor="middle"
              fontSize="11.5"
              fontWeight="800"
              fill="#ffffff"
              fontFamily="ui-monospace, SFMono-Regular, monospace"
            >
              H₃N⁺–P₁
            </text>
            <ScissileCutMarker x={186} y={midY} />
            <rect
              x="212"
              y={midY - 14}
              width="96"
              height="28"
              rx="14"
              fill={PYRITE}
              stroke={BASALT}
              strokeWidth="1.5"
            />
            <text
              x="260"
              y={midY + 4}
              textAnchor="middle"
              fontSize="11.5"
              fontWeight="800"
              fill="#0c1b1d"
              fontFamily="ui-monospace, SFMono-Regular, monospace"
            >
              P₁′–COO⁻
            </text>

            <line x1="332" y1={midY} x2="388" y2={midY} stroke={BASALT} strokeWidth="2.2" />
            <polygon points="386,39 396,44 386,49" fill={BASALT} />

            <circle cx="436" cy={midY} r="16" fill={VERDIGRIS} stroke={BASALT} strokeWidth="1.5" />
            <text
              x="436"
              y={midY + 4}
              textAnchor="middle"
              fontSize="10"
              fontWeight="800"
              fill="#ffffff"
              fontFamily="ui-monospace, SFMono-Regular, monospace"
            >
              AA₁
            </text>
            <text x="468" y={midY + 4} textAnchor="middle" fontSize="13" fontWeight="800" fill={BASALT}>
              +
            </text>
            <circle cx="500" cy={midY} r="16" fill={PYRITE} stroke={BASALT} strokeWidth="1.5" />
            <text
              x="500"
              y={midY + 4}
              textAnchor="middle"
              fontSize="10"
              fontWeight="800"
              fill="#0c1b1d"
              fontFamily="ui-monospace, SFMono-Regular, monospace"
            >
              AA₂
            </text>
          </g>
        ) : mode === 'omega' ? (
          <g>
            <line x1="150" y1={midY + 8} x2="520" y2={midY + 8} stroke="#9ca39c" strokeWidth="3" />
            <polygon
              points="46,44 74,24 114,24 128,44 100,62 60,62"
              fill={PYRITE}
              stroke={BASALT}
              strokeWidth="1.6"
            />
            <text
              x="87"
              y="47"
              textAnchor="middle"
              fontSize="10.5"
              fontWeight="800"
              fill="#0c1b1d"
              fontFamily="ui-monospace, SFMono-Regular, monospace"
            >
              pGlu/Iso
            </text>
            <line x1="128" y1="44" x2="188" y2={midY + 8} stroke={PYRITE_DARK} strokeWidth="3.4" />
            <ScissileCutMarker x={158} y={midY + 4} />

            {['P₁′', 'P₂′', 'P₃′', 'P₄′'].map((lbl, idx) => (
              <g key={lbl} transform={`translate(${192 + idx * 80}, ${midY - 5})`}>
                <rect width="64" height="26" rx="2" fill={idx === 0 ? VERDIGRIS : BASALT} />
                <text
                  x="32"
                  y="17"
                  textAnchor="middle"
                  fontSize="11"
                  fontWeight="800"
                  fill="#ffffff"
                  fontFamily="ui-monospace, SFMono-Regular, monospace"
                >
                  {lbl}
                </text>
              </g>
            ))}
          </g>
        ) : (
          <g>
            <line x1="18" y1={midY} x2="542" y2={midY} stroke="#9ca39c" strokeWidth="3" />
            <circle cx="18" cy={midY} r="3.5" fill={BASALT} />
            <circle cx="542" cy={midY} r="3.5" fill={PYRITE_DARK} />

            {(() => {
              const residues =
                mode === 'nterm_mono'
                  ? [
                      { label: 'P₁', fill: PYRITE, darkText: true },
                      { label: 'P₁′', fill: VERDIGRIS, darkText: false },
                      { label: 'P₂′', fill: BASALT, darkText: false },
                      { label: 'P₃′', fill: BASALT, darkText: false },
                      { label: 'P₄′', fill: STEEL, darkText: false },
                      { label: 'P₅′', fill: STEEL, darkText: false },
                    ]
                  : mode === 'nterm_di'
                    ? [
                        { label: 'P₂', fill: PYRITE, darkText: true },
                        { label: 'P₁', fill: PYRITE, darkText: true },
                        { label: 'P₁′', fill: VERDIGRIS, darkText: false },
                        { label: 'P₂′', fill: BASALT, darkText: false },
                        { label: 'P₃′', fill: STEEL, darkText: false },
                        { label: 'P₄′', fill: STEEL, darkText: false },
                      ]
                    : mode === 'cterm_mono'
                      ? [
                          { label: 'P₅', fill: STEEL, darkText: false },
                          { label: 'P₄', fill: STEEL, darkText: false },
                          { label: 'P₃', fill: BASALT, darkText: false },
                          { label: 'P₂', fill: BASALT, darkText: false },
                          { label: 'P₁', fill: VERDIGRIS, darkText: false },
                          { label: 'P₁′', fill: PYRITE, darkText: true },
                        ]
                      : [
                          { label: 'P₃', fill: STEEL, darkText: false },
                          { label: 'P₂', fill: BASALT, darkText: false },
                          { label: 'P₁', fill: VERDIGRIS, darkText: false },
                          { label: 'P₁′', fill: PYRITE, darkText: true },
                          { label: 'P₂′', fill: BASALT, darkText: false },
                          { label: 'P₃′', fill: STEEL, darkText: false },
                        ];

              const cutAfterIndex =
                mode === 'nterm_mono'
                  ? 0
                  : mode === 'nterm_di'
                    ? 1
                    : mode === 'cterm_mono'
                      ? 4
                      : 2;

              const startX = 36;
              const blockW = 66;
              const gap = 18;

              return (
                <>
                  {residues.map((res, idx) => {
                    const bx = startX + idx * (blockW + gap);
                    return (
                      <g key={`${res.label}-${idx}`}>
                        <rect
                          x={bx}
                          y={midY - 13}
                          width={blockW}
                          height="26"
                          rx={res.darkText ? '13' : '2'}
                          fill={res.fill}
                          stroke={res.darkText ? BASALT : 'none'}
                          strokeWidth={res.darkText ? '1.3' : '0'}
                        />
                        <text
                          x={bx + blockW / 2}
                          y={midY + 4}
                          textAnchor="middle"
                          fontSize="11"
                          fontWeight="800"
                          fill={res.darkText ? '#0c1b1d' : '#ffffff'}
                          fontFamily="ui-monospace, SFMono-Regular, monospace"
                        >
                          {res.label}
                        </text>
                        {idx === cutAfterIndex ? (
                          <ScissileCutMarker x={bx + blockW + gap / 2} y={midY} />
                        ) : null}
                      </g>
                    );
                  })}
                </>
              );
            })()}
          </g>
        )}

        <text
          x="18"
          y="81"
          fontSize="10"
          fontWeight="800"
          fill={BASALT}
          fontFamily="ui-monospace, SFMono-Regular, monospace"
        >
          ACTIVE SITE: {cofactorOrDyad.toUpperCase()}
        </text>
        <text
          x="542"
          y="81"
          textAnchor="end"
          fontSize="10"
          fontWeight="800"
          fill={PYRITE_DARK}
          fontFamily="ui-monospace, SFMono-Regular, monospace"
        >
          PRODUCT: {productLabel.toUpperCase()}
        </text>
      </svg>
    </div>
  );
}
