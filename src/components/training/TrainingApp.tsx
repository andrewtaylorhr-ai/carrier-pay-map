"use client";

import { BookOpenCheck, ClipboardCheck, FileDown, GraduationCap, KeyRound, ListChecks, Map as MapIcon, Phone, PhoneCall, Route, Users } from "lucide-react";
import { useCarrierMap } from "@/lib/carrier-map-context";
import { useLocalStorageState } from "@/lib/hooks/useLocalStorage";
import { downloadAnswerKeyDoc, downloadTestDoc } from "@/lib/academy-test-docs";
import { DEFAULT_SETTINGS, SETTINGS_KEY, type TrainingSettings } from "@/lib/training-content";
import { ACADEMY_URL, REQUIRED_LESSONS } from "@/lib/training-program";
import { AcademyList } from "./AcademyList";
import { AcademyTest } from "./AcademyTest";
import { CallGuide } from "./CallGuide";
import { CarrierRules } from "./CarrierRules";
import { DriverJourney } from "./DriverJourney";
import { KnowledgeChecks } from "./KnowledgeChecks";
import { PaperGrader } from "./PaperGrader";
import { PracticeGuide } from "./PracticeGuide";
import { TraineeManager } from "./TraineeManager";
import { TrainingPlan } from "./TrainingPlan";

const TABS = [
  { id: "plan", label: "Training plan", icon: MapIcon },
  { id: "journey", label: "Driver's journey", icon: Route },
  { id: "trainees", label: "Trainees", icon: Users },
  { id: "academy", label: "Academy", icon: GraduationCap },
  { id: "checks", label: "Knowledge checks", icon: BookOpenCheck },
  { id: "test", label: "Academy test", icon: ClipboardCheck },
  { id: "practice", label: "Days 2–3", icon: PhoneCall },
  { id: "call", label: "Call guide", icon: Phone },
  { id: "rules", label: "Carrier rules", icon: ListChecks },
] as const;

type TabId = (typeof TABS)[number]["id"];

const select =
  "h-8 px-2.5 rounded-lg border border-[var(--cpm-border-strong)] bg-[var(--cpm-panel-alt)] text-[12.5px] text-[var(--cpm-text)] outline-none focus:border-[var(--cpm-accent)]";

export function TrainingApp() {
  const { trainees, updateTrainee } = useCarrierMap();
  const [tab, setTab] = useLocalStorageState<TabId>("cpm_trainingTab", "plan");
  const [taker, setTaker] = useLocalStorageState<string>("cpm_testTaker", "");
  const active = TABS.some((t) => t.id === tab) ? tab : "plan";
  const takers = Object.keys(trainees).filter((n) => trainees[n].stage === "training" || trainees[n].stage === "qc" || n === taker);
  const testFor = trainees[taker] ? taker : "";
  const [mode, setMode] = useLocalStorageState<"online" | "paper">("cpm_testMode", "online");
  const [settings, setSettings] = useLocalStorageState<TrainingSettings>(SETTINGS_KEY, DEFAULT_SETTINGS);
  const setSetting = (patch: Partial<TrainingSettings>) => setSettings((s) => ({ ...s, ...patch }));
  const used = testFor ? (trainees[testFor].testAttempts ?? 0) : 0;
  const locked = !!testFor && settings.maxAttempts > 0 && used >= settings.maxAttempts;
  const saveScore = (pct: number) => {
    if (!testFor) return;
    updateTrainee(testFor, { testScore: Math.max(pct, trainees[testFor].testScore ?? 0), testAttempts: used + 1 });
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="segTabs self-start flex-wrap">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} type="button" className={active === id ? "active" : undefined} onClick={() => setTab(id)}>
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>
      {active === "plan" && <TrainingPlan onOpen={setTab} />}
      {active === "journey" && <DriverJourney />}
      {active === "trainees" && (
        <TraineeManager
          onRunTest={(name) => {
            setTaker(name);
            setTab("test");
          }}
          onOpenGuide={() => setTab("practice")}
          settings={settings}
        />
      )}
      {active === "academy" && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3 flex-wrap text-[12.5px] text-[var(--cpm-text-dim)]">
            Class A Recruiting Academy · {REQUIRED_LESSONS} lessons, finished on day 1. Each one opens in Notion.
            <a href={ACADEMY_URL} target="_blank" rel="noreferrer" className="text-[var(--cpm-accent-text)] font-semibold hover:underline">
              Open the full Academy
            </a>
          </div>
          <AcademyList />
        </div>
      )}
      {active === "practice" && <PracticeGuide />}
      {active === "checks" && <KnowledgeChecks taker={taker} takers={takers} setTaker={setTaker} />}
      {active === "call" && <CallGuide />}
      {active === "rules" && <CarrierRules />}
      {active === "test" && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[12.5px] text-[var(--cpm-text-dim)]">Word files:</span>
            <button type="button" className="ghostBtn" onClick={() => downloadTestDoc(settings.passMark)}>
              <FileDown size={14} /> Download test (for recruiters)
            </button>
            <button type="button" className="ghostBtn" onClick={() => downloadAnswerKeyDoc(settings.passMark)}>
              <KeyRound size={14} /> Download answer key (for you)
            </button>
          </div>
          <div className="flex items-center gap-4 flex-wrap text-[12.5px] text-[var(--cpm-text-dim)]">
            <label className="flex items-center gap-2">
              Pass mark %
              <input
                type="number"
                min={1}
                max={100}
                className={`${select} w-[70px]`}
                value={settings.passMark}
                onChange={(e) => setSetting({ passMark: Math.min(100, Math.max(1, Number(e.target.value) || 1)) })}
              />
            </label>
            <label className="flex items-center gap-2">
              Attempts allowed (0 = no limit)
              <input
                type="number"
                min={0}
                className={`${select} w-[70px]`}
                value={settings.maxAttempts}
                onChange={(e) => setSetting({ maxAttempts: Math.max(0, Number(e.target.value) || 0) })}
              />
            </label>
            <label className="flex items-center gap-2">
              Name on certificates
              <input className={`${select} w-[170px]`} placeholder="Leave empty to sign by hand" value={settings.signer} onChange={(e) => setSetting({ signer: e.target.value })} />
            </label>
            {testFor && settings.maxAttempts > 0 && (
              <span className="text-[var(--cpm-text-faint)]">
                {testFor}: {used} of {settings.maxAttempts} used
              </span>
            )}
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
            <PaperGrader key={testFor} taker={testFor || undefined} passMark={settings.passMark} locked={locked} onSave={saveScore} />
          ) : (
            <AcademyTest key={testFor} taker={testFor || undefined} best={testFor ? (trainees[testFor].testScore ?? null) : null} passMark={settings.passMark} locked={locked} onFinish={saveScore} />
          )}
        </div>
      )}
    </div>
  );
}
