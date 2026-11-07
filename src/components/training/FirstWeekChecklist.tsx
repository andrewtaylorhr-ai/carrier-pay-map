"use client";

import { useLocalStorageState } from "@/lib/hooks/useLocalStorage";

type Item = { id: string; text: string; hint?: string };

const DAYS: { title: string; items: Item[] }[] = [
  {
    title: "Day 1 · Get set up",
    items: [
      { id: "d1-access", text: "Get your login, phone line and email working", hint: "Ask your team lead if anything is missing." },
      { id: "d1-name", text: "Make sure your name is in the Recruiters list", hint: "Your manager adds you on Team Overview." },
      { id: "d1-basics", text: "Read Recruiting basics on this page (words, call steps, script)" },
      { id: "d1-sheets", text: "Read the cheat sheet for every carrier" },
    ],
  },
  {
    title: "Day 2 · Learn the tools",
    items: [
      { id: "d2-paymap", text: "Open the Pay Map and find 3 accounts in your states", hint: "Check pay, home time and experience for each." },
      { id: "d2-plan", text: "Open your Strategy Plan and know your states, carriers and accounts" },
      { id: "d2-tracker", text: "Find your row in the Daily Tracker and learn how to enter submissions" },
      { id: "d2-listen", text: "Listen to at least 5 calls from an experienced recruiter" },
    ],
  },
  {
    title: "Day 3 · Practice",
    items: [
      { id: "d3-roleplay", text: "Do 3 role-play calls with your team lead using the script" },
      { id: "d3-faq", text: "Practice answering the driver questions in the FAQ" },
      { id: "d3-quiz", text: "Pass the Quiz on this page with 80% or more" },
    ],
  },
  {
    title: "Day 4–5 · Go live",
    items: [
      { id: "d4-calls", text: "Make your first real calls to drivers in your states" },
      { id: "d4-submit", text: "Submit your first qualified driver to an account" },
      { id: "d4-log", text: "Log every submission in the Daily Tracker the same day" },
      { id: "d5-follow", text: "Call back every driver you submitted within 24 hours" },
      { id: "d5-review", text: "Review your week with your team lead" },
    ],
  },
];

const ALL_IDS = DAYS.flatMap((d) => d.items.map((i) => i.id));

// Saved in this browser only, so each new recruiter tracks their own progress.
export function FirstWeekChecklist() {
  const [done, setDone] = useLocalStorageState<string[]>("cpm_trainingChecklist", []);
  const doneSet = new Set(done.filter((id) => ALL_IDS.includes(id)));
  const pct = Math.round((doneSet.size / ALL_IDS.length) * 100);

  const toggle = (id: string) => setDone((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  return (
    <div className="max-w-[900px]">
      <div className="rounded-xl border border-[var(--cpm-border)] bg-[var(--cpm-panel)] px-4 py-3 mb-3 flex items-center gap-4 flex-wrap">
        <div>
          <div className="text-[15px] font-bold text-[var(--cpm-text)]">Your first week</div>
          <div className="text-[12px] text-[var(--cpm-text-faint)]">
            {doneSet.size} of {ALL_IDS.length} done · saved in this browser
          </div>
        </div>
        <div className="flex-1 min-w-[180px] h-2.5 rounded-full bg-[var(--cpm-panel-alt)] border border-[var(--cpm-border)] overflow-hidden">
          <div className="h-full bg-[var(--cpm-green)] transition-all" style={{ width: `${pct}%` }} />
        </div>
        <div className="text-[18px] font-bold tabular-nums text-[var(--cpm-text)]">{pct}%</div>
        {doneSet.size > 0 && (
          <button
            type="button"
            onClick={() => confirm("Clear all ticks?") && setDone([])}
            className="text-[11.5px] font-semibold px-2.5 py-1 rounded-md border border-[var(--cpm-border-strong)] text-[var(--cpm-text-dim)] hover:text-[var(--cpm-text)]"
          >
            Reset
          </button>
        )}
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {DAYS.map((day) => {
          const n = day.items.filter((i) => doneSet.has(i.id)).length;
          return (
            <section key={day.title} className="rounded-xl border border-[var(--cpm-border)] bg-[var(--cpm-panel)]">
              <h2 className="flex items-center text-[14px] font-bold text-[var(--cpm-text)] px-4 py-2.5 border-b border-[var(--cpm-border)]">
                {day.title}
                <span className={`ml-auto text-[11.5px] font-semibold ${n === day.items.length ? "text-[var(--cpm-green)]" : "text-[var(--cpm-text-faint)]"}`}>
                  {n === day.items.length ? "Done ✓" : `${n}/${day.items.length}`}
                </span>
              </h2>
              <ul className="px-2 py-2">
                {day.items.map((item) => {
                  const checked = doneSet.has(item.id);
                  return (
                    <li key={item.id}>
                      <label className="flex gap-2.5 px-2 py-1.5 rounded-md cursor-pointer hover:bg-[var(--cpm-panel-alt)]">
                        <input type="checkbox" checked={checked} onChange={() => toggle(item.id)} className="mt-0.5 accent-[var(--cpm-green)]" />
                        <span className="text-[12.5px]">
                          <span className={checked ? "text-[var(--cpm-text-faint)] line-through" : "text-[var(--cpm-text)]"}>{item.text}</span>
                          {item.hint && <span className="block text-[11.5px] text-[var(--cpm-text-faint)]">{item.hint}</span>}
                        </span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}
