"use client";

import { useOpenRequested } from "@/components/after-hydration";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { setDeviceKeyboard } from "@/puzzles/_shared/puzzle-keyboard";
import { PuzzleMenuButton } from "./puzzle-menu-button";

export type PuzzleMenuProps = {
  pending: boolean;
  solved: boolean;
  deviceKeyboard: boolean;
  onCheck: () => void;
  onReset: () => void;
};

export function PuzzleMenu({
  pending,
  solved,
  deviceKeyboard,
  onCheck,
  onReset,
}: PuzzleMenuProps) {
  const openRequested = useOpenRequested();
  return (
    <DropdownMenu defaultOpen={openRequested}>
      <DropdownMenuTrigger asChild>
        <PuzzleMenuButton />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem disabled={pending || solved} onSelect={onCheck}>
          Check
        </DropdownMenuItem>
        <DropdownMenuItem disabled={pending} onSelect={onReset}>
          Reset
        </DropdownMenuItem>
        <DropdownMenuSeparator />
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
