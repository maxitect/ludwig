// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useEffect } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { SolverProps } from "@/puzzles/solver-types";

const actions = vi.hoisted(() => ({
  checkAnswer: vi.fn(),
  clearState: vi.fn(),
  revealCell: vi.fn(),
  saveState: vi.fn(),
}));
vi.mock("@/lib/actions/puzzles", () => actions);

const { SolveChrome } = await import("./solve-chrome");

afterEach(cleanup);
beforeEach(() => {
  vi.clearAllMocks();
  actions.checkAnswer.mockResolvedValue({ ok: true, result: { correct: true } });
  actions.clearState.mockResolvedValue({ ok: true });
  actions.saveState.mockResolvedValue({ ok: true });
  actions.revealCell.mockResolvedValue({ ok: true, value: "Q" });
});

const cellResults: unknown[] = [];

function Solver({ registerCheck, checkCell, revealCell }: SolverProps) {
  useEffect(() => registerCheck(() => ({ answer: "x" })), [registerCheck]);
  return (
    <>
      <button
        type="button"
        disabled={!checkCell}
        onClick={async () => cellResults.push(await checkCell?.(1, 2, "A"))}
      >
        Cell check
      </button>
      <button
        type="button"
        disabled={!revealCell}
        onClick={async () => cellResults.push(await revealCell?.(1, 2))}
      >
        Cell reveal
      </button>
      <div role="group" aria-label="Board" tabIndex={0} />
      <div
        role="application"
        aria-label="Own Enter"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === "Enter") event.preventDefault();
        }}
      />
    </>
  );
}

function renderChrome(signedIn = true) {
  render(
    <SolveChrome
      puzzleId="00000000-0000-0000-0000-000000000001"
      category="Word"
      title="Test"
      difficulty={1}
      payload={{}}
      initialState={null}
      Solver={Solver}
      signedIn={signedIn}
      signInHref="/sign-in"
      nextHref={null}
    />,
  );
}

describe("SolveChrome Enter", () => {
  it("checks once from the board, and not again once solved", async () => {
    renderChrome();
    screen.getByRole("group", { name: "Board" }).focus();
    await userEvent.keyboard("{Enter}");
    await screen.findByText(/Solved in/);
    await userEvent.keyboard("{Enter}");
    expect(actions.checkAnswer).toHaveBeenCalledTimes(1);
  });

  it("leaves Enter to a solver that handles it", async () => {
    renderChrome();
    screen.getByRole("application", { name: "Own Enter" }).focus();
    await userEvent.keyboard("{Enter}");
    expect(actions.checkAnswer).not.toHaveBeenCalled();
  });
});

describe("SolveChrome Reset", () => {
  it("clears the saved state when signed in", async () => {
    renderChrome();
    await userEvent.click(screen.getByRole("button", { name: "Reset" }));
    expect(actions.clearState).toHaveBeenCalledWith(
      "00000000-0000-0000-0000-000000000001",
    );
  });

  it("calls no action when signed out", async () => {
    renderChrome(false);
    await userEvent.click(screen.getByRole("button", { name: "Reset" }));
    expect(actions.clearState).not.toHaveBeenCalled();
  });
});

describe("SolveChrome cell hooks", () => {
  beforeEach(() => {
    cellResults.length = 0;
  });

  it("checks and reveals one cell through the actions", async () => {
    renderChrome();
    await userEvent.click(screen.getByRole("button", { name: "Cell check" }));
    await userEvent.click(screen.getByRole("button", { name: "Cell reveal" }));
    expect(actions.checkAnswer).toHaveBeenCalledWith(
      "00000000-0000-0000-0000-000000000001",
      null,
      { mode: "cell", row: 1, col: 2, value: "A" },
    );
    expect(actions.revealCell).toHaveBeenCalledWith(
      "00000000-0000-0000-0000-000000000001",
      1,
      2,
    );
    expect(cellResults).toEqual([true, "Q"]);
  });

  it("asks a signed-out player to sign in and calls no action", async () => {
    renderChrome(false);
    await userEvent.click(screen.getByRole("button", { name: "Cell check" }));
    await userEvent.click(screen.getByRole("button", { name: "Cell reveal" }));
    expect(actions.checkAnswer).not.toHaveBeenCalled();
    expect(actions.revealCell).not.toHaveBeenCalled();
    expect(cellResults).toEqual([null, null]);
    expect(screen.getByRole("link", { name: "Sign in" })).toBeTruthy();
  });

  it("shows an error when the action fails", async () => {
    actions.revealCell.mockResolvedValue({ ok: false, error: "invalid" });
    renderChrome();
    await userEvent.click(screen.getByRole("button", { name: "Cell reveal" }));
    expect(cellResults).toEqual([null]);
    expect(screen.getByText(/could not be completed/)).toBeTruthy();
  });

  it("withholds the cell hooks once the puzzle is solved", async () => {
    renderChrome();
    screen.getByRole("group", { name: "Board" }).focus();
    await userEvent.keyboard("{Enter}");
    await screen.findByText(/Solved in/);
    expect(
      screen.getByRole("button", { name: "Cell check" }),
    ).toHaveProperty("disabled", true);
    expect(
      screen.getByRole("button", { name: "Cell reveal" }),
    ).toHaveProperty("disabled", true);
  });
});
