// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { payload, track } from "./fixture";
import type { AttemptState } from "./schema";
import { Solver } from "./solver";

afterEach(cleanup);

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
    name: new RegExp(`^Row ${row + 1}, column ${col + 1}(,|$)`),
  });
const reader = (registerCheck: ReturnType<typeof vi.fn>) =>
  registerCheck.mock.calls.at(-1)?.[0] as () => unknown;

const laid: AttemptState = {
  pieces: track.filter(({ row, col }) => row !== 1 && !(row === 3 && col === 3)),
  crosses: [],
};

describe("railroad solver", () => {
  it("draws the grid with a count on every row and column", () => {
    renderSolver();
    expect(screen.getAllByRole("gridcell")).toHaveLength(16);
    expect(
      screen.getByRole("rowheader", { name: /^Row 1, count 3, 0 laid/ }),
    ).toBeTruthy();
    expect(
      screen.getByRole("columnheader", { name: /^Column 3, count 3/ }),
    ).toBeTruthy();
  });

  it("marks the entry and exit by shape and by name, and the given piece as given", () => {
    renderSolver();
    expect(cell(0, 0).getAttribute("aria-label")).toMatch(
      /entry light on the left side/,
    );
    expect(cell(3, 3).getAttribute("aria-label")).toMatch(
      /exit light on the right side/,
    );
    expect(cell(1, 2).getAttribute("aria-label")).toMatch(
      /given, track straight up and down/,
    );
    expect(cell(0, 0).querySelector("circle")).not.toBeNull();
    expect(cell(3, 3).querySelector("rect.fill-ludwig-red")).not.toBeNull();
  });

  it("lays a piece with the number keys and clears it with Backspace", async () => {
    const user = userEvent.setup();
    const { onStateChange } = renderSolver();
    await user.click(cell(0, 1));
    await user.keyboard("2");
    expect(cell(0, 1).getAttribute("aria-label")).toMatch(
      /track straight left and right$/,
    );
    expect(onStateChange).toHaveBeenLastCalledWith({
      pieces: [{ row: 0, col: 1, piece: "ew" }],
      crosses: [],
    });
    await user.keyboard("{Backspace}");
    expect(onStateChange).toHaveBeenLastCalledWith({ pieces: [], crosses: [] });
  });

  it("crosses a cell with x and moves with the arrows", async () => {
    const user = userEvent.setup();
    const { onStateChange } = renderSolver();
    await user.tab();
    await user.keyboard("{ArrowRight}{ArrowDown}x");
    expect(cell(1, 1).getAttribute("aria-label")).toMatch(/crossed$/);
    expect(onStateChange).toHaveBeenLastCalledWith({
      pieces: [],
      crosses: [{ row: 1, col: 1 }],
    });
  });

  it("cycles empty, the six pieces, a cross and empty on a tap", async () => {
    const user = userEvent.setup();
    renderSolver();
    const labels = [];
    for (let i = 0; i < 8; i++) {
      await user.click(cell(3, 0));
      labels.push(cell(3, 0).getAttribute("aria-label")?.split(", ").at(-1));
    }
    expect(labels).toEqual([
      "track straight up and down",
      "track straight left and right",
      "track curving up and right",
      "track curving up and left",
      "track curving down and right",
      "track curving down and left",
      "crossed",
      "empty",
    ]);
  });

  it("leaves a given piece alone", async () => {
    const user = userEvent.setup();
    const { onStateChange } = renderSolver();
    await user.click(cell(1, 2));
    await user.keyboard("2x{Backspace}");
    expect(onStateChange).not.toHaveBeenCalled();
    expect(cell(1, 2).getAttribute("aria-label")).toMatch(/straight up and down/);
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

  it("infers the pieces from a drag, curving at the corners and at the lights", () => {
    const { onStateChange } = renderSolver();
    dragThrough(cell(0, 0), cell(0, 1), cell(0, 2), cell(1, 2), cell(2, 2));
    expect(onStateChange).toHaveBeenLastCalledWith({
      pieces: [
        { row: 0, col: 0, piece: "ew" },
        { row: 0, col: 1, piece: "ew" },
        { row: 0, col: 2, piece: "sw" },
        { row: 2, col: 2, piece: "ns" },
      ],
      crosses: [],
    });
  });

  it("drops the last cell of a drag that backs up", () => {
    const { onStateChange } = renderSolver();
    dragThrough(cell(0, 0), cell(0, 1), cell(0, 2), cell(0, 1));
    expect(onStateChange).toHaveBeenLastCalledWith({
      pieces: [
        { row: 0, col: 0, piece: "ew" },
        { row: 0, col: 1, piece: "ew" },
      ],
      crosses: [],
    });
  });

  it("turns a count red and marks it over, never by colour alone", async () => {
    const user = userEvent.setup();
    renderSolver();
    for (const col of [0, 1]) {
      await user.click(cell(1, col));
      await user.keyboard("2");
    }
    const header = screen.getByRole("rowheader", { name: /^Row 2/ });
    expect(header.getAttribute("aria-label")).toMatch(/count 1, 3 laid, over$/);
    expect(header.getAttribute("data-state")).toBe("over");
    expect(header.textContent).toContain("!");
  });

  it("offers the answer, given piece included, only once every count is met", async () => {
    const user = userEvent.setup();
    const { registerCheck, requestCheck } = renderSolver(laid);
    expect(reader(registerCheck)()).toBeNull();
    await user.click(cell(3, 3));
    await user.keyboard("{Backspace}");
    expect(reader(registerCheck)()).toBeNull();
    await user.keyboard("3");
    const answer = reader(registerCheck)() as { pieces: unknown[] };
    expect(answer.pieces).toHaveLength(7);
    expect(answer.pieces).toContainEqual({ row: 1, col: 2, piece: "ns" });
    expect(requestCheck).toHaveBeenCalled();
  });

  it("restores saved pieces and crosses", () => {
    renderSolver({ pieces: [{ row: 0, col: 1, piece: "ew" }], crosses: [{ row: 3, col: 0 }] });
    expect(cell(0, 1).getAttribute("aria-label")).toMatch(/straight left and right$/);
    expect(cell(3, 0).getAttribute("aria-label")).toMatch(/crossed$/);
  });

  it("frames the cells a failed check names and says so", () => {
    renderSolver(null, { wrongParts: [{ row: 2, col: 0 }] });
    expect(cell(2, 0).getAttribute("aria-label")).toMatch(/breaks a rule$/);
    expect(cell(2, 0).querySelector(".border-dashed")).not.toBeNull();
  });

  it("takes no edits once solved", async () => {
    const user = userEvent.setup();
    const { onStateChange } = renderSolver(laid, { solved: true });
    await user.click(cell(3, 0));
    await user.keyboard("2");
    expect(onStateChange).not.toHaveBeenCalled();
  });
});
