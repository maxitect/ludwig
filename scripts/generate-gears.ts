import { pathToFileURL } from "node:url";
import { parseArgs } from "node:util";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import type { db as appDb } from "../src/db";
import { verifyFullSsl } from "../src/utils/verify-full-ssl";
import { relations } from "../src/db/relations";
import { gearDaily } from "../src/db/schema";
import { generateDiagram } from "../src/puzzles/gears/generate";
import {
  type Difficulty,
  difficulties,
} from "../src/puzzles/gears/presets";
import { type PuzzleRegistry, registry } from "../src/puzzles/registry";
import { londonMidnight } from "../src/utils/london-time";
import { contentMetaSchema } from "./content-files";
import { upsertPuzzle } from "./seed";

type Db = typeof appDb;

const USAGE =
  "usage: pnpm puzzles:gen-gears --from YYYY-MM-DD --days N [--difficulty-cycle easy,medium,hard,expert]";
const MAX_DAYS = 366;
const TYPE_KEY = "gears";

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

function addDays(date: string, days: number) {
  const next = new Date(`${date}T00:00:00Z`);
  next.setUTCDate(next.getUTCDate() + days);
  return next.toISOString().slice(0, 10);
}

/**
 * Generates `daily-<date>` for each of `days` dates from `from`, seeded by the date and cycling
 * through `cycle`. Each puzzle is written by the seed module's per-puzzle transaction, nested in one
 * that also links it in `gear_daily`. A date that already has a `gear_daily` row is skipped, so a
 * published daily never changes.
 */
export async function generateDailies(
  db: Db,
  puzzleRegistry: PuzzleRegistry,
  { from, days, cycle }: ReturnType<typeof parseOptions>,
) {
  const contentSchema = puzzleRegistry[TYPE_KEY].schema.contentSchema;
  const summary = { created: 0, skipped: 0 };

  for (let i = 0; i < days; i++) {
    const date = addDays(from, i);
    const [existing] = await db
      .select({ date: gearDaily.date })
      .from(gearDaily)
      .where(eq(gearDaily.date, date));
    if (existing) {
      summary.skipped += 1;
      continue;
    }

    const difficulty = cycle[i % cycle.length];
    const slug = `daily-${date}`;
    const content = contentSchema.parse(generateDiagram(date, difficulty));
    const meta = contentMetaSchema.parse({
      slug,
      title: `Daily Diagram ${date}`,
      difficulty: difficulties.indexOf(difficulty) + 2,
      publishedAt: londonMidnight(date),
    });
    await db.transaction(async (tx) => {
      const { id } = await upsertPuzzle(tx, puzzleRegistry, {
        typeKey: TYPE_KEY,
        meta,
        content,
      });
      await tx.insert(gearDaily).values({ date, puzzleId: id });
    });
    summary.created += 1;
    console.log(`${slug} ${difficulty}`);
  }
  return summary;
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
