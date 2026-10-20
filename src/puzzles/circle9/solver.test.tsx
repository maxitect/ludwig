// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { decoys, payload as fixture, solution } from "./fixture";
import type { AttemptState, Payload } from "./schema";
import { Solver } from "./solver";

afterEach(cleanup);

const payload: Payload = { numbers: [...fixture.numbers, ...decoys] };

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

describe("circle9 solver", () => {
  it("draws a 9 by 9 grid with a thick rule between boxes", () => {
    renderSolver();
    expect(screen.getAllByRole("gridcell")).toHaveLength(81);
    expect(cell(2, 0).className).toMatch(/border-b-2/);
    expect(cell(1, 0).className).not.toMatch(/border-b-2/);
  });

  it("reads each number in the cell's label", () => {
    renderSolver();
    expect(cell(0, 0).getAttribute("aria-label")).toMatch(/number 1, empty$/);
    expect(cell(0, 2).getAttribute("aria-label")).not.toMatch(/number/);
  });

  it("circles on tap and clears on a second tap, announced as circled", async () => {
    const user = userEvent.setup();
    const { onStateChange } = renderSolver();
    await user.click(cell(1, 3));
    expect(cell(1, 3).getAttribute("aria-label")).toMatch(/number 2, circled$/);
    expect(onStateChange).toHaveBeenLastCalledWith({
      circles: [{ row: 1, col: 3 }],
    });
    await user.click(cell(1, 3));
    expect(onStateChange).toHaveBeenLastCalledWith({ circles: [] });
  });

  it("does not circle an empty cell", async () => {
    const user = userEvent.setup();
    const { onStateChange } = renderSolver();
    await user.click(cell(0, 2));
    expect(onStateChange).not.toHaveBeenCalled();
    expect(cell(0, 2).getAttribute("aria-label")).toMatch(/empty/);
  });

  it("circles with Space, Enter and C from the keyboard alone", async () => {
    const user = userEvent.setup();
    const { onStateChange } = renderSolver();
    cell(0, 0).focus();
    await user.keyboard(" {ArrowDown}{ArrowRight}{ArrowRight}{ArrowRight}{Enter}");
    await user.keyboard("{ArrowDown}{ArrowRight}{ArrowRight}{ArrowRight}c");
    expect(onStateChange).toHaveBeenLastCalledWith({
      circles: [
        { row: 0, col: 0 },
        { row: 1, col: 3 },
        { row: 2, col: 6 },
      ],
    });
    await user.keyboard("{Backspace}");
    expect(cell(2, 6).getAttribute("aria-label")).toMatch(/empty/);
    await user.keyboard("{ArrowLeft}{ArrowLeft}{ArrowLeft}{Enter}{Enter}");
    expect(cell(2, 3).getAttribute("aria-label")).toMatch(/empty/);
  });

  it("marks circles that clash in digit, row, column or box", async () => {
    const user = userEvent.setup();
    renderSolver();
    await user.click(cell(0, 0));
    await user.click(cell(3, 0));
    expect(cell(0, 0).getAttribute("aria-label")).toMatch(/breaks a rule/);
    expect(cell(3, 0).getAttribute("aria-label")).toMatch(/breaks a rule/);
    await user.click(cell(3, 0));
    expect(cell(0, 0).getAttribute("aria-label")).not.toMatch(/breaks a rule/);
  });

  it("registers an answer and asks for a check when the ninth number is circled", async () => {
    const user = userEvent.setup();
    const { registerCheck, requestCheck } = renderSolver();
    expect(reader(registerCheck)()).toBeNull();
    for (const { row, col } of solution) {
      expect(requestCheck).not.toHaveBeenCalled();
      await user.click(cell(row, col));
    }
    expect(requestCheck).toHaveBeenCalledTimes(1);
    expect(reader(registerCheck)()).toEqual({ circles: solution });
    expect(screen.getByRole("status").textContent).toMatch(/9 of 9 numbers/);
  });

  it("restores saved circles and drops any on an empty cell", () => {
    renderSolver({
      circles: [
        { row: 4, col: 4 },
        { row: 0, col: 2 },
      ],
    });
    expect(cell(4, 4).getAttribute("aria-label")).toMatch(/circled$/);
    expect(screen.getByRole("status").textContent).toMatch(/1 of 9 numbers/);
  });

  it("does not change once solved", async () => {
    const user = userEvent.setup();
    const { onStateChange } = renderSolver(null, { solved: true });
    await user.click(cell(0, 0));
    expect(onStateChange).not.toHaveBeenCalled();
  });

  it("frames the circles a failed check named", () => {
    renderSolver(
      { circles: [{ row: 0, col: 0 }] },
      { wrongParts: [{ row: 0, col: 0 }] },
    );
    expect(cell(0, 0).getAttribute("aria-label")).toMatch(/breaks a rule/);
  });
});
