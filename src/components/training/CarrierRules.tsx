"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useLocalStorageState } from "@/lib/hooks/useLocalStorage";
import { CARRIER_RULES_KEY, CARRIER_RULE_FIELDS, DEFAULT_CARRIER_RULES, type CarrierRule, type CarrierRuleField } from "@/lib/training-content";

const card = "rounded-xl border border-[var(--cpm-border)] bg-[var(--cpm-panel)]";
const label = "text-[10.5px] font-semibold uppercase tracking-wider text-[var(--cpm-text-faint)]";

// Carrier requirements the manager can change at any time.
export function CarrierRules() {
  const [rules, setRules] = useLocalStorageState<CarrierRule[]>(CARRIER_RULES_KEY, DEFAULT_CARRIER_RULES);
  const [selected, setSelected] = useState("");
  const [name, setName] = useState("");
  const current = rules.find((r) => r.id === selected) ?? rules[0];
  const update = (patch: Partial<CarrierRule>) => setRules((list) => list.map((r) => (r.id === current.id ? { ...r, ...patch } : r)));
  const add = () => {
    const n = name.trim();
    if (!n) return;
    const id = `carrier-${Date.now().toString(36)}`;
    setRules((list) => [...list, { id, name: n }]);
    setSelected(id);
    setName("");
  };
  const remove = () => {
    if (!confirm(`Delete ${current.name}? This can't be undone.`)) return;
    setRules((list) => list.filter((r) => r.id !== current.id));
    setSelected("");
  };

  return (
    <div className="flex flex-col gap-3 max-w-[1100px]">
      <p className="text-[12.5px] text-[var(--cpm-text-dim)]">Change anything here when a carrier&apos;s rules change. It saves as you type, in this browser only. Always check the carrier&apos;s latest sheet before quoting a driver.</p>
      <div className="grid gap-4 lg:grid-cols-[240px_1fr] items-start">
        <div className={`${card} overflow-hidden`}>
          <ul>
            {rules.map((r) => (
              <li key={r.id}>
                <button
                  type="button"
                  onClick={() => setSelected(r.id)}
                  className={`w-full text-left px-3 py-2 border-b border-[var(--cpm-border)] text-[13px] font-semibold text-[var(--cpm-text)] ${
                    current?.id === r.id ? "bg-[var(--cpm-panel-alt)] shadow-[inset_3px_0_0_var(--cpm-accent)]" : "hover:bg-[var(--cpm-panel-alt)]"
                  }`}
                >
                  {r.name || "Unnamed"}
                </button>
              </li>
            ))}
          </ul>
          <div className="p-3 flex gap-2">
            <input
              className="h-8 min-w-0 flex-1 px-2.5 rounded-lg border border-[var(--cpm-border-strong)] bg-[var(--cpm-panel-alt)] text-[12.5px] text-[var(--cpm-text)] outline-none focus:border-[var(--cpm-accent)]"
              placeholder="Add a carrier"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && add()}
            />
            <button type="button" className="ghostBtn" onClick={add} disabled={!name.trim()} aria-label="Add carrier">
              <Plus size={14} />
            </button>
          </div>
        </div>

        {current ? (
          <section key={current.id} className={`${card} px-4 py-3 flex flex-col gap-3 min-w-0`}>
            <div className="flex items-center gap-3">
              <input
                className="bg-transparent text-[17px] font-bold text-[var(--cpm-text)] outline-none border-b border-transparent focus:border-[var(--cpm-accent)] min-w-0 flex-1"
                value={current.name}
                onChange={(e) => update({ name: e.target.value })}
                aria-label="Carrier name"
              />
              <button type="button" title="Delete carrier" onClick={remove} className="text-[var(--cpm-text-faint)] hover:text-[#ff9a9d]">
                <Trash2 size={16} />
              </button>
            </div>
            {CARRIER_RULE_FIELDS.map((f: { key: CarrierRuleField; label: string }) => (
              <label key={f.key} className="flex flex-col gap-1">
                <span className={label}>{f.label}</span>
                <textarea
                  value={current[f.key] ?? ""}
                  onChange={(e) => update({ [f.key]: e.target.value })}
                  placeholder="Not filled in yet"
                  className="w-full min-h-[52px] px-2.5 py-2 rounded-lg border border-[var(--cpm-border-strong)] bg-[var(--cpm-panel-alt)] text-[12.5px] text-[var(--cpm-text)] outline-none focus:border-[var(--cpm-accent)] resize-y"
                />
              </label>
            ))}
          </section>
        ) : (
          <div className={`${card} px-4 py-8 text-center text-[12.5px] text-[var(--cpm-text-faint)]`}>Add a carrier on the left.</div>
        )}
      </div>
    </div>
  );
}
