import { TextLines } from "../_shared/preview/text-block";
import type { Payload } from "./schema";

const SHOWN = 6;

export function Preview({ payload: { items } }: { payload: Payload }) {
  return (
    <TextLines
      lines={items
        .toSorted((a, b) => a.position - b.position)
        .slice(0, SHOWN)
        .map(({ label }) => ({ accent: "? ", text: label }))}
    />
  );
}
