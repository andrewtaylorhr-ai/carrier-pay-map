"use client";

import { useState } from "react";
import { Plus, Trash2, X } from "lucide-react";
import { useLocalStorageState } from "@/lib/hooks/useLocalStorage";
import { AGENCIES_KEY, AGENCY_STATUS, ALL_CARRIER_IDS, COUNTRIES, type Agency, type AgencyStatus, carrierLook, newAgency } from "@/lib/agencies";
import { AgencyCarrierMap } from "./AgencyCarrierMap";

const card = "rounded-xl border border-[var(--cpm-border)] bg-[var(--cpm-panel)]";
const input =
  "h-8 px-2.5 rounded-lg border border-[var(--cpm-border-strong)] bg-[var(--cpm-panel-alt)] text-[12.5px] text-[var(--cpm-text)] outline-none focus:border-[var(--cpm-accent)]";
const btnMain =
  "inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-[12.5px] font-semibold bg-[var(--cpm-accent)] text-[#241800] hover:bg-[var(--cpm-accent-strong)] disabled:opacity-50 disabled:cursor-not-allowed";
const label = "text-[10.5px] font-semibold uppercase tracking-wider text-[var(--cpm-text-faint)]";

function StatusPill({ status }: { status: AgencyStatus }) {
  const s = AGENCY_STATUS[status];
  return (
    <span className="text-[10.5px] font-semibold px-2 py-px rounded-full border whitespace-nowrap" style={{ color: s.color, borderColor: s.color, background: `${s.color}1f` }}>
      {s.label}
    </span>
  );
}

function CarrierDot({ id }: { id: string }) {
  return <span className="inline-block w-2 h-2 rounded-full shrink-0" style={{ background: carrierLook(id).color }} />;
}

