import { Pool } from "pg";

const LOCAL_HOSTS = ["localhost", "127.0.0.1"];

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";

/** Database assertions only make sense when the app under test uses the local database. */
export const databaseAvailable =
  Boolean(process.env.DATABASE_URL) &&
  LOCAL_HOSTS.includes(new URL(baseURL).hostname);

export type AttemptRow = { typeKey: string; slug: string; completed: boolean };

export async function attemptsFor(email: string) {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    const { rows } = await pool.query<AttemptRow>(
      `select p.type_key as "typeKey", p.slug, a.completed_at is not null as completed
         from attempts a
         join puzzles p on p.id = a.puzzle_id
         join "user" u on u.id = a.user_id
        where u.email = $1
        order by p.type_key, p.slug`,
      [email],
    );
    return rows;
  } finally {
    await pool.end();
  }
}
