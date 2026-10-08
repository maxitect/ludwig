import type { acrosticRuleEnum } from "./tables";

export type Rule = (typeof acrosticRuleEnum.enumValues)[number];

export const RULE_LABELS: Readonly<Record<Rule, string>> = {
  first_letter_line: "Read the first letter of each line",
  first_letter_word: "Read the first letter of each word",
  last_letter_line: "Read the last letter of each line",
};

/** Upper-case A to Z only: case, accents, spaces and punctuation never count. */
export function lettersOf(text: string) {
  return text
    .normalize("NFD")
    .toUpperCase()
    .replace(/[^A-Z]/g, "");
}

/** The hidden message, as upper-case letters. A line or word with no letters adds nothing. */
export function deriveMessage(rule: Rule, lines: string[]) {
  switch (rule) {
    case "first_letter_line":
      return lines.map((line) => lettersOf(line).charAt(0)).join("");
    case "last_letter_line":
      return lines.map((line) => lettersOf(line).slice(-1)).join("");
    case "first_letter_word":
      return lines
        .flatMap((line) => line.split(/\s+/))
        .map((word) => lettersOf(word).charAt(0))
        .join("");
  }
}
