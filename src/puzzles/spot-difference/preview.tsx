import { SCENE_HEIGHT, SCENE_WIDTH } from "./engine";
import { renderSceneNode } from "./scene";
import type { Payload } from "./schema";

export function Preview({ payload: { scenes } }: { payload: Payload }) {
  return (
    <svg
      viewBox={`0 0 ${SCENE_WIDTH} ${SCENE_HEIGHT}`}
      className="size-full"
      aria-hidden="true"
    >
      {renderSceneNode(scenes[0], 0)}
    </svg>
  );
}
