/** The Desk's fixed camera, in plain maths so the static SVG and the WebGL scene frame the same composition. */
export const ELEVATION = (32 * Math.PI) / 180;
export const AZIMUTH = (45 * Math.PI) / 180;
export const MAX_ORBIT = (16 * Math.PI) / 180;
export const ORBIT_STEP = (4 * Math.PI) / 180;
/** Screen units the composition is framed to, and the world height the camera looks at. */
export const FRAME = { width: 10, height: 5.8, targetY: 0.3 } as const;

export type Vec3 = readonly [x: number, y: number, z: number];
export type Screen = readonly [x: number, y: number];

/** Orthographic projection to screen units, x right and y up. */
export function project(
  [x, y, z]: Vec3,
  azimuth: number = AZIMUTH,
  elevation: number = ELEVATION,
): Screen {
  const right = x * Math.cos(azimuth) - z * Math.sin(azimuth);
  const up =
    -Math.sin(elevation) * (x * Math.sin(azimuth) + z * Math.cos(azimuth)) +
    Math.cos(elevation) * (y - FRAME.targetY);
  return [right, up];
}
