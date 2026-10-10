"use client";

import Link from "next/link";
import { lazy } from "react";
import { AfterHydration } from "@/components/after-hydration";
import { ThemeButton } from "./theme-button";

const ThemeMenu = lazy(() =>
  import("./theme-menu").then((module) => ({ default: module.ThemeMenu })),
);

export function GuestMenu() {
  return (
    <div className="flex items-center gap-3">
      <Link href="/sign-in" className="underline underline-offset-4">
        Sign in
      </Link>
      <AfterHydration fallback={<ThemeButton />}>
        <ThemeMenu />
      </AfterHydration>
    </div>
  );
}
