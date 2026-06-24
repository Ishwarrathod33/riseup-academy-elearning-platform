# RiseUp Academy — frontend architecture

## Layout

- **`src/app/`** — Next.js App Router routes only (thin pages).
- **`src/features/`** — Product domains: **`layout/`** (navbar, footer), **`home/`**, **`dashboard/`**, **`courses/`** (e.g. Razorpay).
- **`src/components/`** — Shared UI: **`ui/`** (shadcn), **`layout/`** (`Section`, `PageContainer`), **`lms/`** (course player, quizzes).
- **`src/lib/`** — **`api.ts`** (central `apiFetch`, `ApiError`), **`constants.ts`** (storage keys), **`format.ts`**, **`auth.ts`**, **`cn.ts`**.
- **`src/hooks/`** — Reusable client hooks (e.g. **`useAuthToken`**).

## API & auth

- All authenticated calls go through **`apiFetch`** (`NEXT_PUBLIC_API_BASE_URL`, JWT from `STORAGE_KEYS.accessToken`).
- **`ApiError`** carries HTTP status; **401** triggers redirect to login on the student dashboard loader.
- OTP + token storage uses **`STORAGE_KEYS`** — keep aligned with **`src/lib/auth.ts`** and login page.

## Adding a feature

1. Create `src/features/<name>/` with components + optional `hooks/` and `lib/`.
2. Export a small public API from `src/features/<name>/index.ts`.
3. Keep `src/app/<route>/page.tsx` as a thin wrapper that composes feature components.
