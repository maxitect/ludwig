import type { Region } from "./schema";

export const BLOCK = 8;
const CHANGE_THRESHOLD = 32;
export const NOISE_FLOOR = 2;

/** One group of changed blocks, with its bounding box in scene pixels. */
export type Cluster = Region & { blocks: number };

/**
 * Compares the two scenes' ink block by block, never pixel by pixel: the lossy WebP encoder
 * quantises each image on its own, so single pixels flip between identical areas, while an
 * edited area changes the mean ink of whole blocks.
 */
export function changedBlocks(
  original: Uint8Array,
  altered: Uint8Array,
  width: number,
  height: number,
) {
  const columns = Math.ceil(width / BLOCK);
  const rows = Math.ceil(height / BLOCK);
  const difference = new Float64Array(columns * rows);
  const area = new Float64Array(columns * rows);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const block = Math.floor(y / BLOCK) * columns + Math.floor(x / BLOCK);
      difference[block] += original[y * width + x] - altered[y * width + x];
      area[block]++;
    }
  }
  const changed = new Uint8Array(columns * rows);
  for (let i = 0; i < changed.length; i++) {
    changed[i] = Math.abs(difference[i] / area[i]) > CHANGE_THRESHOLD ? 1 : 0;
  }
  return { columns, rows, changed };
}

/** Groups touching changed blocks (diagonals included) and keeps the groups of at least `NOISE_FLOOR`. */
export function clusterBlocks(
  changed: Uint8Array,
  columns: number,
  rows: number,
) {
  const seen = new Uint8Array(changed.length);
  const clusters: Cluster[] = [];
  for (let start = 0; start < changed.length; start++) {
    if (!changed[start] || seen[start]) continue;
    const stack = [start];
    seen[start] = 1;
    let blocks = 0;
    let c1 = columns;
    let r1 = rows;
    let c2 = 0;
    let r2 = 0;
    while (stack.length) {
      const i = stack.pop()!;
      const column = i % columns;
      const row = (i - column) / columns;
      blocks++;
      c1 = Math.min(c1, column);
      r1 = Math.min(r1, row);
      c2 = Math.max(c2, column);
      r2 = Math.max(r2, row);
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          const nc = column + dc;
          const nr = row + dr;
          if (nc < 0 || nc >= columns || nr < 0 || nr >= rows) continue;
          const next = nr * columns + nc;
          if (changed[next] && !seen[next]) {
            seen[next] = 1;
            stack.push(next);
          }
        }
      }
    }
    if (blocks >= NOISE_FLOOR) {
      clusters.push({
        x: c1 * BLOCK,
        y: r1 * BLOCK,
        width: (c2 - c1 + 1) * BLOCK,
        height: (r2 - r1 + 1) * BLOCK,
        blocks,
      });
    }
  }
  return clusters;
}
