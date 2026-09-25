"use client";

// "State"/"Strategy" actions from the reference dashboard aren't included
// here — those belong to the separate Pay Map tool, not this hire-performance
// data. Only sections that actually exist on this page get a card.
const ACTIONS = [
  { key: "recruiter", label: "Recruiter", question: "Who needs attention?", targetId: "recruiter-detail" },
  { key: "carrier", label: "Carrier", question: "Which carriers are we placing with most?", targetId: "carrier-breakdown" },
  { key: "followup", label: "Follow-up", question: "Which hires need action?", targetId: "needs-follow-up" },
  { key: "trend", label: "Trend", question: "What changed month to month?", targetId: "hires-trend" },
] as const;

export function ActionCenter() {
  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="rounded-xl border border-[var(--cpm-border)] bg-[var(--cpm-panel)] p-4 flex-1 min-w-0 flex flex-col">
      <div className="text-[11px] font-bold uppercase tracking-wide text-[var(--cpm-text-faint)] mb-0.5">
        Action center
      </div>
      <div className="text-[11.5px] text-[var(--cpm-text-faint)] mb-3">Jump straight to what needs a decision.</div>
      <div className="flex flex-col gap-2">
        {ACTIONS.map((a) => (
          <button
            key={a.key}
            type="button"
            onClick={() => scrollTo(a.targetId)}
            className="flex items-center gap-3 rounded-lg border border-[var(--cpm-border)] bg-[var(--cpm-panel-alt)] px-3 py-2 text-left hover:border-[var(--cpm-border-strong)] transition-colors"
          >
            <span className="text-[10px] font-bold uppercase tracking-wide text-[var(--cpm-accent)] shrink-0 w-16">
              {a.label}
            </span>
            <span className="text-[12px] text-[var(--cpm-text-dim)]">{a.question}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
