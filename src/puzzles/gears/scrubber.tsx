"use client";

import { Pause, Play } from "lucide-react";
import {
  animate,
  type MotionValue,
  motion,
  useReducedMotion,
  useTransform,
} from "motion/react";
import {
  type KeyboardEvent,
  type PointerEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import { Button } from "@/components/ui/button";
import { Cog } from "@/components/ui/slider";
import { convergenceAt, HALF_PHASES, markerOf } from "./dance";

const SECONDS_PER_HALF_PHASE = 0.9;
const DWELL_SECONDS = 0.9;
const FIGURES = Array.from({ length: HALF_PHASES / 2 }, (_, i) => i + 1);
const HALF_PHASE_TICKS = Array.from({ length: HALF_PHASES + 1 }, (_, i) => i);

const clamp = (position: number) => Math.min(HALF_PHASES, Math.max(0, position));
const percent = (position: number) => `${(position / HALF_PHASES) * 100}%`;

function describe(position: number) {
  const figure = convergenceAt(position);
  if (figure !== null) return `Convergence ${figure}`;
  if (position === 0) return "Before convergence 1";
  if (position === HALF_PHASES) return "After convergence 8";
  return position % 2 === 0
    ? `Travelling out after convergence ${position / 2}`
    : `Travelling in to convergence ${(position + 1) / 2}`;
}

/**
 * Timeline over the 16 half-phases. `position` is written by the scrubber and read by the board;
 * neither re-renders while it moves. `onSettle` reports the convergence the dance stops on, or null while it is moving.
 */
export function Scrubber({
  position,
  onSettle,
}: {
  position: MotionValue<number>;
  onSettle(convergence: number | null): void;
}) {
  const reducedMotion = useReducedMotion();
  const latestOnSettle = useRef(onSettle);
  useEffect(() => {
    latestOnSettle.current = onSettle;
  });
  const [playing, setPlaying] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const cogTurn = useTransform(position, (latest) => latest * 45);
  const cogLeft = useTransform(position, percent);

  useEffect(() => {
    const slider = sliderRef.current;
    if (!slider) return;
    const show = (latest: number) => {
      const whole = Math.round(latest);
      slider.setAttribute("aria-valuenow", String(whole));
      slider.setAttribute("aria-valuetext", describe(whole));
      slider.dataset.position = latest.toFixed(2);
    };
    show(position.get());
    return position.on("change", show);
  }, [position]);

  useEffect(() => {
    if (!playing) return;
    let stopped = false;
    let animation: ReturnType<typeof animate> | undefined;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const dwell = () =>
      new Promise<void>((resolve) => {
        timer = setTimeout(resolve, DWELL_SECONDS * 1000);
      });

    async function play() {
      const last = reducedMotion ? markerOf(HALF_PHASES / 2) : HALF_PHASES;
      if (position.get() >= last) {
        position.set(reducedMotion ? markerOf(1) : 0);
        latestOnSettle.current(convergenceAt(position.get()));
        if (reducedMotion) await dwell();
      }
      const stops = [...FIGURES.map(markerOf), HALF_PHASES].filter(
        (stop) => stop > position.get() && stop <= last,
      );
      for (const stop of stops) {
        if (stopped) return;
        if (reducedMotion) {
          position.set(stop);
        } else {
          latestOnSettle.current(null);
          animation = animate(position, stop, {
            duration: (stop - position.get()) * SECONDS_PER_HALF_PHASE,
            ease: "linear",
          });
          await animation;
        }
        if (stopped) return;
        latestOnSettle.current(convergenceAt(stop));
        if (stop < last) await dwell();
      }
      if (!stopped) setPlaying(false);
    }
    void play();

    return () => {
      stopped = true;
      animation?.stop();
      clearTimeout(timer);
    };
  }, [playing, reducedMotion, position]);

  function jumpTo(target: number) {
    setPlaying(false);
    const next = clamp(target);
    position.set(next);
    onSettle(convergenceAt(next));
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const latest = position.get();
    const target =
      event.key === "ArrowRight" || event.key === "ArrowUp"
        ? Math.floor(latest) + 1
        : event.key === "ArrowLeft" || event.key === "ArrowDown"
          ? Math.ceil(latest) - 1
          : event.key === "Home"
            ? markerOf(1)
            : event.key === "End"
              ? markerOf(HALF_PHASES / 2)
              : null;
    if (event.key === " ") {
      event.preventDefault();
      setPlaying((now) => !now);
    } else if (target !== null) {
      event.preventDefault();
      jumpTo(target);
    }
  }

  function dragTo(event: PointerEvent<HTMLDivElement>) {
    const track = trackRef.current?.getBoundingClientRect();
    if (!track) return;
    const fraction = (event.clientX - track.left) / track.width;
    const raw = clamp(fraction * HALF_PHASES);
    position.set(reducedMotion ? Math.round(raw) : raw);
    onSettle(null);
  }

  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    event.currentTarget.setPointerCapture(event.pointerId);
    event.currentTarget.focus();
    setPlaying(false);
    dragging.current = true;
    dragTo(event);
  }

  function onPointerUp() {
    if (!dragging.current) return;
    dragging.current = false;
    jumpTo(Math.round(position.get()));
  }

  const now = Math.round(position.get());

  return (
    <div className="flex w-full max-w-xl items-center gap-3">
      <Button
        variant="secondary"
        size="icon"
        aria-label={playing ? "Pause dance" : "Play dance"}
        onClick={() => setPlaying((current) => !current)}
      >
        {playing ? <Pause aria-hidden /> : <Play aria-hidden />}
      </Button>
      <div
        ref={sliderRef}
        role="slider"
        tabIndex={0}
        aria-label="Dance scrubber"
        aria-orientation="horizontal"
        aria-valuemin={0}
        aria-valuemax={HALF_PHASES}
        aria-valuenow={now}
        aria-valuetext={describe(now)}
        className="relative h-14 flex-1 cursor-pointer touch-none select-none outline-none focus-visible:outline-3 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-ring"
        onKeyDown={onKeyDown}
        onPointerDown={onPointerDown}
        onPointerMove={(event) => dragging.current && dragTo(event)}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <div ref={trackRef} className="absolute inset-x-3 top-0 h-full">
          <div className="absolute inset-x-0 top-3 h-0.5 bg-foreground" />
          {HALF_PHASE_TICKS.map((tick) => (
            <span
              key={tick}
              aria-hidden
              className={`absolute top-3 w-0.5 -translate-x-1/2 bg-foreground ${tick % 2 === 1 ? "h-4" : "h-2"}`}
              style={{ left: percent(tick) }}
            />
          ))}
          {FIGURES.map((figure) => (
            <span
              key={figure}
              aria-hidden
              className="absolute top-8 -translate-x-1/2 font-display text-sm font-bold"
              style={{ left: percent(markerOf(figure)) }}
            >
              {figure}
            </span>
          ))}
          <motion.div
            aria-hidden
            className="absolute top-0 -ml-3 size-6 text-ludwig-red"
            style={{ left: cogLeft, rotate: cogTurn }}
          >
            <Cog />
          </motion.div>
        </div>
      </div>
    </div>
  );
}
