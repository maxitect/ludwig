import path from "node:path";
import { createInterface } from "node:readline/promises";
import { pathToFileURL } from "node:url";
import { and, count, eq, inArray, notExists, notInArray, or, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as defaultLookups from "../content/lookups";
import { weekly } from "../content/weekly";
import type { db as appDb } from "../src/db";
import { verifyFullSsl } from "../src/utils/verify-full-ssl";
import { relations } from "../src/db/relations";
import { attempts } from "../src/db/schema/progress";
import {
  puzzleCategories,
  puzzleTypes,
  puzzles,
  volumes,
} from "../src/db/schema/core";
import { upsertPuzzle } from "../src/lib/data/puzzle-upsert";
import { gearDaily } from "../src/puzzles/gears/tables";
import type { PuzzleRegistry } from "../src/puzzles/registry";
import {
  type ContentFailure,
  loadContentFiles,
  resolveCliOptions,
} from "./content-files";
import { seedWeekly } from "./seed-weekly";

type Db = typeof appDb;
type Lookups = typeof defaultLookups;

export type SeedCounts = { inserted: number; updated: number; removed: number };

export type PendingRemoval = { typeKey: string; slug: string; attempts: number };
export type ConfirmRemoval = (pending: PendingRemoval[]) => boolean | Promise<boolean>;

const insertedFlag = sql<boolean>`(xmax = 0)`;

function tally(rows: { inserted: boolean }[]) {
  const inserted = rows.filter((row) => row.inserted).length;
  return { inserted, updated: rows.length - inserted, removed: 0 };
}

async function seedLookups(db: Db, lookups: Lookups) {
  const categories = await db
    .insert(puzzleCategories)
    .values(lookups.categories)
    .onConflictDoUpdate({
      target: puzzleCategories.key,
      set: { name: sql`excluded.name`, sort: sql`excluded.sort` },
    })
    .returning({ inserted: insertedFlag });

  const types = await db
    .insert(puzzleTypes)
    .values(lookups.types)
    .onConflictDoUpdate({
      target: puzzleTypes.key,
      set: {
        categoryKey: sql`excluded.category_key`,
        name: sql`excluded.name`,
        description: sql`excluded.description`,
        subtypeTable: sql`excluded.subtype_table`,
        sort: sql`excluded.sort`,
      },
    })
    .returning({ inserted: insertedFlag });

  const volumeRows = await db
    .insert(volumes)
    .values(lookups.volumes)
    .onConflictDoUpdate({
      target: volumes.slug,
      set: {
        title: sql`excluded.title`,
        cover: sql`excluded.cover`,
        sort: sql`excluded.sort`,
      },
    })
    .returning({ inserted: insertedFlag });

  return {
    categories: tally(categories),
    types: tally(types),
    volumes: tally(volumeRows),
  };
}

/**
 * Upserts lookups, then every valid content file (supertype, subtype and children in one
 * transaction per puzzle), then removes puzzles of registered types that no longer have a file,
 * asking `confirmRemoval` first when any of them have attempts.
 * Generated daily diagrams (linked in `gear_daily`) have no file and are never removed.
 */
export async function seed({
  db,
  registry,
  contentDir,
  lookups = defaultLookups,
  confirmRemoval = () => false,
}: {
  db: Db;
  registry: PuzzleRegistry;
  contentDir: string;
  lookups?: Lookups;
  confirmRemoval?: ConfirmRemoval;
}) {
  const lookupSummary = await seedLookups(db, lookups);
  const { files, failures: parseFailures } = await loadContentFiles(
    registry,
    contentDir,
  );
  const failures: ContentFailure[] = [...parseFailures];
  const types: Record<string, SeedCounts> = Object.fromEntries(
    Object.keys(registry).map((key) => [
      key,
      { inserted: 0, updated: 0, removed: 0 },
    ]),
  );

  for (const { typeKey, slug, file, meta, content } of files) {
    try {
      const { inserted } = await upsertPuzzle(db, registry, {
        typeKey,
        meta,
        content,
      });
      types[typeKey][inserted ? "inserted" : "updated"] += 1;
    } catch (error) {
      const cause = (error as { cause?: Error }).cause ?? error;
      failures.push({
        typeKey,
        slug,
        file,
        error: cause instanceof Error ? cause.message : String(cause),
      });
    }
  }

  const discoveredSlugs = new Map<string, string[]>();
  for (const { typeKey, slug } of [...files, ...parseFailures]) {
    discoveredSlugs.set(typeKey, [...(discoveredSlugs.get(typeKey) ?? []), slug]);
  }
  const gone = await db
    .select({
      id: puzzles.id,
      typeKey: puzzles.typeKey,
      slug: puzzles.slug,
      attempts: count(attempts.id),
    })
    .from(puzzles)
    .leftJoin(attempts, eq(attempts.puzzleId, puzzles.id))
    .where(
      and(
        inArray(puzzles.typeKey, Object.keys(registry)),
        notInArray(
          puzzles.id,
          db.select({ id: gearDaily.puzzleId }).from(gearDaily),
        ),
        or(
          ...Object.keys(registry).map((typeKey) => {
            const slugs = discoveredSlugs.get(typeKey) ?? [];
            return and(
              eq(puzzles.typeKey, typeKey),
              slugs.length ? notInArray(puzzles.slug, slugs) : undefined,
            );
          }),
        ),
      ),
    )
    .groupBy(puzzles.id);

  const goneWithAttempts = gone.filter((puzzle) => puzzle.attempts > 0);
  const pending = goneWithAttempts.map(({ typeKey, slug, attempts }) => ({
    typeKey,
    slug,
    attempts,
  }));
  const blockedRemovals =
    pending.length && !(await confirmRemoval(pending)) ? pending : [];

  if (!blockedRemovals.length && gone.length) {
    const removed = await db
      .delete(puzzles)
      .where(
        and(
          inArray(
            puzzles.id,
            gone.map((puzzle) => puzzle.id),
          ),
          or(
            inArray(
              puzzles.id,
              goneWithAttempts.map((puzzle) => puzzle.id),
            ),
            notExists(
              db.select().from(attempts).where(eq(attempts.puzzleId, puzzles.id)),
            ),
          ),
        ),
      )
      .returning({ typeKey: puzzles.typeKey });
    for (const { typeKey } of removed) types[typeKey].removed += 1;
  }

  return { lookups: lookupSummary, types, failures, blockedRemovals };
}

const describePending = (pending: PendingRemoval[]) =>
  pending
    .map(({ typeKey, slug, attempts }) => `  ${typeKey}/${slug}: ${attempts} attempts`)
    .join("\n");

/**
 * Removal with attempts is confirmed by `SEED_CONFIRM_REMOVE` (comma-separated `<type>/<slug>` or
 * `all`) covering every pending puzzle, else by a y/N prompt when interactive, else refused.
 */
export function createConfirmRemoval({
  confirmList = process.env.SEED_CONFIRM_REMOVE,
  interactive = Boolean(process.stdin.isTTY),
  ask = async (question: string) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    try {
      return await rl.question(question);
    } finally {
      rl.close();
    }
  },
}: {
  confirmList?: string;
  interactive?: boolean;
  ask?: (question: string) => Promise<string>;
} = {}): ConfirmRemoval {
  const confirmed = new Set(
    (confirmList ?? "").split(",").map((entry) => entry.trim()),
  );
  return async (pending) => {
    if (
      confirmed.has("all") ||
      pending.every(({ typeKey, slug }) => confirmed.has(`${typeKey}/${slug}`))
    ) {
      return true;
    }
    if (!interactive) return false;
    const answer = await ask(
      `These puzzles have no content file and their attempts will be deleted:\n${describePending(pending)}\nRemove them? (y/N) `,
    );
    return ["y", "yes"].includes(answer.trim().toLowerCase());
  };
}

