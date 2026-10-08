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

export async function futoshikiAttemptCounts(email: string) {
  const pool = new Pool({
    connectionString: verifyFullSsl(process.env.DATABASE_URL!),
  });
  try {
    const { rows } = await pool.query<{ cells: number; notes: number }>(
      `select (select count(*) from futoshiki_attempt_cells c where c.attempt_id = a.id)::int as cells,
              (select count(*) from futoshiki_attempt_notes n where n.attempt_id = a.id)::int as notes
         from attempts a
         join "user" u on u.id = a.user_id
        where u.email = $1 and a.type_key = 'futoshiki'`,
      [email],
    );
    return rows[0];
  } finally {
    await pool.end();
  }
}

export async function logicGridMarks(email: string) {
  const pool = new Pool({
    connectionString: verifyFullSsl(process.env.DATABASE_URL!),
  });
  try {
    const { rows } = await pool.query<{ mark: string; count: number }>(
      `select m.mark::text as mark, count(*)::int as count
         from logic_grid_attempt_marks m
         join attempts a on a.id = m.attempt_id
         join "user" u on u.id = a.user_id
        where u.email = $1
        group by m.mark order by m.mark`,
      [email],
    );
    return rows;
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

export async function cipherAttemptFor(
  email: string,
  typeKey: "caesar" | "keyword" | "book-cipher",
) {
  const pool = new Pool({
    connectionString: verifyFullSsl(process.env.DATABASE_URL!),
  });
  try {
    const { rows } = await pool.query<{
      answer: string | null;
      completed: boolean;
    }>(
      `select c.answer, a.completed_at is not null as completed
         from attempts a
         join "user" u on u.id = a.user_id
         join ${typeKey.replace("-", "_")}_attempts c on c.attempt_id = a.id
        where u.email = $1 and a.type_key = $2`,
      [email, typeKey],
    );
    return rows[0];
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

export async function pictogramAttemptFor(email: string) {
  const pool = new Pool({
    connectionString: verifyFullSsl(process.env.DATABASE_URL!),
  });
  try {
    const { rows } = await pool.query<{ guesses: number; completed: boolean }>(
      `select count(g.glyph_id)::int as guesses, a.completed_at is not null as completed
         from attempts a
         join "user" u on u.id = a.user_id
         join pictogram_cipher_attempts c on c.attempt_id = a.id
         left join pictogram_cipher_attempt_guesses g on g.attempt_id = c.attempt_id
        where u.email = $1 and a.type_key = 'pictogram-cipher'
        group by a.id`,
      [email],
    );
    return rows[0];
  } finally {
    await pool.end();
  }
}

export async function gearTrainAttemptFor(email: string) {
  const pool = new Pool({
    connectionString: verifyFullSsl(process.env.DATABASE_URL!),
  });
  try {
    const { rows } = await pool.query<{ completed: boolean; cogs: string[] }>(
      `select a.completed_at is not null as completed,
              coalesce(array_agg(c.row || ',' || c.col || ',' || c.teeth order by c.row, c.col) filter (where c.row is not null), '{}') as cogs
         from attempts a
         join "user" u on u.id = a.user_id
         join puzzles p on p.id = a.puzzle_id
         left join gear_train_attempt_cogs c on c.attempt_id = a.id
        where u.email = $1 and p.type_key = 'gear-train'
        group by a.id`,
      [email],
    );
    return rows[0];
  } finally {
    await pool.end();
  }
}

export async function wordLadderAttemptFor(email: string) {
  const pool = new Pool({
    connectionString: verifyFullSsl(process.env.DATABASE_URL!),
  });
  try {
    const { rows } = await pool.query<{ words: string[]; completed: boolean }>(
      `select coalesce(array_agg(r.word order by r.position) filter (where r.word is not null), '{}') as words,
              a.completed_at is not null as completed
         from attempts a
         join "user" u on u.id = a.user_id
         join word_ladder_attempts w on w.attempt_id = a.id
         left join word_ladder_attempt_rungs r on r.attempt_id = a.id
        where u.email = $1
        group by a.id`,
      [email],
    );
    return rows[0];
  } finally {
    await pool.end();
  }
}

export async function wordSearchAttemptFor(email: string) {
  const pool = new Pool({
    connectionString: verifyFullSsl(process.env.DATABASE_URL!),
  });
  try {
    const { rows } = await pool.query<{ words: string[]; completed: boolean }>(
      `select coalesce(array_agg(f.word order by f.word) filter (where f.word is not null), '{}') as words,
              a.completed_at is not null as completed
         from attempts a
         join "user" u on u.id = a.user_id
         join word_search_attempts w on w.attempt_id = a.id
         left join word_search_attempt_found f on f.attempt_id = a.id
        where u.email = $1
        group by a.id`,
      [email],
    );
    return rows[0];
  } finally {
    await pool.end();
  }
}
