import { CELL, MiniGrid, cellCentre } from "../_shared/preview/mini-grid";
import { RegionBorders } from "../_shared/preview/region-borders";
import { lookupCages } from "./cages";
import type { Payload } from "./schema";
import { GROUP_FILLS, regionLookup } from "./regions";

const SIZE = 9;
const INSET = 1.4;

const tint = (cells: NonNullable<Payload["regions"]>["cells"], group: number) =>
  cells
    .filter(({ region }) => region === group)
    .map(
      ({ row, col }) =>
        `M${col * CELL} ${row * CELL}h${CELL}v${CELL}h-${CELL}z`,
    )
    .join("");

/** One path of every cage's outline, drawn a little inside the cell sides on its edge. */
function cageOutlines(cages: NonNullable<Payload["cages"]>) {
  const lookup = lookupCages(cages);
  let d = "";
  for (let row = 0; row < SIZE; row++) {
    for (let col = 0; col < SIZE; col++) {
      const sides = lookup.sidesOf(row, col);
      if (!sides) continue;
      const left = col * CELL + (sides.left ? INSET : 0);
      const right = (col + 1) * CELL - (sides.right ? INSET : 0);
      const top = row * CELL + (sides.top ? INSET : 0);
      const bottom = (row + 1) * CELL - (sides.bottom ? INSET : 0);
      if (sides.top) d += `M${left} ${top}H${right}`;
      if (sides.bottom) d += `M${left} ${bottom}H${right}`;
      if (sides.left) d += `M${left} ${top}V${bottom}`;
      if (sides.right) d += `M${right} ${top}V${bottom}`;
    }
  }
  return d;
}

export function Preview({
  payload: { givens, regions, cages, xv },
}: {
  payload: Payload;
}) {
  const jigsaw = regions?.kind === "jigsaw";
  const lookup = lookupCages(cages);
  return (
    <MiniGrid
      rows={SIZE}
      cols={SIZE}
      box={jigsaw ? undefined : 3}
      labels={givens.map(({ row, col, digit }) => ({
        row,
        col,
        text: String(digit),
      }))}
      tints={
        regions?.kind === "rainbow" &&
        GROUP_FILLS.map((fill, group) => (
          <path key={fill} d={tint(regions.cells, group)} className={fill} />
        ))
      }
    >
      {jigsaw && (
        <RegionBorders
          regionOf={regionLookup(regions)}
          rows={SIZE}
          cols={SIZE}
        />
      )}
      {cages && (
        <>
          <path
            d={cageOutlines(cages)}
            className="fill-none stroke-ink"
            strokeWidth={0.5}
            strokeDasharray="2 1.4"
          />
          {Array.from({ length: SIZE * SIZE }, (_, index) => {
            const row = Math.floor(index / SIZE);
            const col = index % SIZE;
            const cage = lookup.anchoredAt(row, col);
            return (
              cage && (
                <text
                  key={index}
                  x={col * CELL + INSET + 0.8}
                  y={row * CELL + INSET + 3}
                  fontSize={3.4}
                  strokeWidth={1.2}
                  paintOrder="stroke"
                  className="fill-ink stroke-paper font-mono font-bold"
                >
                  {cage.sum}
                </text>
              )
            );
          })}
        </>
      )}
      {xv?.marks.map(({ row, col, direction, mark }) => (
        <text
          key={`${row}-${col}-${direction}`}
          x={direction === "right" ? (col + 1) * CELL : cellCentre(col)}
          y={direction === "right" ? cellCentre(row) : (row + 1) * CELL}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={6}
          strokeWidth={2.4}
          paintOrder="stroke"
          className="fill-ink stroke-paper font-mono font-bold"
        >
          {mark.toUpperCase()}
        </text>
      ))}
    </MiniGrid>
  );
}
