export type View = { scale: number; x: number; y: number };
export type Point = { x: number; y: number };
type Size = { width: number; height: number };

export const MIN_SCALE = 1;
export const MAX_SCALE = 6;
export const HOME: View = { scale: MIN_SCALE, x: 0, y: 0 };

const clamp = (value: number, low: number, high: number) =>
  Math.min(high, Math.max(low, value));

/** Keeps the scale in range and the scene covering the viewport, so no edge ever shows. */
export function clampView(view: View, viewport: Size): View {
  const scale = clamp(view.scale, MIN_SCALE, MAX_SCALE);
  return {
    scale,
    x: clamp(view.x, viewport.width * (1 - scale), 0),
    y: clamp(view.y, viewport.height * (1 - scale), 0),
  };
}

export const panBy = (view: View, viewport: Size, dx: number, dy: number) =>
  clampView({ ...view, x: view.x + dx, y: view.y + dy }, viewport);

/** Scales by `factor` while the viewport point `focus` stays over the same scene spot. */
export function zoomAt(
  view: View,
  viewport: Size,
  factor: number,
  focus: Point,
): View {
  const scale = clamp(view.scale * factor, MIN_SCALE, MAX_SCALE);
  const ratio = scale / view.scale;
  return clampView(
    {
      scale,
      x: focus.x - (focus.x - view.x) * ratio,
      y: focus.y - (focus.y - view.y) * ratio,
    },
    viewport,
  );
}

/** A point in the viewport, in pixels, as scene units. */
export const toScene = (
  view: View,
  viewport: Size,
  scene: Size,
  point: Point,
): Point => ({
  x: ((point.x - view.x) / (viewport.width * view.scale)) * scene.width,
  y: ((point.y - view.y) / (viewport.height * view.scale)) * scene.height,
});

/** Pans the least that brings a scene spot, given as a fraction of the scene, inside the viewport's margin. */
export function panToShow(
  view: View,
  viewport: Size,
  spot: Point,
  margin: number,
): View {
  const screen = {
    x: spot.x * viewport.width * view.scale + view.x,
    y: spot.y * viewport.height * view.scale + view.y,
  };
  const shift = (position: number, extent: number) =>
    position < margin
      ? margin - position
      : position > extent - margin
        ? extent - margin - position
        : 0;
  return panBy(
    view,
    viewport,
    shift(screen.x, viewport.width),
    shift(screen.y, viewport.height),
  );
}
