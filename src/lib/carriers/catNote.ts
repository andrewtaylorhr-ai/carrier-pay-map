// Ported verbatim from renderCatNote() in the original HTML — these caveat
// banners must not be dropped or reworded (domicile/account-radius warnings
// carriers explicitly asked recruiters to read before quoting a driver).
import type { CarrierId } from "./types";

export function getCatNote(carrierId: CarrierId, cat: string): string | null {
  if (carrierId === "usx" && cat === "OTR Regional") {
    return 'Only the <b>Northeast</b> sub-fleet is plotted on the map (best-effort reading of its running-area description). The <b>Southeast</b> (Ellenwood, GA — $1,100/wk) and <b>West Coast</b> (Western 11 + TX — $1,100/wk) sub-fleets have no confirmed state list, so they are not plotted — click any Northeast state for the note, or check with USX before assigning southeast/west states based on this category.';
  }
  if (carrierId === "usx" && (cat === "Dedicated Home Weekly" || cat === "Dedicated Daily/Frequently/Team")) {
    return 'Some accounts here have unconfirmed pay (MDI Hickory NC, FD Morehead KY, FD Maquoketa IA) — shown as "pay not confirmed" rather than guessed.';
  }
  if (carrierId === "pam") {
    return 'PAM is domicile-based with a ~90-mile hiring radius, not full-state coverage. A state lights up because it contains a PAM domicile pin, not because PAM covers the whole state. "Temporary domicile" cities have an unconfirmed pay tier.';
  }
  if (carrierId === "cre") {
    return 'CR England data is account/radius-based (e.g. "within 50 miles of X, City, ST") — only the literal state named in the source is tagged, not neighboring states the radius may bleed into. Tabs group the 56 currently-open accounts by home-time cadence. About a third of accounts have no confirmed avg/top10 pay figure ("pay not confirmed" — usually per-load or CPM-only pay) — click a state and open an account for details before quoting a driver. Source workbook had many duplicate/legacy account sheets; figures shown reflect the sheet judged most current for each account (alt figures noted where found).';
  }
  return null;
}
