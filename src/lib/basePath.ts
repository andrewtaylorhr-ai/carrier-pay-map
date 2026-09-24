// GitHub Pages serves this app from https://andrewtaylorhr-ai.github.io/carrier-pay-map/
// (a project page, not a user/org page), so every absolute reference to a
// public/ asset needs this prefix in production. `next dev` stays unprefixed
// for local convenience. Kept in sync with `basePath` in next.config.ts.
export const BASE_PATH = process.env.NODE_ENV === "production" ? "/carrier-pay-map" : "";
