import "server-only";
import { and, gte, sql } from "drizzle-orm";
import { db } from "@/db";
import { words } from "@/db/schema";
import { deriveWheel, ratingThresholds, validWords } from "./engine";
import { payloadSchema } from "./schema";

export async function load(puzzleId: string) {
  const puzzle = await db.query.wordWheelPuzzles.findFirst({
    where: { puzzleId },
    columns: {
      targetWord: true,
      centrePosition: true,
      scrambleSeed: true,
      minLength: true,
    },
  });
  if (!puzzle) throw new Error(`Word wheel puzzle not found: ${puzzleId}`);
  const wheel = deriveWheel(
    puzzle.targetWord,
    puzzle.centrePosition,
    puzzle.scrambleSeed,
  );
  const alphabet = [...new Set(puzzle.targetWord)].join("");
  const candidates = await db
    .select({ word: words.word })
    .from(words)
    .where(
      and(
        gte(sql`length(${words.word})`, puzzle.minLength),
        sql`${words.word} ~ ${`^[${alphabet}]+$`}`,
        sql`position(${wheel.centre} in ${words.word}) > 0`,
      ),
    );
  const total = validWords(
    wheel,
    puzzle.minLength,
    candidates.map(({ word }) => word),
  ).length;
  return payloadSchema.parse({
    ...wheel,
    minLength: puzzle.minLength,
    thresholds: ratingThresholds(total),
  });
}
