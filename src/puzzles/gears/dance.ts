import { type Diagram, signsOf, slotOf } from "./engine";

export const HALF_PHASES = 16;

/** Half-phase 2f - 1 ends at convergence f; the half-phase after it travels out. */
export const markerOf = (convergence: number) => 2 * convergence - 1;

/** The convergence a timeline position sits exactly on, or null between them. */
export const convergenceAt = (position: number) =>
  Number.isInteger(position) && position % 2 === 1 ? (position + 1) / 2 : null;

export type DanceGear = {
  fromSlot: number;
  fromInner: boolean;
  toSlot: number;
  toInner: boolean;
  progress: number;
  facingDeg: number;
};

const mod = (n: number, m: number) => ((n % m) + m) % m;

/** Teeth turned since the crank setting, summed over the half-phases up to `position`. */
function teethTurned({ mIn, mOut }: Diagram, position: number) {
  const done = Math.floor(position);
  const rate = done % 2 === 0 ? mIn : -mOut;
  return (
    Math.ceil(done / 2) * mIn -
    Math.floor(done / 2) * mOut +
    (position - done) * rate
  );
}

/**
 * Presentation only: positions between the convergences are interpolated, and the
 * convergences themselves use the same integer arithmetic as `stateAt`.
 * `position` runs from 0 (at rest) to 16 (after convergence 8).
 */
export function danceAt(
  diagram: Diagram,
  crank: number,
  position: number,
): Record<string, DanceGear> {
  const signs = signsOf(diagram);
  const clamped = Math.min(position, HALF_PHASES);
  const done = Math.min(Math.floor(clamped), HALF_PHASES - 1);
  const goingIn = done % 2 === 0;
  const figure = goingIn ? done / 2 + 1 : (done + 1) / 2;
  const turned = teethTurned(diagram, clamped);
  return Object.fromEntries(
    diagram.gears.map((gear) => {
      const slot = slotOf(diagram, gear, figure);
      const facingTeeth = mod(
        gear.initialOffset + signs[gear.id]! * (crank + turned),
        gear.teeth,
      );
      const dance: DanceGear = {
        fromSlot: slot,
        fromInner: !goingIn,
        toSlot: goingIn ? slot : slotOf(diagram, gear, figure + 1),
        toInner: goingIn,
        progress: clamped - done,
        facingDeg: (facingTeeth * 360) / gear.teeth,
      };
      return [gear.id, dance];
    }),
  );
}
