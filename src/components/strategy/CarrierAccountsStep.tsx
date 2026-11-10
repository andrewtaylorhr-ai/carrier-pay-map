"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, ChevronDown, ChevronRight, MapPin, Search, X } from "lucide-react";
import { ChoroplethMap, type MapPin as Pin } from "@/components/carrier-map/ChoroplethMap";
import { carrierAccounts, formatPay } from "@/lib/carriers/accounts";
import { CARRIER_ORDER, CARRIERS, STATE_CODE } from "@/lib/carriers/data";
import type { Account, CarrierId } from "@/lib/carriers/types";
import { useCarrierMap } from "@/lib/carrier-map-context";
import { recruiterStates } from "@/lib/exportRecruiterReport";

// Wizard step 3: pick a state (on the map or from the tabs), then see every
// carrier hiring there with its actual accounts, and tick the ones this
// recruiter should work. Ticking an account switches its carrier on for the
// state; switching a carrier off unticks its accounts that no longer have a
// carrier-assigned state in the recruiter's territory.
export function CarrierAccountsStep() {
  const {
    recruiterFilter,
    recruiterAssignments,
    assignments,
    toggleCarrierOnState,
    recruiterAccounts,
    toggleRecruiterAccount,
    setRecruiterAccountsOn,
    selectedState,
    setSelectedState,
  } = useCarrierMap();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [cityFilter, setCityFilter] = useState<string | null>(null); // "City|ST"
  const [wholeUs, setWholeUs] = useState(false);

  const states = recruiterStates(recruiterFilter, recruiterAssignments);
  const focus = selectedState && states.includes(selectedState) ? selectedState : states[0] ?? null;
  const ticked = useMemo(() => new Set(recruiterAccounts[recruiterFilter] || []), [recruiterAccounts, recruiterFilter]);

  // Keep the map's highlighted state in step with the state being edited.
  useEffect(() => {
    if (focus && focus !== selectedState) setSelectedState(focus);
    setCityFilter(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focus]);

  // One pin per city in the focused state that has open accounts.
  const code = focus ? STATE_CODE[focus] : "";
  const citiesHere = (a: Account) => a.cities.filter((c) => c.st === code);
  const pins = useMemo<Pin[]>(() => {
    if (!focus) return [];
    const byCity = new Map<string, Pin>();
    CARRIER_ORDER.forEach((id) =>
      carrierAccounts(id, undefined, focus).forEach((a) =>
        a.cities
          .filter((c) => c.st === STATE_CODE[focus])
          .forEach((c) => {
            const key = `${c.name}|${c.st}`;
            const pin = byCity.get(key) ?? { key, lon: c.lon, lat: c.lat, label: c.name, count: 0 };
            pin.count++;
            if (ticked.has(a.id)) pin.highlight = true;
            byCity.set(key, pin);
          })
      )
    );
    return [...byCity.values()].map((p) => ({ ...p, active: p.key === cityFilter }));
  }, [focus, ticked, cityFilter]);

  if (!states.length || !focus) {
    return <div className="py-10 text-center text-[14px] text-[var(--cpm-text-dim)]">Add at least one state first (go back to States).</div>;
  }

  const carriersOn = (s: string) => assignments[s] || [];
  const tickedIn = (s: string) =>
    CARRIER_ORDER.reduce((n, id) => n + carrierAccounts(id, undefined, s).filter((a) => ticked.has(a.id)).length, 0);

  const q = query.trim().toLowerCase();
  const inCity = (a: Account) => !cityFilter || a.cities.some((c) => `${c.name}|${c.st}` === cityFilter);
  const groups = CARRIER_ORDER.map((id) => {
    const all = carrierAccounts(id, undefined, focus);
    const shown = all
      .filter(inCity)
      .filter(
        (a) => !q || [a.name, a.cat, a.hometime, ...a.cities.map((c) => c.name)].some((f) => f.toLowerCase().includes(q))
      );
    return { id, all, shown };
  }).filter((g) => g.all.length && (!cityFilter || g.shown.length));
  const noAccounts = CARRIER_ORDER.filter((id) => !carrierAccounts(id, undefined, focus).length);

  const isOpen = (id: CarrierId) => open[`${focus}|${id}`] ?? (!!q || !!cityFilter || carriersOn(focus).includes(id));
  const toggleOpen = (id: CarrierId) => setOpen((p) => ({ ...p, [`${focus}|${id}`]: !isOpen(id) }));

  const toggleCarrier = (id: CarrierId) => {
    const turningOff = carriersOn(focus).includes(id);
    toggleCarrierOnState(focus, id);
    if (turningOff) {
      // untick this carrier's accounts that no other territory state (still carrying it) covers
      const orphaned = carrierAccounts(id, undefined, focus)
        .filter((a) => ticked.has(a.id))
        .filter((a) => !a.states.some((s) => s !== focus && states.includes(s) && carriersOn(s).includes(id)))
        .map((a) => a.id);
      if (orphaned.length) setRecruiterAccountsOn(recruiterFilter, orphaned, false);
    } else {
      setOpen((p) => ({ ...p, [`${focus}|${id}`]: true }));
    }
  };

  const tickAccount = (id: CarrierId, accountId: string) => {
    if (!ticked.has(accountId) && !carriersOn(focus).includes(id)) toggleCarrierOnState(focus, id);
    toggleRecruiterAccount(recruiterFilter, accountId);
  };

  // tick (or untick) every account in `list`; ticking switches its carrier on for the state
  const setAll = (list: { id: CarrierId; accounts: Account[] }[], tick: boolean) => {
    list.forEach(({ id, accounts }) => {
      if (tick && accounts.length && !carriersOn(focus).includes(id)) {
        toggleCarrierOnState(focus, id);
        setOpen((p) => ({ ...p, [`${focus}|${id}`]: true }));
      }
    });
    const ids = list.flatMap((g) => g.accounts.map((a) => a.id));
    if (ids.length) setRecruiterAccountsOn(recruiterFilter, ids, tick);
  };
  const allShown = groups.map((g) => ({ id: g.id, accounts: g.shown }));
  const everyShownTicked = allShown.every((g) => g.accounts.every((a) => ticked.has(a.id))) && allShown.some((g) => g.accounts.length);

  return (
    <>
      <div className="mb-4">
        <h2 className="text-[17px] font-semibold text-[var(--cpm-text)]">Which carriers and accounts should {recruiterFilter} work?</h2>
        <p className="text-[13px] text-[var(--cpm-text-dim)] mt-0.5">
          Pick a state below or on the map. Pins show the cities with open accounts — click one to see just those
          accounts. Then tick the accounts to send.
        </p>
      </div>

      <div className="stateTabs">
        {states.map((s) => {
          const nC = carriersOn(s).length;
          const nA = tickedIn(s);
          return (
            <button key={s} type="button" className={s === focus ? "active" : undefined} onClick={() => setSelectedState(s)}>
              <span className="name">{s}</span>
              <span className="meta">
                {nC} carrier{nC === 1 ? "" : "s"} · {nA} account{nA === 1 ? "" : "s"}
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex flex-col xl:flex-row gap-5 mt-4">
        <div className="xl:w-[56%] shrink-0">
          <div className="xl:sticky xl:top-4 wizMap bigMap">
            <ChoroplethMap
              zoomTo={wholeUs ? null : focus}
              showCities
              hideStateLabels
              pins={pins}
              onPinClick={(key) => setCityFilter((cur) => (cur === key ? null : key))}
            />
            <div className="flex items-center justify-between gap-3 flex-wrap text-[11.5px] text-[var(--cpm-text-faint)] mt-2">
              <span className="flex items-center gap-3 flex-wrap">
                <span className="flex items-center gap-1.5">
                  <span className="legendPin" /> city with open accounts (number = accounts)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="legendPin hl" /> has a ticked account
                </span>
              </span>
              <button type="button" className="linkBtn" onClick={() => setWholeUs((w) => !w)}>
                {wholeUs ? `Zoom to ${focus}` : "Show whole US"}
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
            <div className="flex items-center gap-3">
              <div className="text-[16px] font-bold text-[var(--cpm-text)]">{focus}</div>
              <button type="button" className="selAllBtn" onClick={() => setAll(allShown, !everyShownTicked)}>
                {everyShownTicked ? "Clear all" : "Select all"}
              </button>
            </div>
            <div className="wizInput w-[230px]">
              <Search size={14} />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={`Search accounts in ${focus}…`} />
            </div>
          </div>

          {cityFilter && (
            <div className="cityFilterBar">
              <MapPin size={14} />
              Showing accounts in <b>{cityFilter.replace("|", ", ")}</b>
              <button type="button" onClick={() => setCityFilter(null)}>
                <X size={13} /> Show all of {focus}
              </button>
            </div>
          )}

          <div className="flex flex-col gap-2 accountsScroll">
            {groups.map(({ id, all, shown }) => {
              const c = CARRIERS[id];
              const on = carriersOn(focus).includes(id);
              const nTicked = all.filter((a) => ticked.has(a.id)).length;
              const expanded = isOpen(id);
              const allTicked = shown.length > 0 && shown.every((a) => ticked.has(a.id));
              return (
                <div key={id} className={`carrierBlock${on ? " on" : ""}`} style={on ? { borderColor: c.color } : undefined}>
                  <div className="head">
                    <button
                      type="button"
                      className={`switch${on ? " on" : ""}`}
                      style={on ? { background: c.color } : undefined}
                      onClick={() => toggleCarrier(id)}
                      title={on ? `Stop working ${c.label} in ${focus}` : `Work ${c.label} in ${focus}`}
                      aria-pressed={on}
                    >
                      <span className="knob" />
                    </button>
                    <button type="button" className="title" onClick={() => toggleOpen(id)}>
                      <span className="font-bold" style={{ color: c.color }}>
                        {c.label}
                      </span>
                      <span className="text-[12px] text-[var(--cpm-text-dim)]">
                        {all.length} open account{all.length === 1 ? "" : "s"}
                        {nTicked ? ` · ${nTicked} ticked` : ""}
                      </span>
                      <span className="ml-auto text-[var(--cpm-text-dim)] flex items-center gap-1 text-[12px]">
                        {expanded ? "Hide accounts" : "Show accounts"}
                        {expanded ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                      </span>
                    </button>
                    {shown.length > 0 && (
                      <button type="button" className="selAllBtn" onClick={() => setAll([{ id, accounts: shown }], !allTicked)}>
                        {allTicked ? "Clear" : "Select all"}
                      </button>
                    )}
                  </div>
                  {expanded && (
                    <div className="accts">
                      {shown.map((a) => {
                        const isTicked = ticked.has(a.id);
                        const others = a.states.filter((s) => s !== focus);
                        return (
                          <label key={a.id} className={`acctRow${isTicked ? " ticked" : ""}`}>
                            <span className={`box${isTicked ? " on" : ""}`}>{isTicked && <Check size={12} strokeWidth={3.5} />}</span>
                            <input type="checkbox" className="sr-only" checked={isTicked} onChange={() => tickAccount(id, a.id)} />
                            <span className="flex-1 min-w-0">
                              <span className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-semibold text-[var(--cpm-text)]">{a.name}</span>
                                <span className="catTag">{a.cat}</span>
                                {a.approval === "Yes" && <span className="apprBadge">needs approval</span>}
                                {a.sob && <span className="sobTag">{a.sob}</span>}
                              </span>
                              {citiesHere(a).length > 0 && (
                                <span className="flex items-center gap-1 text-[11.5px] text-[var(--cpm-accent-text)] mt-0.5">
                                  <MapPin size={11} /> {citiesHere(a).map((c) => c.name).join(", ")}
                                </span>
                              )}
                              <span className="block text-[12px] text-[var(--cpm-text-dim)] mt-0.5">
                                <b className="text-[var(--cpm-text)] font-semibold">{formatPay(a)}</b>
                                {a.hometime ? ` · ${a.hometime}` : ""}
                              </span>
                              {(a.experience || others.length > 0) && (
                                <span className="block text-[11.5px] text-[var(--cpm-text-faint)] mt-0.5">
                                  {a.experience ? `Experience: ${a.experience}` : ""}
                                  {a.experience && others.length ? " · " : ""}
                                  {others.length
                                    ? `Also hires in ${others.length > 5 ? `${others.length} other states` : others.join(", ")}`
                                    : ""}
                                </span>
                              )}
                            </span>
                          </label>
                        );
                      })}
                      {!shown.length && <div className="px-3 py-2 text-[12px] text-[var(--cpm-text-faint)]">No accounts match your search.</div>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          {noAccounts.length > 0 && (
            <div className="text-[11.5px] text-[var(--cpm-text-faint)] mt-3">
              No open accounts in {focus}: {noAccounts.map((id) => CARRIERS[id].label).join(", ")}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
