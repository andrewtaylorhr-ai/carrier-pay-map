"use client";

// The roadmap's picture: a build yard at golden hour where a semi-truck is
// assembled one part per training step. Each step whips the camera in through
// flying materials, the part lands with a spark, and loose parts leave the yard.
import { useRef, type ReactNode, type PointerEvent } from "react";

export const TRUCK_PARTS = 10;

// Camera per slide: [zoom, focus x %, focus y %]. 0 = cover, 11 = Hire.
const CAMERA: [number, number, number][] = [
  [1, 50, 60],
  [1.32, 76, 88],
  [1.32, 66, 92],
  [1.32, 86, 92],
  [1.32, 88, 72],
  [1.3, 78, 58],
  [1.28, 68, 52],
  [1.28, 72, 34],
  [1.3, 18, 88],
  [1.06, 34, 58],
  [1, 50, 60],
  [1.08, 62, 64],
];

function Tire({ x, drive }: { x: number; drive?: boolean }) {
  return (
    <g>
      <circle cx={x} cy="362" r="38" fill="#070707" />
      <circle cx={x} cy="362" r="33" fill="none" stroke="#242424" strokeWidth="2" />
      <circle cx={x} cy="362" r="21" fill="url(#tpChrome)" />
      <g className={drive ? "tp-spin" : undefined}>
        {[0, 45, 90, 135].map((a) => (
          <rect key={a} x={x - 1.5} y="343" width="3" height="38" fill="#3a3a3a" transform={`rotate(${a} ${x} 362)`} />
        ))}
      </g>
      <circle cx={x} cy="362" r="7" fill="#2a2a2a" />
    </g>
  );
}

// Where each part lands, for its spark.
const SPOTS: [number, number][] = [
  [915, 318], [805, 362], [1000, 350], [1070, 270], [960, 210],
  [860, 200], [900, 120], [185, 350], [420, 190], [420, 190],
];

// Loose parts stacked in the yard behind the build, one leaves per step: [kind, x, size].
const YARD: ["tire" | "beam" | "crate" | "drum", number, number][] = [
  ["crate", 300, 2], ["tire", 560, 2.2], ["beam", 20, 2], ["drum", 1150, 2], ["tire", 470, 1.7],
  ["crate", 660, 1.6], ["beam", 760, 1.6], ["drum", 250, 1.8], ["tire", 1020, 1.8], ["crate", 110, 1.7],
];

// Drawn with its base on y=0.
function Loose({ kind }: { kind: string }) {
  if (kind === "tire")
    return (
      <g>
        <circle cy="-17" r="17" fill="#0a0705" />
        <circle cy="-17" r="7" fill="#8a6a42" />
        <circle cx="19" cy="-14" r="14" fill="#0a0705" />
      </g>
    );
  if (kind === "beam")
    return (
      <g>
        {[0, 1, 2].map((i) => (
          <g key={i}>
            <rect x={i * 7} y={-10 - i * 10} width="95" height="9" fill="#120c07" />
            <rect x={i * 7} y={-10 - i * 10} width="95" height="2" fill="#ffb95e" />
          </g>
        ))}
      </g>
    );
  if (kind === "drum")
    return (
      <g>
        <rect x="-14" y="-38" width="28" height="38" rx="3" fill="#120c07" />
        <rect x="-14" y="-38" width="5" height="38" fill="#ffb95e" opacity=".8" />
        <rect x="-14" y="-24" width="28" height="2" fill="#000" />
      </g>
    );
  return (
    <g>
      <rect x="-24" y="-34" width="48" height="34" fill="#150e08" />
      <path d="M-24-34l48 34M24-34l-48 34" stroke="#3a2614" strokeWidth="3" />
      <rect x="-24" y="-34" width="48" height="2" fill="#ffb95e" />
    </g>
  );
}

