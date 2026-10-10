import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { and, eq, like, sql } from "drizzle-orm";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { db } from "@/db";
import { createTestUser, deleteTestUsers } from "@/db/integrity/harness";
import {
  attempts,
  crosswordAttemptCells,
  crosswordCells,
  crosswordClues,
  gearAttemptSwaps,
  gearAttempts,
  gearPuzzleGears,
  puzzleCategories,
  puzzleTypes,
  puzzles,
  reverseChessAttemptPlies,
  rotaAttemptSwaps,
  rotaClues,
  rotaWorkers,
  volumes,
} from "@/db/schema";
import { registry } from "@/puzzles/__fixture/registry";
import { fixtureItems, fixturePuzzles } from "@/puzzles/__fixture/tables";
import type { Content as CrosswordContent } from "@/puzzles/crossword/schema";
import type { Content as GearsContent } from "@/puzzles/gears/schema";
import { registry as realRegistry } from "@/puzzles/registry";
import type { Content as ReverseChessContent } from "@/puzzles/reverse-chess/schema";
import type { Content as RotaContent } from "@/puzzles/rota/schema";
import * as defaultLookups from "../content/lookups";
import { upsertPuzzle } from "@/lib/data/puzzle-upsert";
import { createConfirmRemoval, seed } from "./seed";
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

