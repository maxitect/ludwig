import { createElement, type ReactNode } from "react";
import { SCENE_HEIGHT, SCENE_WIDTH } from "./engine";
import type { Payload, SceneNode } from "./schema";

const camelCase = (name: string) =>
  name.replace(/-([a-z0-9])/g, (_, char: string) => char.toUpperCase());

function renderNode(node: SceneNode, key: number): ReactNode {
  const props = Object.fromEntries(
    Object.entries(node.attrs).map(([name, value]) => [camelCase(name), value]),
  );
  return createElement(
    node.tag,
    { key, ...props },
    node.children?.map(renderNode),
  );
}

export function Preview({ payload: { scenes } }: { payload: Payload }) {
  return (
    <svg
      viewBox={`0 0 ${SCENE_WIDTH} ${SCENE_HEIGHT}`}
      className="size-full"
      aria-hidden="true"
    >
      {renderNode(scenes[0], 0)}
    </svg>
  );
}
