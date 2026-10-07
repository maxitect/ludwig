import { describe, expect, it } from "vitest";
import { check } from "./check";

const payload = { ciphertext: "DWWDFN DW GDZQ" };
const solution = { plaintext: "attack at dawn", shift: 3 };
const run = (answer: string) => check(payload, solution, { answer }).correct;

describe("check", () => {
  it("accepts the plaintext", () => {
    expect(run("attack at dawn")).toBe(true);
  });

  it("ignores case, spacing and punctuation", () => {
    expect(run("ATTACKATDAWN")).toBe(true);
    expect(run("Attack  at   dawn!")).toBe(true);
    expect(run("attack, at dawn.")).toBe(true);
  });

  it("rejects the ciphertext, a changed letter and a missing letter", () => {
    expect(run("DWWDFN DW GDZQ")).toBe(false);
    expect(run("attack at dawm")).toBe(false);
    expect(run("attack at daw")).toBe(false);
    expect(run("attack at dawnn")).toBe(false);
  });
});
