"use client";

import type { ReactNode } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

type ClueSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClosed: () => void;
  children: ReactNode;
};

/** The phone clue list. It lives apart from the solver so the dialog code loads on the first open. */
export function ClueSheet({
  open,
  onOpenChange,
  onClosed,
  children,
}: ClueSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        onOpenAutoFocus={(event) => {
          if (!(event.currentTarget instanceof HTMLElement)) return;
          const current = event.currentTarget.querySelector<HTMLElement>(
            "[aria-current=true]",
          );
          if (!current) return;
          event.preventDefault();
          current.focus();
        }}
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          onClosed();
        }}
      >
        <SheetHeader>
          <SheetTitle>Clues</SheetTitle>
          <SheetDescription className="sr-only">
            Choose a clue to jump to its entry.
          </SheetDescription>
        </SheetHeader>
        {children}
      </SheetContent>
    </Sheet>
  );
}
