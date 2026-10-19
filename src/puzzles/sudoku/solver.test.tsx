// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { content as cageMatch } from "../../../content/sudoku/cage-match";
import { content as romanNumerals } from "../../../content/sudoku/roman-numerals";
import { givens, solution } from "./fixture";
import { payloadSchema, type AttemptState, type Payload } from "./schema";
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
  it("names each wrong cell in its accessible name", () => {
    render(
      <Solver
        payload={{ givens }}
        initialState={null}
        onStateChange={vi.fn()}
        registerCheck={vi.fn()}
        wrongParts={[{ row: 2, col: 3 }]}
      />,
    );
    expect(cell(3, 4).getAttribute("aria-label")).toBe(
      "Row 3, column 4, empty, breaks a rule",
    );
    expect(cell(3, 5).getAttribute("aria-label")).not.toContain("breaks");
  });

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

describe("sudoku Solver killer and XV variants", () => {
  const renderPayload = (payload: Payload) =>
    render(
      <Solver
        payload={payload}
        initialState={null}
        onStateChange={vi.fn()}
        registerCheck={vi.fn()}
      />,
    );

  it("names the grid for its variant", () => {
    renderPayload(payloadSchema.parse(cageMatch));
    expect(screen.getByRole("grid", { name: "Killer sudoku" })).toBeTruthy();
    cleanup();
    renderPayload(payloadSchema.parse(romanNumerals));
    expect(screen.getByRole("grid", { name: "XV sudoku" })).toBeTruthy();
  });

  it("announces each cage with its sum, and its other cells with the cage", () => {
    renderPayload(payloadSchema.parse(cageMatch));
    const { sum, cells } = cageMatch.cages.find(
      ({ cells }) => cells.length > 1,
    )!;
    const [first, ...others] = [...cells].sort(
      (a, b) => a.row * 9 + a.col - (b.row * 9 + b.col),
    );
    const anchor = cell(first.row + 1, first.col + 1);
    expect(anchor.getAttribute("aria-label")).toContain(
      `cage of ${cells.length} cells adding up to ${sum}`,
    );
    expect(anchor.textContent).toContain(String(sum));
    for (const { row, col } of others) {
      expect(cell(row + 1, col + 1).getAttribute("aria-label")).toContain(
        `in the cage adding up to ${sum} from row ${first.row + 1}, column ${first.col + 1}`,
      );
    }
  });

  it("outlines every cage cell with a dashed border", () => {
    const { container } = renderPayload(payloadSchema.parse(cageMatch));
    expect(container.querySelectorAll(".border-dashed").length).toBe(81);
  });

  it("reads each X and V out with both cells it sits between", () => {
    renderPayload(payloadSchema.parse(romanNumerals));
    const { marks } = romanNumerals.xv;
    const x = marks.find(
      ({ direction, mark }) => direction === "right" && mark === "x",
    )!;
    const v = marks.find(
      ({ direction, mark }) => direction === "down" && mark === "v",
    )!;
    const label = (row: number, col: number) =>
      cell(row + 1, col + 1).getAttribute("aria-label");
    expect(label(x.row, x.col)).toContain(
      "adds up to 10 with the cell to the right",
    );
    expect(label(x.row, x.col + 1)).toContain(
      "adds up to 10 with the cell to the left",
    );
    expect(label(v.row, v.col)).toContain("adds up to 5 with the cell below");
    expect(label(v.row + 1, v.col)).toContain(
      "adds up to 5 with the cell above",
    );
  });
});
