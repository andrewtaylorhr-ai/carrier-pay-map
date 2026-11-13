"use client";

import { Fragment, useMemo, useState } from "react";
import { CalendarCheck, Check, Copy, MessageSquareReply, Send, Settings2, UserCog, X } from "lucide-react";
import { useCarrierMap } from "@/lib/carrier-map-context";
import { usePipeline } from "@/lib/hooks/usePipeline";
import { PIPELINE_SENDER, dayOf, todayDay, type PipelineDriver, type PipelineEvent } from "@/lib/pipeline";
import { PIPELINE_SCRIPT } from "@/lib/pipeline-script";
import type { RecruiterTeam } from "@/lib/carriers/types";

const card = "rounded-xl border border-[var(--cpm-border)] bg-[var(--cpm-panel)]";
const input =
  "h-8 px-2.5 rounded-lg border border-[var(--cpm-border-strong)] bg-[var(--cpm-panel-alt)] text-[12.5px] text-[var(--cpm-text)] outline-none focus:border-[var(--cpm-accent)]";
const label = "text-[10.5px] font-semibold uppercase tracking-wider text-[var(--cpm-text-faint)]";
const th = "px-3 py-2 text-left text-[10.5px] font-semibold uppercase tracking-wider text-[var(--cpm-text-faint)] whitespace-nowrap";
const td = "px-3 py-2 align-top text-[12.5px] text-[var(--cpm-text)]";
const segBtn = (on: boolean) =>
  `inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12.5px] font-semibold transition-colors ${
    on ? "bg-[var(--cpm-accent)] text-[var(--cpm-accent-ink)]" : "text-[var(--cpm-text-dim)] hover:text-[var(--cpm-text)]"
  }`;

type Tab = "subs" | "follow" | "dqp";
type Range = "today" | "week" | "month" | "last" | "all";
const RANGES: [Range, string][] = [
  ["today", "Today"],
  ["week", "This week"],
  ["month", "This month"],
  ["last", "Last month"],
  ["all", "All"],
];

