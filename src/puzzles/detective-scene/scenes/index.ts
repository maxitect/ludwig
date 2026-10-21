import type { ComponentType, ComponentProps } from "react";
import { FIXTURE_STREET_SIZE, FixtureStreet } from "./fixture-street";

export type SceneEntry = {
  width: number;
  height: number;
  Art: ComponentType<ComponentProps<"svg">>;
};

/** One entry per `scene_key`. The art is drawn in the current text colour and sized by its viewBox. */
export const scenes: Readonly<Record<string, SceneEntry>> = {
  "fixture-street": { ...FIXTURE_STREET_SIZE, Art: FixtureStreet },
};

export const getScene = (key: string) =>
  Object.hasOwn(scenes, key) ? scenes[key] : undefined;
