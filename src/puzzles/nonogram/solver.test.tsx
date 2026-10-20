// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { AttemptState, Payload } from "./schema";
import { Solver } from "./solver";

afterEach(cleanup);

/** The picture is a plus sign: ..#.. / ..#.. / ##### / ..#.. / ..#.. */
const payload: Payload = {
  rows: 5,
  cols: 5,
  rowClues: [[1], [1], [5], [1], [1]],
  colClues: [[1], [1], [5], [1], [1]],
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

const plus = [
  ...[0, 1, 3, 4].map((row) => ({ row, col: 2, mark: "fill" as const })),
  ...[0, 1, 2, 3, 4].map((col) => ({ row: 2, col, mark: "fill" as const })),
];

describe("nonogram solver", () => {
  it("draws every clue, with zero for an empty line", () => {
    renderSolver();
    expect(screen.getAllByRole("gridcell")).toHaveLength(25);
    expect(screen.getAllByRole("columnheader")).toHaveLength(5);
    expect(screen.getAllByRole("rowheader")).toHaveLength(5);
    expect(screen.getByLabelText("Row 3, clue 5")).toBeTruthy();
  });

  it("names both clues on every cell, so each line's clue is read when it is focused", () => {
    renderSolver();
    expect(cell(2, 0).getAttribute("aria-label")).toBe(
      "Row 3, column 1, row clue 5, column clue 1, empty",
    );
    expect(cell(0, 2).getAttribute("aria-label")).toBe(
      "Row 1, column 3, row clue 1, column clue 5, empty",
    );
  });

  it("cycles a cell through fill, cross and empty on tap", async () => {
    const user = userEvent.setup();
    const { onStateChange } = renderSolver();
    await user.click(cell(1, 1));
    expect(cell(1, 1).getAttribute("aria-label")).toMatch(/fill$/);
    expect(onStateChange).toHaveBeenLastCalledWith({
      marks: [{ row: 1, col: 1, mark: "fill" }],
    });
    await user.click(cell(1, 1));
    expect(cell(1, 1).getAttribute("aria-label")).toMatch(/cross$/);
    await user.click(cell(1, 1));
    expect(cell(1, 1).getAttribute("aria-label")).toMatch(/empty$/);
    expect(onStateChange).toHaveBeenLastCalledWith({ marks: [] });
  });

  it("fills with Space, crosses with x, clears with Backspace and moves with the arrows", async () => {
    const user = userEvent.setup();
    renderSolver();
    await user.tab();
    await user.keyboard(" ");
    expect(cell(0, 0).getAttribute("aria-label")).toMatch(/fill$/);
    await user.keyboard(" ");
    expect(cell(0, 0).getAttribute("aria-label")).toMatch(/empty$/);
    await user.keyboard("x");
    expect(cell(0, 0).getAttribute("aria-label")).toMatch(/cross$/);
    await user.keyboard("{Backspace}");
    expect(cell(0, 0).getAttribute("aria-label")).toMatch(/empty$/);
    await user.keyboard("{ArrowRight}{ArrowDown} ");
    expect(document.activeElement).toBe(cell(1, 1));
    expect(cell(1, 1).getAttribute("aria-label")).toMatch(/fill$/);
    await user.keyboard("{Enter}");
    expect(cell(1, 1).getAttribute("aria-label")).toMatch(/cross$/);
  });

  function dragThrough(...targets: HTMLElement[]) {
    document.elementFromPoint = vi.fn();
    fireEvent.pointerDown(targets[0], { pointerId: 1, button: 0 });
    for (const target of targets.slice(1)) {
      vi.mocked(document.elementFromPoint).mockReturnValueOnce(target);
      fireEvent.pointerMove(screen.getByRole("grid"), { pointerId: 1 });
    }
    fireEvent.pointerUp(screen.getByRole("grid"), { pointerId: 1 });
  }

  const filledRow = (row: number, cols: number[]) =>
    cols.map((col) => ({ row, col, mark: "fill" }));

  it("paints a run when dragged along a row, and keeps a stray cell on that row", () => {
    const { onStateChange } = renderSolver();
    dragThrough(cell(2, 0), cell(2, 1), cell(3, 2), cell(2, 3));
    expect(onStateChange).toHaveBeenLastCalledWith({
      marks: filledRow(2, [0, 1, 2, 3]),
    });
  });

  it("fills the cells a fast drag skips over", () => {
    const { onStateChange } = renderSolver();
    dragThrough(cell(2, 4), cell(2, 0));
    expect(onStateChange).toHaveBeenLastCalledWith({
      marks: filledRow(2, [0, 1, 2, 3, 4]),
    });
    expect(onStateChange).toHaveBeenCalledTimes(2);
  });

  it("follows a column when the drag leaves mostly downwards", () => {
    const { onStateChange } = renderSolver();
    dragThrough(cell(0, 2), cell(3, 3));
    expect(onStateChange).toHaveBeenLastCalledWith({
      marks: [0, 1, 2, 3].map((row) => ({ row, col: 2, mark: "fill" })),
    });
  });

  it("greys a clue out once its line is satisfied", async () => {
    const user = userEvent.setup();
    renderSolver();
    const row3 = () => screen.getByLabelText(/^Row 3, clue 5/);
    expect(row3().getAttribute("data-satisfied")).toBe("false");
    for (let col = 0; col < 5; col++) await user.click(cell(2, col));
    expect(row3().getAttribute("data-satisfied")).toBe("true");
    expect(row3().getAttribute("aria-label")).toMatch(/complete$/);
    expect(screen.getByLabelText(/^Column 1, clue 1/).getAttribute("data-satisfied")).toBe(
      "true",
    );
  });

  it("restores saved marks and offers no answer until every clue is met", () => {
    const { registerCheck } = renderSolver({
      marks: [
        { row: 2, col: 0, mark: "fill" },
        { row: 0, col: 0, mark: "cross" },
      ],
    });
    expect(cell(2, 0).getAttribute("aria-label")).toMatch(/fill$/);
    expect(cell(0, 0).getAttribute("aria-label")).toMatch(/cross$/);
    expect(reader(registerCheck)()).toBeNull();
  });

  it("returns the shaded cells and asks for a check when the last clue is met", async () => {
    const user = userEvent.setup();
    const { registerCheck, requestCheck } = renderSolver({
      marks: plus.slice(0, -1),
    });
    expect(requestCheck).not.toHaveBeenCalled();
    await user.click(cell(2, 4));
    expect(requestCheck).toHaveBeenCalled();
    const answer = reader(registerCheck)() as { shaded: unknown[] };
    expect(answer.shaded).toHaveLength(9);
  });

  it("ignores crosses when reading the answer", async () => {
    const user = userEvent.setup();
    const { registerCheck } = renderSolver({ marks: plus });
    await user.click(cell(0, 0));
    await user.click(cell(0, 0));
    expect(cell(0, 0).getAttribute("aria-label")).toMatch(/cross$/);
    expect((reader(registerCheck)() as { shaded: unknown[] }).shaded).toHaveLength(9);
  });

  it("locks the grid once solved and shows the picture without crosses", async () => {
    const user = userEvent.setup();
    const { onStateChange } = renderSolver({ marks: plus }, { solved: true });
    onStateChange.mockClear();
    await user.click(cell(0, 0));
    expect(onStateChange).not.toHaveBeenCalled();
    expect(screen.getByRole("grid").getAttribute("data-solved")).toBe("true");
  });
});
