// Animated pictures for the Training plan slides, one per topic. Plain SVG;
// the tp-* animations are in globals.css.
import type { CSSProperties, ReactNode } from "react";

export type SceneId = "road" | "truck" | "rules" | "search" | "call" | "prequal" | "submit" | "followup" | "hire" | "practice" | "certificate";

const delay = (s: number): CSSProperties => ({ animationDelay: `${s}s` });

function Frame({ c, children }: { c: string; children: ReactNode }) {
  return (
    <svg viewBox="0 0 480 320" className="w-full h-auto block rounded-xl" role="img" aria-hidden="true">
      <rect width="480" height="320" fill="#141923" />
      <rect width="480" height="320" fill={c} opacity=".1" />
      <circle cx="400" cy="60" r="120" fill={c} opacity=".12" />
      <circle cx="60" cy="290" r="100" fill={c} opacity=".08" />
      {children}
    </svg>
  );
}

const Wheel = ({ x, y }: { x: number; y: number }) => (
  <g>
    <circle cx={x} cy={y} r="14" fill="#0b0e14" />
    <g className="tp-spin">
      <circle cx={x} cy={y} r="7" fill="#9aa0ad" />
      <rect x={x - 1.5} y={y - 7} width="3" height="14" fill="#0b0e14" />
      <rect x={x - 7} y={y - 1.5} width="14" height="3" fill="#0b0e14" />
    </g>
  </g>
);

function Truck({ c, x, y }: { c: string; x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect x="0" y="0" width="190" height="78" rx="5" fill={c} />
      <rect x="0" y="50" width="190" height="8" fill="#fff" opacity=".35" />
      <path d="M198 78V22h42l28 30v26z" fill="#e5e7eb" />
      <path d="M210 30h26l18 20h-44z" fill="#38bdf8" />
      <rect x="0" y="78" width="270" height="10" rx="2" fill="#374151" />
      <Wheel x={34} y={94} />
      <Wheel x={68} y={94} />
      <Wheel x={206} y={94} />
      <Wheel x={246} y={94} />
    </g>
  );
}

const Road = () => (
  <g>
    <rect y="252" width="480" height="68" fill="#2a303c" />
    <line className="tp-road" x1="0" y1="286" x2="480" y2="286" stroke="#f5c451" strokeWidth="5" strokeDasharray="30 24" />
  </g>
);

function Check({ x, y, c, r = 13 }: { x: number; y: number; c: string; r?: number }) {
  return (
    <g>
      <circle cx={x} cy={y} r={r} fill={c} />
      <path d={`M${x - r * 0.45} ${y}l${r * 0.33} ${r * 0.36} ${r * 0.6} -${r * 0.7}`} fill="none" stroke="#0b0e14" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </g>
  );
}

const Lines = ({ x, y, w, n = 3, gap = 14 }: { x: number; y: number; w: number; n?: number; gap?: number }) => (
  <>
    {Array.from({ length: n }, (_, i) => (
      <rect key={i} x={x} y={y + i * gap} width={i === n - 1 ? w * 0.6 : w} height="6" rx="3" fill="#9aa0ad" opacity=".55" />
    ))}
  </>
);