// One part per training step, in build order.
function parts(drive: boolean): ReactNode[] {
  return [
    // 1 frame rails and fifth wheel
    <g key="frame">
      <rect x="700" y="308" width="430" height="20" rx="2" fill="#2b2b2b" />
      <rect x="700" y="312" width="430" height="3" fill="#555" />
      <rect x="742" y="294" width="86" height="15" rx="3" fill="#3a3a3a" />
    </g>,
    // 2 drive axles
    <g key="drive">
      <path d="M702 326q58-42 116 0zM792 326q58-42 116 0z" fill="#1b1b1b" />
      <Tire x={760} drive={drive} />
      <Tire x={850} drive={drive} />
    </g>,
    // 3 steer axle and fuel tank
    <g key="steer">
      <Tire x={1062} drive={drive} />
      <rect x="908" y="316" width="98" height="42" rx="20" fill="url(#tpChrome)" />
      <rect x="930" y="316" width="4" height="42" fill="#5a5a5a" />
      <rect x="982" y="316" width="4" height="42" fill="#5a5a5a" />
    </g>,
    // 4 hood, grille and bumper
    <g key="hood">
      <path d="M996 216h98q42 4 52 40v52h-150z" fill="url(#tpBody)" />
      <path d="M1000 222h92q24 3 36 18l-128 2z" fill="#fff" opacity=".16" />
      <path d="M1022 306a42 42 0 0 1 80 0z" fill="#0d0d0d" />
      <rect x="1132" y="248" width="16" height="58" rx="3" fill="url(#tpChrome)" />
      <rect x="1128" y="302" width="42" height="26" rx="4" fill="url(#tpChrome)" />
    </g>,
    // 5 cab
    <g key="cab">
      <path d="M908 308V130q0-12 12-12h50q10 0 14 8l28 92v90z" fill="url(#tpBody)" />
      <path d="M938 136h34q6 0 8 6l20 66h-62z" fill="url(#tpGlass)" />
      <rect x="916" y="222" width="72" height="3" fill="#000" opacity=".35" />
      <rect x="946" y="240" width="22" height="5" rx="2.5" fill="#222" />
      <rect x="908" y="288" width="104" height="8" fill="#c90016" />
    </g>,
    // 6 sleeper and roof fairing
    <g key="sleeper">
      <path d="M812 308V126q0-10 10-10h88v192z" fill="url(#tpBody)" />
      <rect x="836" y="160" width="40" height="30" rx="3" fill="url(#tpGlass)" />
      <rect x="812" y="288" width="98" height="8" fill="#c90016" />
      <path d="M826 116q4-44 72-48h46q20 2 24 50z" fill="url(#tpBody)" />
    </g>,
    // 7 exhaust stacks and mirror
    <g key="stack">
      <rect x="896" y="36" width="11" height="258" rx="3" fill="url(#tpChrome)" />
      <rect x="878" y="176" width="29" height="112" rx="3" fill="url(#tpChrome)" opacity=".85" />
      <rect x="1002" y="146" width="10" height="46" rx="3" fill="#161616" />
      <rect x="1006" y="168" width="20" height="3" fill="#2a2a2a" />
    </g>,
    // 8 trailer axles and landing gear
    <g key="tandem">
      <rect x="96" y="298" width="210" height="16" fill="#262626" />
      <Tire x={140} drive={drive} />
      <Tire x={230} drive={drive} />
      <rect x="632" y="300" width="9" height="74" fill="#3b3b3b" />
      <rect x="622" y="372" width="30" height="7" fill="#3b3b3b" />
    </g>,
    // 9 trailer
    <g key="trailer">
      <rect x="60" y="74" width="720" height="226" rx="4" fill="url(#tpTrailer)" />
      {Array.from({ length: 23 }, (_, i) => (
        <rect key={i} x={88 + i * 30} y="76" width="1" height="222" fill="#fff" opacity=".05" />
      ))}
      <rect x="60" y="74" width="720" height="5" fill="#c0c0c0" opacity=".65" />
      <rect x="60" y="292" width="720" height="8" fill="url(#tpChrome)" />
      <rect x="60" y="282" width="720" height="6" fill="#c90016" />
    </g>,
    // 10 company name and lights
    <g key="brand">
      <text x="420" y="190" textAnchor="middle" fontFamily="Arial, sans-serif" fontWeight="800" fontSize="54" letterSpacing="2" fill="url(#tpChrome)">
        CLASS A RECRUITING
      </text>
      <rect x="150" y="218" width="540" height="5" fill="#c90016" />
      <rect x="1140" y="258" width="10" height="20" rx="2" fill="#ffe9b0" />
      <rect x="62" y="248" width="8" height="24" fill="#ff1a33" />
    </g>,
  ];
}

