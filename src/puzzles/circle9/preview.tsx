import { MiniGrid } from "../_shared/preview/mini-grid";
import { SIZE } from "./engine";
import type { Payload } from "./schema";

export function Preview({ payload }: { payload: Payload }) {
  return (
    <MiniGrid
      rows={SIZE}
      cols={SIZE}
      box={3}
      labels={payload.numbers.map(({ row, col, digit }) => ({
        row,
        col,
        text: String(digit),
      }))}
    />
  );
}
