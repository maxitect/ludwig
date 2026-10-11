import { SceneArt } from "./scene-art";
import type { Payload } from "./schema";

/** The original scene on the thumbnail's paper, in the same mask the solver uses. */
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
          version="original"
        />
      </foreignObject>
    </svg>
  );
}
