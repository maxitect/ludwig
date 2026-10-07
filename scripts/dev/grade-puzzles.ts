import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";
import { gradeContent, gradedTypes } from "../../src/puzzles/generators";
import { loadContentFiles, resolveCliOptions } from "../content-files";

const usage = `usage: pnpm puzzles:grade <type...> [--write]  (types: ${gradedTypes.join(", ")})`;

/** Grades every content file of the given types by technique and compares it with `meta.difficulty`. */
async function main() {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: { write: { type: "boolean", default: false } },
  });
  const types = positionals.filter((type) => gradedTypes.includes(type));
  if (!types.length || types.length !== positionals.length) {
    throw new Error(usage);
  }
  const { registry, contentDir } = await resolveCliOptions([]);
  const { files, failures } = await loadContentFiles(registry, contentDir);
  for (const failure of failures) {
    console.error(`FAIL ${failure.typeKey}/${failure.slug}: ${failure.error}`);
  }

  let mismatched = failures.length;
  for (const { typeKey, slug, file, meta, content } of files) {
    if (!types.includes(typeKey)) continue;
    const grade = gradeContent(typeKey, content);
    const graded = grade?.difficulty ?? 5;
    const note = grade
      ? `needs ${grade.hardest}`
      : "not solved by the grader (trial and error): flagged, kept at 5";
    const changed = graded !== meta.difficulty;
    console.log(
      `${typeKey}/${slug}: hand ${meta.difficulty}, grade ${graded}, ${note}${changed ? " (differs)" : ""}`,
    );
    if (!changed) continue;
    if (values.write) {
      const source = readFileSync(file, "utf8");
      const updated = source.replace(
        /(\n\s*difficulty: )\d+/,
        `$1${graded}`,
      );
      if (updated === source) throw new Error(`no difficulty in ${path.relative(process.cwd(), file)}`);
      writeFileSync(file, updated);
    } else {
      mismatched++;
    }
  }
  process.exitCode = mismatched ? 1 : 0;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
