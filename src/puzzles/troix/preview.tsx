import { MiniGrid } from "../_shared/preview/mini-grid";
import type { Payload } from "./schema";

export function Preview({ payload: { size, givens } }: { payload: Payload }) {
  return (
    <MiniGrid
      rows={size}
      cols={size}
      labels={givens.map(({ row, col, symbol }) => ({
        row,
        col,
        text: symbol.toUpperCase(),
      }))}
    />
  );
}
