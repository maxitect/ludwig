import type { Payload } from "./schema";

const RADIUS = 34;
const HALF = 10;

export function Preview({ payload: { centre, rim } }: { payload: Payload }) {
  const tiles = [
    { letter: centre, x: 0, y: 0 },
    ...rim.map((letter, i) => {
      const angle = (i / rim.length) * 2 * Math.PI - Math.PI / 2;
      return {
        letter,
        x: Math.round(Math.cos(angle) * RADIUS * 100) / 100,
        y: Math.round(Math.sin(angle) * RADIUS * 100) / 100,
      };
    }),
  ];
  const size = RADIUS + HALF + 2;
  return (
    <svg
      viewBox={`${-size} ${-size} ${size * 2} ${size * 2}`}
      className="size-full"
      aria-hidden="true"
    >
      <circle r={RADIUS} className="fill-none stroke-ink" strokeWidth={0.8} />
      {tiles.map(({ letter, x, y }, i) => (
        <g key={i}>
          <rect
            x={x - HALF}
            y={y - HALF}
            width={HALF * 2}
            height={HALF * 2}
            className={i === 0 ? "fill-ink stroke-ink" : "fill-paper stroke-ink"}
            strokeWidth={0.8}
          />
          <text
            x={x}
            y={y}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={12}
            className={
              i === 0
                ? "fill-paper font-mono font-bold uppercase"
                : "fill-ink font-mono font-bold uppercase"
            }
          >
            {letter}
          </text>
        </g>
      ))}
    </svg>
  );
}
