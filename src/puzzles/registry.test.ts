import { getTableConfig } from "drizzle-orm/pg-core";
import { describe, expect, it } from "vitest";
import { attempts } from "@/db/schema";
import { fixtureModule } from "./__fixture/module";
import { getPuzzleModule, registry } from "./registry";

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

  it("keys every module by its own meta key", () => {
    for (const [key, module] of Object.entries(registry)) {
      expect(module.meta.key).toBe(key);
    }
  });

  it("gives every module its own attempt root, keyed to attempts", () => {
    const roots = Object.values(registry).map(({ attemptRoot }) =>
      getTableConfig(attemptRoot),
    );
    expect(new Set(roots.map(({ name }) => name)).size).toBe(roots.length);
    for (const { name, foreignKeys } of roots) {
      expect(
        foreignKeys.some((fk) => fk.reference().foreignTable === attempts),
        name,
      ).toBe(true);
    }
  });
});
