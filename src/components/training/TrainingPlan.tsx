"use client";

import { ACADEMY, lessonUrl } from "@/lib/training-program";

export type PlanTab = "trainees" | "academy" | "checks" | "test" | "practice" | "call" | "rules";

type Step = {
  title: string;
  points: string[];
  lessons?: string[]; // Academy lesson titles, linked to Notion
  tools?: { label: string; tab: PlanTab }[]; // other tabs of this page
  finish?: boolean;
};

const LESSONS = ACADEMY.flatMap((s) => s.lessons);

// The training plan as a timeline. Each inner list is one row of the line.
const PLAN: Step[][] = [
  [
    {
      title: "Learn Trucking & Recruiting",
      points: [
        "Who is a truck driver?",
        "CDL Class A basics",
        "OTR, Regional, Dedicated and Local",
        "How trucking companies operate",
        "How to research and understand a carrier: which part we have to focus on!",
      ],
      lessons: [
        "General Understanding of Logistics, Trucks, Drivers and How Recruiting Works",
        "Who is a truck driver recruiter? Why companies need us?",
        "Understanding Company Information",
        "Trucking Glossary of Terms",
      ],
      tools: [{ label: "Academy", tab: "academy" }],
    },
    {
      title: "Learn Company Requirements",
      points: [
        "Carrier qualification requirements",
        "Age and experience",
        "Hiring ZIP codes and states",
        "Criminal records, accidents and tickets",
        "Safety basics: Clearinghouse, drug tests, SAP, violation types",
        "Driver qualification and carrier matching",
      ],
      lessons: ["Violations Types", "Clearinghouse", "Drug Testing", "SAP program"],
      tools: [{ label: "Carrier rules", tab: "rules" }],
    },
    {
      title: "Work with Indeed",
      points: ["How to use Indeed", "Resume search", "Sponsored job postings", "Finding qualified candidates", "Lead management and organization"],
      lessons: ["Job Post Rules (Indeed 101)", "Indeed Leads", "Lead Management"],
    },
  ],
  [
    {
      title: "Calling & Communication Skills",
      points: [
        "Professional introduction",
        "Selling skills",
        "Confidence and call control",
        "Building rapport",
        "Asking the right questions",
        "Presenting the job: home time, pay, freight, equipment, running area",
        "Objection handling",
        "Closing techniques",
      ],
      lessons: ["Call Script", "Building Rapport and Prequalifying like a BOSS!", "Speaking Rules", "Convincing / Consulting", "Proper Presentation"],
      tools: [{ label: "Call guide", tab: "call" }],
    },
    {
      title: "Pre-Qualification (PQ)",
      points: [
        "Tickets and accidents in the last 3 years",
        "DUIs, suspensions and criminal history in a lifetime",
        "Terminations and references",
        "Where they applied in the past 30 days",
        "Verifiable experience and work history",
      ],
      lessons: ["Pre-Qualifying Checklist", "7 Questions to ask a driver while on a call", 'What is "verifiable" experience', "Criminal History, Court and etc", "Work History and Unemployment Gaps"],
      tools: [{ label: "Carrier rules", tab: "rules" }],
    },
    {
      title: "Application Submission",
      points: ["How to complete applications (Tenstreet)", "Verify driver information", "Select the correct carrier", "Application confirmation number", "Complete submission notes"],
      lessons: ["How to fill out a Tenstreet Link?", "How to ask for a Social Security Number?"],
      tools: [{ label: "Submission notes", tab: "call" }],
    },
  ],
  [
    {
      title: "Follow-up Strategy",
      points: ["First follow-up", "Second and third follow-up", "Scheduling calls", "Handling no-answer drivers", "Updating driver status"],
      lessons: ["Follow Up calls", "Proper Follow Up (by Adrian)", "Proper Follow Up (by Daniel)"],
      tools: [{ label: "Follow-up rules", tab: "call" }],
    },
    {
      title: "Driver Hiring Process",
      points: [
        "Application review",
        "Approval process",
        "Orientation, and follow up before it",
        "Dispatch: the driver is officially hired only after dispatch",
        "Confirming driver hiring",
        "Proper handoff and tracking",
      ],
      lessons: ["Driver Recruitment Process"],
    },
  ],
  [
    {
      title: "Practical Training & Evaluation",
      points: ["Practice calls", "Real driver scenarios", "Carrier qualification exercises", "Application submission practice", "Manager evaluation"],
      tools: [
        { label: "Days 2–3", tab: "practice" },
        { label: "Knowledge checks", tab: "checks" },
        { label: "QC calls", tab: "trainees" },
      ],
    },
    {
      title: "Final Examination & Certification",
      points: ["Recruiting knowledge test", "Communication assessment", "Practical recruiting test", "Final score", "Certification"],
      tools: [
        { label: "Academy test", tab: "test" },
        { label: "Certificates", tab: "trainees" },
      ],
      finish: true,
    },
  ],
];

function StepItem({ step, number, onOpen }: { step: Step; number: number; onOpen: (tab: PlanTab) => void }) {
  const lessons = (step.lessons ?? []).map((t) => LESSONS.find((l) => l.title === t)).filter((l) => !!l);
  return (
    <li className="relative flex-1 basis-0 min-w-0 flex md:flex-col gap-3 md:gap-0 pb-6 md:pr-5">
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
        <ul className="mt-1.5 flex flex-col gap-1 pl-4 list-disc text-[13px] text-[var(--cpm-text-dim)]">
          {step.points.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
        {lessons.length > 0 && (
          <div className="mt-2.5">
            <div className="text-[10.5px] font-semibold uppercase tracking-wider text-[var(--cpm-text-faint)]">Lessons</div>
            {lessons.map((l) => (
              <a key={l.id} href={lessonUrl(l.id)} target="_blank" rel="noreferrer" className="block text-[12px] leading-[1.45] mt-0.5 text-[var(--cpm-accent)] hover:underline">
                {l.title}
              </a>
            ))}
          </div>
        )}
        {step.tools && (
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {step.tools.map((t) => (
              <button
                key={t.label}
                type="button"
                onClick={() => onOpen(t.tab)}
                className="h-7 px-2.5 rounded-md border border-[var(--cpm-border-strong)] text-[11.5px] font-semibold text-[var(--cpm-text-dim)] hover:text-[var(--cpm-text)] hover:border-[var(--cpm-accent)]"
              >
                {t.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </li>
  );
}

export function TrainingPlan({ onOpen }: { onOpen: (tab: PlanTab) => void }) {
  let number = 0;
  return (
    <section className="rounded-xl border border-[var(--cpm-border)] bg-[var(--cpm-panel)] px-5 pt-5 pb-1">
      <h2 className="text-[18px] font-bold text-[var(--cpm-text)] mb-5">Recruiter Training Roadmap</h2>
      {PLAN.map((row, r) => (
        <ol key={r} className="flex flex-col md:flex-row">
          {row.map((step) => (
            <StepItem key={step.title} step={step} number={++number} onOpen={onOpen} />
          ))}
        </ol>
      ))}
    </section>
  );
}
