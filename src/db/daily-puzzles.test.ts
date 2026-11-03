import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { eq, inArray } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { db } from "@/db";
import {
  dailyPuzzles,
  futoshikiPuzzles,
  puzzles,
  sudokuPuzzles,
} from "@/db/schema";
import { registry } from "@/puzzles/registry";
import { seed } from "../../scripts/seed";

const SLUGS = ["daily-test-a", "daily-test-b"];

let sudokuId: string;
let otherSudokuId: string;
let futoshikiId: string;

const cleanUp = () => db.delete(puzzles).where(inArray(puzzles.slug, SLUGS));

async function pgErrorCode(fn: () => Promise<unknown>) {
  try {
    await fn();
    return undefined;
  } catch (error) {
    return (error as { cause?: { code?: string } }).cause?.code;
  }
}

const insertPuzzle = async (typeKey: string, slug: string) => {
  return db.transaction(async (tx) => {
    const [{ id }] = await tx
      .insert(puzzles)
      .values({ typeKey, slug, title: slug, difficulty: 1 })
      .returning({ id: puzzles.id });
    if (typeKey === "sudoku") {
      await tx.insert(sudokuPuzzles).values({ puzzleId: id });
    } else {
      await tx.insert(futoshikiPuzzles).values({ puzzleId: id, size: 4 });
    }
    return id;
  });
};

const contentDir = mkdtempSync(path.join(tmpdir(), "ludwig-empty-content-"));

beforeAll(async () => {
  await seed({ db, registry, contentDir });
  await cleanUp();
  sudokuId = await insertPuzzle("sudoku", SLUGS[0]);
  otherSudokuId = await insertPuzzle("sudoku", SLUGS[1]);
  futoshikiId = await insertPuzzle("futoshiki", SLUGS[0]);
});

afterAll(async () => {
  await cleanUp();
  rmSync(contentDir, { recursive: true, force: true });
});

describe("daily_puzzles", () => {
  it("accepts a puzzle of the row's type and rejects a duplicate (type, date)", async () => {
    const row = {
      typeKey: "sudoku",
      date: "2099-01-01",
      puzzleId: sudokuId,
      generatorVersion: 1,
    };
    await db.insert(dailyPuzzles).values(row);
    expect(
      await pgErrorCode(() =>
        db.insert(dailyPuzzles).values({ ...row, puzzleId: otherSudokuId }),
      ),
    ).toBe("23505");
  });

  it("rejects a puzzle of another type", async () => {
    expect(
      await pgErrorCode(() =>
        db.insert(dailyPuzzles).values({
          typeKey: "sudoku",
          date: "2099-01-02",
          puzzleId: futoshikiId,
          generatorVersion: 1,
        }),
      ),
    ).toBe("23503");
  });

  it("rejects a puzzle that is already some date's daily", async () => {
    expect(
      await pgErrorCode(() =>
        db.insert(dailyPuzzles).values({
          typeKey: "sudoku",
          date: "2099-01-03",
          puzzleId: sudokuId,
          generatorVersion: 1,
        }),
      ),
    ).toBe("23505");
  });

  it("rejects a generator version below 1", async () => {
    expect(
      await pgErrorCode(() =>
        db.insert(dailyPuzzles).values({
          typeKey: "futoshiki",
          date: "2099-01-04",
          puzzleId: futoshikiId,
          generatorVersion: 0,
        }),
      ),
    ).toBe("23514");
  });

  it("is removed with its puzzle", async () => {
    await db.delete(puzzles).where(eq(puzzles.id, sudokuId));
    expect(
      await db
        .select()
        .from(dailyPuzzles)
        .where(eq(dailyPuzzles.puzzleId, sudokuId)),
    ).toEqual([]);
  });
});
