"use client";

import { ChevronDownIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
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
import { ThemeRadioGroup } from "./theme-radio-group";

type AccountMenuProps = { name: string; theme: Theme };

export function AccountMenu({ name, theme }: AccountMenuProps) {
  const router = useRouter();

  async function signOut() {
    await authClient.signOut();
    writeThemeCookie(null);
    applyTheme(readStoredTheme());
    router.refresh();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="secondary" size="sm" className="max-w-40">
          <span className="truncate">{name}</span>
          <ChevronDownIcon aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <ThemeRadioGroup persistedTheme={theme} />
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={signOut}>Sign out</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
