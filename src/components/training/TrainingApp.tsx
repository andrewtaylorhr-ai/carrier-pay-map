"use client";

import { ClipboardCheck, GraduationCap, Users } from "lucide-react";
import { useCarrierMap } from "@/lib/carrier-map-context";
import { useLocalStorageState } from "@/lib/hooks/useLocalStorage";
import { ACADEMY_URL, REQUIRED_LESSONS } from "@/lib/training-program";
import { AcademyList } from "./AcademyList";
import { AcademyTest } from "./AcademyTest";
import { TraineeManager } from "./TraineeManager";

const TABS = [
  { id: "trainees", label: "Trainees", icon: Users },
  { id: "academy", label: "Academy", icon: GraduationCap },
  { id: "test", label: "Academy test", icon: ClipboardCheck },
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
      {active === "test" && (
        <div className="flex flex-col gap-3">
          <label className="flex items-center gap-2 text-[12.5px] text-[var(--cpm-text-dim)]">
            Who is taking the test?
            <select className={select} value={testFor} onChange={(e) => setTaker(e.target.value)}>
              <option value="">Nobody (practice)</option>
              {takers.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
          <AcademyTest
            key={testFor}
            taker={testFor || undefined}
            best={testFor ? (trainees[testFor].testScore ?? null) : null}
            onFinish={(pct) => testFor && updateTrainee(testFor, { testScore: Math.max(pct, trainees[testFor].testScore ?? 0) })}
          />
        </div>
      )}
    </div>
  );
}
