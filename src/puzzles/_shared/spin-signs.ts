export type Spin = 1 | -1;
export type Signs = Record<string, Spin>;

export type SpinResult =
  | { ok: true; signs: Signs }
  | { ok: false; error: "not_bipartite" | "disconnected" };

/** 2-colours the mesh graph from the driver; every gear must be reachable from it. */
export function spinSigns(
  gears: { id: string }[],
  meshes: { gearAId: string; gearBId: string }[],
  driverId: string,
): SpinResult {
  const neighbours = new Map<string, string[]>(gears.map((g) => [g.id, []]));
  for (const { gearAId, gearBId } of meshes) {
    neighbours.get(gearAId)?.push(gearBId);
    neighbours.get(gearBId)?.push(gearAId);
  }
  const signs: Signs = { [driverId]: 1 };
  const queue = [driverId];
  for (const current of queue) {
    const next: Spin = signs[current] === 1 ? -1 : 1;
    for (const other of neighbours.get(current) ?? []) {
      if (!(other in signs)) {
        signs[other] = next;
        queue.push(other);
      } else if (signs[other] !== next) {
        return { ok: false, error: "not_bipartite" };
      }
    }
  }
  if (gears.some((g) => !(g.id in signs))) {
    return { ok: false, error: "disconnected" };
  }
  return { ok: true, signs };
}
