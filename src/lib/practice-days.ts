// Days 2 and 3 of training, after the Academy (day 1) and its test.
// Day 2 is rehearsal: listen, match drivers to carriers, role-play.
// Day 3 is the first real calls with the manager listening.
import { type DocBlock, downloadDocx } from "@/lib/docx";
import type { PlanItem } from "@/lib/training-program";

export type DayBlock = { time: string; title: string; how: string[]; tasks: PlanItem[] };
export type DayPlan = { day: 2 | 3; title: string; goal: string; blocks: DayBlock[] };

export const READY_CHECK: PlanItem = { id: "check-ready", title: "Ready for calls: passed day 2 and 3, can start quality control" };

export const DAY_PLANS: DayPlan[] = [
  {
    day: 2,
    title: "Day 2 · Practice",
    goal: "No real calls yet. They rehearse until the call flow comes naturally.",
    blocks: [
      {
        time: "Morning · 1 hr",
        title: "Fix the gaps",
        how: [
          "Open their Academy test result and go over every wrong answer.",
          "They reread the lessons listed under \"Lessons to go over again\".",
          "Didn't pass? They take the test again at the end of the day.",
        ],
        tasks: [
          { id: "day2-review", title: "Went over the test mistakes and reread those lessons" },
          { id: "day2-retest", title: "Passed the test (retook it if needed)" },
        ],
      },
      {
        time: "Late morning · 2 hrs",
        title: "Listen to real calls",
        how: [
          "They sit with your best recruiter, or listen to recorded calls, for 8–10 calls.",
          "For each call they fill in the listening sheet: what the driver needed, which carrier fit, the objection and how it was handled.",
          "You check the sheet at lunch. It shows whether they understood the calls or just heard them.",
        ],
        tasks: [
          { id: "task-live-calls", title: "Listened to 8–10 calls and filled in the listening sheet" },
          { id: "day2-notes-checked", title: "You checked their listening sheet" },
        ],
      },
      {
        time: "Early afternoon · 1 hr",
        title: "Carrier quick-fire",
        how: [
          "Use the quick-fire cards below: read out a driver profile.",
          "They answer: which carrier fits and why, or what disqualifies the driver and where to send them instead.",
          "They use the pay map while answering, so they learn the tool and the carriers together.",
        ],
        tasks: [{ id: "day2-quickfire", title: "Matched 10 driver profiles to a carrier (or a DQ and where to send them)" }],
      },
      {
        time: "Late afternoon · 2 hrs",
        title: "Role-plays with you",
        how: [
          "You play the driver using the role-play cards below. They follow the Call Script.",
          "Repeat each one until it's smooth, not just once.",
        ],
        tasks: [
          { id: "task-roleplay-easy", title: "Role-play 1: an easy driver who qualifies, full call start to finish" },
          { id: "task-roleplay-dq", title: "Role-play 2: a driver who doesn't qualify, said no politely and kept the lead" },
          { id: "task-roleplay-objections", title: "Role-play 3: a driver with objections" },
        ],
      },
      {
        time: "End of day · 15 min",
        title: "Short talk",
        how: [
          "Was the call flow natural? Did they know the carriers? How did they handle objections?",
          "Decide: real calls with you listening tomorrow, or one more practice day.",
        ],
        tasks: [{ id: "day2-talk", title: "End-of-day talk done, ready for live calls tomorrow" }],
      },
    ],
  },
  {
    day: 3,
    title: "Day 3 · First live calls",
    goal: "Real calls with you listening, then on their own with spot checks.",
    blocks: [
      {
        time: "Morning · 30 min",
        title: "Warm-up",
        how: ["5 quick-fire profiles and one objection role-play, to get them talking before the first real call."],
        tasks: [{ id: "day3-warmup", title: "Warm-up done: 5 quick-fire profiles and 1 objection role-play" }],
      },
      {
        time: "Morning · 2–3 hrs",
        title: "Live calls with you listening",
        how: [
          "They call real leads while you listen. Start with warm leads (drivers who applied).",
          "After each call give one or two lines of feedback: one thing that was good, one thing to change.",
          "Log each call in the call log at the bottom of their file.",
        ],
        tasks: [
          { id: "day3-live-calls", title: "Made at least 5 live calls with you listening" },
          { id: "day3-feedback", title: "Gave feedback after each call" },
        ],
      },
      {
        time: "Midday · 30 min",
        title: "Review",
        how: ["Go over the morning calls together. Pick the 1–2 things they work on this afternoon."],
        tasks: [{ id: "day3-fix", title: "Picked the 1–2 things to fix this afternoon" }],
      },
      {
        time: "Afternoon · 2–3 hrs",
        title: "Calls on their own",
        how: [
          "They keep calling on their own. You listen in on a few calls without warning.",
          "Check they applied this morning's feedback, and that leads and follow-ups are saved.",
        ],
        tasks: [
          { id: "day3-solo", title: "Made calls on their own, you spot-checked a few" },
          { id: "day3-followups", title: "Leads and follow-ups are saved for every call" },
        ],
      },
    ],
  },
];

export const dayTasks = (plan: DayPlan) => plan.blocks.flatMap((b) => b.tasks);

// ---- Quick-fire: a random driver profile to match to a carrier.

