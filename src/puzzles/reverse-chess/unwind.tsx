"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { ChessBoard, SideToMove, type RetroDrop } from "../_shared/chess-board";
import type { SolverProps } from "../solver-types";
import { fromFen, notateRetro, toFen } from "./derive";
import { stepRetro, toRetro, type RetroRejection } from "./engine";
import { NotationToggle, useChessNotation } from "./notation-toggle";
import { PlyChoices } from "./ply-choices";
import {
  REJECTION_TEXT,
  isKingAt,
  toDraft,
  toPly,
  type Draft,
  type Ply,
} from "./retro-ply";
import type * as schema from "./schema";

type Invalid = { index: number; reason: RetroRejection };

/** Applies the plies in order and stops at the first one that cannot be taken back. */
function walk(fen: string, plies: readonly Ply[]) {
  const positions = [fen];
  for (const [index, ply] of plies.entries()) {
    const result = stepRetro(positions[index], toRetro(ply), index > 0);
    if (!result.ok) {
      return { positions, invalid: { index, reason: result.reason } as Invalid };
    }
    positions.push(result.prior);
  }
  return { positions, invalid: null };
}

const square = (file: string, rank: number) => `${file}${rank}`;

export function Unwind({
  payload,
  initialState,
  chessNotation,
  onStateChange,
  registerCheck,
}: SolverProps<typeof schema>) {
  const fen = useMemo(() => toFen(payload), [payload]);
  const [plies, setPlies] = useState<Ply[]>(() => initialState?.plies ?? []);
  const [checked, setChecked] = useState(false);
  const { notation, choose, failed } = useChessNotation(chessNotation);

  const { positions, invalid } = useMemo(() => walk(fen, plies), [fen, plies]);
  const board = positions[positions.length - 1];
  const last = plies[plies.length - 1];
  const lastBase = positions[Math.min(plies.length, positions.length) - 1];
  const canAdd = !invalid && plies.length < payload.plyCount;

  useEffect(() => {
    registerCheck(() => {
      if (!plies.length) return null;
      setChecked(true);
      return invalid || plies.length === payload.plyCount ? { plies } : null;
    });
  }, [registerCheck, plies, invalid, payload.plyCount]);

  function update(next: Ply[]) {
    setPlies(next);
    setChecked(false);
    onStateChange({ plies: next });
  }

  function drop({ from, to }: RetroDrop) {
    if (!canAdd) return;
    const draft: Draft = {
      from,
      to,
      uncapture: "none",
      unpromote: false,
      enPassant: false,
    };
    update([...plies, toPly(draft, isKingAt(board, to))]);
  }

  function editLast(draft: Draft) {
    update([...plies.slice(0, -1), toPly(draft, isKingAt(lastBase, draft.to))]);
  }

  const startingSide = fromFen(fen).sideToMove;
  const moverOf = (index: number) =>
    (index % 2 === 0) === (startingSide === "white") ? "Black" : "White";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <p className="font-display text-2xl font-bold uppercase tracking-[0.04em]">
          Take back {payload.plyCount} half-moves
        </p>
        {payload.goalText && (
          <p data-testid="goal">Goal: {payload.goalText}</p>
        )}
        <SideToMove colour={payload.sideToMove} />
      </div>

      <ChessBoard
        position={fromFen(board).pieces}
        onRetroDrop={drop}
        interactive={canAdd}
        arrows={last ? [{ from: endpoints(last).from, to: endpoints(last).to }] : []}
        highlights={last ? [endpoints(last).from, endpoints(last).to] : []}
      />

      <div className="flex flex-col gap-3">
        <p className="font-display text-sm uppercase">
          Moves taken back ({plies.length} of {payload.plyCount})
        </p>
        <ol className="flex flex-col gap-1" data-testid="retro-chain">
          {plies.map((entry, index) => {
            const flagged = checked && invalid?.index === index;
            const text =
              index < positions.length - 1
                ? notateRetro(
                    notation,
                    toRetro(entry),
                    positions[index],
                    positions[index + 1],
                  )
                : `${endpoints(entry).from}-${endpoints(entry).to}`;
            return (
              <li
                key={index}
                data-testid="retro-step"
                data-flagged={flagged || undefined}
                className="flex flex-wrap items-baseline gap-x-3"
              >
                <span className="font-mono tabular-nums">{index + 1}.</span>
                <span>{moverOf(index)}</span>
                <span className="font-mono">{text}</span>
                {flagged && invalid && (
                  <span
                    role="alert"
                    className="font-semibold underline decoration-ludwig-red decoration-2 underline-offset-4"
                  >
                    Step {index + 1} is not possible. {REJECTION_TEXT[invalid.reason]}
                  </span>
                )}
              </li>
            );
          })}
        </ol>
        <div>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={!plies.length}
            onClick={() => update(plies.slice(0, -1))}
          >
            Undo
          </Button>
        </div>
      </div>

      <PlyChoices
        colour={fromFen(lastBase ?? fen).sideToMove}
        draft={last ? toDraft(last) : null}
        onChange={editLast}
      />

      <NotationToggle notation={notation} failed={failed} onChoose={choose} />
    </div>
  );
}

function endpoints(entry: Ply) {
  return {
    from: square(entry.fromFile, entry.fromRank) as Draft["from"],
    to: square(entry.toFile, entry.toRank) as Draft["to"],
  };
}
