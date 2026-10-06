"use client";

import type { MotionValue } from "motion/react";
import { useLayoutEffect, useRef } from "react";
import type { CrankProps } from "./crank";
import { convergenceAt, type DanceGear, danceAt, markerOf } from "./dance";
import { type Diagram, stateAt } from "./engine";
import type { Swaps } from "./swaps";

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

const pointOf = (slot: number, inner: boolean, slotCount: number) =>
  polar(slotAngle(slot, slotCount), inner ? RING_IN : RING_OUT);

/** Straight line from the leg's start to its end, so a gear crosses the floor on the way out. */
function centreOf(dance: DanceGear, slotCount: number) {
  const [x1, y1] = pointOf(dance.fromSlot, dance.fromInner, slotCount);
  const [x2, y2] = pointOf(dance.toSlot, dance.toInner, slotCount);
  return [
    round(x1 + (x2 - x1) * dance.progress),
    round(y1 + (y2 - y1) * dance.progress),
  ] as const;
}

/** Everything the animation changes on one gear. The JSX and `paint` both read it, so they cannot drift apart. */
function gearView(
  gear: Gear,
  dance: DanceGear,
  slotCount: number,
  scale: number,
  sees: boolean,
) {
  const [x, y] = centreOf(dance, slotCount);
  return {
    transform: `translate(${x.toFixed(2)} ${y.toFixed(2)})`,
    rotate: `rotate(${dance.facingDeg})`,
    slot: dance.progress < 0.5 ? dance.fromSlot : dance.toSlot,
    facingDeg: dance.facingDeg,
    sees,
    vision: visionXs(gear.teeth * scale, dance.facingDeg, gear.halfWidthDeg),
  };
}

/** The engine's state at a convergence, or null while the dance is between two of them. */
function engineStateAt(diagram: Diagram, crank: number, position: number) {
  const figure = convergenceAt(position);
  return figure === null ? null : stateAt(diagram, crank, figure);
}

/** Moves the board to `position` without a React render. */
function paint(
  svg: SVGSVGElement,
  diagram: Diagram,
  crank: number,
  convergence: number,
  position: number,
) {
  const { slotCount } = diagram;
  const scale = toothScale(diagram);
  const dances = danceAt(diagram, crank, position);
  const states = engineStateAt(diagram, crank, position);
  for (const gear of diagram.gears) {
    const view = gearView(
      gear,
      dances[gear.id]!,
      slotCount,
      scale,
      states?.[gear.id]!.sees ?? false,
    );
    const root = svg.querySelector(`[data-gear="${gear.label}"]`);
    root?.setAttribute("transform", view.transform);
    root?.setAttribute("data-slot", String(view.slot));
    root?.setAttribute("data-facing-deg", String(view.facingDeg));
    root?.setAttribute("data-sees", String(view.sees));
    root?.querySelector("[data-vision]")?.setAttribute("d", view.vision);
    root?.querySelector("[data-cog]")?.setAttribute("transform", view.rotate);
  }
  for (const { gearAId, gearBId } of diagram.meshes) {
    const [x1, y1] = centreOf(dances[gearAId]!, slotCount);
    const [x2, y2] = centreOf(dances[gearBId]!, slotCount);
    const line = svg.querySelector(`[data-mesh="${gearAId}-${gearBId}"]`);
    line?.setAttribute("x1", String(x1));
    line?.setAttribute("y1", String(y1));
    line?.setAttribute("x2", String(x2));
    line?.setAttribute("y2", String(y2));
  }
  const sightlines = svg.querySelector<SVGGElement>("[data-sightlines]");
  sightlines?.style.setProperty(
    "display",
    position === markerOf(convergence) ? "inline" : "none",
  );
}

/** Fix the Diagram state on the board. `diagram` already has the swaps applied; tapping a gear calls `onPick`. */
export type Adjustments = {
  swaps: Swaps;
  selectedId: string | null;
  onPick(gearId: string): void;
};

/**
 * `position` is the dance timeline in half-phases. The board repaints itself on every frame, so
 * playing the dance renders no React: React renders only when the crank or the settled convergence changes.
 */
