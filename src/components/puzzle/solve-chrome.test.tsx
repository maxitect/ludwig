// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from "@testing-library/react";
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

const solverStub = vi.hoisted(() => ({ current: null as unknown }));
vi.mock("@/puzzles/solvers", () => ({
  getSolver: () => solverStub.current,
  ownsTouchControls: new Set(),
}));

const { SolveChrome } = await import("./solve-chrome");
// Restoring progress imports these on demand; a cold import of every attempt schema can outlast waitFor on a loaded CI runner.
await Promise.all([
  import("@/lib/forms/local-progress"),
  import("@/puzzles/attempt-schemas"),
]);

afterEach(cleanup);
beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  actions.checkAnswer.mockResolvedValue({
    ok: true,
    result: { correct: true },
  });
  actions.clearState.mockResolvedValue({ ok: true });
  actions.saveState.mockResolvedValue({ ok: true });
  actions.revealCell.mockResolvedValue({ ok: true, value: "Q" });
});

const cellResults: unknown[] = [];

function Solver({
  registerCheck,
  checkCell,
  revealCell,
  initialState,
  onStateChange,
}: SolverProps) {
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
      <output aria-label="Restored">{JSON.stringify(initialState)}</output>
      <button type="button" onClick={() => onStateChange({ answer: "abc" })}>
        Place
      </button>
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

solverStub.current = Solver;

function renderChrome(
  signedIn = true,
  initialState: SolverProps["initialState"] = null,
  completion: { durationMs: number | null } | null = null,
) {
  render(
    <SolveChrome
      puzzleId="00000000-0000-0000-0000-000000000001"
      typeKey="anagram"
      typeName="Anagram"
      category="Word"
      title="Test"
      difficulty={1}
      payload={{}}
      initialState={initialState}
      completion={completion}
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

describe("SolveChrome already solved", () => {
  it("opens solved with the recorded time and refuses check and reset", async () => {
    renderChrome(true, { answer: "x" }, { durationMs: 83_000 });
    expect(await screen.findByText("01:23", { selector: "span" })).toBeTruthy();
    expect(screen.getByTestId("solved-stamp")).toBeTruthy();
    for (const name of ["Check", "Reset"]) {
      for (const button of screen.getAllByRole("button", { name })) {
        expect((button as HTMLButtonElement).disabled).toBe(true);
      }
    }
    screen.getByRole("group", { name: "Board" }).focus();
    await userEvent.keyboard("{Enter}");
    expect(actions.checkAnswer).not.toHaveBeenCalled();
    expect(actions.clearState).not.toHaveBeenCalled();
  });

  it("opens solved from a completed local entry when signed out", async () => {
    renderChrome(false);
    await userEvent.click(await screen.findByRole("button", { name: "Place" }));
    await userEvent.click(screen.getAllByRole("button", { name: "Check" })[0]);
    await screen.findByText(/Solved in/);
    cleanup();
    renderChrome(false);
    await screen.findByText(/Solved in/);
  });

  it("saves no edit made after solving", async () => {
    renderChrome(true, { answer: "x" }, { durationMs: 83_000 });
    await screen.findByTestId("solved-stamp");
    await userEvent.click(screen.getByRole("button", { name: "Place" }));
    cleanup();
    expect(actions.saveState).not.toHaveBeenCalled();
  });
});

describe("SolveChrome Reset", () => {
  it("clears the saved state when signed in", async () => {
    renderChrome();
    await userEvent.click(screen.getAllByRole("button", { name: "Reset" })[0]);
    expect(actions.clearState).toHaveBeenCalledWith(
      "00000000-0000-0000-0000-000000000001",
    );
  });

  it("clears the local entry and calls no action when signed out", async () => {
    renderChrome(false);
    await userEvent.click(await screen.findByRole("button", { name: "Place" }));
    await userEvent.click(screen.getAllByRole("button", { name: "Reset" })[0]);
    expect(actions.clearState).not.toHaveBeenCalled();
    expect(localStorage.getItem(progressKey)).toBeNull();
  });
});

const progressKey = "ludwig:progress:00000000-0000-0000-0000-000000000001";

describe("SolveChrome signed out", () => {
  it("saves state to localStorage without calling saveState, and restores it", async () => {
    renderChrome(false);
    await userEvent.click(await screen.findByRole("button", { name: "Place" }));
    expect(actions.saveState).not.toHaveBeenCalled();
    expect(JSON.parse(localStorage.getItem(progressKey) ?? "").state).toEqual({
      answer: "abc",
    });
    cleanup();
    renderChrome(false);
    await waitFor(() =>
      expect(screen.getByLabelText("Restored").textContent).toBe(
        '{"answer":"abc"}',
      ),
    );
  });

  it("checks through the action and marks the local entry complete", async () => {
    renderChrome(false);
    await userEvent.click(await screen.findByRole("button", { name: "Place" }));
    await userEvent.click(screen.getAllByRole("button", { name: "Check" })[0]);
    await screen.findByText(/Solved in/);
    expect(actions.checkAnswer).toHaveBeenCalledTimes(1);
    const stored = JSON.parse(localStorage.getItem(progressKey) ?? "");
    expect(stored.completedAt).toBeTypeOf("number");
    expect(stored.durationMs).toBeTypeOf("number");
  });

  it("discards a corrupt entry and loads fresh", async () => {
    localStorage.setItem(progressKey, "{bad");
    renderChrome(false);
    expect((await screen.findByLabelText("Restored")).textContent).toBe("null");
    expect(localStorage.getItem(progressKey)).toBeNull();
  });

  it("still works when localStorage throws", async () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("denied");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("denied");
    });
    renderChrome(false);
    await userEvent.click(await screen.findByRole("button", { name: "Place" }));
    await userEvent.click(screen.getAllByRole("button", { name: "Check" })[0]);
    await screen.findByText(/Solved in/);
    vi.restoreAllMocks();
  });
});

