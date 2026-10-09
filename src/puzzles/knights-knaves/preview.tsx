import { TextLines } from "../_shared/preview/text-block";
import type { Payload } from "./schema";

const SHOWN = 4;

export function Preview({ payload: { characters } }: { payload: Payload }) {
  return (
    <TextLines
      lines={characters
        .toSorted((a, b) => a.position - b.position)
        .slice(0, SHOWN)
        .map(({ name, statements }) => ({
          accent: `${name}: `,
          text: statements[0] ?? "",
        }))}
    />
  );
}
