"use client";

import { Deferred } from "@/components/after-hydration";
import { CHESS_BOARD_SIZE } from "./board-size";
import type { ChessBoardProps } from "./chess-board";

const loadChessBoard = () =>
  import("./chess-board").then((module) => module.ChessBoard);

/** The solve-page board. The chessboard code loads after hydration, so it stays out of the first paint; a square of the board's size holds its place. */
export function DeferredChessBoard(props: ChessBoardProps) {
  return (
    <Deferred
      load={loadChessBoard}
      props={props}
      fallback={
        <div
          aria-hidden="true"
          className={`aspect-square ${CHESS_BOARD_SIZE} border-2 border-border shadow-[3px_3px_0_var(--cast)]`}
        />
      }
    />
  );
}
