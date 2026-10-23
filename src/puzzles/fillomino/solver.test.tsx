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

describe("fillomino Solver", () => {
  it("reports typed digits and ignores 0", async () => {
    const user = userEvent.setup();
    const { onStateChange } = renderSolver();
    await user.click(cell(1, 1));
    await user.keyboard("0");
    expect(onStateChange).not.toHaveBeenCalled();
    await user.keyboard("4");
    expect(onStateChange).toHaveBeenLastCalledWith({
      cells: [{ row: 0, col: 0, digit: 4 }],
    });
  });

  it("does not overwrite a given", async () => {
    const user = userEvent.setup();
    const { onStateChange } = renderSolver();
    await user.click(cell(1, 4));
    await user.keyboard("2");
    expect(onStateChange).not.toHaveBeenCalled();
  });

  it("marks an area that is too big and clears the mark on edit", async () => {
    const user = userEvent.setup();
    renderSolver();
    await user.click(cell(1, 1));
    await user.keyboard("1");
    await user.click(cell(1, 2));
    await user.keyboard("1");
    expect(cell(1, 1).getAttribute("aria-label")).toMatch(/breaks a rule/);
    await user.click(cell(1, 2));
    await user.keyboard("{Backspace}");
    expect(cell(1, 1).getAttribute("aria-label")).not.toMatch(/breaks a rule/);
  });

  it("restores saved digits", () => {
    renderSolver({ cells: [{ row: 0, col: 0, digit: 6 }] });
    expect(cell(1, 1).getAttribute("aria-label")).toMatch(/6/);
  });
});
