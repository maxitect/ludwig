// @vitest-environment jsdom
import { act, cleanup, render, screen } from "@testing-library/react";
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

describe("troix Solver", () => {
  it("draws a 6 by 6 grid with its givens as read-only cells", async () => {
    const user = userEvent.setup();
    const { onStateChange } = renderSolver();
    expect(screen.getAllByRole("gridcell")).toHaveLength(36);
    expect(cell(1, 3).getAttribute("aria-label")).toContain("given, O");
    await user.click(cell(1, 3));
    await user.keyboard("x");
    expect(cell(1, 3).textContent).toBe("O");
    expect(onStateChange).not.toHaveBeenCalled();
  });

  it("cycles X, O, I and empty on each tap", async () => {
    const user = userEvent.setup();
    const { onStateChange } = renderSolver();
    const target = cell(1, 1);
    for (const [letter, symbol] of [
      ["X", "x"],
      ["O", "o"],
      ["I", "i"],
    ] as const) {
      await user.click(target);
      expect(target.textContent).toBe(letter);
      expect(onStateChange).toHaveBeenLastCalledWith({
        cells: [{ row: 0, col: 0, symbol }],
      });
    }
    await user.click(target);
    expect(target.textContent).toBe("");
    expect(onStateChange).toHaveBeenLastCalledWith({ cells: [] });
  });

  it("cycles with Enter and Space, and leaves a given cell alone", async () => {
    const user = userEvent.setup();
    const { onStateChange } = renderSolver();
    act(() => cell(1, 1).focus());
    await user.keyboard("{Enter}");
    expect(cell(1, 1).textContent).toBe("X");
    await user.keyboard(" ");
    expect(cell(1, 1).textContent).toBe("O");
    onStateChange.mockClear();
    act(() => cell(1, 3).focus());
    await user.keyboard("{Enter} ");
    await user.click(cell(1, 3));
    expect(cell(1, 3).textContent).toBe("O");
    expect(onStateChange).not.toHaveBeenCalled();
  });

  it("fills with the keys x, o and i and clears with Backspace", async () => {
    const user = userEvent.setup();
    const { onStateChange } = renderSolver();
    await user.click(cell(1, 1));
    await user.keyboard("{Backspace}");
    await user.keyboard("o");
    expect(cell(1, 1).textContent).toBe("O");
    await user.keyboard("i");
    expect(onStateChange).toHaveBeenLastCalledWith({
      cells: [{ row: 0, col: 0, symbol: "i" }],
    });
    await user.keyboard("{Backspace}");
    expect(onStateChange).toHaveBeenLastCalledWith({ cells: [] });
  });

  it("ignores other letters", async () => {
    const user = userEvent.setup();
    const { onStateChange } = renderSolver();
    await user.click(cell(1, 1));
    onStateChange.mockClear();
    await user.keyboard("q7");
    expect(onStateChange).not.toHaveBeenCalled();
  });

  it("marks a run of three and a line over its quota", async () => {
    const user = userEvent.setup();
    renderSolver();
    await user.click(cell(3, 1));
    await user.keyboard("o");
    await user.keyboard("{ArrowRight}o");
    expect(cell(3, 1).getAttribute("aria-label")).not.toContain("breaks a rule");
    await user.keyboard("{ArrowRight}o");
    expect(cell(3, 1).getAttribute("aria-label")).toContain("breaks a rule");
    expect(cell(3, 2).getAttribute("aria-label")).toContain("breaks a rule");
    expect(cell(3, 3).getAttribute("aria-label")).toContain("breaks a rule");
  });

  it("restores saved symbols, dropping any on a given cell", () => {
    renderSolver({
      cells: [
        { row: 0, col: 0, symbol: "x" },
        { row: 0, col: 2, symbol: "x" },
      ],
    });
    expect(cell(1, 1).textContent).toBe("X");
    expect(cell(1, 3).textContent).toBe("O");
  });

  it("registers the full grid only when every cell is filled, and asks for a check on the last one", async () => {
    const user = userEvent.setup();
    const filled = new Set(
      payload.givens.map(({ row, col }) => `${row},${col}`),
    );
    const empty = solution.filter(
      ({ row, col }) => !filled.has(`${row},${col}`),
    );
    const { registerCheck, requestCheck } = renderSolver({
      cells: empty.slice(0, -1),
    });
    const lastRegistered = () => registerCheck.mock.calls.at(-1)![0]();
    expect(lastRegistered()).toBeNull();
    const last = empty.at(-1)!;
    act(() => cell(last.row + 1, last.col + 1).focus());
    await user.keyboard(last.symbol);
    expect(lastRegistered()).toEqual({ cells: solution });
    expect(requestCheck).toHaveBeenCalledTimes(1);
  });
});
