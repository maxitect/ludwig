"use client";

import type { MotionValue } from "motion/react";
import { type CSSProperties, useLayoutEffect, useRef } from "react";
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

/**
 * The board is 200 units wide and its container is a size container, so one unit is half a `cqw`.
 * Everything that moves is an HTML box positioned with a CSS transform: the compositor moves it and
 * the page never lays out again. Moving SVG geometry or an SVG transform instead costs one layout per frame.
 */
const cq = (units: number) => `${(units * 0.5).toFixed(3)}cqw`;
const translate = (x: number, y: number) => `translate(${cq(x)}, ${cq(y)})`;

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

/** Upright Xs in a fan of `halfWidthDeg` either side of straight up, as offsets from the gear's centre. */
function visionXs(radius: number, halfWidthDeg: number) {
  return X_ROWS.flatMap((offset) => {
    const distance = radius + TOOTH_DEPTH + offset;
    const count = Math.floor((toRad(2 * halfWidthDeg) * distance) / X_SPACING);
    return Array.from({ length: count + 1 }, (_, i) => {
      const spread =
        count === 0 ? 0 : -halfWidthDeg + (2 * halfWidthDeg * i) / count;
      return polar(spread, distance);
    });
  });
}

const slotAngle = (slot: number, slotCount: number) => (slot * 360) / slotCount;

