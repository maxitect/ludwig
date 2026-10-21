"use server";

import { z } from "zod";
import {
  findItem,
  getFoundItems,
  revealItems,
} from "@/lib/data/detective-scene";
import { getCurrentUser } from "@/lib/data/user";
import {
  attemptSchema,
  typedTitleSchema,
} from "@/puzzles/detective-scene/schema";

const puzzleIdSchema = z.uuid();
const tapSchema = z.object({ x: z.number().min(0), y: z.number().min(0) });

type ActionError = { ok: false; error: "invalid" | "not_found" };
const invalid: ActionError = { ok: false, error: "invalid" };
const notFound: ActionError = { ok: false, error: "not_found" };

/**
 * Matches a tap (in scene units) and a typed title against the stored items on the server.
 * Open to signed-out players like the other solve actions; the client records a find with `saveState`.
 */
export async function tryFind(
  puzzleId: string,
  x: number,
  y: number,
  typed: string,
) {
  const tap = tapSchema.safeParse({ x, y });
  const title = typedTitleSchema.safeParse(typed);
  if (
    !puzzleIdSchema.safeParse(puzzleId).success ||
    !tap.success ||
    !title.success
  ) {
    return invalid;
  }
  const result = await findItem(puzzleId, tap.data, title.data);
  return result ? { ok: true as const, ...result } : notFound;
}

/** The titles and regions of already found items, for ringing and listing them again after a reload. */
export async function loadFoundItems(puzzleId: string, found: number[]) {
  const parsed = attemptSchema.safeParse({ found });
  if (!puzzleIdSchema.safeParse(puzzleId).success || !parsed.success) {
    return invalid;
  }
  const items = await getFoundItems(puzzleId, parsed.data.found);
  return items ? { ok: true as const, items } : notFound;
}

/** Every title and region. Counts as a hint for a signed-in player; signed out, nothing is written. */
export async function revealScene(puzzleId: string) {
  if (!puzzleIdSchema.safeParse(puzzleId).success) return invalid;
  const user = await getCurrentUser();
  const items = await revealItems(user?.id ?? null, puzzleId);
  return items ? { ok: true as const, items } : notFound;
}
