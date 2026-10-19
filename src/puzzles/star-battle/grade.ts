import { combinations, type Grade } from "../_shared/generate/candidates";
import type { Difficulty } from "../_shared/generate/pipeline";
import type { Layout } from "./engine";
import type { Content } from "./schema";
import { regionCells } from "./verify";

const OPEN = 0;
const STAR = 1;
const EMPTY = 2;

type Cells = ReadonlyArray<number>;

type State = {
  layout: Layout;
  cells: number[];
  rows: Cells[];
  cols: Cells[];
  regions: Cells[];
  neighbours: Cells[];
};

type Technique = {
  name: string;
  level: Difficulty;
  apply: (state: State) => boolean;
};

const allUnits = (state: State) => [
  ...state.rows,
  ...state.cols,
  ...state.regions,
];

const openOf = (state: State, unit: Cells) =>
  unit.filter((index) => state.cells[index] === OPEN);

const needOf = (state: State, unit: Cells) =>
  state.layout.stars -
  unit.filter((index) => state.cells[index] === STAR).length;

function placeStar(state: State, index: number) {
  state.cells[index] = STAR;
  for (const next of state.neighbours[index]) {
    if (state.cells[next] === OPEN) state.cells[next] = EMPTY;
  }
}

function clear(state: State, indexes: Cells) {
  let progress = false;
  for (const index of indexes) {
    if (state.cells[index] === OPEN) {
      state.cells[index] = EMPTY;
      progress = true;
    }
  }
  return progress;
}

/** A unit with all its stars clears its other cells; a unit with as many open cells as stars missing fills them. */
const saturation: Technique = {
  name: "saturated unit",
  level: 1,
  apply(state) {
    let progress = false;
    for (const unit of allUnits(state)) {
      const need = needOf(state, unit);
      const open = openOf(state, unit);
      if (!open.length) continue;
      if (need === 0) {
        progress = clear(state, open) || progress;
      } else if (open.length === need) {
        for (const index of open) placeStar(state, index);
        progress = true;
      }
    }
    return progress;
  },
};

const total = (state: State, units: ReadonlyArray<Cells>) =>
  units.reduce((sum, unit) => sum + needOf(state, unit), 0);

/**
 * n lines of one direction against the regions they touch (or n regions against the lines they
 * touch): when both sides need the same number of stars, the cells the touching side holds outside
 * the chosen side are empty.
 */
function counting(
  count: number,
  level: Difficulty,
  chosenSide?: "lines" | "regions",
): Technique {
  return {
    name:
      count === 1
        ? `single ${chosenSide === "lines" ? "line" : "region"}`
        : `${count} ${chosenSide ?? "lines or regions"}`,
    level,
    apply(state) {
      for (const lines of [state.rows, state.cols]) {
        for (const [side, chosenSet, otherSet] of [
          ["lines", lines, state.regions],
          ["regions", state.regions, lines],
        ] as const) {
          if (chosenSide && side !== chosenSide) continue;
          let progress = false;
          combinations(chosenSet, count, (chosen) => {
            const covered = new Set(
              chosen.flatMap((unit) => openOf(state, unit)),
            );
            const touching = otherSet.filter((unit) =>
              unit.some((index) => covered.has(index)),
            );
            if (
              touching.length > count ||
              total(state, chosen) !== total(state, touching)
            ) {
              return false;
            }
            const keep = new Set(chosen.flat());
            progress = clear(
              state,
              touching.flat().filter((index) => !keep.has(index)),
            );
            return progress;
          });
          if (progress) return true;
        }
      }
      return false;
    },
  };
}

/** The most stars a set of open cells can hold: aligned 2×2 blocks each hold at most one. */
function blockCapacity(size: number, open: Cells) {
  let best = Infinity;
  for (const dr of [0, 1]) {
    for (const dc of [0, 1]) {
      const blocks = new Set(
        open.map(
          (index) =>
            Math.floor((Math.floor(index / size) + dr) / 2) * size +
            Math.floor(((index % size) + dc) / 2),
        ),
      );
      best = Math.min(best, blocks.size);
    }
  }
  return best;
}

