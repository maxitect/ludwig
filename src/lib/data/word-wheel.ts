import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { words, wordWheelAttempts, wordWheelAttemptWords } from "@/db/schema";
import { getOrCreateAttempt } from "@/lib/data/attempts";
import { getPublishedTypeKey } from "@/lib/data/puzzles";
import { deriveWheel, fitFailure } from "@/puzzles/word-wheel/engine";

export type WordResult =
  | "accepted"
  | "not-a-word"
  | "too-short"
  | "missing-centre"
  | "letters";

/**
 * Judges a submitted word against the wheel and the dictionary and, for a signed-in player, stores
 * an accepted word. Null when the puzzle is not a published word wheel. `isTarget` is true only
 * for the target word itself.
 */
export async function submitWord(
  userId: string | null,
  puzzleId: string,
  word: string,
): Promise<{ result: WordResult; isTarget: boolean } | null> {
  if ((await getPublishedTypeKey(puzzleId)) !== "word-wheel") return null;
  const puzzle = await db.query.wordWheelPuzzles.findFirst({
    where: { puzzleId },
    columns: {
      targetWord: true,
      centrePosition: true,
      scrambleSeed: true,
      minLength: true,
    },
  });
  if (!puzzle) return null;
  const wheel = deriveWheel(
    puzzle.targetWord,
    puzzle.centrePosition,
    puzzle.scrambleSeed,
  );
  const failure = fitFailure(wheel, puzzle.minLength, word);
  if (failure) return { result: failure, isTarget: false };
  const [known] = await db
    .select({ word: words.word })
    .from(words)
    .where(eq(words.word, word));
  if (!known) return { result: "not-a-word", isTarget: false };
  if (userId) {
    const attempt = await getOrCreateAttempt(userId, puzzleId);
    await db
      .insert(wordWheelAttempts)
      .values({ attemptId: attempt.id })
      .onConflictDoNothing();
    await db
      .insert(wordWheelAttemptWords)
      .values({ attemptId: attempt.id, word })
      .onConflictDoNothing();
  }
  return { result: "accepted", isTarget: word === puzzle.targetWord };
}
