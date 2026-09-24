import type { NextConfig } from "next";

// Static export for GitHub Pages — no server, no API routes, this whole app
// is client-driven (localStorage + a bundled topojson file), so `output:
// "export"` is a clean fit. Pages serves project repos from a /<repo>/
// subpath, hence basePath; next/image optimization needs a server, which
// static export doesn't have, hence unoptimized.
const nextConfig: NextConfig = {
  output: "export",
  basePath: process.env.NODE_ENV === "production" ? "/carrier-pay-map" : "",
  images: { unoptimized: true },
};

export default nextConfig;
