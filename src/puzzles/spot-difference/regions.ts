import type { Region } from "./schema";

type Scene = Pick<Region, "width" | "height">;

export const regionCentre = ({ x, y, width, height }: Region) => ({
  x: x + width / 2,
  y: y + height / 2,
});

export const regionContains = (
  { x, y, width, height }: Region,
  point: { x: number; y: number },
) =>
  point.x >= x &&
  point.x <= x + width &&
  point.y >= y &&
  point.y <= y + height;

export const regionInScene = (
  { x, y, width, height }: Region,
  scene: Scene,
) => x >= 0 && y >= 0 && x + width <= scene.width && y + height <= scene.height;

export const regionsOverlap = (a: Region, b: Region) =>
  a.x < b.x + b.width &&
  b.x < a.x + a.width &&
  a.y < b.y + b.height &&
  b.y < a.y + a.height;

/** The difference a tap lands in, or null. Regions never overlap, so there is at most one. */
export function findDifferenceAt<T extends { region: Region }>(
  differences: readonly T[],
  point: { x: number; y: number },
) {
  return differences.find(({ region }) => regionContains(region, point)) ?? null;
}