const timeFmt = new Intl.DateTimeFormat("en-US", { timeZone: "America/Chicago", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
const when = (iso: string) => `${timeFmt.format(new Date(iso))} CT`;
const addDays = (day: string, n: number) => {
  const d = new Date(`${day}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};
const daysBetween = (a: string, b: string) => Math.round((Date.parse(`${b}T12:00:00Z`) - Date.parse(`${a}T12:00:00Z`)) / 864e5);

// [first day, last day] of a range, as "YYYY-MM-DD" in US Central time
function rangeDays(r: Range, today: string): [string, string] {
  if (r === "today") return [today, today];
  if (r === "week") {
    const dow = new Date(`${today}T12:00:00Z`).getUTCDay();
    const mon = addDays(today, -((dow + 6) % 7));
    return [mon, addDays(mon, 6)];
  }
  if (r === "month") return [`${today.slice(0, 7)}-01`, `${today.slice(0, 7)}-31`];
  if (r === "last") {
    const d = new Date(`${today.slice(0, 7)}-01T12:00:00Z`);
    d.setUTCMonth(d.getUTCMonth() - 1);
    const ym = d.toISOString().slice(0, 7);
    return [`${ym}-01`, `${ym}-31`];
  }
  return ["0000-00-00", "9999-99-99"];
}

// The Driver Pipeline: every driver our team submitted (from the no-reply
// emails), their follow-ups and their DQP schedules.
export function PipelineApp() {
  const { recruiters, getRecruiterTeam, recruiterColor } = useCarrierMap();
  const { inbox, settings, setSettings, pipeline } = usePipeline();
  const [tab, setTab] = useState<Tab>("subs");
  const [range, setRange] = useState<Range>("week");
  const [team, setTeam] = useState<RecruiterTeam | "">("");
  const [who, setWho] = useState("");
  const [q, setQ] = useState("");
  const [panel, setPanel] = useState<"" | "names" | "setup">("");
  const [noFollowUp, setNoFollowUp] = useState(false);
  const [open, setOpen] = useState<string | null>(null);

  const today = todayDay();
  const [from, to] = rangeDays(range, today);
  const inRange = (iso: string) => {
    const d = dayOf(iso);
    return d >= from && d <= to;
  };
  const query = q.trim().toLowerCase();
  const pick = (d: PipelineDriver) =>
    (!who || d.recruiter === who) &&
    (!team || (d.recruiter && getRecruiterTeam(d.recruiter) === team)) &&
    (!query || `${d.name} ${d.carrier} ${d.emailRecruiter}`.toLowerCase().includes(query));

  const people = pipeline.drivers.filter(pick);
  const subs = people.filter((d) => inRange(d.at));
  const lastFollow = (d: PipelineDriver) => d.followups.at(-1)?.at ?? "";
  const follow = noFollowUp
    ? people.filter((d) => !d.followups.length && !d.dqp.length && inRange(d.at))
    : people.filter((d) => d.followups.some((f) => inRange(f.at))).sort((a, b) => lastFollow(b).localeCompare(lastFollow(a)));
  const dqp = people.filter((d) => d.dqp.some((x) => inRange(x.at))).sort((a, b) => (b.dqp.at(-1)?.at ?? "").localeCompare(a.dqp.at(-1)?.at ?? ""));

  const stats = useMemo(() => {
    const [w0, w1] = rangeDays("week", today);
    const mon = today.slice(0, 7);
    const all = pipeline.drivers;
    return {
      today: all.filter((d) => dayOf(d.at) === today).length,
      week: all.filter((d) => dayOf(d.at) >= w0 && dayOf(d.at) <= w1).length,
      month: all.filter((d) => dayOf(d.at).startsWith(mon)).length,
      followWeek: all.reduce((n, d) => n + d.followups.filter((f) => dayOf(f.at) >= w0 && dayOf(f.at) <= w1).length, 0),
      dqpMonth: all.filter((d) => d.dqp.some((x) => dayOf(x.at).startsWith(mon))).length,
    };
  }, [pipeline, today]);

  const perRecruiter = useMemo(() => {
    const m = new Map<string, number>();
    subs.forEach((d) => m.set(d.recruiter ?? "", (m.get(d.recruiter ?? "") ?? 0) + 1));
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }, [subs]);

  const toMatch = pipeline.emailRecruiters.filter((r) => !r.roster && !(r.name in settings.aliases)).length;
  const hide = (id: string, what: string) => {
    if (!confirm(`Remove ${what} from the pipeline? It also stops counting in the Daily Tracker.`)) return;
    setSettings((s) => ({ ...s, hidden: [...(s.hidden ?? []), id] }));
  };
  const hasEmails = inbox.events.length > 0;
  const hasDqpEmails = inbox.events.some((e) => e.type === "dqp");

  const recruiterCell = (d: PipelineDriver) =>
    d.recruiter ? (
      <span className="whitespace-nowrap">
        <span style={{ color: recruiterColor(d.recruiter) }}>●</span> {d.recruiter}
      </span>
    ) : (
      <span className="text-[#ff9a9d]" title="Match this name under Recruiter names">
        {d.emailRecruiter || "—"} ?
      </span>
    );

  return (
    <div className="flex flex-col gap-4">
      {/* sync status + panels */}
      <div className="flex items-center gap-2 flex-wrap text-[12px] text-[var(--cpm-text-dim)]">
        <span className={`inline-block w-2 h-2 rounded-full ${hasEmails ? "bg-[var(--cpm-green)]" : "bg-[#f5b84a]"}`} />
        {hasEmails ? (
          <span>
            {inbox.events.length.toLocaleString("en-US")} emails read from {PIPELINE_SENDER}
            {inbox.updatedAt ? ` · last checked ${when(inbox.updatedAt)}` : ""}
          </span>
        ) : (
          <span>No emails yet. Set up the Gmail script once and the page fills in by itself.</span>
        )}
        <div className="ml-auto flex items-center gap-2">
          <button type="button" className="ghostBtn" onClick={() => setPanel(panel === "names" ? "" : "names")}>
            <UserCog size={14} /> Recruiter names
            {toMatch > 0 && <span className="ml-1 px-1.5 rounded-full bg-[#e5484d] text-white text-[10.5px] font-bold">{toMatch}</span>}
          </button>
          <button type="button" className="ghostBtn" onClick={() => setPanel(panel === "setup" ? "" : "setup")}>
            <Settings2 size={14} /> Gmail setup
          </button>
        </div>
      </div>

      {(panel === "setup" || (!hasEmails && panel !== "names")) && <SetupPanel onClose={hasEmails ? () => setPanel("") : undefined} />}
      {panel === "names" && (
        <NamesPanel
          rows={pipeline.emailRecruiters}
          aliases={settings.aliases}
          roster={recruiters}
          onChange={(name, v) =>
            setSettings((s) => {
              const aliases = { ...s.aliases };
              if (v == null) delete aliases[name];
              else aliases[name] = v;
              return { ...s, aliases };
            })
          }
          onClose={() => setPanel("")}
        />
      )}

      {/* totals */}
      <div className={`${card} grid grid-cols-2 md:grid-cols-5`}>
        <Stat label="Submitted today" value={stats.today} />
        <Stat label="Submitted this week" value={stats.week} />
        <Stat label="Submitted this month" value={stats.month} />
        <Stat label="Follow-ups this week" value={stats.followWeek} color="#60a5fa" />
        <Stat label="DQP scheduled this month" value={stats.dqpMonth} color="var(--cpm-green)" />
      </div>

      {/* tabs + filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-0.5 p-[3px] rounded-lg bg-[var(--cpm-panel-alt)] border border-[var(--cpm-border)]">
          <button type="button" className={segBtn(tab === "subs")} onClick={() => setTab("subs")}>
            <Send size={14} /> Submissions
          </button>
          <button type="button" className={segBtn(tab === "follow")} onClick={() => setTab("follow")}>
            <MessageSquareReply size={14} /> Follow-ups
          </button>
          <button type="button" className={segBtn(tab === "dqp")} onClick={() => setTab("dqp")}>
            <CalendarCheck size={14} /> DQP scheduled
          </button>
        </div>
        <div className="flex items-center gap-0.5 p-[3px] rounded-lg bg-[var(--cpm-panel-alt)] border border-[var(--cpm-border)]">
          {RANGES.map(([r, l]) => (
            <button key={r} type="button" className={segBtn(range === r)} onClick={() => setRange(r)}>
              {l}
            </button>
          ))}
        </div>
        <select className={input} value={team} onChange={(e) => setTeam(e.target.value as RecruiterTeam | "")} aria-label="Team">
          <option value="">Both teams</option>
          <option value="uzbek">Uzbek team</option>
          <option value="philippines">Philippines team</option>
        </select>
        <select className={input} value={who} onChange={(e) => setWho(e.target.value)} aria-label="Recruiter">
          <option value="">All recruiters</option>
          {recruiters.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
        <input className={`${input} w-[200px]`} placeholder="Search driver or carrier…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      {tab === "subs" && (
        <section className={card}>
          <div className="px-4 py-2.5 border-b border-[var(--cpm-border)] flex items-center gap-x-3 gap-y-1.5 flex-wrap">
            <h3 className="text-[14px] font-bold text-[var(--cpm-text)]">Submissions · {subs.length}</h3>
            {perRecruiter.map(([r, n]) => (
              <span key={r || "?"} className="text-[11.5px] text-[var(--cpm-text-dim)] whitespace-nowrap">
                {r ? <span style={{ color: recruiterColor(r) }}>●</span> : <span className="text-[#ff9a9d]">?</span>} {r || "Not matched"} <b className="text-[var(--cpm-text)]">{n}</b>
              </span>
            ))}
          </div>
          <Table empty={!subs.length} emptyText="No submissions in this range.">
            <thead>
              <tr>
                <th className={th}>Submitted</th>
                <th className={th}>Driver</th>
                <th className={th}>Carrier</th>
                <th className={th}>Recruiter</th>
                <th className={th}>Status</th>
                <th className={th}>Recruiter message</th>
                <th className={th} />
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--cpm-border)]">
              {subs.map((d) => (
                <tr key={d.key}>
                  <td className={`${td} whitespace-nowrap text-[var(--cpm-text-dim)]`}>{when(d.at)}</td>
                  <td className={`${td} font-semibold`}>{d.name}</td>
                  <td className={td}>{d.carrier || "—"}</td>
                  <td className={td}>{recruiterCell(d)}</td>
                  <td className={`${td} whitespace-nowrap`}>
                    <StatusPill d={d} />
                  </td>
                  <td className={`${td} max-w-[420px] text-[var(--cpm-text-dim)]`}>
                    <Expandable text={d.message} open={open === d.key} onToggle={() => setOpen(open === d.key ? null : d.key)} />
                  </td>
                  <td className={td}>
                    <button type="button" className="text-[var(--cpm-text-faint)] hover:text-[#ff9a9d]" title="Remove (wrong or duplicate email)" onClick={() => hide(d.id, d.name)}>
                      <X size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </section>
      )}

      {tab === "follow" && (
        <section className={card}>
          <div className="px-4 py-2.5 border-b border-[var(--cpm-border)] flex items-center gap-3 flex-wrap">
            <h3 className="text-[14px] font-bold text-[var(--cpm-text)]">
              {noFollowUp ? "Not followed up yet" : "Follow-ups"} · {follow.length}
            </h3>
            <span className="text-[11.5px] text-[var(--cpm-text-faint)]">From the &ldquo;Copy: New message&rdquo; emails, matched by the driver&apos;s name.</span>
            <label className="ml-auto flex items-center gap-1.5 text-[12px] text-[var(--cpm-text-dim)] cursor-pointer">
              <input type="checkbox" checked={noFollowUp} onChange={(e) => setNoFollowUp(e.target.checked)} />
              Show drivers with no follow-up yet
            </label>
          </div>
          <Table empty={!follow.length} emptyText={noFollowUp ? "Every driver submitted in this range has a follow-up." : "No follow-ups in this range."}>
            <thead>
              <tr>
                <th className={th}>Driver</th>
                <th className={th}>Carrier</th>
                <th className={th}>Recruiter</th>
                <th className={th}>Submitted</th>
                <th className={th}>Follow-ups</th>
                <th className={th}>Last follow-up</th>
                <th className={th}>Latest message</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--cpm-border)]">
              {follow.map((d) => {
                const last = d.followups.at(-1);
                const idle = daysBetween(dayOf(last?.at ?? d.at), today);
                const isOpen = open === `f${d.key}`;
                return (
                  <Fragment key={d.key}>
                    <tr className="cursor-pointer hover:bg-[var(--cpm-panel-alt)]" onClick={() => setOpen(isOpen ? null : `f${d.key}`)}>
                      <td className={`${td} font-semibold`}>{d.name}</td>
                      <td className={td}>{d.carrier || "—"}</td>
                      <td className={td}>{recruiterCell(d)}</td>
                      <td className={`${td} whitespace-nowrap text-[var(--cpm-text-dim)]`}>{when(d.at)}</td>
                      <td className={`${td} tabular-nums font-semibold`}>{d.followups.length}</td>
                      <td className={`${td} whitespace-nowrap`}>
                        {last ? when(last.at) : <span className="text-[#ff9a9d]">none</span>}
                        <div className={`text-[11px] ${idle >= 3 ? "text-[#ff9a9d]" : "text-[var(--cpm-text-faint)]"}`}>{idle === 0 ? "today" : `${idle} day${idle === 1 ? "" : "s"} ago`}</div>
                      </td>
                      <td className={`${td} max-w-[380px] text-[var(--cpm-text-dim)]`}>
                        <span className="line-clamp-2">{last?.text || "—"}</span>
                      </td>
                    </tr>
                    {isOpen && d.followups.length > 0 && (
                      <tr className="bg-[var(--cpm-panel-alt)]">
                        <td colSpan={7} className="px-4 py-2">
                          <ol className="flex flex-col gap-1.5">
                            {d.followups.map((f, i) => (
                              <li key={f.id} className="text-[12px] text-[var(--cpm-text-dim)]">
                                <b className="text-[var(--cpm-text)]">
                                  {i + 1}. {when(f.at)}
                                </b>{" "}
                                · {f.text}
                              </li>
                            ))}
                          </ol>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </Table>
          {!noFollowUp && <Unmatched list={pipeline.unmatchedFollowups.filter((e) => inRange(e.at))} what="follow-up" onHide={hide} />}
        </section>
      )}

      {tab === "dqp" && (
        <section className={card}>
          <div className="px-4 py-2.5 border-b border-[var(--cpm-border)] flex items-center gap-3 flex-wrap">
            <h3 className="text-[14px] font-bold text-[var(--cpm-text)]">DQP scheduled · {dqp.length}</h3>
            <span className="text-[11.5px] text-[var(--cpm-text-faint)]">Drivers with a DQP schedule email, matched by the driver&apos;s name.</span>
          </div>
          {!hasDqpEmails && (
            <div className="mx-4 mt-3 px-3 py-2 rounded-lg border border-[#f5b84a] bg-[rgba(245,184,74,0.1)] text-[12px] text-[var(--cpm-text-dim)]">
              No DQP emails read yet. Put the DQP schedule email&apos;s subject in the Gmail script (<code>DQP_SUBJECT</code>), and they show here.
            </div>
          )}
          <Table empty={!dqp.length} emptyText="No DQP schedules in this range.">
            <thead>
              <tr>
                <th className={th}>Driver</th>
                <th className={th}>Carrier</th>
                <th className={th}>Recruiter</th>
                <th className={th}>Submitted</th>
                <th className={th}>DQP email</th>
                <th className={th}>Email</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--cpm-border)]">
              {dqp.map((d) => {
                const x = d.dqp.at(-1)!;
                return (
                  <tr key={d.key}>
                    <td className={`${td} font-semibold`}>{d.name}</td>
                    <td className={td}>{d.carrier || "—"}</td>
                    <td className={td}>{recruiterCell(d)}</td>
                    <td className={`${td} whitespace-nowrap text-[var(--cpm-text-dim)]`}>{when(d.at)}</td>
                    <td className={`${td} whitespace-nowrap`}>{when(x.at)}</td>
                    <td className={`${td} max-w-[420px] text-[var(--cpm-text-dim)]`}>
                      <Expandable text={x.text} open={open === `d${d.key}`} onToggle={() => setOpen(open === `d${d.key}` ? null : `d${d.key}`)} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
          <Unmatched list={pipeline.unmatchedDqp.filter((e) => inRange(e.at))} what="DQP" onHide={hide} />
        </section>
      )}

      {(settings.hidden?.length ?? 0) > 0 && (
        <div className="text-[11.5px] text-[var(--cpm-text-faint)]">
          {settings.hidden!.length} email{settings.hidden!.length === 1 ? "" : "s"} removed from the pipeline ·{" "}
          <button type="button" className="underline hover:text-[var(--cpm-text)]" onClick={() => confirm("Bring back every removed email?") && setSettings((s) => ({ ...s, hidden: [] }))}>
            bring them back
          </button>
        </div>
      )}
    </div>
  );
}

function Stat({ label: l, value, color }: { label: string; value: number; color?: string }) {
  return (
    <div className="px-4 py-3 border-r last:border-r-0 border-[var(--cpm-border)]">
      <div className={label}>{l}</div>
      <div className="text-[22px] font-bold tabular-nums leading-tight mt-0.5" style={{ color: color ?? "var(--cpm-text)" }}>
        {value.toLocaleString("en-US")}
      </div>
    </div>
  );
}

function Table({ empty, emptyText, children }: { empty: boolean; emptyText: string; children: React.ReactNode }) {
  if (empty) return <div className="px-4 py-8 text-center text-[12.5px] text-[var(--cpm-text-faint)]">{emptyText}</div>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">{children}</table>
    </div>
  );
}

function StatusPill({ d }: { d: PipelineDriver }) {
  const [text, color] = d.dqp.length ? ["DQP scheduled", "#22c55e"] : d.followups.length ? [`${d.followups.length} follow-up${d.followups.length > 1 ? "s" : ""}`, "#60a5fa"] : ["Submitted", "#f5b84a"];
  return (
    <span className="text-[10.5px] font-semibold px-2 py-px rounded-full border" style={{ color, borderColor: color, background: `${color}1f` }}>
      {text}
    </span>
  );
}

function Expandable({ text, open, onToggle }: { text: string; open: boolean; onToggle: () => void }) {
  if (!text) return <>—</>;
  const long = text.length > 140;
  return (
    <span className={long ? "cursor-pointer" : ""} onClick={long ? onToggle : undefined} title={long && !open ? "Click to read all" : undefined}>
      <span className="whitespace-pre-line">{open || !long ? text : `${text.slice(0, 140)}…`}</span>
    </span>
  );
}

function Unmatched({ list, what, onHide }: { list: PipelineEvent[]; what: string; onHide: (id: string, what: string) => void }) {
  if (!list.length) return null;
  return (
    <div className="border-t border-[var(--cpm-border)] px-4 py-3">
      <div className={`${label} mb-1.5`}>
        {list.length} {what} email{list.length === 1 ? "" : "s"} with no submitted driver&apos;s name in them
      </div>
      <ul className="flex flex-col gap-1">
        {list.slice(0, 30).map((e) => (
          <li key={e.id} className="flex gap-2 text-[12px] text-[var(--cpm-text-dim)]">
            <span className="whitespace-nowrap text-[var(--cpm-text-faint)]">{when(e.at)}</span>
            <span className="truncate flex-1">
              <b className="text-[var(--cpm-text)]">{e.subject}</b> {e.message ? `· ${e.message.slice(0, 120)}` : ""}
            </span>
            <button type="button" className="text-[var(--cpm-text-faint)] hover:text-[#ff9a9d]" title="Remove" onClick={() => onHide(e.id, `this ${what} email`)}>
              <X size={13} />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function NamesPanel({
  rows,
  aliases,
  roster,
  onChange,
  onClose,
}: {
  rows: { name: string; count: number; roster: string | null }[];
  aliases: Record<string, string>;
  roster: string[];
  onChange: (name: string, v: string | null) => void;
  onClose: () => void;
}) {
  return (
    <section className={card}>
      <div className="px-4 py-2.5 border-b border-[var(--cpm-border)] flex items-center gap-2">
        <h3 className="text-[14px] font-bold text-[var(--cpm-text)]">Recruiter names</h3>
        <span className="text-[11.5px] text-[var(--cpm-text-faint)]">
          The name each recruiter uses in the emails, and who it is on our roster. Only matched names count in the Daily Tracker.
        </span>
        <button type="button" className="ml-auto text-[var(--cpm-text-faint)] hover:text-[var(--cpm-text)]" onClick={onClose} aria-label="Close">
          <X size={16} />
        </button>
      </div>
      {!rows.length ? (
        <div className="px-4 py-6 text-center text-[12.5px] text-[var(--cpm-text-faint)]">The names show here once submission emails come in.</div>
      ) : (
        <div className="grid gap-px bg-[var(--cpm-border)] sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((r) => {
            const picked = r.name in aliases;
            return (
              <div key={r.name} className="bg-[var(--cpm-panel)] px-4 py-2.5 flex items-center gap-2">
                <div className="min-w-0 flex-1">
                  <div className="text-[12.5px] font-semibold text-[var(--cpm-text)] truncate">&ldquo;{r.name}&rdquo;</div>
                  <div className="text-[11px] text-[var(--cpm-text-faint)]">
                    {r.count} submission{r.count === 1 ? "" : "s"}
                    {!picked && r.roster ? " · matched by name" : ""}
                    {!picked && !r.roster ? <span className="text-[#ff9a9d]"> · pick who this is</span> : ""}
                  </div>
                </div>
                <select
                  className={`${input} w-[150px] ${!r.roster && !picked ? "border-[#e5484d]" : ""}`}
                  value={picked ? (aliases[r.name] === "" ? "__none" : aliases[r.name]) : r.roster ?? ""}
                  onChange={(e) => onChange(r.name, e.target.value === "" ? null : e.target.value === "__none" ? "" : e.target.value)}
                >
                  <option value="">{r.roster && !picked ? r.roster : "— pick —"}</option>
                  {roster.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                  <option value="__none">Not our team</option>
                </select>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

function SetupPanel({ onClose }: { onClose?: () => void }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(PIPELINE_SCRIPT);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      alert("Couldn't copy. Open the script below and copy it by hand.");
    }
  };
  const step = "flex gap-2.5 text-[12.5px] text-[var(--cpm-text-dim)]";
  const num = "w-5 h-5 shrink-0 rounded-full bg-[var(--cpm-accent)] text-[var(--cpm-accent-ink)] text-[11px] font-bold flex items-center justify-center";
  return (
    <section className={card}>
      <div className="px-4 py-2.5 border-b border-[var(--cpm-border)] flex items-center gap-2">
        <h3 className="text-[14px] font-bold text-[var(--cpm-text)]">Gmail setup · once, about 10 minutes</h3>
        <span className="text-[11.5px] text-[var(--cpm-text-faint)]">
          A small script in your Gmail reads the {PIPELINE_SENDER} emails every 10 minutes. It saves the driver&apos;s name, carrier, recruiter and message, never their phone or email.
        </span>
        {onClose && (
          <button type="button" className="ml-auto text-[var(--cpm-text-faint)] hover:text-[var(--cpm-text)]" onClick={onClose} aria-label="Close">
            <X size={16} />
          </button>
        )}
      </div>
      <ol className="px-4 py-3 flex flex-col gap-2.5">
        <li className={step}>
          <span className={num}>1</span>
          <span>
            <b className="text-[var(--cpm-text)]">Make a pipeline account.</b> In Supabase open Authentication → Users → Add user → Create new user. Use an email you own (like
            pipeline@classarecruitinginc.com), a strong password, and tick <i>Auto Confirm User</i>. Sign-ups stay off. Keep the password to yourself.
          </span>
        </li>
        <li className={step}>
          <span className={num}>2</span>
          <span>
            <b className="text-[var(--cpm-text)]">Add the script.</b> Signed in to the Gmail that gets the {PIPELINE_SENDER} emails, open{" "}
            <a className="text-[var(--cpm-accent-text)] underline" href="https://script.google.com/home/projects/create" target="_blank" rel="noreferrer">
              script.google.com
            </a>
            , name the project &ldquo;Driver Pipeline&rdquo;, delete what&apos;s in Code.gs and paste the script.{" "}
            <button type="button" className="ghostBtn !inline-flex !h-6 !px-2 align-middle" onClick={copy}>
              {copied ? <Check size={13} /> : <Copy size={13} />} {copied ? "Copied" : "Copy the script"}
            </button>
          </span>
        </li>
        <li className={step}>
          <span className={num}>3</span>
          <span>
            <b className="text-[var(--cpm-text)]">DQP emails:</b> on the line <code>const DQP_SUBJECT = &quot;&quot;;</code> put the DQP schedule email&apos;s subject between the quotes.
          </span>
        </li>
        <li className={step}>
          <span className={num}>4</span>
          <span>
            <b className="text-[var(--cpm-text)]">Add the account.</b> Project Settings (⚙) → Script properties → add <code>PIPELINE_EMAIL</code> and <code>PIPELINE_PASSWORD</code> with the
            account from step 1.
          </span>
        </li>
        <li className={step}>
          <span className={num}>5</span>
          <span>
            <b className="text-[var(--cpm-text)]">Test it.</b> Back in the editor pick <code>testRead</code> at the top, click Run and allow access. The Execution log lists the emails it
            read from the last 7 days, without saving anything.
          </span>
        </li>
        <li className={step}>
          <span className={num}>6</span>
          <span>
            <b className="text-[var(--cpm-text)]">Turn it on.</b> Pick <code>setup</code> and click Run. It reads the last 60 days now, then checks every 10 minutes. This page and the
            Daily Tracker fill in by themselves.
          </span>
        </li>
      </ol>
    </section>
  );
}
