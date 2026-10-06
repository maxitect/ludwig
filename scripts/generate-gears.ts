import { pathToFileURL } from "node:url";
import { parseArgs } from "node:util";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { verifyFullSsl } from "../src/utils/verify-full-ssl";
import { relations } from "../src/db/relations";
import {
  type Difficulty,
  difficulties,
} from "../src/puzzles/gears/presets";
import { generateDailies } from "../src/lib/data/gear-dailies";
import { registry } from "../src/puzzles/registry";

const USAGE =
  "usage: pnpm puzzles:gen-gears --from YYYY-MM-DD --days N [--difficulty-cycle easy,medium,hard,expert]";
const MAX_DAYS = 366;

export class UsageError extends Error {}

const isDate = (value: string) => {
  const parsed = new Date(`${value}T00:00:00Z`);
  return (
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    !Number.isNaN(parsed.getTime()) &&
    parsed.toISOString().slice(0, 10) === value
  );
};

const isDifficulty = (value: string): value is Difficulty =>
  (difficulties as string[]).includes(value);

export function parseOptions(argv: string[]) {
  let values: { from?: string; days?: string; "difficulty-cycle": string };
  try {
    ({ values } = parseArgs({
      args: argv,
      options: {
        from: { type: "string" },
        days: { type: "string" },
        "difficulty-cycle": { type: "string", default: difficulties.join(",") },
      },
    }));
  } catch (error) {
    throw new UsageError(error instanceof Error ? error.message : String(error));
  }

  const { from, days } = values;
  if (!from || !isDate(from)) {
    throw new UsageError("--from must be a valid date, YYYY-MM-DD");
  }
  if (!days || !/^\d+$/.test(days) || Number(days) < 1 || Number(days) > MAX_DAYS) {
    throw new UsageError(`--days must be an integer from 1 to ${MAX_DAYS}`);
  }
  const cycle = values["difficulty-cycle"].split(",");
  if (!cycle.every(isDifficulty)) {
    throw new UsageError(
      `--difficulty-cycle must list only: ${difficulties.join(", ")}`,
    );
  }
  return { from, days: Number(days), cycle };
}

async function main() {
  let options: ReturnType<typeof parseOptions>;
  try {
    options = parseOptions(process.argv.slice(2));
  } catch (error) {
    if (!(error instanceof UsageError)) throw error;
    console.error(`${error.message}\n${USAGE}`);
    process.exit(2);
  }
  const pool = new Pool({
    connectionString: verifyFullSsl(process.env.DATABASE_URL_UNPOOLED!),
  });
  try {
    const db = drizzle({ client: pool, relations });
    const { created, skipped } = await generateDailies(db, registry, options);
    console.log(`puzzles:gen-gears: ${created} created, ${skipped} already present`);
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
