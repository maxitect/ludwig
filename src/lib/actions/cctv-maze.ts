"use server";

import { z } from "zod";
import { recordCameraReveal } from "@/lib/data/cctv-maze";
import { getCurrentUser } from "@/lib/data/user";

const puzzleIdSchema = z.uuid();

/**
 * Counts showing the camera cones as a hint. Signed out, nothing is written: the cones simply show.
 */
export async function revealCameras(
  puzzleId: string,
): Promise<{ ok: true } | { ok: false; error: "invalid" | "not_found" }> {
  const user = await getCurrentUser();
  if (!puzzleIdSchema.safeParse(puzzleId).success) {
    return { ok: false, error: "invalid" };
  }
  if (!user) return { ok: true };
  const recorded = await recordCameraReveal(user.id, puzzleId);
  return recorded ? { ok: true } : { ok: false, error: "not_found" };
}
