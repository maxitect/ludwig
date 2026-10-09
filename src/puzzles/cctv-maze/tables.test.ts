import { eq, sql } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { db } from "@/db";
import {
  createTestUser,
  deleteTestUsers,
  forceDeferred,
  pgError,
  pgErrorCode,
  type Tx,
} from "@/db/integrity/harness";
import {
  attemptHints,
  attempts,
  cctvMazeAttemptSteps,
  cctvMazeAttempts,
  cctvMazeCameras,
  cctvMazePuzzles,
  cctvMazeWalls,
  puzzleCategories,
  puzzleTypes,
  puzzles,
} from "@/db/schema";
import { recordCameraReveal } from "@/lib/data/cctv-maze";
import { checkPuzzleAnswer } from "@/lib/data/puzzles";
import { check } from "./check";
import { load } from "./load";
import { loadSolution } from "./load-solution";
import { cctvMazeModule } from "./module";
import { payloadSchema } from "./schema";

const content = {
  rows: 3,
  cols: 3,
  startRow: 0,
  startCol: 0,
  exitRow: 0,
  exitCol: 2,
  walls: [{ row: 1, col: 1, side: "west" as const }],
  cameras: [
    { row: 0, col: 1, facing: "s" as const, fovDeg: 30, rangeCells: 1 },
  ],
};
const solutionPath = [
  { row: 0, col: 0 },
  { row: 1, col: 0 },
  { row: 2, col: 0 },
  { row: 2, col: 1 },
  { row: 2, col: 2 },
  { row: 1, col: 2 },
  { row: 0, col: 2 },
];

async function ensureTypes(tx: Tx) {
  await tx.execute(
    sql`insert into puzzle_categories (key, name, sort) values ('cm-test', 'cm', 99) on conflict (key) do nothing`,
  );
  await tx.execute(sql`
    insert into puzzle_types (key, category_key, name, description, subtype_table, sort)
    values ('cctv-maze', 'cm-test', 'cm', 'cm', 'cctv_maze_puzzles', 1),
           ('other', 'cm-test', 'other', 'other', 'zz_other_puzzles', 2)
    on conflict (key) do nothing
  `);
}

async function insertPuzzle(tx: Tx, typeKey: string, slug = "one") {
  await ensureTypes(tx);
  const [row] = await tx
    .insert(puzzles)
    .values({ typeKey, slug, title: slug, difficulty: 1 })
    .returning({ id: puzzles.id });
  return row.id;
}

const subtype = (puzzleId: string) => ({
  puzzleId,
  rows: 3,
  cols: 4,
  startRow: 0,
  startCol: 0,
  exitRow: 2,
  exitCol: 3,
});

async function mazeWith(tx: Tx) {
  const puzzleId = await insertPuzzle(tx, "cctv-maze");
  await tx.insert(cctvMazePuzzles).values(subtype(puzzleId));
  return puzzleId;
}

