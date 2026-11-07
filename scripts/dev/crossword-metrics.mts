import path from "node:path";
import { crosswordModule } from "../../src/puzzles/crossword/module";
import { measureGrid } from "../../src/puzzles/crossword/standards";
import { loadContentFiles } from "../content-files";

/** Prints each crossword's style, size, entries, checked letters and black cells, and whether it passes the verifier. */
const { files } = await loadContentFiles(
  { crossword: crosswordModule },
  path.resolve("content"),
);
for (const { slug, content } of files) {
  const grid = crosswordModule.schema.contentSchema.parse(content);
  const { entries, checkedRatio, blackRatio } = measureGrid(grid);
  let verdict = "ok";
  try {
    crosswordModule.verify?.(grid);
  } catch (error) {
    verdict = error instanceof Error ? error.message : String(error);
  }
  console.log(
    [
      slug.padEnd(14),
      grid.style.padEnd(7),
      `${grid.rows}x${grid.cols}`,
      `${entries} entries`,
      `${Math.round(checkedRatio * 100)}% checked`,
      `${Math.round(blackRatio * 100)}% black`,
      verdict,
    ].join("  "),
  );
}
