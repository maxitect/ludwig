import { eq } from "drizzle-orm";
import { db } from "@/db";
import type { PuzzleTypeModule } from "../registry";
import * as schema from "./schema";
import { fixtureItems, fixturePuzzles } from "./tables";

export const fixtureModule = {
  schema,
  meta: { key: "__fixture" },
  async load(puzzleId) {
    const items = await db
      .select({ position: fixtureItems.position, label: fixtureItems.label })
      .from(fixtureItems)
      .where(eq(fixtureItems.puzzleId, puzzleId));
    return { items };
  },
  async loadSolution(puzzleId) {
    const [row] = await db
      .select({ note: fixturePuzzles.note })
      .from(fixturePuzzles)
      .where(eq(fixturePuzzles.puzzleId, puzzleId));
    return row.note;
  },
  check(_payload, solution, answer) {
    return { correct: answer.label === solution };
  },
  Solver() {
    return null;
  },
  async insertContent(tx, puzzleId, content) {
    await tx.insert(fixturePuzzles).values({ puzzleId, note: content.note });
    await tx
      .insert(fixtureItems)
      .values(content.items.map((item) => ({ ...item, puzzleId })));
  },
  verify(content) {
    const labels = content.items.map((item) => item.label);
    if (new Set(labels).size !== labels.length) {
      throw new Error("duplicate item label: solution is not unique");
    }
  },
} satisfies PuzzleTypeModule<typeof schema, string>;
