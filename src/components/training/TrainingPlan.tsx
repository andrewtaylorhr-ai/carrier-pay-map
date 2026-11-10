"use client";

import { useCallback, useEffect, useRef, useState, type PointerEvent } from "react";
import { Award, CalendarClock, ChevronLeft, ChevronRight, ClipboardCheck, FileCheck2, Flag, Headset, Maximize2, Minimize2, Search, ShieldCheck, Target, Truck, UserCheck, type LucideIcon } from "lucide-react";
import { useLocalStorageState } from "@/lib/hooks/useLocalStorage";
import { ACADEMY, lessonUrl } from "@/lib/training-program";
import { TruckStage } from "./TruckStage";

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
const navBtn =
  "inline-flex items-center gap-1 h-9 px-3 rounded-lg border border-[var(--cpm-border-strong)] text-[13px] font-semibold text-[var(--cpm-text)] transition-colors hover:border-[var(--cpm-accent)] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-[var(--cpm-border-strong)]";
const panel = "rounded-xl border border-[var(--cpm-border)] bg-[var(--cpm-panel-alt)] shadow-[0_8px_24px_rgba(0,0,0,.25)] px-5 py-4";
const eyebrow = "text-[11px] font-bold uppercase tracking-[.14em]";

function Cover({ onPick }: { onPick: (slide: number) => void }) {
  return (
    <div className="tp-rise grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
      {STEPS.map((s, i) => (
        <button
          key={s.title}
          type="button"
          onClick={() => onPick(i + 1)}
          className="flex items-start gap-2.5 text-left rounded-lg border border-[var(--cpm-border)] bg-[var(--cpm-panel-alt)] px-3 py-2.5 transition-colors hover:border-[var(--cpm-accent)]"
        >
          <span className="w-6 h-6 shrink-0 rounded-md bg-[var(--cpm-accent)] text-white text-[12px] font-bold flex items-center justify-center">{i + 1}</span>
          <span className="text-[12.5px] leading-[1.3] font-semibold text-[var(--cpm-text)]">{s.title}</span>
        </button>
      ))}
    </div>
  );
}

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

// The training plan as a presentation: each step adds a part to the truck.
// Move with the buttons, the arrow keys, a swipe, or the stops on the road.
export function TrainingPlan({ onOpen }: { onOpen: (tab: PlanTab) => void }) {
  const [stored, setSlide] = useLocalStorageState<number>("cpm_trainingSlide", 0);
  const slide = Math.min(HIRE, Math.max(0, stored));
  const [forward, setForward] = useState(true);
  const [full, setFull] = useState(false);
  const root = useRef<HTMLElement>(null);
  const dragFrom = useRef<number | null>(null);

  const go = useCallback(
    (to: number) => {
      const target = Math.min(HIRE, Math.max(0, to));
      if (target === slide) return;
      setForward(target > slide);
      setSlide(target);
    },
    [slide, setSlide]
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") go(slide + 1);
      if (e.key === "ArrowLeft") go(slide - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, slide]);

  useEffect(() => {
    const onChange = () => setFull(document.fullscreenElement === root.current);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const toggleFull = () => {
    if (document.fullscreenElement) document.exitFullscreen();
    else root.current?.requestFullscreen?.();
  };

  // swipe or drag sideways (not when starting on a link or button)
  const onDown = (e: PointerEvent) => {
    dragFrom.current = (e.target as HTMLElement).closest("a,button") ? null : e.clientX;
  };
  const onUp = (e: PointerEvent) => {
    if (dragFrom.current == null) return;
    const dx = e.clientX - dragFrom.current;
    dragFrom.current = null;
    if (Math.abs(dx) > 70) go(slide + (dx < 0 ? 1 : -1));
  };

  const step = slide >= 1 && slide < HIRE ? STEPS[slide - 1] : null;
  const isHire = slide === HIRE;
  const Icon = step?.icon;
  const pct = (slide / HIRE) * 100;
  const roadColor = isHire ? "var(--cpm-green)" : "var(--cpm-accent)";

  return (
    <section ref={root} className={`flex flex-col gap-3 ${full ? "h-screen overflow-auto p-6 justify-center bg-[var(--cpm-bg)]" : ""}`}>
      <div className="touch-pan-y flex flex-col gap-3" onPointerDown={onDown} onPointerUp={onUp}>
        <TruckStage slide={slide} forward={forward}>
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
            {isHire && (
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
        </TruckStage>

        <div key={slide} className="min-h-[150px]">
          {slide === 0 && <Cover onPick={go} />}
          {step && <StepDetail step={step} onOpen={onOpen} />}
          {isHire && (
            <div className={`tp-rise ${panel} border-[var(--cpm-green)] text-[14px] text-[var(--cpm-text)]`}>
              The driver is officially hired only after dispatch. Confirm the hire, then keep tracking the driver.
            </div>
          )}
        </div>
      </div>

      {/* progress: the truck drives along the road to the current slide */}
      <div className="relative h-10 mx-3">
        <div className="absolute left-0 right-0 top-[27px] h-[3px] rounded bg-[var(--cpm-border-strong)]" />
        <div className="absolute left-0 top-[27px] h-[3px] rounded transition-[width] duration-700" style={{ width: `${pct}%`, background: roadColor }} />
        <Truck size={20} className="absolute top-0 -ml-[10px] transition-[left] duration-700" style={{ left: `${pct}%`, color: isHire ? "var(--cpm-green)" : "var(--cpm-accent-text)" }} />
        {Array.from({ length: HIRE + 1 }, (_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => go(i)}
            title={i === 0 ? "Start" : i === HIRE ? "Hire" : STEPS[i - 1].title}
            aria-label={i === 0 ? "Start" : i === HIRE ? "Hire" : `Step ${i}: ${STEPS[i - 1].title}`}
            className="absolute top-[21px] -ml-[7.5px] w-[15px] h-[15px] rounded-full border-2 border-[var(--cpm-bg)]"
            style={{ left: `${(i / HIRE) * 100}%`, background: i === HIRE ? "var(--cpm-green)" : i <= slide ? roadColor : "#4a4a4a" }}
          />
        ))}
      </div>

      <div className="flex items-center gap-2">
        <button type="button" className={navBtn} onClick={() => go(slide - 1)} disabled={slide === 0}>
          <ChevronLeft size={16} /> Back
        </button>
        <button type="button" className={navBtn} onClick={() => go(slide + 1)} disabled={isHire}>
          {slide === 0 ? "Start" : "Next"} <ChevronRight size={16} />
        </button>
        <span className="text-[12px] text-[var(--cpm-text-faint)] hidden sm:inline">Or use the arrow keys, or swipe. Each step adds a part to the truck.</span>
        <button type="button" className={`${navBtn} ml-auto`} onClick={toggleFull}>
          {full ? <Minimize2 size={15} /> : <Maximize2 size={15} />} {full ? "Exit" : "Full screen"}
        </button>
      </div>
    </section>
  );
}
