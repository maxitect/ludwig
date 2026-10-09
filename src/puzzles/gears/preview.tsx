import { cogPath, polar } from "../_shared/cog-path";
import type { Payload } from "./schema";

const RING = 62;
const TOOTH_DEPTH = 2;

export function Preview({
  payload: { slotCount, gears, meshes },
}: {
  payload: Payload;
}) {
  const centres = new Map(
    gears.map(({ id, startSlot }) => [
      id,
      polar((startSlot * 360) / slotCount, RING),
    ]),
  );
  return (
    <svg viewBox="-100 -100 200 200" className="size-full" aria-hidden="true">
      <circle r={RING + 14} className="fill-none stroke-ink" strokeWidth={0.8} />
      <path
        d={meshes
          .flatMap(({ gearAId, gearBId }) => {
            const a = centres.get(gearAId);
            const b = centres.get(gearBId);
            return a && b ? [`M${a[0]} ${a[1]}L${b[0]} ${b[1]}`] : [];
          })
          .join("")}
        className="fill-none stroke-ink"
        strokeWidth={0.8}
        strokeDasharray="3 2"
      />
      {gears.map(({ id, teeth, isDriver }) => {
        const [x, y] = centres.get(id) ?? [0, 0];
        return (
          <path
            key={id}
            d={cogPath(teeth, teeth * 0.8, TOOTH_DEPTH)}
            transform={`translate(${x} ${y})`}
            className={
              isDriver
                ? "fill-paper stroke-ludwig-red"
                : "fill-paper stroke-ink"
            }
            strokeWidth={1.2}
          />
        );
      })}
      <circle r={5} className="fill-ink" />
    </svg>
  );
}
