import { describe, expect, it } from "vitest";
import { content as coldCoffee } from "../../../content/acrostic/cold-coffee";
import { content as eveningBells } from "../../../content/acrostic/evening-bells";
import { content as nightShift } from "../../../content/acrostic/night-shift";
import { verifyAcrostic } from "./verify";

describe("verifyAcrostic", () => {
  it.each([coldCoffee, eveningBells, nightShift])(
    "accepts the shipped content",
    (content) => {
      expect(() => verifyAcrostic(content)).not.toThrow();
    },
  );

  it("rejects a derived message under 4 letters", () => {
    expect(() =>
      verifyAcrostic({
        rule: "first_letter_line",
        lines: ["Add one.", "Bring two.", "Carry three."],
      }),
    ).toThrow(/"ABC" has 3 letters, under 4/);
  });

  it("rejects a puzzle whose message is empty", () => {
    expect(() => verifyAcrostic({ rule: "first_letter_word", lines: [] })).toThrow(
      /has 0 letters/,
    );
  });

  it("rejects a line with no letters", () => {
    expect(() =>
      verifyAcrostic({
        rule: "last_letter_line",
        lines: ["one", "two", "...", "three", "four"],
      }),
    ).toThrow(/line 3 has no letters/);
  });
});
