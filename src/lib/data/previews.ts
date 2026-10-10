import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { getPuzzleModule } from "@/puzzles/registry";

/** The payload alone, never the solution. Session-independent, so every shelf card shares one cached entry. */
export async function getPuzzlePayload(typeKey: string, puzzleId: string) {
  "use cache";
  cacheLife("minutes");
  cacheTag("puzzles");
  return getPuzzleModule(typeKey).load(puzzleId);
}
