# Carrier Pay Map

CDL-A carrier pay comparison and recruiter strategy tool for Class A Recruiting.

Live site: **https://andrewtaylorhr-ai.github.io/carrier-pay-map/**

## What it is

A single self-contained web app (`docs/index.html`) covering pay-by-state data
for multiple carriers (Swift, U.S. Xpress, PAM, TransAm, CR England, plus more
to come), with two views:

- **Pay/coverage view** — choropleth map + per-state detail card showing pay,
  approval requirements, and home time per carrier/category.
- **Strategy assignment view** — lock in which carrier and which recruiter(s)
  own each state, with workload tracking and an Excel export per recruiter.

## Source

`docs/index.html` is the deployed copy of the working file
(`Multi_Carrier_Pay_Map.html`). Edit locally, then copy over `docs/index.html`
and push to update the live site (GitHub Pages serves `main` branch `/docs`).

## Notes

- Data (pay rates, recruiter assignments) is manually maintained inline in the
  HTML/JS — no backend or database.
- Recruiter-to-state assignments are stored in the browser's `localStorage`,
  so they're per-device, not shared across users viewing the site.
