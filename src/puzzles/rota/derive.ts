import { placementFor } from "./engine";
import type { Payload } from "./schema";

/** The hazard zone: the victim's final square. */
export function hazardSquare({ workers, victimWorkerId }: Payload) {
  return placementFor(workers, "final")[victimWorkerId];
}
