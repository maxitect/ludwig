import type { Answer, AttemptState, Payload, Solution } from "./schema";

type Link = Answer["links"][number];
type Mark = AttemptState["marks"][number];

/** The variant is derived: it is on exactly when a clue is false. */
export const isVariant = (clues: ReadonlyArray<{ isFalse: boolean }>) =>
  clues.some(({ isFalse }) => isFalse);

export const falseCluePosition = (clues: Solution["clues"]) =>
  clues.find(({ isFalse }) => isFalse)?.position ?? null;

export const pairKey = (a: string, b: string) =>
  a < b ? `${a}|${b}` : `${b}|${a}`;

const categoryOf = ({ categories }: Payload) =>
  new Map(
    categories.flatMap(({ position, items }) =>
      items.map(({ id }) => [id, position] as const),
    ),
  );

function groups(ids: Iterable<string>, links: ReadonlyArray<Link>) {
  const parent = new Map<string, string>();
  for (const id of ids) parent.set(id, id);
  const find = (id: string): string => {
    const up = parent.get(id);
    if (up === undefined || up === id) return id;
    const root = find(up);
    parent.set(id, root);
    return root;
  };
  for (const { itemAId, itemBId } of links) {
    if (parent.has(itemAId) && parent.has(itemBId)) {
      parent.set(find(itemAId), find(itemBId));
    }
  }
  const byRoot = new Map<string, string[]>();
  for (const id of parent.keys()) {
    const root = find(id);
    byRoot.set(root, [...(byRoot.get(root) ?? []), id]);
  }
  return [...byRoot.values()];
}

/** Every pair of items from different categories that `links` connects, directly or through other items. */
export function linkedPairs(payload: Payload, links: ReadonlyArray<Link>) {
  const categories = categoryOf(payload);
  const pairs = new Set<string>();
  for (const group of groups(categories.keys(), links)) {
    for (const [i, a] of group.entries()) {
      for (const b of group.slice(i + 1)) {
        if (categories.get(a) !== categories.get(b)) pairs.add(pairKey(a, b));
      }
    }
  }
  return pairs;
}

/**
 * Every household the yes marks describe, as links across all pairs of categories, or null until
 * each household holds exactly one item of every category.
 */
export function answerFromMarks(payload: Payload, marks: ReadonlyArray<Mark>) {
  const categories = categoryOf(payload);
  const yes = marks
    .filter(({ mark }) => mark === "yes")
    .map(({ itemAId, itemBId }) => ({ itemAId, itemBId }));
  const households = groups(categories.keys(), yes);
  const complete = households.every(
    (group) =>
      group.length === payload.categories.length &&
      new Set(group.map((id) => categories.get(id))).size === group.length,
  );
  if (!complete) return null;
  return households.flatMap((group) =>
    group.flatMap((a, i) =>
      group.slice(i + 1).map((b) => ({ itemAId: a, itemBId: b })),
    ),
  );
}
