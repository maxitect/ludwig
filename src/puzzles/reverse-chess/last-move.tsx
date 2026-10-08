"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { ChessBoard, SideToMove, type RetroDrop } from "../_shared/chess-board";
import type { SolverProps } from "../solver-types";
import { toFen } from "./derive";
import { applyRetro, toRetro, type RetroRejection } from "./engine";
import { PlyChoices } from "./ply-choices";
import {
  DROP_VARIANTS,
  REJECTION_TEXT,
  isKingAt,
  toDraft,
  toPly,
  type Draft,
} from "./retro-ply";
import type * as schema from "./schema";

function evaluate(fen: string, draft: Draft | null) {
  if (!draft) return { result: null, valid: null };
  const ply = toPly(draft, isKingAt(fen, draft.to));
  const result = applyRetro(fen, toRetro(ply));
  return { result, valid: result.ok ? ply : null };
}

export function LastMove({
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

  /** A drop is kept when some choice of uncapture, unpromotion or en passant makes it legal, so the player can then make that choice. */
  function drop({ from, to }: RetroDrop) {
    const isKing = isKingAt(fen, to);
    const outcomes = DROP_VARIANTS.map((variant) =>
      applyRetro(fen, toRetro(toPly({ from, to, ...variant }, isKing))),
    );
    if (outcomes.some((outcome) => outcome.ok)) {
      return update({
        from,
        to,
        uncapture: "none",
        unpromote: false,
        enPassant: false,
      });
    }
    const base = outcomes[0];
    setRejection(base.ok ? null : base.reason);
  }

  const message = rejection ?? (result && !result.ok ? result.reason : null);
  const needsChoice = message === "replay_mismatch" && draft !== null;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <p className="font-display text-2xl font-bold uppercase tracking-[0.04em]">
          What was the last move?
        </p>
        <SideToMove colour={payload.sideToMove} />
      </div>

      <ChessBoard
        position={payload.pieces}
        onRetroDrop={drop}
        arrows={draft ? [{ from: draft.from, to: draft.to }] : []}
        highlights={draft ? [draft.from, draft.to] : []}
      />

      <div className="flex flex-col gap-3">
        <PlyChoices
          colour={payload.sideToMove}
          draft={draft}
          onChange={update}
        />
        <div>
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
              ? "Choose the captured piece, an unpromotion or en passant for that move."
              : REJECTION_TEXT[message]}
          </p>
        )}
      </div>
    </div>
  );
}
