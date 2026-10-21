import { matchFind } from "./engine";
import type { Answer, Payload, Solution } from "./schema";

/** Correct when the finds match every item, each by its tap and typed title. */
export function check(
  _payload: Payload,
  { items, aliases }: Solution,
  { finds }: Answer,
) {
  const found = new Set(
    finds.flatMap((find) => matchFind(items, aliases, find, find.title) ?? []),
  );
  return { correct: found.size === items.length };
}
