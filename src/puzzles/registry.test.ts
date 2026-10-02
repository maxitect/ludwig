import { describe, expect, it } from "vitest";
import { fixtureModule } from "./__fixture/module";
import { getPuzzleModule } from "./registry";

describe("getPuzzleModule", () => {
  it("throws on an unknown type", () => {
    expect(() => getPuzzleModule("nope")).toThrow("Unknown puzzle type: nope");
  });

  it("throws on inherited object keys", () => {
    expect(() => getPuzzleModule("toString")).toThrow();
  });

  it("returns a registered module", () => {
    const source = { [fixtureModule.meta.key]: fixtureModule };
    expect(getPuzzleModule(fixtureModule.meta.key, source)).toBe(fixtureModule);
  });
});
