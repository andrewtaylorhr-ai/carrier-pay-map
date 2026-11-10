"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { CALL_STEPS, SAMPLE_CALL } from "@/lib/training-content";

const card = "rounded-xl border border-[var(--cpm-border)] bg-[var(--cpm-panel)]";
const input =
  "h-8 px-2.5 rounded-lg border border-[var(--cpm-border-strong)] bg-[var(--cpm-panel-alt)] text-[12.5px] text-[var(--cpm-text)] outline-none focus:border-[var(--cpm-accent)]";

const NOTE_FIELDS = [
  { key: "driver", label: "Driver Name" },
  { key: "home", label: "Home Time" },
  { key: "schedule", label: "Schedule" },
  { key: "account", label: "Account/Carrier" },
  { key: "pay", label: "Pay" },
  { key: "confirmation", label: "Application Confirmation Number" },
  { key: "recruiter", label: "Recruiter Name" },
] as const;

const FOLLOW_UP = [
  "Call the same day the lead comes in. No answer? Try again later that day.",
  "Text first to introduce yourself, then call.",
  "Follow up every 24–48 hours until they respond.",
  "Keep checking in until they're hired or they say no.",
  "If orientation is on Monday, follow up during the weekend.",
  "Log every call in the recruitment spreadsheet with notes, the driver's status and the next follow-up date and time.",
];

// The call process, a sample call and the submission notes helper. Nothing
// typed here is saved, since it's a driver's details.
export function CallGuide() {
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [next, setNext] = useState("");
  const [copied, setCopied] = useState(false);
  const missing = NOTE_FIELDS.filter((f) => !notes[f.key]?.trim());
  const text = [...NOTE_FIELDS.map((f) => `${f.label}: ${notes[f.key]?.trim() ?? ""}`), ...(next ? [`Next follow-up: ${next.replace("T", " ")}`] : [])].join("\n");

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      alert("Couldn't copy. Select the text and copy it by hand.");
    }
  };

  return (
    <div className="flex flex-col gap-4 max-w-[1100px]">
      <section className={card}>
        <h3 className="px-4 py-2.5 border-b border-[var(--cpm-border)] text-[14px] font-bold text-[var(--cpm-text)]">The recruiting call, step by step</h3>
        <ol>
          {CALL_STEPS.map((s, i) => (
            <li key={s.title} className="flex gap-3 px-4 py-2.5 border-b border-[var(--cpm-border)] last:border-b-0">
              <span className="w-6 h-6 shrink-0 rounded-full bg-[var(--cpm-panel-alt)] border border-[var(--cpm-border-strong)] text-[11.5px] font-bold text-[var(--cpm-accent-text)] flex items-center justify-center">
                {i + 1}
              </span>
              <div className="min-w-0">
                <div className="text-[13px] font-bold text-[var(--cpm-text)]">{s.title}</div>
                <div className="text-[12px] text-[var(--cpm-text-dim)]">{s.goal}</div>
                <div className="text-[12px] italic text-[var(--cpm-text-faint)] mt-0.5">&ldquo;{s.say}&rdquo;</div>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <div className="grid gap-4 lg:grid-cols-2 items-start">
        <section className={card}>
          <h3 className="px-4 py-2.5 border-b border-[var(--cpm-border)] text-[14px] font-bold text-[var(--cpm-text)]">Sample call</h3>
          <div className="px-4 py-3 flex flex-col gap-2">
            {SAMPLE_CALL.map((l, i) => (
              <div key={i} className="text-[12.5px]">
                <span className={`font-bold ${l.who === "Recruiter" ? "text-[var(--cpm-accent-text)]" : "text-[var(--cpm-text-faint)]"}`}>{l.who}: </span>
                <span className="text-[var(--cpm-text-dim)]">{l.line}</span>
              </div>
            ))}
          </div>
        </section>

        <div className="flex flex-col gap-4">
          <section className={card}>
            <h3 className="px-4 py-2.5 border-b border-[var(--cpm-border)] text-[14px] font-bold text-[var(--cpm-text)]">Submission notes</h3>
            <div className="px-4 py-3 flex flex-col gap-2">
              <p className="text-[12px] text-[var(--cpm-text-faint)]">Fill in all 7, then copy into the carrier notes. Some carriers ask for more, so check the carrier&apos;s lesson. Nothing here is saved.</p>
              {NOTE_FIELDS.map((f) => (
                <label key={f.key} className="flex flex-col gap-0.5 text-[11.5px] text-[var(--cpm-text-dim)]">
                  {f.label}
                  <input className={input} value={notes[f.key] ?? ""} onChange={(e) => setNotes((n) => ({ ...n, [f.key]: e.target.value }))} />
                </label>
              ))}
              <label className="flex flex-col gap-0.5 text-[11.5px] text-[var(--cpm-text-dim)]">
                Next follow-up (date and time)
                <input type="datetime-local" className={input} value={next} onChange={(e) => setNext(e.target.value)} />
              </label>
              <div className="flex items-center gap-2 mt-1">
                <button type="button" className="ghostBtn" onClick={copy} disabled={missing.length > 0}>
                  {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? "Copied" : "Copy notes"}
                </button>
                {missing.length > 0 && <span className="text-[12px] text-[var(--cpm-text-faint)]">{missing.length} still empty</span>}
              </div>
            </div>
          </section>

          <section className={card}>
            <h3 className="px-4 py-2.5 border-b border-[var(--cpm-border)] text-[14px] font-bold text-[var(--cpm-text)]">Follow-up rules</h3>
            <ul className="px-4 py-3 list-disc pl-8 text-[12.5px] text-[var(--cpm-text-dim)] flex flex-col gap-1">
              {FOLLOW_UP.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
