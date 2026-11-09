"use client";

import { useState } from "react";
import { QUIZ_PASS } from "@/lib/training-program";

type Q = { q: string; options: string[]; answer: number; why: string };

const QUESTIONS: Q[] = [
  {
    q: "What license does every driver we recruit need?",
    options: ["Class B CDL", "CDL Class A", "Regular driver's license", "Hazmat endorsement"],
    answer: 1,
    why: "We recruit tractor-trailer drivers, which needs a CDL Class A (or a student finishing one).",
  },
  {
    q: "A driver must be home every night. Which job type fits?",
    options: ["OTR", "Regional", "Local", "Team OTR"],
    answer: 2,
    why: "Local jobs are home daily. OTR is out for weeks; regional is usually home weekly.",
  },
  {
    q: "What does CPM mean?",
    options: ["Cost per month", "Cents per mile", "Calls per minute", "Carrier performance metric"],
    answer: 1,
    why: "Most OTR and regional drivers are paid cents per mile.",
  },
  {
    q: "Which report shows a driver's tickets, accidents and suspensions?",
    options: ["DAC report", "PSP", "MVR", "DOT medical card"],
    answer: 2,
    why: "The MVR (Motor Vehicle Record) is the first thing carriers check.",
  },
  {
    q: "A driver failed a drug test last year and never finished return-to-duty. What blocks them?",
    options: ["The FMCSA Clearinghouse", "Their MVR", "Hours of Service", "Their endorsements"],
    answer: 0,
    why: "A failed or refused test in the Clearinghouse blocks hiring until return-to-duty is done.",
  },
  {
    q: "A new CDL graduate with no experience calls you. What do you do?",
    options: [
      "Tell them nobody hires without experience",
      "Send them to any account",
      "Only pitch accounts that accept students or trainees",
      "Ask them to call back in a year",
    ],
    answer: 2,
    why: "Some accounts accept trainees. Always check the account's experience rule first.",
  },
  {
    q: "Where do you check an account's pay, home time and experience rules?",
    options: ["Ask the driver", "The Pay Map and your account list", "Guess from the carrier name", "Daily Tracker"],
    answer: 1,
    why: "The Pay Map has every open account with pay, home time and requirements.",
  },
  {
    q: "A driver asks how much they will make. What's the right answer?",
    options: [
      "Promise the highest number you've heard",
      "Give the account's weekly pay range and say it depends on miles and lane",
      "Say you don't know",
      "Tell them to ask the carrier",
    ],
    answer: 1,
    why: "Use the real range from the account. Never promise a number the account doesn't show.",
  },
  {
    q: "How is a sign-on bonus usually paid?",
    options: ["All at once on day one", "In parts over the first weeks or months", "After one year", "Only to team drivers"],
    answer: 1,
    why: "Bonuses are usually split into payments over time. Give the account's real schedule.",
  },
  {
    q: "When should you follow up with a driver you submitted?",
    options: ["Within 24 hours", "After a week", "Only if they call you", "After orientation"],
    answer: 0,
    why: "Call back within 24 hours. Many drivers are lost because nobody followed up.",
  },
  {
    q: "You just submitted a driver. Where do you log it?",
    options: ["Nowhere", "In the Daily Tracker, the same day", "At the end of the month", "In the Pay Map"],
    answer: 1,
    why: "Every submission goes in the Daily Tracker the same day so reports stay right.",
  },
  {
    q: "What is a Team driving job?",
    options: [
      "A job with a big company",
      "Two drivers share one truck and drive in shifts",
      "A driver who trains new hires",
      "A local job with a helper",
    ],
    answer: 1,
    why: "Team drivers share a truck so it keeps moving, which usually means higher pay.",
  },
];

const PASS = QUIZ_PASS / 100;

// Run it with a trainee (sitting together or on a shared screen); their best
// score is saved on their training file.
export function TrainingQuiz({ taker, best, onFinish }: { taker?: string; best?: number | null; onFinish?: (pct: number) => void }) {
  const [answers, setAnswers] = useState<(number | null)[]>(() => QUESTIONS.map(() => null));
  const [submitted, setSubmitted] = useState(false);

  const score = answers.filter((a, i) => a === QUESTIONS[i].answer).length;
  const pct = Math.round((score / QUESTIONS.length) * 100);
  const passed = score / QUESTIONS.length >= PASS;
  const answered = answers.filter((a) => a != null).length;

  const submit = () => {
    setSubmitted(true);
    onFinish?.(pct);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const retry = () => {
    setAnswers(QUESTIONS.map(() => null));
    setSubmitted(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="max-w-[820px]">
      <div className="rounded-xl border border-[var(--cpm-border)] bg-[var(--cpm-panel)] px-4 py-3 mb-3 flex items-center gap-4 flex-wrap">
        <div>
          <div className="text-[15px] font-bold text-[var(--cpm-text)]">Recruiter quiz{taker ? ` · ${taker}` : ""}</div>
          <div className="text-[12px] text-[var(--cpm-text-faint)]">
            {QUESTIONS.length} questions · pass with {PASS * 100}% or more
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
            {score}/{QUESTIONS.length} · {pct}% · {passed ? "Passed ✓" : "Not yet, review and try again"}
          </div>
        )}
      </div>

      <ol className="flex flex-col gap-3">
        {QUESTIONS.map((item, qi) => {
          const picked = answers[qi];
          const right = picked === item.answer;
          return (
            <li key={qi} className="rounded-xl border border-[var(--cpm-border)] bg-[var(--cpm-panel)] px-4 py-3">
              <div className="text-[13.5px] font-semibold text-[var(--cpm-text)] mb-2">
                {qi + 1}. {item.q}
              </div>
              <div className="grid gap-1.5 sm:grid-cols-2">
                {item.options.map((opt, oi) => {
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
                      <span className="font-bold mr-1.5 text-[var(--cpm-text-faint)]">{String.fromCharCode(65 + oi)}</span>
                      {opt}
                    </button>
                  );
                })}
              </div>
              {submitted && (
                <div className={`mt-2 text-[12px] ${right ? "text-[var(--cpm-green)]" : "text-[#ff9a9d]"}`}>
                  {right ? "Correct. " : picked == null ? "Not answered. " : "Wrong. "}
                  <span className="text-[var(--cpm-text-dim)]">{item.why}</span>
                </div>
              )}
            </li>
          );
        })}
      </ol>

      <div className="mt-3 flex items-center gap-3">
        {submitted ? (
          <button
            type="button"
            onClick={retry}
            className="px-4 h-9 rounded-lg text-[13px] font-semibold bg-[var(--cpm-accent)] text-[#241800] hover:bg-[var(--cpm-accent-strong)]"
          >
            Try again
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={submit}
              disabled={answered < QUESTIONS.length}
              className="px-4 h-9 rounded-lg text-[13px] font-semibold bg-[var(--cpm-accent)] text-[#241800] hover:bg-[var(--cpm-accent-strong)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Check my answers
            </button>
            <span className="text-[12px] text-[var(--cpm-text-faint)]">
              {answered}/{QUESTIONS.length} answered
            </span>
          </>
        )}
      </div>
    </div>
  );
}
