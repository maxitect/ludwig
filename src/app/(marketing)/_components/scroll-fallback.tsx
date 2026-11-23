"use client";

import { useEffect, useRef } from "react";

/** Keeps the sticky stage under the site header, and drives the title sequence from scroll in browsers without `animation-timeline: view()`. */
export function ScrollFallback() {
  const marker = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const root = marker.current?.closest<HTMLElement>(".title-sequence");
    const header = document.querySelector<HTMLElement>("[data-site-header]");
    if (!root) return;

    const measureHeader = new ResizeObserver(() => {
      if (header) root.style.setProperty("--seq-header", `${header.getBoundingClientRect().height}px`);
    });
    if (header) measureHeader.observe(header);
    const stopMeasuring = () => {
      measureHeader.disconnect();
      root.style.removeProperty("--seq-header");
    };

    const track = root.querySelector<HTMLElement>(".seq-track");
    if (!track || CSS.supports("animation-timeline: view()")) return stopMeasuring;

    root.dataset.seqScroll = "";
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

    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      stopMeasuring();
      root.style.removeProperty("--seq-progress");
      delete root.dataset.seqScroll;
    };
  }, []);

  return <span ref={marker} hidden />;
}
