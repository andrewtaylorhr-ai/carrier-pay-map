"use client";

import { carrierAccounts } from "@/lib/carriers/accounts";
import { CARRIER_ORDER, CARRIERS, STATE_CODE } from "@/lib/carriers/data";
import { POSITIONS, positionOf } from "@/lib/carriers/positions";
import type { CarrierId } from "@/lib/carriers/types";
import { BASE_PATH } from "@/lib/basePath";

// One card per carrier, built from the same account data as the Pay Map, so
// it stays current whenever the carrier files are refreshed.
function summarize(id: CarrierId) {
  const accounts = carrierAccounts(id);
  const top = (values: string[], n: number) => {
    const count = new Map<string, number>();
    values.filter(Boolean).forEach((v) => count.set(v, (count.get(v) ?? 0) + 1));
    return [...count.entries()].sort((a, b) => b[1] - a[1]).slice(0, n).map(([v]) => v);
  };
  const lows = accounts.map((a) => a.payLow).filter((n): n is number => n != null);
  const highs = accounts.map((a) => a.payHigh ?? a.payLow).filter((n): n is number => n != null);
  const stateCount = new Map<string, number>();
  accounts.forEach((a) => a.states.forEach((s) => stateCount.set(s, (stateCount.get(s) ?? 0) + 1)));
  return {
    total: accounts.length,
    positions: POSITIONS.map((p) => ({ p, n: accounts.filter((a) => positionOf(id, a.cat) === p).length })).filter((x) => x.n),
    payMin: lows.length ? Math.min(...lows) : null,
    payMax: highs.length ? Math.max(...highs) : null,
    payText: lows.length ? null : top(accounts.map((a) => a.payText), 1)[0] ?? null,
    states: stateCount.size,
    topStates: [...stateCount.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10).map(([s]) => s),
    hometime: top(accounts.map((a) => a.hometime), 3).map((h) => (h.length > 48 ? `${h.slice(0, 46).trimEnd()}…` : h)),
    experience: top(accounts.flatMap((a) => a.experience.split(/,\s*/)), 3),
    bonus: top(accounts.map((a) => a.sob.split(" (")[0]), 2),
    approval: accounts.filter((a) => a.approval === "Yes").length,
  };
}

const SUMMARIES = Object.fromEntries(CARRIER_ORDER.map((id) => [id, summarize(id)])) as Record<CarrierId, ReturnType<typeof summarize>>;
const money = (n: number) => `$${n.toLocaleString("en-US")}`;

export function CarrierCheatSheets() {
  return (
    <div>
      <p className="text-[13px] text-[var(--cpm-text-dim)] mb-4 max-w-[900px]">
        Learn these before your first call. Numbers come straight from the carriers&apos; open-account files (same data as the
        Pay Map). Pay is average weekly pay for a company driver; always check the exact account before quoting a driver.
      </p>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {CARRIER_ORDER.map((id) => {
          const c = CARRIERS[id];
          const s = SUMMARIES[id];
          return (
            <div key={id} className="rounded-xl border border-[var(--cpm-border)] bg-[var(--cpm-panel)] overflow-hidden flex flex-col">
              <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--cpm-border)]" style={{ boxShadow: `inset 4px 0 0 ${c.color}` }}>
                <div className="w-[96px] h-[38px] rounded-md bg-[#f4f5f7] flex items-center justify-center shrink-0 px-2">
                  {c.logo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={`${BASE_PATH}${c.logo}`} alt={c.label} className="max-h-[28px] max-w-[80px]" />
                  ) : (
                    <span className="text-[13px] font-extrabold text-[#1c2130]">{c.label}</span>
                  )}
                </div>
                <div className="min-w-0">
                  <div className="text-[15px] font-bold text-[var(--cpm-text)]">{c.label}</div>
                  <div className="text-[11.5px] text-[var(--cpm-text-faint)]">
                    {s.total} open {s.total === 1 ? "account" : "accounts"} · hiring in {s.states} {s.states === 1 ? "state" : "states"}
                  </div>
                </div>
              </div>
              <dl className="px-4 py-3 grid grid-cols-[110px_1fr] gap-x-3 gap-y-2 text-[12.5px] flex-1">
                <dt className="text-[var(--cpm-text-faint)]">Weekly pay</dt>
                <dd className="text-[var(--cpm-text)] font-semibold">
                  {s.payMin != null && s.payMax != null ? `${money(s.payMin)} – ${money(s.payMax)}` : s.payText ?? "Not listed"}
                </dd>
                <dt className="text-[var(--cpm-text-faint)]">Positions</dt>
                <dd className="flex flex-wrap gap-1">
                  {s.positions.map(({ p, n }) => (
                    <span key={p} className="text-[11px] font-semibold px-1.5 py-px rounded bg-[var(--cpm-panel-alt)] border border-[var(--cpm-border)] text-[var(--cpm-text-dim)]">
                      {p} <span className="text-[var(--cpm-text-faint)]">{n}</span>
                    </span>
                  ))}
                </dd>
                <dt className="text-[var(--cpm-text-faint)]">Home time</dt>
                <dd className="text-[var(--cpm-text-dim)]">{s.hometime.length ? s.hometime.join(" · ") : "Varies by account"}</dd>
                <dt className="text-[var(--cpm-text-faint)]">Experience</dt>
                <dd className="text-[var(--cpm-text-dim)]">{s.experience.length ? s.experience.join(" · ") : "Check each account"}</dd>
                {s.bonus.length > 0 && (
                  <>
                    <dt className="text-[var(--cpm-text-faint)]">Bonus</dt>
                    <dd className="text-[var(--cpm-text-dim)]">{s.bonus.join(" · ")}</dd>
                  </>
                )}
                <dt className="text-[var(--cpm-text-faint)]">Top states</dt>
                <dd className="flex flex-wrap gap-1">
                  {s.topStates.map((st) => (
                    <span key={st} title={st} className="text-[10.5px] font-semibold px-1.5 py-px rounded text-white" style={{ background: `${c.color}cc` }}>
                      {STATE_CODE[st] ?? st}
                    </span>
                  ))}
                </dd>
              </dl>
              {s.approval > 0 && (
                <div className="px-4 py-2 text-[11.5px] text-[#f5b84a] border-t border-[var(--cpm-border)]">
                  {s.approval} {s.approval === 1 ? "account needs" : "accounts need"} carrier approval before you submit a driver.
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
