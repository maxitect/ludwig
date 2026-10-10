import type { LocalProgress, MergeEntry } from "@/lib/forms/local-progress";

const PREFIX = "ludwig:progress:";

/** Runs a storage access, returning `fallback` when storage is unavailable. */
function guarded<T>(access: () => T, fallback: T): T {
  try {
    return access();
  } catch {
    return fallback;
  }
}

const removeKey = (key: string) =>
  guarded(() => localStorage.removeItem(key), undefined);

/** Reads the stored entry with a cheap shape check. Zod loads on demand in `parseEntry`, so saving progress never pulls it into the solve page. */
function readEntry(key: string): LocalProgress | null {
  const raw = guarded(() => localStorage.getItem(key), null);
  if (raw === null) return null;
  try {
    const entry: unknown = JSON.parse(raw);
    if (
      typeof entry === "object" &&
      entry !== null &&
      "typeKey" in entry &&
      typeof entry.typeKey === "string" &&
      "startedAt" in entry &&
      typeof entry.startedAt === "number"
    ) {
      return entry as LocalProgress;
    }
  } catch {
    // falls through to discard the unreadable entry
  }
  removeKey(key);
  return null;
}

/** Validates the stored entry and its state, loading the schemas on demand so the table definitions and zod stay out of the shared bundle. */
async function parseEntry(key: string): Promise<LocalProgress | null> {
  const entry = readEntry(key);
  if (entry === null) return null;
  try {
    const [{ localProgressSchema }, { getAttemptSchema }] = await Promise.all([
      import("@/lib/forms/local-progress"),
      import("@/puzzles/attempt-schemas"),
    ]);
    const valid = localProgressSchema.parse(entry);
    const attemptSchema = getAttemptSchema(valid.typeKey);
    if (!attemptSchema) throw new Error("No attempt schema for the type");
    return { ...valid, state: attemptSchema.parse(valid.state) };
  } catch {
    removeKey(key);
    return null;
  }
}

function writeEntry(puzzleId: string, entry: LocalProgress) {
  guarded(
    () => localStorage.setItem(PREFIX + puzzleId, JSON.stringify(entry)),
    undefined,
  );
}

export function readProgress(puzzleId: string) {
  return parseEntry(PREFIX + puzzleId);
}

export function writeProgress(
  puzzleId: string,
  typeKey: string,
  state: unknown,
) {
  const existing = readEntry(PREFIX + puzzleId);
  writeEntry(puzzleId, {
    typeKey,
    state,
    startedAt: existing?.startedAt ?? Date.now(),
    completedAt: existing?.completedAt,
    durationMs: existing?.durationMs,
  });
}

/** Marks the stored entry complete once. A puzzle with no stored entry stays unmarked. */
export function completeProgress(puzzleId: string, durationMs: number) {
  const existing = readEntry(PREFIX + puzzleId);
  if (!existing || existing.completedAt !== undefined) return;
  writeEntry(puzzleId, { ...existing, completedAt: Date.now(), durationMs });
}

export function clearProgress(puzzleId: string) {
  removeKey(PREFIX + puzzleId);
}

export async function readAllProgress(): Promise<MergeEntry[]> {
  const keys = guarded(
    () => Object.keys(localStorage).filter((key) => key.startsWith(PREFIX)),
    [],
  );
  if (keys.length === 0) return [];
  const { mergeEntrySchema } = await import("@/lib/forms/local-progress");
  const entries = await Promise.all(
    keys.map(async (key) => {
      const puzzleId = key.slice(PREFIX.length);
      if (!mergeEntrySchema.shape.puzzleId.safeParse(puzzleId).success) {
        removeKey(key);
        return [];
      }
      const entry = await parseEntry(key);
      return entry ? [{ ...entry, puzzleId }] : [];
    }),
  );
  return entries.flat();
}
