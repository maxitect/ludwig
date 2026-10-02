import { type Diagram, stateAt } from "./engine";

type Gear = Diagram["gears"][number];

const RING_IN = 60;
const RING_OUT = 84;
const VICTIM_RADIUS = 5;
const TOOTH_DEPTH = 2.2;
const X_SPACING = 6;
const X_ROWS = [5, 11, 17];
const X_HALF = 1.4;

const MAX_TOOTH_SCALE = 0.9;
const toRad = (deg: number) => (deg * Math.PI) / 180;
/** Rounded so the server and the browser print the same trig results and hydration matches. */
const round = (n: number) => Math.round(n * 100) / 100 || 0;
/** Angles are degrees clockwise from the top, as in SPEC 5.2.2. */
const polar = (deg: number, r: number) =>
  [round(r * Math.sin(toRad(deg))), round(-r * Math.cos(toRad(deg)))] as const;
const point = ([x, y]: readonly [number, number]) =>
  `${x.toFixed(2)} ${y.toFixed(2)}`;

function cogPath(teeth: number, radius: number) {
  const step = 360 / teeth;
  const tip = radius + TOOTH_DEPTH;
  const points = Array.from({ length: teeth }, (_, i) => [
    polar(i * step, radius),
    polar(i * step + step * 0.1, tip),
    polar(i * step + step * 0.4, tip),
    polar(i * step + step * 0.5, radius),
  ]).flat();
  return `M${points.map(point).join(" L")} Z`;
}

/** Upright Xs in a fan centred on `facingDeg`, `halfWidthDeg` either side. */
function visionXs(radius: number, facingDeg: number, halfWidthDeg: number) {
  return X_ROWS.flatMap((offset) => {
    const distance = radius + TOOTH_DEPTH + offset;
    const count = Math.floor((toRad(2 * halfWidthDeg) * distance) / X_SPACING);
    return Array.from({ length: count + 1 }, (_, i) => {
      const spread = count === 0 ? 0 : -halfWidthDeg + (2 * halfWidthDeg * i) / count;
      const angle = facingDeg + spread;
      const [x, y] = polar(angle, distance);
      return `M${(x - X_HALF).toFixed(2)} ${(y - X_HALF).toFixed(2)} l${2 * X_HALF} ${2 * X_HALF} M${(x + X_HALF).toFixed(2)} ${(y - X_HALF).toFixed(2)} l${-2 * X_HALF} ${2 * X_HALF}`;
    });
  }).join(" ");
}

const slotAngle = (slot: number, slotCount: number) => (slot * 360) / slotCount;

/** Cog radius per tooth, shrunk so the largest cogs on neighbouring inner-ring slots never overlap. */
function toothScale({ gears, slotCount }: Diagram) {
  const halfGap = RING_IN * Math.sin(Math.PI / slotCount) - TOOTH_DEPTH;
  return Math.min(MAX_TOOTH_SCALE, halfGap / Math.max(...gears.map((g) => g.teeth)));
}

export function GearBoard({
  diagram,
  crank,
  convergence,
}: {
  diagram: Diagram;
  crank: number;
  convergence: number;
}) {
  const states = stateAt(diagram, crank, convergence);
  const scale = toothScale(diagram);
  const centres = new Map(
    diagram.gears.map((gear) => [
      gear.id,
      polar(slotAngle(states[gear.id]!.slot, diagram.slotCount), RING_IN),
    ]),
  );

  return (
    <svg
      viewBox="-100 -100 200 200"
      className="h-auto w-full max-w-xl border-2 border-border bg-card"
      role="group"
      aria-label="Gear floor"
    >
      <circle r={RING_OUT} className="fill-none stroke-foreground/25" strokeWidth={0.6} />
      <circle r={RING_IN} className="fill-none stroke-foreground/25" strokeWidth={0.6} />
      {Array.from({ length: diagram.slotCount }, (_, slot) => {
        const angle = slotAngle(slot, diagram.slotCount);
        const [x1, y1] = polar(angle, RING_OUT - 2);
        const [x2, y2] = polar(angle, RING_OUT + 2);
        return (
          <line
            key={slot}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            className="stroke-foreground/40"
            strokeWidth={0.6}
          />
        );
      })}

      {diagram.meshes.map(({ gearAId, gearBId }) => {
        const [x1, y1] = centres.get(gearAId)!;
        const [x2, y2] = centres.get(gearBId)!;
        return (
          <line
            key={`${gearAId}-${gearBId}`}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            className="stroke-foreground/20"
            strokeWidth={0.5}
            strokeDasharray="1.5 1.5"
          />
        );
      })}

      <circle r={VICTIM_RADIUS} className="fill-foreground" data-victim />
      <circle r={VICTIM_RADIUS + 2} className="fill-none stroke-foreground" strokeWidth={0.5} />

      {diagram.gears.map((gear) => (
        <GearGlyph
          key={gear.id}
          gear={gear}
          state={states[gear.id]!}
          centre={centres.get(gear.id)!}
          radius={gear.teeth * scale}
        />
      ))}

      {diagram.gears
        .filter((gear) => states[gear.id]!.sees)
        .map((gear) => {
          const [cx, cy] = centres.get(gear.id)!;
          const length = Math.sqrt(cx * cx + cy * cy);
          const [ux, uy] = [cx / length, cy / length];
          const start = gear.teeth * scale + TOOTH_DEPTH;
          return (
            <line
              key={gear.id}
              data-sightline={gear.label}
              x1={round(cx - ux * start)}
              y1={round(cy - uy * start)}
              x2={round(ux * (VICTIM_RADIUS + 2))}
              y2={round(uy * (VICTIM_RADIUS + 2))}
              className="stroke-ludwig-red"
              strokeWidth={0.9}
            />
          );
        })}
    </svg>
  );
}

function GearGlyph({
  gear,
  state,
  centre: [cx, cy],
  radius,
}: {
  gear: Gear;
  state: ReturnType<typeof stateAt>[string];
  centre: readonly [number, number];
  radius: number;
}) {
  return (
    <g
      transform={`translate(${cx.toFixed(2)} ${cy.toFixed(2)})`}
      role="img"
      aria-label={`Gear ${gear.label}, ${gear.teeth} teeth`}
      data-gear={gear.label}
      data-slot={state.slot}
      data-facing-deg={state.facingDeg}
      data-sees={state.sees}
    >
      <path
        d={visionXs(radius, state.facingDeg, gear.halfWidthDeg)}
        className="fill-none stroke-ludwig-red"
        strokeWidth={0.5}
        data-vision
      />
      <g transform={`rotate(${state.facingDeg})`}>
        <path
          d={cogPath(gear.teeth, radius)}
          className="fill-card stroke-foreground"
          strokeWidth={gear.isDriver ? 1.8 : 0.9}
          strokeLinejoin="miter"
        />
        <line
          x1={0}
          y1={-radius * 0.45}
          x2={0}
          y2={-radius - TOOTH_DEPTH}
          className="stroke-foreground"
          strokeWidth={0.9}
        />
      </g>
      <text
        y={1.2}
        textAnchor="middle"
        className="fill-foreground font-display font-bold"
        fontSize={radius > 9 ? 6 : 5}
      >
        {gear.label}
      </text>
      <text
        y={5.6}
        textAnchor="middle"
        className="fill-foreground font-sans"
        fontSize={3.4}
      >
        {gear.teeth}
      </text>
    </g>
  );
}
