import { useLayoutEffect, type RefObject } from "react";

/** Matches the `panel` variant in globals.css. */
const PANEL_QUERY =
  "(min-width: 64rem) and (not ((pointer: coarse) and (min-height: 37.5rem)))";

const RULE = 2;

function cutAtWholeRow(
  area: HTMLElement,
  limit: HTMLElement,
  rowSelector: string,
  panel: boolean,
) {
  const atEnd = area.scrollTop + area.clientHeight >= area.scrollHeight - 2;
  area.style.flex = "";
  area.style.height = "";
  if (!panel) return;
  if (limit instanceof HTMLDetailsElement && !limit.open) return;
  const top = area.getBoundingClientRect().top;
  const available = limit.getBoundingClientRect().bottom - top;
  if (area.scrollHeight <= available) return;
  let fit = 0;
  for (const row of area.querySelectorAll(rowSelector)) {
    const bottom = row.getBoundingClientRect().bottom - top + area.scrollTop;
    if (bottom <= available - RULE) fit = Math.max(fit, bottom);
  }
  if (fit === 0) return;
  area.style.flex = "none";
  area.style.height = `${Math.ceil(fit) + RULE}px`;
  if (atEnd) area.scrollTop = area.scrollHeight;
}

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
    const area = scroller.current;
    const limit = bound.current;
    if (!area || !limit || !rowSelector) return;
    if (
      typeof window.matchMedia !== "function" ||
      typeof ResizeObserver === "undefined"
    )
      return;
    const panel = window.matchMedia(PANEL_QUERY);
    const snap = () => cutAtWholeRow(area, limit, rowSelector, panel.matches);

    snap();
    const observer = new ResizeObserver(snap);
    observer.observe(limit);
    if (area.firstElementChild) observer.observe(area.firstElementChild);
    const mutations = new MutationObserver(snap);
    mutations.observe(area, { childList: true, subtree: true });
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
