import { useLayoutEffect, type RefObject } from "react";

/** Matches the `panel` variant in globals.css. */
const PANEL_QUERY =
  "(min-width: 64rem) and (not ((pointer: coarse) and (min-height: 37.5rem)))";

/**
 * Cuts a desktop scroll area at the bottom of its last whole row, so no row is half cut. `bound` is the box whose
 * bottom edge limits the area. A scroller whose content fits is left to its CSS.
 */
export function useWholeRows(
  scroller: RefObject<HTMLElement | null>,
  bound: RefObject<HTMLElement | null>,
  rowSelector: string | undefined,
) {
  useLayoutEffect(() => {
    const element = scroller.current;
    const limit = bound.current;
    if (!element || !limit || !rowSelector) return;
    const panel = window.matchMedia(PANEL_QUERY);
    const border = 2;

    function snap() {
      if (!element || !limit) return;
      element.style.flex = "";
      element.style.height = "";
      if (!panel.matches) return;
      if (limit instanceof HTMLDetailsElement && !limit.open) return;
      const top = element.getBoundingClientRect().top;
      const available = limit.getBoundingClientRect().bottom - top;
      if (element.scrollHeight <= available) return;
      let fit = 0;
      for (const row of element.querySelectorAll(rowSelector!)) {
        const bottom =
          row.getBoundingClientRect().bottom - top + element.scrollTop;
        if (bottom <= available - border) fit = Math.max(fit, bottom);
      }
      if (fit === 0) return;
      element.style.flex = "none";
      element.style.height = `${Math.ceil(fit) + border}px`;
    }

    snap();
    const observer = new ResizeObserver(snap);
    observer.observe(limit);
    if (element.firstElementChild) observer.observe(element.firstElementChild);
    const mutations = new MutationObserver(snap);
    mutations.observe(element, { childList: true, subtree: true });
    limit.addEventListener("toggle", snap);
    panel.addEventListener("change", snap);
    return () => {
      observer.disconnect();
      mutations.disconnect();
      limit.removeEventListener("toggle", snap);
      panel.removeEventListener("change", snap);
    };
  }, [scroller, bound, rowSelector]);
}
