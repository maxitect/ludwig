import {
  type LocalProgress,
  localProgressSchema,
  type MergeEntry,
} from "@/lib/forms/local-progress";
import { getAttemptSchema } from "@/puzzles/attempt-schemas";

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

function parseEntry(key: string): LocalProgress | null {
  const raw = guarded(() => localStorage.getItem(key), null);
  if (raw === null) return null;
  try {
    const entry = localProgressSchema.parse(JSON.parse(raw));
    const attemptSchema = getAttemptSchema(entry.typeKey);
    if (!attemptSchema) throw new Error("No attempt schema for the type");
    return { ...entry, state: attemptSchema.parse(entry.state) };
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
  const existing = readProgress(puzzleId);
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
  const existing = readProgress(puzzleId);
  if (!existing || existing.completedAt !== undefined) return;
  writeEntry(puzzleId, { ...existing, completedAt: Date.now(), durationMs });
}

export function clearProgress(puzzleId: string) {
  removeKey(PREFIX + puzzleId);
}

export function readAllProgress(): MergeEntry[] {
  const keys = guarded(
    () => Object.keys(localStorage).filter((key) => key.startsWith(PREFIX)),
    [],
  );
  return keys.flatMap((key) => {
    const entry = parseEntry(key);
    return entry ? [{ ...entry, puzzleId: key.slice(PREFIX.length) }] : [];
  });
}
