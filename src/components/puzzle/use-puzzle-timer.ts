"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const TICK_MS = 250;

/** Counts elapsed play time while `running`, pausing whenever the tab is hidden. */
export function usePuzzleTimer(running: boolean) {
  const [displayMs, setDisplayMs] = useState(0);
  const elapsed = useRef(0);
  const markedAt = useRef<number | null>(null);

  const settle = useCallback(() => {
    const now = performance.now();
    if (markedAt.current !== null) elapsed.current += now - markedAt.current;
    markedAt.current = document.hidden ? null : now;
    return Math.floor(elapsed.current);
  }, []);

  useEffect(() => {
    if (!running) return;
    const sync = () => setDisplayMs(settle());
    sync();
    const interval = setInterval(sync, TICK_MS);
    document.addEventListener("visibilitychange", sync);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", sync);
      settle();
      markedAt.current = null;
    };
  }, [running, settle]);

  const reset = useCallback(() => {
    elapsed.current = 0;
    markedAt.current = document.hidden ? null : performance.now();
    setDisplayMs(0);
  }, []);

  return { displayMs, read: settle, reset };
}
