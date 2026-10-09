import { isDeepStrictEqual } from "node:util";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { eq } from "drizzle-orm";
import { db } from "../src/db";
import { gearDaily, gearPuzzles, puzzles } from "../src/db/schema";
import { load } from "../src/puzzles/gears/load";
import { loadSolution } from "../src/puzzles/gears/load-solution";
import { verifyStored } from "../src/puzzles/gears/verify-stored";
import { type Provenance, regenerate } from "../src/puzzles/generators";
import type { PuzzleRegistry } from "../src/puzzles/registry";
import {
  type ContentFailure,
  loadContentFiles,
  resolveCliOptions,
} from "./content-files";

const MANUAL_REVIEW: Readonly<Record<string, string>> = {
  "reverse-chess":
    "manual legality review required (reachability from the start position is not computed)",
};

/** A generated file must equal what its recorded generator, version, seed and difficulty produce now. */
function verifyRegeneration(
  generated: Provenance,
  difficulty: number,
  content: unknown,
) {
  const { content: regenerated } = regenerate(generated, difficulty);
  if (!isDeepStrictEqual(regenerated, content)) {
    throw new Error(
      `regeneration mismatch: content differs from ${generated.generator} v${generated.version}, seed "${generated.seed}", difficulty ${difficulty}`,
    );
  }
}

/** Parses every content file with its `contentSchema`, then runs the module's `verify` hook. */
export async function verifyPuzzles(
  registry: PuzzleRegistry,
  contentDir: string,
) {
  const { files, failures } = await loadContentFiles(registry, contentDir);
  const all: ContentFailure[] = [...failures];
  const durations = new Map<string, number>();
  for (const {
    typeKey,
    slug,
    file,
    meta,
    reviewNote,
    workings,
    content,
    generated,
  } of files) {
    const started = performance.now();
    try {
      if (generated) verifyRegeneration(generated, meta.difficulty, content);
      registry[typeKey].verify?.(content, { reviewNote, workings });
      durations.set(`${typeKey}/${slug}`, Math.round(performance.now() - started));
    } catch (error) {
      all.push({
        typeKey,
        slug,
        file,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
  return { checked: files.length + failures.length, failures: all, durations };
}

/** Re-solves every generated daily diagram stored in the DB and compares it with its stored solution. */
export async function verifyGeneratedRows() {
  const rows = await db
    .select({
      id: puzzles.id,
      slug: puzzles.slug,
      date: gearDaily.date,
      generatorSeed: gearPuzzles.generatorSeed,
    })
    .from(gearDaily)
    .innerJoin(puzzles, eq(puzzles.id, gearDaily.puzzleId))
    .innerJoin(gearPuzzles, eq(gearPuzzles.puzzleId, gearDaily.puzzleId))
    .orderBy(gearDaily.date);

  const failures: { slug: string; error: string }[] = [];
  for (const { id, slug, date, generatorSeed } of rows) {
    try {
      if (generatorSeed !== date) {
        throw new Error(`generator_seed "${generatorSeed}" differs from the date ${date}`);
      }
      verifyStored(await load(id), await loadSolution(id));
      console.log(`gears/${slug}: unique (re-solved from the database)`);
    } catch (error) {
      failures.push({
        slug,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
  return { checked: rows.length, failures };
}

async function main() {
  const { registry, contentDir } = await resolveCliOptions(process.argv.slice(2));
  const { checked, failures, durations } = await verifyPuzzles(
    registry,
    contentDir,
  );
  for (const failure of failures) {
    console.error(
      `FAIL ${failure.typeKey}/${failure.slug} (${path.relative(process.cwd(), failure.file)}): ${failure.error}`,
    );
  }
  const { files } = await loadContentFiles(registry, contentDir);
  for (const { typeKey, slug } of files) {
    const reminder = MANUAL_REVIEW[typeKey];
    if (reminder) {
      const ms = durations.get(`${typeKey}/${slug}`);
      console.log(`${typeKey}/${slug}: ${reminder}${ms === undefined ? "" : ` (verified in ${ms} ms)`}`);
    }
  }
  console.log(`puzzles:verify: ${checked - failures.length}/${checked} files ok`);

  const generated = await verifyGeneratedRows();
  for (const failure of generated.failures) {
    console.error(`FAIL gears/${failure.slug} (database): ${failure.error}`);
  }
  console.log(
    `puzzles:verify: ${generated.checked - generated.failures.length}/${generated.checked} generated rows unique`,
  );
  process.exitCode = failures.length || generated.failures.length ? 1 : 0;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