/** Cog radius per tooth, shrunk so the largest cogs on neighbouring inner-ring slots never overlap. */
function toothScale({ gears, slotCount }: Diagram) {
  const halfGap = RING_IN * Math.sin(Math.PI / slotCount) - TOOTH_DEPTH;
  return Math.min(
    MAX_TOOTH_SCALE,
    halfGap / Math.max(...gears.map((g) => g.teeth)),
  );
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
function gearView(dance: DanceGear, slotCount: number, sees: boolean) {
  const [x, y] = centreOf(dance, slotCount);
  return {
    transform: translate(x, y),
    rotate: `rotate(${dance.facingDeg}deg)`,
    facing: `${dance.facingDeg}deg`,
    slot: dance.progress < 0.5 ? dance.fromSlot : dance.toSlot,
    facingDeg: dance.facingDeg,
    sees,
  };
}

/** A mesh is a 1 unit long, hairline box that is moved, turned and stretched between the two gear centres. */
function meshTransform(a: readonly [number, number], b: readonly [number, number]) {
  const [dx, dy] = [b[0] - a[0], b[1] - a[1]];
  const length = round(Math.hypot(dx, dy));
  const angle = round((Math.atan2(dy, dx) * 180) / Math.PI);
  return `${translate(a[0], a[1])} rotate(${angle}deg) scaleX(${length})`;
}

/** The engine's state at a convergence, or null while the dance is between two of them. */
function engineStateAt(diagram: Diagram, crank: number, position: number) {
  const figure = convergenceAt(position);
  return figure === null ? null : stateAt(diagram, crank, figure);
}

function setIfChanged(element: Element, name: string, value: string) {
  if (element.getAttribute(name) !== value) element.setAttribute(name, value);
}

/** Moves the board to `position` without a React render, writing only CSS transforms. */
function paint(
  board: HTMLElement,
  diagram: Diagram,
  crank: number,
  position: number,
) {
  const { slotCount } = diagram;
  const dances = danceAt(diagram, crank, position);
  const states = engineStateAt(diagram, crank, position);
  for (const gear of diagram.gears) {
    const view = gearView(
      dances[gear.id]!,
      slotCount,
      states?.[gear.id]!.sees ?? false,
    );
    const root = board.querySelector<HTMLElement>(
      `[data-gear="${gear.label}"]`,
    );
    if (!root) continue;
    root.style.transform = view.transform;
    // Not `data-slot`: the ui components' styles select on it, so writing it forces a layout.
    setIfChanged(root, "data-ring-slot", String(view.slot));
    setIfChanged(root, "data-facing-deg", String(view.facingDeg));
    setIfChanged(root, "data-sees", String(view.sees));
    const facing = root.querySelector<HTMLElement>("[data-facing]");
    facing?.style.setProperty("--facing", view.facing);
    if (facing) facing.style.transform = view.rotate;
  }
  for (const { gearAId, gearBId } of diagram.meshes) {
    const line = board.querySelector<HTMLElement>(
      `[data-mesh="${gearAId}-${gearBId}"]`,
    );
    if (line) {
      line.style.transform = meshTransform(
        centreOf(dances[gearAId]!, slotCount),
        centreOf(dances[gearBId]!, slotCount),
      );
    }
  }
}

/** Fix the Diagram state on the board. `diagram` already has the swaps applied; tapping a gear calls `onPick`. */
export type Adjustments = {
  swaps: Swaps;
  selectedId: string | null;
  onPick(gearId: string): void;
};

const layer = "pointer-events-none absolute inset-0 h-full w-full";

/**
 * `position` is the dance timeline in half-phases. The board repaints itself on every frame, so
 * playing the dance renders no React: React renders only when the crank or the settled convergence changes.
 */
export function GearBoard({
  diagram,
  crank,
  convergence,
  atConvergence,
  position,
  crankProps,
  adjustments,
}: {
  diagram: Diagram;
  crank: number;
  convergence: number;
  atConvergence: boolean;
  position: MotionValue<number>;
  crankProps?: CrankProps;
  adjustments?: Adjustments;
}) {
  const boardRef = useRef<HTMLDivElement>(null);
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
    const board = boardRef.current;
    if (!board) return;
    const repaint = (latest: number) => paint(board, diagram, crank, latest);
    repaint(position.get());
    return position.on("change", repaint);
  }, [diagram, crank, position]);

  return (
    <div
      ref={boardRef}
      role="group"
      aria-label="Gear floor"
      className="@container relative aspect-square w-full max-w-xl overflow-hidden border-2 border-border bg-card"
    >
      <svg viewBox="-100 -100 200 200" className={layer} aria-hidden>
        <circle
          r={RING_OUT}
          className="fill-none stroke-foreground/25"
          strokeWidth={0.6}
        />
        <circle
          r={RING_IN}
          className="fill-none stroke-foreground/25"
          strokeWidth={0.6}
        />
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
              className="stroke-foreground"
              strokeWidth={1}
              strokeLinecap="round"
              strokeDasharray="3 1.5"
            />
          );
        })}

        <circle r={VICTIM_RADIUS} className="fill-foreground" data-victim />
        <circle
          r={VICTIM_RADIUS + 2}
          className="fill-none stroke-foreground"
          strokeWidth={0.5}
        />
      </svg>

      {diagram.meshes.map(({ gearAId, gearBId }) => (
        <div
          key={`${gearAId}-${gearBId}`}
          data-mesh={`${gearAId}-${gearBId}`}
          aria-hidden
          className="pointer-events-none absolute top-1/2 left-1/2 -mt-[0.125cqw] h-[0.25cqw] w-[0.5cqw] origin-left bg-foreground/25"
          style={{
            transform: meshTransform(
              centreOf(dances[gearAId]!, slotCount),
              centreOf(dances[gearBId]!, slotCount),
            ),
          }}
        />
      ))}

      {diagram.gears.map((gear) => (
        <GearGlyph
          key={gear.id}
          gear={gear}
          view={gearView(
            dances[gear.id]!,
            slotCount,
            states?.[gear.id]!.sees ?? false,
          )}
          radius={gear.teeth * scale}
          crank={crank}
          crankProps={gear.isDriver ? crankProps : undefined}
          adjustments={adjustments}
        />
      ))}

      <svg viewBox="-100 -100 200 200" className={layer} aria-hidden>
        <g data-sightlines>
          {diagram.gears
            .filter((gear) => atConvergence && settledStates[gear.id]!.sees)
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
    </div>
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
  const cog = radius + TOOTH_DEPTH + 1.5;
  const hit = radius + TOOTH_DEPTH + 5;
  const xs = visionXs(radius, gear.halfWidthDeg);
  return (
    <div
      className="pointer-events-none absolute top-1/2 left-1/2 size-0"
      style={{ transform: view.transform }}
      data-gear={gear.label}
      data-ring-slot={view.slot}
      data-facing-deg={view.facingDeg}
      data-sees={view.sees}
    >
      <div
        data-facing
        className="pointer-events-none absolute top-1/2 left-1/2 size-0"
        style={
          {
            transform: view.rotate,
            "--facing": view.facing,
          } as CSSProperties
        }
      >
        {xs.map(([x, y], i) => (
          <svg
            key={i}
            data-vision
            viewBox={`${-X_HALF} ${-X_HALF} ${2 * X_HALF} ${2 * X_HALF}`}
            className="absolute overflow-visible"
            aria-hidden
            style={{
              left: cq(x - X_HALF),
              top: cq(y - X_HALF),
              width: cq(2 * X_HALF),
              height: cq(2 * X_HALF),
              transform: "rotate(calc(-1 * var(--facing)))",
            }}
          >
            <path
              d={`M${-X_HALF} ${-X_HALF} L${X_HALF} ${X_HALF} M${X_HALF} ${-X_HALF} L${-X_HALF} ${X_HALF}`}
              className="fill-none stroke-ludwig-red"
              strokeWidth={0.5}
            />
          </svg>
        ))}
        <svg
          data-cog
          viewBox={`${-cog} ${-cog} ${2 * cog} ${2 * cog}`}
          className="absolute overflow-visible"
          aria-hidden
          style={{
            left: cq(-cog),
            top: cq(-cog),
            width: cq(2 * cog),
            height: cq(2 * cog),
          }}
        >
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
        </svg>
      </div>
      <div
        className={`group pointer-events-auto absolute outline-none ${crankProps ? "cursor-grab active:cursor-grabbing" : adjustments ? "cursor-pointer" : ""}`}
        {...(crankProps ?? {
          role: "img",
          "aria-label": `Gear ${gear.label}, ${gear.teeth} teeth`,
        })}
        style={{
          ...crankProps?.style,
          top: cq(-hit),
          left: cq(-hit),
          width: cq(2 * hit),
          height: cq(2 * hit),
          clipPath: "circle(50%)",
        }}
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
      >
        <svg
          viewBox={`${-hit} ${-hit} ${2 * hit} ${2 * hit}`}
          className="pointer-events-none absolute inset-0 size-full"
          aria-hidden
        >
          {swapped || selected ? (
            <circle
              r={radius + TOOTH_DEPTH + 3.5}
              className={
                selected ? "fill-none stroke-ludwig-red" : "fill-none stroke-foreground"
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
        </svg>
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center leading-none"
        >
          <span
            className="font-display font-bold"
            style={{ fontSize: cq(radius > 9 ? 6 : 5) }}
          >
            {gear.label}
          </span>
          <span className="font-sans" style={{ fontSize: cq(3.4) }}>
            {gear.teeth}
          </span>
        </span>
      </div>
    </div>
  );
}
