"use server";

import { mergeLocalProgress as mergeProgress } from "@/lib/data/attempts";
import { requireUser } from "@/lib/data/user";
import { mergeEntriesSchema } from "@/lib/forms/local-progress";

/** Merges signed-out `localStorage` progress into the account, at most `MAX_MERGE_ENTRIES` entries per call. */
export async function mergeLocalProgress(
  entries: unknown,
): Promise<{ ok: true } | { ok: false; error: "invalid" }> {
  const user = await requireUser();
  const parsed = mergeEntriesSchema.safeParse(entries);
  if (!parsed.success) return { ok: false, error: "invalid" };
  await mergeProgress(user.id, parsed.data);
  return { ok: true };
}
