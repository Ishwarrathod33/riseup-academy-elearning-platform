# Frontend looks unstyled (no Tailwind / default Times font)

This almost always means **the compiled CSS file is not loading** (404) or the **dev server is not the Next.js app**.

## Fix (try in order)

1. **Run from the `frontend` folder**
   ```bash
   cd frontend
   npm install
   ```
2. **Clear the Next cache and restart**
   ```bash
   rmdir /s /q .next
   npm run dev
   ```
   Open **http://localhost:3000** (not a file path, not another port).

3. **In the browser DevTools → Network**, reload and check:
   - A request like `/_next/static/css/....css` should return **200**.
   - If it is **404**, you were probably running **`output: "standalone"`** without copying static assets. This repo uses normal `next start` / `next dev` so CSS is served correctly.

4. **Do not open `index.html` from disk** — styles only work through `next dev` or `next start`.

5. **OneDrive / sync**: if CSS still 404s, try cloning or copying the project to a non-synced folder (e.g. `C:\dev\riseup`) — sync can interfere with `.next` and `node_modules`.
