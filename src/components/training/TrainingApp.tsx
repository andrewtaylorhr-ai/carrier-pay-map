"use client";

import { BookOpen, ClipboardCheck, HelpCircle, Truck } from "lucide-react";
import { useLocalStorageState } from "@/lib/hooks/useLocalStorage";
import { CarrierCheatSheets } from "./CarrierCheatSheets";
import { FirstWeekChecklist } from "./FirstWeekChecklist";
import { RecruitingBasics } from "./RecruitingBasics";
import { TrainingQuiz } from "./TrainingQuiz";

const TABS = [
  { id: "basics", label: "Recruiting basics", icon: BookOpen },
  { id: "carriers", label: "Carrier cheat sheets", icon: Truck },
  { id: "checklist", label: "First-week checklist", icon: ClipboardCheck },
  { id: "quiz", label: "Quiz", icon: HelpCircle },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function TrainingApp() {
  const [tab, setTab] = useLocalStorageState<TabId>("cpm_trainingTab", "basics");
  const active = TABS.some((t) => t.id === tab) ? tab : "basics";

  return (
    <div className="flex flex-col gap-4">
      <div className="segTabs self-start flex-wrap">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} type="button" className={active === id ? "active" : undefined} onClick={() => setTab(id)}>
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>
      {active === "basics" && <RecruitingBasics />}
      {active === "carriers" && <CarrierCheatSheets />}
      {active === "checklist" && <FirstWeekChecklist />}
      {active === "quiz" && <TrainingQuiz />}
    </div>
  );
}
