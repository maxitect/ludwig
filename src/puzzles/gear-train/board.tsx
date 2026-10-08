"use client";

import {
  type CSSProperties,
  type KeyboardEventHandler,
  type MouseEvent,
  type Ref,
} from "react";
import { cogPath, polar } from "../_shared/cog-path";
import { type Peg, type Train, pegKey, radius } from "./engine";
import "./gear-train.css";
import type { Cog, Payload } from "./schema";

type Dimensions = Pick<Payload, "rows" | "cols">;

/** One peg is 20 units, and the board has half a peg of margin all round. */
const UNIT = 20;
const TOOTH_DEPTH = 3;
const SECONDS_PER_REVOLUTION_8 = 3;

const centre = ({ row, col }: Peg) => `translate(${col * UNIT} ${row * UNIT})`;
const discRadius = (cog: Pick<Cog, "teeth">) => radius(cog) * UNIT;

/** The peg nearest to a pointer, and how far it is from the pointer in pegs. */
export function pegAt(
  element: Element,
  { rows, cols }: Dimensions,
  clientX: number,
  clientY: number,
) {
  const box = element.getBoundingClientRect();
  const x = ((clientX - box.left) / box.width) * cols - 0.5;
  const y = ((clientY - box.top) / box.height) * rows - 0.5;
  const peg = {
    row: Math.min(rows - 1, Math.max(0, Math.round(y))),
    col: Math.min(cols - 1, Math.max(0, Math.round(x))),
  };
  const inside = x >= -0.5 && x <= cols - 0.5 && y >= -0.5 && y <= rows - 0.5;
  return { peg, point: { row: y, col: x }, inside };
}

function TurnArrow({
  size,
  clockwise,
  from = -50,
  to = 50,
  className,
  width = 1.8,
}: {
  size: number;
  clockwise: boolean;
  from?: number;
  to?: number;
  className: string;
  width?: number;
}) {
  const [x1, y1] = polar(from, size);
  const [x2, y2] = polar(to, size);
  const theta = (to * Math.PI) / 180;
  const [tx, ty] = [Math.cos(theta), Math.sin(theta)];
  const [nx, ny] = [Math.sin(theta), -Math.cos(theta)];
  const head = [
    [x2 + tx * 4, y2 + ty * 4],
    [x2 + nx * 3, y2 + ny * 3],
    [x2 - nx * 3, y2 - ny * 3],
  ]
    .map(([x, y]) => `${x.toFixed(2)} ${y.toFixed(2)}`)
    .join(" L");
  return (
    <g
      transform={clockwise ? undefined : "scale(-1 1)"}
      className={className}
      aria-hidden
    >
      <path
        d={`M${x1} ${y1} A${size} ${size} 0 0 1 ${x2} ${y2}`}
        fill="none"
        strokeWidth={width}
        strokeLinecap="round"
      />
      <path d={`M${head} Z`} className="fill-current" strokeWidth={0.6} />
    </g>
  );
}

function CogGlyph({
  cog,
  fixed,
  driver,
  sign,
  spin,
  arrows,
  jammed,
  unneeded,
}: {
  cog: Cog;
  fixed: boolean;
  driver: boolean;
  sign: 1 | -1 | undefined;
  spin: boolean;
  arrows: boolean;
  jammed: boolean;
  unneeded: boolean;
}) {
  const size = discRadius(cog);
  const turning = sign !== undefined;
  const style = {
    "--period": `${(SECONDS_PER_REVOLUTION_8 * cog.teeth) / 8}s`,
    "--direction": sign === -1 ? "reverse" : "normal",
  } as CSSProperties;
  return (
    <g transform={centre(cog)} data-cog={`${cog.row},${cog.col}`}>
      <g className={spin && turning ? "gear-train-spin" : undefined} style={style}>
        <path
          d={cogPath(cog.teeth, size, TOOTH_DEPTH)}
          className="fill-background stroke-foreground"
          strokeWidth={fixed ? 2.2 : 1.2}
          strokeLinejoin="miter"
          strokeDasharray={unneeded ? "4 2.5" : undefined}
        />
        {driver && (
          <>
            <line
              x1={0}
              y1={0}
              x2={0}
              y2={-size * 0.62}
              className="stroke-ludwig-red"
              strokeWidth={2}
            />
            <circle
              cy={-size * 0.62}
              r={3.6}
              className="fill-ludwig-red stroke-foreground"
              strokeWidth={0.8}
              data-crank
            />
          </>
        )}
      </g>
      <text
        y={driver ? size * 0.32 : 2.6}
        textAnchor="middle"
        className="fill-foreground font-display text-[8px] font-bold"
        aria-hidden
      >
        {cog.teeth}
      </text>
      {arrows && turning && (
        <TurnArrow
          size={size * 0.58}
          clockwise={sign === 1}
          className="stroke-foreground text-foreground"
          width={1.4}
        />
      )}
      {jammed && (
        <path
          data-jam
          d={`M${-size * 0.5} ${-size * 0.5} L${size * 0.5} ${size * 0.5} M${size * 0.5} ${-size * 0.5} L${-size * 0.5} ${size * 0.5}`}
          className="stroke-ludwig-red"
          strokeWidth={3}
          strokeLinecap="round"
          fill="none"
        />
      )}
    </g>
  );
}

