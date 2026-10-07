"use client";

import {
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { cogPath } from "../_shared/cog-path";
import { useReduceMotion } from "@/utils/use-reduce-motion";
import type { SolverProps } from "../solver-types";
import { TrainBoard, pegAt } from "./board";
import { pegKey, radius, trainOf } from "./engine";
import { jamCogs, pegName, refusal, statusLine, unneededCogs } from "./play";
import type * as schema from "./schema";
import type { Cog } from "./schema";

type Peg = Pick<Cog, "row" | "col">;
type Teeth = Cog["teeth"];
type Notice = { kind: "placed" | "refused" | "info"; text: string };

const MOVES: Record<string, Peg> = {
  ArrowUp: { row: -1, col: 0 },
  ArrowDown: { row: 1, col: 0 },
  ArrowLeft: { row: 0, col: -1 },
  ArrowRight: { row: 0, col: 1 },
};

const DRAG_THRESHOLD = 6;

function TrayCog({ teeth }: { teeth: Teeth }) {
  const size = (teeth / 8) * 6;
  const reach = size + 1.5;
  return (
    <svg
      viewBox={`${-reach} ${-reach} ${2 * reach} ${2 * reach}`}
      className="size-12 shrink-0"
      aria-hidden
    >
      <path
        d={cogPath(teeth, size, 1)}
        className="fill-background stroke-foreground"
        strokeWidth={0.7}
      />
    </svg>
  );
}

/** The pegboard, the tray and the live train. Dragging a cog from the tray, or tray + arrow keys + Enter, places it. */
export function Solver({
  payload,
  initialState,
  onStateChange,
  registerCheck,
  solved,
}: SolverProps<typeof schema>) {
  const [cogs, setCogs] = useState<Cog[]>(initialState?.cogs ?? []);
  const [selected, setSelected] = useState<Teeth | null>(null);
  const [cursor, setCursor] = useState<Peg>({
    row: payload.driver.row,
    col: payload.driver.col,
  });
  const [notice, setNotice] = useState<Notice | null>(null);
  const [cursorNote, setCursorNote] = useState("");
  const [drag, setDrag] = useState<{ teeth: Teeth; x: number; y: number } | null>(
    null,
  );
  const boardRef = useRef<HTMLDivElement>(null);
  const press = useRef<{
    pointerId: number;
    x: number;
    y: number;
    moved: boolean;
  } | null>(null);
  const suppressClick = useRef(false);
  const reduceMotion = useReduceMotion();
  const helpId = useId();
  const locked = Boolean(solved);

  useEffect(() => {
    registerCheck(() => (cogs.length ? { cogs } : null));
  }, [registerCheck, cogs]);

  const train = useMemo(() => trainOf(payload, cogs), [payload, cogs]);
  const jammed = useMemo(
    () => (train.jammed ? jamCogs(payload, cogs) : []),
    [payload, cogs, train.jammed],
  );
  const unneeded = useMemo(
    () => (train.jammed ? [] : unneededCogs(payload, cogs)),
    [payload, cogs, train.jammed],
  );
  const status = useMemo(() => statusLine(payload, cogs), [payload, cogs]);
  const left = (teeth: Teeth) =>
    (payload.inventory.find((item) => item.teeth === teeth)?.count ?? 0) -
    cogs.filter((cog) => cog.teeth === teeth).length;

  function commit(next: Cog[]) {
    setCogs(next);
    onStateChange({ cogs: next });
  }

  function place(peg: Peg, teeth: Teeth) {
    const next = { ...peg, teeth };
    const why = refusal(payload, cogs, next);
    if (why) {
      setNotice({ kind: "refused", text: `Refused. ${why}` });
      return;
    }
    commit([...cogs, next]);
    if (left(teeth) <= 1) setSelected(null);
    setNotice({
      kind: "placed",
      text: `Placed a ${teeth}-tooth cog at ${pegName(peg)}.`,
    });
  }

  function remove(peg: Peg) {
    const found = cogs.find((cog) => pegKey(cog) === pegKey(peg));
    if (!found) {
      setNotice({ kind: "info", text: `Peg ${pegName(peg)} has no placed cog.` });
      return;
    }
    commit(cogs.filter((cog) => cog !== found));
    setNotice({
      kind: "info",
      text: `Returned the ${found.teeth}-tooth cog at ${pegName(peg)} to the tray.`,
    });
  }

  function describe(peg: Peg) {
    const cog = [payload.driver, payload.target, ...cogs].find(
      (c) => pegKey(c) === pegKey(peg),
    );
    const role =
      cog === payload.driver
        ? "the driver"
        : cog === payload.target
          ? "the target"
          : null;
    if (cog) {
      return `${pegName(peg)}: ${role ?? "a placed cog"}, ${cog.teeth} teeth.`;
    }
    return payload.bolts.some((bolt) => pegKey(bolt) === pegKey(peg))
      ? `${pegName(peg)}: bolt.`
      : `${pegName(peg)}: free peg.`;
  }

  function onBoardKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const move = MOVES[event.key];
    if (move) {
      event.preventDefault();
      const next = {
        row: Math.min(payload.rows - 1, Math.max(0, cursor.row + move.row)),
        col: Math.min(payload.cols - 1, Math.max(0, cursor.col + move.col)),
      };
      setCursor(next);
      setCursorNote(describe(next));
      return;
    }
    if (locked) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      if (selected === null) {
        setNotice({ kind: "info", text: "Choose a cog size in the tray first." });
      } else {
        place(cursor, selected);
      }
    } else if (event.key === "Delete" || event.key === "Backspace") {
      event.preventDefault();
      remove(cursor);
    }
  }

  function onBoardClick(event: MouseEvent<HTMLDivElement>) {
    if (suppressClick.current) {
      suppressClick.current = false;
      return;
    }
    const { peg, point } = pegAt(
      event.currentTarget,
      payload,
      event.clientX,
      event.clientY,
    );
    setCursor(peg);
    if (locked) return;
    const hit = cogs.find(
      (cog) =>
        Math.hypot(cog.row - point.row, cog.col - point.col) <= radius(cog),
    );
    if (hit) {
      remove(hit);
    } else if (selected !== null) {
      place(peg, selected);
    } else {
      setNotice({ kind: "info", text: "Choose a cog size in the tray first." });
    }
  }

  function onTrayDown(event: PointerEvent<HTMLButtonElement>) {
    if (locked || event.button !== 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    press.current = {
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      moved: false,
    };
  }

  function onTrayMove(event: PointerEvent<HTMLButtonElement>, teeth: Teeth) {
    const active = press.current;
    if (!active || active.pointerId !== event.pointerId) return;
    if (
      !active.moved &&
      Math.hypot(event.clientX - active.x, event.clientY - active.y) <
        DRAG_THRESHOLD
    ) {
      return;
    }
    active.moved = true;
    setDrag({ teeth, x: event.clientX, y: event.clientY });
    const board = boardRef.current;
    if (board) {
      const over = pegAt(board, payload, event.clientX, event.clientY);
      if (over.inside) setCursor(over.peg);
    }
  }

  function onTrayUp(event: PointerEvent<HTMLButtonElement>, teeth: Teeth) {
    const active = press.current;
    press.current = null;
    if (!active || !active.moved) return;
    suppressClick.current = true;
    setTimeout(() => {
      suppressClick.current = false;
    }, 0);
    setDrag(null);
    const board = boardRef.current;
    if (!board) return;
    const over = pegAt(board, payload, event.clientX, event.clientY);
    if (over.inside) place(over.peg, teeth);
  }

  const direction = payload.targetClockwise ? "clockwise" : "anticlockwise";
  const spinning = !reduceMotion;

  return (
    <section className="flex flex-col gap-4">
      <p>
        The driver turns <strong>clockwise</strong> (red handle). The target
        must turn <strong>{direction}</strong> (red arrow).
      </p>
      <p id={helpId} className="text-sm text-muted-foreground">
        Drag a cog from the tray onto a peg, or choose a size, move the peg
        cursor with the arrow keys and press Enter. Delete, or a tap on a
        placed cog, returns it to the tray.
      </p>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
        <TrainBoard
          payload={payload}
          placed={cogs}
          train={train}
          jammed={jammed}
          unneeded={unneeded}
          cursor={cursor}
          spin={spinning}
          arrows={!spinning}
          boardRef={boardRef}
          describedBy={helpId}
          onClick={onBoardClick}
          onKeyDown={onBoardKeyDown}
        />
        <div
          role="group"
          aria-label="Cog tray"
          className="flex flex-row flex-wrap gap-2 lg:flex-col"
        >
          {payload.inventory.map(({ teeth }) => {
            const remaining = left(teeth);
            return (
              <button
                key={teeth}
                type="button"
                aria-pressed={selected === teeth}
                aria-label={`${teeth}-tooth cog, ${remaining} left`}
                disabled={locked || remaining < 1}
                data-teeth={teeth}
                onClick={() => {
                  if (suppressClick.current) return;
                  setSelected(selected === teeth ? null : teeth);
                }}
                onPointerDown={onTrayDown}
                onPointerMove={(event) => onTrayMove(event, teeth)}
                onPointerUp={(event) => onTrayUp(event, teeth)}
                onPointerCancel={() => {
                  press.current = null;
                  setDrag(null);
                }}
                className="flex touch-none items-center gap-2 border-2 border-border bg-card p-2 select-none enabled:cursor-grab enabled:hover:bg-muted aria-pressed:border-primary aria-pressed:bg-muted disabled:opacity-50 focus-visible:outline-3 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                <TrayCog teeth={teeth} />
                <span className="flex flex-col items-start leading-tight">
                  <span className="font-display font-bold whitespace-nowrap">{teeth} teeth</span>
                  <span className="text-sm">{remaining} left</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>
      {drag && (
        <div
          aria-hidden
          className="pointer-events-none fixed z-50 -translate-1/2 border-2 border-border bg-background px-2 py-1 font-display font-bold"
          style={{ left: drag.x, top: drag.y }}
        >
          {drag.teeth}
        </div>
      )}
      <p
        aria-live="polite"
        data-testid="train-status"
        className="min-h-6 font-bold"
      >
        {status}
      </p>
      <p
        aria-live="polite"
        data-testid="placement-notice"
        data-kind={notice?.kind}
        className="min-h-6"
      >
        {notice?.text}
      </p>
      <p aria-live="polite" className="sr-only">
        {cursorNote}
      </p>
    </section>
  );
}
