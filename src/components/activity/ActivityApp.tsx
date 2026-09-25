"use client";

import { useEffect, useState } from "react";
import {
  accountBreakdown,
  carrierRanking,
  carrierTotals,
  crossCarrierAccountBreakdown,
  dateRange,
  hireRate,
  recruiterBreakdown,
  worstAccounts,
  worstCarriers,
} from "@/lib/activity/analyze";
import type { DateRange } from "@/lib/activity/analyze";
import type { CarrierActivityData, DriverRecord, DriverStatus } from "@/lib/activity/types";
import { useActivityData } from "@/lib/hooks/useActivityData";
import { InsightsDashboard } from "./dashboard/InsightsDashboard";
import { UploadPanel } from "./UploadPanel";

function pct(n: number | null): string {
  if (n == null) return "—";
  return `${Math.round(n * 100)}%`;
}

// `recordDate` is stored as a plain YYYY-MM-DD string (see parseWorkbook.ts)
// specifically so formatting it can't hit timezone-shift bugs — parse the
// parts directly instead of routing through `new Date(isoString)`.
function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString();
}

function formatRange(range: DateRange | null): string | null {
  if (!range) return null;
  return range.from === range.to ? formatDate(range.from) : `${formatDate(range.from)} – ${formatDate(range.to)}`;
}

// What the "Raw records" table below is currently narrowed to, driven by
// clicking a row (or a status sub-count) in one of the breakdown cards —
// this is how "why are these DQ/Hired" gets answered: filter down to the
// account/recruiter + status in question, then read the Note column.
interface RecordFilter {
  field: "account" | "recruiter";
  key: string;
  status: DriverStatus | null;
}

function sameFilter(a: RecordFilter | null, b: RecordFilter): boolean {
  return !!a && a.field === b.field && a.key === b.key && a.status === b.status;
}

