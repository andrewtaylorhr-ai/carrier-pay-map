"use client";

import { useState } from "react";
import { ACADEMY_TEST } from "@/lib/academy-test";

// Answer options are shuffled on every attempt, so the right answer isn't
// always in the same place.
const shuffled = () =>
  ACADEMY_TEST.map((q) => {
    const order = q.options.map((_, i) => i);
    if (q.options.length === 2) return order; // true / false stays in that order
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }
    return order;
  });

// The Academy test. Run it with a trainee (sitting together or on a shared
// screen); their best score is saved on their training file.
export function AcademyTest({
  taker,
  best,
  passMark,
  locked,
  onFinish,
}: {
  taker?: string;
  best?: number | null;
  passMark: number;
  locked?: boolean; // no attempts left
  onFinish?: (pct: number) => void;
}) {
  const [answers, setAnswers] = useState<(number | null)[]>(() => ACADEMY_TEST.map(() => null));
  const [submitted, setSubmitted] = useState(false);
  const [orders, setOrders] = useState(shuffled);

  const total = ACADEMY_TEST.length;
  const score = answers.filter((a, i) => a === ACADEMY_TEST[i].answer).length;
  const pct = Math.round((score / total) * 100);
  const passed = pct >= passMark;
  const answered = answers.filter((a) => a != null).length;
  const wrongLessons = [...new Set(ACADEMY_TEST.filter((q, i) => answers[i] !== q.answer).map((q) => q.lesson))];

  const submit = () => {
    setSubmitted(true);
    onFinish?.(pct);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const retry = () => {
    setAnswers(ACADEMY_TEST.map(() => null));
    setOrders(shuffled());
    setSubmitted(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="max-w-[860px]">
      <div className="rounded-xl border border-[var(--cpm-border)] bg-[var(--cpm-panel)] px-4 py-3 mb-3 flex items-center gap-4 flex-wrap">
        <div>
          <div className="text-[15px] font-bold text-[var(--cpm-text)]">Academy test{taker ? ` · ${taker}` : ""}</div>
          <div className="text-[12px] text-[var(--cpm-text-faint)]">
            {total} questions from the Academy · pass with {passMark}% or more
            {best != null && ` · best so far: ${best}%`}
            {!taker && " · practice run, score not saved"}
          </div>
        </div>
        {submitted && (
          <div
            className={`ml-auto px-3 py-1.5 rounded-lg border text-[13px] font-bold ${
              passed
                ? "bg-[var(--cpm-green-soft)] text-[var(--cpm-green)] border-[var(--cpm-green)]"
                : "bg-[var(--cpm-red-soft)] text-[#ff9a9d] border-[var(--cpm-red)]"
            }`}
          >
            {score}/{total} · {pct}% · {passed ? "Passed ✓" : "Not passed"}
          </div>
        )}
      </div>

      {locked && !submitted && (
        <div className="rounded-xl border border-[var(--cpm-red)] bg-[var(--cpm-red-soft)] px-4 py-3 mb-3 text-[13px] text-[#ff9a9d]">
          No attempts left for {taker}. Reset their attempts on their training file to allow another try.
        </div>
      )}

      {submitted && wrongLessons.length > 0 && (
        <div className="rounded-xl border border-[var(--cpm-border)] bg-[var(--cpm-panel)] px-4 py-3 mb-3 text-[12.5px] text-[var(--cpm-text-dim)]">
          <span className="font-semibold text-[var(--cpm-text)]">Lessons to go over again: </span>
          {wrongLessons.join(" · ")}
        </div>
      )}

      {!(locked && !submitted) && (
      <>
      <ol className="flex flex-col gap-3">
        {ACADEMY_TEST.map((item, qi) => {
          const picked = answers[qi];
          const right = picked === item.answer;
          return (
            <li key={qi} className="rounded-xl border border-[var(--cpm-border)] bg-[var(--cpm-panel)] px-4 py-3">
              <div className="text-[13.5px] font-semibold text-[var(--cpm-text)] mb-2">
                {qi + 1}. {item.q}
              </div>
              <div className="grid gap-1.5 sm:grid-cols-2">
                {orders[qi].map((oi, pos) => {
                  const opt = item.options[oi];
                  const isPicked = picked === oi;
                  let tone = "border-[var(--cpm-border)] hover:border-[var(--cpm-border-strong)] text-[var(--cpm-text-dim)]";
                  if (!submitted && isPicked) tone = "border-[var(--cpm-accent)] bg-[var(--cpm-panel-alt)] text-[var(--cpm-text)]";
                  if (submitted && oi === item.answer) tone = "border-[var(--cpm-green)] bg-[var(--cpm-green-soft)] text-[var(--cpm-text)]";
                  else if (submitted && isPicked) tone = "border-[var(--cpm-red)] bg-[var(--cpm-red-soft)] text-[#ff9a9d]";
                  return (
                    <button
                      key={oi}
                      type="button"
                      disabled={submitted}
                      onClick={() => setAnswers((prev) => prev.map((a, i) => (i === qi ? oi : a)))}
                      className={`text-left text-[12.5px] px-3 py-2 rounded-lg border transition-colors disabled:cursor-default ${tone}`}
                    >
                      <span className="font-bold mr-1.5 text-[var(--cpm-text-faint)]">{String.fromCharCode(65 + pos)}</span>
                      {opt}
                    </button>
                  );
                })}
              </div>
              {submitted && (
                <div className={`mt-2 text-[12px] ${right ? "text-[var(--cpm-green)]" : "text-[#ff9a9d]"}`}>
                  {right ? "Correct. " : picked == null ? "Not answered. " : "Wrong. "}
                  <span className="text-[var(--cpm-text-dim)]">{item.why}</span>
                  <span className="text-[var(--cpm-text-faint)]"> · Lesson: {item.lesson}</span>
                </div>
              )}
            </li>
          );
        })}
      </ol>

      <div className="mt-3 flex items-center gap-3">
        {submitted ? (
          !locked && (
          <button
            type="button"
            onClick={retry}
            className="px-4 h-9 rounded-lg text-[13px] font-semibold bg-[var(--cpm-accent)] text-[var(--cpm-accent-ink)] hover:bg-[var(--cpm-accent-strong)]"
          >
            Try again
          </button>
          )
        ) : (
          <>
            <button
              type="button"
              onClick={submit}
              disabled={answered < total}
              className="px-4 h-9 rounded-lg text-[13px] font-semibold bg-[var(--cpm-accent)] text-[var(--cpm-accent-ink)] hover:bg-[var(--cpm-accent-strong)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Check the answers
            </button>
            <span className="text-[12px] text-[var(--cpm-text-faint)]">
              {answered}/{total} answered
            </span>
          </>
        )}
      </div>
      </>
      )}
    </div>
  );
}
