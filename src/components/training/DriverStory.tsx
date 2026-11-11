"use client";

// Step 1's "Meet the driver": one made-up driver followed from his old job to
// his first truck, through our call and his first year, until he calls another
// recruiter as an experienced driver. Chapters move with their own buttons so
// the arrow keys keep moving the training plan.
import { useState } from "react";
import {
  Baby,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  GraduationCap,
  Headset,
  MapPin,
  PhoneCall,
  Route,
  ShieldAlert,
  User,
  type LucideIcon,
} from "lucide-react";
import { eyebrow, panel } from "./SlideShow";

type Chapter = {
  short: string;
  title: string;
  icon: LucideIcon;
  points: string[];
  tip: string; // what it means for the recruiter
  stat?: { value: string; label: string };
};

const CHAPTERS: Chapter[] = [
  {
    short: "Meet Marcus",
    title: "Marcus Reed, 26, from Jackson, Mississippi",
    icon: User,
    points: [
      "Works in a warehouse driving a forklift, about $15 an hour",
      "Married, two kids, renting an apartment, one car payment",
      "No college degree and no plan to take on student debt",
      "Drivers come from every state: warehouse, factory, construction, retail, the military, or a career change",
    ],
    tip: "Every driver has a story. Ask where they're coming from before you talk about any job.",
  },
  {
    short: "Money",
    title: "Why trucking: the money",
    icon: DollarSign,
    points: [
      "His warehouse pay is around $31,000 a year, and bills keep going up",
      "A truck driver's median pay is about $57,000 a year, with no degree needed",
      "Company drivers also get health insurance, paid time off and a 401(k)",
      "Freight always moves, so good drivers always find work",
    ],
    stat: { value: "$57,440", label: "median yearly pay, heavy truck drivers (BLS, May 2024)" },
    tip: "Money is the first reason most new drivers call. Know the real weekly pay of every account, not just the highest number.",
  },
  {
    short: "Family",
    title: "Why trucking: the family situation",
    icon: Baby,
    points: [
      "He wants to give his kids a better life and save for a house",
      "His wife supports the idea, but they worry about him being away",
      "They talk about home time: OTR (weeks out), Regional (home weekly) or Local (home daily)",
      "For a new driver, the family decides as much as the driver does",
    ],
    tip: "Ask about the family early: who is at home, and what home time they need. That's what keeps the driver in the truck.",
  },
  {
    short: "Risks",
    title: "The risks he weighs",
    icon: ShieldAlert,
    points: [
      "Weeks away from home during training and the first months",
      "A training contract, usually around a year; quitting early can mean paying the school back",
      "Long hours sitting, eating on the road, and staying safe in bad weather",
      "Fear of broken promises: fewer miles, lower pay or less home time than the recruiter said",
    ],
    tip: "Be honest about the hard parts. A driver who hears the truth from you trusts you, and stays.",
  },
  {
    short: "CDL school",
    title: "Getting the CDL: company-paid school",
    icon: GraduationCap,
    points: [
      "He chooses a company-sponsored school, so he pays little or nothing up front",
      "Needs: 21 or older to drive between states, a DOT medical card and a drug test",
      "About 3 to 8 weeks: permit, classroom, yard and road practice, then the CDL test",
      "After school he drives with a trainer for a few weeks before going solo",
    ],
    tip: "Know which carriers train students in his state, what the contract is, and what the school pays during training.",
  },
  {
    short: "Our call",
    title: "Our call: from lead to hire",
    icon: Headset,
    points: [
      "He applies on Indeed; we call him fast, while he's still deciding",
      "Pre-qualification: tickets, accidents, criminal record, where he applied lately",
      "We match him to a carrier that trains in Mississippi and fits his home time",
      "Tenstreet application, follow-ups, orientation; he is hired once he's dispatched",
    ],
    tip: "This is the whole training plan in one call: introduce, build rapport, pre-qualify, present, submit, follow up.",
  },
  {
    short: "First year",
    title: "His first year on the road",
    icon: Route,
    points: [
      "Starts with a trainer, then gets his own truck",
      "Learns trip planning, backing, hours of service and fuel stops",
      "Keeps a clean record: no accidents, no tickets, every load on time",
      "Finishes his training contract and builds verifiable experience",
    ],
    tip: "The first year decides his career. Check in after the hire, and he'll remember you.",
  },
  {
    short: "Experienced",
    title: "One year later: now an experienced driver",
    icon: PhoneCall,
    points: [
      "With a year of verifiable experience, more carriers want him",
      "Now he looks for higher pay per mile, more home time, a sign-on bonus or a dedicated account",
      "He answers a job post, and this time another recruiter calls him",
      "The same Marcus, now a different call: verify his experience, ask why he's leaving, and what he wants next",
    ],
    tip: "Every new driver we hire becomes an experienced driver someone recruits. Treat new drivers well and they call you back.",
  },
];

