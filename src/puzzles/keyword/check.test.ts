import { describe, expect, it } from "vitest";
import { check } from "./check";

const payload = { ciphertext: "LRRLDF LR WLVK" };
const solution = { plaintext: "attack at dawn", keyword: "ludwig" };
const run = (answer: string) => check(payload, solution, { answer }).correct;

describe("check", () => {
  it("accepts the plaintext", () => {
    expect(run("attack at dawn")).toBe(true);
  });

  it("ignores case, spacing and punctuation", () => {
    expect(run("ATTACKATDAWN")).toBe(true);
    expect(run("Attack  at   dawn!")).toBe(true);
  });

  it("rejects the ciphertext, a changed letter and a missing letter", () => {
    expect(run("LRRLDF LR WLVK")).toBe(false);
    expect(run("attack at dawm")).toBe(false);
    expect(run("attack at daw")).toBe(false);
  });
});
