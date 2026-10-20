import { MiniGrid } from "../_shared/preview/mini-grid";
import type { Payload } from "./schema";

export function Preview({ payload: { rows, cols } }: { payload: Payload }) {
  return <MiniGrid rows={rows} cols={cols} />;
}
