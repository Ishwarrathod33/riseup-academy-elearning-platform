/** @type {import('next').NextConfig} */
const backendOrigin = process.env.BACKEND_URL ?? "http://127.0.0.1:8080";

const nextConfig = {
  reactStrictMode: true,

  /**
   * Proxy API calls to the Express app so the browser talks to :3000 only.
   * Fixes CORS/cookies and "Failed to fetch" when the UI uses relative `/api` URLs.
   * Start backend: `cd backend && npm run dev` (default port 8080).
   */
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${backendOrigin.replace(/\/$/, "")}/api/:path*` }];
  },
  // Do NOT use output: "standalone" unless you copy `.next/static` + `public` into the
  // standalone folder — otherwise `_next/static/css/*.css` 404s and the site looks unstyled.

  // Keep defaults for stability. This app previously hit intermittent dev chunk-missing
  // errors with experimental import optimization on Windows.

  /**
   * Dev-only: in-memory webpack cache (avoids stale disk chunks under OneDrive / interrupted dev).
   * If you still see "Cannot find module './682.js'", run `npm run clean` then `npm run dev`.
   */
  webpack: (config, { dev }) => {
    if (dev) {
      config.cache = { type: "memory" };
    }
    return config;
  },
};

export default nextConfig;
