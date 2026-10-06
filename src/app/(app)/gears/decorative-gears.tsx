const CENTRE = 50;
const ROOT_RADIUS = 34;
const TIP_RADIUS = 44;

function cogPath(teeth: number) {
  const step = (Math.PI * 2) / teeth;
  const points = Array.from({ length: teeth }, (_, i) => {
    const a = i * step;
    return [
      [ROOT_RADIUS, a],
      [TIP_RADIUS, a + step * 0.15],
      [TIP_RADIUS, a + step * 0.45],
      [ROOT_RADIUS, a + step * 0.6],
    ] as const;
  }).flat();
  return `${points
    .map(
      ([r, a], i) =>
        `${i === 0 ? "M" : "L"}${(CENTRE + r * Math.cos(a)).toFixed(2)} ${(CENTRE + r * Math.sin(a)).toFixed(2)}`,
    )
    .join("")}Z`;
}

const GEARS = [
  {
    teeth: 16,
    className: "top-1 right-2 w-14 sm:top-0 sm:right-6 sm:w-52",
  },
  {
    teeth: 8,
    className: "hidden sm:block sm:top-40 sm:right-44 sm:w-28 hub-gear-reverse",
  },
] as const;

export function DecorativeGears() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0">
      {GEARS.map(({ teeth, className }) => (
        <svg
          key={teeth}
          viewBox="0 0 100 100"
          focusable="false"
          className={`hub-gear absolute text-foreground ${className}`}
        >
          <path
            d={cogPath(teeth)}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinejoin="miter"
          />
          <circle
            cx={CENTRE}
            cy={CENTRE}
            r="8"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          />
        </svg>
      ))}
    </div>
  );
}
