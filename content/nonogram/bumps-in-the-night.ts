import type { ContentMeta } from "../../scripts/content-files";
import type { Content } from "../../src/puzzles/nonogram/schema";

export const meta = {
  slug: "bumps-in-the-night",
  title: "Bumps in the Night",
  difficulty: 4,
  publishedAt: new Date("2026-10-16T00:00:00Z"),
} satisfies ContentMeta;

export const content = {
  rows: 15,
  cols: 15,
  caption: "A phrenologist's head, its bumps all mapped",
  grid: [
    ".....#####.....",
    "...#########...",
    "..###########..",
    ".#####.#.#####.",
    ".####..#..####.",
    ".###.#.#.#.###.",
    ".####..#..####.",
    ".#############.",
    ".##.########.#.",
    "##.##########..",
    "#.#..########..",
    "##.####.######.",
    ".#..###..#####.",
    "..##########...",
    "....#######....",
  ],
} satisfies Content;
