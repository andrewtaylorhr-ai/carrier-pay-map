"use client";

import { Award, CalendarClock, ClipboardCheck, FileCheck2, Headset, Search, ShieldCheck, Target, Truck, UserCheck, type LucideIcon } from "lucide-react";
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

// The training plan's steps, in order (rows only group them in the source).
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

const ICONS: LucideIcon[] = [Truck, ShieldCheck, Search, Headset, ClipboardCheck, FileCheck2, CalendarClock, UserCheck, Target, Award];
const STEPS = PLAN.flat();

function StepCard({ step, number, onOpen }: { step: Step; number: number; onOpen: (tab: PlanTab) => void }) {
  const lessons = (step.lessons ?? []).map((t) => LESSONS.find((l) => l.title === t)).filter((l) => !!l);
  const Icon = ICONS[number - 1] ?? Truck;
  return (
    <li
      className={`flex flex-col rounded-xl border bg-[var(--cpm-panel-alt)] px-4 py-4 ${
        step.finish ? "border-[var(--cpm-green)]" : "border-[var(--cpm-border)]"
      }`}
    >
      <div className="flex items-center gap-2.5">
        <span
          className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
            step.finish ? "bg-[var(--cpm-green)] text-[#06240f]" : "bg-[var(--cpm-accent)] text-white"
          }`}
        >
          <Icon size={17} strokeWidth={2.25} />
        </span>
        <div className="min-w-0">
          <div className="text-[10.5px] font-bold uppercase tracking-[.12em] text-[var(--cpm-text-faint)]">Step {number}</div>
          <h3 className="text-[14.5px] leading-tight font-bold text-[var(--cpm-text)]">{step.title}</h3>
        </div>
      </div>
      <ul className="mt-3 flex flex-col gap-1.5">
        {step.points.map((p) => (
          <li key={p} className="flex gap-2 text-[13px] leading-[1.4] text-[var(--cpm-text-dim)]">
            <span className="mt-[7px] w-1.5 h-1.5 rounded-full shrink-0 bg-[var(--cpm-accent)]" />
            {p}
          </li>
        ))}
      </ul>
      {lessons.length > 0 && (
        <div className="mt-3 pt-3 border-t border-[var(--cpm-border)]">
          <div className="text-[10.5px] font-semibold uppercase tracking-wider text-[var(--cpm-text-faint)]">Lessons</div>
          {lessons.map((l) => (
            <a key={l.id} href={lessonUrl(l.id)} target="_blank" rel="noreferrer" className="block text-[12px] leading-[1.45] mt-0.5 text-[var(--cpm-accent-text)] hover:underline">
              {l.title}
            </a>
          ))}
        </div>
      )}
      {step.tools && (
        <div className="mt-auto pt-3 flex flex-wrap gap-1.5">
          {step.tools.map((t) => (
            <button
              key={t.label}
              type="button"
              onClick={() => onOpen(t.tab)}
              className="h-7 px-2.5 rounded-md border border-[var(--cpm-border-strong)] text-[11.5px] font-semibold text-[var(--cpm-text-dim)] transition-colors hover:text-[var(--cpm-text)] hover:border-[var(--cpm-accent)]"
            >
              {t.label}
            </button>
          ))}
        </div>
      )}
    </li>
  );
}

// The training plan: ten steps from the first day to a certified recruiter.
export function TrainingPlan({ onOpen }: { onOpen: (tab: PlanTab) => void }) {
  return (
    <section className="rounded-xl border border-[var(--cpm-border)] bg-[var(--cpm-panel)] px-5 py-5">
      <div className="flex items-end gap-3 flex-wrap mb-4">
        <div>
          <div className="brandSilver text-[11px] font-bold uppercase tracking-[.14em]">Class A Recruiting</div>
          <h2 className="text-[22px] font-extrabold text-[var(--cpm-text)] leading-tight">Recruiter Training Roadmap</h2>
          <p className="text-[13px] text-[var(--cpm-text-dim)] mt-0.5">
            {STEPS.length} steps from the first day to a certified recruiter. Lessons open in Notion; buttons open the tools on this page.
          </p>
        </div>
      </div>
      <ol className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {STEPS.map((step, i) => (
          <StepCard key={step.title} step={step} number={i + 1} onOpen={onOpen} />
        ))}
      </ol>
    </section>
  );
}
