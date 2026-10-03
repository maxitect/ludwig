// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { fixture } from "./fixture";
import type { Payload } from "./schema";
import { Solver } from "./solver";

afterEach(cleanup);

const payload: Payload = {
  style: fixture.style,
  rows: fixture.rows,
  cols: fixture.cols,
  cells: fixture.cells.map(({ row, col }) => ({ row, col })),
  clues: fixture.clues,
};

function renderSolver(overrides: Partial<Parameters<typeof Solver>[0]> = {}) {
  const onStateChange = vi.fn();
  const registerCheck = vi.fn();
  render(
    <Solver
      payload={payload}
      initialState={null}
      onStateChange={onStateChange}
      registerCheck={registerCheck}
      {...overrides}
    />,
  );
  return { onStateChange, registerCheck };
}

const cell = (row: number, col: number) =>
  screen.getByRole("gridcell", { name: new RegExp(`^Row ${row}, column ${col}\\b`) });

describe("crossword Solver", () => {
  it("numbers the clue starts and lists the clues with enumerations", () => {
    renderSolver();
    expect(cell(1, 1).getAttribute("aria-label")).toMatch(/clue 1/);
    expect(cell(1, 3).getAttribute("aria-label")).toMatch(/clue 2/);
    const across = screen.getByRole("region", { name: "across clues" });
    expect(across.textContent).toContain("Remains of a fire (5)");
  });

  it("focuses a clue's first cell and types down its run", async () => {
    const user = userEvent.setup();
    const { onStateChange } = renderSolver();
    await user.click(screen.getByRole("button", { name: /Unlikely sequence of letters/ }));
    await user.keyboard("ARH");
    expect(cell(1, 3).textContent).toContain("A");
    expect(cell(2, 3).textContent).toContain("R");
    expect(cell(3, 3).textContent).toContain("H");
    expect(onStateChange).toHaveBeenLastCalledWith({
      cells: [
        { row: 0, col: 2, letter: "A" },
        { row: 1, col: 2, letter: "R" },
        { row: 2, col: 2, letter: "H" },
      ],
    });
  });

  it("highlights the active clue and marks it current", async () => {
    const user = userEvent.setup();
    renderSolver();
    await user.click(screen.getByRole("button", { name: /Grip tightly/ }));
    expect(
      screen.getByRole("button", { name: /Grip tightly/ }).getAttribute("aria-current"),
    ).toBe("true");
    const highlighted = screen
      .getAllByRole("gridcell")
      .filter((node) => node.className.includes("bg-paper-deep"));
    expect(highlighted).toHaveLength(5);
  });

  it("offers an answer only once every cell is filled", async () => {
    const user = userEvent.setup();
    const { registerCheck } = renderSolver({
      initialState: { cells: fixture.cells.slice(1) },
    });
    const read = () => registerCheck.mock.lastCall?.[0]();
    expect(read()).toBeNull();
    await user.click(cell(1, 1));
    await user.keyboard("C");
    expect(read()).toEqual({ cells: fixture.cells });
  });

  it("checks and reveals the active cell through the chrome callbacks", async () => {
    const user = userEvent.setup();
    const checkCell = vi.fn().mockResolvedValue(false);
    const revealCell = vi.fn().mockResolvedValue("C");
    renderSolver({ checkCell, revealCell });
    expect(screen.getByRole("button", { name: "Check cell" })).toHaveProperty(
      "disabled",
      true,
    );
    await user.click(cell(1, 1));
    await user.keyboard("X");
    await user.click(cell(1, 1));
    await user.click(screen.getByRole("button", { name: "Check cell" }));
    expect(checkCell).toHaveBeenCalledWith(0, 0, "X");
    expect((await screen.findByRole("status")).textContent).toMatch(/not right/);

    await user.click(screen.getByRole("button", { name: "Reveal cell" }));
    expect(revealCell).toHaveBeenCalledWith(0, 0);
    expect(cell(1, 1).textContent).toContain("C");
  });
});
