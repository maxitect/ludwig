"use client";

import {
  Component,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ComponentType,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
} from "react";
import { MAX_ORBIT, ORBIT_STEP } from "@/components/three/iso";
import { useReduceMotion } from "@/utils/use-reduce-motion";
import type { Orbit } from "./desk-canvas";
import { DeskStatic } from "./desk-static";
import { describeDesk, HERO_HEIGHT, type Stack } from "./model";

type CanvasProps = React.ComponentProps<
  typeof import("./desk-canvas").default
>;

class SceneBoundary extends Component<
  { onError: () => void; children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    this.props.onError();
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

const clamp = (value: number) => Math.max(-MAX_ORBIT, Math.min(MAX_ORBIT, value));

/**
 * The Desk's hero. The server renders the static SVG; once the page is hydrated, painted and idle, and
 * motion is allowed, the WebGL chunk loads and takes over. Nothing three.js is imported until then.
 */
export function DeskHero({ stacks }: { stacks: Stack[] }) {
  const reduceMotion = useReduceMotion();
  const descriptionId = useId();
  const orbit = useRef<Orbit>({ target: 0 });
  const wake = useRef(() => {});
  const onWake = useCallback((next: () => void) => {
    wake.current = next;
  }, []);
  const [Scene, setScene] = useState<ComponentType<CanvasProps> | null>(null);
  const [ready, setReady] = useState(false);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    if (reduceMotion) return;
    let current = true;
    const start = () =>
      import("./desk-canvas").then(
        (module) => {
          if (current) setScene(() => module.default);
        },
        () => {},
      );
    const handle = window.setTimeout(start, 250);
    return () => {
      current = false;
      window.clearTimeout(handle);
    };
  }, [reduceMotion]);

  const markReady = useCallback(() => setReady(true), []);
  const showScene = Scene !== null && !reduceMotion;

  const onKeyDown = (event: KeyboardEvent) => {
    const direction =
      event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
    if (!direction) return;
    event.preventDefault();
    orbit.current.target = clamp(orbit.current.target + direction * ORBIT_STEP);
    wake.current();
  };

  const aim = (event: PointerEvent<HTMLDivElement>) => {
    const box = event.currentTarget.getBoundingClientRect();
    orbit.current.target = clamp(
      ((event.clientX - box.left) / box.width - 0.5) * 2 * MAX_ORBIT,
    );
    wake.current();
  };

  return (
    <figure className="m-0">
      <div
        role="group"
        aria-label={`Your desk in three dimensions.${showScene ? " Left and right arrow keys turn it." : ""}`}
        aria-describedby={descriptionId}
        tabIndex={showScene ? 0 : -1}
        data-desk-scene={showScene && ready ? "webgl" : "static"}
        onKeyDown={showScene ? onKeyDown : undefined}
        onPointerDown={(event) => {
          if (!showScene || event.pointerType === "mouse") return;
          event.currentTarget.setPointerCapture(event.pointerId);
          setDragging(true);
          aim(event);
        }}
        onPointerMove={(event) => {
          if (!showScene) return;
          if (event.pointerType === "mouse" || dragging) aim(event);
        }}
        onPointerUp={() => setDragging(false)}
        onPointerCancel={() => setDragging(false)}
        className={`relative ${HERO_HEIGHT} touch-pan-y focus-visible:outline-3 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-ring`}
      >
        <DeskStatic
          stacks={stacks}
          className={showScene && ready ? "invisible" : ""}
        />
        {showScene && (
          <SceneBoundary onError={() => setScene(null)}>
            <Scene stacks={stacks} orbit={orbit} onReady={markReady} onWake={onWake} />
          </SceneBoundary>
        )}
      </div>
      <figcaption id={descriptionId} className="sr-only">
        <p>A desk with one stack of paper for each kind of puzzle. Each solve adds a sheet.</p>
        <ul>
          {describeDesk(stacks).map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </figcaption>
    </figure>
  );
}
