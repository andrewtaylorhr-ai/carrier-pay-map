"use client";

// How recruiting works, told through one driver: why they choose trucking, the
// CDL, Indeed, the recruiter, the company checks, the first job and the hire,
// then where our carriers hire on the US map. From the manager's whiteboard.
import { useMemo } from "react";
import Link from "next/link";
import { interpolateRgb } from "d3-interpolate";
import { Briefcase, Flag, GraduationCap, Headset, Map as MapIcon, Search, ShieldCheck, Target, User, type LucideIcon } from "lucide-react";
import { ChoroplethMap, type MapPaint } from "@/components/carrier-map/ChoroplethMap";
import { ALL_ACCOUNTS } from "@/lib/carriers/accounts";
import { CARRIERS } from "@/lib/carriers/data";
import type { CarrierId } from "@/lib/carriers/types";
import { SlideIndex, SlideShow, eyebrow, panel } from "./SlideShow";
import { VideoStage } from "./VideoStage";

type Stage = { title: string; icon: LucideIcon; points: string[]; at: [number, number] | null };

const STAGES: Stage[] = [
  {
    title: "Why do they become truck drivers?",
    icon: User,
    at: [0, 0.25],
    points: [
      "Drivers come from all over the USA. Many are Mexican, Spanish-speaking or Armenian.",
      "Without college, most jobs pay little, like fast food.",
      "College careers, like a doctor, pay $100–150k a year but take years of school.",
      "Trucking pays well without college. It is a way to a home of their own.",
    ],
  },
  {
    title: "The new driver, no experience",
    icon: Target,
    at: [0.25, 0.75],
    points: [
      "Wants money and the American dream.",
      "A 24/7 worker.",
      "Can talk a lot: let them talk, then guide the call.",
      "Has trust issues: be honest and give clear, full information.",
    ],
  },
  {
    title: "Getting the CDL",
    icon: GraduationCap,
    at: [0.75, 1.75],
    points: ["Goes to CDL school.", "Gets the CDL-A license.", "Finishes the required training hours."],
  },
  {
    title: "Finding a job on Indeed",
    icon: Search,
    at: [1.75, 2.1],
    points: ["Writes a resume.", "Posts it and applies for jobs on Indeed.", "This is where we find them."],
  },
  {
    title: "The recruiter",
    icon: Headset,
    at: [2.1, 3.6],
    points: ["Calls the driver.", "Learns what they want and need.", "Matches them to the right company."],
  },
  {
    title: "The company checks the driver",
    icon: ShieldCheck,
    at: [3.6, 4.4],
    points: [
      "MVR: accidents, when and why, and the police report.",
      "PSP report.",
      "Background check and the application.",
      "Clearinghouse, and the SAP program if needed.",
      "VOE: verification of employment.",
      "10 years of work history.",
      "DUI and DWI.",
      "Drug test, about $100, urine or hair.",
      "Reports from the DMV, the police station and the insurance loss run.",
    ],
  },
  {
    title: "Wants and needs",
    icon: Briefcase,
    at: [4.4, 5.4],
    points: [
      "Wants: home daily and more money.",
      "Needs: a job.",
      "No experience: starts on OTR or regional, usually for 3–6 months.",
      "With experience: more choices.",
    ],
  },
  {
    title: "Hire",
    icon: Flag,
    at: [5.4, 7.9],
    points: ["The company hires the driver.", "He picks up the truck and the trailer.", "He is on the road."],
  },
  {
    title: "Where drivers are hired",
    icon: MapIcon,
    at: null,
    points: ["Each state shows how many open accounts our carriers have there.", "Darker red means more openings.", "Hover a state to see which carriers hire there."],
  },
];

const HIRE = STAGES.findIndex((s) => s.title === "Hire") + 1;
const STOPS = ["Start", ...STAGES.map((s) => s.title)];
const SEGMENTS: ([number, number] | null)[] = [[0, 7.9], ...STAGES.map((s) => s.at)];

// open accounts per state, and which carriers have them
const OPEN: Record<string, { n: number; carriers: Set<CarrierId> }> = {};
for (const a of ALL_ACCOUNTS)
  for (const s of a.states) {
    OPEN[s] ??= { n: 0, carriers: new Set() };
    OPEN[s].n++;
    OPEN[s].carriers.add(a.carrier);
  }
const MOST = Math.max(...Object.values(OPEN).map((o) => o.n));

