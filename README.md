# Carrier Pay Map

CDL-A carrier pay comparison and recruiter strategy tool for Class A Recruiting.

Live site: **https://andrewtaylorhr-ai.github.io/carrier-pay-map/**

## What it is

A Next.js app covering pay-by-state data for multiple carriers (Swift,
U.S. Xpress, PAM, TransAm, CR England, plus more to come), with two views:

- **Pay/coverage view** — choropleth map + per-state detail card showing pay,
  approval requirements, and home time per carrier/category.
- **Strategy assignment view** — lock in which carrier and which recruiter(s)
  own each state, with workload tracking and an Excel export per recruiter.

## Stack

Next.js (App Router) + React + TypeScript + Tailwind, built as a static
export (`output: "export"`, no server/API routes needed) and deployed to
GitHub Pages via the `.github/workflows/deploy-pages.yml` GitHub Actions
workflow — auto-deploys on every push to `main`, no third-party dashboard
involved. D3 (`d3-selection`, `d3-geo`, `d3-scale`, `d3-scale-chromatic`,
`topojson-client`) drives the choropleth map; `xlsx` handles the
per-recruiter Excel export.

Because GitHub Pages serves this as a project page (not a `*.github.io` user
page), the app is built with `basePath: "/carrier-pay-map"` in production.
Any code that references a `public/` asset by absolute path (the topojson
fetch in `ChoroplethMap.tsx`, the carrier logo `<img>` in `Toolbar.tsx`) must
prefix it with `BASE_PATH` from `src/lib/basePath.ts` — plain `next/link`
and CSS `url()` inside `globals.css` don't need this, only raw
`fetch()`/`<img src>` calls do.

## Source

Carrier pay/coverage data and business logic live in `src/lib/carriers/`
(typed per-carrier modules ported from the original single-file HTML
prototype). UI components are in `src/components/carrier-map/`.

To update data, edit the relevant module under `src/lib/carriers/` and push —
GitHub Actions rebuilds and redeploys to Pages automatically.

## Notes

- Data (pay rates) is maintained in source-controlled TypeScript/JSON — no
  backend or database.
- Recruiter roster and recruiter-to-state / carrier-to-state assignments are
  stored in the browser's `localStorage`, so they're per-device, not shared
  across users viewing the site. This is a solo-user internal tool by design.
- Originally a static single-file HTML app on GitHub Pages
  (`docs/index.html`), rebuilt as this Next.js app. Briefly hosted on Vercel,
  but that project got connected to a stale auto-generated repo and never
  actually deployed pushes from here — moved back to GitHub Pages (via a
  proper GitHub Actions static-export workflow this time) since it's a
  better fit for a solo-user internal tool with no server-side needs anyway.
