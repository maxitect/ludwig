// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { AttemptState, Payload } from "./schema";
import { Solver } from "./solver";

afterEach(cleanup);

const payload: Payload = {
  rows: 3,
  cols: 4,
  targetRow: 0,
  targetCol: 3,
  obstacles: [{ row: 0, col: 2 }],
  observers: [{ row: 0, col: 0, facing: "ne", fovDeg: 90 }],
};

function renderSolver(initialState: AttemptState | null = null) {
  const onStateChange = vi.fn();
  const registerCheck = vi.fn();
  render(
    <Solver
      payload={payload}
      initialState={initialState}
      onStateChange={onStateChange}
      registerCheck={registerCheck}
    />,
  );
  return { onStateChange, registerCheck };
}

const cell = (row: number, col: number) =>
  screen.getByRole("gridcell", {
    name: new RegExp(`^Row ${row + 1}, column ${col + 1},`),
  });
const reader = (registerCheck: ReturnType<typeof vi.fn>) =>
  registerCheck.mock.calls.at(-1)?.[0] as () => unknown;

describe("sightlines solver", () => {
  it("names what stands on each cell", () => {
    renderSolver();
    expect(screen.getAllByRole("gridcell")).toHaveLength(12);
    expect(cell(0, 2).getAttribute("aria-label")).toMatch(/pillar/);
    expect(cell(0, 0).getAttribute("aria-label")).toMatch(
      /observer facing NE, 90 degree view/,
    );
    expect(cell(0, 3).getAttribute("aria-label")).toMatch(/the alcove/);
    expect(cell(1, 1).getAttribute("aria-label")).toMatch(/floor/);
  });

  it("marks and clears a cell with the keyboard", async () => {
    const user = userEvent.setup();
    const { onStateChange, registerCheck } = renderSolver();
    expect(reader(registerCheck)()).toBeNull();

    cell(0, 0).focus();
    await user.keyboard("{ArrowDown}{ArrowRight}{Enter}");
    expect(cell(1, 1).getAttribute("aria-label")).toMatch(/marked as a blind spot/);
    expect(onStateChange).toHaveBeenLastCalledWith({ marks: [{ row: 1, col: 1 }] });
    expect(reader(registerCheck)()).toEqual({ marks: [{ row: 1, col: 1 }] });

    await user.keyboard(" ");
    expect(cell(1, 1).getAttribute("aria-label")).not.toMatch(/marked/);
    expect(onStateChange).toHaveBeenLastCalledWith({ marks: [] });
  });

  it("marks a cell by click and never marks a pillar", async () => {
    const user = userEvent.setup();
    const { onStateChange } = renderSolver();
    await user.click(cell(0, 2));
    expect(onStateChange).not.toHaveBeenCalled();
    await user.click(cell(2, 3));
    expect(onStateChange).toHaveBeenLastCalledWith({ marks: [{ row: 2, col: 3 }] });
  });

  it("restores saved marks and drops any that no longer fit the layout", () => {
    renderSolver({
      marks: [
        { row: 2, col: 3 },
        { row: 0, col: 2 },
        { row: 9, col: 9 },
      ],
    });
    expect(screen.getByText("1 cell marked")).toBeTruthy();
    expect(cell(2, 3).getAttribute("aria-label")).toMatch(/marked as a blind spot/);
  });
});
