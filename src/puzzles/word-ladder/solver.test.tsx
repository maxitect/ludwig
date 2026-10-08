// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { AttemptState, RungProblem } from "./schema";
import { Solver } from "./solver";

afterEach(cleanup);

const payload = { startWord: "head", endWord: "tail", rungCount: 2 };

function renderSolver(
  initialState: AttemptState | null = null,
  rungProblems?: RungProblem[],
) {
  const onStateChange = vi.fn();
  const registerCheck = vi.fn();
  const requestCheck = vi.fn();
  const props = {
    payload,
    initialState,
    onStateChange,
    registerCheck,
    requestCheck,
  };
  const view = render(<Solver {...props} rungProblems={rungProblems} />);
  const rerenderWith = (problems: RungProblem[]) =>
    view.rerender(<Solver {...props} rungProblems={problems} />);
  return { onStateChange, registerCheck, requestCheck, rerenderWith };
}

const tile = (rung: number, letter: number) =>
  screen.getByRole("textbox", { name: `Rung ${rung}, letter ${letter}` });
const reader = (registerCheck: ReturnType<typeof vi.fn>) =>
  registerCheck.mock.calls.at(-1)?.[0] as () => { ladder: string[] } | null;

describe("word ladder solver", () => {
  it("shows the fixed words and one row per rung", () => {
    renderSolver();
    expect(screen.getByRole("group", { name: "Start word" })).toBeTruthy();
    expect(screen.getByRole("group", { name: "End word" })).toBeTruthy();
    expect(screen.getAllByRole("textbox")).toHaveLength(8);
  });

  it("types a word across the tiles and saves what has been typed", async () => {
    const user = userEvent.setup();
    const { onStateChange, registerCheck } = renderSolver();
    expect(reader(registerCheck)()).toBeNull();
    await user.click(tile(1, 1));
    await user.keyboard("held");
    expect(onStateChange).toHaveBeenLastCalledWith({
      rungs: [{ position: 0, word: "held" }],
    });
    await user.click(tile(2, 1));
    await user.keyboard("hell");
    expect(reader(registerCheck)()).toEqual({
      ladder: ["head", "held", "hell", "tail"],
    });
  });

  it("removes a letter with Backspace and moves with the arrow keys", async () => {
    const user = userEvent.setup();
    const { onStateChange } = renderSolver({
      rungs: [{ position: 0, word: "held" }],
    });
    await user.click(tile(1, 4));
    await user.keyboard("{Backspace}");
    expect(onStateChange).toHaveBeenLastCalledWith({
      rungs: [{ position: 0, word: "hel" }],
    });
    await user.keyboard("{ArrowLeft}");
    expect(document.activeElement).toBe(tile(1, 3));
  });

  it("accepts input from virtual keyboards that send no letter keydown", () => {
    const { onStateChange } = renderSolver();
    fireEvent.change(tile(1, 1), { target: { value: "h" } });
    expect(onStateChange).toHaveBeenLastCalledWith({
      rungs: [{ position: 0, word: "h" }],
    });
  });

  it("asks for a check on Enter", async () => {
    const user = userEvent.setup();
    const { requestCheck } = renderSolver();
    await user.click(tile(1, 1));
    await user.keyboard("{Enter}");
    expect(requestCheck).toHaveBeenCalledTimes(1);
  });

  it("marks no rung invalid until a check reports a problem", () => {
    const { rerenderWith } = renderSolver();
    expect(screen.queryByTestId("rung-problem")).toBeNull();
    expect(tile(1, 1).getAttribute("aria-invalid")).toBeNull();
    rerenderWith([{ position: 1, reason: "not-a-word" }]);
    expect(screen.getByTestId("rung-problem").textContent).toMatch(
      /Not a word we know/,
    );
    expect(tile(2, 1).getAttribute("aria-invalid")).toBe("true");
    expect(tile(1, 1).getAttribute("aria-invalid")).toBeNull();
  });

  it("clears every mark on the next edit, since a step depends on its neighbours", async () => {
    const user = userEvent.setup();
    const { rerenderWith } = renderSolver();
    rerenderWith([
      { position: 0, reason: "not-one-step" },
      { position: 1, reason: "not-one-step" },
    ]);
    expect(screen.getAllByTestId("rung-problem")).toHaveLength(2);
    await user.click(tile(1, 1));
    await user.keyboard("a");
    expect(screen.queryByTestId("rung-problem")).toBeNull();
  });
});
