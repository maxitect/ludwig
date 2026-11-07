import path from "node:path";
import { describe, expect, it } from "vitest";
import { loadContentFiles } from "../../../scripts/content-files";
import { crosswordModule } from "./module";

const { files, failures } = await loadContentFiles(
  { crossword: crosswordModule },
  path.resolve("content"),
);

describe("crossword content", () => {
  it("loads every file", () => {
    expect(failures).toEqual([]);
    expect(files.length).toBeGreaterThan(0);
  });
});
