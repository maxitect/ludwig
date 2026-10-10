"use client";

import { useOpenRequested } from "@/components/after-hydration";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { setDeviceKeyboard } from "@/puzzles/_shared/puzzle-keyboard";
import { PuzzleMenuButton } from "./puzzle-menu-button";

export type PuzzleMenuProps = {
  deviceKeyboard: boolean;
};

export function PuzzleMenu({ deviceKeyboard }: PuzzleMenuProps) {
  const openRequested = useOpenRequested();
  return (
    <DropdownMenu defaultOpen={openRequested}>
      <DropdownMenuTrigger asChild>
        <PuzzleMenuButton />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuCheckboxItem
          checked={deviceKeyboard}
          onCheckedChange={setDeviceKeyboard}
        >
          Use my device&apos;s keyboard
        </DropdownMenuCheckboxItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