async function main() {
  const { registry, contentDir } = await resolveCliOptions(process.argv.slice(2));
  const pool = new Pool({
    connectionString: verifyFullSsl(process.env.DATABASE_URL_UNPOOLED!),
  });
  try {
    const db = drizzle({ client: pool, relations });
    const summary = await seed({
      db,
      registry,
      contentDir,
      confirmRemoval: createConfirmRemoval(),
    });
    for (const [name, counts] of Object.entries(summary.lookups)) {
      console.log(`lookups ${name}: ${counts.inserted} inserted, ${counts.updated} updated`);
    }
    for (const [typeKey, counts] of Object.entries(summary.types)) {
      console.log(
        `${typeKey}: ${counts.inserted} inserted, ${counts.updated} updated, ${counts.removed} removed`,
      );
    }
    for (const failure of summary.failures) {
      console.error(
        `FAIL ${path.relative(process.cwd(), failure.file)}: ${failure.error}`,
      );
    }
    if (summary.blockedRemovals.length) {
      console.error(
        `FAIL removal not confirmed, nothing removed. Puzzles with no content file have attempts:\n${describePending(summary.blockedRemovals)}\nSet SEED_CONFIRM_REMOVE to a comma-separated list of <type>/<slug>, or all, to confirm.`,
      );
    }
    const weeklySummary = await seedWeekly(db, weekly);
    console.log(`weekly: ${weeklySummary.weeks} weeks`);
    for (const failure of weeklySummary.failures) {
      console.error(`FAIL content/weekly.ts: ${failure}`);
    }
    process.exitCode =
      summary.failures.length ||
      summary.blockedRemovals.length ||
      weeklySummary.failures.length
        ? 1
        : 0;
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
