/**
 * Removes Next.js build output and webpack caches.
 * Run before `npm run dev` or `npm run build` when you see missing chunk errors (e.g. Cannot find module './682.js').
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const paths = [".next", path.join("node_modules", ".cache")];

for (const rel of paths) {
  const full = path.join(root, rel);
  try {
    fs.rmSync(full, { recursive: true, force: true });
    console.log(`[clean] removed ${rel}`);
  } catch (e) {
    console.warn(`[clean] skip ${rel}:`, e instanceof Error ? e.message : e);
  }
}

console.log("[clean] done");
