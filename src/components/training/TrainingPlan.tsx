"use client";

import { useCallback, useEffect, useRef, useState, type PointerEvent } from "react";
import { ChevronLeft, ChevronRight, Maximize2, Minimize2, Truck } from "lucide-react";
import { useLocalStorageState } from "@/lib/hooks/useLocalStorage";
import { ACADEMY, lessonUrl } from "@/lib/training-program";
import { TrainingScene, type SceneId } from "./TrainingScenes";

export type PlanTab = "trainees" | "academy" | "checks" | "test" | "practice" | "call" | "rules";

type Step = {
  title: string;
  points: string[];
  scene: SceneId;
  color: string;
  lessons?: string[]; // Academy lesson titles, linked to Notion
  tools?: { label: string; tab: PlanTab }[]; // other tabs of this page
};

const LESSONS = ACADEMY.flatMap((s) => s.lessons);

const STEPS: Step[] = [
  {
    title: "Learn Trucking & Recruiting",
    scene: "truck",
    color: "#f59e0b",
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
    scene: "rules",
    color: "#3b82f6",
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
    scene: "search",
    color: "#10b981",
    points: ["How to use Indeed", "Resume search", "Sponsored job postings", "Finding qualified candidates", "Lead management and organization"],
    lessons: ["Job Post Rules (Indeed 101)", "Indeed Leads", "Lead Management"],
  },
  {
    title: "Calling & Communication Skills",
    scene: "call",
    color: "#8b5cf6",
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
    scene: "prequal",
    color: "#f43f5e",
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
    scene: "submit",
    color: "#06b6d4",
    points: ["How to complete applications (Tenstreet)", "Verify driver information", "Select the correct carrier", "Application confirmation number", "Complete submission notes"],
    lessons: ["How to fill out a Tenstreet Link?", "How to ask for a Social Security Number?"],
    tools: [{ label: "Submission notes", tab: "call" }],
  },
  {
    title: "Follow-up Strategy",
    scene: "followup",
    color: "#f97316",
    points: ["First follow-up", "Second and third follow-up", "Scheduling calls", "Handling no-answer drivers", "Updating driver status"],
    lessons: ["Follow Up calls", "Proper Follow Up (by Adrian)", "Proper Follow Up (by Daniel)"],
    tools: [{ label: "Follow-up rules", tab: "call" }],
  },
  {
    title: "Driver Hiring Process",
    scene: "hire",
    color: "#14b8a6",
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
    scene: "practice",
    color: "#ec4899",
    points: ["Practice calls", "Real driver scenarios", "Carrier qualification exercises", "Application submission practice", "Manager evaluation"],
    tools: [
      { label: "Days 2–3", tab: "practice" },
      { label: "Knowledge checks", tab: "checks" },
      { label: "QC calls", tab: "trainees" },
    ],
  },
  {
    title: "Final Examination & Certification",
    scene: "certificate",
    color: "#22c55e",
    points: ["Recruiting knowledge test", "Communication assessment", "Practical recruiting test", "Final score", "Certification"],
    tools: [
      { label: "Academy test", tab: "test" },
      { label: "Certificates", tab: "trainees" },
    ],
  },
];

const LAST = STEPS.length; // slide 0 is the cover, then one per step
const navBtn =
  "inline-flex items-center gap-1 h-9 px-3 rounded-lg border border-[var(--cpm-border-strong)] text-[13px] font-semibold text-[var(--cpm-text)] hover:border-[var(--cpm-accent)] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-[var(--cpm-border-strong)]";

function Cover({ onPick }: { onPick: (slide: number) => void }) {
  return (
    <div className="grid gap-6 md:grid-cols-2 items-center">
      <div className="min-w-0">
        <div className="text-[12px] font-bold uppercase tracking-wider text-[var(--cpm-accent)]">Class A Recruiting</div>
        <h2 className="text-[32px] leading-[1.15] font-bold text-[var(--cpm-text)] mt-1">Recruiter Training Roadmap</h2>
        <p className="text-[14px] text-[var(--cpm-text-dim)] mt-2 mb-4">{STEPS.length} steps, from learning the industry to certification.</p>
        <ol className="grid gap-x-3 gap-y-1 sm:grid-cols-2">
          {STEPS.map((s, i) => (
            <li key={s.title}>
              <button type="button" onClick={() => onPick(i + 1)} className="flex gap-2 w-full text-left text-[12.5px] leading-[1.35] py-0.5 text-[var(--cpm-text-dim)] hover:text-[var(--cpm-text)]">
                <span className="font-bold" style={{ color: s.color }}>
                  {i + 1}
                </span>
                {s.title}
              </button>
            </li>
          ))}
        </ol>
      </div>
      <TrainingScene id="road" color="#f5c451" />
    </div>
  );
}