function feasible(state: State) {
  const { size } = state.layout;
  return allUnits(state).every((unit) => {
    const need = needOf(state, unit);
    if (need <= 0) return need === 0;
    const open = openOf(state, unit);
    return open.length >= need && blockCapacity(size, open) >= need;
  });
}

/** A cell is empty when a star there leaves some unit too few 2×2 blocks for its stars, and a star when an empty cell does. */
const blocks: Technique = {
  name: "2×2 blocks",
  level: 3,
  apply(state) {
    for (let index = 0; index < state.cells.length; index++) {
      if (state.cells[index] !== OPEN) continue;
      const star: State = { ...state, cells: [...state.cells] };
      placeStar(star, index);
      if (!feasible(star)) {
        state.cells[index] = EMPTY;
        return true;
      }
      const empty: State = { ...state, cells: [...state.cells] };
      empty.cells[index] = EMPTY;
      if (!feasible(empty)) {
        placeStar(state, index);
        return true;
      }
    }
    return false;
  },
};

const ladder: ReadonlyArray<Technique> = [
  saturation,
  counting(1, 1, "regions"),
  counting(1, 2, "lines"),
  blocks,
  counting(2, 4),
  counting(3, 5),
  counting(4, 5),
];

function stateFor(content: Pick<Content, "size" | "stars" | "grid">): State {
  const { size, stars } = content;
  const regionOf = Array<number>(size * size).fill(-1);
  for (const { row, col, region } of regionCells(content)) {
    regionOf[row * size + col] = region;
  }
  const indexes = Array.from({ length: size }, (_, i) => i);
  const neighbours = Array.from({ length: size * size }, (_, index) => {
    const row = Math.floor(index / size);
    const col = index % size;
    const next: number[] = [];
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        const r = row + dr;
        const c = col + dc;
        if ((dr || dc) && r >= 0 && r < size && c >= 0 && c < size) {
          next.push(r * size + c);
        }
      }
    }
    return next;
  });
  return {
    layout: { size, stars, regionOf },
    cells: Array<number>(size * size).fill(OPEN),
    rows: indexes.map((row) => indexes.map((col) => row * size + col)),
    cols: indexes.map((col) => indexes.map((row) => row * size + col)),
    regions: indexes.map((region) =>
      regionOf.flatMap((of, index) => (of === region ? [index] : [])),
    ),
    neighbours,
  };
}

/**
 * Grades a star battle by technique alone, easiest first: null when the techniques up to
 * `maxLevel` cannot place every star, which is what a puzzle that needs trial and error looks
 * like. Also returns the stars it placed.
 */
export function solveStarBattle(
  content: Pick<Content, "size" | "stars" | "grid">,
  maxLevel: Difficulty = 5,
) {
  const state = stateFor(content);
  const uses: Record<string, number> = {};
  let hardest: Technique = ladder[0];
  const goal = content.size * content.stars;
  const placed = () => state.cells.filter((cell) => cell === STAR).length;
  while (placed() < goal) {
    const next = ladder.find(
      (technique) => technique.level <= maxLevel && technique.apply(state),
    );
    if (!next) return null;
    uses[next.name] = (uses[next.name] ?? 0) + 1;
    if (next.level > hardest.level) hardest = next;
  }
  const stars = state.cells.flatMap((cell, index) =>
    cell === STAR ? [index] : [],
  );
  const grade: Grade = {
    difficulty: hardest.level,
    hardest: hardest.name,
    uses,
  };
  return { grade, stars };
}

export const gradeStarBattle = (
  content: Pick<Content, "size" | "stars" | "grid">,
  maxLevel: Difficulty = 5,
) => solveStarBattle(content, maxLevel)?.grade ?? null;
