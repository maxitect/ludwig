import { Pool } from "pg";
import { verifyFullSsl } from "../../src/utils/verify-full-ssl";

const LOCAL_HOSTS = ["localhost", "127.0.0.1"];

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";

/** Database assertions only make sense when the app under test uses the local database. */
export const databaseAvailable =
  Boolean(process.env.DATABASE_URL) &&
  LOCAL_HOSTS.includes(new URL(baseURL).hostname);

export type AttemptRow = { typeKey: string; slug: string; completed: boolean };

export async function sudokuAttemptCounts(email: string) {
  const pool = new Pool({
    connectionString: verifyFullSsl(process.env.DATABASE_URL!),
  });
  try {
    const { rows } = await pool.query<{ cells: number; notes: number }>(
      `select (select count(*) from sudoku_attempt_cells c where c.attempt_id = a.id)::int as cells,
              (select count(*) from sudoku_attempt_notes n where n.attempt_id = a.id)::int as notes
         from attempts a
         join "user" u on u.id = a.user_id
        where u.email = $1 and a.type_key = 'sudoku'`,
      [email],
    );
    return rows[0];
  } finally {
    await pool.end();
  }
}

export async function attemptsFor(email: string) {
  const pool = new Pool({
    connectionString: verifyFullSsl(process.env.DATABASE_URL!),
  });
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

export async function rotaAttemptFor(email: string) {
  const pool = new Pool({
    connectionString: verifyFullSsl(process.env.DATABASE_URL!),
  });
  try {
    const { rows } = await pool.query<{
      completed: boolean;
      steps: number[];
      pairs: string[];
    }>(
      `select a.completed_at is not null as completed,
              coalesce(array_agg(s.step order by s.step) filter (where s.step is not null), '{}') as steps,
              coalesce(array_agg(wa.name || '-' || wb.name order by s.step) filter (where s.step is not null), '{}') as pairs
         from attempts a
         join "user" u on u.id = a.user_id
         join puzzles p on p.id = a.puzzle_id
         left join rota_attempt_swaps s on s.attempt_id = a.id
         left join rota_workers wa on wa.id = s.worker_a_id
         left join rota_workers wb on wb.id = s.worker_b_id
        where u.email = $1 and p.type_key = 'rota'
        group by a.id`,
      [email],
    );
    return rows[0];
  } finally {
    await pool.end();
  }
}
