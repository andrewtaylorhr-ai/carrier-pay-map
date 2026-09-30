import type { LucideIcon } from "lucide-react";

// Gauge-style stat card for percentage metrics, matching the reference
// mockup's radial-progress treatment (used for Hire rate / Submission
// achievement / Hire achievement on the Reports page). Same real-data-or-"—"
// rule as StatCard: pct === null renders an empty (unfilled) ring rather
// than fabricating a fill, exactly like the plain-text "—" fallback used
// everywhere else in this app when there's no denominator to divide by.
export function RadialStatCard({
  icon: Icon,
  label,
  pct,
  sub,
}: {
  icon: LucideIcon;
  label: string;
  pct: number | null;
  sub?: string;
}) {
  const size = 52;
  const stroke = 5;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const clamped = pct == null ? 0 : Math.max(0, Math.min(100, pct));
  const offset = c - (clamped / 100) * c;

  return (
    <div className="rounded-xl border border-[var(--cpm-border)] bg-[var(--cpm-panel)] p-4 flex items-center gap-3 min-w-[170px] flex-1">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--cpm-panel-alt)" strokeWidth={stroke} />
          {pct != null && (
            <circle
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke="var(--cpm-accent)"
              strokeWidth={stroke}
              strokeDasharray={c}
              strokeDashoffset={offset}
              strokeLinecap="round"
            />
          )}
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <Icon size={16} strokeWidth={2} className="text-[var(--cpm-accent)]" />
        </div>
      </div>
      <div className="min-w-0">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-[var(--cpm-text-faint)]">{label}</div>
        <div className="text-[22px] font-bold text-[var(--cpm-text)] leading-tight mt-0.5">
          {pct == null ? "—" : `${Math.round(pct)}%`}
        </div>
        {sub && <div className="text-[11.5px] text-[var(--cpm-text-dim)] mt-0.5">{sub}</div>}
      </div>
    </div>
  );
}
