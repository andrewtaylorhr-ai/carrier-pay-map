import { CheckCircle2 } from "lucide-react";

export function KeyInsights({ insights }: { insights: string[] }) {
  return (
    <div className="rounded-xl border border-[var(--cpm-border)] bg-[var(--cpm-panel)] p-4 flex-1 min-w-0">
      <div className="text-[11px] font-bold uppercase tracking-wide text-[var(--cpm-text-faint)] mb-3">
        Key insights
      </div>
      {insights.length === 0 ? (
        <div className="text-[12px] text-[var(--cpm-text-faint)]">
          Not enough data yet to surface insights — import more carrier activity to see patterns here.
        </div>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {insights.map((line, i) => (
            <li key={i} className="flex items-start gap-2 text-[12.5px] text-[var(--cpm-text-dim)] leading-snug">
              <CheckCircle2 size={15} className="text-[var(--cpm-green)] shrink-0 mt-0.5" />
              <span>{line}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
