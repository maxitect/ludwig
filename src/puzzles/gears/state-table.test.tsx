// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ComponentProps } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { diagramOf } from "./generate";
import type { Content, Payload } from "./schema";
import { Solver } from "./solver";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  localStorage.clear();
});

const gear = (label: string, teeth: number, startSlot: number, isDriver = false) => ({
  label,
  teeth,
  startSlot,
  initialOffset: 0,
  halfWidthDeg: 45,
  isDriver,
});

const { solution, ...F3 }: Content = {
  slotCount: 8,
  mIn: 3,
  mOut: 1,
  maxAdjustments: 1,
  occlusion: false,
  generatorSeed: null,
  gears: [gear("A", 8, 0, true), gear("B", 12, 1), gear("C", 16, 2)],
  meshes: [
    { a: "A", b: "B" },
    { a: "B", b: "C" },
  ],
  solution: { crank: 0, convergence: 1, killerLabel: "A", swaps: [] },
};
void solution;
const payload: Payload = { ...F3, ...diagramOf(F3) };

function renderSolver(
  initialState: ComponentProps<typeof Solver>["initialState"],
) {
  render(
    <Solver
      payload={payload}
      initialState={initialState}
      onStateChange={vi.fn()}
      registerCheck={vi.fn()}
      requestCheck={vi.fn()}
    />,
  );
}

const slotOf = (label: string) => {
  const row = screen.getByRole("rowheader", { name: label }).closest("tr")!;
  return within(row).getAllByRole("cell")[2]!.textContent;
};

describe("gear state table", () => {
  it("shows the starting slots after Fix the Diagram swaps", () => {
    localStorage.setItem("gears-state-table", "1");
    renderSolver({
      crank: 0,
      convergence: 1,
      accusedGearId: null,
      swaps: [{ gearAId: "A", gearBId: "C" }],
    });
    expect(slotOf("A")).toBe("2");
    expect(slotOf("B")).toBe("1");
    expect(slotOf("C")).toBe("0");
  });

  it("still toggles when storage throws", async () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new DOMException("blocked", "SecurityError");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("blocked", "SecurityError");
    });
    const user = userEvent.setup();
    renderSolver(null);
    const toggle = screen.getByRole("button", { name: "Show as table" });
    expect(screen.queryByRole("table")).toBeNull();
    await user.click(toggle);
    expect(screen.getByRole("table")).toBeTruthy();
    expect(toggle.getAttribute("aria-controls")).toBe(
      screen.getByRole("table").parentElement!.id,
    );
    await user.click(toggle);
    expect(screen.queryByRole("table")).toBeNull();
  });
});
