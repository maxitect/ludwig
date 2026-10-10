"use client";

import { useRouter } from "next/navigation";
import { useOpenRequested } from "@/components/after-hydration";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { authClient } from "@/lib/auth-client";
import {
  applyTheme,
  readStoredTheme,
  writeThemeCookie,
  type Theme,
} from "@/utils/theme";
import { applyReduceMotion } from "@/utils/reduce-motion";
import { AccountButton } from "./account-button";
import { ThemeRadioGroup } from "./theme-radio-group";

type AccountDropdownProps = { name: string; theme: Theme };

export function AccountDropdown({ name, theme }: AccountDropdownProps) {
  const router = useRouter();
  const openRequested = useOpenRequested();

  async function signOut() {
    await authClient.signOut();
    writeThemeCookie(null);
    applyReduceMotion(false);
    applyTheme(readStoredTheme());
    router.refresh();
  }

  return (
    <DropdownMenu defaultOpen={openRequested}>
      <DropdownMenuTrigger asChild>
        <AccountButton name={name} />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <ThemeRadioGroup persistedTheme={theme} />
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={signOut}>Sign out</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
