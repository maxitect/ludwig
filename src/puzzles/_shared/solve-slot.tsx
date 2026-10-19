"use client";

import {
  createContext,
  useContext,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

const SolveSlotContext = createContext<HTMLElement | null>(null);

export const SolveSlotProvider = SolveSlotContext.Provider;

const subscribe = () => () => {};

/**
 * Renders its children into the solve page's bottom slot, above the safe area and the system keyboard. Renders nothing where there is no slot.
 * `fallback` is shown in place on the server and while hydrating, so the first HTML has the slot's key content before the portal exists.
 */
export function SolveSlot({
  children,
  fallback,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const slot = useContext(SolveSlotContext);
  const hydrated = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
  if (!hydrated) return fallback;
  return slot ? createPortal(children, slot) : null;
}
