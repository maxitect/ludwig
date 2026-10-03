import { z } from "zod";

export const MAX_MERGE_ENTRIES = 200;
const MAX_DURATION_MS = 2 ** 31 - 1;

export const localProgressSchema = z.object({
  typeKey: z.string().min(1).max(64),
  state: z.unknown(),
  startedAt: z.number().int().nonnegative(),
  completedAt: z.number().int().nonnegative().optional(),
  durationMs: z.number().int().nonnegative().max(MAX_DURATION_MS).optional(),
});

export const mergeEntrySchema = localProgressSchema.extend({
  puzzleId: z.uuid(),
});

export const mergeEntriesSchema = z
  .array(mergeEntrySchema)
  .max(MAX_MERGE_ENTRIES);

export type LocalProgress = z.infer<typeof localProgressSchema>;
export type MergeEntry = z.infer<typeof mergeEntrySchema>;
