import { describe, expect, it } from "vitest";
import { check } from "./check";

const payload = { title: "t", author: "a", lines: [], refs: [] };
const solution = { plaintext: "never let them rest" };
const run = (answer: string) => check(payload, solution, { answer }).correct;

describe("check", () => {
  it("accepts the message, ignoring case and spacing", () => {
    expect(run("never let them rest")).toBe(true);
    expect(run("Never  LET them rest")).toBe(true);
  });

  it("rejects a changed, missing, extra or unfilled word", () => {
    expect(run("never let them best")).toBe(false);
    expect(run("never let them")).toBe(false);
    expect(run("never let them rest up")).toBe(false);
    expect(run("never let _ rest")).toBe(false);
  });
});
