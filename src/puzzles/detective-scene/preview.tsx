import type { Payload } from "./schema";

const WIDTH = 60;
const HEIGHT = 40;
const BUILDINGS = [
  { x: 4, top: 14, width: 14 },
  { x: 20, top: 8, width: 18 },
  { x: 40, top: 16, width: 16 },
] as const;
const RINGS = 5;

/** A street of three buildings with one red ring per hidden title, up to five. */
export function Preview({ payload: { itemCount } }: { payload: Payload }) {
  const rings = Math.min(itemCount, RINGS);
  return (
    <svg
      viewBox={`-1 -1 ${WIDTH + 2} ${HEIGHT + 2}`}
      className="size-full"
      aria-hidden="true"
    >
      <rect width={WIDTH} height={HEIGHT} className="fill-paper stroke-ink" strokeWidth={0.8} />
      <path
        d={BUILDINGS.map(
          ({ x, top, width }) => `M${x} 34V${top}h${width}V34`,
        ).join("")}
        className="fill-none stroke-ink"
        strokeWidth={0.8}
      />
      <path
        d="M2 34h56M2 37h56"
        className="fill-none stroke-ink"
        strokeWidth={0.5}
      />
      {Array.from({ length: rings }, (_, i) => (
        <ellipse
          key={i}
          cx={9 + i * 10.5}
          cy={20 + (i % 2) * 6}
          rx={3.4}
          ry={2.2}
          className="fill-none stroke-ludwig-red"
          strokeWidth={0.8}
        />
      ))}
    </svg>
  );
}
