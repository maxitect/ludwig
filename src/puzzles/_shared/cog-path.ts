const toRad = (deg: number) => (deg * Math.PI) / 180;

/** Rounded so the server and the browser print the same trig results and hydration matches. */
export const round = (n: number) => Math.round(n * 100) / 100 || 0;

/** Angles are degrees clockwise from the top. */
export const polar = (deg: number, r: number) =>
  [round(r * Math.sin(toRad(deg))), round(-r * Math.cos(toRad(deg)))] as const;

const point = ([x, y]: readonly [number, number]) =>
  `${x.toFixed(2)} ${y.toFixed(2)}`;

/** The outline of a cog with `teeth` teeth, `depth` tall, around a pitch circle of `radius`. */
export function cogPath(teeth: number, radius: number, depth: number) {
  const step = 360 / teeth;
  const tip = radius + depth;
  const points = Array.from({ length: teeth }, (_, i) => [
    polar(i * step, radius),
    polar(i * step + step * 0.1, tip),
    polar(i * step + step * 0.4, tip),
    polar(i * step + step * 0.5, radius),
  ]).flat();
  return `M${points.map(point).join(" L")} Z`;
}
