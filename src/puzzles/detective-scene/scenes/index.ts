import type { ComponentType, ComponentProps } from "react";
import { CAMBRIDGE_NIGHT_SIZE, CambridgeNight } from "./cambridge-night";

export type SceneEntry = {
  width: number;
  height: number;
  Art: ComponentType<ComponentProps<"svg">>;
};

/** One entry per `scene_key`. The art is drawn in the current text colour and sized by its viewBox. */
export const scenes: Readonly<Record<string, SceneEntry>> = {
  "cambridge-night": { ...CAMBRIDGE_NIGHT_SIZE, Art: CambridgeNight },
};

export const getScene = (key: string) =>
  Object.hasOwn(scenes, key) ? scenes[key] : undefined;
