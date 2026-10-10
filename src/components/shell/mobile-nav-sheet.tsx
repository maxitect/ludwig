"use client";

import Link from "next/link";
import { type ComponentProps, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { navLinks } from "@/config/nav";
import { InstallHint } from "./install-hint";
import { MenuButton } from "./menu-button";

export type MobileNavProps = {
  collectionTransitionTypes?: ComponentProps<typeof Link>["transitionTypes"];
};

export function MobileNavSheet({ collectionTransitionTypes }: MobileNavProps) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <MenuButton />
      </SheetTrigger>
      <SheetContent
        side="bottom"
        className="pb-[env(safe-area-inset-bottom)]"
      >
        <SheetHeader>
          <SheetTitle>Menu</SheetTitle>
          <SheetDescription className="sr-only">
            Site navigation
          </SheetDescription>
        </SheetHeader>
        <nav aria-label="Primary" className="flex flex-col pb-4">
          {navLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              transitionTypes={
                href === "/puzzles" ? collectionTransitionTypes : undefined
              }
              onClick={() => setOpen(false)}
              className="px-4 py-3 font-display text-lg font-semibold tracking-[0.04em] uppercase hover:bg-foreground hover:text-background focus-visible:outline-3 focus-visible:outline-solid focus-visible:-outline-offset-3 focus-visible:outline-ring"
            >
              {label}
            </Link>
          ))}
        </nav>
        <InstallHint />
      </SheetContent>
    </Sheet>
  );
}
