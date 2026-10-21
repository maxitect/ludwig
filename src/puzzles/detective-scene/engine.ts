import { regionContains } from "../_shared/regions";
import type { Solution } from "./schema";

/** Case, accents, punctuation and a leading "The" are ignored, and "&" reads as "and". */
export function normaliseTitle(title: string) {
  return title
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/['‘’]/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .replace(/^the(?: |$)/, "");
}

/**
 * The position of the item whose region holds the tap and whose title or alias matches `typed`,
 * or null. Regions never overlap, so at most one item can hold the tap.
 */
export function matchFind(
  items: Solution["items"],
  aliases: Solution["aliases"],
  tap: { x: number; y: number },
  typed: string,
) {
  const item = items.find((candidate) => regionContains(candidate, tap));
  if (!item) return null;
  const wanted = normaliseTitle(typed);
  if (!wanted) return null;
  const names = [
    item.title,
    ...aliases
      .filter(({ position }) => position === item.position)
      .map(({ alias }) => alias),
  ];
  return names.some((name) => normaliseTitle(name) === wanted)
    ? item.position
    : null;
}