describe("cctv maze tables", () => {
  it("stores no path, seen or solution column, and no json or array column", async () => {
    const rows = await db.execute(sql`
      select table_name, column_name from information_schema.columns
      where table_name like 'cctv_maze%'
        and (data_type in ('jsonb', 'json', 'ARRAY')
          or column_name ~ '(path|seen|visible|solution)')
    `);
    expect(rows.rows).toHaveLength(0);
  });

  it("creates the wall_side enum with north and west only", async () => {
    const rows = await db.execute(sql`
      select e.enumlabel from pg_enum e join pg_type t on t.oid = e.enumtypid
      where t.typname = 'wall_side' order by e.enumsortorder
    `);
    expect(rows.rows.map((row) => row.enumlabel)).toEqual(["north", "west"]);
  });

  it("rejects a subtype row for a puzzle of another type", async () => {
    expect(
      await pgErrorCode(async (tx) => {
        const puzzleId = await insertPuzzle(tx, "other");
        await tx.insert(cctvMazePuzzles).values(subtype(puzzleId));
      }),
    ).toBe("23503");
  });

  it("rejects a cctv maze puzzle with no subtype row at commit", async () => {
    const error = await pgError(async (tx) => {
      await insertPuzzle(tx, "cctv-maze");
      await forceDeferred(tx);
    });
    expect(error?.code).toBe("23000");
    expect(error?.message).toMatch(/has no row in cctv_maze_puzzles/);
  });

  it("accepts a valid puzzle with walls and cameras", async () => {
    expect(
      await pgErrorCode(async (tx) => {
        const puzzleId = await mazeWith(tx);
        await tx.insert(cctvMazeWalls).values([
          { puzzleId, row: 1, col: 1, side: "north" },
          { puzzleId, row: 1, col: 1, side: "west" },
        ]);
        await tx.insert(cctvMazeCameras).values({
          puzzleId,
          row: 1,
          col: 1,
          facing: "ne",
          fovDeg: 60,
          rangeCells: 3,
        });
        await forceDeferred(tx);
      }),
    ).toBeUndefined();
  });

  it("rejects a duplicate wall", async () => {
    expect(
      await pgErrorCode(async (tx) => {
        const puzzleId = await mazeWith(tx);
        const wall = { puzzleId, row: 1, col: 1, side: "north" as const };
        await tx.insert(cctvMazeWalls).values([wall, wall]);
      }),
    ).toBe("23505");
  });

  it("rejects a wall side other than north and west", async () => {
    expect(
      await pgErrorCode(async (tx) => {
        const puzzleId = await mazeWith(tx);
        await tx.execute(
          sql`insert into cctv_maze_walls (puzzle_id, row, col, side) values (${puzzleId}, 1, 1, 'south')`,
        );
      }),
    ).toBe("22P02");
  });

  it("rejects a negative wall coordinate", async () => {
    expect(
      await pgErrorCode(async (tx) => {
        const puzzleId = await mazeWith(tx);
        await tx
          .insert(cctvMazeWalls)
          .values({ puzzleId, row: -1, col: 1, side: "north" });
      }),
    ).toBe("23514");
  });

  it.each([0, -1])("rejects a camera with range_cells %i", async (range) => {
    expect(
      await pgErrorCode(async (tx) => {
        const puzzleId = await mazeWith(tx);
        await tx.insert(cctvMazeCameras).values({
          puzzleId,
          row: 1,
          col: 1,
          facing: "n",
          fovDeg: 60,
          rangeCells: range,
        });
      }),
    ).toBe("23514");
  });

  it("accepts a camera with range_cells 1", async () => {
    expect(
      await pgErrorCode(async (tx) => {
        const puzzleId = await mazeWith(tx);
        await tx.insert(cctvMazeCameras).values({
          puzzleId,
          row: 1,
          col: 1,
          facing: "n",
          fovDeg: 60,
          rangeCells: 1,
        });
        await forceDeferred(tx);
      }),
    ).toBeUndefined();
  });

  it.each([0, 361])("rejects a camera with fov_deg %i", async (fovDeg) => {
    expect(
      await pgErrorCode(async (tx) => {
        const puzzleId = await mazeWith(tx);
        await tx.insert(cctvMazeCameras).values({
          puzzleId,
          row: 1,
          col: 1,
          facing: "n",
          fovDeg,
          rangeCells: 2,
        });
      }),
    ).toBe("23514");
  });

  it("rejects a facing outside the compass", async () => {
    expect(
      await pgErrorCode(async (tx) => {
        const puzzleId = await mazeWith(tx);
        await tx.execute(
          sql`insert into cctv_maze_cameras (puzzle_id, row, col, facing, fov_deg, range_cells) values (${puzzleId}, 1, 1, 'up', 90, 2)`,
        );
      }),
    ).toBe("22P02");
  });

  it("rejects two cameras on one cell", async () => {
    expect(
      await pgErrorCode(async (tx) => {
        const puzzleId = await mazeWith(tx);
        const camera = {
          puzzleId,
          row: 1,
          col: 1,
          facing: "n" as const,
          fovDeg: 60,
          rangeCells: 2,
        };
        await tx.insert(cctvMazeCameras).values([camera, camera]);
      }),
    ).toBe("23505");
  });

  it.each([
    ["a start row past the grid", { startRow: 3 }],
    ["an exit column past the grid", { exitCol: 4 }],
    ["a negative start column", { startCol: -1 }],
    ["a grid of 2 rows", { rows: 2, startRow: 0, exitRow: 0 }],
    ["a grid of 16 columns", { cols: 16 }],
  ])("rejects %s", async (_, override) => {
    expect(
      await pgErrorCode(async (tx) => {
        const puzzleId = await insertPuzzle(tx, "cctv-maze");
        await tx
          .insert(cctvMazePuzzles)
          .values({ ...subtype(puzzleId), ...override });
      }),
    ).toBe("23514");
  });

  it("rejects an attempt of another puzzle type", async () => {
    const userId = await createTestUser("t060tbl");
    expect(
      await pgErrorCode(async (tx) => {
        const puzzleId = await insertPuzzle(tx, "other");
        const [attempt] = await tx
          .insert(attempts)
          .values({ userId, puzzleId })
          .returning({ id: attempts.id });
        await tx.insert(cctvMazeAttempts).values({ attemptId: attempt.id });
      }),
    ).toBe("23503");
  });

  it("rejects a repeated step number and a negative step", async () => {
    const userId = await createTestUser("t060step");
    const attemptOf = async (tx: Tx) => {
      const puzzleId = await mazeWith(tx);
      const [attempt] = await tx
        .insert(attempts)
        .values({ userId, puzzleId })
        .returning({ id: attempts.id });
      await tx.insert(cctvMazeAttempts).values({ attemptId: attempt.id });
      return attempt.id;
    };
    expect(
      await pgErrorCode(async (tx) => {
        const attemptId = await attemptOf(tx);
        await tx.insert(cctvMazeAttemptSteps).values([
          { attemptId, step: 0, row: 0, col: 0 },
          { attemptId, step: 0, row: 1, col: 0 },
        ]);
      }),
    ).toBe("23505");
    expect(
      await pgErrorCode(async (tx) => {
        const attemptId = await attemptOf(tx);
        await tx
          .insert(cctvMazeAttemptSteps)
          .values({ attemptId, step: -1, row: 0, col: 0 });
      }),
    ).toBe("23514");
  });
});

