import { MiniGrid } from "../_shared/preview/mini-grid";
import type { Payload } from "./schema";

export function Preview({ payload: { givens } }: { payload: Payload }) {
  return (
    <MiniGrid
      rows={9}
      cols={9}
      box={3}
      labels={givens.map(({ row, col, digit }) => ({
        row,
        col,
        text: String(digit),
      }))}
    />
  );
}
