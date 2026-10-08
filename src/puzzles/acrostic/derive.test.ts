import { describe, expect, it } from "vitest";
import { deriveMessage, lettersOf } from "./derive";

describe("lettersOf", () => {
  it("keeps upper-case A to Z only", () => {
    expect(lettersOf("  “Don't, René!” 42")).toBe("DONTRENE");
  });
});

describe("deriveMessage", () => {
  it("reads the first letter of each sentence line (the S1E1-style I LOVE YOU)", () => {
    const lines = [
      "In the end it was the small things.",
      "Last winter's bus stop, your scarf.",
      "Once you laughed so hard.",
      "Very few people do that.",
      "Even now I replay it.",
      "You never noticed.",
      "Often I nearly said it.",
      "Until tonight.",
    ];
    expect(deriveMessage("first_letter_line", lines)).toBe("ILOVEYOU");
  });

  it("skips leading punctuation and ignores case", () => {
    expect(
      deriveMessage("first_letter_line", [
        "“and then",
        "...Never again",
        "'tis late",
      ]),
    ).toBe("ANT");
  });

  it("reads the first letter of each word across lines", () => {
    expect(
      deriveMessage("first_letter_word", [
        "My iron door never,",
        "ignores GUESTS --",
        "however talkative.",
      ]),
    ).toBe("MIDNIGHT");
  });

  it("reads the last letter of each line, ignoring trailing punctuation", () => {
    expect(
      deriveMessage("last_letter_line", [
        "Across the moor!",
        "The dog barks at the studio...",
        "Eight, nine, ten.",
        "Stop, who goes there?",
      ]),
    ).toBe("RONE");
  });

  it("adds nothing for a word or line with no letters", () => {
    expect(deriveMessage("first_letter_word", ["a - b 12 c"])).toBe("ABC");
    expect(deriveMessage("first_letter_line", ["12", "ab"])).toBe("A");
  });
});
