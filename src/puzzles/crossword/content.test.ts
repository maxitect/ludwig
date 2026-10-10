import path from "node:path";
import { describe, expect, it } from "vitest";
import { loadContentFiles } from "../../../scripts/content-files";
import { crosswordModule } from "./module";
import { contentSchema } from "./schema";

const { files, failures } = await loadContentFiles(
  { crossword: crosswordModule },
  path.resolve("content"),
);

describe("crossword content", () => {
  it("loads every file", () => {
    expect(failures).toEqual([]);
    expect(files.length).toBeGreaterThan(0);
  });

  it.each(
    files.map((file) => [file.slug, contentSchema.parse(file.content)] as const),
  )(
    "%s is rotationally symmetric by 180 degrees",
    (_slug, { rows, cols, cells }) => {
      const keys = new Set(cells.map(({ row, col }) => `${row},${col}`));
      const rotated = cells.map(
        ({ row, col }) => `${rows - 1 - row},${cols - 1 - col}`,
      );
      expect(rotated.filter((key) => !keys.has(key))).toEqual([]);
    },
  );
});
