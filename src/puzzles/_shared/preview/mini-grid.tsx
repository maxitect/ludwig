import type { ReactNode } from "react";

export const CELL = 10;
const PAD = 1;

type Position = { row: number; col: number };
type Label = Position & { text: string };

export const cellCentre = (index: number) => index * CELL + CELL / 2;

const square = ({ row, col }: Position) =>
  `M${col * CELL} ${row * CELL}h${CELL}v${CELL}h-${CELL}z`;

/** One text node per row: each character carries its own x, so no font metrics matter. */
function RowLabels({ labels }: { labels: readonly Label[] }) {
  const rows = Map.groupBy(labels, ({ row }) => row);
  return [...rows].map(([row, entries]) => (
    <text
      key={row}
      x={entries.map(({ col }) => col * CELL + CELL / 2).join(" ")}
      y={row * CELL + CELL / 2}
      textAnchor="middle"
      dominantBaseline="central"
      fontSize={CELL * 0.7}
      className="fill-ink font-mono font-bold"
    >
      {entries.map(({ text }) => text).join("")}
    </text>
  ));
}

/**
 * A static grid on a paper sheet. `cells` lists the open cells (all of them when omitted); anything
 * else is drawn as a block. `box` thickens every `box`th line. Overlays share the grid's units: 10 per cell.
 */
export function MiniGrid({
  rows,
  cols,
  cells,
  labels = [],
  box,
  tints,
  children,
}: {
  rows: number;
  cols: number;
  cells?: readonly Position[];
  labels?: readonly Label[];
  box?: number;
  /** Drawn on the cells, under the grid lines and labels. */
  tints?: ReactNode;
  children?: ReactNode;
}) {
  const width = cols * CELL;
  const height = rows * CELL;
  const open =
    cells ??
    Array.from({ length: rows * cols }, (_, i) => ({
      row: Math.floor(i / cols),
      col: i % cols,
    }));
  const thick = box
    ? Array.from(
        { length: Math.floor((Math.max(rows, cols) - 1) / box) },
        (_, i) => (i + 1) * box,
      )
    : [];
  return (
    <svg
      viewBox={`${-PAD} ${-PAD} ${width + 2 * PAD} ${height + 2 * PAD}`}
      className="size-full"
      aria-hidden="true"
    >
      <rect width={width} height={height} className="fill-ink" />
      <path
        d={open.map(square).join("")}
        className="fill-paper stroke-ink"
        strokeWidth={0.6}
      />
      {tints}
      {thick.length > 0 && (
        <path
          d={thick
            .flatMap((at) => [
              `M${at * CELL} 0v${height}`,
              `M0 ${at * CELL}h${width}`,
            ])
            .join("")}
          className="fill-none stroke-ink"
          strokeWidth={1.6}
        />
      )}
      <RowLabels labels={labels} />
      {children}
    </svg>
  );
}
