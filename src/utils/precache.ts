import { readFile } from "node:fs/promises";
import path from "node:path";

/** three.js and its addons prefix every log message with this, and minification keeps string literals. */
export const THREE_MARKER = "THREE.";

/**
 * Drops the three.js chunks (the Desk scene) from the precache list: they load on demand on the Desk only, and
 * offline the Desk shows its static SVG. Entry URLs are relative to `root`, the build's working directory.
 */
export async function withoutThreeChunks<Entry extends { url: string }>(
  entries: Entry[],
  root = process.cwd(),
) {
  const keep = await Promise.all(
    entries.map(
      async ({ url }) =>
        !url.endsWith(".js") ||
        !(await readFile(path.join(root, url), "utf8")).includes(THREE_MARKER),
    ),
  );
  return { manifest: entries.filter((_, index) => keep[index]), warnings: [] };
}
