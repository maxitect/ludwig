import { TileBlock } from "../_shared/preview/text-block";
import type { Payload } from "./schema";

export function Preview({ payload: { tiles } }: { payload: Payload }) {
  return <TileBlock tiles={tiles} />;
}
