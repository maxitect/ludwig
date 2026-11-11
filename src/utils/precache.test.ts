import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { withoutThreeChunks } from "./precache";

describe("withoutThreeChunks", () => {
  it("drops chunks carrying three.js and keeps every other entry", async () => {
    const root = await mkdtemp(path.join(tmpdir(), "precache-"));
    const chunks = path.join(root, ".next/static/chunks");
    await mkdir(chunks, { recursive: true });
    const files = {
      "three.js": 'console.warn("THREE.WebGLRenderer: Context Lost.")',
      "scene.js": 'console.error("THREE.SVGLoader: Unsupported path")',
      "app.js": 'console.log("solved")',
      "app.css": ".THREE.{}",
    };
    for (const [name, body] of Object.entries(files)) {
      await writeFile(path.join(chunks, name), body);
    }
    const entries = Object.keys(files).map((name) => ({
      url: `.next/static/chunks/${name}`,
      revision: null,
    }));

    const { manifest } = await withoutThreeChunks(entries, root);

    expect(manifest.map(({ url }) => path.basename(url))).toEqual([
      "app.js",
      "app.css",
    ]);
  });
});
