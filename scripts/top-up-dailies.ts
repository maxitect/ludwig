import { pathToFileURL } from "node:url";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { z } from "zod";
import { verifyFullSsl } from "../src/utils/verify-full-ssl";
import { relations } from "../src/db/relations";
import { dailyTypes } from "../src/config/daily-types";
import { generateDailies } from "../src/lib/data/daily-puzzles";
import { generateDailies as generateGearDailies } from "../src/lib/data/gear-dailies";
import { difficulties } from "../src/puzzles/gears/presets";
import { registry } from "../src/puzzles/registry";
import { addDays, londonDate } from "../src/utils/london-time";

const WINDOW_DAYS = 400;

/** Stops starting dates after this long, so a cold database ends the step cleanly. The next build resumes. */
const DEFAULT_BUDGET_SECONDS = 900;

async function main() {
  const budgetSeconds = z.coerce
    .number()
    .positive()
    .default(DEFAULT_BUDGET_SECONDS)
    .parse(process.env.TOP_UP_BUDGET_SECONDS || undefined);
  const deadline = Date.now() + budgetSeconds * 1000;
  const from = londonDate(new Date());
  const pool = new Pool({
    connectionString: verifyFullSsl(process.env.DATABASE_URL_UNPOOLED!),
  });
  try {
    const db = drizzle({ client: pool, relations });
    const runs = [
      {
        label: "gears",
        run: () =>
          generateGearDailies(db, registry, {
            from,
            days: WINDOW_DAYS,
            cycle: difficulties,
            deadline,
          }),
      },
      ...dailyTypes.map((typeKey) => ({
        label: typeKey,
        run: () =>
          generateDailies(db, registry, {
            typeKey,
            from,
            days: WINDOW_DAYS,
            deadline,
          }),
      })),
    ];
    for (const { label, run } of runs) {
      const started = performance.now();
      const { created, skipped } = await run();
      const pending = WINDOW_DAYS - created - skipped;
      const seconds = ((performance.now() - started) / 1000).toFixed(1);
      console.log(
        `puzzles:top-up-dailies (${label}): ${created} created, ${skipped} already present, ${pending} pending, through ${addDays(from, WINDOW_DAYS - 1)} (${seconds}s)`,
      );
    }
  } finally {
    await pool.end();
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
