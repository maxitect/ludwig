"use client";

import { Toggle } from "@/components/ui/toggle";
import { UncaptureTray, type Colour } from "../_shared/chess-board";
import type { Draft } from "./retro-ply";

type PlyChoicesProps = {
  colour: Colour;
  draft: Draft | null;
  onChange: (draft: Draft) => void;
};

/** What the last retro move captured, and whether it undoes a promotion or an en passant capture. */
export function PlyChoices({ colour, draft, onChange }: PlyChoicesProps) {
  return (
    <div className="flex flex-col gap-3">
      <p className="font-display text-sm uppercase">Piece the move captured</p>
      <UncaptureTray
        colour={colour}
        value={draft?.uncapture}
        onChange={(uncapture) =>
          draft && onChange({ ...draft, uncapture, enPassant: false })
        }
      />
      <div className="flex flex-wrap gap-3">
        <Toggle
          pressed={draft?.unpromote ?? false}
          disabled={!draft}
          onPressedChange={(unpromote) => draft && onChange({ ...draft, unpromote })}
        >
          Unpromote
        </Toggle>
        <Toggle
          pressed={draft?.enPassant ?? false}
          disabled={!draft}
          onPressedChange={(enPassant) =>
            draft &&
            onChange({
              ...draft,
              enPassant,
              uncapture: enPassant ? "none" : draft.uncapture,
            })
          }
        >
          En passant
        </Toggle>
      </div>
    </div>
  );
}
