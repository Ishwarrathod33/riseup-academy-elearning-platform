import pg from "pg";
import { env } from "../config/env.js";

const { Pool } = pg;

let pool: pg.Pool | null = null;

export function getPgPool(): pg.Pool | null {
  return pool;
}

/**
 * Verifies PostgreSQL connectivity with `pg` and that the Prisma `Course` table exists.
 */
export async function initPostgres(): Promise<void> {
  pool = new Pool({ connectionString: env.DATABASE_URL });
  const client = await pool.connect();
  try {
    await client.query("SELECT 1");
    // eslint-disable-next-line no-console
    console.log("PostgreSQL connected");
  } finally {
    client.release();
  }

  const tableCheck = await pool.query<{ exists: boolean }>(
    `SELECT EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'Course'
    ) AS "exists"`
  );
  if (!tableCheck.rows[0]?.exists) {
    // eslint-disable-next-line no-console
    console.error(
      'PostgreSQL: required table "Course" is missing. Apply migrations: npx prisma migrate deploy'
    );
  }
}
