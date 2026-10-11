"use server";

import { z } from "zod";
import { getFoundRegions, hitTestScene } from "@/lib/data/spot-difference";
import { attemptSchema } from "@/puzzles/spot-difference/schema";

const puzzleIdSchema = z.uuid();
const tapSchema = z.object({ x: z.number().min(0), y: z.number().min(0) });

type ActionError = { ok: false; error: "invalid" | "not_found" };
const invalid: ActionError = { ok: false, error: "invalid" };
const notFound: ActionError = { ok: false, error: "not_found" };

/**
 * Hit-tests a tap, in scene pixels, against the stored regions on the server.
 * Open to signed-out players like the other solve actions; the client records a find with `saveState`.
 */
export async function tapScene(puzzleId: string, x: number, y: number) {
  const point = tapSchema.safeParse({ x, y });
  if (!puzzleIdSchema.safeParse(puzzleId).success || !point.success) {
    return invalid;
  }
  const result = await hitTestScene(puzzleId, point.data);
  return result ? { ok: true as const, ...result } : notFound;
}

/** The regions of already found differences, for circling them again after a reload. */
export async function loadFoundRegions(puzzleId: string, found: number[]) {
  const parsed = attemptSchema.safeParse({ found });
  if (!puzzleIdSchema.safeParse(puzzleId).success || !parsed.success) {
    return invalid;
  }
  const regions = await getFoundRegions(puzzleId, parsed.data.found);
  return regions ? { ok: true as const, regions } : notFound;
}
