import { useEffect, useState } from "react";

/** Pixels the system keyboard covers at the bottom of the layout viewport, from `visualViewport`. */
export function useKeyboardInset(enabled: boolean) {
  const [inset, setInset] = useState(0);

  useEffect(() => {
    const viewport = window.visualViewport;
    if (!enabled || !viewport) return;
    let frame = 0;
    const measure = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        if (viewport.height >= window.innerHeight) return setInset(0);
        setInset(
          Math.max(
            0,
            Math.round(window.innerHeight - viewport.height - viewport.offsetTop),
          ),
        );
      });
    };
    measure();
    viewport.addEventListener("resize", measure);
    viewport.addEventListener("scroll", measure);
    return () => {
      cancelAnimationFrame(frame);
      viewport.removeEventListener("resize", measure);
      viewport.removeEventListener("scroll", measure);
    };
  }, [enabled]);

  return enabled ? inset : 0;
}
