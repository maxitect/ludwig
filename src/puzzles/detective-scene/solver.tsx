"use client";

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { MinusIcon, PlusIcon, RotateCcwIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  loadFoundItems,
  revealScene,
  tryFind,
} from "@/lib/actions/detective-scene";
import { regionCentre } from "../_shared/regions";
import { getScene } from "./scenes";
import {
  HOME,
  MAX_SCALE,
  MIN_SCALE,
  panBy,
  panToShow,
  toScene,
  zoomAt,
  type Point,
  type View,
} from "./view";
import type { SolverProps } from "../solver-types";
import type * as schema from "./schema";

const COLUMNS = 40;
const GUIDE_EVERY = 5;
const TAP_SLOP = 6;
const ZOOM_STEP = 1.5;
const MARKER_PX = 11;
const PIN_PX = 9;

type Cursor = { column: number; row: number };
type Item = Extract<
  Awaited<ReturnType<typeof loadFoundItems>>,
  { ok: true }
>["items"][number];

const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);
const midpoint = (a: Point, b: Point) => ({
  x: (a.x + b.x) / 2,
  y: (a.y + b.y) / 2,
});

function Marker({
  item,
  unit,
  revealed,
}: {
  item: Item;
  unit: number;
  revealed: boolean;
}) {
  const { x, y, width, height } = item.region;
  const centre = regionCentre(item.region);
  return (
    <g data-testid={revealed ? "revealed-ring" : "found-ring"}>
      <ellipse
        cx={centre.x}
        cy={centre.y}
        rx={width * 0.55 + 8}
        ry={height * 0.55 + 8}
        transform={`rotate(-3 ${centre.x} ${centre.y})`}
        fill="none"
        stroke="var(--color-ludwig-red)"
        strokeWidth={3}
        strokeLinecap="round"
        strokeDasharray={revealed ? "8 6" : undefined}
        vectorEffect="non-scaling-stroke"
      />
      <circle
        cx={x}
        cy={y}
        r={MARKER_PX * unit}
        className={revealed ? "fill-card" : "fill-primary"}
        stroke="var(--color-ludwig-red)"
        strokeWidth={2}
        vectorEffect="non-scaling-stroke"
      />
      <text
        x={x}
        y={y}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={MARKER_PX * 1.1 * unit}
        className={
          revealed
            ? "fill-card-foreground font-display font-bold"
            : "fill-primary-foreground font-display font-bold"
        }
      >
        {item.position + 1}
      </text>
    </g>
  );
}

