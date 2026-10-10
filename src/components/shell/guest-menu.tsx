"use client";

import Link from "next/link";
import { Deferred } from "@/components/after-hydration";
import { ThemeButton } from "./theme-button";

const loadThemeMenu = () =>
  import("./theme-menu").then((module) => module.ThemeMenu);

export function GuestMenu() {
  return (
    <div className="flex items-center gap-3">
      <Link href="/sign-in" className="underline underline-offset-4">
        Sign in
      </Link>
      <Deferred load={loadThemeMenu} props={{}} fallback={<ThemeButton />} />
    </div>
  );
}
