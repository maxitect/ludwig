import type { ReactNode } from "react";
import { PieceGlyph } from "@/puzzles/_shared/chess-board/pieces";
import {
  FILES,
  type Colour,
  type PieceKind,
} from "@/puzzles/_shared/chess-board/squares";

const SQUARE = 10;

type Piece = {
  file: (typeof FILES)[number];
  rank: number;
  colour: Colour;
  piece: PieceKind;
};

export const squareCentre = ({
  file,
  rank,
}: Pick<Piece, "file" | "rank">) => ({
  x: FILES.indexOf(file) * SQUARE + SQUARE / 2,
  y: (8 - rank) * SQUARE + SQUARE / 2,
});

const darkSquares = Array.from({ length: 64 }, (_, i) => ({
  file: i % 8,
  row: Math.floor(i / 8),
}))
  .filter(({ file, row }) => (file + row) % 2 === 1)
  .map(
    ({ file, row }) =>
      `M${file * SQUARE} ${row * SQUARE}h${SQUARE}v${SQUARE}h-${SQUARE}z`,
  )
  .join("");

/** A static 8 by 8 board in paper tones. Overlays share its units: 10 per square. */
export function MiniChessBoard({
  pieces = [],
  children,
}: {
  pieces?: readonly Piece[];
  children?: ReactNode;
}) {
  return (
    <svg viewBox="-1 -1 82 82" className="size-full" aria-hidden="true">
      <rect
        width={80}
        height={80}
        className="fill-paper stroke-ink"
        strokeWidth={1}
      />
      <path d={darkSquares} className="fill-paper-deep" />
      {pieces.map(({ file, rank, colour, piece }) => {
        const { x, y } = squareCentre({ file, rank });
        return (
          <svg
            key={`${file}${rank}`}
            x={x - SQUARE / 2}
            y={y - SQUARE / 2}
            width={SQUARE}
            height={SQUARE}
          >
            <PieceGlyph colour={colour} piece={piece} shadow={false} />
          </svg>
        );
      })}
      {children}
    </svg>
  );
}
