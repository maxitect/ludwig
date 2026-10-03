import { fileIndexOf, type BackwardsArrow, type Colour } from "./squares";

const HEAD_LENGTH = 0.5;
const HEAD_SPREAD = Math.PI / 6;
const WOBBLE = 0.06;

function centre(square: BackwardsArrow["from"], orientation: Colour) {
  const file = fileIndexOf(square);
  const rank = Number(square[1]);
  return orientation === "white"
    ? { x: file + 0.5, y: 8 - rank + 0.5 }
    : { x: 7 - file + 0.5, y: rank - 0.5 };
}

/** Hand-drawn red arrow from the piece's current square (`to`) back to its origin (`from`), head at `from`. */
export function RetroArrow({
  arrow,
  orientation,
}: {
  arrow: BackwardsArrow;
  orientation: Colour;
}) {
  const tail = centre(arrow.to, orientation);
  const head = centre(arrow.from, orientation);
  const dx = head.x - tail.x;
  const dy = head.y - tail.y;
  const length = Math.hypot(dx, dy);
  if (length === 0) return null;

  const ux = dx / length;
  const uy = dy / length;
  const control = {
    x: (tail.x + head.x) / 2 - uy * length * WOBBLE,
    y: (tail.y + head.y) / 2 + ux * length * WOBBLE,
  };
  const heading = Math.atan2(head.y - control.y, head.x - control.x);
  const barb = (spread: number) => {
    const angle = heading + Math.PI + spread;
    const x = head.x + Math.cos(angle) * HEAD_LENGTH;
    const y = head.y + Math.sin(angle) * HEAD_LENGTH;
    return `${x.toFixed(4)} ${y.toFixed(4)}`;
  };

  return (
    <path
      data-retro-arrow=""
      d={`M ${tail.x} ${tail.y} Q ${control.x.toFixed(4)} ${control.y.toFixed(4)} ${head.x} ${head.y} M ${barb(HEAD_SPREAD)} L ${head.x} ${head.y} L ${barb(-HEAD_SPREAD)}`}
      fill="none"
      stroke="var(--color-ludwig-red)"
      strokeWidth="0.13"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  );
}
