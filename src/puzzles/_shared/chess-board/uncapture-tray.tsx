"use client";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { PieceGlyph } from "./pieces";
import type { Colour, PieceKind } from "./squares";

const UNCAPTURE_PIECES = [
  "queen",
  "rook",
  "bishop",
  "knight",
  "pawn",
] as const satisfies readonly PieceKind[];

export type UncaptureChoice = (typeof UNCAPTURE_PIECES)[number] | "none";

const isChoice = (value: string): value is UncaptureChoice =>
  value === "none" || UNCAPTURE_PIECES.some((piece) => piece === value);

/** Offers the piece that stood on the vacated square: a piece of `colour` (the side not moving), or none. */
export function UncaptureTray({
  colour,
  value,
  onChange,
}: {
  colour: Colour;
  value?: UncaptureChoice;
  onChange: (choice: UncaptureChoice) => void;
}) {
  return (
    <ToggleGroup
      type="single"
      value={value ?? ""}
      onValueChange={(next) => isChoice(next) && onChange(next)}
      aria-label="Uncaptured piece"
    >
      {UNCAPTURE_PIECES.map((piece) => (
        <ToggleGroupItem
          key={piece}
          value={piece}
          aria-label={`${colour} ${piece}`}
          className="size-12 data-[state=on]:bg-paper-deep"
        >
          <span className="block size-9">
            <PieceGlyph colour={colour} piece={piece} shadow={false} />
          </span>
        </ToggleGroupItem>
      ))}
      <ToggleGroupItem
        value="none"
        className="h-12 data-[state=on]:bg-paper-deep data-[state=on]:text-ink"
      >
        None
      </ToggleGroupItem>
    </ToggleGroup>
  );
}