export function TruckStage({ slide, forward, children }: { slide: number; forward: boolean; children: ReactNode }) {
  const stage = useRef<HTMLDivElement>(null);
  const hire = slide > TRUCK_PARTS;
  const cover = slide === 0;
  const shown = cover || hire ? TRUCK_PARTS : slide;
  const list = parts(hire);
  const landed = forward && !cover && !hire ? SPOTS[shown - 1] : null;
  const [zoom, fx, fy] = CAMERA[Math.min(slide, CAMERA.length - 1)];

  const onMove = (e: PointerEvent) => {
    const el = stage.current;
    if (!el || e.pointerType === "touch") return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--px", String(((e.clientX - r.left) / r.width - 0.5) * 2));
    el.style.setProperty("--py", String(((e.clientY - r.top) / r.height - 0.5) * 2));
  };
  const layer = (depth: number) => ({ transform: `translate(calc(var(--px, 0) * ${depth}px), calc(var(--py, 0) * ${depth * 0.35}px))` });

  return (
    <div ref={stage} onPointerMove={onMove} className="relative overflow-hidden rounded-xl h-[300px] md:h-[400px] bg-[#0a0a0a] border border-[var(--cpm-border)]">
      <div className="tp-camera absolute inset-0" style={{ transform: `scale(${zoom})`, transformOrigin: `${fx}% ${fy}%` }}>
        <div key={slide} className="tp-whip absolute inset-0" style={{ transformOrigin: `${fx}% ${fy}%` }}>
        <svg viewBox="0 0 1200 470" preserveAspectRatio="xMidYMax meet" overflow="visible" className="absolute inset-0 w-full h-full" aria-hidden="true">
          <defs>
            <linearGradient id="tpSky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#0d0a08" />
              <stop offset=".5" stopColor="#4a1f0e" />
              <stop offset=".8" stopColor="#c0601d" />
              <stop offset="1" stopColor="#f5b45a" />
            </linearGradient>
            <radialGradient id="tpSun">
              <stop offset="0" stopColor="#fff0c4" stopOpacity=".98" />
              <stop offset=".35" stopColor="#ffb347" stopOpacity=".6" />
              <stop offset="1" stopColor="#e8741c" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="tpChrome" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#ffffff" />
              <stop offset=".5" stopColor="#c0c0c0" />
              <stop offset="1" stopColor="#6e6e6e" />
            </linearGradient>
            <linearGradient id="tpBody" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#3a3a3a" />
              <stop offset=".45" stopColor="#1c1c1c" />
              <stop offset="1" stopColor="#0d0d0d" />
            </linearGradient>
            <linearGradient id="tpTrailer" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#333" />
              <stop offset="1" stopColor="#111" />
            </linearGradient>
            <linearGradient id="tpGlass" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#ffd08a" />
              <stop offset=".5" stopColor="#5c2f12" />
              <stop offset="1" stopColor="#0c0c0c" />
            </linearGradient>
            <linearGradient id="tpRoad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#3a2413" />
              <stop offset="1" stopColor="#0b0806" />
            </linearGradient>
            <radialGradient id="tpFlash">
              <stop offset="0" stopColor="#fff6d8" />
              <stop offset=".35" stopColor="#ffb347" stopOpacity=".8" />
              <stop offset="1" stopColor="#ff7a1a" stopOpacity="0" />
            </radialGradient>
          </defs>
          <rect x="-900" y="-500" width="3000" height="900" fill="url(#tpSky)" />
          <g className="tp-layer" style={layer(6)}>
            <circle cx="560" cy="396" r="320" fill="url(#tpSun)" />
          </g>
          <g className="tp-layer" style={layer(14)}>
            <path d="M-900 400V312l240-58 220 62 240-92 200 76 180-108 220 96 240-76 210 84 260-90 300 106 190-40v128z" fill="#3d1c0c" />
          </g>
          <g className="tp-layer" style={layer(24)}>
            <path d="M-900 400v-46l300-26 260 30 300-40 280 36 260-30 300 34 280-28 320 32 300-26 280 24v40z" fill="#1e0f07" />
          </g>
          <rect x="-900" width="3000" y="396" height="400" fill="url(#tpRoad)" />
          <rect x="-900" y="396" width="3000" height="2" fill="#ffc777" opacity=".4" />
          <line className={hire ? "tp-road" : undefined} x1="-900" y1="436" x2="2100" y2="436" stroke="#c0c0c0" strokeWidth="5" strokeDasharray="56 40" opacity=".55" />
          <g className="tp-layer" style={layer(-8)}>
            {!cover && !hire &&
              YARD.slice(shown).map(([kind, x, size]) => (
                <g key={`${kind}${x}`} transform={`translate(${x} 397) scale(${size})`}>
                  <Loose kind={kind} />
                </g>
              ))}
            <g className={hire ? "tp-drive" : undefined}>
              {/* work stands hold the frame up until its wheels are on */}
              {shown < 3 && <path d="M1100 396l12-68h16l12 68zM730 396l12-68h16l12 68z" fill="#3b3b3b" />}
              {list.slice(0, shown).map((part, i) => {
                const newest = forward && !cover && !hire && i === shown - 1;
                return (
                  <g key={i} className={newest ? "tp-drop" : undefined}>
                    {part}
                  </g>
                );
              })}
              {landed && (
                <g transform={`translate(${landed[0]} ${landed[1]})`}>
                  <g className="tp-spark">
                    <circle r="90" fill="url(#tpFlash)" />
                    {[0, 40, 80, 120, 160, 200, 240, 280, 320].map((a) => (
                      <rect key={a} x="52" y="-1.5" width="34" height="3" fill="#ffe2a8" transform={`rotate(${a})`} />
                    ))}
                  </g>
                </g>
              )}
            </g>
          </g>
        </svg>
        {/* materials rushing past the lens as the camera flies in */}
        <svg viewBox="0 0 1200 470" preserveAspectRatio="none" className="tp-fly absolute inset-0 w-full h-full pointer-events-none" style={{ filter: "blur(5px)" }} aria-hidden="true">
          <rect x="120" y="40" width="620" height="46" fill="#0c0805" />
          <rect x="120" y="40" width="620" height="5" fill="#f0a64a" />
          <rect x="-160" y="330" width="760" height="70" fill="#0c0805" />
          <rect x="520" y="210" width="430" height="20" fill="#2a1a0e" />
        </svg>
        </div>
      </div>
      {(cover || hire) && <div key={`glint${slide}`} className="tp-glint absolute inset-y-0 left-0 w-1/3 pointer-events-none bg-gradient-to-r from-transparent via-[#ffdca0]/35 to-transparent" />}
      <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at 50% 60%, transparent 45%, rgba(0,0,0,.6) 100%)" }} />
      <div className="tp-grain absolute inset-0 pointer-events-none" />
      <div className="absolute inset-x-0 top-0 h-2/3 pointer-events-none bg-gradient-to-b from-black/75 via-black/30 to-transparent" />
      <div className="absolute inset-0 p-5 md:p-7">{children}</div>
    </div>
  );
}