function Scene({ id, c }: { id: SceneId; c: string }) {
  switch (id) {
    case "road":
      return (
        <>
          <circle className="tp-pulse" cx="390" cy="70" r="34" fill="#f5c451" />
          <g className="tp-drift">
            <path d="M-20 252 70 150l80 102zM110 252l110-130 110 130zM280 252l90-96 90 96zM440 252l80-90 80 90z" fill={c} opacity=".28" />
          </g>
          <Road />
          <g className="tp-bob">
            <Truck c={c} x={105} y={162} />
          </g>
        </>
      );
    case "truck":
      return (
        <>
          <g className="tp-drift">
            <rect x="40" y="130" width="46" height="122" fill={c} opacity=".22" />
            <rect x="96" y="96" width="60" height="156" fill={c} opacity=".3" />
            <rect x="240" y="120" width="52" height="132" fill={c} opacity=".22" />
            <rect x="330" y="84" width="64" height="168" fill={c} opacity=".3" />
          </g>
          <Road />
          <g className="tp-drive">
            <Truck c={c} x={0} y={162} />
          </g>
        </>
      );
    case "rules":
      return (
        <>
          <rect x="120" y="42" width="190" height="244" rx="12" fill="#e5e7eb" />
          <rect x="176" y="28" width="78" height="30" rx="7" fill={c} />
          {[86, 132, 178, 224].map((y, i) => (
            <g key={y}>
              <g className="tp-pop" style={delay(0.3 + i * 0.45)}>
                <Check x={154} y={y + 8} c="#22c55e" />
              </g>
              <rect x="180" y={y} width="104" height="7" rx="3.5" fill="#4b5563" />
              <rect x="180" y={y + 13} width="70" height="6" rx="3" fill="#9aa0ad" />
            </g>
          ))}
          <g className="tp-float">
            <rect x="290" y="168" width="150" height="96" rx="10" fill={c} />
            <circle cx="326" cy="212" r="22" fill="#fff" opacity=".9" />
            <Lines x={358} y={196} w={66} />
          </g>
        </>
      );
    case "search":
      return (
        <>
          {[60, 180, 300].map((x) => (
            <g key={x}>
              <rect x={x} y="84" width="110" height="152" rx="10" fill="#e5e7eb" />
              <circle cx={x + 55} cy="122" r="20" fill={c} />
              <Lines x={x + 18} y={160} w={74} n={4} />
            </g>
          ))}
          <g className="tp-search">
            <circle cx="115" cy="150" r="52" fill="#fff" opacity=".16" stroke="#f5c451" strokeWidth="11" />
            <rect x="150" y="186" width="66" height="15" rx="7" transform="rotate(45 150 186)" fill="#f5c451" />
          </g>
        </>
      );
    case "call":
      return (
        <>
          <circle cx="170" cy="168" r="62" fill="#e5e7eb" />
          <path d="M104 168a66 66 0 0 1 132 0" fill="none" stroke={c} strokeWidth="13" strokeLinecap="round" />
          <rect x="88" y="152" width="26" height="46" rx="10" fill={c} />
          <rect x="226" y="152" width="26" height="46" rx="10" fill={c} />
          <path d="M238 196q0 34-44 36" fill="none" stroke={c} strokeWidth="6" strokeLinecap="round" />
          <path d="M60 318c10-62 60-78 110-78s100 16 110 78z" fill={c} opacity=".7" />
          <g className="tp-pop-loop">
            <path d="M274 62h150a14 14 0 0 1 14 14v56a14 14 0 0 1-14 14H318l-26 24v-24h-18a14 14 0 0 1-14-14V76a14 14 0 0 1 14-14z" fill={c} />
            <Lines x={284} y={86} w={126} />
          </g>
          <g className="tp-pop-loop" style={delay(1.6)}>
            <path d="M296 190h124a12 12 0 0 1 12 12v44a12 12 0 0 1-12 12h-12v22l-24-22h-88a12 12 0 0 1-12-12v-44a12 12 0 0 1 12-12z" fill="#e5e7eb" />
            <circle cx="326" cy="224" r="6" fill="#4b5563" />
            <circle cx="350" cy="224" r="6" fill="#4b5563" />
            <circle cx="374" cy="224" r="6" fill="#4b5563" />
          </g>
        </>
      );
    case "prequal":
      return (
        <>
          <rect x="76" y="34" width="210" height="256" rx="12" fill="#e5e7eb" />
          {[62, 108, 154, 200, 246].map((y, i) => (
            <g key={y}>
              <rect x="96" y={y} width="130" height="7" rx="3.5" fill="#4b5563" />
              <rect x="96" y={y + 13} width="92" height="6" rx="3" fill="#9aa0ad" />
              <g className="tp-pop" style={delay(0.4 + i * 0.4)}>
                <Check x={258} y={y + 9} c={i === 3 ? "#f59e0b" : "#22c55e"} r={12} />
              </g>
            </g>
          ))}
          <rect className="tp-scan" x="76" y="44" width="210" height="6" fill={c} />
          <g className="tp-float">
            <path d="M372 70l74 26v62c0 54-34 88-74 106-40-18-74-52-74-106V96z" fill={c} />
            <Check x={372} y={160} c="#fff" r={32} />
          </g>
        </>
      );
    case "submit":
      return (
        <>
          <rect x="44" y="58" width="164" height="212" rx="12" fill="#e5e7eb" />
          <rect x="62" y="78" width="84" height="10" rx="5" fill={c} />
          {[108, 146, 184].map((y) => (
            <g key={y}>
              <rect x="62" y={y} width="128" height="24" rx="5" fill="#fff" stroke="#9aa0ad" />
              <rect x="70" y={y + 9} width="70" height="6" rx="3" fill="#4b5563" />
            </g>
          ))}
          <rect x="62" y="226" width="128" height="28" rx="7" fill={c} />
          <path d="M210 150C280 40 340 60 392 138" fill="none" stroke="#9aa0ad" strokeWidth="3" strokeDasharray="4 11" strokeLinecap="round" />
          <path d="M338 168h110v86a12 12 0 0 1-12 12h-86a12 12 0 0 1-12-12zM338 168l18-38h74l18 38h-34l-10 20h-22l-10-20z" fill={c} />
          <g className="tp-fly">
            <path d="M0 0 54-22 36 26 22 10z" fill="#f5c451" />
          </g>
          <g className="tp-pop-loop" style={delay(1.4)}>
            <Check x={393} y={226} c="#22c55e" r={22} />
          </g>
        </>
      );
    case "followup":
      return (
        <>
          <rect x="50" y="62" width="222" height="210" rx="14" fill="#e5e7eb" />
          <path d="M50 76a14 14 0 0 1 14-14h194a14 14 0 0 1 14 14v30H50z" fill={c} />
          <rect x="94" y="46" width="12" height="36" rx="6" fill="#4b5563" />
          <rect x="216" y="46" width="12" height="36" rx="6" fill="#4b5563" />
          {[0, 1, 2, 3].flatMap((r) =>
            [0, 1, 2, 3, 4].map((col) => {
              const marked = (r === 0 && col === 1) || (r === 1 && col === 3) || (r === 2 && col === 0);
              return (
                <rect
                  key={`${r}-${col}`}
                  className={marked ? "tp-pop" : undefined}
                  style={marked ? delay(0.4 + r * 0.6) : undefined}
                  x={70 + col * 38}
                  y={122 + r * 36}
                  width="28"
                  height="26"
                  rx="5"
                  fill={marked ? c : "#c4c9d3"}
                />
              );
            })
          )}
          <circle cx="372" cy="118" r="62" fill="#e5e7eb" stroke={c} strokeWidth="9" />
          <g className="tp-spin-slow">
            <rect x="369" y="70" width="6" height="50" rx="3" fill={c} />
          </g>
          <rect x="370" y="115" width="36" height="6" rx="3" fill="#4b5563" />
          <circle cx="372" cy="118" r="7" fill="#4b5563" />
          <g className="tp-ring">
            <path d="M336 214c-6 8-5 17 3 28l18 25c8 11 17 16 27 12l12-7c3-2 3-6 1-9l-13-16c-2-3-5-4-8-2l-8 4c-3 1-6 0-8-3l-14-20c-2-3-2-6 1-8l7-6c3-2 3-6 1-8l-12-17c-2-3-6-3-9-1z" fill="#22c55e" />
          </g>
        </>
      );
    case "hire":
      return (
        <>
          <rect x="262" y="104" width="184" height="148" fill="#e5e7eb" />
          {[0, 1, 2].flatMap((r) => [0, 1, 2, 3].map((col) => <rect key={`${r}-${col}`} x={278 + col * 40} y={120 + r * 40} width="26" height="24" fill="#38bdf8" opacity=".75" />))}
          <rect x="344" y="44" width="5" height="62" fill="#9aa0ad" />
          <path className="tp-wave" d="M349 46h58l-14 16 14 16h-58z" fill={c} />
          <Road />
          <g className="tp-arrive">
            <Truck c={c} x={0} y={164} />
          </g>
          <g className="tp-pop-loop" style={delay(1.2)}>
            <Check x={420} y={72} c="#22c55e" r={24} />
          </g>
        </>
      );
    case "practice":
      return (
        <>
          <circle cx="182" cy="166" r="118" fill="#e5e7eb" />
          <circle cx="182" cy="166" r="88" fill={c} />
          <circle cx="182" cy="166" r="58" fill="#e5e7eb" />
          <circle cx="182" cy="166" r="28" fill={c} />
          <g className="tp-arrow">
            <rect x="182" y="162" width="176" height="8" fill="#f5c451" />
            <path d="M182 166l24-15v30zM358 150h28l-12 16 12 16h-28z" fill="#f5c451" />
          </g>
          {[0, 1, 2].map((i) => (
            <g key={i} transform={`translate(${332 + i * 40} 58)`}>
              <path className="tp-pop" style={delay(0.9 + i * 0.3)} d="M16 0l5 11 12 1-9 8 3 12-11-6-11 6 3-12-9-8 12-1z" fill="#f5c451" />
            </g>
          ))}
        </>
      );
    case "certificate":
      return (
        <>
          {[40, 96, 150, 214, 280, 346, 410, 448].map((x, i) => (
            <rect key={x} className="tp-confetti" style={delay(i * 0.37)} x={x} y="-16" width="9" height="14" fill={i % 2 ? "#f5c451" : c} />
          ))}
          <rect x="62" y="56" width="356" height="216" rx="8" fill="#f8fafc" stroke="#d9a441" strokeWidth="6" />
          <rect x="76" y="70" width="328" height="188" fill="none" stroke="#4b5563" />
          <rect x="172" y="92" width="136" height="12" rx="6" fill="#1a2233" />
          <rect x="138" y="134" width="204" height="10" rx="5" fill={c} />
          <Lines x={150} y={160} w={180} n={2} />
          <rect x="104" y="228" width="92" height="3" fill="#4b5563" />
          <g className="tp-pulse">
            <path d="M322 232l-16 62 28-15 28 15-16-62z" fill={c} />
            <circle cx="340" cy="222" r="30" fill="#f5c451" stroke="#d9a441" strokeWidth="5" />
            <path d="M340 204l5 12 13 1-10 8 3 13-11-7-11 7 3-13-10-8 13-1z" fill="#fff" />
          </g>
        </>
      );
  }
}

export function TrainingScene({ id, color }: { id: SceneId; color: string }) {
  return (
    <Frame c={color}>
      <Scene id={id} c={color} />
    </Frame>
  );
}
