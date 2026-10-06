"use client";

import { ViewTransition } from "react";
import "./bullet-hole.css";

const BULLET_HOLE_TYPE = "bullet-hole";

const ROOT_HIDERS = new Set(["::view-transition", "::view-transition-group(root)"]);

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
  root.dataset.vt = BULLET_HOLE_TYPE;
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
 * tear itself animates the root snapshot (see bullet-hole.css), so this stays empty.
 */
export function BulletHoleTransition() {
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
