"use client";

import { GraduationCap, Users } from "lucide-react";
import { useLocalStorageState } from "@/lib/hooks/useLocalStorage";
import { ACADEMY_URL, REQUIRED_LESSONS } from "@/lib/training-program";
import { AcademyList } from "./AcademyList";
import { TraineeManager } from "./TraineeManager";

const TABS = [
  { id: "trainees", label: "Trainees", icon: Users },
  { id: "academy", label: "Academy", icon: GraduationCap },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function TrainingApp() {
  const [tab, setTab] = useLocalStorageState<TabId>("cpm_trainingTab", "trainees");
  const active = TABS.some((t) => t.id === tab) ? tab : "trainees";

  return (
    <div className="flex flex-col gap-4">
      <div className="segTabs self-start">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} type="button" className={active === id ? "active" : undefined} onClick={() => setTab(id)}>
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>
      {active === "trainees" && <TraineeManager />}
      {active === "academy" && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3 flex-wrap text-[12.5px] text-[var(--cpm-text-dim)]">
            Class A Recruiting Academy · {REQUIRED_LESSONS} lessons. Each one opens in Notion.
            <a href={ACADEMY_URL} target="_blank" rel="noreferrer" className="text-[var(--cpm-accent)] font-semibold hover:underline">
              Open the full Academy
            </a>
          </div>
          <AcademyList />
        </div>
      )}
    </div>
  );
}
