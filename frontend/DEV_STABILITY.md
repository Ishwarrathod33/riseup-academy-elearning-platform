# RiseUp frontend — stable dev / build

## “Cannot find module './682.js'” or webpack runtime errors

Webpack’s runtime points at a chunk file (e.g. `682.js`) that is **missing** from `.next/server` — almost always **stale or half-written `.next`**, especially under **OneDrive / cloud sync**.

**Fix (do this every time you see this error):**

1. Stop `npm run dev` (Ctrl+C).
2. Run:
   ```bash
   npm run clean
   ```
   or:
   ```bash
   npm run dev:clean
   ```
3. Start dev again: `npm run dev`
4. Hard-refresh the browser (Ctrl+Shift+R).

`next.config.mjs` uses **in-memory webpack cache in dev** to reduce how often this happens; it does **not** replace cleaning when `.next` is already broken.

**Long-term:** clone the repo to **`C:\dev\riseup`** (or any non-synced folder) and develop there.

## Unstyled page (no Tailwind / plain HTML)

Usually **`/_next/static/css/...` 404** — same fix: `npm run clean` then `npm run dev`.

Details: see **`TAILWIND.md`** (content paths, PostCSS, OneDrive).

## API / JWT

- Set `NEXT_PUBLIC_API_BASE_URL` in `.env.local` (see `.env.example`).
- Backend must be running and reachable from the browser (same machine: `http://localhost:8080`).

## Recommended

- Keep the repo **outside** cloud-synced folders while developing, or **pause sync** for this folder.
