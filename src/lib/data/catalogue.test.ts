import { like } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { db } from "@/db";
import { puzzles } from "@/db/schema";
import { registry } from "@/puzzles/registry";
import { generateDailies } from "./daily-puzzles";
import { getPuzzleStaticParams, getTypeCatalogue } from "./catalogue";

vi.mock("next/cache", () => ({ cacheLife: () => {}, cacheTag: () => {} }));

const pastDailies = "daily-sudoku-2001-%";
const cleanUp = () => db.delete(puzzles).where(like(puzzles.slug, pastDailies));

beforeAll(async () => {
  await cleanUp();
  await generateDailies(db, registry, {
    typeKey: "sudoku",
    from: "2001-01-01",
    days: 15,
  });
}, 60_000);
afterAll(cleanUp);

describe("getTypeCatalogue", () => {
  it("shelves the 14 newest dailies first and keeps every published id", async () => {
    const catalogue = await getTypeCatalogue("sudoku");
    const dailies = catalogue!.puzzles.filter(({ style }) => style === "Daily");
    expect(dailies).toHaveLength(14);
    expect(catalogue!.puzzles.slice(0, 14)).toEqual(dailies);
    expect(dailies.map(({ slug }) => slug)).toEqual(
      dailies.map(({ slug }) => slug).toSorted().reverse(),
    );

    const oldest = await db.query.puzzles.findFirst({
      where: { slug: "daily-sudoku-2001-01-01" },
      columns: { id: true },
    });
    expect(dailies.map(({ id }) => id)).not.toContain(oldest!.id);
    expect(catalogue!.puzzleIds).toContain(oldest!.id);
  });
});

describe("getPuzzleStaticParams", () => {
  it("prerenders at most the 14 newest published dailies per type", async () => {
    const params = await getPuzzleStaticParams();
    const sudokuDailies = params.filter(
      ({ type, slug }) => type === "sudoku" && slug.startsWith("daily-"),
    );
    expect(sudokuDailies.length).toBeLessThanOrEqual(14);
    expect(params.map(({ slug }) => slug)).not.toContain(
      "daily-sudoku-2001-01-01",
    );
  });
});
