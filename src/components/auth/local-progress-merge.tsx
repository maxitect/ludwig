"use client";

import { useEffect } from "react";
import { mergeLocalProgress } from "@/lib/actions/merge";
import { clearProgress, readAllProgress } from "@/utils/local-progress";

/** Moves signed-out progress into the account once a session exists, then clears it from the store. Its validation code loads only when a saved entry exists. */
export function LocalProgressMerge() {
  useEffect(() => {
    async function merge() {
      const entries = await readAllProgress();
      if (entries.length === 0) return;
      const { MAX_MERGE_ENTRIES } = await import("@/lib/forms/local-progress");
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
