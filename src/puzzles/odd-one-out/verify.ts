import type { Content } from "./schema";

/**
 * Structure only: whether the other items really are not odd cannot be proven by machine, so the
 * `reviewNote` in the file's meta must say why.
 */
export function verifyOddOneOut(
  { items, solution }: Content,
  { reviewNote }: { reviewNote?: string },
) {
  if (items.length < 4 || items.length > 5) {
    throw new Error(`needs 4 or 5 items, has ${items.length}`);
  }
  if (new Set(items).size !== items.length) {
    throw new Error("two items share a label");
  }
  if (solution.itemPosition < 0 || solution.itemPosition >= items.length) {
    throw new Error(
      `the odd item ${solution.itemPosition} is not one of the ${items.length} items`,
    );
  }
  if (!solution.explanation.trim()) throw new Error("the explanation is empty");
  if (!reviewNote?.trim()) {
    throw new Error(
      "meta.reviewNote must justify why the other items are not odd",
    );
  }
}
