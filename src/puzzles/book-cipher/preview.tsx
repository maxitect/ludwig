import { TextLines } from "../_shared/preview/text-block";
import type { Payload } from "./schema";

const SHOWN = 5;

export function Preview({ payload: { title, lines } }: { payload: Payload }) {
  return (
    <TextLines
      lines={[
        { text: title, heading: true },
        ...lines.slice(0, SHOWN).map(({ content }) => ({ text: content })),
      ]}
    />
  );
}
