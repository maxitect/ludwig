import { regionContains } from "../_shared/regions";
import type { Region } from "./schema";

export {
  regionCentre,
  regionContains,
  regionInScene,
  regionsOverlap,
} from "../_shared/regions";

/** The difference a tap lands in, or null. Regions never overlap, so there is at most one. */
export function findDifferenceAt<T extends { region: Region }>(
  differences: readonly T[],
  point: { x: number; y: number },
) {
  return differences.find(({ region }) => regionContains(region, point)) ?? null;
}
