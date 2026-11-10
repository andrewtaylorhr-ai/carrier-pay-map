"use client";

import { useState } from "react";
import { useCarrierMap } from "@/lib/carrier-map-context";
import { KNOWLEDGE_CHECKS, type KnowledgeCheck } from "@/lib/training-content";

const card = "rounded-xl border border-[var(--cpm-border)] bg-[var(--cpm-panel)]";
const select =
  "h-8 px-2.5 rounded-lg border border-[var(--cpm-border-strong)] bg-[var(--cpm-panel-alt)] text-[12.5px] text-[var(--cpm-text)] outline-none focus:border-[var(--cpm-accent)]";
const main = "px-4 h-9 rounded-lg text-[13px] font-semibold bg-[var(--cpm-accent)] text-[var(--cpm-accent-ink)] hover:bg-[var(--cpm-accent-strong)] disabled:opacity-50 disabled:cursor-not-allowed";

const shuffledOrder = (check: KnowledgeCheck) =>
  check.questions.map((q) => {
    const order = q.options.map((_, i) => i);
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }
    return order;
  });

// A short quiz for each part of the Academy, plus the practical scenarios.
// Each trainee's best score per quiz is saved on their training file.
export function KnowledgeChecks({ taker, takers, setTaker }: { taker: string; takers: string[]; setTaker: (name: string) => void }) {
  const { trainees, updateTrainee } = useCarrierMap();
  const [open, setOpen] = useState<string | null>(null);
  const t = trainees[taker];
  const check = KNOWLEDGE_CHECKS.find((c) => c.id === open);

  const finish = (c: KnowledgeCheck, pct: number, why: string[]) => {
    if (!t) return;
    const quizScores = { ...t.quizScores, [c.id]: Math.max(pct, t.quizScores?.[c.id] ?? 0) };
    updateTrainee(taker, c.explain ? { quizScores, scenarioWhy: why } : { quizScores });
  };

  return (
    <div className="flex flex-col gap-3 max-w-[860px]">
      <label className="flex items-center gap-2 text-[12.5px] text-[var(--cpm-text-dim)]">
        Who is taking it?
        <select
          className={select}
          value={t ? taker : ""}
          onChange={(e) => {
            setTaker(e.target.value);
            setOpen(null);
          }}
        >
          <option value="">Nobody (practice)</option>
          {takers.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </label>

      {check ? (
        <Quiz key={`${check.id}-${taker}`} check={check} taker={t ? taker : undefined} onFinish={(pct, why) => finish(check, pct, why)} onBack={() => setOpen(null)} />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {KNOWLEDGE_CHECKS.map((c) => {
            const best = t?.quizScores?.[c.id];
            return (
              <div key={c.id} className={`${card} px-4 py-3 flex items-center gap-3`}>
                <div className="min-w-0">
                  <div className="text-[13.5px] font-bold text-[var(--cpm-text)]">{c.title}</div>
                  <div className="text-[12px] text-[var(--cpm-text-faint)]">
                    {c.questions.length} {c.explain ? "scenarios" : "questions"}
                    {best != null && ` · best ${best}%`}
                  </div>
                </div>
                <button type="button" className="ghostBtn ml-auto" onClick={() => setOpen(c.id)}>
                  {best != null ? "Again" : "Start"}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Quiz({ check, taker, onFinish, onBack }: { check: KnowledgeCheck; taker?: string; onFinish: (pct: number, why: string[]) => void; onBack: () => void }) {
  const [answers, setAnswers] = useState<(number | null)[]>(() => check.questions.map(() => null));
  const [why, setWhy] = useState<string[]>(() => check.questions.map(() => ""));
  const [orders] = useState(() => shuffledOrder(check));
  const [submitted, setSubmitted] = useState(false);
  const total = check.questions.length;
  const score = answers.filter((a, i) => a === check.questions[i].answer).length;
  const pct = Math.round((score / total) * 100);
  const ready = answers.every((a) => a != null) && (!check.explain || why.every((w) => w.trim()));

  return (
    <div className="flex flex-col gap-3">
      <div className={`${card} px-4 py-3 flex items-center gap-3 flex-wrap`}>
        <div>
          <div className="text-[15px] font-bold text-[var(--cpm-text)]">
            {check.title}
            {taker ? ` · ${taker}` : ""}
          </div>
          <div className="text-[12px] text-[var(--cpm-text-faint)]">
            {check.explain ? "Pick the right action and explain why." : "Pick one answer for each question."}
            {!taker && " Practice run, score not saved."}
          </div>
        </div>
        {submitted && (
          <div className="ml-auto text-[13px] font-bold text-[var(--cpm-text)]">
            {score}/{total} · {pct}%
          </div>
        )}
        <button type="button" className={`ghostBtn ${submitted ? "" : "ml-auto"}`} onClick={onBack}>
          Back to the list
        </button>
      </div>

      <ol className="flex flex-col gap-3">
        {check.questions.map((item, qi) => {
          const picked = answers[qi];
          return (
            <li key={qi} className={`${card} px-4 py-3`}>
              <div className="text-[13.5px] font-semibold text-[var(--cpm-text)] mb-2">
                {qi + 1}. {item.q}
              </div>
              <div className="grid gap-1.5">
                {orders[qi].map((oi, pos) => {
                  let tone = "border-[var(--cpm-border)] hover:border-[var(--cpm-border-strong)] text-[var(--cpm-text-dim)]";
                  if (!submitted && picked === oi) tone = "border-[var(--cpm-accent)] bg-[var(--cpm-panel-alt)] text-[var(--cpm-text)]";
                  if (submitted && oi === item.answer) tone = "border-[var(--cpm-green)] bg-[var(--cpm-green-soft)] text-[var(--cpm-text)]";
                  else if (submitted && picked === oi) tone = "border-[var(--cpm-red)] bg-[var(--cpm-red-soft)] text-[#ff9a9d]";
                  return (
                    <button
                      key={oi}
                      type="button"
                      disabled={submitted}
                      onClick={() => setAnswers((prev) => prev.map((a, i) => (i === qi ? oi : a)))}
                      className={`text-left text-[12.5px] px-3 py-2 rounded-lg border transition-colors disabled:cursor-default ${tone}`}
                    >
                      <span className="font-bold mr-1.5 text-[var(--cpm-text-faint)]">{String.fromCharCode(65 + pos)}</span>
                      {item.options[oi]}
                    </button>
                  );
                })}
              </div>
              {check.explain && (
                <textarea
                  value={why[qi]}
                  disabled={submitted}
                  onChange={(e) => setWhy((prev) => prev.map((w, i) => (i === qi ? e.target.value : w)))}
                  placeholder="Why is this the right action?"
                  className="mt-2 w-full min-h-[52px] px-2.5 py-2 rounded-lg border border-[var(--cpm-border-strong)] bg-[var(--cpm-panel-alt)] text-[12.5px] text-[var(--cpm-text)] outline-none focus:border-[var(--cpm-accent)] resize-y"
                />
              )}
              {submitted && (
                <div className={`mt-2 text-[12px] ${picked === item.answer ? "text-[var(--cpm-green)]" : "text-[#ff9a9d]"}`}>
                  {picked === item.answer ? "Correct. " : "Wrong. "}
                  <span className="text-[var(--cpm-text-dim)]">{item.why}</span>
                  <span className="text-[var(--cpm-text-faint)]"> · Lesson: {item.lesson}</span>
                </div>
              )}
            </li>
          );
        })}
      </ol>

      {!submitted && (
        <div className="flex items-center gap-3">
          <button
            type="button"
            className={main}
            disabled={!ready}
            onClick={() => {
              setSubmitted(true);
              onFinish(pct, why);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          >
            Check the answers
          </button>
          {!ready && <span className="text-[12px] text-[var(--cpm-text-faint)]">{check.explain ? "Answer and explain every scenario first." : "Answer every question first."}</span>}
        </div>
      )}
    </div>
  );
}
