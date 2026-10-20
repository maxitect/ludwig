import type { ContentMeta } from "../../scripts/content-files";
import type { Content } from "../../src/puzzles/nonogram/schema";

export const meta = {
  slug: "fourth-rank",
  title: "Fourth Rank",
  difficulty: 2,
  publishedAt: new Date("2026-10-14T00:00:00Z"),
} satisfies ContentMeta;

export const content = {
  rows: 15,
  cols: 13,
  caption: "The white knight, one move from mate",
  grid: [
    "...#..#......",
    "...########..",
    "..##########.",
    ".###########.",
    "####.#######.",
    "#####..######",
    "#####...#####",
    "###.....#####",
    ".........####",
    "........#####",
    "......#######",
    ".....########",
    "...##########",
    "..###########",
    "#############",
  ],
} satisfies Content;
