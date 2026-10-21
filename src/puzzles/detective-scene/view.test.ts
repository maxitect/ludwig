import { describe, expect, it } from "vitest";
import {
  HOME,
  MAX_SCALE,
  clampView,
  panBy,
  panToShow,
  toScene,
  zoomAt,
} from "./view";

const viewport = { width: 400, height: 200 };
const scene = { width: 1200, height: 600 };

describe("scene view", () => {
  it("never pans the scene off the viewport", () => {
    const zoomed = { scale: 2, x: 0, y: 0 };
    expect(panBy(zoomed, viewport, 50, 50)).toEqual(zoomed);
    expect(panBy(zoomed, viewport, -900, -900)).toEqual({
      scale: 2,
      x: -400,
      y: -200,
    });
    expect(panBy(HOME, viewport, -30, 30)).toEqual(HOME);
  });

  it("clamps the scale", () => {
    expect(clampView({ scale: 20, x: 0, y: 0 }, viewport).scale).toBe(MAX_SCALE);
    expect(clampView({ scale: 0.2, x: 0, y: 0 }, viewport).scale).toBe(1);
  });

  it("keeps the focus spot fixed while zooming", () => {
    const focus = { x: 300, y: 100 };
    const before = toScene(HOME, viewport, scene, focus);
    const zoomed = zoomAt(HOME, viewport, 2, focus);
    expect(zoomed.scale).toBe(2);
    const after = toScene(zoomed, viewport, scene, focus);
    expect(after.x).toBeCloseTo(before.x);
    expect(after.y).toBeCloseTo(before.y);
  });

  it("maps a viewport point to scene units through the pan and zoom", () => {
    expect(toScene(HOME, viewport, scene, { x: 200, y: 100 })).toEqual({
      x: 600,
      y: 300,
    });
    expect(
      toScene({ scale: 2, x: -400, y: -200 }, viewport, scene, {
        x: 0,
        y: 0,
      }),
    ).toEqual({ x: 600, y: 300 });
  });

  it("pans the least that brings a spot into view", () => {
    const zoomed = { scale: 3, x: 0, y: 0 };
    const shown = panToShow(zoomed, viewport, { x: 0.9, y: 0.5 }, 40);
    const screenX = 0.9 * viewport.width * 3 + shown.x;
    expect(screenX).toBeCloseTo(viewport.width - 40);
    expect(panToShow(shown, viewport, { x: 0.9, y: 0.5 }, 40)).toEqual(shown);
  });
});