export function DriverStory() {
  const [at, setAt] = useState(0);
  const ch = CHAPTERS[at];
  const Icon = ch.icon;
  const experienced = at === CHAPTERS.length - 1;

  return (
    <div className={`tp-rise ${panel} mt-3`}>
      <div className="flex items-center gap-3 flex-wrap">
        <div className="w-11 h-11 rounded-full bg-[var(--cpm-accent)] text-white flex items-center justify-center shrink-0">
          <User size={22} />
        </div>
        <div className="min-w-0">
          <div className={`${eyebrow} text-[var(--cpm-accent-text)]`}>Meet the driver</div>
          <div className="text-[15px] font-bold text-[var(--cpm-text)] flex items-center gap-2 flex-wrap">
            Marcus Reed
            <span
              className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                experienced ? "bg-[var(--cpm-green)] text-[#06240f]" : "bg-[#ca8a04] text-[#1f1300]"
              }`}
            >
              {experienced ? "Experienced driver" : "New driver"}
            </span>
            <span className="inline-flex items-center gap-1 text-[12px] font-medium text-[var(--cpm-text-faint)]">
              <MapPin size={12} /> Jackson, MS
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-1 mt-3">
        {CHAPTERS.map((c, i) => (
          <button
            key={c.short}
            type="button"
            onClick={() => setAt(i)}
            className={`shrink-0 h-7 px-2.5 rounded-md text-[11.5px] font-semibold border transition-colors ${
              i === at
                ? "bg-[var(--cpm-accent)] border-[var(--cpm-accent)] text-white"
                : i < at
                  ? "border-[var(--cpm-accent)] text-[var(--cpm-text)]"
                  : "border-[var(--cpm-border-strong)] text-[var(--cpm-text-dim)] hover:text-[var(--cpm-text)]"
            }`}
          >
            {i + 1}. {c.short}
          </button>
        ))}
      </div>

      <div key={at} className="tp-rise mt-3 grid gap-3 md:grid-cols-[3fr_2fr] items-start">
        <div>
          <h3 className="flex items-center gap-2 text-[18px] md:text-[20px] font-extrabold text-[var(--cpm-text)]">
            <Icon size={20} className="text-[var(--cpm-accent-text)] shrink-0" /> {ch.title}
          </h3>
          <ul className="mt-2.5 grid gap-2">
            {ch.points.map((p) => (
              <li key={p} className="flex gap-2.5 text-[14px] leading-[1.45] text-[var(--cpm-text)]">
                <span className="mt-[7px] w-1.5 h-1.5 rounded-full shrink-0 bg-[var(--cpm-accent)]" />
                {p}
              </li>
            ))}
          </ul>
        </div>
        <div className="flex flex-col gap-2.5">
          {ch.stat && (
            <div className="rounded-lg border border-[var(--cpm-border)] bg-[var(--cpm-bg)] px-4 py-3">
              <div className="text-[26px] font-extrabold text-[var(--cpm-green)] leading-none">{ch.stat.value}</div>
              <div className="text-[11.5px] text-[var(--cpm-text-faint)] mt-1">{ch.stat.label}</div>
            </div>
          )}
          <div className="rounded-lg border border-[var(--cpm-accent)] bg-[var(--cpm-bg)] px-4 py-3">
            <div className={`${eyebrow} text-[var(--cpm-accent-text)]`}>For the recruiter</div>
            <p className="text-[13.5px] leading-[1.45] text-[var(--cpm-text)] mt-1">{ch.tip}</p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 mt-3">
        <button
          type="button"
          onClick={() => setAt(at - 1)}
          disabled={at === 0}
          className="inline-flex items-center gap-1 h-8 px-3 rounded-lg border border-[var(--cpm-border-strong)] text-[12.5px] font-semibold text-[var(--cpm-text)] disabled:opacity-40"
        >
          <ChevronLeft size={15} /> Back
        </button>
        <button
          type="button"
          onClick={() => setAt(at + 1)}
          disabled={experienced}
          className="inline-flex items-center gap-1 h-8 px-3 rounded-lg bg-[var(--cpm-accent)] text-[12.5px] font-semibold text-white disabled:opacity-40"
        >
          Next <ChevronRight size={15} />
        </button>
        <span className="ml-auto text-[11px] text-[var(--cpm-text-faint)]">
          Marcus is made up; his story is typical. Pay figure: U.S. Bureau of Labor Statistics.
        </span>
      </div>
    </div>
  );
}
