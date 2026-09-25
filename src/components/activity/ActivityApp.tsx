"use client";

import { useEffect, useState } from "react";
import { accountBreakdown, carrierTotals, hireRate, recruiterBreakdown } from "@/lib/activity/analyze";
import type { DriverRecord } from "@/lib/activity/types";
import { useActivityData } from "@/lib/hooks/useActivityData";
import { UploadPanel } from "./UploadPanel";

function pct(n: number | null): string {
  if (n == null) return "—";
  return `${Math.round(n * 100)}%`;
}

export function ActivityApp() {
  const [data, setData] = useActivityData();
  const [selected, setSelected] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [renaming, setRenaming] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  useEffect(() => setMounted(true), []);

  const carriers = Object.keys(data).sort();

  useEffect(() => {
    if (!mounted) return;
    if (selected && !carriers.includes(selected)) setSelected(null);
    if (!selected && carriers.length) setSelected(carriers[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, carriers.join("|")]);

  const handleImport = (carrier: string, records: DriverRecord[], sourceFile: string) => {
    setData((prev) => ({
      ...prev,
      [carrier]: { records, sourceFile, updatedAt: new Date().toISOString() },
    }));
    setSelected(carrier);
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

  return (
    <div className="flex flex-col gap-5">
      <UploadPanel onImport={handleImport} />

      {carriers.length === 0 ? (
        <div className="text-[13px] text-[var(--cpm-text-dim)] py-8 text-center">
          No carrier activity imported yet. Upload a driver-updates workbook above to get started.
        </div>
      ) : (
        <>
          {carriers.length > 1 && <ComparisonTable data={data} carriers={carriers} />}

          <div className="flex flex-wrap gap-3">
            {carriers.map((c) => {
              const counts = carrierTotals(data[c].records);
              const rate = hireRate(counts);
              const active = c === selected;
              return (
                <div
                  key={c}
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelected(c)}
                  onKeyDown={(e) => {
                    if (e.target !== e.currentTarget) return; // let the nested input/rename/remove controls handle their own keys
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setSelected(c);
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
                  hint="Which accounts see the most submission volume for this carrier."
                  rows={accountBreakdown(activeRecords)}
                />
                <BreakdownCard
                  title="By recruiter (detected)"
                  hint="Best-effort — only rows where a name was parsed out of the notes."
                  rows={recruiterBreakdown(activeRecords)}
                />
              </div>
              <RecordsTable records={activeRecords} />
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
      return { carrier: c, counts, rate, topAccount, topRecruiter };
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
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function BreakdownCard({
  title,
  hint,
  rows,
}: {
  title: string;
  hint: string;
  rows: ReturnType<typeof accountBreakdown>;
}) {
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
            return (
              <div key={row.key} className="text-[12.5px]">
                <div className="flex items-center justify-between">
                  <span className="text-[var(--cpm-text)] font-medium">{row.key}</span>
                  <span className="text-[var(--cpm-text-dim)]">
                    {row.counts.total} ({row.counts.active} active · {row.counts.dq} DQ · {row.counts.hired} hired)
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

function RecordsTable({ records }: { records: DriverRecord[] }) {
  return (
    <div className="rounded-xl border border-[var(--cpm-border)] bg-[var(--cpm-panel)] p-4">
      <div className="text-[11px] font-bold uppercase tracking-wide text-[var(--cpm-text-faint)] mb-2">
        Raw records ({records.length})
      </div>
      <div className="overflow-auto max-h-[420px]">
        <table className="w-full text-[12.5px] border-collapse">
          <thead className="sticky top-0 bg-[var(--cpm-panel-alt)]">
            <tr className="text-left text-[var(--cpm-text-faint)] uppercase text-[10.5px] tracking-wide">
              <th className="py-1.5 px-2">Name</th>
              <th className="py-1.5 px-2">Account</th>
              <th className="py-1.5 px-2">Status</th>
              <th className="py-1.5 px-2">Recruiter</th>
              <th className="py-1.5 px-2">Note</th>
            </tr>
          </thead>
          <tbody>
            {records.map((r) => (
              <tr key={r.id} className="border-t border-[var(--cpm-border)] align-top">
                <td className="py-1.5 px-2 text-[var(--cpm-text)] whitespace-nowrap">{r.name}</td>
                <td className="py-1.5 px-2 text-[var(--cpm-text-dim)] whitespace-nowrap">{r.account}</td>
                <td className="py-1.5 px-2 text-[var(--cpm-text-dim)] whitespace-nowrap">{r.status}</td>
                <td className="py-1.5 px-2 text-[var(--cpm-text-dim)] whitespace-nowrap">{r.recruiter ?? "—"}</td>
                <td className="py-1.5 px-2 text-[var(--cpm-text-faint)]">{r.note || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
