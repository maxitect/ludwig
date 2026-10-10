"use client";

import { lazy } from "react";
import { AfterHydration } from "@/components/after-hydration";
import type { Theme } from "@/utils/theme";
import { AccountButton } from "./account-button";

const AccountDropdown = lazy(() =>
  import("./account-dropdown").then((module) => ({
    default: module.AccountDropdown,
  })),
);

export function AccountMenu({ name, theme }: { name: string; theme: Theme }) {
  return (
    <AfterHydration fallback={<AccountButton name={name} />}>
      <AccountDropdown name={name} theme={theme} />
    </AfterHydration>
  );
}
