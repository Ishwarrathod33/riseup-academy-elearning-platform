# RiseUp Academy

Full-stack web application for an online academy with authentication, course enrollment, LMS delivery, payments, and an admin panel.

The repository is split into:
- `frontend` (Next.js App Router UI)
- `backend` (Express + Prisma API)
- `docs` (project notes)

---

## Tech Stack

### Languages
- TypeScript
- JavaScript (config/scripts)
- CSS (Tailwind + global styles)
- Prisma schema (PostgreSQL data model)

### Frontend (`frontend/package.json`)
- Next.js 14
- React 18 / React DOM
- Tailwind CSS + PostCSS + Autoprefixer
- Radix UI primitives
- React Hook Form + Zod resolver
- Zod
- `next-themes`
- `lucide-react`
- `class-variance-authority`, `clsx`, `tailwind-merge`
- `@fontsource-variable/inter`, `@fontsource/poppins`

### Backend (`backend/package.json`)
- Express 4
- Prisma + `@prisma/client`
- PostgreSQL driver (`pg`)
- Zod
- JWT (`jsonwebtoken`)
- Password hashing (`bcryptjs`)
- CORS, Helmet, Cookie Parser
- Multer (file uploads)
- Nodemailer (email/OTP support)
- Razorpay SDK
- Dotenv

---

## Project Structure

```text
riseup/
├─ backend/
│  ├─ prisma/
│  │  └─ schema.prisma            # Database schema (users, courses, LMS, payments, admin entities)
│  ├─ src/
│  │  ├─ config/                  # Env parsing/validation
│  │  ├─ db/                      # PostgreSQL connectivity check
│  │  ├─ lib/                     # JWT, password, OTP/email helpers
│  │  ├─ middleware/              # Auth, rate limit, async route wrapper
│  │  ├─ routes/                  # auth, courses, payments, lms, admin
│  │  ├─ types/                   # Shared backend request/type declarations
│  │  ├─ app.ts                   # Express app wiring, middleware, global error handler
│  │  └─ index.ts                 # Server bootstrap
│  ├─ assets/                    # Local file uploads (dev-style)
│  └─ package.json
├─ frontend/
│  ├─ public/
│  ├─ scripts/                    # Build/dev cleanup helpers
│  ├─ src/
│  │  ├─ app/                     # Next.js routes/pages
│  │  ├─ components/              # Shared UI + LMS components
│  │  ├─ features/                # Domain modules (auth, home, courses, dashboard, layout, profile)
│  │  ├─ hooks/
│  │  └─ lib/                     # API client, auth helpers, constants, utils
│  ├─ next.config.mjs             # API rewrite proxy + dev webpack cache settings
│  └─ package.json
└─ docs/
```

---

## Status Report (Current Functionality)

### Implemented and Working
- Authentication:
  - Register/login (password)
  - OTP request/verify
  - Refresh-token flow
  - Logout
  - Forgot/reset password
  - Profile get/update
- Role-aware backend access middleware (`requireAuth`, `requireRole`).
- Courses:
  - Public course list
  - Course details endpoint
  - Student enrolled courses
  - Admin create/update/delete courses
- LMS:
  - Lectures listing and progress persistence
  - Quiz fetch and submit
  - Assignment submit + upload endpoint
  - Results, certificates, attendance, live classes endpoints
- Admin:
  - Course content management (lectures/quizzes/assignments)
  - Announcements
  - Attendance session creation/marking
  - Student progress summary endpoint
- Payments:
  - `create`, `verify`, `webhook`, and `my payments`
  - Free-course immediate enrollment flow
  - Dev fallback when Razorpay is not configured/auth fails
- Platform stability:
  - Async route wrapper to prevent unhandled promise crashes
  - Global error middleware
  - Request logging
  - Startup PostgreSQL connectivity check (`PostgreSQL connected`)
  - API routes mounted under `/api`

---

## Work in Progress / Roadmap

The following are present as gaps or partially productionized areas:

- Payment production hardening
  - Dev dummy fallback exists; full production-grade reconciliation/refund/dispute flows are still pending.
