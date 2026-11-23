/** Types whose solve page is wider than the default reading column, so two-up boards get room on desktop. */
export const wideSolveTypes: ReadonlySet<string> = new Set(["spot-difference"]);

/** Desktop solve layout (SPEC §4.5): board on the left, everything else in a panel on the right. */
export const panelSolveTypes: ReadonlySet<string> = new Set([
  "reverse-chess",
  "chess-problem",
  "gear-train",
  "crossword",
  "kakuro",
  "sudoku",
  "futoshiki",
  "logic-grid",
  "rota",
  "sightlines",
  "cctv-maze",
  "detective-scene",
  "knights-knaves",
  "napkin-maths",
  "acrostic",
  "word-search",
  "word-wheel",
  "word-ladder",
  "caesar",
  "keyword",
  "pictogram-cipher",
  "book-cipher",
  "fillomino",
  "troix",
  "nonogram",
  "norinori",
  "star-battle",
  "circle9",
  "railroad",
  "reflections",
]);

/** One column under the compact title bar. */
export const boardOnlySolveTypes: ReadonlySet<string> = new Set([
  "anagram",
  "odd-one-out",
]);

/** Keep their own layout on desktop. */
export const excludedSolveTypes: ReadonlySet<string> = new Set([
  "gears",
  "spot-difference",
]);

export function solveLayoutOf(typeKey: string) {
  if (panelSolveTypes.has(typeKey)) return "panel";
  if (boardOnlySolveTypes.has(typeKey)) return "board-only";
  return null;
}
