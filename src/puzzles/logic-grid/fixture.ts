import { isVariant } from "./derive";
import type { Content, Payload, Solution } from "./schema";

const categories = [
  { name: "Person", items: ["Ann", "Bob", "Cat"] },
  { name: "Pet", items: ["Dog", "Eel", "Fox"] },
  { name: "Hat", items: ["Red", "Blue", "Green"] },
];

const solution = [
  ["Ann", "Dog", "Red"],
  ["Bob", "Eel", "Blue"],
  ["Cat", "Fox", "Green"],
];

const trueClues: Content["clues"] = [
  {
    content: "Ann owns the Dog.",
    rule: { kind: "is", a: "Ann", b: "Dog" },
  },
  {
    content: "Bob owns the Eel.",
    rule: { kind: "is", a: "Bob", b: "Eel" },
  },
  {
    content: "The Red hat is Ann's.",
    rule: { kind: "is", a: "Red", b: "Ann" },
  },
  {
    content: "Cat does not wear the Blue hat.",
    rule: { kind: "isNot", a: "Cat", b: "Blue" },
  },
];

/** Classic, worked out by hand: Ann has Dog and Red, Bob has Eel, Cat has Fox, so Cat is Green and Bob Blue. */
export const classic: Content = { categories, solution, clues: trueClues };

/** Dropping the last clue leaves Bob and Cat free to swap Blue and Green. */
export const classicAmbiguous: Content = {
  categories,
  solution,
  clues: trueClues.slice(0, 3),
};

const falseClue = {
  content: "Ann does not wear the Red hat.",
  isFalse: true,
  rule: { kind: "isNot", a: "Ann", b: "Red" },
} as const;

/** Only dropping the false clue leaves one solution: dropping any other leaves none, or three when Ann's hat is freed. */
export const variant: Content = {
  categories,
  solution,
  clues: [...trueClues, falseClue],
};

/** With "Bob wears Green" as the false clue, dropping clue 3 or clue 4 also leaves exactly one solution, so three clue choices work. */
export const variantAmbiguous: Content = {
  categories,
  solution,
  clues: [
    ...trueClues,
    {
      content: "Bob wears the Green hat.",
      isFalse: true,
      rule: { kind: "is", a: "Bob", b: "Green" },
    },
  ],
};

const uuid = (n: number) =>
  `00000000-0000-4000-8000-${n.toString(16).padStart(12, "0")}`;

export const itemId = (category: number, index: number) =>
  uuid(category * 16 + index + 1);

/** The payload `load` would build for `content`, with ids `itemId(category, index)`. */
export const payloadOf = (content: Content): Payload => ({
  variant: isVariant(content.clues.map(({ isFalse }) => ({ isFalse: Boolean(isFalse) }))),
  categories: content.categories.map(({ name, items }, position) => ({
    position,
    name,
    items: items.map((label, index) => ({
      id: itemId(position, index),
      position: index,
      label,
    })),
  })),
  clues: content.clues.map(({ content: text }, position) => ({
    position,
    content: text,
  })),
});

/** The solution `loadSolution` would return: one link from each household's first item to each of the others. */
export const solutionOf = (content: Content): Solution => ({
  links: content.solution.flatMap((row) =>
    row.slice(1).map((label, offset) => ({
      itemAId: itemId(0, content.categories[0].items.indexOf(row[0])),
      itemBId: itemId(
        offset + 1,
        content.categories[offset + 1].items.indexOf(label),
      ),
    })),
  ),
  clues: content.clues.map(({ isFalse }, position) => ({
    position,
    isFalse: Boolean(isFalse),
  })),
});

export const payload = payloadOf(classic);
export const classicSolution = solutionOf(classic);