- Security hardening
  - Access token currently stored client-side (localStorage) instead of full HttpOnly-only session pattern.
  - Rate limiting is in-memory (not distributed Redis-based).
  - CSRF protections are not explicitly implemented for cookie-auth interactions.
- Authorization depth
  - Some LMS routes rely on auth and may need stricter enrollment/entitlement checks per resource.
- Uploads/storage
  - Local disk upload approach is used; object storage + signed URLs/scanning are recommended for production.
- Observability
  - Logging is primarily `console.*`; structured logging + request IDs + monitoring integration are not fully implemented.
- Frontend UX polish
  - Some pages still use static/demo content and have uneven loading/empty/retry states in certain flows.

---

## Setup Instructions

## Prerequisites
- Node.js 18+ (recommended)
- npm (lockfiles are present and scripts use npm)
- PostgreSQL running locally or remotely

## 1) Install dependencies

From repo root:

```bash
cd backend && npm install
cd ../frontend && npm install
```

## 2) Configure environment variables

### Backend
Create/update `backend/.env` with required values referenced by `backend/src/config/env.ts`:
- `DATABASE_URL`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- Optional/feature-based:
  - `CORS_ORIGIN`, `FRONTEND_URL`
  - SMTP/Twilio vars for OTP/email
  - Razorpay vars (`RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`)

### Frontend
Use `frontend/.env.example` as reference:
- Usually keep `NEXT_PUBLIC_API_BASE_URL` empty to use Next.js rewrite proxy (`/api -> backend`).
- Set `BACKEND_URL` if backend is not at default `http://127.0.0.1:8080`.

## 3) Database setup (backend)

```bash
cd backend
npm run prisma:generate
npm run prisma:migrate
```

## 4) Run locally (two terminals)

Terminal A:
```bash
cd backend
npm run dev
```

Terminal B:
```bash
cd frontend
npm run dev
```

Frontend runs on `http://localhost:3000` (or next free port), backend on `http://localhost:8080` by default.

## 5) Build for production checks

```bash
cd backend && npm run build
cd ../frontend && npm run build
```

---

## API Endpoints Table

Base prefix: `/api`

### Auth

| Method | Path | Access |
|---|---|---|
| GET | `/me` | Auth |
| POST | `/auth/register` | Public |
| POST | `/auth/login` | Public |
| POST | `/auth/otp/request` | Public |
| POST | `/auth/otp/verify` | Public |
| GET | `/auth/me` | Auth |
| PUT | `/auth/me` | Auth |
| POST | `/auth/logout` | Auth |
| POST | `/auth/refresh` | Public (uses refresh cookie) |
| POST | `/auth/password/forgot` | Public |
| POST | `/auth/password/reset` | Public |
| POST | `/auth/password/reset-by-token` | Public |

### Courses

| Method | Path | Access |
|---|---|---|
| GET | `/courses` | Public |
| GET | `/courses/:courseId` | Public |
| GET | `/courses/my` | Auth |
| POST | `/courses` | Admin |
| PUT | `/courses/:courseId` | Admin |
| DELETE | `/courses/:courseId` | Admin |

### LMS

| Method | Path | Access |
|---|---|---|
| GET | `/lms/lectures?courseId=...` | Auth |
| GET | `/lms/progress/lecture/:lectureId` | Auth |
| GET | `/lms/progress/my` | Auth |
| POST | `/lms/progress/lecture/:lectureId` | Auth |
| GET | `/lms/quizzes/:quizId` | Auth |
| POST | `/lms/quizzes/:quizId/submit` | Auth |
| GET | `/lms/results/my` | Auth |
| GET | `/lms/certificates/my` | Auth |
| GET | `/lms/assignments` | Auth |
| POST | `/lms/assignments/:assignmentId/submit` | Auth |
| POST | `/lms/uploads/assignment` | Auth |
| GET | `/lms/attendance/my` | Auth |
| GET | `/lms/live-classes/my` | Auth |

Notes on LMS logic:
- Quiz submit scores answers server-side and stores/upserts attempts.
- Assignment list returns assignment plus current user's submission metadata (if present).
- Assignment submit upserts per `(assignmentId, userId)` and supports optional text/file URL payload.

### Payments

