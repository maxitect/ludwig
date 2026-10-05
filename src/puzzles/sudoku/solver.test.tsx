// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { givens, solution } from "./fixture";
import type { AttemptState } from "./schema";
import { Solver } from "./solver";

afterEach(cleanup);

function renderSolver(initialState: AttemptState | null = null) {
  const onStateChange = vi.fn();
  const registerCheck = vi.fn();
  const requestCheck = vi.fn();
  render(
    <Solver
      payload={{ givens }}
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

describe("sudoku Solver", () => {
  it("shows the givens as read-only cells", async () => {
    const user = userEvent.setup();
    const { onStateChange } = renderSolver();
    expect(cell(1, 1).getAttribute("aria-label")).toBe(
      "Row 1, column 1, given, 5",
    );
    await user.click(cell(1, 1));
    await user.keyboard("9");
    expect(cell(1, 1).textContent).toContain("5");
    expect(onStateChange).not.toHaveBeenCalled();
  });

  it("enters a digit without advancing and reports it", async () => {
    const user = userEvent.setup();
    const { onStateChange } = renderSolver();
    await user.click(cell(1, 3));
    await user.keyboard("4");
    expect(cell(1, 3).textContent).toContain("4");
    expect(cell(1, 3).getAttribute("data-active")).toBe("true");
    expect(onStateChange).toHaveBeenLastCalledWith({
      cells: [{ row: 0, col: 2, digit: 4 }],
      notes: [],
    });
    await user.keyboard("{Backspace}");
    expect(onStateChange).toHaveBeenLastCalledWith({ cells: [], notes: [] });
  });

  it("toggles notes with the N key and the button, and keeps them apart from digits", async () => {
    const user = userEvent.setup();
    const { onStateChange } = renderSolver();
    const toggle = screen.getByRole("button", { name: "Notes" });
    expect(toggle.getAttribute("aria-pressed")).toBe("false");
    await user.click(cell(1, 3));
    await user.keyboard("n");
    expect(toggle.getAttribute("aria-pressed")).toBe("true");
    await user.keyboard("62");
    expect(onStateChange).toHaveBeenLastCalledWith({
      cells: [],
      notes: [
        { row: 0, col: 2, digit: 2 },
        { row: 0, col: 2, digit: 6 },
      ],
    });
    await user.keyboard("6");
    expect(onStateChange).toHaveBeenLastCalledWith({
      cells: [],
      notes: [{ row: 0, col: 2, digit: 2 }],
    });
    await user.click(toggle);
    expect(toggle.getAttribute("aria-pressed")).toBe("false");
    await user.click(cell(1, 3));
    await user.keyboard("4");
    expect(onStateChange).toHaveBeenLastCalledWith({
      cells: [{ row: 0, col: 2, digit: 4 }],
      notes: [],
    });
  });

  it("restores saved digits and notes, dropping any on a given cell", () => {
    renderSolver({
      cells: [
        { row: 0, col: 2, digit: 4 },
        { row: 0, col: 0, digit: 1 },
      ],
      notes: [{ row: 0, col: 3, digit: 6 }],
    });
    expect(cell(1, 3).textContent).toContain("4");
    expect(cell(1, 1).textContent).toContain("5");
  });

  it("registers the full grid only when every cell is filled, and asks for a check on the last digit", async () => {
    const user = userEvent.setup();
    const filled = new Set(givens.map(({ row, col }) => `${row},${col}`));
    const empty = solution.filter(({ row, col }) => !filled.has(`${row},${col}`));
    const [last, ...rest] = [...empty].reverse();
    const { registerCheck, requestCheck } = renderSolver({
      cells: rest.map(({ row, col, digit }) => ({ row, col, digit })),
      notes: [],
    });
    const read = () =>
      registerCheck.mock.calls[registerCheck.mock.calls.length - 1][0]();
    expect(read()).toBeNull();
    await user.click(cell(last.row + 1, last.col + 1));
    await user.keyboard(String(last.digit));
    expect(requestCheck).toHaveBeenCalledTimes(1);
    expect(read()?.cells).toHaveLength(81);
    expect(read()?.cells).toContainEqual(last);
  });
});
