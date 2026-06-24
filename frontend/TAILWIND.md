# Tailwind CSS — stable setup (RiseUp frontend)

## Why the UI sometimes looked “unstyled”

1. **Stale `.next` folder** — CSS chunks under `/_next/static/css/` 404 → browser shows plain HTML.  
   **Fix:** `npm run clean` then `npm run dev` (or `npm run dev:clean`).

2. **OneDrive / cloud sync** — sync can corrupt or partially write `.next` while `next dev` is running.  
   **Fix:** Move the repo to a **non-synced** path, e.g. `C:\dev\riseup`, or **pause OneDrive** for this folder during development.

3. **Wrong `content` paths in `tailwind.config.ts`** — if folders are renamed or classes live outside scanned paths, Tailwind purges those classes.  
   **Fix:** This repo lists `./src/app`, `./src/components`, `./src/features`, `./src/lib`, `./src/hooks`. Add a new glob if you add another top-level folder under `src/`.

## Verified stack

| File | Role |
|------|------|
| `src/app/globals.css` | `@tailwind base/components/utilities` + design tokens |
| `src/app/layout.tsx` | `import "./globals.css"` after self-hosted font CSS imports |
| `tailwind.config.ts` | `content` globs for `src/**` |
| `postcss.config.mjs` | `tailwindcss` + `autoprefixer` (ESM — works with `"type": "module"`) |

## Quick health check

1. Run `npm run dev`, open the site.
2. DevTools → **Network** → filter **CSS** → `/_next/static/css/*.css` should be **200**.
3. If 404: run `npm run clean && npm run dev`.

## After dependency updates

```bash
npm run build:clean
```

Ensures a full Tailwind pass and fresh chunks.

## Fonts (no Google network)

Fonts are **self-hosted** via `@fontsource-variable/inter` and `@fontsource/poppins` (imported in `src/app/layout.tsx`).  
If you previously saw **`Failed to fetch Inter from Google Fonts`** / **`AbortError`** in the terminal, that was from `next/font/google` timing out — that path is no longer used.
