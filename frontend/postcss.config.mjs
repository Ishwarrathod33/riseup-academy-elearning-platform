/**
 * PostCSS for Next.js (ESM). Tailwind + Autoprefixer must run on `src/app/globals.css`.
 * Keeps Windows + `"type": "module"` projects consistent (prefer this over mixed .cjs).
 */
/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};

export default config;
