"use client";

import { useLayoutEffect } from "react";
import { applyReduceMotion } from "@/utils/reduce-motion";

/** Mirrors the signed-in account's reduce_motion setting onto the root attribute that CSS and `useReduceMotion` read. */
export function ReduceMotionSync({ reduceMotion }: { reduceMotion: boolean }) {
  useLayoutEffect(() => {
    applyReduceMotion(reduceMotion);
  }, [reduceMotion]);

  return null;
}
