import { MiniGrid } from "../_shared/preview/mini-grid";
import { RegionBorders } from "../_shared/preview/region-borders";
import { CELL } from "../_shared/preview/mini-grid";
import type { Payload } from "./schema";
import { GROUP_FILLS, regionLookup } from "./regions";

const SIZE = 9;

const tint = (cells: NonNullable<Payload["regions"]>["cells"], group: number) =>
  cells
    .filter(({ region }) => region === group)
    .map(
      ({ row, col }) =>
        `M${col * CELL} ${row * CELL}h${CELL}v${CELL}h-${CELL}z`,
    )
    .join("");

export function Preview({
  payload: { givens, regions },
}: {
  payload: Payload;
}) {
  const jigsaw = regions?.kind === "jigsaw";
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
    </MiniGrid>
  );
}
