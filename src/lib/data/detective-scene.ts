import "server-only";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { attempts, detectiveSceneAttemptFound } from "@/db/schema";
import { getOrCreateAttempt, recordHint } from "@/lib/data/attempts";
import { getPublishedTypeKey } from "@/lib/data/puzzles";
import { matchFind } from "@/puzzles/detective-scene/engine";
import { loadSolution } from "@/puzzles/detective-scene/load-solution";

type Solution = Awaited<ReturnType<typeof loadSolution>>;

const asFound = ({ position, title, x, y, width, height }: Solution["items"][number]) => ({
  position,
  title,
  region: { x, y, width, height },
});

/** The solution of a published detective scene, or null for any other puzzle. */
async function loadScene(puzzleId: string) {
  if ((await getPublishedTypeKey(puzzleId)) !== "detective-scene") return null;
  return loadSolution(puzzleId);
}

/** The one item a tap and a typed title find: its position, title and region, or `{ found: null }`. */
export async function findItem(
  puzzleId: string,
  tap: { x: number; y: number },
  typed: string,
) {
  const scene = await loadScene(puzzleId);
  if (!scene) return null;
  const position = matchFind(scene.items, scene.aliases, tap, typed);
  const item = scene.items.find((candidate) => candidate.position === position);
  return { found: item ? asFound(item) : null };
}

/** The positions a signed-in player has saved as found. */
async function savedFinds(userId: string, puzzleId: string) {
  const rows = await db
    .select({ position: detectiveSceneAttemptFound.position })
    .from(detectiveSceneAttemptFound)
    .innerJoin(attempts, eq(attempts.id, detectiveSceneAttemptFound.attemptId))
    .where(and(eq(attempts.userId, userId), eq(attempts.puzzleId, puzzleId)));
  return rows.map(({ position }) => position);
}

/**
 * The given items only, so saved finds can be ringed and listed again after a reload. A signed-in
 * player only gets items their saved attempt holds, so this can't stand in for a recorded reveal.
 */
export async function getFoundItems(
  userId: string | null,
  puzzleId: string,
  positions: number[],
) {
  const scene = await loadScene(puzzleId);
  if (!scene) return null;
  const allowed = userId ? await savedFinds(userId, puzzleId) : positions;
  return scene.items
    .filter(
      ({ position }) =>
        positions.includes(position) && allowed.includes(position),
    )
    .map(asFound);
}

/**
 * Every title and region. A signed-in player's reveal is recorded as a hint, once per attempt
 * and never after it is solved. Null when the puzzle is not a published detective scene.
 */
export async function revealItems(userId: string | null, puzzleId: string) {
  const scene = await loadScene(puzzleId);
  if (!scene) return null;
  if (userId) {
    const attempt = await getOrCreateAttempt(userId, puzzleId);
    if (!attempt.completedAt) {
      const revealed = await db.query.attemptHints.findFirst({
        where: { attemptId: attempt.id, kind: "reveal_all" },
        columns: { id: true },
      });
      if (!revealed) await recordHint(attempt.id, "reveal_all");
    }
  }
  return scene.items.map(asFound);
}
