import { holds, solve } from "./engine";
import type { Content } from "./schema";

/** The stored roles must be the one assignment under which every knight tells the truth and every knave lies. */
export function verifyKnightsKnaves({ characters }: Content) {
  const names = characters.map(({ name }) => name);
  const repeated = names.find((name, i) => names.indexOf(name) !== i);
  if (repeated) throw new Error(`the name "${repeated}" is used twice`);
  for (const { statements } of characters) {
    for (const { claim } of statements) holds(names, [], claim);
  }
  const stored = characters.map(({ role }) => role);
  const found = solve(characters, 2);
  if (found.length === 0) throw new Error("the statements contradict every assignment");
  if (found.length > 1) throw new Error("more than one assignment fits the statements");
  if (found[0].some((role, i) => role !== stored[i])) {
    throw new Error(
      `the statements lead to ${found[0].join(", ")}, not the stored roles ${stored.join(", ")}`,
    );
  }
}