let nextPosition = 1;
const contentFile = (
  slug: string,
  items: { position: number; label: string }[],
  volumePosition = nextPosition++,
) =>
  `export const meta = { slug: "${slug}", title: "Fixture ${slug}", difficulty: 2, volume: "__fixture-volume", volumePosition: ${volumePosition} };
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

  it("lets two puzzles swap volume positions", async () => {
    write("a", contentFile("a", items, 1));
    write("b", contentFile("b", items, 2));
    await run();
    freshDir();
    write("a", contentFile("a", items, 2));
    write("b", contentFile("b", items, 1));

    const swapped = await run();
    expect(swapped.failures).toEqual([]);
    const rows = await db
      .select({ slug: puzzles.slug, position: puzzles.volumePosition })
      .from(puzzles)
      .where(eq(puzzles.typeKey, "__fixture"))
      .orderBy(puzzles.volumePosition);
    expect(rows).toEqual([
      { slug: "b", position: 1 },
      { slug: "a", position: 2 },
    ]);
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
    expect(summary.blockedRemovals).toEqual([]);
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
      durations: new Map([["__fixture/a", expect.any(Number)]]),
    });
  });

  it("names the file and failing path of content that does not parse", async () => {
    write("broken", contentFile("broken", items).replace('"alpha"', "42"));

    const { failures } = await verifyPuzzles(registry, contentDir);

    expect(failures).toHaveLength(1);
    expect(failures[0].file).toContain("broken.ts");
    expect(failures[0].error).toContain("content.items.0.label");
  });

  it("requires a volume position when the file names a volume", async () => {
    write("np", contentFile("np", items).replace(/volumePosition: \d+/, "volumePosition: null"));

    const { failures } = await verifyPuzzles(registry, contentDir);

    expect(failures[0].error).toContain("volumePosition is required");
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
    expect(await verifyPuzzles({}, contentDir)).toEqual({
      checked: 0,
      failures: [],
      durations: new Map(),
    });
  });
});

describe("in-place content updates", () => {
  const slugPrefix = "t072-";
  const testCategory = "t072";
  const typeKeys = ["gears", "rota", "reverse-chess", "crossword"];

  const gears = (overrides: Partial<GearsContent["gears"][number]>[] = []) =>
    [
      { label: "a", teeth: 12, startSlot: 0, initialOffset: 0, halfWidthDeg: 45, isDriver: true },
      { label: "b", teeth: 12, startSlot: 1, initialOffset: 0, halfWidthDeg: 45, isDriver: false },
      { label: "c", teeth: 12, startSlot: 2, initialOffset: 0, halfWidthDeg: 45, isDriver: false },
    ].map((gear, index) => ({ ...gear, ...overrides[index] }));
  const gearsContent = (
    gearRows = gears(),
    swaps: GearsContent["solution"]["swaps"] = [{ a: "a", b: "b" }],
  ): GearsContent => ({
    slotCount: 8,
    mIn: 3,
    mOut: 1,
    maxAdjustments: 2,
    occlusion: false,
    gears: gearRows,
    meshes: [
      { a: "a", b: "b" },
      { a: "b", b: "c" },
    ],
    solution: { crank: 4, convergence: 2, killerLabel: "a", swaps },
  });

  const rotaContent = (
    clueText = "Only neighbours swap",
    workerNames = ["Marty", "Gary", "Sue"],
  ): RotaContent => ({
    workers: workerNames.map((name, index) => ({
      name,
      intended: { file: "a", rank: index + 1 },
      final: { file: "a", rank: ((index + 1) % workerNames.length) + 1 },
    })),
    clues: [
      { displayText: clueText, kind: "adjacent_only" },
      { displayText: "One swap at most", kind: "max_swaps", maxSwaps: 2 },
    ],
    solution: { instigatorName: "Marty", swaps: [{ a: "Marty", b: "Gary" }] },
  });

  const reverseChessContent = (): ReverseChessContent => ({
    mode: "last_move",
    sideToMove: "black",
    whiteKingside: false,
    whiteQueenside: false,
    blackKingside: false,
    blackQueenside: false,
    halfmove: 0,
    fullmove: 1,
    pieces: [
      { file: "b", rank: 7, colour: "black", piece: "king" },
      { file: "h", rank: 3, colour: "white", piece: "king" },
    ],
    solutionPlies: [
      { fromFile: "a", fromRank: 5, toFile: "a", toRank: 6, unpromote: false, special: "none" },
    ],
  });

  const crosswordContent = (
    clueText = "First two",
    cells = [
      { row: 0, col: 0, letter: "A" },
      { row: 0, col: 1, letter: "B" },
      { row: 1, col: 0, letter: "C" },
    ],
  ): CrosswordContent => ({
    style: "quick",
    rows: 2,
    cols: 2,
    cells,
    clues: [{ direction: "across", row: 0, col: 0, clueText, segments: [2] }],
  });

  const put = (typeKey: string, content: unknown) =>
    upsertPuzzle(db, realRegistry, {
      typeKey,
      meta: { slug: `${slugPrefix}${typeKey}`, title: "T072", difficulty: 1 },
      content,
    });

  const startAttempt = async (puzzleId: string) => {
    const userId = await createTestUser("t072");
    const [attempt] = await db
      .insert(attempts)
      .values({ userId, puzzleId })
      .returning({ id: attempts.id });
    return attempt.id;
  };

  async function cleanUpTypes() {
    await db.delete(puzzles).where(like(puzzles.slug, `${slugPrefix}%`));
    await db.delete(puzzleTypes).where(eq(puzzleTypes.categoryKey, testCategory));
    await db.delete(puzzleCategories).where(eq(puzzleCategories.key, testCategory));
  }

  beforeAll(async () => {
    await cleanUpTypes();
    await db
      .insert(puzzleCategories)
      .values({ key: testCategory, name: "T072", sort: 98 })
      .onConflictDoNothing();
    await db
      .insert(puzzleTypes)
      .values(
        defaultLookups.types
          .filter((type) => typeKeys.includes(type.key))
          .map((type) => ({ ...type, categoryKey: testCategory })),
      )
      .onConflictDoNothing();
  });
  beforeEach(async () => {
    await db.delete(puzzles).where(like(puzzles.slug, `${slugPrefix}%`));
  });
  afterAll(async () => {
    await cleanUpTypes();
    await deleteTestUsers();
  });

  const gearState = (attemptId: string) =>
    Promise.all([
      db.select().from(gearAttempts).where(eq(gearAttempts.attemptId, attemptId)),
      db.select().from(gearAttemptSwaps).where(eq(gearAttemptSwaps.attemptId, attemptId)),
    ]);
  const rotaState = (attemptId: string) =>
    db.select().from(rotaAttemptSwaps).where(eq(rotaAttemptSwaps.attemptId, attemptId));
  const crosswordState = (attemptId: string) =>
    db
      .select()
      .from(crosswordAttemptCells)
      .where(eq(crosswordAttemptCells.attemptId, attemptId));
  const reverseChessState = (attemptId: string) =>
    db
      .select()
      .from(reverseChessAttemptPlies)
      .where(eq(reverseChessAttemptPlies.attemptId, attemptId));

  const contentIds = async (puzzleId: string) => ({
    gears: await db
      .select({ id: gearPuzzleGears.id, label: gearPuzzleGears.label })
      .from(gearPuzzleGears)
      .where(eq(gearPuzzleGears.puzzleId, puzzleId))
      .orderBy(gearPuzzleGears.label),
    workers: await db
      .select({ id: rotaWorkers.id, name: rotaWorkers.name })
      .from(rotaWorkers)
      .where(eq(rotaWorkers.puzzleId, puzzleId))
      .orderBy(rotaWorkers.name),
    clues: await db
      .select({ id: rotaClues.id, position: rotaClues.position })
      .from(rotaClues)
      .where(eq(rotaClues.puzzleId, puzzleId))
      .orderBy(rotaClues.position),
  });

  async function startGearsAttempt() {
    const { id: puzzleId } = await put("gears", gearsContent());
    const [a, b] = (await contentIds(puzzleId)).gears;
    const attemptId = await startAttempt(puzzleId);
    await db.transaction((tx) =>
      realRegistry.gears.replaceAttemptState(tx, attemptId, {
        crank: 3,
        convergence: 1,
        accusedGearId: a.id,
        swaps: [{ gearAId: a.id, gearBId: b.id }],
      }),
    );
    return { puzzleId, attemptId };
  }

  async function startRotaAttempt() {
    const { id: puzzleId } = await put("rota", rotaContent());
    const [gary, marty] = (await contentIds(puzzleId)).workers;
    const attemptId = await startAttempt(puzzleId);
    await db.transaction((tx) =>
      realRegistry.rota.replaceAttemptState(tx, attemptId, {
        swaps: [{ workerAId: marty.id, workerBId: gary.id }],
      }),
    );
    return { puzzleId, attemptId };
  }

  async function startCrosswordAttempt() {
    const { id: puzzleId } = await put("crossword", crosswordContent());
    const attemptId = await startAttempt(puzzleId);
    await db.transaction((tx) =>
      realRegistry.crossword.replaceAttemptState(tx, attemptId, {
        cells: [{ row: 0, col: 1, letter: "B" }],
      }),
    );
    return { puzzleId, attemptId };
  }

  async function startReverseChessAttempt() {
    const { id: puzzleId } = await put("reverse-chess", reverseChessContent());
    const attemptId = await startAttempt(puzzleId);
    await db.transaction((tx) =>
      realRegistry["reverse-chess"].replaceAttemptState(tx, attemptId, {
        plies: [
          { fromFile: "a", fromRank: 5, toFile: "a", toRank: 6, unpromote: false, special: "none" },
        ],
      }),
    );
    return { puzzleId, attemptId };
  }

  it("keeps attempt rows and content ids when unchanged content is re-seeded", async () => {
    const gearsRun = await startGearsAttempt();
    const rotaRun = await startRotaAttempt();
    const crosswordRun = await startCrosswordAttempt();
    const reverseChessRun = await startReverseChessAttempt();
    const before = {
      gears: await gearState(gearsRun.attemptId),
      rota: await rotaState(rotaRun.attemptId),
      crossword: await crosswordState(crosswordRun.attemptId),
      reverseChess: await reverseChessState(reverseChessRun.attemptId),
      gearIds: await contentIds(gearsRun.puzzleId),
      rotaIds: await contentIds(rotaRun.puzzleId),
    };
    expect(before.gears[1]).toHaveLength(1);
    expect(before.rota).toHaveLength(1);
    expect(before.crossword).toHaveLength(1);
    expect(before.reverseChess).toHaveLength(1);

    for (let round = 0; round < 2; round++) {
      await put("gears", gearsContent());
      await put("rota", rotaContent());
      await put("crossword", crosswordContent());
      await put("reverse-chess", reverseChessContent());
    }

    expect(await gearState(gearsRun.attemptId)).toEqual(before.gears);
    expect(await rotaState(rotaRun.attemptId)).toEqual(before.rota);
    expect(await crosswordState(crosswordRun.attemptId)).toEqual(before.crossword);
    expect(await reverseChessState(reverseChessRun.attemptId)).toEqual(before.reverseChess);
    expect(await contentIds(gearsRun.puzzleId)).toEqual(before.gearIds);
    expect(await contentIds(rotaRun.puzzleId)).toEqual(before.rotaIds);
  });

  it("clears optional meta a re-seeded content file omits, keeping attempts", async () => {
    const meta = { slug: `${slugPrefix}meta`, title: "T073", difficulty: 1 };
    const { id: puzzleId } = await upsertPuzzle(db, realRegistry, {
      typeKey: "gears",
      meta: {
        ...meta,
        sourceNote: "S1E1",
        publishedAt: new Date("2026-01-01T00:00:00Z"),
      },
      content: gearsContent(),
    });
    const attemptId = await startAttempt(puzzleId);
    const metaOf = async () =>
      (
        await db
          .select({ sourceNote: puzzles.sourceNote, publishedAt: puzzles.publishedAt })
          .from(puzzles)
          .where(eq(puzzles.id, puzzleId))
      )[0];
    const attemptRows = () => db.select().from(attempts).where(eq(attempts.id, attemptId));
    expect(await metaOf()).toEqual({
      sourceNote: "S1E1",
      publishedAt: new Date("2026-01-01T00:00:00Z"),
    });
    const attemptsBefore = await attemptRows();

    await upsertPuzzle(db, realRegistry, {
      typeKey: "gears",
      meta,
      content: gearsContent(),
    });

    expect(await metaOf()).toEqual({ sourceNote: null, publishedAt: null });
    expect(await attemptRows()).toEqual(attemptsBefore);
    expect(attemptsBefore).toHaveLength(1);
  });

  it("updates edited content fields in place without touching attempts", async () => {
    const gearsRun = await startGearsAttempt();
    const rotaRun = await startRotaAttempt();
    const crosswordRun = await startCrosswordAttempt();
    const before = {
      gears: await gearState(gearsRun.attemptId),
      rota: await rotaState(rotaRun.attemptId),
      crossword: await crosswordState(crosswordRun.attemptId),
      gearIds: await contentIds(gearsRun.puzzleId),
      rotaIds: await contentIds(rotaRun.puzzleId),
    };

    await put("gears", gearsContent(gears([{}, { teeth: 16 }])));
    await put("rota", rotaContent("Neighbours only"));
    await put("crossword", crosswordContent("Changed clue"));

    const [, changedGear] = await db
      .select({ teeth: gearPuzzleGears.teeth })
      .from(gearPuzzleGears)
      .where(eq(gearPuzzleGears.puzzleId, gearsRun.puzzleId))
      .orderBy(gearPuzzleGears.label);
    expect(changedGear.teeth).toBe(16);
    const [clue] = await db
      .select({ displayText: rotaClues.displayText })
      .from(rotaClues)
      .where(and(eq(rotaClues.puzzleId, rotaRun.puzzleId), eq(rotaClues.position, 0)));
    expect(clue.displayText).toBe("Neighbours only");
    const [crosswordClue] = await db
      .select({ clueText: crosswordClues.clueText })
      .from(crosswordClues)
      .where(eq(crosswordClues.puzzleId, crosswordRun.puzzleId));
    expect(crosswordClue.clueText).toBe("Changed clue");

    expect(await gearState(gearsRun.attemptId)).toEqual(before.gears);
    expect(await rotaState(rotaRun.attemptId)).toEqual(before.rota);
    expect(await crosswordState(crosswordRun.attemptId)).toEqual(before.crossword);
    expect(await contentIds(gearsRun.puzzleId)).toEqual(before.gearIds);
    expect((await contentIds(rotaRun.puzzleId)).workers).toEqual(before.rotaIds.workers);
  });

  it("removes content rows no attempt references", async () => {
    const { id: puzzleId } = await put("rota", rotaContent());
    expect((await contentIds(puzzleId)).workers).toHaveLength(3);

    await put("rota", rotaContent("Only neighbours swap", ["Marty", "Gary"]));

    expect((await contentIds(puzzleId)).workers.map((worker) => worker.name)).toEqual([
      "Gary",
      "Marty",
    ]);
  });

  it("fails naming the puzzle and changes nothing when attempt data references a removed row", async () => {
    const gearsRun = await startGearsAttempt();
    const rotaRun = await startRotaAttempt();
    const crosswordRun = await startCrosswordAttempt();
    const before = {
      gears: await gearState(gearsRun.attemptId),
      rota: await rotaState(rotaRun.attemptId),
      crossword: await crosswordState(crosswordRun.attemptId),
      gearIds: await contentIds(gearsRun.puzzleId),
      rotaIds: await contentIds(rotaRun.puzzleId),
    };

    const withoutGearB = gearsContent(
      [gears()[0], { ...gears()[2], teeth: 16 }],
      [],
    );
    withoutGearB.meshes = [{ a: "a", b: "c" }];
    await expect(put("gears", withoutGearB)).rejects.toThrow(
      /gears\/t072-gears.*attempt data references/,
    );
    await expect(
      put("rota", rotaContent("Edited and removed", ["Gary", "Sue"])),
    ).rejects.toThrow(/rota\/t072-rota.*attempt data references/);
    await expect(
      put(
        "crossword",
        crosswordContent("Edited and removed", [
          { row: 0, col: 0, letter: "A" },
          { row: 1, col: 0, letter: "C" },
        ]),
      ),
    ).rejects.toThrow(/crossword\/t072-crossword.*attempt data references/);

    expect(await contentIds(gearsRun.puzzleId)).toEqual(before.gearIds);
    expect(await contentIds(rotaRun.puzzleId)).toEqual(before.rotaIds);
    expect(await gearState(gearsRun.attemptId)).toEqual(before.gears);
    expect(await rotaState(rotaRun.attemptId)).toEqual(before.rota);
    expect(await crosswordState(crosswordRun.attemptId)).toEqual(before.crossword);
    const [clue] = await db
      .select({ displayText: rotaClues.displayText })
      .from(rotaClues)
      .where(and(eq(rotaClues.puzzleId, rotaRun.puzzleId), eq(rotaClues.position, 0)));
    expect(clue.displayText).toBe("Only neighbours swap");
    const cells = await db
      .select({ row: crosswordCells.row })
      .from(crosswordCells)
      .where(eq(crosswordCells.puzzleId, crosswordRun.puzzleId));
    expect(cells).toHaveLength(3);
    const [gearC] = await db
      .select({ teeth: gearPuzzleGears.teeth })
      .from(gearPuzzleGears)
      .where(and(eq(gearPuzzleGears.puzzleId, gearsRun.puzzleId), eq(gearPuzzleGears.label, "c")));
    expect(gearC.teeth).toBe(12);
  });
});

describe("removal of puzzles with attempts", () => {
  const answers: string[] = [];
  const questions: string[] = [];
  const ask = async (question: string) => {
    questions.push(question);
    return answers.shift() ?? "";
  };

  async function seedGoneWithAttempts() {
    write("a", contentFile("a", items));
    write("b", contentFile("b", items));
    await run();
    const userId = await createTestUser("t079");
    const [{ id: puzzleId }] = await db
      .select({ id: puzzles.id })
      .from(puzzles)
      .where(and(eq(puzzles.typeKey, "__fixture"), eq(puzzles.slug, "b")));
    await db.insert(attempts).values({ userId, puzzleId, typeKey: "__fixture" });
    rmSync(path.join(contentDir, "__fixture", "b.ts"));
    return puzzleId;
  }
  const attemptCount = async (puzzleId: string) =>
    (
      await db
        .select({ n: sql<number>`count(*)::int` })
        .from(attempts)
        .where(eq(attempts.puzzleId, puzzleId))
    )[0].n;
  const withConfirm = (options: Parameters<typeof createConfirmRemoval>[0]) =>
    seed({
      db,
      registry,
      contentDir,
      lookups,
      confirmRemoval: createConfirmRemoval({ ask, ...options }),
    });

  beforeEach(() => {
    answers.length = 0;
    questions.length = 0;
  });
  afterAll(deleteTestUsers);

  it("refuses non-interactively, naming the puzzle and count, and removes nothing", async () => {
    const puzzleId = await seedGoneWithAttempts();

    const summary = await withConfirm({ confirmList: "", interactive: false });

    expect(summary.blockedRemovals).toEqual([
      { typeKey: "__fixture", slug: "b", attempts: 1 },
    ]);
    expect(summary.types.__fixture.removed).toBe(0);
    expect(await countPuzzles()).toBe(2);
    expect(await attemptCount(puzzleId)).toBe(1);
    expect(questions).toEqual([]);
  });

  it("refuses by default when no confirmation is supplied", async () => {
    await seedGoneWithAttempts();

    const summary = await run();

    expect(summary.blockedRemovals).toEqual([
      { typeKey: "__fixture", slug: "b", attempts: 1 },
    ]);
    expect(await countPuzzles()).toBe(2);
  });

  it.each(["__fixture/b", "all", "__fixture/x, __fixture/b"])(
    "removes the puzzle and its attempts when SEED_CONFIRM_REMOVE is %s",
    async (confirmList) => {
      const puzzleId = await seedGoneWithAttempts();

      const summary = await withConfirm({ confirmList, interactive: false });

      expect(summary.blockedRemovals).toEqual([]);
      expect(summary.types.__fixture.removed).toBe(1);
      expect(await countPuzzles()).toBe(1);
      expect(await attemptCount(puzzleId)).toBe(0);
    },
  );

  it("refuses when the list leaves a puzzle with attempts out", async () => {
    await seedGoneWithAttempts();

    const summary = await withConfirm({ confirmList: "__fixture/other", interactive: false });

    expect(summary.blockedRemovals).toEqual([
      { typeKey: "__fixture", slug: "b", attempts: 1 },
    ]);
    expect(await countPuzzles()).toBe(2);
  });

  it.each(["y", " Yes "])("prompts interactively, listing puzzles with counts, and removes on %j", async (answer) => {
    const puzzleId = await seedGoneWithAttempts();
    answers.push(answer);

    const summary = await withConfirm({ confirmList: "", interactive: true });

    expect(questions).toHaveLength(1);
    expect(questions[0]).toContain("__fixture/b: 1 attempts");
    expect(summary.blockedRemovals).toEqual([]);
    expect(await countPuzzles()).toBe(1);
    expect(await attemptCount(puzzleId)).toBe(0);
  });

  it.each(["n", ""])("leaves everything in place when the prompt is answered %j", async (answer) => {
    const puzzleId = await seedGoneWithAttempts();
    answers.push(answer);

    const summary = await withConfirm({ confirmList: "", interactive: true });

    expect(summary.blockedRemovals).toEqual([
      { typeKey: "__fixture", slug: "b", attempts: 1 },
    ]);
    expect(await countPuzzles()).toBe(2);
    expect(await attemptCount(puzzleId)).toBe(1);
  });

  it("keeps an unlisted gone puzzle that gains an attempt while the prompt is open", async () => {
    const puzzleId = await seedGoneWithAttempts();
    write("c", contentFile("c", items));
    await run();
    const [{ id: lateId }] = await db
      .select({ id: puzzles.id })
      .from(puzzles)
      .where(and(eq(puzzles.typeKey, "__fixture"), eq(puzzles.slug, "c")));
    rmSync(path.join(contentDir, "__fixture", "c.ts"));
    const [{ userId }] = await db
      .select({ userId: attempts.userId })
      .from(attempts)
      .where(eq(attempts.puzzleId, puzzleId));

    const summary = await withConfirm({
      confirmList: "",
      interactive: true,
      ask: async () => {
        await db.insert(attempts).values({ userId, puzzleId: lateId, typeKey: "__fixture" });
        return "y";
      },
    });

    expect(summary.blockedRemovals).toEqual([]);
    expect(summary.types.__fixture.removed).toBe(1);
    expect(await attemptCount(puzzleId)).toBe(0);
    expect(await attemptCount(lateId)).toBe(1);
  });

  it("does not prompt or require confirmation when the removed puzzle has no attempts", async () => {
    write("a", contentFile("a", items));
    write("b", contentFile("b", items));
    await run();
    rmSync(path.join(contentDir, "__fixture", "b.ts"));

    const summary = await withConfirm({ confirmList: "", interactive: true });

    expect(questions).toEqual([]);
    expect(summary.blockedRemovals).toEqual([]);
    expect(summary.types.__fixture.removed).toBe(1);
  });
});

