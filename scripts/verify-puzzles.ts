import path from "node:path";
import { pathToFileURL } from "node:url";
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

/** Parses every content file with its `contentSchema`, then runs the module's `verify` hook. */
export async function verifyPuzzles(
  registry: PuzzleRegistry,
  contentDir: string,
) {
  const { files, failures } = await loadContentFiles(registry, contentDir);
  const all: ContentFailure[] = [...failures];
  for (const { typeKey, slug, file, content } of files) {
    try {
      registry[typeKey].verify?.(content);
    } catch (error) {
      all.push({
        typeKey,
        slug,
        file,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
  return { checked: files.length + failures.length, failures: all };
}

async function main() {
  const { registry, contentDir } = await resolveCliOptions(process.argv.slice(2));
  const { checked, failures } = await verifyPuzzles(registry, contentDir);
  for (const failure of failures) {
    console.error(
      `FAIL ${failure.typeKey}/${failure.slug} (${path.relative(process.cwd(), failure.file)}): ${failure.error}`,
    );
  }
  const { files } = await loadContentFiles(registry, contentDir);
  for (const { typeKey, slug } of files) {
    const reminder = MANUAL_REVIEW[typeKey];
    if (reminder) console.log(`${typeKey}/${slug}: ${reminder}`);
  }
  console.log(`puzzles:verify: ${checked - failures.length}/${checked} files ok`);
  process.exitCode = failures.length ? 1 : 0;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
