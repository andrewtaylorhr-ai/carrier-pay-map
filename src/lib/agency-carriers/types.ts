// Carriers only our outside agencies recruit for. They are not on the pay
// map; their fleets, hiring states and pay show on the Agencies page.

export type Fleet = {
  id: string;
  name: string;
  cat: string;
  states: string[]; // full state names
  payLow: number | null; // estimated weekly $, solo fleets only
  payHigh: number | null;
  payText: string;
  hometime: string;
  notes: string;
};

export type AgencyCarrier = {
  id: string;
  label: string;
  color: string;
  cats: string[];
  experience: string;
  note: string; // HTML, our own text
  fleets: Fleet[];
};
