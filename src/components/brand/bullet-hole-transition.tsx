"use client";

import { ViewTransition } from "react";
import "./bullet-hole.css";

const BULLET_HOLE_TYPE = "bullet-hole";

const onlyForBulletHole = {
  [BULLET_HOLE_TYPE]: "bullet-hole-page",
  default: "none",
};

function markTransition() {
  document.documentElement.dataset.vt = BULLET_HOLE_TYPE;
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
      onEnter={markTransition}
    >
      <div aria-hidden="true" className="pointer-events-none fixed inset-0" />
    </ViewTransition>
  );
}
