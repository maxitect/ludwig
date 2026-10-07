import { findWorlds, holds, solutionWorld } from "./engine";
import type { Content, Rule } from "./schema";

const labelsOf = (rule: Rule) =>
  rule.kind === "either" ? [rule.a, rule.b, rule.c] : [rule.a, rule.b];

function structure({ categories, solution, clues }: Content) {
  const problems: string[] = [];
  const size = categories[0].items.length;
  const labels = categories.flatMap(({ items }) => items);
  if (categories.some(({ items }) => items.length !== size)) {
    problems.push("every category needs the same number of items");
  }
  for (const label of new Set(labels)) {
    if (labels.filter((other) => other === label).length > 1) {
      problems.push(`item "${label}" is not unique in the puzzle`);
    }
  }
  if (solution.length !== size) {
    problems.push(`the solution needs ${size} rows, not ${solution.length}`);
  }
  for (const [row, items] of solution.entries()) {
    if (items.length !== categories.length) {
      problems.push(`solution row ${row + 1} needs one item per category`);
    }
    items.forEach((label, category) => {
      if (!categories[category]?.items.includes(label)) {
        problems.push(
          `solution row ${row + 1}: "${label}" is not in category ${category + 1}`,
        );
      }
    });
  }
  for (const [category, { items }] of categories.entries()) {
    for (const label of items) {
      const uses = solution.filter((row) => row[category] === label).length;
      if (uses !== 1) {
        problems.push(`"${label}" appears ${uses} times in the solution`);
      }
    }
  }
  const categoryOf = (label: string) =>
    categories.findIndex(({ items }) => items.includes(label));
  clues.forEach(({ content, rule }, index) => {
    const where = `clue ${index + 1}`;
    for (const label of labelsOf(rule)) {
      if (categoryOf(label) < 0) {
        problems.push(`${where}: unknown item "${label}"`);
      } else if (!content.toLowerCase().includes(label.toLowerCase())) {
        problems.push(`${where}: the text never mentions "${label}"`);
      }
    }
    if (rule.kind === "either") {
      if (categoryOf(rule.b) !== categoryOf(rule.c) || rule.b === rule.c) {
        problems.push(
          `${where}: either needs two different items of one category`,
        );
      }
      if (categoryOf(rule.a) === categoryOf(rule.b)) {
        problems.push(
          `${where}: either must name an item of another category first`,
        );
      }
    } else if (categoryOf(rule.a) === categoryOf(rule.b)) {
      problems.push(`${where}: both items are in the same category`);
    }
  });
  if (clues.filter(({ isFalse }) => isFalse).length > 1) {
    problems.push("at most one clue can be false");
  }
  return problems;
}

/**
 * The solution rows describe a full matching, and the clues agree with it: every clue holds except the false one, which fails.
 * A classic puzzle has exactly that one solution. In the variant, dropping the false clue leaves exactly one solution
 * (the stored one) while dropping any other clue leaves none or several.
 */
export function verifyLogicGrid(content: Content) {
  const problems = structure(content);
  if (problems.length) throw new Error(problems.join("; "));
  const { categories, clues } = content;
  const truth = solutionWorld(content);
  for (const [index, { isFalse, rule }] of clues.entries()) {
    if (holds(categories, truth, rule) === Boolean(isFalse)) {
      problems.push(
        `clue ${index + 1} is ${isFalse ? "marked false but holds" : "true text but fails"} in the solution`,
      );
    }
  }
  if (problems.length) throw new Error(problems.join("; "));

  const matches = (worlds: number[][][]) =>
    worlds.length === 1 && JSON.stringify(worlds[0]) === JSON.stringify(truth);
  const falseIndex = clues.findIndex(({ isFalse }) => isFalse);
  if (falseIndex < 0) {
    const worlds = findWorlds(content, 2);
    if (!matches(worlds)) {
      throw new Error(
        worlds.length > 1
          ? "the puzzle has more than one solution"
          : "the clues do not lead to the stored solution",
      );
    }
    return;
  }
  clues.forEach((_, skip) => {
    const worlds = findWorlds(content, 2, skip);
    if (skip === falseIndex && !matches(worlds)) {
      problems.push(
        `without the false clue the puzzle has ${worlds.length > 1 ? "more than one solution" : "the wrong solution"}`,
      );
    }
    if (skip !== falseIndex && worlds.length === 1) {
      problems.push(
        `treating clue ${skip + 1} as false also gives one solution`,
      );
    }
  });
  if (problems.length) throw new Error(problems.join("; "));
}
