// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { getAttemptSchema } from "./attempt-schemas";
import { solvers } from "./solvers";

describe("client attempt schemas", () => {
  it("cover every type with a solver, so signed-out progress can resume", () => {
    const missing = Object.entries(solvers)
      .filter(([key, solver]) => solver && key !== "__fixture")
      .filter(([key]) => getAttemptSchema(key) === null)
      .map(([key]) => key);
    expect(missing).toEqual([]);
  });
});