| Method | Path | Access |
|---|---|---|
| POST | `/payments/create` | Auth |
| POST | `/payments/verify` | Auth |
| GET | `/payments/my` | Auth |
| POST | `/payments/webhook` | Public (Razorpay server-to-server with signature validation) |

### Admin

| Method | Path | Access |
|---|---|---|
| POST | `/admin/uploads` | Admin |
| POST | `/admin/courses` | Admin |
| PUT | `/admin/courses/:courseId` | Admin |
| DELETE | `/admin/courses/:courseId` | Admin |
| POST | `/admin/courses/:courseId/lectures` | Admin |
| POST | `/admin/courses/:courseId/quizzes` | Admin |
| POST | `/admin/courses/:courseId/assignments` | Admin |
| POST | `/admin/courses/:courseId/attendance-sessions` | Admin |
| POST | `/admin/attendance-sessions/:sessionId/mark` | Admin |
| POST | `/admin/announcements` | Admin |
| GET | `/admin/announcements` | Admin |
| GET | `/admin/courses/:courseId/attendance-sessions` | Admin |
| GET | `/admin/attendance-sessions/:sessionId/marking-data` | Admin |
| GET | `/admin/students?courseId=...` | Admin |

---

## Deployment Checklist (Pre-Go-Live)

### 1) Infrastructure and runtime
- [ ] Provision production PostgreSQL (managed DB preferred).
- [ ] Set up production backend and frontend hosting with HTTPS and domain.
- [ ] Configure process manager/container orchestration for zero-downtime restarts.

### 2) Environment and secrets
- [ ] Move all secrets to a secure secret manager (do not rely on committed/local `.env`).
- [ ] Set strong production values for JWT and DB credentials.
- [ ] Set production `CORS_ORIGIN`, `FRONTEND_URL`, and `BACKEND_URL` correctly.
- [ ] Configure Razorpay production keys and webhook secret.
- [ ] Configure SMTP/Twilio production credentials if OTP/email is required.

### 3) Database and migrations
- [ ] Run `npm run prisma:generate`.
- [ ] Apply production migrations with `npm run prisma:deploy`.
- [ ] Seed required admin/account/course baseline data (if needed).
- [ ] Verify startup logs show DB connected and required tables exist.

### 4) Storage and file handling
- [ ] Replace local `uploads/` with object storage (S3/Cloudinary/GCS).
- [ ] Use signed URLs/private buckets as needed.
- [ ] Add stricter file validation/scanning policy before serving user uploads.

### 5) Authentication and session security
- [ ] Migrate from localStorage access-token usage to HttpOnly-cookie/BFF-style session handling.
- [ ] Add CSRF protection strategy for cookie-based auth flows.
- [ ] Confirm secure cookie settings in production (`secure`, `sameSite`, path/domain).

### 6) API security and reliability
- [ ] Replace in-memory rate limiter with distributed store (e.g., Redis).
- [ ] Add stricter auth/OTP/login throttling rules.
- [ ] Standardize error response schema across all endpoints.
- [ ] Add structured logging (request IDs, correlation IDs, JSON logs).

### 7) Payments readiness
- [ ] Disable dev dummy payment fallback behavior in production path.
- [ ] Validate `create -> verify -> enroll` and webhook reconciliation with real Razorpay test/prod runs.
- [ ] Add operational playbook for payment failures/refunds/disputes.

### 8) Frontend production readiness
- [ ] Ensure all critical screens have loading, error, and empty states with retry CTAs.
- [ ] Validate route guards for auth/admin pages.
- [ ] Run production build checks and smoke tests for core user journeys.

### 9) QA / release checks
- [ ] End-to-end test: register/login/OTP/profile.
- [ ] End-to-end test: browse courses, paid/free enrollment, LMS access.
- [ ] End-to-end test: admin course/content creation and student visibility.
- [ ] End-to-end test: payment success/fail + webhook behavior.
- [ ] Verify logs/monitoring/alerts are visible in production.

---

## Notes
- The frontend uses Next.js API rewrites to avoid CORS issues in local development.
- If Next.js dev cache gets corrupted (`Cannot find module './xxx.js'` / missing CSS chunks), run:

```bash
cd frontend
npm run dev:clean
```

