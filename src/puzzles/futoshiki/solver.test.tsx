// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { payload, solution } from "./fixture";
import type { AttemptState } from "./schema";
import { Solver } from "./solver";

afterEach(cleanup);

function renderSolver(initialState: AttemptState | null = null) {
  const onStateChange = vi.fn();
  const registerCheck = vi.fn();
  const requestCheck = vi.fn();
  render(
    <Solver
      payload={payload}
      initialState={initialState}
      onStateChange={onStateChange}
      registerCheck={registerCheck}
      requestCheck={requestCheck}
    />,
  );
  return { onStateChange, registerCheck, requestCheck };
}

const cell = (row: number, col: number) =>
  screen.getByRole("gridcell", {
    name: new RegExp(`^Row ${row}, column ${col}\\b`),
  });

describe("futoshiki Solver", () => {
  it("draws a 4 by 4 grid with its givens as read-only cells", async () => {
    const user = userEvent.setup();
    const { onStateChange } = renderSolver();
    expect(screen.getAllByRole("gridcell")).toHaveLength(16);
    expect(cell(1, 1).getAttribute("aria-label")).toContain("given, 1");
    await user.click(cell(1, 1));
    await user.keyboard("3");
    expect(cell(1, 1).textContent).toContain("1");
    expect(onStateChange).not.toHaveBeenCalled();
  });

  it("labels each sign on both cells it sits between", () => {
    renderSolver();
    expect(cell(1, 2).getAttribute("aria-label")).toBe(
      "Row 1, column 2, less than the cell to the right, empty",
    );
    expect(cell(1, 4).getAttribute("aria-label")).toBe(
      "Row 1, column 4, greater than the cell below, empty",
    );
    expect(cell(4, 2).getAttribute("aria-label")).toBe(
      "Row 4, column 2, greater than the cell to the right, empty",
    );
    expect(cell(2, 3).getAttribute("aria-label")).toBe(
      "Row 2, column 3, less than the cell to the left, less than the cell to the right, less than the cell below, empty",
    );
    expect(cell(2, 4).getAttribute("aria-label")).toBe(
      "Row 2, column 4, greater than the cell to the left, less than the cell above, empty",
    );
    expect(cell(3, 3).getAttribute("aria-label")).toBe(
      "Row 3, column 3, greater than the cell above, given, 4",
    );
  });

  it("only accepts digits up to the grid size", async () => {
    const user = userEvent.setup();
    const { onStateChange } = renderSolver();
    await user.click(cell(1, 2));
    await user.keyboard("5");
    expect(onStateChange).not.toHaveBeenCalled();
    await user.keyboard("4");
    expect(onStateChange).toHaveBeenLastCalledWith({
      cells: [{ row: 0, col: 1, digit: 4 }],
      notes: [],
    });
  });

  it("toggles notes with the N key and keeps them apart from digits", async () => {
    const user = userEvent.setup();
    const { onStateChange } = renderSolver();
    const toggle = screen.getByRole("button", { name: "Notes" });
    await user.click(cell(1, 2));
    await user.keyboard("n");
    expect(toggle.getAttribute("aria-pressed")).toBe("true");
    await user.keyboard("31");
    expect(onStateChange).toHaveBeenLastCalledWith({
      cells: [],
      notes: [
        { row: 0, col: 1, digit: 1 },
        { row: 0, col: 1, digit: 3 },
      ],
    });
    await user.keyboard("3");
    expect(onStateChange).toHaveBeenLastCalledWith({
      cells: [],
      notes: [{ row: 0, col: 1, digit: 1 }],
    });
  });

  it("restores saved digits and notes, dropping any on a given cell", () => {
    renderSolver({
      cells: [
        { row: 0, col: 1, digit: 2 },
        { row: 0, col: 0, digit: 4 },
      ],
      notes: [{ row: 0, col: 0, digit: 2 }],
    });
    expect(cell(1, 2).textContent).toContain("2");
    expect(cell(1, 1).textContent).toContain("1");
  });

  it("registers the full grid only when every cell is filled, and asks for a check on the last digit", async () => {
    const user = userEvent.setup();
    const filled = new Set(
      payload.givens.map(({ row, col }) => `${row},${col}`),
    );
    const empty = solution.filter(
      ({ row, col }) => !filled.has(`${row},${col}`),
    );
    const [last, ...rest] = [...empty].reverse();
    const { registerCheck, requestCheck } = renderSolver({
      cells: rest,
      notes: [],
    });
    const read = () =>
      registerCheck.mock.calls[registerCheck.mock.calls.length - 1][0]();
    expect(read()).toBeNull();
    await user.click(cell(last.row + 1, last.col + 1));
    await user.keyboard(String(last.digit));
    expect(requestCheck).toHaveBeenCalledTimes(1);
    expect(read()?.cells).toHaveLength(16);
    expect(read()?.cells).toContainEqual(last);
  });
});
