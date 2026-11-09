// Outside recruiting agencies that recruit drivers for us, next to our own
// Uzbek and Philippines teams. Kept per browser in localStorage.
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
  carriers: CarrierId[]; // carriers from the pay map they recruit for
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
