"use client";

import { ClipboardCheck, FileDown, GraduationCap, KeyRound, PhoneCall, Users } from "lucide-react";
import { useCarrierMap } from "@/lib/carrier-map-context";
import { useLocalStorageState } from "@/lib/hooks/useLocalStorage";
import { downloadAnswerKeyDoc, downloadTestDoc } from "@/lib/academy-test-docs";
import { ACADEMY_URL, REQUIRED_LESSONS } from "@/lib/training-program";
import { AcademyList } from "./AcademyList";
import { AcademyTest } from "./AcademyTest";
import { PaperGrader } from "./PaperGrader";
import { PracticeGuide } from "./PracticeGuide";
import { TraineeManager } from "./TraineeManager";

const TABS = [
  { id: "trainees", label: "Trainees", icon: Users },
  { id: "academy", label: "Academy", icon: GraduationCap },
  { id: "test", label: "Academy test", icon: ClipboardCheck },
  { id: "practice", label: "Days 2–3", icon: PhoneCall },
] as const;

type TabId = (typeof TABS)[number]["id"];

const select =
  "h-8 px-2.5 rounded-lg border border-[var(--cpm-border-strong)] bg-[var(--cpm-panel-alt)] text-[12.5px] text-[var(--cpm-text)] outline-none focus:border-[var(--cpm-accent)]";

export function TrainingApp() {
  const { trainees, updateTrainee } = useCarrierMap();
  const [tab, setTab] = useLocalStorageState<TabId>("cpm_trainingTab", "trainees");
  const [taker, setTaker] = useLocalStorageState<string>("cpm_testTaker", "");
  const active = TABS.some((t) => t.id === tab) ? tab : "trainees";
  const takers = Object.keys(trainees).filter((n) => trainees[n].stage === "training" || trainees[n].stage === "qc" || n === taker);
  const testFor = trainees[taker] ? taker : "";
  const [mode, setMode] = useLocalStorageState<"online" | "paper">("cpm_testMode", "online");
  const saveScore = (pct: number) => testFor && updateTrainee(testFor, { testScore: Math.max(pct, trainees[testFor].testScore ?? 0) });

  return (
    <div className="flex flex-col gap-4">
      <div className="segTabs self-start">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} type="button" className={active === id ? "active" : undefined} onClick={() => setTab(id)}>
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>
      {active === "trainees" && (
        <TraineeManager
          onRunTest={(name) => {
            setTaker(name);
            setTab("test");
          }}
          onOpenGuide={() => setTab("practice")}
        />
      )}
      {active === "academy" && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3 flex-wrap text-[12.5px] text-[var(--cpm-text-dim)]">
            Class A Recruiting Academy · {REQUIRED_LESSONS} lessons, finished on day 1. Each one opens in Notion.
            <a href={ACADEMY_URL} target="_blank" rel="noreferrer" className="text-[var(--cpm-accent)] font-semibold hover:underline">
              Open the full Academy
            </a>
          </div>
          <AcademyList />
        </div>
      )}
      {active === "practice" && <PracticeGuide />}
      {active === "test" && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[12.5px] text-[var(--cpm-text-dim)]">Word files:</span>
            <button type="button" className="ghostBtn" onClick={downloadTestDoc}>
              <FileDown size={14} /> Download test (for recruiters)
            </button>
            <button type="button" className="ghostBtn" onClick={downloadAnswerKeyDoc}>
              <KeyRound size={14} /> Download answer key (for you)
            </button>
          </div>
          <div className="segTabs self-start">
            <button type="button" className={mode === "online" ? "active" : undefined} onClick={() => setMode("online")}>
              Take it here
            </button>
            <button type="button" className={mode === "paper" ? "active" : undefined} onClick={() => setMode("paper")}>
              Grade a paper test
            </button>
          </div>
          <label className="flex items-center gap-2 text-[12.5px] text-[var(--cpm-text-dim)]">
            {mode === "paper" ? "Whose test is it?" : "Who is taking the test?"}
            <select className={select} value={testFor} onChange={(e) => setTaker(e.target.value)}>
              <option value="">{mode === "paper" ? "Pick a trainee" : "Nobody (practice)"}</option>
              {takers.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
          {mode === "paper" ? (
            <PaperGrader key={testFor} taker={testFor || undefined} onSave={saveScore} />
          ) : (
            <AcademyTest key={testFor} taker={testFor || undefined} best={testFor ? (trainees[testFor].testScore ?? null) : null} onFinish={saveScore} />
          )}
        </div>
      )}
    </div>
  );
}
