"use client";

import { BookOpen, HelpCircle, Truck, Users } from "lucide-react";
import { useCarrierMap } from "@/lib/carrier-map-context";
import { useLocalStorageState } from "@/lib/hooks/useLocalStorage";
import { CarrierCheatSheets } from "./CarrierCheatSheets";
import { RecruitingBasics } from "./RecruitingBasics";
import { TraineeManager } from "./TraineeManager";
import { TrainingQuiz } from "./TrainingQuiz";

const TABS = [
  { id: "trainees", label: "Trainees", icon: Users },
  { id: "basics", label: "Recruiting basics", icon: BookOpen },
  { id: "carriers", label: "Carrier cheat sheets", icon: Truck },
  { id: "quiz", label: "Quiz", icon: HelpCircle },
] as const;

type TabId = (typeof TABS)[number]["id"];

const select =
  "h-8 px-2.5 rounded-lg border border-[var(--cpm-border-strong)] bg-[var(--cpm-panel-alt)] text-[12.5px] text-[var(--cpm-text)] outline-none focus:border-[var(--cpm-accent)]";

export function TrainingApp() {
  const { trainees, updateTrainee } = useCarrierMap();
  const [tab, setTab] = useLocalStorageState<TabId>("cpm_trainingTab", "trainees");
  const [taker, setTaker] = useLocalStorageState<string>("cpm_trainingQuizTaker", "");
  const active = TABS.some((t) => t.id === tab) ? tab : "trainees";
  const takers = Object.keys(trainees).filter((n) => trainees[n].stage === "training" || trainees[n].stage === "qc" || n === taker);
  const quizFor = trainees[taker] ? taker : "";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="segTabs flex-wrap">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button key={id} type="button" className={active === id ? "active" : undefined} onClick={() => setTab(id)}>
              <Icon size={14} /> {label}
            </button>
          ))}
        </div>
        {active !== "trainees" && <span className="text-[12px] text-[var(--cpm-text-faint)]">Material to teach from</span>}
      </div>
      {active === "trainees" && (
        <TraineeManager
          onRunQuiz={(name) => {
            setTaker(name);
            setTab("quiz");
          }}
        />
      )}
      {active === "basics" && <RecruitingBasics />}
      {active === "carriers" && <CarrierCheatSheets />}
      {active === "quiz" && (
        <div className="flex flex-col gap-3">
          <label className="flex items-center gap-2 text-[12.5px] text-[var(--cpm-text-dim)]">
            Who is taking the quiz?
            <select className={select} value={quizFor} onChange={(e) => setTaker(e.target.value)}>
              <option value="">Nobody (practice)</option>
              {takers.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
          <TrainingQuiz
            key={quizFor}
            taker={quizFor || undefined}
            best={quizFor ? (trainees[quizFor].quizScore ?? null) : null}
            onFinish={(pct) => quizFor && updateTrainee(quizFor, { quizScore: Math.max(pct, trainees[quizFor].quizScore ?? 0) })}
          />
        </div>
      )}
    </div>
  );
}
