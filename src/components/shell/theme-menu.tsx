"use client";

import { useOpenRequested } from "@/components/after-hydration";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeButton } from "./theme-button";
import { ThemeRadioGroup } from "./theme-radio-group";

export function ThemeMenu() {
  const openRequested = useOpenRequested();
  return (
    <DropdownMenu defaultOpen={openRequested}>
      <DropdownMenuTrigger asChild>
        <ThemeButton />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <ThemeRadioGroup />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
