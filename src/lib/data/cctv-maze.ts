import "server-only";
import { db } from "@/db";
import { getOrCreateAttempt, recordHint } from "@/lib/data/attempts";
import { getPublishedTypeKey } from "@/lib/data/puzzles";

/**
 * Records that the player revealed the cameras, once per attempt and never after it is solved.
 * Returns false when the puzzle is not a published CCTV maze.
 */
export async function recordCameraReveal(userId: string, puzzleId: string) {
  if ((await getPublishedTypeKey(puzzleId)) !== "cctv-maze") return false;
  const attempt = await getOrCreateAttempt(userId, puzzleId);
  if (attempt.completedAt) return true;
  const revealed = await db.query.attemptHints.findFirst({
    where: { attemptId: attempt.id, kind: "reveal_all" },
    columns: { id: true },
  });
  if (!revealed) await recordHint(attempt.id, "reveal_all");
  return true;
}
