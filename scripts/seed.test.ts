import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { eq, sql } from "drizzle-orm";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { db } from "@/db";
import { puzzleCategories, puzzleTypes, puzzles, volumes } from "@/db/schema";
import { registry } from "@/puzzles/__fixture/registry";
import { fixtureItems, fixturePuzzles } from "@/puzzles/__fixture/tables";
import { seed } from "./seed";
import { verifyPuzzles } from "./verify-puzzles";

const lookups = {
  categories: [{ key: "__fixture", name: "Fixture", sort: 99 }],
  types: [
    {
      key: "__fixture",
      categoryKey: "__fixture",
      name: "Fixture",
      description: "Test-only type",
      subtypeTable: "fixture_puzzles",
      sort: 99,
    },
  ],
  volumes: [
    {
      slug: "__fixture-volume",
      title: "Fixture volume",
      cover: "blue" as const,
      sort: 99,
    },
  ],
};

const contentFile = (slug: string, items: { position: number; label: string }[]) =>
  `export const meta = { slug: "${slug}", title: "Fixture ${slug}", difficulty: 2, volume: "__fixture-volume" };
export const content = { note: "note-${slug}", items: ${JSON.stringify(items)} };
`;

const items = [
  { position: 0, label: "alpha" },
  { position: 1, label: "beta" },
];

async function cleanUp() {
  await db.delete(puzzles).where(eq(puzzles.typeKey, "__fixture"));
  await db.delete(puzzleTypes).where(eq(puzzleTypes.key, "__fixture"));
  await db.delete(puzzleCategories).where(eq(puzzleCategories.key, "__fixture"));
  await db.delete(volumes).where(eq(volumes.slug, "__fixture-volume"));
}

let contentDir: string;
const write = (slug: string, body: string) =>
  writeFileSync(path.join(contentDir, "__fixture", `${slug}.ts`), body);
const run = () => seed({ db, registry, contentDir, lookups });
const countPuzzles = async (slug?: string) =>
  (
    await db
      .select({ n: sql<number>`count(*)::int` })
      .from(puzzles)
      .where(
        slug
          ? sql`${puzzles.typeKey} = '__fixture' and ${puzzles.slug} = ${slug}`
          : eq(puzzles.typeKey, "__fixture"),
      )
  )[0].n;

beforeAll(cleanUp);
afterAll(cleanUp);
const dirs: string[] = [];
/** Node caches imports by path, so rewriting a file between seeds needs a new directory. */
function freshDir() {
  contentDir = mkdtempSync(path.join(tmpdir(), "ludwig-content-"));
  mkdirSync(path.join(contentDir, "__fixture"));
  dirs.push(contentDir);
}
beforeEach(async () => {
  await cleanUp();
  freshDir();
});
afterAll(() => {
  for (const dir of dirs) rmSync(dir, { recursive: true, force: true });
});

describe("seed", () => {
  it("inserts, then re-seeds idempotently", async () => {
    write("a", contentFile("a", items));
    write("b", contentFile("b", items));

    const first = await run();
    expect(first.failures).toEqual([]);
    expect(first.types.__fixture).toEqual({ inserted: 2, updated: 0, removed: 0 });
    expect(first.lookups.types.inserted).toBe(1);

    const second = await run();
    expect(second.types.__fixture).toEqual({ inserted: 0, updated: 2, removed: 0 });
    expect(second.lookups.types.inserted).toBe(0);
    expect(await countPuzzles()).toBe(2);
  });

  it("replaces child rows instead of merging them", async () => {
    write("a", contentFile("a", items));
    await run();
    freshDir();
    write("a", contentFile("a", [{ position: 0, label: "gamma" }]));
    await run();

    const rows = await db.select().from(fixtureItems);
    const [puzzle] = await db.select().from(puzzles).where(eq(puzzles.slug, "a"));
    expect(rows.filter((row) => row.puzzleId === puzzle.id)).toEqual([
      { puzzleId: puzzle.id, position: 0, label: "gamma" },
    ]);
  });

  it("writes each puzzle atomically", async () => {
    write("good-1", contentFile("good-1", items));
    write(
      "bad",
      contentFile("bad", [
        { position: 0, label: "alpha" },
        { position: 0, label: "duplicate-key" },
      ]),
    );
    write("good-2", contentFile("good-2", items));

    const summary = await run();

    expect(summary.failures.map((failure) => failure.slug)).toEqual(["bad"]);
    expect(await countPuzzles("bad")).toBe(0);
    expect(await countPuzzles("good-1")).toBe(1);
    expect(await countPuzzles("good-2")).toBe(1);
  });

  it("removes puzzles whose file is gone and cascades to the subtype", async () => {
    write("a", contentFile("a", items));
    write("b", contentFile("b", items));
    await run();
    const [removedPuzzle] = await db.select().from(puzzles).where(eq(puzzles.slug, "b"));

    rmSync(path.join(contentDir, "__fixture", "b.ts"));
    const summary = await run();

    expect(summary.types.__fixture.removed).toBe(1);
    expect(await countPuzzles()).toBe(1);
    expect(
      await db.select().from(fixturePuzzles).where(eq(fixturePuzzles.puzzleId, removedPuzzle.id)),
    ).toEqual([]);
    expect(
      await db.select().from(fixtureItems).where(eq(fixtureItems.puzzleId, removedPuzzle.id)),
    ).toEqual([]);
  });

  it("keeps the existing puzzle when its file turns invalid", async () => {
    write("a", contentFile("a", items));
    await run();
    freshDir();
    write("a", "export const meta = {}; export const content = {};");

    const summary = await run();

    expect(summary.failures).toHaveLength(1);
    expect(await countPuzzles("a")).toBe(1);
  });

  it("leaves types outside the registry alone", async () => {
    write("a", contentFile("a", items));
    await run();
    const summary = await seed({ db, registry: {}, contentDir, lookups });

    expect(summary.types).toEqual({});
    expect(await countPuzzles()).toBe(1);
  });
});

describe("verifyPuzzles", () => {
  it("passes on valid content", async () => {
    write("a", contentFile("a", items));
    expect(await verifyPuzzles(registry, contentDir)).toEqual({
      checked: 1,
      failures: [],
    });
  });

  it("names the file and failing path of content that does not parse", async () => {
    write("broken", contentFile("broken", items).replace('"alpha"', "42"));

    const { failures } = await verifyPuzzles(registry, contentDir);

    expect(failures).toHaveLength(1);
    expect(failures[0].file).toContain("broken.ts");
    expect(failures[0].error).toContain("content.items.0.label");
  });

  it("reports a failing verify hook", async () => {
    write("dup", contentFile("dup", [
      { position: 0, label: "same" },
      { position: 1, label: "same" },
    ]));

    const { failures } = await verifyPuzzles(registry, contentDir);

    expect(failures[0].error).toContain("not unique");
  });

  it("is a no-op success with an empty registry", async () => {
    expect(await verifyPuzzles({}, contentDir)).toEqual({ checked: 0, failures: [] });
  });
});
