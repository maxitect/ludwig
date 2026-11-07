"use client";

import { select } from "d3-selection";
import "d3-transition";
import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { useReduceMotion } from "@/utils/use-reduce-motion";

const DURATION = 500;
const STAGGER = 18;
const MAX_DELAY = 360;

/**
 * Draws the marks inside `ref` in on first paint, then leaves them exactly as React rendered them.
 * Marks opt in by attribute: `data-grow-w`, `data-grow-h` (final height, bottom-anchored),
 * `data-draw` (a path) and `data-pop` ("cx,cy" of a mark scaled up from its centre).
 * With reduced motion nothing runs and the marks stay fully drawn.
 */
export function useIntro<T extends Element>() {
  const ref = useRef<T>(null);
  const reduce = useReduceMotion();

  useLayoutEffect(() => {
    const root = ref.current;
    if (!root || reduce) return;
    const stagger = (i: number) => Math.min(i * STAGGER, MAX_DELAY);
    const marks = select(root);

    marks
      .selectAll<SVGElement, unknown>("[data-grow-w]")
      .each(function (_, i) {
        select(this)
          .attr("width", 0)
          .transition()
          .delay(stagger(i))
          .duration(DURATION)
          .attr("width", Number(this.dataset.growW));
      });

    marks
      .selectAll<SVGElement, unknown>("[data-grow-h]")
      .each(function (_, i) {
        const node = select(this);
        const height = Number(this.dataset.growH);
        const bottom = Number(node.attr("y")) + height;
        node
          .attr("height", 0)
          .attr("y", bottom)
          .transition()
          .delay(stagger(i))
          .duration(DURATION)
          .attr("height", height)
          .attr("y", bottom - height);
      });

    marks.selectAll<SVGPathElement, unknown>("[data-draw]").each(function () {
      const length = this.getTotalLength();
      select(this)
        .attr("stroke-dasharray", length)
        .attr("stroke-dashoffset", length)
        .transition()
        .duration(DURATION * 1.6)
        .attr("stroke-dashoffset", 0)
        .on("end", function () {
          select(this)
            .attr("stroke-dasharray", null)
            .attr("stroke-dashoffset", null);
        });
    });

    marks.selectAll<SVGElement, unknown>("[data-pop]").each(function (_, i) {
      const [cx, cy] = (this.dataset.pop ?? "0,0").split(",").map(Number);
      const about = (k: number) =>
        `translate(${cx} ${cy}) scale(${k}) translate(${-cx} ${-cy})`;
      select(this)
        .attr("transform", about(0))
        .transition()
        .delay(stagger(i))
        .duration(DURATION)
        .attrTween("transform", () => (t) => about(t))
        .on("end", function () {
          select(this).attr("transform", null);
        });
    });

    return () => {
      marks.selectAll("*").interrupt();
    };
  }, [reduce]);

  return ref;
}

export type TipState = { text: string; x: number; y: number } | null;

/** A tooltip shown on hover and on focus, positioned from the mark's own box inside the chart frame. */
export function useTip<T extends HTMLElement = HTMLDivElement>() {
  const frame = useRef<T>(null);
  const [tip, setTip] = useState<TipState>(null);

  const show = useCallback((target: Element, text: string, at?: { x: number; y: number }) => {
    const box = frame.current?.getBoundingClientRect();
    if (!box) return;
    const rect = target.getBoundingClientRect();
    setTip({
      text,
      x: at?.x ?? rect.left + rect.width / 2 - box.left,
      y: at?.y ?? rect.top - box.top,
    });
  }, []);
  const hide = useCallback(() => setTip(null), []);

  return { frame, tip, show, hide };
}

export function Tip({ tip }: { tip: TipState }) {
  if (!tip) return null;
  return (
    <div
      role="tooltip"
      style={{ left: tip.x, top: tip.y }}
      className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full border-2 border-border bg-popover px-2 py-1 font-display text-xs font-bold tracking-[0.04em] whitespace-nowrap text-popover-foreground shadow-[3px_3px_0_var(--cast)]"
    >
      {tip.text}
    </div>
  );
}

export function ChartFrame({
  id,
  question,
  children,
  className = "",
}: {
  id: string;
  question: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      aria-labelledby={id}
      className={`flex flex-col gap-3 border-2 border-border bg-card p-4 ${className}`}
    >
      <h3
        id={id}
        className="font-display text-lg font-bold tracking-[0.04em] uppercase"
      >
        {question}
      </h3>
      {children}
    </section>
  );
}

export function DataTable({
  caption,
  head,
  rows,
}: {
  caption: string;
  head: string[];
  rows: (string | number)[][];
}) {
  return (
    <table className="sr-only">
      <caption>{caption}</caption>
      <thead>
        <tr>
          {head.map((cell) => (
            <th key={cell} scope="col">
              {cell}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.join("|")}>
            {row.map((cell, index) =>
              index === 0 ? (
                <th key={index} scope="row">
                  {cell}
                </th>
              ) : (
                <td key={index}>{cell}</td>
              ),
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