const pick = <T,>(list: T[]) => list[Math.floor(Math.random() * list.length)];

const EXPERIENCE = ["Fresh out of CDL school", "3 months", "6 months", "8 months", "1 year", "18 months", "2 years", "3 years", "5 years", "10+ years"];
const STATES = ["TX", "OH", "GA", "FL", "IL", "PA", "NC", "TN", "IN", "MO", "AZ", "CA", "AL", "MI", "AR", "KY", "OK", "NJ"];
const RECORD = [
  "Clean record",
  "Clean record",
  "1 speeding ticket in the last 3 years",
  "2 moving violations in the last year",
  "1 preventable accident 8 months ago",
  "1 non-preventable accident last year",
  "DUI 6 years ago",
  "Failed a drug test, finished the SAP program",
  "Felony 9 years ago",
];
const HOME_TIME = ["Wants to be home daily", "Wants to be home weekly", "Home every 2 weeks is fine", "OTR, home time doesn't matter", "Needs to be home every weekend"];
const EQUIPMENT = ["Dry van", "Reefer", "Flatbed", "Any equipment", "Dry van, no touch freight"];
const EXTRA = [
  "Last job ended 4 months ago (unemployment gap)",
  "Has had 3 jobs in the last year",
  "Wants to bring a rider",
  "Wants to bring a pet",
  "Currently working, just looking",
  "Wants team driving",
  "Only wants weekly pay",
  "",
  "",
];

export type DriverProfile = { experience: string; state: string; record: string; home: string; equipment: string; extra: string };

export const randomProfile = (): DriverProfile => ({
  experience: pick(EXPERIENCE),
  state: pick(STATES),
  record: pick(RECORD),
  home: pick(HOME_TIME),
  equipment: pick(EQUIPMENT),
  extra: pick(EXTRA),
});

// ---- Role-play cards: the manager plays the driver.

export type RolePlay = { id: string; title: string; driver: string; youSay: string[]; lookFor: string[] };

export const ROLE_PLAYS: RolePlay[] = [
  {
    id: "task-roleplay-easy",
    title: "1 · Easy driver who qualifies",
    driver: "Mike, 4 years OTR dry van, clean record, lives near Dallas TX. Home every 2 weeks now, wants more home time. Friendly and open.",
    youSay: ["\"Yeah, I saw your ad. What's the pay?\"", "\"How often would I be home?\"", "\"Is it no-touch freight?\""],
    lookFor: [
      "Introduces themself and the company, builds rapport first",
      "Asks the 7 questions and pre-qualifies before talking pay",
      "Presents one job that fits: pay, home time, equipment",
      "Explains practical miles if pay comes up",
      "Gets the application (Tenstreet link) and sets the next step",
    ],
  },
  {
    id: "task-roleplay-dq",
    title: "2 · Driver who doesn't qualify",
    driver: "Carlos, 8 months out of CDL school, 2 speeding tickets last year and a preventable accident 6 months ago. Really wants the job.",
    youSay: ["\"I'm a good driver, the accident wasn't really my fault.\"", "\"Can't you just put me through anyway?\"", "\"So what am I supposed to do?\""],
    lookFor: [
      "Finds the problem during pre-qualification, not after the offer",
      "Says no politely and honestly, without blaming the driver",
      "Checks the map for a carrier that could take him",
      "If none fit: sets a follow-up date for when he'll qualify",
      "Keeps the lead and saves notes",
    ],
  },
  {
    id: "task-roleplay-objections",
    title: "3 · Driver with objections",
    driver: "Denise, 10 years experience, currently working, \"just looking\". Short answers, a bit doubtful about recruiters.",
    youSay: [
      "\"The pay is too low.\"",
      "\"I'm not interested, I already have a job.\"",
      "\"Just text me the details.\"",
      "\"Another recruiter offered me more.\"",
      "\"I heard bad things about that company.\"",
      "\"I need to talk to my husband first.\"",
    ],
    lookFor: [
      "Stays calm and asks what matters most to her",
      "Answers with facts (weekly pay, practical miles, home time), no pushing",
      "Never talks badly about other companies or recruiters",
      "If she isn't ready: agrees a day and time for a follow-up call",
    ],
  },
];

// ---- Word sheet for day 2: one box per call they listen to.

export function downloadListeningSheet() {
  const blocks: DocBlock[] = [
    { kind: "title", text: "Call Listening Sheet · Day 2" },
    { kind: "para", text: "Name: ______________________________          Date: ______________", spaceAfter: 120 },
    { kind: "para", text: "Fill in one box for each call you listen to. Your manager checks this at lunch.", italic: true, spaceAfter: 240 },
  ];
  for (let i = 1; i <= 10; i++) {
    blocks.push({ kind: "heading", text: `Call ${i}` });
    for (const line of ["What the driver needed:", "Carrier that fit (or why DQ):", "Objection:", "How the recruiter handled it:"])
      blocks.push({ kind: "para", text: `${line} ________________________________________________`, indent: true, spaceAfter: 100 });
    blocks.push({ kind: "para", text: "", spaceAfter: 120 });
    if (i === 5) blocks.push({ kind: "pageBreak" });
  }
  downloadDocx("Call Listening Sheet.docx", blocks);
}
