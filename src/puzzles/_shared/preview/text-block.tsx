const TILE = 11;

type Line = { text: string; heading?: boolean; accent?: string };

const clip = (text: string, length: number) =>
  text.length > length ? `${text.slice(0, length - 1)}...` : text;

/** Short lines of text on a sheet. `accent` is a lead-in drawn in red before the text. */
export function TextLines({
  lines,
  width = 26,
}: {
  lines: readonly Line[];
  width?: number;
}) {
  return (
    <svg
      viewBox={`0 0 100 ${lines.length * 13 + 4}`}
      className="size-full"
      aria-hidden="true"
    >
      {lines.map(({ text, heading, accent }, i) => (
        <text
          key={i}
          x={4}
          y={12 + i * 13}
          fontSize={heading ? 9 : 8}
          className={
            heading
              ? "fill-ink font-display font-bold uppercase"
              : "fill-ink font-sans"
          }
        >
          {accent && (
            <tspan className="fill-ludwig-red font-bold">{accent}</tspan>
          )}
          {clip(text, (heading ? width - 8 : width) - (accent?.length ?? 0))}
        </text>
      ))}
    </svg>
  );
}

/** Letter tiles in rows of `perRow`, each a paper square with an ink edge. */
export function TileBlock({
  tiles,
  perRow = 8,
}: {
  tiles: readonly string[];
  perRow?: number;
}) {
  const rows = Math.ceil(tiles.length / perRow);
  const place = (i: number) => ({
    x: (i % perRow) * (TILE + 2),
    y: Math.floor(i / perRow) * (TILE + 2),
  });
  return (
    <svg
      viewBox={`-1 -1 ${perRow * (TILE + 2) + 1} ${rows * (TILE + 2) + 1}`}
      className="size-full"
      aria-hidden="true"
    >
      <path
        d={tiles
          .map((_, i) => {
            const { x, y } = place(i);
            return `M${x} ${y}h${TILE}v${TILE}h-${TILE}z`;
          })
          .join("")}
        className="fill-paper stroke-ink"
        strokeWidth={0.8}
      />
      {tiles.map((tile, i) => {
        const { x, y } = place(i);
        return (
          <text
            key={i}
            x={x + TILE / 2}
            y={y + TILE / 2}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={8}
            className="fill-ink font-mono font-bold uppercase"
          >
            {tile}
          </text>
        );
      })}
    </svg>
  );
}
