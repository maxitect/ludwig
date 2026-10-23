// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { payload } from "./fixture";
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

describe("kakuro Solver", () => {
  it("announces the across and down sums of a white cell and of a clue cell", () => {
    renderSolver();
    expect(cell(2, 2).getAttribute("aria-label")).toBe(
      "Row 2, column 2, across 4 over 2 cells, down 3 over 2 cells, empty",
    );
    expect(cell(1, 2).getAttribute("aria-label")).toBe(
      "Row 1, column 2, block, down 3 over 2 cells",
    );
  });

  it("reports typed digits and ignores 0", async () => {
    const user = userEvent.setup();
    const { onStateChange } = renderSolver();
    await user.click(cell(2, 2));
    await user.keyboard("0");
    expect(onStateChange).not.toHaveBeenCalled();
    await user.keyboard("1");
    expect(onStateChange).toHaveBeenLastCalledWith({
      cells: [{ row: 1, col: 1, digit: 1 }],
    });
  });

  it("marks a full run that does not add up and clears the mark on edit", async () => {
    const user = userEvent.setup();
    renderSolver();
    await user.click(cell(2, 2));
    await user.keyboard("2");
    await user.keyboard("2");
    expect(cell(2, 2).getAttribute("aria-label")).toMatch(/breaks a rule$/);
    expect(cell(2, 3).getAttribute("aria-label")).toMatch(/breaks a rule$/);
    await user.click(cell(2, 3));
    await user.keyboard("{Backspace}");
    expect(cell(2, 2).getAttribute("aria-label")).not.toMatch(/breaks a rule/);
  });

  it("registers its answer only once every white cell is filled, then asks for a check", async () => {
    const user = userEvent.setup();
    const { registerCheck, requestCheck } = renderSolver();
    const latest = () => registerCheck.mock.lastCall![0]();
    expect(latest()).toBeNull();
    await user.click(cell(2, 2));
    await user.keyboard("1");
    await user.keyboard("3");
    await user.click(cell(3, 2));
    await user.keyboard("2");
    await user.keyboard("1");
    expect(latest()).toEqual({
      cells: [
        { row: 1, col: 1, digit: 1 },
        { row: 1, col: 2, digit: 3 },
        { row: 2, col: 1, digit: 2 },
        { row: 2, col: 2, digit: 1 },
      ],
    });
    expect(requestCheck).toHaveBeenCalled();
  });

  it("lists the digit sets a sum allows when combinations are on", async () => {
    const user = userEvent.setup();
    renderSolver();
    await user.click(cell(2, 2));
    expect(screen.queryByText(/1\+3/)).toBeNull();
    await user.click(screen.getAllByRole("button", { name: "Combinations" })[0]);
    expect(screen.getByText(/1\+3/)).toBeTruthy();
  });

  it("restores saved digits", () => {
    renderSolver({ cells: [{ row: 1, col: 1, digit: 3 }] });
    expect(cell(2, 2).textContent).toContain("3");
  });
});
