import { SceneArt } from "./scene-art";
import type { Payload } from "./schema";

/** The small thumbnail of the scene on the card paper, in the same mask the solver uses. */
export function Preview({
  payload: { sceneKey, width, height },
}: {
  payload: Payload;
}) {
  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="size-full"
      aria-hidden="true"
    >
      <foreignObject width={width} height={height}>
        <SceneArt
          sceneKey={sceneKey}
          width={width}
          height={height}
          version="thumb"
        />
      </foreignObject>
    </svg>
  );
}
