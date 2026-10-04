"use client";

import { useReducedMotion } from "motion/react";
import { useSyncExternalStore } from "react";
import { REDUCE_MOTION_ATTRIBUTE } from "./reduce-motion";

function subscribe(notify: () => void) {
  const observer = new MutationObserver(notify);
  observer.observe(document.documentElement, {
    attributeFilter: [REDUCE_MOTION_ATTRIBUTE],
  });
  return () => observer.disconnect();
}

const getSnapshot = () =>
  document.documentElement.hasAttribute(REDUCE_MOTION_ATTRIBUTE);

/** True when either the OS preference or the account's reduce_motion setting is on. */
export function useReduceMotion() {
  const os = useReducedMotion();
  const account = useSyncExternalStore(subscribe, getSnapshot, () => false);
  return Boolean(os) || account;
}
