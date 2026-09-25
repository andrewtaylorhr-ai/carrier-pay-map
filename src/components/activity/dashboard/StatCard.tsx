import type { LucideIcon } from "lucide-react";

export function StatCard({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-xl border border-[var(--cpm-border)] bg-[var(--cpm-panel)] p-4 flex items-start gap-3 min-w-[170px] flex-1">
      <div className="rounded-lg bg-[var(--cpm-panel-alt)] p-2 text-[var(--cpm-accent)] shrink-0">
        <Icon size={18} strokeWidth={2} />
      </div>
      <div className="min-w-0">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-[var(--cpm-text-faint)]">{label}</div>
        <div className="text-[22px] font-bold text-[var(--cpm-text)] leading-tight mt-0.5">{value}</div>
        {sub && <div className="text-[11.5px] text-[var(--cpm-text-dim)] mt-0.5">{sub}</div>}
      </div>
    </div>
  );
}
