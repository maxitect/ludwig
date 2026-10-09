"use client";

import { useEffect, useRef } from "react";

/** Drives the title sequence from scroll in browsers without `animation-timeline: view()`. */
export function ScrollFallback() {
  const marker = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (CSS.supports("animation-timeline: view()")) return;
    const root = marker.current?.closest<HTMLElement>(".title-sequence");
    const track = root?.querySelector<HTMLElement>(".seq-track");
    if (!root || !track) return;

    let frame = 0;
    const update = () => {
      frame = 0;
      const span = track.offsetHeight - window.innerHeight;
      const progress =
        span > 0
          ? Math.min(1, Math.max(0, -track.getBoundingClientRect().top / span))
          : 0;
      root.style.setProperty("--seq-progress", progress.toFixed(4));
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    root.dataset.seqScroll = "";
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      delete root.dataset.seqScroll;
      root.style.removeProperty("--seq-progress");
    };
  }, []);

  return <span ref={marker} hidden />;
}
