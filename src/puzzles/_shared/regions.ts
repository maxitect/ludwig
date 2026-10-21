export type Region = { x: number; y: number; width: number; height: number };

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
  scene: Pick<Region, "width" | "height">,
) => x >= 0 && y >= 0 && x + width <= scene.width && y + height <= scene.height;

export const regionsOverlap = (a: Region, b: Region) =>
  a.x < b.x + b.width &&
  b.x < a.x + a.width &&
  a.y < b.y + b.height &&
  b.y < a.y + a.height;
