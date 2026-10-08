import { describe, expect, it } from "vitest";
import { verifyWordLadder } from "./verify";

const good = {
  startWord: "head",
  endWord: "tail",
  rungs: ["held", "hell", "tell", "tall"],
};

describe("verifyWordLadder", () => {
  it("accepts a valid reference ladder", () => {
    expect(() => verifyWordLadder(good)).not.toThrow();
  });

  it("rejects a reference rung that is not in the dictionary", () => {
    expect(() =>
      verifyWordLadder({ ...good, rungs: ["held", "hell", "tezl", "tall"] }),
    ).toThrow(/rung 3 "tezl" is invalid \(not-a-word\)/);
  });

  it("rejects a step that changes two letters", () => {
    expect(() =>
      verifyWordLadder({ ...good, rungs: ["held", "hell", "tall", "tall"] }),
    ).toThrow(/invalid/);
  });

  it("rejects an end word that is not in the dictionary", () => {
    expect(() =>
      verifyWordLadder({ ...good, endWord: "tzil", rungs: ["held"] }),
    ).toThrow(/"tzil" is not in the dictionary/);
  });
});