// Outside recruiting agencies: who they are and which carriers they recruit for.
export function AgenciesApp() {
  const [agencies, setAgencies] = useLocalStorageState<Agency[]>(AGENCIES_KEY, []);
  const [selected, setSelected] = useLocalStorageState<string>("cpm_agencySelected", "");
  const [name, setName] = useState("");
  const [country, setCountry] = useState("Uzbekistan");

  const current = agencies.find((a) => a.id === selected) ?? agencies[0];
  const update = (id: string, patch: Partial<Agency>) => setAgencies((list) => list.map((a) => (a.id === id ? { ...a, ...patch } : a)));
  const add = () => {
    const n = name.trim();
    if (!n) return;
    const a = newAgency(n, country);
    setAgencies((list) => [...list, a]);
    setSelected(a.id);
    setName("");
  };
  const remove = (a: Agency) => {
    if (!confirm(`Delete ${a.name}? This can't be undone.`)) return;
    setAgencies((list) => list.filter((x) => x.id !== a.id));
  };

  const working = agencies.filter((a) => a.status !== "stopped");

  return (
    <div className="flex flex-col gap-4">
      <section className={card}>
        <div className="px-4 py-2.5 border-b border-[var(--cpm-border)] flex items-center gap-2">
          <h3 className="text-[14px] font-bold text-[var(--cpm-text)]">Carriers · who works each one</h3>
          <span className="text-[11.5px] text-[var(--cpm-text-faint)]">Active and paused agencies</span>
        </div>
        <div className="grid gap-px bg-[var(--cpm-border)] sm:grid-cols-2 lg:grid-cols-4">
          {ALL_CARRIER_IDS.map((id) => {
            const on = working.filter((a) => a.carriers.includes(id));
            return (
              <div key={id} className="bg-[var(--cpm-panel)] px-3 py-2.5">
                <div className="flex items-center gap-2 mb-1">
                  <CarrierDot id={id} />
                  <span className="text-[13px] font-semibold text-[var(--cpm-text)]">{carrierLook(id).label}</span>
                  <span className="ml-auto text-[11px] tabular-nums text-[var(--cpm-text-faint)]">{on.length}</span>
                </div>
                <div className="text-[12px] text-[var(--cpm-text-dim)]">
                  {on.length ? (
                    on.map((a, i) => (
                      <span key={a.id}>
                        {i > 0 && ", "}
                        <button type="button" className="hover:underline hover:text-[var(--cpm-text)]" onClick={() => setSelected(a.id)}>
                          {a.name}
                        </button>
                        {a.status === "paused" && <span className="text-[var(--cpm-text-faint)]"> (paused)</span>}
                      </span>
                    ))
                  ) : (
                    <span className="text-[var(--cpm-text-faint)]">No agency</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-[290px_1fr] items-start">
        <div className={`${card} overflow-hidden`}>
          <div className="px-3 py-2.5 border-b border-[var(--cpm-border)] text-[13px] font-bold text-[var(--cpm-text)]">Agencies ({agencies.length})</div>
          {agencies.length ? (
            <ul>
              {agencies.map((a) => (
                <li key={a.id}>
                  <button
                    type="button"
                    onClick={() => setSelected(a.id)}
                    className={`w-full text-left px-3 py-2.5 border-b border-[var(--cpm-border)] transition-colors ${
                      current?.id === a.id ? "bg-[var(--cpm-panel-alt)] shadow-[inset_3px_0_0_var(--cpm-accent)]" : "hover:bg-[var(--cpm-panel-alt)]"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-[13px] text-[var(--cpm-text)] truncate">{a.name}</span>
                      <span className="ml-auto">
                        <StatusPill status={a.status} />
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-1 text-[11px] text-[var(--cpm-text-faint)]">
                      {a.country} ·{" "}
                      {a.carriers.length + a.otherCarriers.length
                        ? `${a.carriers.length + a.otherCarriers.length} ${a.carriers.length + a.otherCarriers.length === 1 ? "carrier" : "carriers"}`
                        : "no carriers yet"}
                      <span className="flex gap-1 ml-1">
                        {a.carriers.map((c) => (
                          <CarrierDot key={c} id={c} />
                        ))}
                      </span>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-3 py-6 text-[12px] text-center text-[var(--cpm-text-faint)]">No agencies yet. Add the first one below.</div>
          )}
          <div className="px-3 py-3 flex flex-col gap-2">
            <div className={label}>Add an agency</div>
            <input className={input} placeholder="Agency name" value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} />
            <div className="flex gap-2">
              <select className={`${input} flex-1`} value={country} onChange={(e) => setCountry(e.target.value)}>
                {COUNTRIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
              <button type="button" className={btnMain} onClick={add} disabled={!name.trim()}>
                <Plus size={14} /> Add
              </button>
            </div>
          </div>
        </div>

        {current ? (
          <AgencyFile key={current.id} a={current} update={(patch) => update(current.id, patch)} remove={() => remove(current)} />
        ) : (
          <div className={`${card} px-4 py-8 text-center text-[12.5px] text-[var(--cpm-text-faint)]`}>
            Add your first agency on the left, then pick the carriers they recruit for.
          </div>
        )}
      </div>

      <AgencyCarrierMap agencies={agencies} />
    </div>
  );
}

function AgencyFile({ a, update, remove }: { a: Agency; update: (patch: Partial<Agency>) => void; remove: () => void }) {
  const [other, setOther] = useState("");
  const toggle = (id: string) => update({ carriers: a.carriers.includes(id) ? a.carriers.filter((c) => c !== id) : [...a.carriers, id] });
  const addOther = () => {
    const n = other.trim();
    if (!n || a.otherCarriers.some((c) => c.toLowerCase() === n.toLowerCase())) return setOther("");
    update({ otherCarriers: [...a.otherCarriers, n] });
    setOther("");
  };

  return (
    <div className="flex flex-col gap-3 min-w-0">
      <div className={`${card} px-4 py-3 flex items-center gap-3 flex-wrap`}>
        <input
          className="bg-transparent text-[17px] font-bold text-[var(--cpm-text)] outline-none border-b border-transparent focus:border-[var(--cpm-accent)] min-w-[200px] flex-1"
          value={a.name}
          onChange={(e) => update({ name: e.target.value })}
          aria-label="Agency name"
        />
        <div className="segTabs">
          {(Object.keys(AGENCY_STATUS) as AgencyStatus[]).map((s) => (
            <button key={s} type="button" className={a.status === s ? "active" : undefined} onClick={() => update({ status: s })}>
              {AGENCY_STATUS[s].label}
            </button>
          ))}
        </div>
        <button type="button" title="Delete agency" onClick={remove} className="text-[var(--cpm-text-faint)] hover:text-[#ff9a9d]">
          <Trash2 size={16} />
        </button>
      </div>

      <section className={card}>
        <div className="px-4 py-2.5 border-b border-[var(--cpm-border)] flex items-center gap-2">
          <h3 className="text-[14px] font-bold text-[var(--cpm-text)]">Carriers they work for</h3>
          <span className="ml-auto text-[11.5px] text-[var(--cpm-text-faint)]">Click to turn on or off</span>
        </div>
        <div className="px-4 py-3 flex flex-wrap gap-2">
          {ALL_CARRIER_IDS.map((id) => {
            const on = a.carriers.includes(id);
            const { label: name, color } = carrierLook(id);
            return (
              <button
                key={id}
                type="button"
                onClick={() => toggle(id)}
                className={`inline-flex items-center gap-2 h-8 px-3 rounded-lg border text-[12.5px] font-semibold transition-colors ${
                  on ? "text-[var(--cpm-text)]" : "border-[var(--cpm-border-strong)] text-[var(--cpm-text-faint)] hover:text-[var(--cpm-text)]"
                }`}
                style={on ? { borderColor: color, background: `${color}26` } : undefined}
              >
                <CarrierDot id={id} />
                {name}
                {on && <span style={{ color }}>✓</span>}
              </button>
            );
          })}
        </div>
        <div className="px-4 pb-3 flex flex-wrap items-center gap-2">
          <span className={label}>Other carriers</span>
          {a.otherCarriers.map((c) => (
            <span key={c} className="inline-flex items-center gap-1 h-7 pl-2.5 pr-1.5 rounded-lg border border-[var(--cpm-border-strong)] text-[12px] text-[var(--cpm-text)]">
              {c}
              <button
                type="button"
                title={`Remove ${c}`}
                onClick={() => update({ otherCarriers: a.otherCarriers.filter((x) => x !== c) })}
                className="text-[var(--cpm-text-faint)] hover:text-[#ff9a9d]"
              >
                <X size={13} />
              </button>
            </span>
          ))}
          <input
            className={`${input} h-7 w-[170px]`}
            placeholder="Add a carrier not listed"
            value={other}
            onChange={(e) => setOther(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addOther()}
          />
        </div>
      </section>

      <section className={`${card} px-4 py-3 grid gap-3 sm:grid-cols-2`}>
        <Field label="Country">
          <select className={input} value={a.country} onChange={(e) => update({ country: e.target.value })}>
            {[...new Set([a.country, ...COUNTRIES])].map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </Field>
        <Field label="Working with us since">
          <input type="date" className={input} value={a.start ?? ""} onChange={(e) => update({ start: e.target.value || undefined })} />
        </Field>
        <Field label="Contact person">
          <input className={input} value={a.contact ?? ""} placeholder="Name" onChange={(e) => update({ contact: e.target.value || undefined })} />
        </Field>
        <Field label="Phone / Telegram">
          <input className={input} value={a.phone ?? ""} placeholder="+998 … or @username" onChange={(e) => update({ phone: e.target.value || undefined })} />
        </Field>
        <div className="sm:col-span-2">
          <Field label="Notes">
            <textarea
              value={a.note ?? ""}
              onChange={(e) => update({ note: e.target.value || undefined })}
              placeholder="Agreement, rules, anything to remember…"
              className="w-full min-h-[64px] px-2.5 py-2 rounded-lg border border-[var(--cpm-border-strong)] bg-[var(--cpm-panel-alt)] text-[12.5px] text-[var(--cpm-text)] outline-none focus:border-[var(--cpm-accent)] resize-y"
            />
          </Field>
        </div>
      </section>
    </div>
  );
}

function Field({ label: text, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className={label}>{text}</span>
      {children}
    </label>
  );
}
