// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { AttemptState, Payload } from "./schema";
import { Solver } from "./solver";

afterEach(cleanup);

const payload: Payload = {
  rows: 5,
  cols: 5,
  regions: Array.from({ length: 25 }, (_, i) => ({
    row: Math.floor(i / 5),
    col: i % 5,
    region: Math.floor(i / 5),
  })),
};

function renderSolver(
  initialState: AttemptState | null = null,
  extra: Partial<Parameters<typeof Solver>[0]> = {},
) {
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
      {...extra}
    />,
  );
  return { onStateChange, registerCheck, requestCheck };
}

const cell = (row: number, col: number) =>
  screen.getByRole("gridcell", {
    name: new RegExp(`^Row ${row + 1}, column ${col + 1},`),
  });
const reader = (registerCheck: ReturnType<typeof vi.fn>) =>
  registerCheck.mock.calls.at(-1)?.[0] as () => unknown;

describe("norinori solver", () => {
  it("draws a thick rule between regions", () => {
    renderSolver();
    expect(screen.getAllByRole("gridcell")).toHaveLength(25);
    expect(cell(0, 0).className).toMatch(/border-b-2/);
    expect(cell(4, 0).className).not.toMatch(/border-b-2/);
  });

  it("cycles a cell through shade, dot and empty on tap", async () => {
    const user = userEvent.setup();
    const { onStateChange } = renderSolver();
    await user.click(cell(1, 1));
    expect(cell(1, 1).getAttribute("aria-label")).toMatch(/shade/);
    expect(onStateChange).toHaveBeenLastCalledWith({
      marks: [{ row: 1, col: 1, mark: "shade" }],
    });
    await user.click(cell(1, 1));
    expect(onStateChange).toHaveBeenLastCalledWith({
      marks: [{ row: 1, col: 1, mark: "dot" }],
    });
    await user.click(cell(1, 1));
    expect(onStateChange).toHaveBeenLastCalledWith({ marks: [] });
  });

  it("shades and dots from the keyboard alone", async () => {
    const user = userEvent.setup();
    const { onStateChange } = renderSolver();
    cell(0, 0).focus();
    await user.keyboard("s{ArrowDown}{ArrowDown}.{ArrowRight}s");
    expect(onStateChange).toHaveBeenLastCalledWith({
      marks: [
        { row: 0, col: 0, mark: "shade" },
        { row: 2, col: 0, mark: "dot" },
        { row: 2, col: 1, mark: "shade" },
      ],
    });
    await user.keyboard("{Backspace}");
    expect(cell(2, 1).getAttribute("aria-label")).toMatch(/empty/);
    await user.keyboard("{ArrowLeft}.");
    expect(cell(2, 0).getAttribute("aria-label")).toMatch(/empty/);
  });

  it("cycles with Enter", async () => {
    const user = userEvent.setup();
    renderSolver();
    cell(0, 0).focus();
    await user.keyboard("{Enter}");
    expect(cell(0, 0).getAttribute("aria-label")).toMatch(/shade/);
    await user.keyboard("{Enter}");
    expect(cell(0, 0).getAttribute("aria-label")).toMatch(/dot/);
  });

  it("marks a cell with two shaded neighbours, and a region holding three", async () => {
    const user = userEvent.setup();
    renderSolver();
    cell(0, 0).focus();
    await user.keyboard("s{ArrowRight}s{ArrowDown}s");
    expect(cell(0, 1).getAttribute("aria-label")).toMatch(/breaks a rule/);
    expect(cell(0, 0).getAttribute("aria-label")).not.toMatch(/breaks a rule/);
    await user.keyboard("{Backspace}{ArrowUp}{ArrowRight}s");
    expect(cell(0, 0).getAttribute("aria-label")).toMatch(/breaks a rule/);
    expect(cell(0, 2).getAttribute("aria-label")).toMatch(/breaks a rule/);
  });

  it("registers an answer and asks for a check when the last cell is shaded", async () => {
    const user = userEvent.setup();
    const { registerCheck, requestCheck } = renderSolver();
    expect(reader(registerCheck)()).toBeNull();
    const placed: { row: number; col: number }[] = [];
    for (let row = 0; row < 5; row++) {
      for (const col of [0, 3]) {
        expect(requestCheck).not.toHaveBeenCalled();
        await user.click(cell(row, col));
        placed.push({ row, col });
      }
    }
    expect(requestCheck).toHaveBeenCalledTimes(1);
    expect(reader(registerCheck)()).toEqual({ shaded: placed });
  });

  it("restores saved marks and drops any outside the grid", () => {
    renderSolver({
      marks: [
        { row: 2, col: 3, mark: "shade" },
        { row: 7, col: 0, mark: "dot" },
      ],
    });
    expect(cell(2, 3).getAttribute("aria-label")).toMatch(/shade/);
    expect(screen.getByRole("status").textContent).toMatch(/1 of 10 cells/);
  });

  it("does not change once solved", async () => {
    const user = userEvent.setup();
    const { onStateChange } = renderSolver(null, { solved: true });
    await user.click(cell(0, 0));
    expect(onStateChange).not.toHaveBeenCalled();
  });

  it("frames the cells a failed check named", () => {
    renderSolver(
      { marks: [{ row: 0, col: 0, mark: "shade" }] },
      { wrongParts: [{ row: 0, col: 0 }] },
    );
    expect(cell(0, 0).getAttribute("aria-label")).toMatch(/breaks a rule/);
  });
});
