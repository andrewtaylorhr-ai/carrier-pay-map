"use client";

import { useState } from "react";
import { PAPER_TEST, letter } from "@/lib/academy-test";

// Grade a filled-in Word test: click the letter the trainee wrote for each
// question, then save. Questions are in the same order as the Word file.
export function PaperGrader({ taker, passMark, locked, onSave }: { taker?: string; passMark: number; locked?: boolean; onSave: (pct: number) => void }) {
  const [picked, setPicked] = useState<(number | null)[]>(() => PAPER_TEST.map(() => null));
  const [saved, setSaved] = useState<number | null>(null);
  const total = PAPER_TEST.length;
  const filled = picked.filter((p) => p != null).length;
  const score = picked.filter((p, i) => p === PAPER_TEST[i].answer).length;
  const pct = Math.round((score / total) * 100);

  const save = () => {
    onSave(pct);
    setSaved(pct);
  };

  return (
    <div className="max-w-[860px] flex flex-col gap-3">
      <div className="rounded-xl border border-[var(--cpm-border)] bg-[var(--cpm-panel)] px-4 py-3 flex items-center gap-3 flex-wrap">
        <div>
          <div className="text-[15px] font-bold text-[var(--cpm-text)]">Grade a paper test{taker ? ` · ${taker}` : ""}</div>
          <div className="text-[12px] text-[var(--cpm-text-faint)]">
            Click the letter they wrote for each question. Same order as the Word file. Pass with {passMark}%.{locked && saved == null ? " No attempts left: reset them on their training file." : ""}
          </div>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-[12px] text-[var(--cpm-text-faint)]">
            {filled}/{total} entered
          </span>
          <button
            type="button"
            onClick={save}
            disabled={!taker || filled < total || locked}
            title={!taker ? "Pick who took the test first" : undefined}
            className="px-4 h-9 rounded-lg text-[13px] font-semibold bg-[var(--cpm-accent)] text-[#241800] hover:bg-[var(--cpm-accent-strong)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Grade and save
          </button>
        </div>
      </div>

      {saved != null && (
        <div
          className={`rounded-xl border px-4 py-3 text-[13px] ${
            saved >= passMark
              ? "bg-[var(--cpm-green-soft)] text-[var(--cpm-green)] border-[var(--cpm-green)]"
              : "bg-[var(--cpm-red-soft)] text-[#ff9a9d] border-[var(--cpm-red)]"
          }`}
        >
          <span className="font-bold">
            {score}/{total} · {saved}% · {saved >= passMark ? "Passed ✓" : "Not passed"}
          </span>
          {score < total && (
            <span className="text-[var(--cpm-text-dim)]">
              {" "}
              · Wrong:{" "}
              {PAPER_TEST.map((q, i) => (picked[i] !== q.answer ? `${i + 1} (${q.lesson})` : null))
                .filter(Boolean)
                .join(", ")}
            </span>
          )}
        </div>
      )}

      <div className="rounded-xl border border-[var(--cpm-border)] bg-[var(--cpm-panel)] divide-y divide-[var(--cpm-border)]">
        {PAPER_TEST.map((q, i) => {
          const p = picked[i];
          return (
            <div key={i} className="flex items-center gap-3 px-4 py-2">
              <span className="w-7 text-[12.5px] font-bold tabular-nums text-[var(--cpm-text-faint)]">{i + 1}.</span>
              <span className="flex-1 min-w-0 text-[12.5px] text-[var(--cpm-text-dim)] truncate" title={q.q}>
                {q.q}
              </span>
              <div className="flex gap-1">
                {q.options.map((_, oi) => {
                  const on = p === oi;
                  const graded = saved != null;
                  const tone =
                    graded && oi === q.answer
                      ? "border-[var(--cpm-green)] bg-[var(--cpm-green-soft)] text-[var(--cpm-green)]"
                      : on && graded
                        ? "border-[var(--cpm-red)] bg-[var(--cpm-red-soft)] text-[#ff9a9d]"
                        : on
                          ? "border-[var(--cpm-accent)] bg-[var(--cpm-accent)] text-[#241800]"
                          : "border-[var(--cpm-border-strong)] text-[var(--cpm-text-dim)] hover:text-[var(--cpm-text)]";
                  return (
                    <button
                      key={oi}
                      type="button"
                      onClick={() => {
                        setPicked((prev) => prev.map((x, k) => (k === i ? oi : x)));
                        setSaved(null);
                      }}
                      className={`w-8 h-7 rounded-md border text-[12px] font-bold ${tone}`}
                    >
                      {letter(oi)}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
