"use client";

import { Deferred } from "@/components/after-hydration";
import { MenuButton } from "./menu-button";
import type { MobileNavProps } from "./mobile-nav-sheet";

const loadSheet = () =>
  import("./mobile-nav-sheet").then((module) => module.MobileNavSheet);

export function MobileNav({ collectionTransitionTypes }: MobileNavProps) {
  return (
    <Deferred
      load={loadSheet}
      props={{ collectionTransitionTypes }}
      fallback={<MenuButton />}
    />
  );
}
