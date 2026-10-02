// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useEffect } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { SolverProps } from "@/puzzles/registry";

const actions = vi.hoisted(() => ({
  checkAnswer: vi.fn(),
  clearState: vi.fn(),
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
});

function Solver({ registerCheck }: SolverProps) {
  useEffect(() => registerCheck(() => ({ answer: "x" })), [registerCheck]);
  return (
    <>
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
