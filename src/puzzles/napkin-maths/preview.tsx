import { TextLines } from "../_shared/preview/text-block";
import type { Payload } from "./schema";

const SHOWN = 5;

export function Preview({ payload: { lines } }: { payload: Payload }) {
  return <TextLines lines={lines.slice(0, SHOWN).map((text) => ({ text }))} />;
}
