# User profile (`name` field)

## Migration

From the `backend` folder (PostgreSQL running, `DATABASE_URL` set):

```bash
npx prisma migrate deploy
npx prisma generate
```

Migration file: `prisma/migrations/20260322120000_add_user_name/migration.sql`

## API

- `GET /api/auth/me` — includes `name`, `email`, `phone`, `profileIncomplete`
- `PUT /api/auth/me` — body `{ "name": "Full Name", "email": "optional@email.com" }` (email optional)
- `POST /api/auth/otp/verify` — response includes `profileIncomplete` for redirect to `/complete-profile`
