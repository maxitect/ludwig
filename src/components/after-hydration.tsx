"use client";

import { type ReactNode, Suspense, useSyncExternalStore } from "react";

const subscribeNever = () => () => {};

/** Shows `fallback` through hydration, then mounts `children` (typically a `lazy` component), so their code stays out of the first load. */
export function AfterHydration({
  fallback,
  children,
}: {
  fallback: ReactNode;
  children: ReactNode;
}) {
  const hydrated = useSyncExternalStore(
    subscribeNever,
    () => true,
    () => false,
  );
  return hydrated ? <Suspense fallback={fallback}>{children}</Suspense> : fallback;
}
