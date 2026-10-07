import type { Content, Rule } from "./schema";

type Slot = { category: number; index: number };

/** `world[c][i]` is the household of item `i` in category `c`; household numbers follow category 0. */
export type World = number[][];

type Grid = Pick<Content, "categories" | "clues">;

function slotOf(categories: Grid["categories"], label: string): Slot {
  for (const [category, { items }] of categories.entries()) {
    const index = items.indexOf(label);
    if (index >= 0) return { category, index };
  }
  throw new Error(`unknown item "${label}"`);
}

const slotsOf = (rule: Rule) =>
  rule.kind === "either" ? [rule.a, rule.b, rule.c] : [rule.a, rule.b];

/** Whether `rule` holds in `world`. */
export function holds(
  categories: Grid["categories"],
  world: World,
  rule: Rule,
) {
  const household = (label: string) => {
    const { category, index } = slotOf(categories, label);
    return world[category][index];
  };
  switch (rule.kind) {
    case "is":
      return household(rule.a) === household(rule.b);
    case "isNot":
      return household(rule.a) !== household(rule.b);
    case "either":
      return (
        household(rule.a) === household(rule.b) ||
        household(rule.a) === household(rule.c)
      );
  }
}

function permutations(size: number) {
  const result: number[][] = [];
  const build = (prefix: number[]) => {
    if (prefix.length === size) return result.push(prefix);
    for (let value = 0; value < size; value++) {
      if (!prefix.includes(value)) build([...prefix, value]);
    }
  };
  build([]);
  return result;
}

/**
 * Worlds in which every clue except `skip` holds, up to `limit`.
 * Each category after the first is a permutation of the households, and a clue is tested as soon as every category it names is placed.
 */
export function findWorlds(
  { categories, clues }: Grid,
  limit: number,
  skip?: number,
) {
  const size = categories[0].items.length;
  const all = permutations(size);
  const active = clues
    .map(({ rule }, index) => ({ rule, index }))
    .filter(({ index }) => index !== skip)
    .map(({ rule }) => ({
      rule,
      last: Math.max(
        ...slotsOf(rule).map((label) => slotOf(categories, label).category),
      ),
    }));
  const found: World[] = [];
  const world: World = [Array.from({ length: size }, (_, i) => i)];

  const place = (category: number) => {
    if (category === categories.length) {
      found.push(world.map((row) => [...row]));
      return;
    }
    const checks = active.filter(({ last }) => last === category);
    for (const permutation of all) {
      world[category] = permutation;
      if (checks.every(({ rule }) => holds(categories, world, rule))) {
        place(category + 1);
        if (found.length >= limit) return;
      }
    }
    world.length = category;
  };
  place(1);
  return found;
}

/** The world the `solution` rows describe. */
export function solutionWorld({ categories, solution }: Pick<Content, "categories" | "solution">) {
  const world: World = categories.map(() => []);
  solution.forEach((row, household) => {
    row.forEach((label, category) => {
      world[category][categories[category].items.indexOf(label)] = household;
    });
  });
  const order = world[0].map((household, index) => ({ household, index }));
  const renumber = new Map(order.map(({ household, index }) => [household, index]));
  return world.map((row) => row.map((household) => renumber.get(household) ?? -1));
}
