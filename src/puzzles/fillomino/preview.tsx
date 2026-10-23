import { MiniGrid } from "../_shared/preview/mini-grid";
import type { Payload } from "./schema";

export function Preview({
  payload: { rows, cols, givens },
}: {
  payload: Payload;
}) {
  return (
    <MiniGrid
      rows={rows}
      cols={cols}
      labels={givens.map(({ row, col, digit }) => ({
        row,
        col,
        text: String(digit),
      }))}
    />
  );
}