describe("SolveChrome signed in with a local entry awaiting merge", () => {
  const localEntry = JSON.stringify({
    typeKey: "anagram",
    state: { answer: "abc" },
    startedAt: 1,
  });

  it("resumes the local state when the server has none", async () => {
    localStorage.setItem(progressKey, localEntry);
    renderChrome(true);
    await waitFor(() =>
      expect(screen.getByLabelText("Restored").textContent).toBe(
        '{"answer":"abc"}',
      ),
    );
  });

  it("keeps the server state when there is one", async () => {
    localStorage.setItem(progressKey, localEntry);
    renderChrome(true, { answer: "srv" });
    expect((await screen.findByLabelText("Restored")).textContent).toBe(
      '{"answer":"srv"}',
    );
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
    await userEvent.click(
      await screen.findByRole("button", { name: "Cell check" }),
    );
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
    expect(screen.getByRole("button", { name: "Cell check" })).toHaveProperty(
      "disabled",
      true,
    );
    expect(screen.getByRole("button", { name: "Cell reveal" })).toHaveProperty(
      "disabled",
      true,
    );
  });
});

describe("SolveChrome pending save", () => {
  afterEach(() => vi.restoreAllMocks());

  it("sends one save when Check and unmount follow a state change", async () => {
    renderChrome();
    await userEvent.click(screen.getByRole("button", { name: "Place" }));
    await userEvent.click(screen.getAllByRole("button", { name: "Check" })[0]);
    await screen.findByText(/Solved in/);
    cleanup();
    expect(actions.saveState).toHaveBeenCalledTimes(1);
    expect(actions.saveState).toHaveBeenCalledWith(
      "00000000-0000-0000-0000-000000000001",
      { answer: "abc" },
    );
    expect(actions.saveState.mock.invocationCallOrder[0]).toBeLessThan(
      actions.checkAnswer.mock.invocationCallOrder[0],
    );
  });

  it("flushes on unmount within the debounce window", async () => {
    renderChrome();
    await userEvent.click(screen.getByRole("button", { name: "Place" }));
    expect(actions.saveState).not.toHaveBeenCalled();
    cleanup();
    expect(actions.saveState).toHaveBeenCalledTimes(1);
  });

  it("flushes when the page is hidden, once", async () => {
    renderChrome();
    await userEvent.click(screen.getByRole("button", { name: "Place" }));
    vi.spyOn(document, "visibilityState", "get").mockReturnValue("hidden");
    document.dispatchEvent(new Event("visibilitychange"));
    window.dispatchEvent(new Event("pagehide"));
    cleanup();
    expect(actions.saveState).toHaveBeenCalledTimes(1);
  });

  it("sends nothing when no state changed", () => {
    renderChrome();
    cleanup();
    expect(actions.saveState).not.toHaveBeenCalled();
  });
});
