import { useSyncExternalStore } from "react";

/** Matches the `panel` variant in globals.css. */
const PANEL_QUERY =
  "(min-width: 64rem) and (not ((pointer: coarse) and (min-height: 37.5rem)))";

const query = () =>
  typeof window.matchMedia === "function"
    ? window.matchMedia(PANEL_QUERY)
    : null;

function subscribe(onChange: () => void) {
  const media = query();
  media?.addEventListener("change", onChange);
  return () => media?.removeEventListener("change", onChange);
}

/** Whether the desktop board-and-panel layout is showing. False on the server and while hydrating. */
export function usePanelLayout() {
  return useSyncExternalStore(
    subscribe,
    () => query()?.matches ?? false,
    () => false,
  );
}
