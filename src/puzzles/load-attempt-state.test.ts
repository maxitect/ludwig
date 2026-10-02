import { eq, inArray } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { db } from "@/db";
import { createTestUser, deleteTestUsers } from "@/db/integrity/harness";
import {
  attempts,
  gearPuzzleGears,
  gearPuzzles,
  puzzleCategories,
  puzzleTypes,
  puzzles,
  reverseChessPuzzles,
  rotaPuzzles,
} from "@/db/schema";
import { gearsModule } from "./gears/module";
import { reverseChessModule } from "./reverse-chess/module";
import { rotaModule } from "./rota/module";

const types = [
  ["reverse-chess", "reverse_chess_puzzles"],
  ["gears", "gear_puzzles"],
  ["rota", "rota_puzzles"],
] as const;

const slug = "t019-loader";
let userId: string;
const ids: Record<(typeof types)[number][0], string> = {
  "reverse-chess": "",
  gears: "",
  rota: "",
};
const insertedTypes: string[] = [];

async function attemptFor(puzzleId: string) {
  const [attempt] = await db
    .insert(attempts)
    .values({ userId, puzzleId })
    .returning({ id: attempts.id });
  return attempt.id;
}

beforeAll(async () => {
  await db
    .insert(puzzleCategories)
    .values({ key: "ld-test", name: "ld", sort: 99 })
    .onConflictDoNothing();
  const added = await db
    .insert(puzzleTypes)
    .values(
      types.map(([key, subtypeTable], sort) => ({
        key,
        categoryKey: "ld-test",
        name: key,
        description: key,
        subtypeTable,
        sort,
      })),
    )
    .onConflictDoNothing()
    .returning({ key: puzzleTypes.key });
  insertedTypes.push(...added.map((row) => row.key));

  await db.transaction(async (tx) => {
    const insert = async (typeKey: (typeof types)[number][0]) => {
      const [row] = await tx
        .insert(puzzles)
        .values({ typeKey, slug, title: slug, difficulty: 1 })
        .returning({ id: puzzles.id });
      ids[typeKey] = row.id;
      return row.id;
    };
    await tx.insert(reverseChessPuzzles).values({
      puzzleId: await insert("reverse-chess"),
      mode: "last_move",
      sideToMove: "black",
      whiteKingside: false,
      whiteQueenside: false,
      blackKingside: false,
      blackQueenside: false,
      halfmove: 0,
      fullmove: 1,
      plyCount: 1,
    });
    const gearsId = await insert("gears");
    await tx.insert(gearPuzzles).values({
      puzzleId: gearsId,
      slotCount: 8,
      mIn: 3,
      mOut: 1,
      maxAdjustments: 0,
      occlusion: false,
    });
    await tx.insert(gearPuzzleGears).values({
      puzzleId: gearsId,
      label: "a",
      teeth: 12,
      startSlot: 0,
      initialOffset: 0,
      halfWidthDeg: 45,
      isDriver: true,
    });
    await tx.insert(rotaPuzzles).values({ puzzleId: await insert("rota") });
  });
  userId = await createTestUser("t019ld");
});

afterAll(async () => {
  await db.delete(puzzles).where(inArray(puzzles.id, Object.values(ids)));
  for (const key of insertedTypes) {
    await db.delete(puzzleTypes).where(eq(puzzleTypes.key, key));
  }
  await db.delete(puzzleCategories).where(eq(puzzleCategories.key, "ld-test"));
  await deleteTestUsers();
});

describe("reverse-chess loadAttemptState", () => {
  const ply = (fromFile: "a" | "h") =>
    ({
      fromFile,
      fromRank: 1,
      toFile: "e",
      toRank: 2,
      uncapture: null,
      unpromote: false,
      special: "none",
    }) as const;

  it("is null without saved state and returns the plies in order", async () => {
    const attemptId = await attemptFor(ids["reverse-chess"]);
    expect(await reverseChessModule.loadAttemptState(attemptId)).toBeNull();
    const state = { plies: [ply("h"), ply("a")] };
    await db.transaction((tx) =>
      reverseChessModule.replaceAttemptState(tx, attemptId, state),
    );
    expect(await reverseChessModule.loadAttemptState(attemptId)).toEqual(state);
  });
});

describe("gears loadAttemptState", () => {
  it("is null without saved state and returns the attempt row", async () => {
    const attemptId = await attemptFor(ids.gears);
    expect(await gearsModule.loadAttemptState(attemptId)).toBeNull();
    const state = {
      crank: 4,
      convergence: null,
      accusedGearId: null,
      swaps: [],
    };
    await db.transaction((tx) =>
      gearsModule.replaceAttemptState(tx, attemptId, state),
    );
    expect(await gearsModule.loadAttemptState(attemptId)).toEqual(state);
  });
});

describe("rota loadAttemptState", () => {
  it("is null without saved state and returns the attempt row", async () => {
    const attemptId = await attemptFor(ids.rota);
    expect(await rotaModule.loadAttemptState(attemptId)).toBeNull();
    const state = { instigatorWorkerId: null, swaps: [] };
    await db.transaction((tx) =>
      rotaModule.replaceAttemptState(tx, attemptId, state),
    );
    expect(await rotaModule.loadAttemptState(attemptId)).toEqual(state);
  });
});
