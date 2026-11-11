"use client";

import { Award, CalendarClock, ClipboardCheck, FileCheck2, Flag, Headset, Search, ShieldCheck, Target, Truck, UserCheck, type LucideIcon } from "lucide-react";
import { ACADEMY, lessonUrl } from "@/lib/training-program";
import { SlideIndex, SlideShow, eyebrow, panel } from "./SlideShow";
import { DriverStory } from "./DriverStory";
import { VideoStage } from "./VideoStage";

export type PlanTab = "trainees" | "academy" | "checks" | "test" | "practice" | "call" | "rules";

type Step = {
  title: string;
  points: string[];
  icon: LucideIcon;
  lessons?: string[]; // Academy lesson titles, linked to Notion
  tools?: { label: string; tab: PlanTab }[]; // other tabs of this page
};

const LESSONS = ACADEMY.flatMap((s) => s.lessons);

const STEPS: Step[] = [
  {
    title: "Learn Trucking & Recruiting",
    icon: Truck,
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
    icon: ShieldCheck,
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
    icon: Search,
    points: ["How to use Indeed", "Resume search", "Sponsored job postings", "Finding qualified candidates", "Lead management and organization"],
    lessons: ["Job Post Rules (Indeed 101)", "Indeed Leads", "Lead Management"],
  },
  {
    title: "Calling & Communication Skills",
    icon: Headset,
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
    icon: ClipboardCheck,
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
    icon: FileCheck2,
    points: ["How to complete applications (Tenstreet)", "Verify driver information", "Select the correct carrier", "Application confirmation number", "Complete submission notes"],
    lessons: ["How to fill out a Tenstreet Link?", "How to ask for a Social Security Number?"],
    tools: [{ label: "Submission notes", tab: "call" }],
  },
  {
    title: "Follow-up Strategy",
    icon: CalendarClock,
    points: ["First follow-up", "Second and third follow-up", "Scheduling calls", "Handling no-answer drivers", "Updating driver status"],
    lessons: ["Follow Up calls", "Proper Follow Up (by Adrian)", "Proper Follow Up (by Daniel)"],
    tools: [{ label: "Follow-up rules", tab: "call" }],
  },
  {
    title: "Driver Hiring Process",
    icon: UserCheck,
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
  {
    title: "Practical Training & Evaluation",
    icon: Target,
    points: ["Practice calls", "Real driver scenarios", "Carrier qualification exercises", "Application submission practice", "Manager evaluation"],
    tools: [
      { label: "Days 2–3", tab: "practice" },
      { label: "Knowledge checks", tab: "checks" },
      { label: "QC calls", tab: "trainees" },
    ],
  },
  {
    title: "Final Examination & Certification",
    icon: Award,
    points: ["Recruiting knowledge test", "Communication assessment", "Practical recruiting test", "Final score", "Certification"],
    tools: [
      { label: "Academy test", tab: "test" },
      { label: "Certificates", tab: "trainees" },
    ],
  },
];

const HIRE = STEPS.length + 1; // slide 0 is the cover, then one per step, then Hire
const STOPS = ["Start", ...STEPS.map((s) => s.title), "Hire"];
// The driver's story video: where it stops for steps 1 to 10, in seconds. The
// cover plays it all, each step plays on to its moment, and Hire ends on the road.
const STEP_TIMES = [0.25, 1.75, 2.1, 3, 3.6, 4.4, 5, 5.7, 6.4, 7];
const VIDEO_END = 7.9;
const SEGMENTS: [number, number][] = [[0, VIDEO_END], ...STEP_TIMES.map((t, i): [number, number] => [i ? STEP_TIMES[i - 1] : 0, t]), [7, VIDEO_END]];

function StepDetail({ step, onOpen }: { step: Step; onOpen: (tab: PlanTab) => void }) {
  const lessons = (step.lessons ?? []).map((t) => LESSONS.find((l) => l.title === t)).filter((l) => !!l);
  const hasSide = lessons.length > 0 || !!step.tools;
  return (
    <div className={`tp-rise grid gap-3 items-start ${hasSide ? "md:grid-cols-[3fr_2fr]" : ""}`}>
      <div className={panel}>
        <div className={`${eyebrow} text-[var(--cpm-accent-text)] mb-2.5`}>What you learn</div>
        <ul className="grid gap-x-6 gap-y-2 lg:grid-cols-2">
          {step.points.map((p) => (
            <li key={p} className="flex gap-2.5 text-[14px] leading-[1.4] text-[var(--cpm-text)]">
              <span className="mt-[7px] w-1.5 h-1.5 rounded-full shrink-0 bg-[var(--cpm-accent)]" />
              {p}
            </li>
          ))}
        </ul>
      </div>
      {hasSide && (
        <div className={panel}>
          {lessons.length > 0 && (
            <>
              <div className={`${eyebrow} text-[var(--cpm-text-faint)]`}>Lessons</div>
              {lessons.map((l) => (
                <a key={l.id} href={lessonUrl(l.id)} target="_blank" rel="noreferrer" className="block text-[12.5px] leading-[1.4] mt-1 text-[var(--cpm-accent-text)] hover:underline">
                  {l.title}
                </a>
              ))}
            </>
          )}
          {step.tools && (
            <div className={`flex flex-wrap gap-1.5 ${lessons.length ? "mt-3" : ""}`}>
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
        </div>
      )}
    </div>
  );
}

// The training plan as a presentation: each step moves the driver's story along.
export function TrainingPlan({ onOpen }: { onOpen: (tab: PlanTab) => void }) {
  return (
    <SlideShow
      storageKey="cpm_trainingSlide"
      stops={STOPS}
      greenAt={HIRE}
      hint="Or use the arrow keys, or swipe. Each step plays the next part of the driver's story."
      stage={(slide) => {
        const step = slide >= 1 && slide < HIRE ? STEPS[slide - 1] : null;
        const Icon = step?.icon;
        return (
          <VideoStage src="training/driver-journey.mp4" poster="training/driver-journey-end.jpg" segments={SEGMENTS} slide={slide}>
            <div key={slide} className="tp-rise max-w-[640px]">
              {slide === 0 && (
                <>
                  <div className={`${eyebrow} brandSilver`}>Class A Recruiting</div>
                  <h2 className="text-[26px] md:text-[38px] leading-[1.1] font-extrabold text-white mt-1">Recruiter Training Roadmap</h2>
                  <p className="text-[13.5px] md:text-[15px] text-[#d6d6d6] mt-1.5">Every recruiter is built step by step.</p>
                </>
              )}
              {step && Icon && (
                <>
                  <div className={`${eyebrow} flex items-center gap-1.5 text-white`}>
                    <span className="inline-flex w-6 h-6 rounded-md bg-[var(--cpm-accent)] items-center justify-center">
                      <Icon size={14} strokeWidth={2.25} />
                    </span>
                    Step {slide} of {STEPS.length}
                  </div>
                  <h2 className="text-[24px] md:text-[34px] leading-[1.12] font-extrabold text-white mt-1.5">{step.title}</h2>
                </>
              )}
              {slide === HIRE && (
                <>
                  <div className={`${eyebrow} flex items-center gap-1.5 text-white`}>
                    <span className="inline-flex w-6 h-6 rounded-md bg-[var(--cpm-green)] items-center justify-center text-[#06240f]">
                      <Flag size={14} strokeWidth={2.25} />
                    </span>
                    Final stage
                  </div>
                  <h2 className="text-[34px] md:text-[48px] leading-[1.05] font-extrabold text-[var(--cpm-green)] mt-1.5">Hire</h2>
                  <p className="text-[13.5px] md:text-[15px] text-[#e4e4e4] mt-1">Built step by step. Ready for the road.</p>
                </>
              )}
            </div>
          </VideoStage>
        );
      }}
      below={(slide, go) => (
        <>
          {slide === 0 && <SlideIndex titles={STEPS.map((s) => s.title)} onPick={go} cols="xl:grid-cols-5" />}
          {slide >= 1 && slide < HIRE && <StepDetail step={STEPS[slide - 1]} onOpen={onOpen} />}
          {slide === 1 && <DriverStory />}
          {slide === HIRE && (
            <div className={`tp-rise ${panel} border-[var(--cpm-green)] text-[14px] text-[var(--cpm-text)]`}>
              The driver is officially hired only after dispatch. Confirm the hire, then keep tracking the driver.
            </div>
          )}
        </>
      )}
    />
  );
}
