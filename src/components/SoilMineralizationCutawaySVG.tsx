'use client';

import type { DemoSequenceKey } from '@/data/demo-sequences';

const BASALT = '#142a2c';
const VERDIGRIS = '#0f6865';
const PYRITE = '#c58a17';
const STEEL = '#5a7270';
const LIGHT_STONE = '#9ab0ad';

// Precompute vertical curved phospholipid bilayer separating extracellular soil matrix
// from microbial periplasmic/cellular peptide processing
const ARC_CX = 885;
const ARC_CY = 208;
const R_OUT = 468;
const R_IN = 434;

const BILAYER_ANGLES: number[] = [];
for (let deg = 158; deg <= 202; deg += 1.35) {
  if ([171, 190].some((gap) => Math.abs(deg - gap) < 1.9)) continue;
  BILAYER_ANGLES.push(deg);
}

export default function SoilMineralizationCutawaySVG({
  selected,
  onSelect,
}: {
  selected: DemoSequenceKey;
  onSelect: (key: DemoSequenceKey) => void;
}) {
  const isSel = (k: DemoSequenceKey) => selected === k;
  const stroke = (k: DemoSequenceKey) => (isSel(k) ? '#9a670c' : BASALT);
  const badgeFill = (k: DemoSequenceKey) => (isSel(k) ? PYRITE : '#ffffff');
  const badgeText = (k: DemoSequenceKey) => (isSel(k) ? '#0c1b1d' : BASALT);

  return (
    <svg
      viewBox="0 0 1120 416"
      className="block w-full select-none bg-white"
      role="img"
      aria-label="Interactive soil-to-root nitrogen mineralization cutaway showing 4 extracellular endopeptidases, 5 microbial exopeptidases and dipeptidases, trimeric amidohydrolase ammonification, and plant root hair ammonium uptake"
    >
      <defs>
        <marker
          id="mp-flux-basalt"
          viewBox="0 0 10 10"
          refX="7.5"
          refY="5"
          markerWidth="5.5"
          markerHeight="5.5"
          orient="auto-start-reverse"
        >
          <path d="M 0 1 L 10 5 L 0 9 z" fill={BASALT} />
        </marker>
        <marker
          id="mp-flux-pyrite"
          viewBox="0 0 10 10"
          refX="7.5"
          refY="5"
          markerWidth="5.5"
          markerHeight="5.5"
          orient="auto-start-reverse"
        >
          <path d="M 0 1 L 10 5 L 0 9 z" fill="#9a670c" />
        </marker>
      </defs>

      {/* Top Compartment Scale Bar */}
      <text
        x="20"
        y="24"
        fontSize="10.5"
        fontWeight="800"
        fill="#4f6162"
        fontFamily="ui-monospace, SFMono-Regular, monospace"
      >
        01 · SOIL MINERAL-ORGANIC MATRIX (DEPOLYMERIZATION)
      </text>
      <text
        x="458"
        y="24"
        fontSize="10.5"
        fontWeight="800"
        fill={VERDIGRIS}
        fontFamily="ui-monospace, SFMono-Regular, monospace"
      >
        02 · MICROBIAL PEPTIDE CLEAVAGE
      </text>
      <text
        x="748"
        y="24"
        fontSize="10.5"
        fontWeight="800"
        fill="#9a670c"
        fontFamily="ui-monospace, SFMono-Regular, monospace"
      >
        03 · AMMONIFICATION &amp; ROOT NH₄⁺ UPTAKE
      </text>
      <line x1="18" y1="33" x2="1102" y2="33" stroke="#d6d3c9" strokeWidth="1" />

      {/* ==================== LEFT MARGIN: FACETED SOIL MINERAL POLYHEDRA ==================== */}
      <g aria-hidden="true">
        <polygon
          points="16,66 64,44 102,78 88,128 36,138 14,98"
          fill={STEEL}
          stroke={BASALT}
          strokeWidth="1.6"
        />
        <path
          d="M 16 66 L 58 92 L 102 78 M 58 92 L 88 128 M 58 92 L 36 138 M 64 44 L 58 92"
          fill="none"
          stroke={BASALT}
          strokeWidth="1.1"
          opacity="0.7"
        />

        <polygon
          points="108,48 136,60 128,90 98,82"
          fill="#d4a02c"
          stroke={BASALT}
          strokeWidth="1.5"
        />
        <line x1="108" y1="48" x2="128" y2="90" stroke={BASALT} strokeWidth="1" opacity="0.65" />

        <polygon
          points="18,162 72,146 112,184 96,236 42,244 14,204"
          fill={PYRITE}
          stroke={BASALT}
          strokeWidth="1.6"
        />
        <path
          d="M 72 146 L 66 196 L 112 184 M 18 162 L 66 196 L 42 244 M 66 196 L 96 236"
          fill="none"
          stroke={BASALT}
          strokeWidth="1.1"
          opacity="0.72"
        />

        <polygon
          points="20,264 68,254 90,290 62,324 22,308"
          fill={LIGHT_STONE}
          stroke={BASALT}
          strokeWidth="1.5"
        />
        <path
          d="M 20 264 L 56 288 L 90 290 M 68 254 L 56 288 L 62 324"
          fill="none"
          stroke={BASALT}
          strokeWidth="1.1"
          opacity="0.65"
        />

        <polygon
          points="26,338 82,326 116,360 98,396 38,398 18,368"
          fill={STEEL}
          stroke={BASALT}
          strokeWidth="1.6"
        />
        <path
          d="M 82 326 L 70 364 L 116 360 M 26 338 L 70 364 L 38 398"
          fill="none"
          stroke={BASALT}
          strokeWidth="1.1"
          opacity="0.7"
        />
      </g>

      {/* ==================== POLYMERIC SOIL PROTEIN CHAINS (ZONE 1) ==================== */}
      <g aria-hidden="true">
        <path
          d="M 96 106 C 138 62, 168 142, 198 96 C 228 52, 278 66, 308 106 C 334 140, 362 92, 392 114"
          fill="none"
          stroke={BASALT}
          strokeWidth="4.2"
          strokeLinecap="round"
        />
        <path
          d="M 106 196 C 144 156, 152 224, 194 198 C 236 172, 252 254, 298 242 C 340 232, 356 196, 388 206"
          fill="none"
          stroke={BASALT}
          strokeWidth="4.2"
          strokeLinecap="round"
        />
        <path
          d="M 90 304 C 136 276, 152 356, 206 334 C 254 314, 282 368, 336 336 C 364 318, 378 334, 404 318"
          fill="none"
          stroke={BASALT}
          strokeWidth="4.2"
          strokeLinecap="round"
        />
        <path
          d="M 142 132 C 176 146, 158 264, 192 288"
          fill="none"
          stroke={PYRITE}
          strokeWidth="2.6"
          strokeDasharray="6 4"
          opacity="0.85"
        />

        <path
          d="M 382 132 L 434 142"
          fill="none"
          stroke={VERDIGRIS}
          strokeWidth="2.2"
          markerEnd="url(#mp-flux-basalt)"
        />
        <path
          d="M 384 268 L 434 264"
          fill="none"
          stroke={VERDIGRIS}
          strokeWidth="2.2"
          markerEnd="url(#mp-flux-basalt)"
        />
      </g>

      {/* ==================== 1. SEP (Serine Endopeptidases · EC 3.4.21) ==================== */}
      <g
        onClick={() => onSelect('serine')}
        className="svg-enzyme"
        transform="translate(260, 88)"
        role="button"
        tabIndex={0}
        aria-label="SEP: Serine endopeptidases (EC 3.4.21)"
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onSelect('serine')}
      >
        {isSel('serine') ? <circle cx="0" cy="4" r="46" fill={PYRITE} opacity="0.16" /> : null}
        <g transform="rotate(-16)">
          <polygon
            points="-6,-4 32,-16 28,-4 -4,4"
            fill={PYRITE}
            stroke={BASALT}
            strokeWidth="1.6"
          />
          <polygon
            points="-6,4 32,16 28,4 -4,-4"
            fill={VERDIGRIS}
            stroke={BASALT}
            strokeWidth="1.6"
          />
          <circle cx="-15" cy="-11" r="8.5" fill="#ffffff" stroke={stroke('serine')} strokeWidth="2.6" />
          <circle cx="-15" cy="11" r="8.5" fill="#ffffff" stroke={stroke('serine')} strokeWidth="2.6" />
          <circle cx="-2" cy="0" r="3" fill={BASALT} />
        </g>
        <rect
          x="-26"
          y="25"
          width="52"
          height="20"
          rx="2"
          fill={badgeFill('serine')}
          stroke={stroke('serine')}
          strokeWidth="1.6"
        />
        <text
          x="0"
          y="39"
          textAnchor="middle"
          fontSize="11.5"
          fontWeight="800"
          fill={badgeText('serine')}
          fontFamily="ui-monospace, SFMono-Regular, monospace"
        >
          SEP
        </text>
      </g>

      {/* ==================== 2. MEP (Metalloendopeptidases · EC 3.4.24) ==================== */}
      <g
        onClick={() => onSelect('metalloendopeptidases')}
        className="svg-enzyme"
        transform="translate(192, 192)"
        role="button"
        tabIndex={0}
        aria-label="MEP: Metalloendopeptidases (EC 3.4.24)"
        onKeyDown={(e) =>
          (e.key === 'Enter' || e.key === ' ') && onSelect('metalloendopeptidases')
        }
      >
        {isSel('metalloendopeptidases') ? (
          <circle cx="0" cy="4" r="46" fill={PYRITE} opacity="0.16" />
        ) : null}
        <path
          d="M -20 -20 L -20 4 A 20 20 0 0 0 20 4 L 20 -20 L 9 -20 L 9 3 A 9 9 0 0 1 -9 3 L -9 -20 Z"
          fill={isSel('metalloendopeptidases') ? PYRITE : VERDIGRIS}
          stroke={BASALT}
          strokeWidth="1.8"
        />
        <circle cx="0" cy="-4" r="6.2" fill={PYRITE} stroke={BASALT} strokeWidth="1.4" />
        <text
          x="0"
          y="-1"
          textAnchor="middle"
          fontSize="7.5"
          fontWeight="800"
          fill="#0c1b1d"
          fontFamily="ui-monospace, SFMono-Regular, monospace"
        >
          Zn
        </text>
        <rect
          x="-26"
          y="27"
          width="52"
          height="20"
          rx="2"
          fill={badgeFill('metalloendopeptidases')}
          stroke={stroke('metalloendopeptidases')}
          strokeWidth="1.6"
        />
        <text
          x="0"
          y="41"
          textAnchor="middle"
          fontSize="11.5"
          fontWeight="800"
          fill={badgeText('metalloendopeptidases')}
          fontFamily="ui-monospace, SFMono-Regular, monospace"
        >
          MEP
        </text>
      </g>

      {/* ==================== 3. CEP (Cysteine Endopeptidases · EC 3.4.22) ==================== */}
      <g
        onClick={() => onSelect('cysteine')}
        className="svg-enzyme"
        transform="translate(314, 232)"
        role="button"
        tabIndex={0}
        aria-label="CEP: Cysteine endopeptidases (EC 3.4.22)"
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onSelect('cysteine')}
      >
        {isSel('cysteine') ? <circle cx="0" cy="4" r="46" fill={PYRITE} opacity="0.16" /> : null}
        <polygon
          points="0,-24 24,0 8,16 0,6 -8,16 -24,0"
          fill={isSel('cysteine') ? PYRITE : STEEL}
          stroke={BASALT}
          strokeWidth="1.8"
        />
        <circle cx="0" cy="-5" r="4.8" fill={PYRITE} stroke={BASALT} strokeWidth="1.3" />
        <rect
          x="-26"
          y="23"
          width="52"
          height="20"
          rx="2"
          fill={badgeFill('cysteine')}
          stroke={stroke('cysteine')}
          strokeWidth="1.6"
        />
        <text
          x="0"
          y="37"
          textAnchor="middle"
          fontSize="11.5"
          fontWeight="800"
          fill={badgeText('cysteine')}
          fontFamily="ui-monospace, SFMono-Regular, monospace"
        >
          CEP
        </text>
      </g>

      {/* ==================== 4. AEP (Aspartic Endopeptidases · EC 3.4.23) ==================== */}
      <g
        onClick={() => onSelect('aspartic')}
        className="svg-enzyme"
        transform="translate(232, 334)"
        role="button"
        tabIndex={0}
        aria-label="AEP: Aspartic endopeptidases (EC 3.4.23)"
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onSelect('aspartic')}
      >
        {isSel('aspartic') ? <circle cx="0" cy="4" r="46" fill={PYRITE} opacity="0.16" /> : null}
        <path
          d="M -22 -6 C -22 -24, -2 -24, 0 -10 C 2 -24, 22 -24, 22 -6 C 22 10, 10 18, 4 12 L 0 4 L -4 12 C -10 18, -22 10, -22 -6 Z"
          fill={isSel('aspartic') ? PYRITE : BASALT}
          stroke={BASALT}
          strokeWidth="1.8"
        />
        <circle cx="-6" cy="-6" r="3.2" fill={PYRITE} />
        <circle cx="6" cy="-6" r="3.2" fill="#ffffff" />
        <rect
          x="-26"
          y="21"
          width="52"
          height="20"
          rx="2"
          fill={badgeFill('aspartic')}
          stroke={stroke('aspartic')}
          strokeWidth="1.6"
        />
        <text
          x="0"
          y="35"
          textAnchor="middle"
          fontSize="11.5"
          fontWeight="800"
          fill={badgeText('aspartic')}
          fontFamily="ui-monospace, SFMono-Regular, monospace"
        >
          AEP
        </text>
      </g>

      {/* ==================== CURVED MICROBIAL PHOSPHOLIPID BILAYER ==================== */}
      <g aria-hidden="true">
        {BILAYER_ANGLES.map((deg, idx) => {
          const rad = (deg * Math.PI) / 180;
          const xOut = ARC_CX + R_OUT * Math.cos(rad);
          const yOut = ARC_CY + R_OUT * Math.sin(rad);
          const xIn = ARC_CX + R_IN * Math.cos(rad);
          const yIn = ARC_CY + R_IN * Math.sin(rad);
          const xmOut = ARC_CX + (R_OUT - 13) * Math.cos(rad);
          const ymOut = ARC_CY + (R_OUT - 13) * Math.sin(rad);
          const xmIn = ARC_CX + (R_IN + 13) * Math.cos(rad);
          const ymIn = ARC_CY + (R_IN + 13) * Math.sin(rad);
          return (
            <g key={idx}>
              <line
                x1={xOut.toFixed(1)}
                y1={yOut.toFixed(1)}
                x2={xmOut.toFixed(1)}
                y2={ymOut.toFixed(1)}
                stroke="#687677"
                strokeWidth="1.1"
              />
              <line
                x1={xIn.toFixed(1)}
                y1={yIn.toFixed(1)}
                x2={xmIn.toFixed(1)}
                y2={ymIn.toFixed(1)}
                stroke="#687677"
                strokeWidth="1.1"
              />
              <circle
                cx={xOut.toFixed(1)}
                cy={yOut.toFixed(1)}
                r="4.2"
                fill={LIGHT_STONE}
                stroke={BASALT}
                strokeWidth="1"
              />
              <circle
                cx={xIn.toFixed(1)}
                cy={yIn.toFixed(1)}
                r="4.2"
                fill={LIGHT_STONE}
                stroke={BASALT}
                strokeWidth="1"
              />
            </g>
          );
        })}

        {[143, 273].map((cyChannel, cIdx) => (
          <g key={cIdx} transform={`translate(438, ${cyChannel})`}>
            <rect x="-18" y="-13" width="38" height="8" rx="4" fill={VERDIGRIS} stroke={BASALT} strokeWidth="1.3" />
            <rect x="-18" y="5" width="38" height="8" rx="4" fill={VERDIGRIS} stroke={BASALT} strokeWidth="1.3" />
          </g>
        ))}
      </g>

      {/* ==================== ZONE 2: 5 MICROBIAL EXOPEPTIDASE & DIPEPTIDASE TRACKS ==================== */}

      {/* 5. AP (Aminopeptidases · EC 3.4.11) */}
      <g
        onClick={() => onSelect('aminopeptidases')}
        className="svg-enzyme"
        transform="translate(578, 76)"
        role="button"
        tabIndex={0}
        aria-label="AP: Aminopeptidases (EC 3.4.11)"
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onSelect('aminopeptidases')}
      >
        {isSel('aminopeptidases') ? <rect x="-86" y="-24" width="212" height="48" rx="2" fill={PYRITE} opacity="0.14" /> : null}
        <polyline points="-76,4 -58,-4 -40,4 -26,-2" fill="none" stroke={BASALT} strokeWidth="3.2" />
        <path
          d="M 14 -9 A 17 17 0 1 0 14 9 L 2 0 Z"
          fill={isSel('aminopeptidases') ? PYRITE : VERDIGRIS}
          stroke={BASALT}
          strokeWidth="1.7"
        />
        <circle cx="30" cy="-7" r="4.3" fill={PYRITE} stroke={BASALT} strokeWidth="1.1" />
        <circle cx="43" cy="2" r="4.3" fill={PYRITE} stroke={BASALT} strokeWidth="1.1" />
        <circle cx="31" cy="9" r="4.3" fill={VERDIGRIS} stroke={BASALT} strokeWidth="1.1" />
        <rect
          x="64"
          y="-10"
          width="48"
          height="20"
          rx="2"
          fill={badgeFill('aminopeptidases')}
          stroke={stroke('aminopeptidases')}
          strokeWidth="1.6"
        />
        <text
          x="88"
          y="4"
          textAnchor="middle"
          fontSize="11.5"
          fontWeight="800"
          fill={badgeText('aminopeptidases')}
          fontFamily="ui-monospace, SFMono-Regular, monospace"
        >
          AP
        </text>
      </g>

      {/* 6. DPP (Dipeptidyl-peptidases · EC 3.4.14) */}
      <g
        onClick={() => onSelect('dipeptidyl')}
        className="svg-enzyme"
        transform="translate(578, 142)"
        role="button"
        tabIndex={0}
        aria-label="DPP: Dipeptidyl-peptidases (EC 3.4.14)"
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onSelect('dipeptidyl')}
      >
        {isSel('dipeptidyl') ? <rect x="-86" y="-24" width="212" height="48" rx="2" fill={PYRITE} opacity="0.14" /> : null}
        <line x1="-76" y1="0" x2="-32" y2="0" stroke={BASALT} strokeWidth="3.4" strokeDasharray="9 3" />
        <polygon
          points="-14,-16 10,-16 20,0 10,16 -14,16 -6,0"
          fill={isSel('dipeptidyl') ? PYRITE : BASALT}
          stroke={BASALT}
          strokeWidth="1.6"
        />
        <rect x="28" y="-8" width="18" height="6" rx="1.5" fill={VERDIGRIS} stroke={BASALT} strokeWidth="1" />
        <rect x="32" y="3" width="18" height="6" rx="1.5" fill={PYRITE} stroke={BASALT} strokeWidth="1" />
        <rect
          x="64"
          y="-10"
          width="48"
          height="20"
          rx="2"
          fill={badgeFill('dipeptidyl')}
          stroke={stroke('dipeptidyl')}
          strokeWidth="1.6"
        />
        <text
          x="88"
          y="4"
          textAnchor="middle"
          fontSize="11.5"
          fontWeight="800"
          fill={badgeText('dipeptidyl')}
          fontFamily="ui-monospace, SFMono-Regular, monospace"
        >
          DPP
        </text>
      </g>

      {/* 7. OP (Omega peptidases · EC 3.4.19) */}
      <g
        onClick={() => onSelect('omega')}
        className="svg-enzyme"
        transform="translate(578, 208)"
        role="button"
        tabIndex={0}
        aria-label="OP: Omega peptidases (EC 3.4.19)"
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onSelect('omega')}
      >
        {isSel('omega') ? <rect x="-86" y="-24" width="212" height="48" rx="2" fill={PYRITE} opacity="0.14" /> : null}
        <line x1="-74" y1="4" x2="-34" y2="4" stroke={BASALT} strokeWidth="3" />
        <line x1="-54" y1="4" x2="-42" y2="-10" stroke={PYRITE} strokeWidth="2.8" />
        <polygon points="-42,-15 -36,-10 -42,-5 -48,-10" fill={PYRITE} stroke={BASALT} strokeWidth="0.9" />
        <path
          d="M 12 -15 A 17 17 0 1 0 12 15 A 12 12 0 1 1 12 -15 Z"
          fill={isSel('omega') ? PYRITE : VERDIGRIS}
          stroke={BASALT}
          strokeWidth="1.7"
        />
        <circle cx="30" cy="-4" r="4.3" fill={VERDIGRIS} stroke={BASALT} strokeWidth="1.1" />
        <line x1="28" y1="7" x2="48" y2="7" stroke={BASALT} strokeWidth="3" />
        <rect
          x="64"
          y="-10"
          width="48"
          height="20"
          rx="2"
          fill={badgeFill('omega')}
          stroke={stroke('omega')}
          strokeWidth="1.6"
        />
        <text
          x="88"
          y="4"
          textAnchor="middle"
          fontSize="11.5"
          fontWeight="800"
          fill={badgeText('omega')}
          fontFamily="ui-monospace, SFMono-Regular, monospace"
        >
          OP
        </text>
      </g>

      {/* 8. MP (Metallopeptidases · EC 3.4.17) */}
      <g
        onClick={() => onSelect('metallopeptidases')}
        className="svg-enzyme"
        transform="translate(578, 274)"
        role="button"
        tabIndex={0}
        aria-label="MP: Metallopeptidases / metallocarboxypeptidases (EC 3.4.17)"
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onSelect('metallopeptidases')}
      >
        {isSel('metallopeptidases') ? (
          <rect x="-86" y="-24" width="212" height="48" rx="2" fill={PYRITE} opacity="0.14" />
        ) : null}
        <line x1="-74" y1="0" x2="-36" y2="0" stroke={BASALT} strokeWidth="3.2" />
        <rect x="-40" y="-4" width="9" height="8" fill={PYRITE} stroke={BASALT} strokeWidth="0.9" />
        <path
          d="M -16 -6 C -16 -18, 14 -18, 16 -4 L 4 0 L 16 4 C 14 18, -16 18, -16 6 Z"
          fill={isSel('metallopeptidases') ? PYRITE : STEEL}
          stroke={BASALT}
          strokeWidth="1.7"
        />
        <circle cx="-3" cy="0" r="3.8" fill="#ffffff" stroke={BASALT} strokeWidth="1.2" />
        <circle cx="31" cy="-5" r="4.3" fill={PYRITE} stroke={BASALT} strokeWidth="1.1" />
        <circle cx="44" cy="4" r="4.3" fill={PYRITE} stroke={BASALT} strokeWidth="1.1" />
        <rect
          x="64"
          y="-10"
          width="48"
          height="20"
          rx="2"
          fill={badgeFill('metallopeptidases')}
          stroke={stroke('metallopeptidases')}
          strokeWidth="1.6"
        />
        <text
          x="88"
          y="4"
          textAnchor="middle"
          fontSize="11.5"
          fontWeight="800"
          fill={badgeText('metallopeptidases')}
          fontFamily="ui-monospace, SFMono-Regular, monospace"
        >
          MP
        </text>
      </g>

      {/* 9. DP (Dipeptidases · EC 3.4.13) */}
      <g
        onClick={() => onSelect('dipeptidases')}
        className="svg-enzyme"
        transform="translate(578, 340)"
        role="button"
        tabIndex={0}
        aria-label="DP: Dipeptidases (EC 3.4.13)"
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onSelect('dipeptidases')}
      >
        {isSel('dipeptidases') ? <rect x="-86" y="-24" width="212" height="48" rx="2" fill={PYRITE} opacity="0.14" /> : null}
        <circle cx="-62" cy="0" r="4.8" fill={VERDIGRIS} stroke={BASALT} strokeWidth="1.2" />
        <line x1="-57" y1="0" x2="-45" y2="0" stroke={PYRITE} strokeWidth="2.6" />
        <circle cx="-40" cy="0" r="4.8" fill={PYRITE} stroke={BASALT} strokeWidth="1.2" />
        <polygon
          points="-16,-16 18,-8 4,0 18,8 -16,16"
          fill={isSel('dipeptidases') ? PYRITE : BASALT}
          stroke={BASALT}
          strokeWidth="1.6"
        />
        <circle cx="31" cy="-6" r="4.5" fill={VERDIGRIS} stroke={BASALT} strokeWidth="1.1" />
        <circle cx="31" cy="7" r="4.5" fill={PYRITE} stroke={BASALT} strokeWidth="1.1" />
        <rect
          x="64"
          y="-10"
          width="48"
          height="20"
          rx="2"
          fill={badgeFill('dipeptidases')}
          stroke={stroke('dipeptidases')}
          strokeWidth="1.6"
        />
        <text
          x="88"
          y="4"
          textAnchor="middle"
          fontSize="11.5"
          fontWeight="800"
          fill={badgeText('dipeptidases')}
          fontFamily="ui-monospace, SFMono-Regular, monospace"
        >
          DP
        </text>
      </g>

      {/* Converging flux lines from Zone 2 into AH */}
      <g aria-hidden="true">
        <path
          d="M 702 142 C 734 142, 742 186, 766 196"
          fill="none"
          stroke={BASALT}
          strokeWidth="1.4"
          strokeDasharray="4 3"
        />
        <line
          x1="702"
          y1="208"
          x2="762"
          y2="208"
          stroke={BASALT}
          strokeWidth="1.8"
          markerEnd="url(#mp-flux-basalt)"
        />
        <path
          d="M 702 274 C 734 274, 742 230, 766 220"
          fill="none"
          stroke={BASALT}
          strokeWidth="1.4"
          strokeDasharray="4 3"
        />
      </g>

      {/* ==================== 10. AH (Amidohydrolases · EC 3.5.1 Trimeric Pinwheel) ==================== */}
      <g
        onClick={() => onSelect('amidohydrolases')}
        className="svg-enzyme"
        transform="translate(822, 208)"
        role="button"
        tabIndex={0}
        aria-label="AH: Amidohydrolases — urease, glutaminase, asparaginase, amidase (EC 3.5.1)"
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onSelect('amidohydrolases')}
      >
        {isSel('amidohydrolases') ? (
          <circle cx="0" cy="0" r="60" fill={PYRITE} opacity="0.16" />
        ) : null}
        {[
          { rot: 0, fill: BASALT },
          { rot: 120, fill: VERDIGRIS },
          { rot: 240, fill: PYRITE },
        ].map(({ rot, fill }) => (
          <g key={rot} transform={`rotate(${rot})`}>
            <path
              d="M 4 -8 C 4 -34, 38 -36, 40 -10 C 41 6, 22 14, 8 4 Z"
              fill={fill}
              stroke={BASALT}
              strokeWidth="1.8"
            />
            <circle cx="22" cy="-12" r="3.6" fill="#ffffff" stroke={BASALT} strokeWidth="1.1" />
          </g>
        ))}
        <circle cx="0" cy="0" r="9.5" fill="#ffffff" stroke={BASALT} strokeWidth="2.2" />
        <text
          x="0"
          y="3"
          textAnchor="middle"
          fontSize="8.5"
          fontWeight="800"
          fill={BASALT}
          fontFamily="ui-monospace, SFMono-Regular, monospace"
        >
          Ni
        </text>
        <rect
          x="-26"
          y="46"
          width="52"
          height="20"
          rx="2"
          fill={badgeFill('amidohydrolases')}
          stroke={stroke('amidohydrolases')}
          strokeWidth="1.6"
        />
        <text
          x="0"
          y="60"
          textAnchor="middle"
          fontSize="11.5"
          fontWeight="800"
          fill={badgeText('amidohydrolases')}
          fontFamily="ui-monospace, SFMono-Regular, monospace"
        >
          AH
        </text>
      </g>

      {/* ==================== RHIZOSPHERE NH4+ FLUX & PLANT ROOT EPIDERMIS + ROOT HAIRS ==================== */}
      <g aria-hidden="true">
        <path
          d="M 872 188 C 896 168, 916 142, 936 126"
          fill="none"
          stroke={BASALT}
          strokeWidth="1.8"
          markerEnd="url(#mp-flux-basalt)"
        />
        <line
          x1="876"
          y1="208"
          x2="966"
          y2="208"
          stroke="#9a670c"
          strokeWidth="2.4"
          markerEnd="url(#mp-flux-pyrite)"
        />
        <path
          d="M 872 228 C 896 248, 916 278, 936 296"
          fill="none"
          stroke={BASALT}
          strokeWidth="1.8"
          markerEnd="url(#mp-flux-basalt)"
        />

        {[
          [898, 194, PYRITE],
          [918, 198, VERDIGRIS],
          [940, 194, PYRITE],
          [906, 222, VERDIGRIS],
          [930, 222, PYRITE],
          [918, 158, PYRITE],
          [918, 258, VERDIGRIS],
        ].map(([cx, cy, color], idx) => (
          <circle
            key={idx}
            cx={cx}
            cy={cy}
            r="4.5"
            fill={color as string}
            stroke={BASALT}
            strokeWidth="1.1"
          />
        ))}

        <text
          x="922"
          y="184"
          textAnchor="middle"
          fontSize="11"
          fontWeight="800"
          fill="#9a670c"
          fontFamily="ui-monospace, SFMono-Regular, monospace"
        >
          NH₄⁺
        </text>

        {/* Botanical Plant Root Epidermis & Root Hair Cross-Section */}
        <path
          d="M 1034 40 L 1034 86 L 916 90 C 898 91, 898 113, 916 114 L 1034 118 L 1034 302 L 924 308 C 906 310, 906 332, 924 334 L 1034 340 L 1034 398 L 1104 398 L 1104 40 Z"
          fill="#f5f2eb"
          stroke={BASALT}
          strokeWidth="2.4"
          strokeLinejoin="round"
        />
        <path
          d="M 1042 44 L 1042 92 L 920 96 C 909 97, 909 107, 920 108 L 1042 112 L 1042 184 L 1096 184 L 1096 44 Z"
          fill="#ffffff"
          stroke={STEEL}
          strokeWidth="1.5"
        />
        <rect
          x="1042"
          y="192"
          width="54"
          height="98"
          rx="4"
          fill="#ffffff"
          stroke={STEEL}
          strokeWidth="1.5"
        />
        <path
          d="M 1042 298 L 1042 308 L 928 314 C 917 315, 917 325, 928 326 L 1042 332 L 1042 394 L 1096 394 L 1096 298 Z"
          fill="#ffffff"
          stroke={STEEL}
          strokeWidth="1.5"
        />

        <rect
          x="976"
          y="194"
          width="68"
          height="10"
          rx="5"
          fill={VERDIGRIS}
          stroke={BASALT}
          strokeWidth="1.6"
        />
        <rect
          x="976"
          y="212"
          width="68"
          height="10"
          rx="5"
          fill={VERDIGRIS}
          stroke={BASALT}
          strokeWidth="1.6"
        />
        <circle cx="1054" cy="208" r="4.5" fill={PYRITE} stroke={BASALT} strokeWidth="1.1" />
        <circle cx="1072" cy="204" r="4.5" fill={VERDIGRIS} stroke={BASALT} strokeWidth="1.1" />
        <circle cx="1072" cy="216" r="4.5" fill={PYRITE} stroke={BASALT} strokeWidth="1.1" />
        <text
          x="1010"
          y="238"
          textAnchor="middle"
          fontSize="9.5"
          fontWeight="800"
          fill={VERDIGRIS}
          fontFamily="ui-monospace, SFMono-Regular, monospace"
        >
          AMT1
        </text>
        <text
          x="1069"
          y="152"
          textAnchor="middle"
          fontSize="9.5"
          fontWeight="800"
          fill={BASALT}
          fontFamily="ui-monospace, SFMono-Regular, monospace"
          transform="rotate(-90 1069 152)"
        >
          PLANT ROOT HAIR
        </text>
      </g>
    </svg>
  );
}