function StepSlide({ step, number, onOpen }: { step: Step; number: number; onOpen: (tab: PlanTab) => void }) {
  const lessons = (step.lessons ?? []).map((t) => LESSONS.find((l) => l.title === t)).filter((l) => !!l);
  return (
    <div className="grid gap-6 md:grid-cols-2 items-start">
      <div className="min-w-0">
        <div className="text-[12px] font-bold uppercase tracking-wider" style={{ color: step.color }}>
          Step {number} of {STEPS.length}
        </div>
        <h2 className="text-[28px] leading-[1.15] font-bold text-[var(--cpm-text)] mt-1 mb-4">{step.title}</h2>
        <ul className="flex flex-col gap-2">
          {step.points.map((p) => (
            <li key={p} className="flex gap-2.5 text-[14.5px] leading-[1.4] text-[var(--cpm-text)]">
              <span className="mt-[7px] w-2 h-2 rounded-full shrink-0" style={{ background: step.color }} />
              {p}
            </li>
          ))}
        </ul>
      </div>
      <div className="min-w-0">
        <TrainingScene id={step.scene} color={step.color} />
        {lessons.length > 0 && (
          <div className="mt-3">
            <div className="text-[10.5px] font-semibold uppercase tracking-wider text-[var(--cpm-text-faint)]">Lessons</div>
            {lessons.map((l) => (
              <a key={l.id} href={lessonUrl(l.id)} target="_blank" rel="noreferrer" className="block text-[12px] leading-[1.45] mt-0.5 text-[var(--cpm-accent)] hover:underline">
                {l.title}
              </a>
            ))}
          </div>
        )}
        {step.tools && (
          <div className="mt-3 flex flex-wrap gap-1.5">
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
    </div>
  );
}

// The training plan as a presentation: move with the buttons, the arrow keys,
// a swipe, or the stops on the road.
export function TrainingPlan({ onOpen }: { onOpen: (tab: PlanTab) => void }) {
  const [stored, setSlide] = useLocalStorageState<number>("cpm_trainingSlide", 0);
  const slide = Math.min(LAST, Math.max(0, stored));
  const [dir, setDir] = useState<"next" | "back">("next");
  const [full, setFull] = useState(false);
  const root = useRef<HTMLElement>(null);
  const dragFrom = useRef<number | null>(null);

  const go = useCallback(
    (to: number) => {
      const target = Math.min(LAST, Math.max(0, to));
      if (target === slide) return;
      setDir(target > slide ? "next" : "back");
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

  // swipe or drag sideways on the slide (not when starting on a link or button)
  const onDown = (e: PointerEvent) => {
    dragFrom.current = (e.target as HTMLElement).closest("a,button") ? null : e.clientX;
  };
  const onUp = (e: PointerEvent) => {
    if (dragFrom.current == null) return;
    const dx = e.clientX - dragFrom.current;
    dragFrom.current = null;
    if (Math.abs(dx) > 70) go(slide + (dx < 0 ? 1 : -1));
  };

  const pct = (slide / LAST) * 100;
  const color = slide ? STEPS[slide - 1].color : "#f5c451";

  return (
    <section
      ref={root}
      className={`flex flex-col bg-[var(--cpm-panel)] ${full ? "h-screen overflow-auto px-[6vw] py-8 justify-center" : "rounded-xl border border-[var(--cpm-border)] px-5 pt-5 pb-4"}`}
    >
      <div className="min-h-[420px] touch-pan-y select-text" onPointerDown={onDown} onPointerUp={onUp}>
        <div key={slide} className={dir === "next" ? "tp-slide-next" : "tp-slide-back"}>
          {slide === 0 ? <Cover onPick={go} /> : <StepSlide step={STEPS[slide - 1]} number={slide} onOpen={onOpen} />}
        </div>
      </div>

      {/* the truck drives along the road to the current slide */}
      <div className="relative h-10 mx-3 mt-5">
        <div className="absolute left-0 right-0 top-[27px] h-[3px] rounded bg-[var(--cpm-border-strong)]" />
        <div className="absolute left-0 top-[27px] h-[3px] rounded transition-[width] duration-500" style={{ width: `${pct}%`, background: color }} />
        <Truck size={20} className="absolute top-0 -ml-[10px] transition-[left] duration-500" style={{ left: `${pct}%`, color }} />
        {[0, ...STEPS.map((_, i) => i + 1)].map((i) => (
          <button
            key={i}
            type="button"
            onClick={() => go(i)}
            title={i ? STEPS[i - 1].title : "Start"}
            aria-label={i ? `Step ${i}: ${STEPS[i - 1].title}` : "Start"}
            className="absolute top-[22px] -ml-[6.5px] w-[13px] h-[13px] rounded-full border-2 border-[var(--cpm-panel)]"
            style={{ left: `${(i / LAST) * 100}%`, background: i <= slide ? color : "var(--cpm-border-strong)" }}
          />
        ))}
      </div>

      <div className="flex items-center gap-2 mt-3">
        <button type="button" className={navBtn} onClick={() => go(slide - 1)} disabled={slide === 0}>
          <ChevronLeft size={16} /> Back
        </button>
        <button type="button" className={navBtn} onClick={() => go(slide + 1)} disabled={slide === LAST}>
          {slide === 0 ? "Start" : "Next"} <ChevronRight size={16} />
        </button>
        <span className="text-[12px] text-[var(--cpm-text-faint)] hidden sm:inline">You can also use the arrow keys or swipe.</span>
        <button type="button" className={`${navBtn} ml-auto`} onClick={toggleFull}>
          {full ? <Minimize2 size={15} /> : <Maximize2 size={15} />} {full ? "Exit" : "Full screen"}
        </button>
      </div>
    </section>
  );
}
