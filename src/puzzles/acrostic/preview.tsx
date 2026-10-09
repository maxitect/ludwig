import { TextLines } from "../_shared/preview/text-block";
import type { Payload } from "./schema";

const SHOWN = 6;

export function Preview({ payload: { lines } }: { payload: Payload }) {
  return (
    <TextLines
      lines={lines.slice(0, SHOWN).map((line) => ({
        accent: line.slice(0, 1).toUpperCase(),
        text: line.slice(1),
      }))}
    />
  );
}
