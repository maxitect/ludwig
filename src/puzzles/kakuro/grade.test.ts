import { readdirSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { content as carbonCopy } from "../../../content/kakuro/carbon-copy";
import { deriveClues } from "./derive";
import { countSolutions } from "./engine";
import { ambiguous, content as small } from "./fixture";
import { gradeKakuro, solveKakuro } from "./grade";
import type { Content } from "./schema";

const contentDir = path.resolve(import.meta.dirname, "../../../content/kakuro");
const contents = await Promise.all(
  readdirSync(contentDir).map(
    async (file) =>
      (await import(path.join(contentDir, file))) as { content: Content },
  ),
);

describe("gradeKakuro", () => {
  it("grades a puzzle that the combination table and naked singles finish as 1", () => {
    expect(
      countSolutions({ cells: small.cells, clues: deriveClues(small.cells) }),
    ).toBe(1);
    expect(gradeKakuro(small)).toMatchObject({
      difficulty: 1,
      hardest: "naked single",
    });
  });

  it("grades a puzzle that needs a run checked combination by combination as 5, and null below it", () => {
    const grade = gradeKakuro(carbonCopy);
    expect(grade?.difficulty).toBe(5);
    expect(grade?.uses["run consistency"]).toBeGreaterThan(0);
    expect(gradeKakuro(carbonCopy, 4)).toBeNull();
  });

  it("fills exactly the digits of the unique solution", () => {
    for (const { cells } of [
      small,
      ...contents.map(({ content }) => content),
    ]) {
      const solved = solveKakuro({ cells, clues: deriveClues(cells) });
      expect(solved.grade).not.toBeNull();
      expect(solved.digits).toEqual(cells.map(({ digit }) => digit));
    }
  });

  it("returns null for a puzzle with several solutions, which needs a guess", () => {
    expect(
      countSolutions({ cells: ambiguous, clues: deriveClues(ambiguous) }),
    ).toBe(2);
    expect(gradeKakuro({ cells: ambiguous })).toBeNull();
  });
});
