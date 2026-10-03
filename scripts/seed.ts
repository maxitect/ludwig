import path from "node:path";
import { pathToFileURL } from "node:url";
import { and, eq, notInArray, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { DatabaseError, Pool } from "pg";
import * as defaultLookups from "../content/lookups";
import { weekly } from "../content/weekly";
import type { db as appDb } from "../src/db";
import { relations } from "../src/db/relations";
import {
  puzzleCategories,
  puzzleTypes,
  puzzles,
  volumes,
} from "../src/db/schema/core";
import { gearDaily } from "../src/puzzles/gears/tables";
import type { PuzzleRegistry } from "../src/puzzles/registry";
import {
  type ContentFailure,
  type ContentMeta,
  loadContentFiles,
  resolveCliOptions,
} from "./content-files";
import { seedWeekly } from "./seed-weekly";

type Db = typeof appDb;
type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];
type Lookups = typeof defaultLookups;

export type SeedCounts = { inserted: number; updated: number; removed: number };

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
 * Writes one puzzle (supertype, subtype and children) in a single transaction, updating an
 * existing `(type_key, slug)` in place so content row ids stay stable and attempt data is never
 * touched. A content change that removes a row attempt data references fails the whole puzzle.
 * Inside a transaction it runs as a savepoint.
 */
export async function upsertPuzzle(
  db: Db | Tx,
  registry: PuzzleRegistry,
  {
    typeKey,
    meta: { volume, ...columns },
    content,
  }: { typeKey: string; meta: ContentMeta; content: unknown },
) {
  try {
    return await writePuzzle(db, registry, typeKey, volume, columns, content);
  } catch (error) {
    const cause = error instanceof Error && error.cause ? error.cause : error;
    if (isAttemptReferenceViolation(cause)) {
      throw new Error(
        `${typeKey}/${columns.slug}: content change removes a row that attempt data references (${cause.constraint}); restore it or delete the affected attempts deliberately`,
      );
    }
    throw error;
  }
}

function isAttemptReferenceViolation(error: unknown): error is DatabaseError {
  return (
    error instanceof DatabaseError &&
    error.code === "23503" &&
    error.message.startsWith("update or delete on table") &&
    (error.table ?? "").includes("attempt")
  );
}

async function writePuzzle(
  db: Db | Tx,
  registry: PuzzleRegistry,
  typeKey: string,
  volume: ContentMeta["volume"],
  columns: Omit<ContentMeta, "volume">,
  content: unknown,
) {
  return db.transaction(async (tx) => {
    const volumeId = volume
      ? (
          await tx
            .select({ id: volumes.id })
            .from(volumes)
            .where(eq(volumes.slug, volume))
        )[0]?.id
      : null;
    if (volume && !volumeId) throw new Error(`unknown volume "${volume}"`);

    const values = {
      ...columns,
      sourceNote: columns.sourceNote ?? null,
      publishedAt: columns.publishedAt ?? null,
      volumeId,
    };
    const [existing] = await tx
      .select({ id: puzzles.id })
      .from(puzzles)
      .where(and(eq(puzzles.typeKey, typeKey), eq(puzzles.slug, columns.slug)));

    let puzzleId: string;
    if (existing) {
      puzzleId = existing.id;
      await tx.update(puzzles).set(values).where(eq(puzzles.id, puzzleId));
    } else {
      [{ id: puzzleId }] = await tx
        .insert(puzzles)
        .values({ ...values, typeKey })
        .returning({ id: puzzles.id });
    }

    await registry[typeKey].upsertContent(tx, puzzleId, content);
    return { id: puzzleId, inserted: !existing };
  });
}

/**
 * Upserts lookups, then every valid content file (supertype, subtype and children in one
 * transaction per puzzle), then removes puzzles of registered types that no longer have a file.
 * Generated daily diagrams (linked in `gear_daily`) have no file and are never removed.
 */
export async function seed({
  db,
  registry,
  contentDir,
  lookups = defaultLookups,
}: {
  db: Db;
  registry: PuzzleRegistry;
  contentDir: string;
  lookups?: Lookups;
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
  for (const typeKey of Object.keys(registry)) {
    const slugs = discoveredSlugs.get(typeKey) ?? [];
    const removed = await db
      .delete(puzzles)
      .where(
        and(
          eq(puzzles.typeKey, typeKey),
          notInArray(
            puzzles.id,
            db.select({ id: gearDaily.puzzleId }).from(gearDaily),
          ),
          slugs.length ? notInArray(puzzles.slug, slugs) : undefined,
        ),
      )
      .returning({ id: puzzles.id });
    types[typeKey].removed = removed.length;
  }

  return { lookups: lookupSummary, types, failures };
}

async function main() {
  const { registry, contentDir } = await resolveCliOptions(process.argv.slice(2));
  const pool = new Pool({ connectionString: process.env.DATABASE_URL_UNPOOLED });
  try {
    const db = drizzle({ client: pool, relations });
    const summary = await seed({ db, registry, contentDir });
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
    const weeklySummary = await seedWeekly(db, weekly);
    console.log(`weekly: ${weeklySummary.weeks} weeks`);
    for (const failure of weeklySummary.failures) {
      console.error(`FAIL content/weekly.ts: ${failure}`);
    }
    process.exitCode =
      summary.failures.length || weeklySummary.failures.length ? 1 : 0;
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
