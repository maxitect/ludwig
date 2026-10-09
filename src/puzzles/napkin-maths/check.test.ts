import { describe, expect, it } from "vitest";
import { check } from "./check";
import { normaliseDecimal } from "./decimal";
import { answerSchema, type Payload } from "./schema";

const payload: Payload = { questionText: "q", lines: ["a", "b"] };

function attempt(solution: string, input: string) {
  const parsed = answerSchema.safeParse({ answer: input });
  return parsed.success ? check(payload, solution, parsed.data) : "invalid";
}

describe("napkin maths check", () => {
  it.each(["4", "4.0", "04", " 4 ", "4.000000"])(
    "accepts %j when the answer is 4",
    (input) => {
      expect(attempt("4.000000", input)).toEqual({ correct: true });
    },
  );

  it("rejects a different number as wrong", () => {
    expect(attempt("4.000000", "4.01")).toEqual({ correct: false });
    expect(attempt("4.000000", "40")).toEqual({ correct: false });
    expect(attempt("4.000000", "-4")).toEqual({ correct: false });
  });

  it("compares decimals exactly, not as floats", () => {
    expect(attempt("0.300000", "0.3")).toEqual({ correct: true });
    expect(attempt("0.300000", "0.30000000000000004")).toBe("invalid");
    expect(attempt("1.500000", "1.5")).toEqual({ correct: true });
  });

  it("rejects text, expressions and empty input with a validation error", () => {
    for (const input of ["four", "", "4/1", "2+2", "1e3", "4.", ".5", "--4"]) {
      expect(attempt("4.000000", input)).toBe("invalid");
    }
  });

  it("treats negative zero as zero", () => {
    expect(attempt("0.000000", "-0")).toEqual({ correct: true });
  });
});

describe("normaliseDecimal", () => {
  it.each([
    ["4", "4"],
    ["4.0", "4"],
    ["04", "4"],
    ["4.000000", "4"],
    ["0.50", "0.5"],
    ["-0.00", "0"],
    ["-12.50", "-12.5"],
    ["100", "100"],
    ["0", "0"],
  ])("%s becomes %s", (input, expected) => {
    expect(normaliseDecimal(input)).toBe(expected);
  });
});