function HiringMap() {
  const paint = useMemo<MapPaint>(() => {
    const shade = interpolateRgb("#3a1418", "#c90016");
    return {
      selected: null,
      fill: (s) => (OPEN[s] ? shade(Math.sqrt(OPEN[s].n / MOST)) : "#1c1c1c"),
      label: (s) => (OPEN[s] ? String(OPEN[s].n) : null),
      tooltip: (s) => {
        const o = OPEN[s];
        if (!o) return `<div style="font-weight:600">${s}</div><div style="color:#9aa0ad">No open accounts</div>`;
        const names = [...o.carriers].map((c) => CARRIERS[c].label).join(", ");
        return `<div style="font-weight:600">${s}</div><div>${o.n} open account${o.n === 1 ? "" : "s"}</div><div style="color:#9aa0ad">${names}</div>`;
      },
      onClick: () => {},
    };
  }, []);
  return (
    <div className="absolute inset-0 bg-[var(--cpm-bg)] pt-[84px] md:pt-[104px] pb-3 px-3 flex justify-center">
      <div className="h-full aspect-[975/610] max-w-full">
        <ChoroplethMap paint={paint} />
      </div>
    </div>
  );
}

export function DriverJourney() {
  return (
    <SlideShow
      storageKey="cpm_journeySlide"
      stops={STOPS}
      greenAt={HIRE}
      hint="Or use the arrow keys, or swipe. Each stage plays the next part of the driver's story."
      stage={(slide) => {
        const stage = slide ? STAGES[slide - 1] : null;
        const Icon = stage?.icon;
        const hire = slide === HIRE;
        return (
          <VideoStage
            src="training/driver-journey.mp4"
            poster="training/driver-journey-end.jpg"
            segments={SEGMENTS}
            slide={slide}
            background={stage && !stage.at ? <HiringMap /> : undefined}
          >
            <div key={slide} className="tp-rise max-w-[640px]">
              {!stage && (
                <>
                  <div className={`${eyebrow} brandSilver`}>Class A Recruiting</div>
                  <h2 className="text-[26px] md:text-[38px] leading-[1.1] font-extrabold text-white mt-1">The Driver&apos;s Journey</h2>
                  <p className="text-[13.5px] md:text-[15px] text-[#d6d6d6] mt-1.5">How one driver goes from no experience to hired, and where we come in.</p>
                </>
              )}
              {stage && Icon && (
                <>
                  <div className={`${eyebrow} flex items-center gap-1.5 text-white`}>
                    <span className={`inline-flex w-6 h-6 rounded-md items-center justify-center ${hire ? "bg-[var(--cpm-green)] text-[#06240f]" : "bg-[var(--cpm-accent)]"}`}>
                      <Icon size={14} strokeWidth={2.25} />
                    </span>
                    Stage {slide} of {STAGES.length}
                  </div>
                  <h2 className={`text-[24px] md:text-[34px] leading-[1.12] font-extrabold mt-1.5 ${hire ? "text-[var(--cpm-green)]" : "text-white"}`}>{stage.title}</h2>
                </>
              )}
            </div>
          </VideoStage>
        );
      }}
      below={(slide, go) => {
        if (!slide) return <SlideIndex titles={STAGES.map((s) => s.title)} onPick={go} cols="xl:grid-cols-3" />;
        const stage = STAGES[slide - 1];
        return (
          <div className={`tp-rise ${panel} ${slide === HIRE ? "border-[var(--cpm-green)]" : ""}`}>
            <ul className={`grid gap-x-6 gap-y-2 ${stage.points.length > 4 ? "lg:grid-cols-2" : ""}`}>
              {stage.points.map((p) => (
                <li key={p} className="flex gap-2.5 text-[14px] leading-[1.4] text-[var(--cpm-text)]">
                  <span className={`mt-[7px] w-1.5 h-1.5 rounded-full shrink-0 ${slide === HIRE ? "bg-[var(--cpm-green)]" : "bg-[var(--cpm-accent)]"}`} />
                  {p}
                </li>
              ))}
            </ul>
            {!stage.at && (
              <Link href="/pay-map" className="inline-block mt-3 text-[12.5px] font-semibold text-[var(--cpm-accent-text)] hover:underline">
                Open the Pay Map for pay and details
              </Link>
            )}
          </div>
        );
      }}
    />
  );
}
