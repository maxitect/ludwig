"use client";

import { lazy } from "react";
import { AfterHydration } from "@/components/after-hydration";
import { MenuButton } from "./menu-button";
import type { MobileNavProps } from "./mobile-nav-sheet";

const MobileNavSheet = lazy(() =>
  import("./mobile-nav-sheet").then((module) => ({
    default: module.MobileNavSheet,
  })),
);

export function MobileNav({ collectionTransitionTypes }: MobileNavProps) {
  return (
    <AfterHydration fallback={<MenuButton />}>
      <MobileNavSheet collectionTransitionTypes={collectionTransitionTypes} />
    </AfterHydration>
  );
}
