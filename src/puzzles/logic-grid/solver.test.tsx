// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { classic, itemId, payloadOf, variant } from "./fixture";
import type { AttemptState } from "./schema";
import { Solver } from "./solver";

afterEach(cleanup);

function renderSolver(
  content = classic,
  initialState: AttemptState | null = null,
) {
  const onStateChange = vi.fn();
  const registerCheck = vi.fn();
  render(
    <Solver
      payload={payloadOf(content)}
      initialState={initialState}
      onStateChange={onStateChange}
      registerCheck={registerCheck}
    />,
  );
  const read = () =>
    registerCheck.mock.calls[registerCheck.mock.calls.length - 1][0]();
  return { onStateChange, registerCheck, read };
}

const cell = (name: string) => screen.getByRole("gridcell", { name });

const yes = (a: [number, number], b: [number, number]) => ({
  itemAId: itemId(...a),
  itemBId: itemId(...b),
  mark: "yes" as const,
});

const households = [
  yes([0, 0], [1, 0]),
  yes([0, 0], [2, 0]),
  yes([0, 1], [1, 1]),
  yes([0, 1], [2, 1]),
  yes([0, 2], [1, 2]),
  yes([0, 2], [2, 2]),
];

describe("logic grid Solver", () => {
  it("draws the staircase: 3 categories of 3 make 27 cells, each named by its pair and mark", () => {
    renderSolver();
    expect(screen.getAllByRole("gridcell")).toHaveLength(27);
    expect(cell("Ann × Dog: blank")).toBeTruthy();
    expect(cell("Dog × Red: blank")).toBeTruthy();
    expect(cell("Cat × Green: blank")).toBeTruthy();
    expect(screen.queryByRole("gridcell", { name: /^Dog × Eel/ })).toBeNull();
  });

  it("cycles a clicked cell through no, yes and blank", async () => {
    const user = userEvent.setup();
    const { onStateChange } = renderSolver();
    await user.click(cell("Ann × Dog: blank"));
    expect(cell("Ann × Dog: no")).toBeTruthy();
    await user.click(cell("Ann × Dog: no"));
    expect(cell("Ann × Dog: yes")).toBeTruthy();
    expect(onStateChange).toHaveBeenLastCalledWith({
      marks: [yes([0, 0], [1, 0])],
      struckClues: [],
      falseCluePosition: null,
    });
    await user.click(cell("Ann × Dog: yes"));
    expect(cell("Ann × Dog: blank")).toBeTruthy();
    expect(onStateChange).toHaveBeenLastCalledWith({
      marks: [],
      struckClues: [],
      falseCluePosition: null,
    });
  });

  it("moves with the arrow keys, stopping at the edge of the staircase, and cycles with Space", async () => {
    const user = userEvent.setup();
    renderSolver();
    cell("Ann × Dog: blank").focus();
    await user.keyboard("{ArrowRight}{ArrowDown}");
    expect(document.activeElement).toBe(cell("Bob × Eel: blank"));
    await user.keyboard(" ");
    expect(cell("Bob × Eel: no")).toBeTruthy();
    await user.keyboard("{ArrowDown}{ArrowDown}{ArrowDown}");
    expect(document.activeElement).toBe(cell("Bob × Blue: blank"));
    await user.keyboard("{ArrowLeft}{ArrowLeft}{ArrowLeft}");
    expect(document.activeElement).toBe(cell("Ann × Blue: blank"));
    await user.keyboard("{ArrowUp}{ArrowUp}{ArrowUp}{ArrowUp}");
    expect(document.activeElement).toBe(cell("Ann × Dog: blank"));
    await user.keyboard("{ArrowRight}{ArrowRight}{ArrowRight}");
    expect(document.activeElement).toBe(cell("Cat × Dog: blank"));
  });

  it("clears a cell with Backspace", async () => {
    const user = userEvent.setup();
    renderSolver();
    cell("Ann × Dog: blank").focus();
    await user.keyboard("  ");
    expect(cell("Ann × Dog: yes")).toBeTruthy();
    await user.keyboard("{Backspace}");
    expect(cell("Ann × Dog: blank")).toBeTruthy();
  });

  it("strikes a clue through and remembers it", async () => {
    const user = userEvent.setup();
    const { onStateChange } = renderSolver();
    const clue = screen.getByRole("button", { name: /Cross out clue 2/ });
    expect(clue.getAttribute("aria-pressed")).toBe("false");
    await user.click(clue);
    expect(clue.getAttribute("aria-pressed")).toBe("true");
    expect(onStateChange).toHaveBeenLastCalledWith({
      marks: [],
      struckClues: [{ cluePosition: 1 }],
      falseCluePosition: null,
    });
  });

  it("restores saved marks, struck clues and the flagged clue", () => {
    renderSolver(variant, {
      marks: [yes([0, 0], [1, 0])],
      struckClues: [{ cluePosition: 0 }],
      falseCluePosition: 4,
    });
    expect(cell("Ann × Dog: yes")).toBeTruthy();
    expect(
      screen.getByRole("button", { name: /Cross out clue 1/ }).getAttribute("aria-pressed"),
    ).toBe("true");
    expect(
      (screen.getByRole("radio", { name: "Clue 5" }) as HTMLInputElement).checked,
    ).toBe(true);
  });

  it("registers the answer only once the yes marks complete every household", async () => {
    const user = userEvent.setup();
    const { read } = renderSolver(classic, {
      marks: households.slice(0, 5),
      struckClues: [],
      falseCluePosition: null,
    });
    expect(read()).toBeNull();
    await user.click(cell("Cat × Green: blank"));
    await user.click(cell("Cat × Green: no"));
    expect(read()?.links).toHaveLength(9);
    expect(read()?.falseCluePosition).toBeNull();
  });

  it("offers the false-clue question only in the variant, and withholds the answer until a clue is flagged", async () => {
    const user = userEvent.setup();
    const { read } = renderSolver(variant, {
      marks: households,
      struckClues: [],
      falseCluePosition: null,
    });
    expect(screen.getByText("Which clue is false?")).toBeTruthy();
    expect(read()).toBeNull();
    await user.click(screen.getByRole("radio", { name: "Clue 5" }));
    expect(read()).toMatchObject({ falseCluePosition: 4 });
    cleanup();
    renderSolver(classic);
    expect(screen.queryByText("Which clue is false?")).toBeNull();
  });
});