describe("cctv maze module", () => {
  let puzzleId: string;
  let userId: string;
  const insertedTypes: string[] = [];

  beforeAll(async () => {
    await db
      .insert(puzzleCategories)
      .values({ key: "cm-test", name: "cm", sort: 99 })
      .onConflictDoNothing();
    const added = await db
      .insert(puzzleTypes)
      .values({
        key: "cctv-maze",
        categoryKey: "cm-test",
        name: "cm",
        description: "cm",
        subtypeTable: "cctv_maze_puzzles",
        sort: 1,
      })
      .onConflictDoNothing()
      .returning({ key: puzzleTypes.key });
    insertedTypes.push(...added.map((row) => row.key));
    puzzleId = await db.transaction(async (tx) => {
      const [row] = await tx
        .insert(puzzles)
        .values({
          typeKey: "cctv-maze",
          slug: "t060-module",
          title: "t",
          difficulty: 1,
          publishedAt: new Date("2026-01-01T00:00:00Z"),
        })
        .returning({ id: puzzles.id });
      await cctvMazeModule.upsertContent(tx, row.id, content);
      return row.id;
    });
    userId = await createTestUser("t060mod");
  });

  afterAll(async () => {
    await db.delete(puzzles).where(eq(puzzles.id, puzzleId));
    for (const key of insertedTypes) {
      await db.delete(puzzleTypes).where(eq(puzzleTypes.key, key));
    }
    await deleteTestUsers();
  });

  it("loads the layout only, with no path or seen cell", async () => {
    const payload = await load(puzzleId);
    expect(payloadSchema.strict().parse(payload)).toEqual(payload);
    expect(Object.keys(payload).sort()).toEqual([
      "cameras",
      "cols",
      "exitCol",
      "exitRow",
      "puzzleId",
      "rows",
      "startCol",
      "startRow",
      "walls",
    ]);
    expect(payload.walls).toEqual(content.walls);
    expect(payload.cameras).toEqual(content.cameras);
    expect(JSON.stringify(payload)).not.toMatch(/path|seen|solution/);
  });

  it("rejects a payload that carries the path or the seen cells", async () => {
    const payload = await load(puzzleId);
    expect(() =>
      payloadSchema.strict().parse({ ...payload, path: [] }),
    ).toThrow();
    expect(() =>
      payloadSchema.strict().parse({ ...payload, seen: [] }),
    ).toThrow();
  });

  it("derives the seen cells from the stored cameras", async () => {
    const solution = await loadSolution(puzzleId);
    expect(solution).toEqual({
      seen: [
        { row: 0, col: 1 },
        { row: 1, col: 1 },
      ],
    });
    expect(
      check(await load(puzzleId), solution, { path: solutionPath }).correct,
    ).toBe(true);
  });

  it("returns only { correct } to the client, never the first invalid step", async () => {
    const wrong = await checkPuzzleAnswer("cctv-maze", puzzleId, {
      path: [
        { row: 0, col: 0 },
        { row: 0, col: 1 },
        { row: 0, col: 2 },
      ],
    });
    expect(wrong).toEqual({ correct: false });
    const short = await checkPuzzleAnswer("cctv-maze", puzzleId, {
      path: solutionPath.slice(0, 3),
    });
    expect(short).toEqual({ correct: false });
    const right = await checkPuzzleAnswer("cctv-maze", puzzleId, {
      path: solutionPath,
    });
    expect(right).toEqual({ correct: true });
  });

  it("updates the layout in place", async () => {
    await db.transaction((tx) =>
      cctvMazeModule.upsertContent(tx, puzzleId, {
        ...content,
        walls: [{ row: 1, col: 2, side: "north" }],
        cameras: [],
      }),
    );
    const payload = await load(puzzleId);
    expect(payload.walls).toEqual([{ row: 1, col: 2, side: "north" }]);
    expect(payload.cameras).toEqual([]);
    await db.transaction((tx) =>
      cctvMazeModule.upsertContent(tx, puzzleId, content),
    );
    expect((await load(puzzleId)).walls).toEqual(content.walls);
  });

  it("replaces, reads back and clears the attempt path in order", async () => {
    const [attempt] = await db
      .insert(attempts)
      .values({ userId, puzzleId })
      .returning({ id: attempts.id });
    expect(await cctvMazeModule.loadAttemptState(attempt.id)).toBeNull();

    await db.transaction((tx) =>
      cctvMazeModule.replaceAttemptState(tx, attempt.id, {
        path: solutionPath.slice(0, 4),
      }),
    );
    expect(await cctvMazeModule.loadAttemptState(attempt.id)).toEqual({
      path: solutionPath.slice(0, 4),
    });
    const stored = await db
      .select()
      .from(cctvMazeAttemptSteps)
      .where(eq(cctvMazeAttemptSteps.attemptId, attempt.id));
    expect(stored.map((step) => step.step).sort()).toEqual([0, 1, 2, 3]);

    await db.transaction((tx) =>
      cctvMazeModule.replaceAttemptState(tx, attempt.id, {
        path: solutionPath.slice(0, 2),
      }),
    );
    expect(await cctvMazeModule.loadAttemptState(attempt.id)).toEqual({
      path: solutionPath.slice(0, 2),
    });

    await cctvMazeModule.clearAttemptState(attempt.id);
    expect(await cctvMazeModule.loadAttemptState(attempt.id)).toBeNull();
  });

  it("records the camera reveal as one hint per attempt", async () => {
    const reveals = async () => {
      const [attempt] = await db
        .select({ id: attempts.id })
        .from(attempts)
        .where(eq(attempts.puzzleId, puzzleId));
      return attempt
        ? db
            .select()
            .from(attemptHints)
            .where(eq(attemptHints.attemptId, attempt.id))
        : [];
    };
    await db.delete(attempts).where(eq(attempts.puzzleId, puzzleId));
    expect(await reveals()).toHaveLength(0);
    expect(await recordCameraReveal(userId, puzzleId)).toBe(true);
    expect(await recordCameraReveal(userId, puzzleId)).toBe(true);
    const hints = await reveals();
    expect(hints).toHaveLength(1);
    expect(hints[0].kind).toBe("reveal_all");
  });

  it("records no reveal once the attempt is completed", async () => {
    await db.delete(attempts).where(eq(attempts.puzzleId, puzzleId));
    const [attempt] = await db
      .insert(attempts)
      .values({ userId, puzzleId, completedAt: new Date(), durationMs: 1000 })
      .returning({ id: attempts.id });
    expect(await recordCameraReveal(userId, puzzleId)).toBe(true);
    const hints = await db
      .select()
      .from(attemptHints)
      .where(eq(attemptHints.attemptId, attempt.id));
    expect(hints).toHaveLength(0);
  });

  it("records no reveal for a puzzle that is not a published maze", async () => {
    expect(
      await recordCameraReveal(userId, "00000000-0000-4000-8000-000000000001"),
    ).toBe(false);
  });
});
