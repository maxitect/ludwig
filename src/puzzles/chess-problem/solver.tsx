"use client";

import { Chess, type Move } from "chess.js";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { useReduceMotion } from "@/utils/use-reduce-motion";
import type { RetroDrop, Square } from "../_shared/chess-board";
import { DeferredChessBoard } from "../_shared/chess-board/deferred-chess-board";
import { fromFen } from "../_shared/chess-fen";
import { toDescriptive } from "../reverse-chess/derive";
import { NotationToggle, useChessNotation } from "../reverse-chess/notation-toggle";
import { SideToMove } from "../reverse-chess/side-to-move";
import type { SolverProps } from "../solver-types";
import { moveToPly, plyLabel, plyToMove, toFen } from "./derive";
import { defence, type MoveInput } from "./engine";
import type * as schema from "./schema";

const REPLY_DELAY_MS = 700;

const PROMOTIONS = [
  { promotion: "q", label: "Queen" },
  { promotion: "r", label: "Rook" },
  { promotion: "b", label: "Bishop" },
  { promotion: "n", label: "Knight" },
] as const;

const checkMark = (san: string) => san.match(/[+#]$/)?.[0] ?? "";

function replay(fen: string, plies: readonly schema.AttemptPly[]) {
  const chess = new Chess(fen);
  const steps: { move: Move; prior: string }[] = [];
  for (const ply of plies) {
    const prior = chess.fen();
    try {
      steps.push({ move: chess.move(plyToMove(ply)), prior });
    } catch {
      break;
    }
  }
  return { steps, chess };
}

export function Solver({
  payload,
  initialState,
  chessNotation,
  onStateChange,
  registerCheck,
  requestCheck,
  requestReset,
  solved,
  wrongParts,
}: SolverProps<typeof schema>) {
  const start = useMemo(() => toFen(payload), [payload]);
  const [plies, setPlies] = useState<schema.AttemptPly[]>(
    () => initialState?.plies ?? [],
  );
  const [promoting, setPromoting] = useState<RetroDrop | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const { notation, choose, failed } = useChessNotation(chessNotation);
  const reducedMotion = useReduceMotion();

  const { steps, chess } = useMemo(() => replay(start, plies), [start, plies]);
  const fen = chess.fen();
  const whiteMoves = Math.ceil(steps.length / 2);
  const finished =
    steps.length > 0 &&
    (chess.isGameOver() ||
      (steps.length % 2 === 1 && whiteMoves >= payload.mateIn));
  const whiteToMove = chess.turn() === "w";
  const last = steps[steps.length - 1]?.move;
  const wrongPly = wrongParts?.[0]?.ply;

  useEffect(() => {
    registerCheck(() => (finished ? { plies } : null));
  }, [registerCheck, finished, plies]);

  useEffect(() => {
    if (finished && !solved) requestCheck?.();
  }, [finished, solved, requestCheck]);

  useEffect(() => {
    if (whiteToMove || finished || solved) return;
    const timer = setTimeout(
      () => {
        const reply = defence(fen, payload.mateIn - whiteMoves);
        if (!reply) return;
        const next = [...plies, moveToPly(reply)];
        setPlies(next);
        onStateChange({ plies: next });
        setAnnouncement(
          `Black replies ${reply.san}. Your move ${plyLabel(next.length)}.`,
        );
      },
      reducedMotion ? 0 : REPLY_DELAY_MS,
    );
    return () => clearTimeout(timer);
  }, [
    whiteToMove,
    finished,
    solved,
    fen,
    plies,
    whiteMoves,
    payload.mateIn,
    reducedMotion,
    onStateChange,
  ]);

  function play(move: MoveInput) {
    const next = [...plies, moveToPly(move)];
    const { steps: after, chess: result } = replay(start, next);
    setPlies(next);
    setMessage(null);
    onStateChange({ plies: next });
    const played = after[after.length - 1]?.move;
    setAnnouncement(
      result.isCheckmate()
        ? `You played ${played?.san}. Checkmate.`
        : `You played ${played?.san}.`,
    );
  }

  function drop({ from, to }: RetroDrop) {
    if (!whiteToMove || finished || solved || promoting) return;
    const options = chess
      .moves({ verbose: true })
      .filter((move) => move.from === from && move.to === to);
    if (!options.length) {
      setMessage("That move is not legal.");
      return;
    }
    if (options[0].promotion) return setPromoting({ from, to });
    play({ from: options[0].from, to: options[0].to });
  }

  function promote(promotion: Move["promotion"]) {
    if (!promoting) return;
    play({ ...promoting, promotion });
    setPromoting(null);
  }

  function undo() {
    const next = plies.slice(0, plies.length % 2 === 1 ? -1 : -2);
    setPlies(next);
    setPromoting(null);
    setMessage(null);
    onStateChange({ plies: next });
    setAnnouncement("Move taken back.");
  }

  const text = ({ move, prior }: (typeof steps)[number]) =>
    notation === "algebraic"
      ? move.san
      : `${toDescriptive(move, prior)}${checkMark(move.san)}`;

  const failure =
    wrongPly === undefined
      ? null
      : wrongPly === 1
        ? "That doesn't force mate."
        : "That move doesn't give mate.";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <p className="font-display text-2xl font-bold uppercase tracking-[0.04em]">
          White to play and mate in {payload.mateIn}
        </p>
        <div className="flex items-center justify-between gap-3">
          <SideToMove colour={whiteToMove ? "white" : "black"} />
          <div className="hidden gap-2 touch:flex">
            <Button size="sm" onClick={requestCheck} disabled={solved}>
              Check
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={requestReset}
              disabled={solved}
            >
              Reset
            </Button>
          </div>
        </div>
      </div>

      <DeferredChessBoard
        position={fromFen(fen).pieces}
        onMove={drop}
        highlights={last ? [last.from as Square, last.to as Square] : []}
      />

      {promoting && (
        <div
          role="group"
          aria-label="Promote the pawn to"
          className="flex flex-wrap gap-3"
        >
          {PROMOTIONS.map(({ promotion, label }) => (
            <Button
              key={promotion}
              size="sm"
              variant="secondary"
              onClick={() => promote(promotion)}
            >
              {label}
            </Button>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-3">
        <p className="font-display text-sm uppercase">Your line</p>
        <ol className="flex flex-col gap-1" data-testid="line">
          {steps.map((step, index) => {
            const flagged =
              wrongPly !== undefined && wrongPly === index + 1;
            return (
              <li
                key={index}
                data-testid="line-ply"
                data-flagged={flagged || undefined}
                className="flex flex-wrap items-baseline gap-x-3"
              >
                <span className="font-mono tabular-nums">
                  {plyLabel(index)}
                </span>
                <span>{index % 2 === 0 ? "White" : "Black"}</span>
                <span className="font-mono">{text(step)}</span>
              </li>
            );
          })}
        </ol>
        <div>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={!plies.length || solved}
            onClick={undo}
          >
            Undo
          </Button>
        </div>
      </div>

      <NotationToggle notation={notation} failed={failed} onChoose={choose} />

      <div role="status" aria-live="polite" className="min-h-6">
        <p data-testid="problem-message">{message ?? failure ?? announcement}</p>
      </div>
    </div>
  );
}