export function Solver({
  payload,
  initialState,
  onStateChange,
  registerCheck,
  requestCheck,
}: SolverProps<typeof schema>) {
  const { puzzleId, sceneKey, width, height, itemCount } = payload;
  const scene = getScene(sceneKey);
  const rows = Math.round((COLUMNS * height) / width);
  const sector = { width: width / COLUMNS, height: height / rows };
  const helpId = useId();
  const inputId = useId();
  const viewportRef = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const [view, setViewState] = useState<View>(HOME);
  const viewRef = useRef(view);
  const [pixelWidth, setPixelWidth] = useState(0);
  const [found, setFound] = useState<ReadonlyMap<number, Item>>(new Map());
  const foundRef = useRef(found);
  const [revealed, setRevealed] = useState<readonly Item[]>([]);
  const [pin, setPin] = useState<Point | null>(null);
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [cursor, setCursor] = useState<Cursor>({
    column: COLUMNS / 2,
    row: Math.floor(rows / 2),
  });
  const [focused, setFocused] = useState(false);
  const focusInput = useRef(false);
  const completedByFind = useRef(false);
  const pointers = useRef(new Map<number, Point>());
  const gesture = useRef({ start: { x: 0, y: 0 }, moved: false });
  const complete = found.size === itemCount;

  const viewportSize = useCallback(() => {
    const box = viewportRef.current?.getBoundingClientRect();
    return { width: box?.width ?? 0, height: box?.height ?? 0 };
  }, []);

  const setView = useCallback((next: View) => {
    viewRef.current = next;
    setViewState(next);
  }, []);

  useLayoutEffect(() => {
    const element = viewportRef.current;
    if (!element) return;
    const observer = new ResizeObserver(() =>
      setPixelWidth(element.getBoundingClientRect().width),
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const element = viewportRef.current;
    if (!element) return;
    const wheel = (event: WheelEvent) => {
      if (!event.ctrlKey && !event.metaKey) return;
      event.preventDefault();
      const box = element.getBoundingClientRect();
      setView(
        zoomAt(
          viewRef.current,
          { width: box.width, height: box.height },
          Math.exp(-event.deltaY * 0.01),
          { x: event.clientX - box.left, y: event.clientY - box.top },
        ),
      );
    };
    element.addEventListener("wheel", wheel, { passive: false });
    return () => element.removeEventListener("wheel", wheel);
  }, [setView]);

  useEffect(() => {
    const saved = initialState?.found ?? [];
    if (!saved.length) return;
    let cancelled = false;
    loadFoundItems(puzzleId, saved)
      .then((result) => {
        if (cancelled) return;
        if (!result.ok) {
          return setStatus("Your saved finds could not be loaded.");
        }
        foundRef.current = new Map([
          ...result.items.map((item) => [item.position, item] as const),
          ...foundRef.current,
        ]);
        setFound(foundRef.current);
      })
      .catch(() => setStatus("Your saved finds could not be loaded."));
    return () => {
      cancelled = true;
    };
  }, [initialState, puzzleId]);

  useEffect(() => {
    registerCheck(() =>
      complete
        ? {
            finds: [...found.values()].map(({ title, region }) => ({
              ...regionCentre(region),
              title,
            })),
          }
        : null,
    );
  }, [registerCheck, complete, found]);

  useEffect(() => {
    if (complete && completedByFind.current) {
      completedByFind.current = false;
      requestCheck?.();
    }
  }, [complete, requestCheck]);

  useEffect(() => {
    if (pin && focusInput.current) {
      focusInput.current = false;
      input.current?.focus();
    }
  }, [pin]);

  function dropPin(point: Point) {
    if (complete) return;
    setPin(point);
    setStatus("Pin placed. Type the title hidden here.");
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!pin || busy || complete || !typed.trim()) return;
    setBusy(true);
    try {
      const result = await tryFind(puzzleId, pin.x, pin.y, typed);
      if (!result.ok) return setStatus("That guess could not be checked.");
      if (!result.found) {
        return setStatus("No match there. Check the spot and the title.");
      }
      const item = result.found;
      if (foundRef.current.has(item.position)) {
        return setStatus(`Already found: ${item.title}.`);
      }
      const next = new Map(foundRef.current).set(item.position, item);
      foundRef.current = next;
      setFound(next);
      setPin(null);
      setTyped("");
      completedByFind.current = next.size === itemCount;
      onStateChange({ found: [...next.keys()].sort((a, b) => a - b) });
      setStatus(`Found ${item.title}. ${next.size} of ${itemCount}.`);
    } catch {
      setStatus("That guess could not be checked.");
    } finally {
      setBusy(false);
    }
  }

  async function reveal() {
    try {
      const result = await revealScene(puzzleId);
      if (!result.ok) return setStatus("The titles could not be revealed.");
      setRevealed(result.items);
      setStatus("Every title is listed and ringed.");
    } catch {
      setStatus("The titles could not be revealed.");
    }
  }

  function zoom(factor: number) {
    const size = viewportSize();
    setView(
      zoomAt(viewRef.current, size, factor, {
        x: size.width / 2,
        y: size.height / 2,
      }),
    );
  }

  function local(event: React.PointerEvent): Point {
    const box = event.currentTarget.getBoundingClientRect();
    return { x: event.clientX - box.left, y: event.clientY - box.top };
  }

  function onPointerDown(event: React.PointerEvent<HTMLDivElement>) {
    event.currentTarget.setPointerCapture(event.pointerId);
    const point = local(event);
    pointers.current.set(event.pointerId, point);
    if (pointers.current.size === 1) {
      gesture.current = { start: point, moved: false };
    } else {
      gesture.current.moved = true;
    }
  }

  function onPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const previous = pointers.current.get(event.pointerId);
    if (!previous) return;
    const point = local(event);
    const size = viewportSize();
    const others = [...pointers.current.entries()].filter(
      ([id]) => id !== event.pointerId,
    );
    pointers.current.set(event.pointerId, point);
    if (others.length === 1) {
      const other = others[0][1];
      const before = distance(previous, other);
      const centre = midpoint(point, other);
      const was = midpoint(previous, other);
      const zoomed = zoomAt(
        viewRef.current,
        size,
        before > 0 ? distance(point, other) / before : 1,
        centre,
      );
      setView(panBy(zoomed, size, centre.x - was.x, centre.y - was.y));
      return;
    }
    if (!gesture.current.moved) {
      if (distance(point, gesture.current.start) < TAP_SLOP) return;
      gesture.current.moved = true;
    }
    setView(
      panBy(viewRef.current, size, point.x - previous.x, point.y - previous.y),
    );
  }

  function onPointerEnd(event: React.PointerEvent<HTMLDivElement>) {
    if (!pointers.current.has(event.pointerId)) return;
    const tapped =
      event.type === "pointerup" &&
      pointers.current.size === 1 &&
      !gesture.current.moved;
    pointers.current.delete(event.pointerId);
    if (!tapped) return;
    const point = local(event);
    dropPin(
      toScene(viewRef.current, viewportSize(), { width, height }, point),
    );
  }

  function onKeyDown(event: React.KeyboardEvent) {
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    const step = event.shiftKey ? GUIDE_EVERY : 1;
    const moves: Record<string, Cursor> = {
      ArrowLeft: { column: -step, row: 0 },
      ArrowRight: { column: step, row: 0 },
      ArrowUp: { column: 0, row: -step },
      ArrowDown: { column: 0, row: step },
    };
    if (event.key === "Enter") {
      event.preventDefault();
      focusInput.current = true;
      dropPin({
        x: (cursor.column + 0.5) * sector.width,
        y: (cursor.row + 0.5) * sector.height,
      });
      input.current?.focus();
    } else if (event.key === "+" || event.key === "=") {
      event.preventDefault();
      zoom(ZOOM_STEP);
    } else if (event.key === "-") {
      event.preventDefault();
      zoom(1 / ZOOM_STEP);
    } else if (event.key === "0") {
      event.preventDefault();
      setView(HOME);
    } else if (Object.hasOwn(moves, event.key)) {
      event.preventDefault();
      const move = moves[event.key];
      const next = {
        column: Math.min(COLUMNS - 1, Math.max(0, cursor.column + move.column)),
        row: Math.min(rows - 1, Math.max(0, cursor.row + move.row)),
      };
      setCursor(next);
      setView(
        panToShow(
          viewRef.current,
          viewportSize(),
          {
            x: (next.column + 0.5) / COLUMNS,
            y: (next.row + 0.5) / rows,
          },
          48,
        ),
      );
      setStatus(
        `Column ${next.column + 1} of ${COLUMNS}, row ${next.row + 1} of ${rows}.`,
      );
    }
  }

  if (!scene) return <p>This scene is not available.</p>;
  const { Art } = scene;
  const unit = pixelWidth ? width / (pixelWidth * view.scale) : 0;
  const showCursor = focused && !complete;
  const listed = [
    ...new Map(
      [...revealed, ...found.values()].map((item) => [item.position, item]),
    ).values(),
  ].sort((a, b) => a.position - b.position);

  return (
    <div className="flex flex-col gap-4">
      <p className="text-lg">
        Found{" "}
        <span className="font-mono tabular-nums">
          {found.size} of {itemCount}
        </span>{" "}
        titles.
      </p>
      <p id={helpId} className="sr-only">
        Focus the scene, move the highlighted sector with the arrow keys, Shift
        and an arrow key moves five sectors, press Enter to pin the
        sector&rsquo;s centre, then type the title hidden there and press Enter
        again. Plus and minus zoom, and 0 resets the view.
      </p>
      <div className="border-2 border-border bg-card text-card-foreground shadow-[3px_3px_0_var(--cast)]">
        <div
          ref={viewportRef}
          role="group"
          aria-label="The street scene"
          aria-describedby={helpId}
          tabIndex={0}
          onKeyDown={onKeyDown}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerEnd}
          onPointerCancel={onPointerEnd}
          style={{ aspectRatio: `${width} / ${height}` }}
          className="relative w-full cursor-crosshair touch-none overflow-hidden select-none focus-visible:outline-3 focus-visible:outline-solid focus-visible:outline-offset-4 focus-visible:outline-ring"
        >
          <div
            data-testid="scene-layer"
            data-scale={view.scale}
            className="absolute inset-0 origin-top-left"
            style={{
              transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})`,
            }}
          >
            <Art className="absolute inset-0 size-full" aria-hidden="true" />
            <svg
              viewBox={`0 0 ${width} ${height}`}
              className="pointer-events-none absolute inset-0 size-full"
              aria-hidden="true"
            >
              {revealed
                .filter(({ position }) => !found.has(position))
                .map((item) => (
                  <Marker
                    key={`r${item.position}`}
                    item={item}
                    unit={unit}
                    revealed
                  />
                ))}
              {[...found.values()].map((item) => (
                <Marker
                  key={item.position}
                  item={item}
                  unit={unit}
                  revealed={false}
                />
              ))}
              {pin && (
                <g
                  data-testid="pin"
                  stroke="currentColor"
                  fill="none"
                  strokeWidth={2}
                  vectorEffect="non-scaling-stroke"
                >
                  <circle cx={pin.x} cy={pin.y} r={PIN_PX * unit} />
                  <path
                    d={`M${pin.x - PIN_PX * 1.6 * unit} ${pin.y}h${PIN_PX * 3.2 * unit}M${pin.x} ${pin.y - PIN_PX * 1.6 * unit}v${PIN_PX * 3.2 * unit}`}
                  />
                </g>
              )}
              {showCursor && (
                <g stroke="var(--color-grid-blue)" fill="none">
                  {Array.from({ length: COLUMNS / GUIDE_EVERY - 1 }, (_, i) => (
                    <line
                      key={`v${i}`}
                      x1={(i + 1) * GUIDE_EVERY * sector.width}
                      y1={0}
                      x2={(i + 1) * GUIDE_EVERY * sector.width}
                      y2={height}
                      strokeWidth={1}
                      strokeDasharray="2 4"
                      vectorEffect="non-scaling-stroke"
                    />
                  ))}
                  {Array.from(
                    { length: Math.floor((rows - 1) / GUIDE_EVERY) },
                    (_, i) => (
                      <line
                        key={`h${i}`}
                        x1={0}
                        y1={(i + 1) * GUIDE_EVERY * sector.height}
                        x2={width}
                        y2={(i + 1) * GUIDE_EVERY * sector.height}
                        strokeWidth={1}
                        strokeDasharray="2 4"
                        vectorEffect="non-scaling-stroke"
                      />
                    ),
                  )}
                  <rect
                    data-testid="sector"
                    x={cursor.column * sector.width}
                    y={cursor.row * sector.height}
                    width={sector.width}
                    height={sector.height}
                    strokeWidth={2}
                    vectorEffect="non-scaling-stroke"
                  />
                </g>
              )}
            </svg>
          </div>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="secondary"
          size="icon"
          aria-label="Zoom in"
          disabled={view.scale >= MAX_SCALE}
          onClick={() => zoom(ZOOM_STEP)}
        >
          <PlusIcon aria-hidden="true" />
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="icon"
          aria-label="Zoom out"
          disabled={view.scale <= MIN_SCALE}
          onClick={() => zoom(1 / ZOOM_STEP)}
        >
          <MinusIcon aria-hidden="true" />
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="icon"
          aria-label="Reset view"
          disabled={view.scale === HOME.scale}
          onClick={() => setView(HOME)}
        >
          <RotateCcwIcon aria-hidden="true" />
        </Button>
        {!complete && (
          <Button
            type="button"
            variant="ghost"
            className="ml-auto"
            onClick={reveal}
          >
            Reveal
          </Button>
        )}
      </div>
      <form onSubmit={submit} className="flex items-end gap-3">
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <label htmlFor={inputId} className="text-sm text-muted-foreground">
            {pin
              ? "Which title is hidden at the pin?"
              : "Tap the scene to drop a pin."}
          </label>
          <Input
            id={inputId}
            ref={input}
            value={typed}
            disabled={!pin || complete}
            maxLength={80}
            autoComplete="off"
            autoCapitalize="words"
            spellCheck={false}
            onChange={(event) => setTyped(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Escape") viewportRef.current?.focus();
            }}
          />
        </div>
        <Button
          type="submit"
          disabled={!pin || busy || complete || !typed.trim()}
        >
          Try it
        </Button>
      </form>
      <p
        role="status"
        aria-live="polite"
        data-testid="scene-status"
        className="min-h-6"
      >
        {status}
      </p>
      {listed.length > 0 && (
        <ol className="flex flex-col gap-1" aria-label="Titles">
          {listed.map((item) => (
            <li key={item.position} className="flex gap-2">
              <span className="w-8 font-mono tabular-nums">
                {item.position + 1}.
              </span>
              <span>
                {item.title}
                {!found.has(item.position) && (
                  <span className="text-muted-foreground"> (revealed)</span>
                )}
              </span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
