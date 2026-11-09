// Ported verbatim from renderCatNote() in the original HTML — these caveat
// banners must not be dropped or reworded (domicile/account-radius warnings
// carriers explicitly asked recruiters to read before quoting a driver).
import { BARR_NUNN_NOTE } from "./barr-nunn";
import type { CarrierId } from "./types";

export function getCatNote(carrierId: CarrierId, cat: string): string | null {
  if (carrierId === "swift") {
    return `Swift data is the <b>Hiring Data Base</b> export (OPEN accounts only). States = each account's "Hiring State" list. Tabs are derived from each account's line of business + home time (dedicated &amp; home daily → Local; OTR &amp; home weekly → Regional). Accounts flagged <b>needs approval</b> require Swift leadership approval.`;
  }
  if (carrierId === "usx") {
    if (cat === "OTR Solo Company") {
      return `OTR Solo pay is <b>region-based CPM</b> (not per terminal) — map color = top CPM for the state's region. Click a state to see which hiring bases cover it.`;
    }
    return `States = where each account's <b>hiring-area shape</b> on the USX 3rd Party Hiring Map falls. Company drivers only — Owner Operator fleets are left out. Many listings give a CPM chart instead of an average weekly figure, so some states show "pay not listed".`;
  }
  if (carrierId === "jbh") {
    return `J.B. Hunt lists <b>average yearly gross</b> only — weekly pay shown is that figure ÷ 52. Tabs come from the position name (Local / Semi-Local / Regional / OTR / Final Mile). Independent-contractor (IC) positions are left out.`;
  }
  if (carrierId === "hub") {
    return `Hub Group hires <b>within 50 miles / 1 hour of each yard</b>, so a state lights up when it's inside that radius — neighboring states near a yard are included.`;
  }
  if (carrierId === "pam") {
    return 'PAM is domicile-based with a ~90-mile hiring radius, not full-state coverage. A state lights up because it contains a PAM domicile pin, not because PAM covers the whole state. "Temporary domicile" cities have an unconfirmed pay tier.';
  }
  if (carrierId === "cre") {
    return 'CR England data is account/radius-based (e.g. "within 50 miles of X, City, ST") — only the literal state named in the source is tagged, not neighboring states the radius may bleed into. Tabs group the 56 currently-open accounts by home-time cadence. About a third of accounts have no confirmed avg/top10 pay figure ("pay not confirmed" — usually per-load or CPM-only pay) — click a state and open an account for details before quoting a driver. Source workbook had many duplicate/legacy account sheets; figures shown reflect the sheet judged most current for each account (alt figures noted where found).';
  }
  if (carrierId === "barr") return BARR_NUNN_NOTE;
  return null;
}
