import { describe, expect, it } from "vitest";
import { payload, solution } from "./fixture";
import { contentSchema, payloadSchema } from "./schema";

describe("payloadSchema", () => {
  it("accepts the fixture payload", () => {
    expect(payloadSchema.strict().parse(payload)).toEqual(payload);
  });

  it("carries the grid, fixed mirrors, slots and ports, and no slot assignments", () => {
    expect(Object.keys(payload).sort()).toEqual([
      "cols",
      "fixedMirrors",
      "ports",
      "rows",
      "slots",
    ]);
    expect(payload.slots.every((slot) => !("mirror" in slot))).toBe(true);
  });

  it("rejects a payload that carries the solution or a mirror on a slot", () => {
    expect(
      payloadSchema.strict().safeParse({ ...payload, solution }).success,
    ).toBe(false);
    expect(
      payloadSchema.strict().safeParse({
        ...payload,
        slots: payload.slots.map((slot) => ({ ...slot, mirror: "slash" })),
      }).success,
    ).toBe(false);
  });
});

describe("contentSchema", () => {
  it("rejects a lowercase label, a diagonal side, a big grid and a cell outside the grid", () => {
    const base = { rows: 5, cols: 5, fixedMirrors: [], slots: [], ports: [] };
    const port = { side: "n", offset: 0, label: "A" };
    expect(contentSchema.safeParse({ ...base, ports: [port] }).success).toBe(true);
    expect(
      contentSchema.safeParse({ ...base, ports: [{ ...port, label: "a" }] })
        .success,
    ).toBe(false);
    expect(
      contentSchema.safeParse({ ...base, ports: [{ ...port, side: "ne" }] })
        .success,
    ).toBe(false);
    expect(contentSchema.safeParse({ ...base, rows: 11 }).success).toBe(false);
    expect(contentSchema.safeParse({ ...base, cols: 3 }).success).toBe(false);
    expect(
      contentSchema.safeParse({ ...base, slots: [{ row: 5, col: 0 }] }).success,
    ).toBe(false);
    expect(
      contentSchema.safeParse({
        ...base,
        fixedMirrors: [{ row: 0, col: 5, mirror: "slash" }],
      }).success,
    ).toBe(false);
  });
});
