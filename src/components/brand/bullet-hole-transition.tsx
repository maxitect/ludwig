"use client";

import { ViewTransition, useEffect } from "react";
import "./bullet-hole.css";

const BULLET_HOLE_TYPE = "bullet-hole";

/** The torn edge never falls below this fraction of --vt-r, so the hole still clears the farthest corner. */
const MIN_EDGE_RADIUS = 0.92;

const ROOT_HIDERS = new Set([
  "::view-transition",
  "::view-transition-group(root)",
]);

const onlyForBulletHole = {
  [BULLET_HOLE_TYPE]: "bullet-hole-page",
  default: "none",
};

/**
 * React hides the root snapshot with zero-length Web Animations when no named
 * `<ViewTransition>` covers the change. The tear animates that snapshot, so drop them.
 */
function revealRootSnapshot(_: unknown, types: string[]) {
  if (!types.includes(BULLET_HOLE_TYPE)) return;
  const root = document.documentElement;
  if (getComputedStyle(root).viewTransitionName !== "root") return;
  for (const animation of root.getAnimations({ subtree: true })) {
    const { effect } = animation;
    if (animation instanceof CSSAnimation) continue;
    if (!(effect instanceof KeyframeEffect)) continue;
    if (ROOT_HIDERS.has(effect.pseudoElement ?? "")) animation.cancel();
  }
}

/**
 * Put one in each layout that a bullet-hole navigation leaves or enters. Links with
 * `transitionTypes={["bullet-hole"]}` make React start a view transition for it; the
 * tear itself animates the root snapshot (see bullet-hole.css), so this stays empty. It also
 * records the click point and the radius that clears the farthest corner as --vt-x/--vt-y/--vt-r,
 * and holds the header still (--vt-header) only when it is in its resting place on screen, as on the new page.
 */
export function BulletHoleTransition() {
  useEffect(() => {
    const rememberOrigin = (event: MouseEvent) => {
      const root = document.documentElement.style;
      const box =
        event.target instanceof Element
          ? event.target.getBoundingClientRect()
          : null;
      const keyboard = event.detail === 0 && box;
      const x = keyboard ? box.left + box.width / 2 : event.clientX;
      const y = keyboard ? box.top + box.height / 2 : event.clientY;
      const farthest = Math.hypot(
        Math.max(x, innerWidth - x),
        Math.max(y, innerHeight - y),
      );
      root.setProperty("--vt-x", `${x}px`);
      root.setProperty("--vt-y", `${y}px`);
      root.setProperty("--vt-r", `${farthest / MIN_EDGE_RADIUS}px`);
      const header = document.querySelector("[data-site-header]");
      const pinned = !header || header.getBoundingClientRect().top >= 0;
      root.setProperty("--vt-header", pinned ? "site-header" : "none");
      root.setProperty("--vt-header-grain", pinned ? '""' : "none");
    };
    document.addEventListener("click", rememberOrigin, true);
    return () => document.removeEventListener("click", rememberOrigin, true);
  }, []);

  return (
    <ViewTransition
      enter={onlyForBulletHole}
      exit={onlyForBulletHole}
      default="none"
      onEnter={revealRootSnapshot}
    >
      <div aria-hidden="true" className="pointer-events-none fixed inset-0" />
    </ViewTransition>
  );
}
