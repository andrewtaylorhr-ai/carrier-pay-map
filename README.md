# Carrier Pay Map

CDL-A carrier pay comparison and recruiter strategy tool for Class A Recruiting.

Live site: **https://carrier-pay-mapp.vercel.app**

## What it is

A Next.js app covering pay-by-state data for multiple carriers (Swift,
U.S. Xpress, PAM, TransAm, CR England, plus more to come), with two views:

- **Pay/coverage view** — choropleth map + per-state detail card showing pay,
  approval requirements, and home time per carrier/category.
- **Strategy assignment view** — lock in which carrier and which recruiter(s)
  own each state, with workload tracking and an Excel export per recruiter.

## Stack

Next.js (App Router) + React + TypeScript + Tailwind, deployed on Vercel with
auto-deploy on every push to `main`. D3 (`d3-selection`, `d3-geo`, `d3-scale`,
`d3-scale-chromatic`, `topojson-client`) drives the choropleth map; `xlsx`
handles the per-recruiter Excel export.

## Source

Carrier pay/coverage data and business logic live in `src/lib/carriers/`
(typed per-carrier modules ported from the original single-file HTML
prototype). UI components are in `src/components/carrier-map/`.

To update data, edit the relevant module under `src/lib/carriers/` and push —
Vercel rebuilds and redeploys automatically.

## Notes

- Data (pay rates) is maintained in source-controlled TypeScript/JSON — no
  backend or database.
- Recruiter roster and recruiter-to-state / carrier-to-state assignments are
  stored in the browser's `localStorage`, so they're per-device, not shared
  across users viewing the site. This is a solo-user internal tool by design.
- Previously hosted as a static single-file HTML app on GitHub Pages
  (`docs/index.html`); retired in favor of this Next.js app on Vercel.
