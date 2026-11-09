// Outside recruiting agencies that recruit drivers for us, next to our own
// Uzbek and Philippines teams. Kept per browser in localStorage.
import { AGENCY_CARRIERS } from "@/lib/agency-carriers";
import { CARRIERS, CARRIER_ORDER } from "@/lib/carriers/data";
import type { CarrierId } from "@/lib/carriers/types";

export type AgencyStatus = "active" | "paused" | "stopped";

export type Agency = {
  id: string;
  name: string;
  country: string;
  status: AgencyStatus;
  start?: string; // ISO date they started working with us
  contact?: string; // contact person
  phone?: string; // phone / Telegram / WhatsApp
  carriers: string[]; // ids of agency carriers (Barr-Nunn…) and pay map carriers
  otherCarriers: string[]; // carriers not on the map yet
  note?: string;
};

export const AGENCIES_KEY = "cpm_agencies";

export const AGENCY_STATUS: Record<AgencyStatus, { label: string; color: string }> = {
  active: { label: "Active", color: "#22c55e" },
  paused: { label: "Paused", color: "#f59e0b" },
  stopped: { label: "Stopped", color: "#9aa0ad" },
};

export const COUNTRIES = ["Uzbekistan", "Philippines", "Kazakhstan", "Kyrgyzstan", "Tajikistan", "USA", "Other"];

export const newAgency = (name: string, country: string): Agency => ({
  id: `ag-${Date.now().toString(36)}`,
  name,
  country,
  status: "active",
  start: new Date().toISOString().slice(0, 10),
  carriers: [],
  otherCarriers: [],
});

// Carriers an agency can be ticked for: the agency-only carriers first, then
// the pay map carriers.
export const AGENCY_CARRIER_IDS = AGENCY_CARRIERS.map((c) => c.id);
export const ALL_CARRIER_IDS = [...AGENCY_CARRIER_IDS, ...CARRIER_ORDER];

export function carrierLook(id: string): { label: string; color: string } {
  const own = AGENCY_CARRIERS.find((c) => c.id === id);
  if (own) return own;
  const map = CARRIERS[id as CarrierId];
  return map ? { label: map.label, color: map.color } : { label: id, color: "#9aa0ad" };
}
