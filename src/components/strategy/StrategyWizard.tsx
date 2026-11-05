"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Download, Map as MapIcon, Plus, Search, X } from "lucide-react";
import { ChoroplethMap } from "@/components/carrier-map/ChoroplethMap";
import { RecruiterReport } from "@/components/carrier-map/RecruiterReport";
import { ALL_STATES, CARRIER_ORDER, CARRIERS } from "@/lib/carriers/data";
import { useCarrierMap } from "@/lib/carrier-map-context";
import { downloadRecruiterMap } from "@/lib/exportRecruiterMap";
import { exportRecruiterReportToExcel, recruiterStates } from "@/lib/exportRecruiterReport";
import { CarrierAccountsStep } from "./CarrierAccountsStep";

const STEPS = ["Recruiter", "States", "Carriers & accounts", "Download"] as const;
type Step = 0 | 1 | 2 | 3;

// The manager's guided flow for building one recruiter's plan, one decision
// per screen: who → which states → which carriers and accounts in each
// state → download. All data is the same context state the rest of the
// app uses (recruiterAssignments / assignments / recruiterAccounts), so the
// Team Overview page and the reports stay in sync.
export function StrategyWizard() {
  const { recruiterFilter, setRecruiterFilter, setStrategyMode, setColorMode, setAssignModeRecruiter, setSelectedState } =
    useCarrierMap();
  const [step, setStep] = useState<Step>(0);

  // This page always works in strategy mode, coloring the map by recruiter.
  useEffect(() => {
    setStrategyMode(true);
    setColorMode("recruiter");
    setSelectedState(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Map clicks add/remove states only while on the States step.
  useEffect(() => {
    setAssignModeRecruiter(step === 1 && recruiterFilter ? recruiterFilter : null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, recruiterFilter]);

  const go = (s: Step) => {
    if (s > 0 && !recruiterFilter) return;
    setStep(s);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="mx-auto w-full max-w-[1900px] px-6 py-6">
      <div className="flex items-end justify-between gap-4 flex-wrap mb-5">
        <div>
          <h1 className="text-[22px] font-bold text-[var(--cpm-text)]">Strategy Builder</h1>
          <p className="text-[13px] text-[var(--cpm-text-dim)] mt-0.5">
            Build a recruiter&apos;s plan in four steps, then download it to send to them.
          </p>
        </div>
        {recruiterFilter && step > 0 && (
          <button
            type="button"
            onClick={() => go(0)}
            className="flex items-center gap-2 px-3 h-9 rounded-lg border border-[var(--cpm-border-strong)] bg-[var(--cpm-panel-alt)] text-[13px] text-[var(--cpm-text)]"
            title="Choose a different recruiter"
          >
            Planning for <b>{recruiterFilter}</b>
            <span className="text-[var(--cpm-text-faint)] text-[12px]">change</span>
          </button>
        )}
      </div>

      <Stepper step={step} canJump={!!recruiterFilter} onJump={go} />

      <div className="wizCard">
        {step === 0 && (
          <RecruiterStep
            onPick={(r) => {
              setRecruiterFilter(r);
              go(1);
            }}
          />
        )}
        {step === 1 && <StatesStep />}
        {step === 2 && <CarrierAccountsStep />}
        {step === 3 && (
          <DownloadStep
            onNext={() => {
              setRecruiterFilter("");
              go(0);
            }}
          />
        )}
      </div>

      {step > 0 && (
        <div className="flex items-center justify-between mt-4">
          <button type="button" className="wizBtn ghost" onClick={() => go((step - 1) as Step)}>
            <ArrowLeft size={15} /> Back
          </button>
          {step < 3 && (
            <button type="button" className="wizBtn primary" onClick={() => go((step + 1) as Step)}>
              Next: {STEPS[step + 1]} <ArrowRight size={15} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function Stepper({ step, canJump, onJump }: { step: Step; canJump: boolean; onJump: (s: Step) => void }) {
  return (
    <ol className="wizSteps">
      {STEPS.map((label, i) => {
        const state = i < step ? "done" : i === step ? "current" : "todo";
        return (
          <li key={label} className={state}>
            <button type="button" disabled={!canJump && i > 0} onClick={() => onJump(i as Step)}>
              <span className="num">{state === "done" ? <Check size={14} strokeWidth={3} /> : i + 1}</span>
              <span className="label">{label}</span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}

function StepTitle({ title, hint }: { title: string; hint: string }) {
  return (
    <div className="mb-4">
      <h2 className="text-[17px] font-semibold text-[var(--cpm-text)]">{title}</h2>
      <p className="text-[13px] text-[var(--cpm-text-dim)] mt-0.5">{hint}</p>
    </div>
  );
}

/* ---------- 1. Recruiter ---------- */
function RecruiterStep({ onPick }: { onPick: (r: string) => void }) {
  const {
    recruiters,
    recruiterColor,
    recruiterAssignments,
    recruiterAccounts,
    getRecruiterStatus,
    getRecruiterTeam,
    addRecruiter,
  } = useCarrierMap();
  const [query, setQuery] = useState("");
  const [newName, setNewName] = useState("");
  const [err, setErr] = useState("");

  // Active recruiters only — former recruiters stay in Team Overview / Reports
  // history but can't be planned for.
  const list = recruiters.filter(
    (r) => getRecruiterStatus(r) !== "inactive" && r.toLowerCase().includes(query.trim().toLowerCase())
  );

  const add = () => {
    const problem = addRecruiter(newName);
    if (problem) return setErr(problem);
    const name = newName.trim();
    setNewName("");
    setErr("");
    onPick(name);
  };

  return (
    <>
      <StepTitle title="Who are you planning for?" hint="Pick a recruiter. You'll give them states, carriers and accounts next." />
      <div className="flex items-center gap-3 flex-wrap mb-4">
        <div className="wizInput w-[260px]">
          <Search size={14} />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search recruiters…" />
        </div>
      </div>

      <div className="grid gap-2.5" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))" }}>
        {list.map((r) => {
          const states = recruiterStates(r, recruiterAssignments).length;
          const accounts = (recruiterAccounts[r] || []).length;
          const team = getRecruiterTeam(r);
          return (
            <button key={r} type="button" className="recruiterCard" onClick={() => onPick(r)}>
              <span className="flex items-center gap-2 min-w-0">
                <span className="avatar" style={{ background: recruiterColor(r) }}>
                  {r.slice(0, 1).toUpperCase()}
                </span>
                <span className="min-w-0 text-left">
                  <span className="block font-semibold truncate text-[var(--cpm-text)]">{r}</span>
                  <span className="block text-[11.5px] text-[var(--cpm-text-faint)]">
                    {team === "uzbek" ? "Uzbek team" : team === "philippines" ? "Philippines team" : "No team"}
                  </span>
                </span>
              </span>
              <span className="flex gap-3 text-[11.5px] text-[var(--cpm-text-dim)] mt-2">
                <span>
                  <b className="text-[var(--cpm-text)]">{states}</b> state{states === 1 ? "" : "s"}
                </span>
                <span>
                  <b className="text-[var(--cpm-text)]">{accounts}</b> account{accounts === 1 ? "" : "s"}
                </span>
              </span>
            </button>
          );
        })}
        {!list.length && <div className="text-[13px] text-[var(--cpm-text-faint)] py-6">No recruiters match.</div>}
      </div>

      <div className="mt-5 pt-4 border-t border-[var(--cpm-border)] flex items-center gap-2 flex-wrap">
        <span className="text-[12.5px] text-[var(--cpm-text-dim)]">New recruiter:</span>
        <div className="wizInput w-[220px]">
          <input
            value={newName}
            onChange={(e) => {
              setNewName(e.target.value);
              setErr("");
            }}
            onKeyDown={(e) => e.key === "Enter" && add()}
            placeholder="Name"
          />
        </div>
        <button type="button" className="wizBtn ghost" onClick={add} disabled={!newName.trim()}>
          <Plus size={14} /> Add &amp; plan
        </button>
        {err && <span className="text-[12px] text-[var(--cpm-red)]">{err}</span>}
      </div>
    </>
  );
}

/* ---------- 2. States ---------- */
function StatesStep() {
  const { recruiterFilter, recruiterAssignments, toggleRecruiterOnState, recruiterColor } = useCarrierMap();
  const [pick, setPick] = useState("");
  const states = recruiterStates(recruiterFilter, recruiterAssignments);
  const available = ALL_STATES.filter((s) => !states.includes(s)).sort();

  return (
    <>
      <StepTitle
        title={`Which states will ${recruiterFilter} recruit in?`}
        hint="Click states on the map to add or remove them, or pick from the list. States shared with other recruiters are fine."
      />
      <div className="flex flex-col lg:flex-row gap-5">
        <div className="flex-1 min-w-0 wizMap bigMap">
          <ChoroplethMap showCities hideStateLabels />
          <div className="flex items-center gap-4 text-[11.5px] text-[var(--cpm-text-faint)] mt-2">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm" style={{ background: recruiterColor(recruiterFilter) }} /> {recruiterFilter}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-[#e3e2de] opacity-40" /> other recruiters
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-[#232733] border border-[var(--cpm-border-strong)]" /> nobody yet
            </span>
          </div>
        </div>
        <div className="lg:w-[280px] shrink-0">
          <div className="text-[12px] font-semibold uppercase tracking-wide text-[var(--cpm-text-faint)] mb-2">
            Selected ({states.length})
          </div>
          <div className="flex flex-wrap gap-1.5 mb-4 min-h-[32px]">
            {states.map((s) => (
              <span key={s} className="stateChip">
                {s}
                <button type="button" onClick={() => toggleRecruiterOnState(s, recruiterFilter)} title={`Remove ${s}`}>
                  <X size={12} />
                </button>
              </span>
            ))}
            {!states.length && <span className="text-[12.5px] text-[var(--cpm-text-faint)]">No states yet — click the map.</span>}
          </div>
          <div className="flex gap-2">
            <select value={pick} onChange={(e) => setPick(e.target.value)} className="wizSelect flex-1">
              <option value="">Add a state…</option>
              {available.map((s) => (
                <option key={s} value={s}>
                  {s}
                  {(recruiterAssignments[s] || []).length ? ` (${recruiterAssignments[s].join(", ")})` : ""}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="wizBtn ghost"
              disabled={!pick}
              onClick={() => {
                toggleRecruiterOnState(pick, recruiterFilter);
                setPick("");
              }}
            >
              <Plus size={14} /> Add
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

/* ---------- 4. Download ---------- */
function DownloadStep({ onNext }: { onNext: () => void }) {
  const { recruiterFilter, recruiterAssignments, recruiterAccounts, assignments } = useCarrierMap();
  const states = recruiterStates(recruiterFilter, recruiterAssignments);
  const accounts = (recruiterAccounts[recruiterFilter] || []).length;
  const carriers = CARRIER_ORDER.filter((id) => states.some((s) => (assignments[s] || []).includes(id)));

  return (
    <>
      <StepTitle title={`${recruiterFilter}'s plan is ready`} hint="Check the summary, then download the Excel file and the map picture to send." />
      <div className="grid gap-3 mb-5" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
        <SummaryTile label="States" value={states.length} sub={states.join(", ") || "none"} />
        <SummaryTile
          label="Carriers"
          value={carriers.length}
          sub={carriers.map((id) => CARRIERS[id].label).join(", ") || "none"}
        />
        <SummaryTile
          label="Accounts"
          value={accounts}
          sub={accounts ? "ticked in step 3" : "none ticked — the file will list every open account in these states"}
        />
      </div>
      <div className="flex items-center gap-3 flex-wrap mb-2">
        <button
          type="button"
          className="wizBtn primary"
          onClick={() => exportRecruiterReportToExcel(recruiterFilter, assignments, recruiterAssignments, recruiterAccounts)}
        >
          <Download size={15} /> Download {recruiterFilter}&apos;s Excel
        </button>
        <button
          type="button"
          className="wizBtn primary"
          disabled={!states.length}
          onClick={() => downloadRecruiterMap(recruiterFilter, assignments, recruiterAssignments, recruiterAccounts)}
        >
          <MapIcon size={15} /> Download map (picture)
        </button>
        <button type="button" className="wizBtn ghost" onClick={onNext}>
          Plan another recruiter <ArrowRight size={15} />
        </button>
      </div>
      <div className="wizEmbed wizReport">
        <RecruiterReport />
      </div>
    </>
  );
}

function SummaryTile({ label, value, sub }: { label: string; value: number; sub: string }) {
  return (
    <div className="rounded-xl border border-[var(--cpm-border)] bg-[var(--cpm-panel-alt)] p-4">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-[var(--cpm-text-faint)]">{label}</div>
      <div className="text-[26px] font-bold text-[var(--cpm-text)] leading-tight">{value}</div>
      <div className="text-[12px] text-[var(--cpm-text-dim)] mt-1 line-clamp-2">{sub}</div>
    </div>
  );
}

function EmptyStep({ text }: { text: string }) {
  return <div className="py-10 text-center text-[14px] text-[var(--cpm-text-dim)]">{text}</div>;
}