export function GearBoard({
  diagram,
  crank,
  convergence,
  position,
  crankProps,
  adjustments,
}: {
  diagram: Diagram;
  crank: number;
  convergence: number;
  position: MotionValue<number>;
  crankProps?: CrankProps;
  adjustments?: Adjustments;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const scale = toothScale(diagram);
  const { slotCount } = diagram;
  const now = position.get();
  const dances = danceAt(diagram, crank, now);
  const states = engineStateAt(diagram, crank, now);
  const settled = danceAt(diagram, crank, markerOf(convergence));
  const settledStates = stateAt(diagram, crank, convergence);
  const startOf = (id: string) =>
    diagram.gears.find((gear) => gear.id === id)!.startSlot;

  useLayoutEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const repaint = (latest: number) =>
      paint(svg, diagram, crank, convergence, latest);
    repaint(position.get());
    return position.on("change", repaint);
  }, [diagram, crank, convergence, position]);

  return (
    <svg
      ref={svgRef}
      viewBox="-100 -100 200 200"
      className="h-auto w-full max-w-xl border-2 border-border bg-card"
      role="group"
      aria-label="Gear floor"
    >
      <circle r={RING_OUT} className="fill-none stroke-foreground/25" strokeWidth={0.6} />
      <circle r={RING_IN} className="fill-none stroke-foreground/25" strokeWidth={0.6} />
      {Array.from({ length: slotCount }, (_, slot) => {
        const angle = slotAngle(slot, slotCount);
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

      {adjustments?.swaps.map(({ gearAId, gearBId }) => {
        const [x1, y1] = pointOf(startOf(gearAId), false, slotCount);
        const [x2, y2] = pointOf(startOf(gearBId), false, slotCount);
        return (
          <line
            key={`${gearAId}-${gearBId}`}
            data-pencil={`${gearAId}-${gearBId}`}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            className="stroke-foreground/60"
            strokeWidth={0.8}
            strokeLinecap="round"
            strokeDasharray="0.1 2"
          />
        );
      })}

      {diagram.meshes.map(({ gearAId, gearBId }) => {
        const [x1, y1] = centreOf(dances[gearAId]!, slotCount);
        const [x2, y2] = centreOf(dances[gearBId]!, slotCount);
        return (
          <line
            key={`${gearAId}-${gearBId}`}
            data-mesh={`${gearAId}-${gearBId}`}
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
          view={gearView(
            gear,
            dances[gear.id]!,
            slotCount,
            scale,
            states?.[gear.id]!.sees ?? false,
          )}
          radius={gear.teeth * scale}
          crank={crank}
          crankProps={gear.isDriver ? crankProps : undefined}
          adjustments={adjustments}
        />
      ))}

      <g
        data-sightlines
        style={{ display: now === markerOf(convergence) ? "inline" : "none" }}
      >
        {diagram.gears
          .filter((gear) => settledStates[gear.id]!.sees)
          .map((gear) => {
            const [cx, cy] = centreOf(settled[gear.id]!, slotCount);
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
      </g>
    </svg>
  );
}

function GearGlyph({
  gear,
  view,
  radius,
  crank,
  crankProps,
  adjustments,
}: {
  gear: Gear;
  view: ReturnType<typeof gearView>;
  radius: number;
  crank: number;
  crankProps?: CrankProps;
  adjustments?: Adjustments;
}) {
  const downCrank = useRef(crank);
  const swapped = adjustments?.swaps.some(
    ({ gearAId, gearBId }) => gearAId === gear.id || gearBId === gear.id,
  );
  const selected = adjustments?.selectedId === gear.id;
  return (
    <g
      transform={view.transform}
      className={
        crankProps
          ? "group cursor-grab outline-none active:cursor-grabbing"
          : adjustments
            ? "cursor-pointer"
            : undefined
      }
      {...(crankProps ?? {
        role: "img",
        "aria-label": `Gear ${gear.label}, ${gear.teeth} teeth`,
      })}
      onPointerDownCapture={() => {
        downCrank.current = crank;
      }}
      onClick={
        adjustments
          ? () => {
              if (crank === downCrank.current) adjustments.onPick(gear.id);
            }
          : undefined
      }
      data-gear={gear.label}
      data-slot={view.slot}
      data-facing-deg={view.facingDeg}
      data-sees={view.sees}
    >
      <path
        d={view.vision}
        className="pointer-events-none fill-none stroke-ludwig-red"
        strokeWidth={0.5}
        data-vision
      />
      {swapped || selected ? (
        <circle
          r={radius + TOOTH_DEPTH + 3.5}
          className={
            selected
              ? "pointer-events-none fill-none stroke-ludwig-red"
              : "pointer-events-none fill-none stroke-foreground"
          }
          strokeWidth={1.6}
          strokeDasharray={selected ? "2 1.5" : undefined}
          data-swap-mark={selected ? "selected" : "swapped"}
        />
      ) : null}
      {crankProps ? (
        <circle
          r={radius + TOOTH_DEPTH + 1.5}
          className="fill-none stroke-transparent group-focus-visible:stroke-ring"
          strokeWidth={1.4}
          data-focus-ring
        />
      ) : null}
      <g transform={view.rotate} data-cog>
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
