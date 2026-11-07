import { like } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { db } from "@/db";
import { puzzles } from "@/db/schema";
import { registry } from "@/puzzles/registry";
import { generateDailies } from "./daily-puzzles";
import { generateDailies as generateGearDailies } from "./gear-dailies";
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
  const cleanUpExtra = () =>
    Promise.all(
      ["daily-sudoku-2098-%", "daily-2001-%", "daily-2098-%"].map((slug) =>
        db.delete(puzzles).where(like(puzzles.slug, slug)),
      ),
    );

  beforeAll(async () => {
    await cleanUpExtra();
    await generateDailies(db, registry, {
      typeKey: "sudoku",
      from: "2098-01-01",
      days: 1,
    });
    const cycle = ["easy"] as const;
    await generateGearDailies(db, registry, { from: "2001-01-01", days: 3, cycle });
    await generateGearDailies(db, registry, { from: "2098-01-01", days: 1, cycle });
  }, 60_000);
  afterAll(cleanUpExtra);

  it("prerenders the 14 newest published dailies per type and one gear daily", async () => {
    const slugs = (await getPuzzleStaticParams()).map(({ slug }) => slug);
    const sudokuDailies = slugs.filter((slug) =>
      slug.startsWith("daily-sudoku-"),
    );
    expect(sudokuDailies).toHaveLength(14);
    expect(slugs).not.toContain("daily-sudoku-2001-01-01");
    expect(slugs).not.toContain("daily-sudoku-2098-01-01");

    const gearDailies = slugs.filter((slug) => /^daily-\d{4}-/.test(slug));
    expect(gearDailies).toHaveLength(1);
    expect(gearDailies).not.toContain("daily-2001-01-01");
    expect(gearDailies).not.toContain("daily-2098-01-01");
  });
});
