"use client";

import { useEffect } from "react";
import { mergeLocalProgress } from "@/lib/actions/merge";

/** Moves signed-out progress into the account once a session exists, then clears it from the store. Its validation code loads only when a saved entry exists. */
export function LocalProgressMerge() {
  useEffect(() => {
    async function merge() {
      const hasProgress = Object.keys(localStorage).some((key) =>
        key.startsWith("ludwig:progress:"),
      );
      if (!hasProgress) return;
      const [{ clearProgress, readAllProgress }, { MAX_MERGE_ENTRIES }] =
        await Promise.all([
          import("@/utils/local-progress"),
          import("@/lib/forms/local-progress"),
        ]);
      const entries = await readAllProgress();
      for (let i = 0; i < entries.length; i += MAX_MERGE_ENTRIES) {
        const batch = entries.slice(i, i + MAX_MERGE_ENTRIES);
        const result = await mergeLocalProgress(batch);
        if (!result.ok) return;
        for (const { puzzleId } of batch) clearProgress(puzzleId);
      }
    }
    merge().catch(() => undefined);
  }, []);

  return null;
}
