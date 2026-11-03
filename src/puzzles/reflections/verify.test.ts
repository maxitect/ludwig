import { describe, expect, it } from "vitest";
import { payload } from "./fixture";
import { verifyReflections } from "./verify";

describe("verifyReflections", () => {
  it("accepts a puzzle with one solution", () => {
    expect(() => verifyReflections(payload)).not.toThrow();
  });

  it("rejects a label used three times", () => {
    const [first] = payload.ports;
    expect(() =>
      verifyReflections({
        ...payload,
        ports: [...payload.ports, { side: "s", offset: 4, label: first.label }],
      }),
    ).toThrow(/appears 3 times/);
  });

  it("rejects a label used once", () => {
    expect(() =>
      verifyReflections({ ...payload, ports: payload.ports.slice(1) }),
    ).toThrow(/appears 1 times/);
  });

  it("rejects a slot on a fixed mirror", () => {
    const { row, col } = payload.fixedMirrors[0];
    expect(() =>
      verifyReflections({ ...payload, slots: [...payload.slots, { row, col }] }),
    ).toThrow(/shares a cell with a fixed mirror/);
  });

  it("rejects a port off the edge and two ports in one place", () => {
    const [a, ...rest] = payload.ports;
    expect(() =>
      verifyReflections({
        ...payload,
        ports: [{ ...a, offset: payload.cols }, ...rest],
      }),
    ).toThrow(/not on the/);
    expect(() =>
      verifyReflections({
        ...payload,
        ports: [a, { ...a, label: "Z" }, ...rest],
      }),
    ).toThrow(/two ports/);
  });

  it("rejects a puzzle with more than one solution", () => {
    expect(() =>
      verifyReflections({ ...payload, ports: payload.ports.slice(0, 2) }),
    ).toThrow(/more than one solution/);
  });

  it("rejects a puzzle with no solution", () => {
    expect(() =>
      verifyReflections({
        rows: 4,
        cols: 4,
        fixedMirrors: [],
        slots: [{ row: 1, col: 1 }],
        ports: [
          { side: "w", offset: 1, label: "A" },
          { side: "e", offset: 1, label: "A" },
        ],
      }),
    ).toThrow(/no solution/);
  });
});
