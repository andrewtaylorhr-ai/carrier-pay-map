"use client";

import Link from "next/link";
import { useState } from "react";
import { FileDown, Shuffle } from "lucide-react";
import { DAY_PLANS, ROLE_PLAYS, type DriverProfile, downloadListeningSheet, randomProfile } from "@/lib/practice-days";

const card = "rounded-xl border border-[var(--cpm-border)] bg-[var(--cpm-panel)]";

// The manager's guide for days 2 and 3: the schedule, quick-fire driver
// profiles and the role-play cards. Ticks are kept on each trainee's file.
export function PracticeGuide() {
  const [profile, setProfile] = useState<DriverProfile | null>(null);
  const [count, setCount] = useState(0);
  const next = () => {
    setProfile(randomProfile());
    setCount((n) => n + 1);
  };

  return (
    <div className="flex flex-col gap-4 max-w-[980px]">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[12.5px] text-[var(--cpm-text-dim)]">
          The plan for days 2 and 3. Tick each step on the trainee&apos;s file as it&apos;s done.
        </span>
        <button type="button" className="ghostBtn ml-auto" onClick={downloadListeningSheet}>
          <FileDown size={14} /> Download call listening sheet (Word)
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-2 items-start">
        {DAY_PLANS.map((plan) => (
          <section key={plan.day} className={card}>
            <div className="px-4 py-3 border-b border-[var(--cpm-border)]">
              <h3 className="text-[15px] font-bold text-[var(--cpm-text)]">{plan.title}</h3>
              <div className="text-[12px] text-[var(--cpm-text-faint)]">{plan.goal}</div>
            </div>
            <ol>
              {plan.blocks.map((b) => (
                <li key={b.title} className="px-4 py-2.5 border-b border-[var(--cpm-border)] last:border-b-0">
                  <div className="text-[10.5px] font-semibold uppercase tracking-wider text-[var(--cpm-accent-text)]">{b.time}</div>
                  <div className="text-[13px] font-bold text-[var(--cpm-text)] mb-1">{b.title}</div>
                  <ul className="list-disc pl-4 text-[12px] text-[var(--cpm-text-dim)] flex flex-col gap-0.5">
                    {b.how.map((h) => (
                      <li key={h}>{h}</li>
                    ))}
                  </ul>
                </li>
              ))}
            </ol>
          </section>
        ))}
      </div>

      <section className={`${card} px-4 py-3`}>
        <div className="flex items-center gap-2 flex-wrap mb-2">
          <h3 className="text-[14px] font-bold text-[var(--cpm-text)]">Carrier quick-fire</h3>
          <span className="text-[12px] text-[var(--cpm-text-faint)]">
            Read the profile out. They answer: which carrier fits and why, or what disqualifies the driver and where to send them. Check it on the{" "}
            <Link href="/" className="text-[var(--cpm-accent-text)] hover:underline">
              pay map
            </Link>
            .
          </span>
          <button
            type="button"
            onClick={next}
            className="ml-auto inline-flex items-center gap-1.5 px-3 h-8 rounded-lg text-[12.5px] font-semibold bg-[var(--cpm-accent)] text-[var(--cpm-accent-ink)] hover:bg-[var(--cpm-accent-strong)]"
          >
            <Shuffle size={14} /> {profile ? "Next driver" : "New driver"}
          </button>
        </div>
        {profile ? (
          <div className="rounded-lg border border-[var(--cpm-border-strong)] bg-[var(--cpm-panel-alt)] px-3 py-2.5">
            <div className="text-[11px] text-[var(--cpm-text-faint)] mb-1">Driver #{count}</div>
            <dl className="grid gap-x-4 gap-y-1 sm:grid-cols-2 text-[13px]">
              <Field label="Experience" value={profile.experience} />
              <Field label="Lives in" value={profile.state} />
              <Field label="Record" value={profile.record} />
              <Field label="Home time" value={profile.home} />
              <Field label="Equipment" value={profile.equipment} />
              {profile.extra && <Field label="Also" value={profile.extra} />}
            </dl>
          </div>
        ) : (
          <div className="text-[12px] text-[var(--cpm-text-faint)]">Click &quot;New driver&quot; to get a random driver profile. Aim for 10 on day 2 and 5 on day 3.</div>
        )}
      </section>

      <section className="flex flex-col gap-2">
        <h3 className="text-[14px] font-bold text-[var(--cpm-text)]">Role-play cards · you play the driver</h3>
        <div className="grid gap-3 lg:grid-cols-3 items-start">
          {ROLE_PLAYS.map((r) => (
            <div key={r.id} className={`${card} px-4 py-3`}>
              <div className="text-[13.5px] font-bold text-[var(--cpm-text)] mb-1">{r.title}</div>
              <div className="text-[12px] text-[var(--cpm-text-dim)] mb-2">{r.driver}</div>
              <div className="text-[10.5px] font-semibold uppercase tracking-wider text-[var(--cpm-text-faint)]">What you say</div>
              <ul className="list-disc pl-4 text-[12px] text-[var(--cpm-text)] mb-2">
                {r.youSay.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
              <div className="text-[10.5px] font-semibold uppercase tracking-wider text-[var(--cpm-text-faint)]">What good looks like</div>
              <ul className="list-disc pl-4 text-[12px] text-[var(--cpm-text-dim)]">
                {r.lookFor.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <dt className="w-[86px] shrink-0 text-[var(--cpm-text-faint)]">{label}</dt>
      <dd className="text-[var(--cpm-text)] font-semibold">{value}</dd>
    </div>
  );
}
