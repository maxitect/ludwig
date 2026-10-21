import "server-only";
import { db } from "@/db";
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

/** The given items only, so saved finds can be ringed and listed again after a reload. */
export async function getFoundItems(puzzleId: string, positions: number[]) {
  const scene = await loadScene(puzzleId);
  if (!scene) return null;
  return scene.items
    .filter(({ position }) => positions.includes(position))
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
