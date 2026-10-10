"use client";

import { Deferred } from "@/components/after-hydration";
import type { Theme } from "@/utils/theme";
import { AccountButton } from "./account-button";

const loadDropdown = () =>
  import("./account-dropdown").then((module) => module.AccountDropdown);

export function AccountMenu({ name, theme }: { name: string; theme: Theme }) {
  return (
    <Deferred
      load={loadDropdown}
      props={{ name, theme }}
      fallback={<AccountButton name={name} />}
    />
  );
}
