import { MiniChessBoard } from "../_shared/preview/mini-chess-board";
import type { Payload } from "./schema";

export function Preview({ payload: { pieces } }: { payload: Payload }) {
  return <MiniChessBoard pieces={pieces} />;
}
