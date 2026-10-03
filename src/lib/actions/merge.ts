"use server";

import { mergeLocalProgress as mergeProgress } from "@/lib/data/attempts";
import { requireUser } from "@/lib/data/user";
import { mergeEntriesSchema } from "@/lib/forms/local-progress";

/** Merges signed-out `localStorage` progress into the account, at most `MAX_MERGE_ENTRIES` entries per call. */
export async function mergeLocalProgress(
  entries: unknown,
): Promise<{ ok: true } | { ok: false; error: "invalid" }> {
  await requireUser();
  const parsed = mergeEntriesSchema.safeParse(entries);
  if (!parsed.success) return { ok: false, error: "invalid" };
  await mergeProgress(parsed.data);
  return { ok: true };
}
