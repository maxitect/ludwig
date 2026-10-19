// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { AttemptState, Payload } from "./schema";
import { Solver } from "./solver";

afterEach(cleanup);

const payload: Payload = {
  size: 5,
  stars: 1,
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

describe("star battle solver", () => {
  it("draws a thick rule between regions", () => {
    renderSolver();
    expect(screen.getAllByRole("gridcell")).toHaveLength(25);
    expect(cell(0, 0).className).toMatch(/border-b-2/);
    expect(cell(4, 0).className).not.toMatch(/border-b-2/);
  });

  it("cycles a cell through dot, star and empty on tap", async () => {
    const user = userEvent.setup();
    const { onStateChange } = renderSolver();
    await user.click(cell(1, 1));
    expect(cell(1, 1).getAttribute("aria-label")).toMatch(/dot/);
    expect(onStateChange).toHaveBeenLastCalledWith({
      marks: [{ row: 1, col: 1, mark: "dot" }],
    });
    await user.click(cell(1, 1));
    expect(onStateChange).toHaveBeenLastCalledWith({
      marks: [{ row: 1, col: 1, mark: "star" }],
    });
    await user.click(cell(1, 1));
    expect(onStateChange).toHaveBeenLastCalledWith({ marks: [] });
  });

  it("places stars and dots from the keyboard alone", async () => {
    const user = userEvent.setup();
    const { onStateChange } = renderSolver();
    cell(0, 0).focus();
    await user.keyboard("s{ArrowDown}{ArrowDown}.{ArrowRight}s");
    expect(onStateChange).toHaveBeenLastCalledWith({
      marks: [
        { row: 0, col: 0, mark: "star" },
        { row: 2, col: 0, mark: "dot" },
        { row: 2, col: 1, mark: "star" },
      ],
    });
    await user.keyboard("{Backspace}");
    expect(cell(2, 1).getAttribute("aria-label")).toMatch(/empty/);
    await user.keyboard("{ArrowLeft}.");
    expect(cell(2, 0).getAttribute("aria-label")).toMatch(/empty/);
  });

  it("marks a star that touches another, and one that overfills a unit", async () => {
    const user = userEvent.setup();
    renderSolver();
    cell(0, 0).focus();
    await user.keyboard("s{ArrowDown}{ArrowRight}s");
    expect(cell(0, 0).getAttribute("aria-label")).toMatch(/breaks a rule/);
    expect(cell(1, 1).getAttribute("aria-label")).toMatch(/breaks a rule/);
    await user.keyboard("{Backspace}{ArrowUp}{ArrowRight}s");
    expect(cell(0, 0).getAttribute("aria-label")).toMatch(/breaks a rule/);
    expect(cell(0, 2).getAttribute("aria-label")).toMatch(/breaks a rule/);
  });

  it("registers an answer and asks for a check when the last star is placed", async () => {
    const user = userEvent.setup();
    const { registerCheck, requestCheck } = renderSolver();
    expect(reader(registerCheck)()).toBeNull();
    const columns = [1, 3, 0, 2, 4];
    for (const [row, col] of columns.entries()) {
      expect(requestCheck).not.toHaveBeenCalled();
      await user.click(cell(row, col));
      await user.click(cell(row, col));
    }
    expect(requestCheck).toHaveBeenCalledTimes(1);
    expect(reader(registerCheck)()).toEqual({
      stars: columns.map((col, row) => ({ row, col })),
    });
  });

  it("restores saved marks and drops any outside the grid", () => {
    renderSolver({
      marks: [
        { row: 2, col: 3, mark: "star" },
        { row: 7, col: 0, mark: "dot" },
      ],
    });
    expect(cell(2, 3).getAttribute("aria-label")).toMatch(/star/);
    expect(screen.getByRole("status").textContent).toMatch(/1 of 5 stars/);
  });

  it("does not change once solved", async () => {
    const user = userEvent.setup();
    const { onStateChange } = renderSolver(null, { solved: true });
    await user.click(cell(0, 0));
    expect(onStateChange).not.toHaveBeenCalled();
  });

  it("frames the stars a failed check named", () => {
    renderSolver(
      { marks: [{ row: 0, col: 0, mark: "star" }] },
      { wrongParts: [{ row: 0, col: 0 }] },
    );
    expect(cell(0, 0).getAttribute("aria-label")).toMatch(/breaks a rule/);
  });
});
