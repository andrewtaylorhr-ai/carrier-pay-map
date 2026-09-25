// Best-effort DQ (rejection) reason categorization, derived entirely from the
// free-text `note` column carriers send ("Status of application" or similar
// — see parseWorkbook.ts). There is no structured "reason" field anywhere in
// the source data; carriers phrase the same underlying reason wildly
// differently (see statusClassify.ts's own comment on this: "RC Denied" vs
// "No RC - DQ" vs "Reject-Requirements-MVR" vs full prose sentences).
//
// Rather than pretend to perfectly parse every carrier's vocabulary, this
// buckets by keyword against a fixed list of standard CDL-recruiting DQ
// categories, first match wins, and anything that doesn't hit a keyword
// honestly falls into "Other / uncategorized" — never silently dropped, and
// never guessed into a specific-sounding category it didn't earn.

import type { DriverRecord } from "./types";

export interface ReasonCategory {
  key: string;
  label: string;
  re: RegExp;
}

// Order matters — first match wins, so more specific categories (e.g. a named
// medical/drug reason) are checked before generic catch-alls like "declined".
export const DQ_REASON_CATEGORIES: ReasonCategory[] = [
  {
    key: "mvr",
    label: "MVR / driving record",
    re: /\bmvr\b|driving record|too many (violations|accidents|tickets)|speeding|reckless|suspended license|revoked license|\bdui\b|\bdwi\b|\baccident\b|\brollover\b|moving violation/i,
  },
  {
    key: "background",
    label: "Background / criminal history",
    re: /background (check|issue)|criminal|\bfelony\b|felon\b|misdemeanor/i,
  },
  {
    key: "drug",
    label: "Failed drug/alcohol screen",
    re: /drug (test|screen)|failed (a )?drug|positive (test|screen|result)|\balcohol\b|\bTHC\b/i,
  },
  {
    key: "medical",
    label: "Medical / DOT physical",
    re: /medical (issue|card|disqualif)|\bdot physical\b|\bdot card\b|physical (exam|failed)|sleep apnea/i,
  },
  {
    key: "experience",
    label: "Insufficient experience",
    re: /(lack(s|ing)?|insufficient|not enough|no) .*experience|inexperienced|verifiable experience|experience requirement/i,
  },
  {
    key: "employment",
    label: "Employment history / verification",
    re: /employment (history|verification)|work history|unable to verify|prior employer|reference check|gap in employment/i,
  },
  {
    key: "sap",
    label: "SAP program",
    re: /\bsap\b/i,
  },
  {
    key: "age",
    label: "Age requirement",
    re: /\bage requirement\b|under 2[0-9]\b|too young/i,
  },
  {
    key: "credit",
    label: "Credit / financial",
    re: /credit check|financial (issue|history)|bankrupt/i,
  },
  {
    key: "cdl",
    label: "CDL / license issue",
    re: /no cdl\b|cdl (expired|suspended|revoked)|permit only|license (issue|expired|suspended)/i,
  },
  {
    key: "noresponse",
    label: "No response / unresponsive",
    re: /no response|unresponsive|no[- ]show|didn'?t show|could not reach|couldn'?t (reach|contact)|no contact|went to voicemail|left voicemail/i,
  },
  {
    key: "declined",
    label: "Declined / not interested",
    re: /not interested|no longer interested|declin|withdrew|withdrawn|changed (his|her|their) mind|chose another|went with (a )?(another|different)|took (a )?(another|different) (job|offer)/i,
  },
  {
    key: "duplicate",
    label: "Duplicate application",
    re: /duplicate/i,
  },
  {
    key: "ineligible",
    label: "Not eligible / requirements not met",
    re: /not (eligible|qualified)|doesn'?t (meet|qualify)|does not (meet|qualify)|requirements? not met|ineligible/i,
  },
];

export function categorizeDqReason(note: string): string {
  const text = (note || "").trim();
  if (!text) return "Not specified";
  for (const c of DQ_REASON_CATEGORIES) {
    if (c.re.test(text)) return c.label;
  }
  return "Other / uncategorized";
}

export interface DqReasonRow {
  label: string;
  count: number;
}

// Categorized DQ-reason counts for one carrier/recruiter's slice of records —
// only DQ-status rows are considered. Sorted most-common first.
export function dqReasonsForRecords(records: DriverRecord[]): DqReasonRow[] {
  const map = new Map<string, number>();
  records
    .filter((r) => r.status === "DQ")
    .forEach((r) => {
      const label = categorizeDqReason(r.note);
      map.set(label, (map.get(label) ?? 0) + 1);
    });
  return Array.from(map.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);
}
