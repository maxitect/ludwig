"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Toggle } from "@/components/ui/toggle";
import {
  ChessBoard,
  UncaptureTray,
  type RetroDrop,
  type UncaptureChoice,
} from "../_shared/chess-board";
import type { SolverProps } from "../solver-types";
import { toFen } from "./derive";
import { applyRetro, toRetro, type RetroRejection } from "./engine";
import type * as schema from "./schema";

type Ply = schema.Answer["plies"][number];
type Draft = {
  from: RetroDrop["from"];
  to: RetroDrop["to"];
  uncapture: UncaptureChoice;
  unpromote: boolean;
};

const REJECTION_TEXT: Record<RetroRejection, string> = {
  no_piece_on_to: "There is no piece there to move back.",
  wrong_side: "That piece belongs to the side to move, so it cannot have moved last.",
  origin_occupied: "Another piece is already standing on that square.",
  non_moving_side_in_check:
    "That would leave the side to move in check before the last move, which cannot happen.",
  illegal_uncapture: "That piece cannot have been captured there.",
  illegal_unpromote: "That piece cannot have been promoted there.",
  replay_mismatch: "That move could not have led to this position.",
  invalid_fen: "That position is not valid.",
};

const UNCAPTURE_CHOICES = [
  "none",
  "queen",
  "rook",
  "bishop",
  "knight",
  "pawn",
] as const satisfies readonly UncaptureChoice[];

const toPly = ({ from, to, uncapture, unpromote }: Draft): Ply => ({
  fromFile: from[0] as Ply["fromFile"],
  fromRank: Number(from[1]),
  toFile: to[0] as Ply["toFile"],
  toRank: Number(to[1]),
  uncapture: uncapture === "none" ? null : uncapture,
  unpromote,
  special: "none",
});

const toDraft = (ply: Ply): Draft => ({
  from: `${ply.fromFile}${ply.fromRank}`,
  to: `${ply.toFile}${ply.toRank}`,
  uncapture: ply.uncapture === "king" ? "none" : (ply.uncapture ?? "none"),
  unpromote: ply.unpromote,
});

function evaluate(fen: string, draft: Draft | null) {
  if (!draft) return { result: null, valid: null };
  const ply = toPly(draft);
  const result = applyRetro(fen, toRetro(ply));
  return { result, valid: result.ok ? ply : null };
}

export function Solver(props: SolverProps<typeof schema>) {
  if (props.payload.mode !== "last_move") {
    return <p>This kind of Reverse Chess puzzle is not open yet.</p>;
  }
  return <LastMove {...props} />;
}

function LastMove({
  payload,
  initialState,
  onStateChange,
  registerCheck,
}: SolverProps<typeof schema>) {
  const fen = useMemo(() => toFen(payload), [payload]);
  const [draft, setDraft] = useState<Draft | null>(() =>
    initialState?.plies[0] ? toDraft(initialState.plies[0]) : null,
  );
  const [rejection, setRejection] = useState<RetroRejection | null>(null);

  const { result, valid } = useMemo(() => evaluate(fen, draft), [draft, fen]);

  useEffect(() => {
    registerCheck(() => (valid ? { plies: [valid] } : null));
  }, [registerCheck, valid]);

  function update(next: Draft | null) {
    setDraft(next);
    setRejection(null);
    const nextValid = evaluate(fen, next).valid;
    onStateChange({ plies: nextValid ? [nextValid] : [] });
  }

  /** A drop is kept when some choice of uncapture or unpromotion makes it legal, so the player can then make that choice. */
  function drop({ from, to }: RetroDrop) {
    const variants = UNCAPTURE_CHOICES.flatMap((uncapture) =>
      [false, true].map((unpromote) => ({ from, to, uncapture, unpromote })),
    );
    const outcomes = variants.map((variant) =>
      applyRetro(fen, toRetro(toPly(variant))),
    );
    if (outcomes.some((outcome) => outcome.ok)) {
      return update({ from, to, uncapture: "none", unpromote: false });
    }
    const base = outcomes[0];
    setRejection(base.ok ? null : base.reason);
  }

  const message =
    rejection ?? (result && !result.ok ? result.reason : null);
  const needsChoice = message === "replay_mismatch" && draft !== null;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <p className="font-display text-2xl font-bold uppercase tracking-[0.04em]">
          What was the last move?
        </p>
        <p className="flex items-center gap-2" data-testid="side-to-move">
          <span
            aria-hidden="true"
            className={
              payload.sideToMove === "white"
                ? "size-4 border-2 border-border bg-paper"
                : "size-4 border-2 border-border bg-ink"
            }
          />
          <span>{payload.sideToMove === "white" ? "White" : "Black"} to move</span>
        </p>
      </div>

      <ChessBoard
        position={payload.pieces}
        onRetroDrop={drop}
        arrows={draft ? [{ from: draft.from, to: draft.to }] : []}
        highlights={draft ? [draft.from, draft.to] : []}
      />

      <div className="flex flex-col gap-3">
        <p className="font-display text-sm uppercase">
          Piece the move captured
        </p>
        <UncaptureTray
          colour={payload.sideToMove}
          value={draft?.uncapture}
          onChange={(uncapture) => draft && update({ ...draft, uncapture })}
        />
        <div className="flex flex-wrap gap-3">
          <Toggle
            pressed={draft?.unpromote ?? false}
            onPressedChange={(unpromote) =>
              draft && update({ ...draft, unpromote })
            }
          >
            Unpromote
          </Toggle>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={!draft}
            onClick={() => update(null)}
          >
            Undo
          </Button>
        </div>
      </div>

      <div role="status" aria-live="polite" className="min-h-6">
        {message && (
          <p data-testid="retro-message">
            {needsChoice
              ? "Choose the captured piece or an unpromotion for that move."
              : REJECTION_TEXT[message]}
          </p>
        )}
      </div>

      <p className="sr-only">
        Drag a piece back to where it came from, or pick it up with Enter,
        move with the arrow keys and drop it with Enter. Then press Check.
      </p>
    </div>
  );
}
