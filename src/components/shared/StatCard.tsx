import type { LucideIcon } from "lucide-react";

export type StatCardColor = "amber" | "blue" | "purple" | "green";

const COLOR_CLS: Record<StatCardColor, string> = {
  amber: "bg-[var(--cpm-panel-alt)] text-[var(--cpm-accent)]",
  blue: "bg-[var(--cpm-blue-soft)] text-[var(--cpm-blue)]",
  purple: "bg-[var(--cpm-purple-soft)] text-[var(--cpm-purple)]",
  green: "bg-[var(--cpm-green-soft)] text-[var(--cpm-green)]",
};

export function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color = "amber",
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  sub?: string;
  color?: StatCardColor;
}) {
  return (
    <div className="rounded-xl border border-[var(--cpm-border)] bg-[var(--cpm-panel)] p-4 flex items-start gap-3 min-w-[170px] flex-1">
      <div className={`rounded-lg p-2 shrink-0 ${COLOR_CLS[color]}`}>
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
