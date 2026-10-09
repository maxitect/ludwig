import { TextLines } from "../_shared/preview/text-block";
import type { Payload } from "./schema";

const SHOWN = 5;

export function Preview({ payload: { title, refs } }: { payload: Payload }) {
  return (
    <TextLines
      lines={[
        { text: title, heading: true },
        ...refs
          .toSorted((a, b) => a.position - b.position)
          .slice(0, SHOWN)
          .map(({ page, line, wordIndex }) => ({
            accent: `${page}.${line}.${wordIndex}`,
            text: " ____",
          })),
      ]}
    />
  );
}
