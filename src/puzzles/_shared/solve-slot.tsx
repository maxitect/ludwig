"use client";

import { createContext, useContext, type ReactNode } from "react";
import { createPortal } from "react-dom";

const SolveSlotContext = createContext<HTMLElement | null>(null);

export const SolveSlotProvider = SolveSlotContext.Provider;

/** Renders its children into the solve page's bottom slot, above the safe area and the system keyboard. Renders nothing where there is no slot. */
export function SolveSlot({ children }: { children: ReactNode }) {
  const slot = useContext(SolveSlotContext);
  return slot ? createPortal(children, slot) : null;
}
