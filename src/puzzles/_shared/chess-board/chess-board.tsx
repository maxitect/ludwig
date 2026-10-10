"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
} from "react";
import {
  Chessboard,
  type PieceDropHandlerArgs,
  type SquareHandlerArgs,
} from "react-chessboard";
import { useReduceMotion } from "@/utils/use-reduce-motion";
import { BOARD_PIECES } from "./pieces";
import { RetroArrow } from "./retro-arrow";
import {
  retroDrop,
  stepSquare,
  toPositionData,
  type BackwardsArrow,
  type Colour,
  type PieceRow,
  type RetroDrop,
  type Square,
} from "./squares";

const ARROW_KEYS = {
  ArrowUp: "up",
  ArrowDown: "down",
  ArrowLeft: "left",
  ArrowRight: "right",
} as const;

const halo = (colour: string) =>
  [
    [-1, -1],
    [1, -1],
    [-1, 1],
    [1, 1],
  ]
    .map(([x, y]) => `${x}px ${y}px 0 var(--color-${colour})`)
    .join(", ");

const ring = (colour: string, width: number) =>
  `inset 0 0 0 ${width}px var(--color-${colour})`;

function squareLabel(square: string, piece: SquareHandlerArgs["piece"]) {
  if (!piece) return `${square}, empty`;
  const colour = piece.pieceType[0] === "w" ? "white" : "black";
  const name = {
    P: "pawn",
    N: "knight",
    B: "bishop",
    R: "rook",
    Q: "queen",
    K: "king",
  }[piece.pieceType[1]];
  return `${square}, ${colour} ${name}`;
}

export type ChessBoardProps = {
  position: readonly PieceRow[];
  onRetroDrop?: (drop: RetroDrop) => void;
  arrows?: readonly BackwardsArrow[];
  highlights?: readonly Square[];
  orientation?: Colour;
  interactive?: boolean;
};

/** Board for retro puzzles. A piece moved from A to B reports the forward move B to A. */
export function ChessBoard({
  position,
  onRetroDrop,
  arrows = [],
  highlights = [],
  orientation = "white",
  interactive = true,
}: ChessBoardProps) {
  const boardId = `board${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const rootRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReduceMotion();
  const [cursor, setCursor] = useState<Square>("e4");
  const [picked, setPicked] = useState<Square | null>(null);
  const [focused, setFocused] = useState(false);

  const pieces = toPositionData(position);

  useEffect(() => {
    rootRef.current
      ?.querySelectorAll<HTMLElement>("[aria-roledescription]")
      .forEach((node) => node.setAttribute("tabindex", "-1"));
  });

  function drop(source: Square, target: Square) {
    if (source === target) return;
    onRetroDrop?.(retroDrop(source, target));
  }

  function handleDrop({
    sourceSquare,
    targetSquare,
  }: PieceDropHandlerArgs) {
    if (!targetSquare) return false;
    drop(sourceSquare as Square, targetSquare as Square);
    return false;
  }

  function handleSquareClick({ square, piece }: SquareHandlerArgs) {
    const tapped = square as Square;
    setCursor(tapped);
    if (picked) {
      if (picked !== tapped) drop(picked, tapped);
      setPicked(null);
    } else if (piece) {
      setPicked(tapped);
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key in ARROW_KEYS) {
      event.preventDefault();
      setCursor(
        stepSquare(
          cursor,
          ARROW_KEYS[event.key as keyof typeof ARROW_KEYS],
          orientation,
        ),
      );
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      if (picked) {
        drop(picked, cursor);
        setPicked(null);
      } else if (pieces[cursor]) {
        setPicked(cursor);
      }
    } else if (event.key === "Escape") {
      setPicked(null);
    }
  }

  const squareStyles: Record<string, CSSProperties> = {};
  for (const square of highlights) {
    squareStyles[square] = { boxShadow: ring("ludwig-red", 4) };
  }
  if (picked) squareStyles[picked] = { boxShadow: ring("ludwig-red", 6) };
  if (focused) {
    squareStyles[cursor] = {
      boxShadow: `${ring("ring", 5)}, inset 0 0 0 8px var(--color-paper)`,
    };
  }

  const status = picked
    ? `${cursor}. Picked up ${picked}. Enter to drop, Escape to cancel.`
    : cursor;

  return (
    <div
      ref={rootRef}
      role={interactive ? "application" : "group"}
      aria-label="Chess board"
      aria-describedby={`${boardId}-help`}
      aria-activedescendant={
        interactive && focused ? `${boardId}-sq-${cursor}` : undefined
      }
      tabIndex={interactive ? 0 : undefined}
      onKeyDown={interactive ? handleKeyDown : undefined}
      onFocus={
        interactive
          ? (event) => setFocused(event.currentTarget.matches(":focus-visible"))
          : undefined
      }
      onBlur={interactive ? () => setFocused(false) : undefined}
      className="relative w-full max-w-lg border-2 border-border shadow-[3px_3px_0_var(--cast)] outline-none motion-reduce:[&_[data-piece]]:transition-none"
    >
      <Chessboard
        options={{
          id: boardId,
          position: pieces,
          boardOrientation: orientation,
          pieces: BOARD_PIECES,
          allowDragging: interactive,
          allowDrawingArrows: false,
          showAnimations: !reducedMotion,
          animationDurationInMs: reducedMotion ? 0 : 200,
          onPieceDrop: handleDrop,
          onSquareClick: interactive ? handleSquareClick : undefined,
          squareStyles,
          lightSquareStyle: { backgroundColor: "var(--color-paper)" },
          darkSquareStyle: { backgroundColor: "var(--color-ink)" },
          lightSquareNotationStyle: {
            color: "var(--color-ink)",
            fontFamily: "var(--font-sans)",
            fontWeight: 700,
            textShadow: halo("paper"),
          },
          darkSquareNotationStyle: {
            color: "var(--color-paper)",
            fontFamily: "var(--font-sans)",
            fontWeight: 700,
            textShadow: halo("ink"),
          },
          alphaNotationStyle: {
            fontSize: "11px",
            bottom: 0,
            right: 3,
            zIndex: 1,
          },
          numericNotationStyle: {
            fontSize: "11px",
            top: 0,
            left: 3,
            zIndex: 1,
          },
          squareRenderer: ({ piece, square, children }) => (
            <div
              id={`${boardId}-sq-${square}`}
              role="group"
              aria-label={squareLabel(square, piece)}
              style={squareStyles[square]}
              className="size-full"
            >
              {children}
            </div>
          ),
        }}
      />
      {arrows.length > 0 && (
        <svg
          viewBox="0 0 8 8"
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-20 size-full"
        >
          {arrows.map((arrow) => (
            <RetroArrow
              key={`${arrow.from}${arrow.to}`}
              arrow={arrow}
              orientation={orientation}
            />
          ))}
        </svg>
      )}
      <p id={`${boardId}-help`} className="sr-only">
        Drag a piece backwards, tap a piece and then a square, or use the arrow keys to move between squares
        and Enter to pick up and drop a piece.
      </p>
      <p aria-live="polite" className="sr-only">
        {focused ? status : ""}
      </p>
    </div>
  );
}
