import { cogPath } from "../_shared/cog-path";
import { radius } from "./engine";
import type { Cog, Payload } from "./schema";

const UNIT = 10;
const TOOTH_DEPTH = 1.6;

const mark = ({ row, col }: { row: number; col: number }, size: number) =>
  `M${col * UNIT - size / 2} ${row * UNIT - size / 2}h${size}v${size}h-${size}z`;

function FixedCog({ cog, className }: { cog: Cog; className: string }) {
  return (
    <path
      d={cogPath(cog.teeth, radius(cog) * UNIT, TOOTH_DEPTH)}
      transform={`translate(${cog.col * UNIT} ${cog.row * UNIT})`}
      className={className}
      strokeWidth={0.8}
    />
  );
}

export function Preview({
  payload: { rows, cols, driver, target, bolts },
}: {
  payload: Payload;
}) {
  const pegs = Array.from({ length: rows * cols }, (_, i) =>
    mark({ row: Math.floor(i / cols), col: i % cols }, 1.4),
  ).join("");
  return (
    <svg
      viewBox={`${-UNIT} ${-UNIT} ${cols * UNIT + UNIT} ${rows * UNIT + UNIT}`}
      className="size-full"
      aria-hidden="true"
    >
      <path d={pegs} className="fill-ink" />
      <path d={bolts.map((bolt) => mark(bolt, 5)).join("")} className="fill-ink" />
      <FixedCog cog={driver} className="fill-paper stroke-ink" />
      <FixedCog cog={target} className="fill-paper stroke-ludwig-red" />
    </svg>
  );
}
