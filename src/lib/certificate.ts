// The training certificate: a one-page document opened in its own window so
// the browser's Print dialog can save it as a PDF.
import { formatDay, parseISO } from "@/lib/trainees";

export type Certificate = { id: string; date: string; score: number };

export const newCertificate = (date: string, score: number): Certificate => ({
  id: `CAR-${date.slice(0, 4)}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
  date,
  score,
});

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const longDate = (iso: string) => {
  const d = parseISO(iso);
  return Number.isNaN(d.getTime()) ? formatDay(iso) : d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
};

export function printCertificate(name: string, cert: Certificate, signer: string) {
  const w = window.open("", "_blank");
  if (!w) {
    alert("Your browser blocked the certificate window. Allow pop-ups for this site and try again.");
    return;
  }
  w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Certificate - ${esc(name)}</title><style>
@page { size: letter landscape; margin: 0; }
* { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
body { margin: 0; font-family: Georgia, 'Times New Roman', serif; color: #1a2233; background: #fff; }
.page { width: 11in; height: 8.5in; padding: .45in; }
.frame { height: 100%; border: 3px solid #d9a441; outline: 1px solid #1a2233; outline-offset: -10px; padding: .55in .8in; display: flex; flex-direction: column; align-items: center; text-align: center; }
.logo { font: 700 22px Arial, sans-serif; letter-spacing: .14em; }
.tag { font: 11px Arial, sans-serif; letter-spacing: .2em; color: #8a6100; margin-top: 4px; }
h1 { font-size: 40px; font-weight: 400; margin: .4in 0 .12in; }
.lead { font-size: 16px; color: #444; }
.name { font-size: 42px; font-style: italic; margin: .14in 0 .08in; padding: 0 .5in .06in; border-bottom: 1px solid #d9a441; }
.body { font-size: 16px; line-height: 1.5; max-width: 7in; color: #333; margin-top: .12in; }
.row { margin-top: auto; width: 100%; display: flex; justify-content: space-between; align-items: flex-end; font: 13px Arial, sans-serif; }
.cell { width: 2.6in; }
.line { border-top: 1px solid #1a2233; padding-top: 6px; }
.small { color: #666; font-size: 11px; }
</style></head><body><div class="page"><div class="frame">
<div class="logo">CLASS A RECRUITING</div><div class="tag">DRIVE TALENT. BUILD TOMORROW.</div>
<h1>Certificate of Completion</h1><div class="lead">This certifies that</div>
<div class="name">${esc(name)}</div>
<div class="body">has completed the Class A Recruiting Academy and passed the final examination with a score of <b>${cert.score}%</b>.</div>
<div class="row">
<div class="cell"><div class="line">${esc(longDate(cert.date))}</div><div class="small">Completion date</div></div>
<div class="cell"><div><b>${esc(cert.id)}</b></div><div class="small">Certificate ID</div></div>
<div class="cell"><div class="line">${esc(signer) || "&nbsp;"}</div><div class="small">Authorized management signature</div></div>
</div></div></div><script>window.onload=function(){window.print();};</script></body></html>`);
  w.document.close();
}
