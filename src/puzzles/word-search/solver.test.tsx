// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { AttemptState, Payload } from "./schema";
import { Solver } from "./solver";

afterEach(cleanup);

const grid = ["CATZ", "ZZZD", "ZZZO", "ZZZG"];
const payload: Payload = {
  rows: 4,
  cols: 4,
  cells: grid.flatMap((line, row) =>
    [...line].map((letter, col) => ({ row, col, letter })),
  ),
  words: ["CAT", "DOG"],
};

function renderSolver(initialState: AttemptState | null = null) {
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
    />,
  );
  return { onStateChange, registerCheck, requestCheck };
}

const cell = (row: number, col: number) =>
  screen.getByRole("gridcell", { name: new RegExp(`^Row ${row + 1}, column ${col + 1},`) });
const reader = (registerCheck: ReturnType<typeof vi.fn>) =>
  registerCheck.mock.calls.at(-1)?.[0] as () => unknown;

describe("word search solver", () => {
  it("lists the words and the grid", () => {
    renderSolver();
    expect(screen.getAllByRole("gridcell")).toHaveLength(16);
    expect(screen.getByText("CAT")).toBeTruthy();
    expect(screen.getByText("Find 2 words")).toBeTruthy();
  });

  it("selects with the keyboard: arrows move, Enter marks the start and confirms", async () => {
    const user = userEvent.setup();
    const { onStateChange, registerCheck, requestCheck } = renderSolver();
    cell(0, 0).focus();
    await user.keyboard("{Enter}{ArrowRight}{ArrowRight}{Enter}");
    expect(onStateChange).toHaveBeenLastCalledWith({ found: ["CAT"] });
    expect(screen.getByText("Found CAT. 1 to go.")).toBeTruthy();
    expect(screen.getAllByTestId("found-stroke")).toHaveLength(1);
    expect(reader(registerCheck)()).toBeNull();
    expect(requestCheck).not.toHaveBeenCalled();

    await user.keyboard("{ArrowDown}{ArrowRight}{Enter}{ArrowDown}{ArrowDown}{Enter}");
    expect(onStateChange).toHaveBeenLastCalledWith({ found: ["CAT", "DOG"] });
    expect(requestCheck).toHaveBeenCalledTimes(1);
    expect(reader(registerCheck)()).toEqual({
      selections: [
        { start: { row: 0, col: 0 }, end: { row: 0, col: 2 } },
        { start: { row: 1, col: 3 }, end: { row: 3, col: 3 } },
      ],
    });
  });

  it("accepts a selection made from the last letter back to the first", async () => {
    const user = userEvent.setup();
    const { onStateChange } = renderSolver();
    cell(3, 3).focus();
    await user.keyboard("{Enter}{ArrowUp}{ArrowUp}{Enter}");
    expect(onStateChange).toHaveBeenLastCalledWith({ found: ["DOG"] });
  });

  it("refuses a selection that is not a word, and escape drops a start", async () => {
    const user = userEvent.setup();
    const { onStateChange } = renderSolver();
    cell(0, 0).focus();
    await user.keyboard("{Enter}{ArrowRight}{Enter}");
    expect(screen.getByText("That is not one of the words.")).toBeTruthy();
    await user.keyboard("{Enter}{Escape}{ArrowRight}{Enter}");
    expect(cell(0, 2).getAttribute("aria-label")).toContain("selection start");
    expect(onStateChange).not.toHaveBeenCalled();
  });

  it("restores the words found before", () => {
    const { registerCheck } = renderSolver({ found: ["DOG"] });
    expect(screen.getAllByTestId("found-stroke")).toHaveLength(1);
    expect(screen.getByText("(found)")).toBeTruthy();
    expect(reader(registerCheck)()).toBeNull();
  });

  it("ignores a saved word that is not on the list", () => {
    renderSolver({ found: ["EEL"] });
    expect(screen.queryAllByTestId("found-stroke")).toHaveLength(0);
  });
});
