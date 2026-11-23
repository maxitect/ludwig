import type { ComponentProps } from "react";
import { cn } from "@/utils/cn";

/** Largest width of a board `cols` cells wide. The desktop layout raises each cell cap to 4.5rem through `--cell-cap`. */
export const capWidth = (cols: number, cellRem: number) =>
  `calc(${cols} * max(${cellRem}rem, var(--cell-cap, 0rem)))`;

/** Widest board that keeps `rows` rows inside the desktop board height (`--board-h`; unbounded elsewhere). */
export const heightWidth = (cols: number, rows: number) =>
  `calc(var(--board-h, 100000px) * ${cols} / ${rows})`;

/**
 * Parts of a solver in the desktop board-and-panel layout (SPEC §4.5). Below `lg` and under `touch` they all
 * render as `display: contents`, so the stacked layout is the solver's own. From `lg` the chrome's grid places
 * them: the board on the left, the panel's head, body (which scrolls) and foot on the right above Check and Reset.
 */
export function SolveLayout({ className, ...rest }: ComponentProps<"div">) {
  return <div className={cn(className, "panel:contents")} {...rest} />;
}

export function BoardCell({ className, ...rest }: ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "contents panel:col-start-1 panel:row-span-6 panel:row-start-2 panel:block panel:min-h-0 panel:min-w-0 panel:[--board-h:var(--solver-height)] panel:[--board-w:100cqw] panel:[--cell-cap:4.5rem] panel:[container-type:inline-size]",
        className,
      )}
      {...rest}
    />
  );
}

const PART = {
  head: "panel:row-start-2",
  body: "panel:relative panel:row-start-3 panel:min-h-0 panel:overflow-y-auto panel:px-1",
  foot: "panel:row-start-4",
} as const;

export function PanelCell({
  part = "body",
  className,
  ...rest
}: ComponentProps<"div"> & { part?: keyof typeof PART }) {
  return (
    <div
      data-panel-scroll={part === "body" ? "" : undefined}
      className={cn(
        "contents panel:col-start-2 panel:block panel:min-w-0 panel:pb-3",
        PART[part],
        className,
      )}
      {...rest}
    />
  );
}
