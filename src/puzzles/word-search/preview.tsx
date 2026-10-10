import { MiniGrid } from "../_shared/preview/mini-grid";
import type { Payload } from "./schema";

export function Preview({
  payload: { rows, cols, cells },
}: {
  payload: Payload;
}) {
  return (
    <MiniGrid
      rows={rows}
      cols={cols}
      labels={cells.map(({ row, col, letter }) => ({
        row,
        col,
        text: letter,
      }))}
    />
  );
}
