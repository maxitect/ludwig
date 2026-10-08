import { deriveMessage, lettersOf } from "./derive";
import type { Content } from "./schema";

const MIN_MESSAGE_LETTERS = 4;

/** The message is derived, so it is unique by construction; it only has to be long enough to be a message. */
export function verifyAcrostic({ rule, lines }: Content) {
  const blank = lines.findIndex((line) => lettersOf(line) === "");
  if (blank !== -1) throw new Error(`line ${blank + 1} has no letters`);
  const message = deriveMessage(rule, lines);
  if (message.length < MIN_MESSAGE_LETTERS) {
    throw new Error(
      `the derived message "${message}" has ${message.length} letters, under ${MIN_MESSAGE_LETTERS}`,
    );
  }
}
