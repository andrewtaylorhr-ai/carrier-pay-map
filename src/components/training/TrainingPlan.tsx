"use client";

type Step = { title: string; subtitle?: string; points?: string[]; numbered?: boolean; finish?: boolean };

// The training plan as a timeline, from the manager's handwritten plan. Each
// inner list is one row of the line.
const PLAN: Step[][] = [
  [
    {
      title: "Learn Trucking Recruiting",
      points: ["Who is a truck driver", "Learn how to learn a carrier: which part we have to focus on!"],
    },
    { title: "Learn the Company Requirements" },
    { title: "Work with Indeed", points: ["How to use Resume", "How to Post"] },
  ],
  [
    { title: "Call", subtitle: "Script for call", points: ["Selling skill", "Confident", "Domination", "Building Rapport"], numbered: true },
    { title: "Application Submit" },
    { title: "Follow-up" },
    { title: "Hire", finish: true },
  ],
];

function StepItem({ step, number }: { step: Step; number: number }) {
  const List = step.numbered ? "ol" : "ul";
  return (
    <li className="relative flex-1 min-w-0 flex md:flex-col gap-3 md:gap-0 pb-6 md:pr-5">
      {!step.finish && (
        <span className="absolute left-[13px] top-7 bottom-0 w-[2px] md:left-7 md:right-0 md:top-[13px] md:bottom-auto md:w-auto md:h-[2px] bg-[var(--cpm-border-strong)]" />
      )}
      <span
        className={`relative z-10 shrink-0 w-7 h-7 rounded-full text-[13px] font-bold flex items-center justify-center md:mb-3 ${
          step.finish ? "bg-[var(--cpm-green)] text-[#06240f]" : "bg-[var(--cpm-accent)] text-[#241800]"
        }`}
      >
        {number}
      </span>
      <div className="min-w-0">
        <h3 className="text-[14.5px] font-bold text-[var(--cpm-text)]">{step.title}</h3>
        {step.subtitle && <div className="text-[13px] text-[var(--cpm-text-dim)] mt-0.5">{step.subtitle}</div>}
        {step.points && (
          <List className={`mt-1.5 flex flex-col gap-1 pl-4 text-[13px] text-[var(--cpm-text-dim)] ${step.numbered ? "list-decimal" : "list-disc"}`}>
            {step.points.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </List>
        )}
      </div>
    </li>
  );
}

export function TrainingPlan() {
  let number = 0;
  return (
    <section className="rounded-xl border border-[var(--cpm-border)] bg-[var(--cpm-panel)] px-5 pt-5 pb-1">
      <h2 className="text-[18px] font-bold text-[var(--cpm-text)] mb-5">Training Plan</h2>
      {PLAN.map((row, r) => (
        <ol key={r} className="flex flex-col md:flex-row">
          {row.map((step) => (
            <StepItem key={step.title} step={step} number={++number} />
          ))}
        </ol>
      ))}
    </section>
  );
}
