import type { Payload } from "./schema";

const COLUMNS = 6;
const SHOWN = 12;
const WIDTH = 14;
const HEIGHT = 19;

export function Preview({ payload: { words } }: { payload: Payload }) {
  const keys = words.flat().slice(0, SHOWN);
  return (
    <svg viewBox="0 0 100 50" className="size-full" aria-hidden="true">
      {keys.map((key, i) => (
        <image
          key={`${key}-${i}`}
          href={`/glyphs/${key}.svg`}
          x={2 + (i % COLUMNS) * 16}
          y={4 + Math.floor(i / COLUMNS) * 22}
          width={WIDTH}
          height={HEIGHT}
        />
      ))}
    </svg>
  );
}
