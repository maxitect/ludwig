/** Brings `element` into view inside its nearest `[data-panel-scroll]` ancestor without moving the page. */
export function scrollWithin(element: Element | null | undefined) {
  const scroller = element?.closest<HTMLElement>("[data-panel-scroll]");
  if (!element || !scroller) return;
  const inner = element.getBoundingClientRect();
  const outer = scroller.getBoundingClientRect();
  if (inner.top < outer.top) scroller.scrollTop -= outer.top - inner.top;
  else if (inner.bottom > outer.bottom)
    scroller.scrollTop += inner.bottom - outer.bottom;
}
