import { createElement, type ReactNode } from "react";
import type { SceneNode } from "./schema";

const camelCase = (name: string) =>
  name.replace(/-([a-z0-9])/g, (_, char: string) => char.toUpperCase());

/** Draws a scene tree as SVG elements, mapping kebab-case attributes to React props. */
export function renderSceneNode(node: SceneNode, key: number): ReactNode {
  const props = Object.fromEntries(
    Object.entries(node.attrs).map(([name, value]) => [camelCase(name), value]),
  );
  return createElement(
    node.tag,
    { key, ...props },
    node.children?.map(renderSceneNode),
  );
}