const HEXAGON = Array.from({ length: 6 }, (_, i) => polar(i * 60 + 30, 5.5))
  .map(([x, y]) => `${x} ${y}`)
  .join(" L");

/**
 * The pegboard. Cogs turn with a CSS animation on their own group, one revolution in
 * `3 s * teeth / 8`, so every cog runs at the speed its size implies. `arrows` swaps the
 * animation for a direction arrow on each cog.
 */
export function TrainBoard({
  payload,
  placed,
  train,
  jammed,
  unneeded,
  cursor,
  spin,
  arrows,
  boardRef,
  describedBy,
  onClick,
  onKeyDown,
}: {
  payload: Payload;
  placed: Cog[];
  train: Train;
  jammed: Cog[];
  unneeded: Cog[];
  cursor: Peg;
  spin: boolean;
  arrows: boolean;
  boardRef: Ref<HTMLDivElement>;
  describedBy: string;
  onClick(event: MouseEvent<HTMLDivElement>): void;
  onKeyDown: KeyboardEventHandler<HTMLDivElement>;
}) {
  const { rows, cols, driver, target, bolts } = payload;
  const jamKeys = new Set(jammed.map(pegKey));
  const spareKeys = new Set(unneeded.map(pegKey));
  const glyph = (cog: Cog, fixed: boolean, isDriver = false) => (
    <CogGlyph
      key={pegKey(cog)}
      cog={cog}
      fixed={fixed}
      driver={isDriver}
      sign={train.signs[pegKey(cog)]}
      spin={spin}
      arrows={arrows}
      jammed={jamKeys.has(pegKey(cog))}
      unneeded={spareKeys.has(pegKey(cog))}
    />
  );
  return (
    <div
      ref={boardRef}
      role="group"
      aria-label="Pegboard"
      aria-describedby={describedBy}
      tabIndex={0}
      onClick={onClick}
      onKeyDown={onKeyDown}
      className="group relative w-full cursor-pointer border-2 border-border bg-card outline-none focus-visible:outline-3 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-ring"
      style={{
        aspectRatio: `${cols} / ${rows}`,
        maxWidth: `${cols * 3.5}rem`,
      }}
    >
      <svg
        viewBox={`${-UNIT / 2} ${-UNIT / 2} ${cols * UNIT} ${rows * UNIT}`}
        className="block size-full"
        aria-hidden
      >
        {Array.from({ length: rows }, (_, row) =>
          Array.from({ length: cols }, (_, col) => (
            <circle
              key={`${row},${col}`}
              cx={col * UNIT}
              cy={row * UNIT}
              r={1.6}
              className="fill-foreground/40"
            />
          )),
        )}
        {bolts.map(({ row, col }) => (
          <g key={`${row},${col}`} transform={centre({ row, col })} data-bolt>
            <path
              d={`M${HEXAGON} Z`}
              className="fill-foreground"
            />
            <circle r={1.8} className="fill-background" />
          </g>
        ))}
        {placed.map((cog) => glyph(cog, false))}
        {glyph(driver, true, true)}
        {glyph(target, true)}
        <g
          transform={centre(target)}
          data-target-arrow={payload.targetClockwise ? "cw" : "ccw"}
        >
          <TurnArrow
            size={discRadius(target) + TOOTH_DEPTH + 4}
            clockwise={payload.targetClockwise}
            from={-40}
            to={40}
            className="stroke-ludwig-red text-ludwig-red"
            width={2}
          />
        </g>
        <rect
          transform={centre(cursor)}
          x={-UNIT / 2 + 1}
          y={-UNIT / 2 + 1}
          width={UNIT - 2}
          height={UNIT - 2}
          fill="none"
          strokeWidth={2}
          strokeDasharray="3 2"
          className="stroke-transparent group-focus-visible:stroke-ring"
          data-cursor={`${cursor.row},${cursor.col}`}
        />
      </svg>
    </div>
  );
}