export function ActivityApp() {
  const [data, setData] = useActivityData();
  const [selected, setSelected] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [renaming, setRenaming] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [filter, setFilter] = useState<RecordFilter | null>(null);

  useEffect(() => setMounted(true), []);

  const carriers = Object.keys(data).sort();

  useEffect(() => {
    if (!mounted) return;
    if (selected && !carriers.includes(selected)) setSelected(null);
    if (!selected && carriers.length) setSelected(carriers[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, carriers.join("|")]);

  const toggleFilter = (next: RecordFilter) => {
    setFilter((prev) => (sameFilter(prev, next) ? null : next));
  };

  // A filter drilled into one carrier's data doesn't carry meaning for
  // another carrier — plain carrier selection (card click, keyboard nav,
  // fresh import) clears any active filter. This is called explicitly at
  // each such call site instead of via a `useEffect` keyed on `selected`,
  // because an effect would also fire — and stomp the filter — when
  // `selectCarrierAccount` below needs to set both at once.
  const selectCarrier = (carrier: string) => {
    setSelected(carrier);
    setFilter(null);
  };

  // Jump to a carrier AND immediately filter its records to one account +
  // status — used by the Overall performance lists below: "Hired" for the
  // top-accounts list (see who got hired there), "DQ" for the worst-accounts
  // list (see why they're getting disqualified).
  const selectCarrierAccount = (carrier: string, account: string, status: DriverStatus) => {
    setSelected(carrier);
    setFilter({ field: "account", key: account, status });
  };

  const handleImport = (carrier: string, records: DriverRecord[], sourceFile: string) => {
    setData((prev) => ({
      ...prev,
      [carrier]: { records, sourceFile, updatedAt: new Date().toISOString() },
    }));
    selectCarrier(carrier);
  };

  const removeCarrier = (carrier: string) => {
    if (!confirm(`Remove all imported data for "${carrier}"?`)) return;
    setData((prev) => {
      const next = { ...prev };
      delete next[carrier];
      return next;
    });
  };

  const startRename = (carrier: string) => {
    setRenaming(carrier);
    setRenameValue(carrier);
  };

  const cancelRename = () => {
    setRenaming(null);
    setRenameValue("");
  };

  const commitRename = (oldName: string) => {
    const trimmed = renameValue.trim();
    setRenaming(null);
    if (!trimmed || trimmed === oldName) return;
    if (data[trimmed] && !confirm(`"${trimmed}" already has imported data — replace it with "${oldName}"'s data?`)) {
      return;
    }
    setData((prev) => {
      const next = { ...prev };
      const entry = next[oldName];
      delete next[oldName];
      next[trimmed] = entry;
      return next;
    });
    setSelected((s) => (s === oldName ? trimmed : s));
  };

  if (!mounted) return null;

  const activeEntry = selected ? data[selected] : null;
  const activeRecords = activeEntry?.records ?? [];
  const filteredRecords = filter
    ? activeRecords.filter((r) => {
        const fieldValue = filter.field === "account" ? r.account : r.recruiter;
        if (fieldValue !== filter.key) return false;
        if (filter.status && r.status !== filter.status) return false;
        return true;
      })
    : activeRecords;

  return (
    <div className="flex flex-col gap-5">
      {carriers.length > 0 && <InsightsDashboard data={data} onSelectCarrier={selectCarrier} />}

      <UploadPanel onImport={handleImport} />

      {carriers.length === 0 ? (
        <div className="text-[13px] text-[var(--cpm-text-dim)] py-8 text-center">
          No carrier activity imported yet. Upload a driver-updates workbook above to get started.
        </div>
      ) : (
        <>
          {carriers.length > 1 && <ComparisonTable data={data} carriers={carriers} />}

          {carriers.length > 1 && (
            <OverallPerformance data={data} onSelectCarrier={selectCarrier} onSelectAccount={selectCarrierAccount} />
          )}

          <div className="flex flex-wrap gap-3">
            {carriers.map((c) => {
              const counts = carrierTotals(data[c].records);
              const rate = hireRate(counts);
              const range = formatRange(dateRange(data[c].records));
              const active = c === selected;
              return (
                <div
                  key={c}
                  role="button"
                  tabIndex={0}
                  onClick={() => selectCarrier(c)}
                  onKeyDown={(e) => {
                    if (e.target !== e.currentTarget) return; // let the nested input/rename/remove controls handle their own keys
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      selectCarrier(c);
                    }
                  }}
                  className={`text-left rounded-xl border p-3.5 min-w-[190px] transition-colors cursor-pointer ${
                    active
                      ? "border-[var(--cpm-accent)] bg-[var(--cpm-panel-alt)]"
                      : "border-[var(--cpm-border)] bg-[var(--cpm-panel)] hover:border-[var(--cpm-border-strong)]"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    {renaming === c ? (
                      <input
                        autoFocus
                        type="text"
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            commitRename(c);
                          } else if (e.key === "Escape") {
                            e.preventDefault();
                            cancelRename();
                          }
                        }}
                        onBlur={() => commitRename(c)}
                        className="min-w-0 flex-1 px-1.5 py-0.5 rounded border border-[var(--cpm-accent)] bg-[var(--cpm-panel-alt)] text-[var(--cpm-text)] text-[13.5px] font-semibold"
                      />
                    ) : (
                      <div className="font-semibold text-[13.5px] text-[var(--cpm-text)]">{c}</div>
                    )}
                    <span className="flex items-center gap-1 shrink-0">
                      <span
                        role="button"
                        tabIndex={0}
                        title={`Rename ${c}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          startRename(c);
                        }}
                        className="text-[var(--cpm-text-faint)] hover:text-[var(--cpm-accent)] text-[11px] leading-none px-1"
                      >
                        ✎
                      </span>
                      <span
                        role="button"
                        tabIndex={0}
                        title={`Remove ${c}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          removeCarrier(c);
                        }}
                        className="text-[var(--cpm-text-faint)] hover:text-[var(--cpm-red)] text-[11px] leading-none px-1"
                      >
                        ✕
                      </span>
                    </span>
                  </div>
                  <div className="text-[12px] text-[var(--cpm-text-dim)] mt-1">
                    {counts.total} drivers · {counts.active} active · {counts.dq} DQ · {counts.hired} hired
                  </div>
                  <div className="text-[12px] text-[var(--cpm-text-dim)] mt-0.5">
                    Hire rate: <span className="text-[var(--cpm-text)] font-medium">{pct(rate)}</span>
                  </div>
                  <div className="text-[11px] text-[var(--cpm-text-faint)] mt-1">
                    Updated {new Date(data[c].updatedAt).toLocaleDateString()}
                  </div>
                  <div className="text-[11px] text-[var(--cpm-text-faint)] mt-0.5">
                    Data: {range ?? "no dates in source file"}
                  </div>
                </div>
              );
            })}
          </div>

          {activeEntry && selected && (
            <div className="flex flex-col gap-4">
              <h2 className="text-[15px] font-semibold text-[var(--cpm-text)]">{selected} — detail</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <BreakdownCard
                  title="By account / lane"
                  hint="Which accounts see the most submission volume — click a count to see those drivers' notes below."
                  field="account"
                  rows={accountBreakdown(activeRecords)}
                  activeFilter={filter}
                  onToggle={toggleFilter}
                />
                <BreakdownCard
                  title="By recruiter (detected)"
                  hint="Best-effort — only rows where a name was parsed out of the notes."
                  field="recruiter"
                  rows={recruiterBreakdown(activeRecords)}
                  activeFilter={filter}
                  onToggle={toggleFilter}
                />
              </div>
              <RecordsTable
                records={filteredRecords}
                totalCount={activeRecords.length}
                filter={filter}
                onClear={() => setFilter(null)}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}

function ComparisonTable({
  data,
  carriers,
}: {
  data: Record<string, { records: DriverRecord[]; updatedAt: string }>;
  carriers: string[];
}) {
  const rows = carriers
    .map((c) => {
      const counts = carrierTotals(data[c].records);
      const rate = hireRate(counts);
      const topAccount = accountBreakdown(data[c].records)[0];
      const topRecruiter = recruiterBreakdown(data[c].records)[0];
      const range = formatRange(dateRange(data[c].records));
      return { carrier: c, counts, rate, topAccount, topRecruiter, range };
    })
    .sort((a, b) => (b.rate ?? -1) - (a.rate ?? -1));

  return (
    <div className="rounded-xl border border-[var(--cpm-border)] bg-[var(--cpm-panel)] p-4">
      <div className="text-[11px] font-bold uppercase tracking-wide text-[var(--cpm-text-faint)] mb-2">
        Cross-carrier comparison
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-[12.5px] border-collapse">
          <thead>
            <tr className="text-left text-[var(--cpm-text-faint)] uppercase text-[10.5px] tracking-wide">
              <th className="py-1.5 pr-4">Carrier</th>
              <th className="py-1.5 pr-4">Total</th>
              <th className="py-1.5 pr-4">Hire rate</th>
              <th className="py-1.5 pr-4">Top account</th>
              <th className="py-1.5 pr-4">Top recruiter</th>
              <th className="py-1.5 pr-4">Data range</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.carrier} className="border-t border-[var(--cpm-border)]">
                <td className="py-1.5 pr-4 font-medium text-[var(--cpm-text)]">{r.carrier}</td>
                <td className="py-1.5 pr-4 text-[var(--cpm-text-dim)]">{r.counts.total}</td>
                <td className="py-1.5 pr-4 text-[var(--cpm-text-dim)]">{pct(r.rate)}</td>
                <td className="py-1.5 pr-4 text-[var(--cpm-text-dim)]">
                  {r.topAccount ? `${r.topAccount.key} (${r.topAccount.counts.total})` : "—"}
                </td>
                <td className="py-1.5 pr-4 text-[var(--cpm-text-dim)]">
                  {r.topRecruiter ? `${r.topRecruiter.key} (${r.topRecruiter.counts.total})` : "—"}
                </td>
                <td className="py-1.5 pr-4 text-[var(--cpm-text-faint)]">{r.range ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// "Which carrier / which account is doing the best hiring" across the whole
// book at a glance — separate from the per-carrier detail below, which only
// ever looks at one carrier at a time.
function OverallPerformance({
  data,
  onSelectCarrier,
  onSelectAccount,
}: {
  data: CarrierActivityData;
  onSelectCarrier: (carrier: string) => void;
  onSelectAccount: (carrier: string, account: string, status: DriverStatus) => void;
}) {
  const carrierRows = carrierRanking(data).filter((r) => r.counts.hired > 0);
  const accountRows = crossCarrierAccountBreakdown(data)
    .filter((r) => r.counts.hired > 0)
    .slice(0, 10);
  const worstCarrierRows = worstCarriers(data).slice(0, 10);
  const worstAccountRows = worstAccounts(data).slice(0, 10);

  const topCarrier = carrierRows[0];
  const topAccount = accountRows[0];

  return (
    <div className="rounded-xl border border-[var(--cpm-border)] bg-[var(--cpm-panel)] p-4">
      <div className="text-[11px] font-bold uppercase tracking-wide text-[var(--cpm-text-faint)] mb-0.5">
        Overall performance
      </div>
      <div className="text-[11.5px] text-[var(--cpm-text-faint)] mb-3">
        Most-hired carrier and account across everything imported. Click a row to jump to it.
      </div>
      {!topCarrier && !topAccount ? (
        <div className="text-[12px] text-[var(--cpm-text-faint)]">No hires recorded yet across any carrier.</div>
      ) : (
        <>
          <div className="flex flex-wrap gap-4 mb-3">
            {topCarrier && (
              <div className="rounded-lg border border-[var(--cpm-accent)] bg-[var(--cpm-panel-alt)] px-3 py-2">
                <div className="text-[10.5px] uppercase tracking-wide text-[var(--cpm-text-faint)]">
                  Top carrier by hires
                </div>
                <button
                  type="button"
                  onClick={() => onSelectCarrier(topCarrier.carrier)}
                  className="text-[14px] font-semibold text-[var(--cpm-accent)] hover:underline"
                >
                  {topCarrier.carrier}
                </button>
                <div className="text-[11.5px] text-[var(--cpm-text-dim)]">
                  {topCarrier.counts.hired} hired · {pct(topCarrier.rate)} hire rate
                </div>
              </div>
            )}
            {topAccount && (
              <div className="rounded-lg border border-[var(--cpm-accent)] bg-[var(--cpm-panel-alt)] px-3 py-2">
                <div className="text-[10.5px] uppercase tracking-wide text-[var(--cpm-text-faint)]">
                  Top account by hires
                </div>
                <button
                  type="button"
                  onClick={() => onSelectAccount(topAccount.carrier, topAccount.account, "Hired")}
                  className="text-[14px] font-semibold text-[var(--cpm-accent)] hover:underline"
                >
                  {topAccount.account}
                </button>
                <div className="text-[11.5px] text-[var(--cpm-text-dim)]">
                  {topAccount.counts.hired} hired · {topAccount.carrier}
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-[10.5px] uppercase tracking-wide text-[var(--cpm-text-faint)] mb-1">
                Carriers ranked by hires
              </div>
              <div className="flex flex-col gap-1">
                {carrierRows.map((r) => (
                  <button
                    key={r.carrier}
                    type="button"
                    onClick={() => onSelectCarrier(r.carrier)}
                    className="flex items-center justify-between text-[12.5px] text-left hover:text-[var(--cpm-accent)]"
                  >
                    <span className="text-[var(--cpm-text)]">{r.carrier}</span>
                    <span className="text-[var(--cpm-text-dim)]">
                      {r.counts.hired} hired · {pct(r.rate)}
                    </span>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div className="text-[10.5px] uppercase tracking-wide text-[var(--cpm-text-faint)] mb-1">
                Top accounts by hires (across all carriers)
              </div>
              <div className="flex flex-col gap-1">
                {accountRows.map((r) => (
                  <button
                    key={`${r.carrier}__${r.account}`}
                    type="button"
                    onClick={() => onSelectAccount(r.carrier, r.account, "Hired")}
                    className="flex items-center justify-between text-[12.5px] text-left hover:text-[var(--cpm-accent)]"
                  >
                    <span className="text-[var(--cpm-text)]">
                      {r.account} <span className="text-[var(--cpm-text-faint)]">({r.carrier})</span>
                    </span>
                    <span className="text-[var(--cpm-text-dim)]">{r.counts.hired} hired</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {(worstCarrierRows.length > 0 || worstAccountRows.length > 0) && (
            <div className="mt-4 pt-4 border-t border-[var(--cpm-border)]">
              <div className="text-[11px] font-bold uppercase tracking-wide text-[var(--cpm-red)] mb-0.5">
                Underperforming
              </div>
              <div className="text-[11.5px] text-[var(--cpm-text-faint)] mb-2">
                Lowest hire rate among carriers/accounts with at least 3 decided outcomes (hired + DQ) — click to see
                the DQ notes.
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-[10.5px] uppercase tracking-wide text-[var(--cpm-text-faint)] mb-1">
                    Carriers by lowest hire rate
                  </div>
                  {worstCarrierRows.length === 0 ? (
                    <div className="text-[12px] text-[var(--cpm-text-faint)]">Not enough decided outcomes yet.</div>
                  ) : (
                    <div className="flex flex-col gap-1">
                      {worstCarrierRows.map((r) => (
                        <button
                          key={r.carrier}
                          type="button"
                          onClick={() => onSelectCarrier(r.carrier)}
                          className="flex items-center justify-between text-[12.5px] text-left hover:text-[var(--cpm-red)]"
                        >
                          <span className="text-[var(--cpm-text)]">{r.carrier}</span>
                          <span className="text-[var(--cpm-text-dim)]">
                            {pct(r.rate)} · {r.counts.dq} DQ
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <div className="text-[10.5px] uppercase tracking-wide text-[var(--cpm-text-faint)] mb-1">
                    Accounts by lowest hire rate (across all carriers)
                  </div>
                  {worstAccountRows.length === 0 ? (
                    <div className="text-[12px] text-[var(--cpm-text-faint)]">Not enough decided outcomes yet.</div>
                  ) : (
                    <div className="flex flex-col gap-1">
                      {worstAccountRows.map((r) => (
                        <button
                          key={`${r.carrier}__${r.account}`}
                          type="button"
                          onClick={() => onSelectAccount(r.carrier, r.account, "DQ")}
                          className="flex items-center justify-between text-[12.5px] text-left hover:text-[var(--cpm-red)]"
                        >
                          <span className="text-[var(--cpm-text)]">
                            {r.account} <span className="text-[var(--cpm-text-faint)]">({r.carrier})</span>
                          </span>
                          <span className="text-[var(--cpm-text-dim)]">
                            {pct(r.rate)} · {r.counts.dq} DQ
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function BreakdownCard({
  title,
  hint,
  field,
  rows,
  activeFilter,
  onToggle,
}: {
  title: string;
  hint: string;
  field: RecordFilter["field"];
  rows: ReturnType<typeof accountBreakdown>;
  activeFilter: RecordFilter | null;
  onToggle: (f: RecordFilter) => void;
}) {
  const statusButton = (row: (typeof rows)[number], status: DriverStatus, label: string, n: number) => {
    if (n === 0) return <span className="text-[var(--cpm-text-faint)]">{n} {label}</span>;
    const next: RecordFilter = { field, key: row.key, status };
    const isActive = sameFilter(activeFilter, next);
    return (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onToggle(next);
        }}
        title={`Show ${label} drivers for ${row.key} (with notes) below`}
        className={`underline decoration-dotted underline-offset-2 hover:text-[var(--cpm-accent)] ${
          isActive ? "text-[var(--cpm-accent)] font-semibold" : ""
        }`}
      >
        {n} {label}
      </button>
    );
  };

  return (
    <div className="rounded-xl border border-[var(--cpm-border)] bg-[var(--cpm-panel)] p-4">
      <div className="text-[11px] font-bold uppercase tracking-wide text-[var(--cpm-text-faint)]">{title}</div>
      <div className="text-[11.5px] text-[var(--cpm-text-faint)] mt-0.5 mb-2">{hint}</div>
      {rows.length === 0 ? (
        <div className="text-[12px] text-[var(--cpm-text-faint)]">No data.</div>
      ) : (
        <div className="flex flex-col gap-1.5">
          {rows.map((row) => {
            const max = rows[0].counts.total;
            const width = Math.max(4, Math.round((row.counts.total / max) * 100));
            const rowFilter: RecordFilter = { field, key: row.key, status: null };
            const rowActive = sameFilter(activeFilter, rowFilter);
            return (
              <div key={row.key} className="text-[12.5px]">
                <div className="flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => onToggle(rowFilter)}
                    title={`Show all ${row.key} drivers (with notes) below`}
                    className={`text-left font-medium hover:text-[var(--cpm-accent)] ${
                      rowActive ? "text-[var(--cpm-accent)]" : "text-[var(--cpm-text)]"
                    }`}
                  >
                    {row.key}
                  </button>
                  <span className="text-[var(--cpm-text-dim)] shrink-0">
                    {row.counts.total} ({statusButton(row, "Active", "active", row.counts.active)} ·{" "}
                    {statusButton(row, "DQ", "DQ", row.counts.dq)} ·{" "}
                    {statusButton(row, "Hired", "hired", row.counts.hired)})
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-[var(--cpm-panel-alt)] mt-1 overflow-hidden">
                  <div className="h-full rounded-full bg-[var(--cpm-accent)]" style={{ width: `${width}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function RecordsTable({
  records,
  totalCount,
  filter,
  onClear,
}: {
  records: DriverRecord[];
  totalCount: number;
  filter: RecordFilter | null;
  onClear: () => void;
}) {
  return (
    <div className="rounded-xl border border-[var(--cpm-border)] bg-[var(--cpm-panel)] p-4">
      <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
        <div className="text-[11px] font-bold uppercase tracking-wide text-[var(--cpm-text-faint)]">
          {filter ? (
            <>
              Records — {filter.field === "account" ? "account" : "recruiter"} &ldquo;{filter.key}&rdquo;
              {filter.status ? ` · ${filter.status}` : ""} ({records.length} of {totalCount})
            </>
          ) : (
            <>Raw records ({records.length})</>
          )}
        </div>
        {filter && (
          <button
            type="button"
            onClick={onClear}
            className="text-[11.5px] font-semibold text-[var(--cpm-accent)] hover:underline"
          >
            Clear filter
          </button>
        )}
      </div>
      {filter && (
        <div className="text-[11.5px] text-[var(--cpm-text-faint)] mb-2">
          Read the Note column below to see why each driver was {filter.status ? filter.status.toLowerCase() : "marked this way"}.
        </div>
      )}
      <div className="overflow-auto max-h-[420px]">
        <table className="w-full text-[12.5px] border-collapse">
          <thead className="sticky top-0 bg-[var(--cpm-panel-alt)]">
            <tr className="text-left text-[var(--cpm-text-faint)] uppercase text-[10.5px] tracking-wide">
              <th className="py-1.5 px-2">Name</th>
              <th className="py-1.5 px-2">Account</th>
              <th className="py-1.5 px-2">Status</th>
              <th className="py-1.5 px-2">Recruiter</th>
              <th className="py-1.5 px-2">Date</th>
              <th className="py-1.5 px-2">Note</th>
            </tr>
          </thead>
          <tbody>
            {records.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-3 px-2 text-[var(--cpm-text-faint)]">
                  No records match this filter.
                </td>
              </tr>
            ) : (
              records.map((r) => (
                <tr key={r.id} className="border-t border-[var(--cpm-border)] align-top">
                  <td className="py-1.5 px-2 text-[var(--cpm-text)] whitespace-nowrap">{r.name}</td>
                  <td className="py-1.5 px-2 text-[var(--cpm-text-dim)] whitespace-nowrap">{r.account}</td>
                  <td className="py-1.5 px-2 text-[var(--cpm-text-dim)] whitespace-nowrap">{r.status}</td>
                  <td className="py-1.5 px-2 text-[var(--cpm-text-dim)] whitespace-nowrap">{r.recruiter ?? "—"}</td>
                  <td className="py-1.5 px-2 text-[var(--cpm-text-dim)] whitespace-nowrap">
                    {r.recordDate ? formatDate(r.recordDate) : "—"}
                  </td>
                  <td className="py-1.5 px-2 text-[var(--cpm-text-faint)]">{r.note || "—"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
