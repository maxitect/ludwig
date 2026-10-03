import { type KeyboardEvent, type PointerEvent, useRef } from "react";
import type { Diagram } from "./engine";

type Gear = Diagram["gears"][number];

const mod = (n: number, m: number) => ((n % m) + m) % m;
const bearing = (x: number, y: number, cx: number, cy: number) =>
  (Math.atan2(y - cy, x - cx) * 180) / Math.PI;

/** Gesture handlers and accessibility props that turn the driver gear into a crank over `cranks` whole teeth. */
export function useCrank({
  driver,
  slotCount,
  cranks,
  crank,
  onChange,
}: {
  driver: Gear;
  slotCount: number;
  cranks: number;
  crank: number;
  onChange(crank: number): void;
}) {
  const drag = useRef<{
    pointerId: number;
    cx: number;
    cy: number;
    previous: number;
    turned: number;
    start: number;
  } | null>(null);
  const slotTeeth = Math.max(1, Math.round(driver.teeth / slotCount));
  const degreesPerTooth = 360 / driver.teeth;

  function onKeyDown(event: KeyboardEvent<SVGGElement>) {
    const by = event.shiftKey ? slotTeeth : 1;
    const next =
      event.key === "ArrowRight"
        ? crank + by
        : event.key === "ArrowLeft"
          ? crank - by
          : event.key === "Home"
            ? 0
            : null;
    if (next === null) return;
    event.preventDefault();
    onChange(mod(next, cranks));
  }

  function onPointerDown(event: PointerEvent<SVGGElement>) {
    const target = event.currentTarget;
    const matrix = target.getScreenCTM();
    if (!matrix) return;
    event.preventDefault();
    target.focus();
    target.setPointerCapture(event.pointerId);
    drag.current = {
      pointerId: event.pointerId,
      cx: matrix.e,
      cy: matrix.f,
      previous: bearing(event.clientX, event.clientY, matrix.e, matrix.f),
      turned: 0,
      start: crank,
    };
  }

  function onPointerMove(event: PointerEvent<SVGGElement>) {
    const active = drag.current;
    if (!active || active.pointerId !== event.pointerId) return;
    const now = bearing(event.clientX, event.clientY, active.cx, active.cy);
    active.turned += mod(now - active.previous + 180, 360) - 180;
    active.previous = now;
    const next = mod(
      active.start + Math.round(active.turned / degreesPerTooth),
      cranks,
    );
    if (next !== crank) onChange(next);
  }

  function endDrag(event: PointerEvent<SVGGElement>) {
    if (drag.current?.pointerId === event.pointerId) drag.current = null;
  }

  return {
    role: "slider",
    tabIndex: 0,
    "aria-label": `Driver gear, crank ${crank} of ${cranks}`,
    "aria-orientation": "horizontal",
    "aria-valuemin": 0,
    "aria-valuemax": cranks - 1,
    "aria-valuenow": crank,
    "aria-valuetext": `Crank ${crank} of ${cranks}`,
    style: { touchAction: "none" },
    onKeyDown,
    onPointerDown,
    onPointerMove,
    onPointerUp: endDrag,
    onPointerCancel: endDrag,
  } as const;
}

export type CrankProps = ReturnType<typeof useCrank>;
