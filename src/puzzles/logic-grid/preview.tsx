import { TextLines } from "../_shared/preview/text-block";
import type { Payload } from "./schema";

const SHOWN = 5;

export function Preview({ payload: { categories } }: { payload: Payload }) {
  return (
    <TextLines
      lines={categories
        .toSorted((a, b) => a.position - b.position)
        .slice(0, SHOWN)
        .map(({ name, items }) => ({
          accent: `${name}: `,
          text: items
            .toSorted((a, b) => a.position - b.position)
            .map(({ label }) => label)
            .join(", "),
        }))}
      width={30}
    />
  );
}
