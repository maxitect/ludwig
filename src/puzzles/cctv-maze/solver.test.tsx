// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { revealCameras } from "@/lib/actions/cctv-maze";
import type { AttemptState, Payload } from "./schema";
import { Solver } from "./solver";

vi.mock("@/lib/actions/cctv-maze", () => ({
  revealCameras: vi.fn(async () => ({ ok: true })),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const payload: Payload = {
  puzzleId: "00000000-0000-4000-8000-000000000000",
  rows: 3,
  cols: 3,
  startRow: 0,
  startCol: 0,
  exitRow: 0,
  exitCol: 2,
  walls: [{ row: 0, col: 1, side: "west" }],
  cameras: [{ row: 1, col: 1, facing: "e", fovDeg: 60, rangeCells: 1 }],
};

function renderSolver(initialState: AttemptState | null = null) {
  const onStateChange = vi.fn();
  const registerCheck = vi.fn();
  render(
    <Solver
      payload={payload}
      initialState={initialState}
      onStateChange={onStateChange}
      registerCheck={registerCheck}
    />,
  );
  return { onStateChange, registerCheck };
}

const cell = (row: number, col: number) =>
  screen.getByRole("gridcell", {
    name: new RegExp(`^Row ${row + 1}, column ${col + 1}(,|$)`),
  });
const reader = (registerCheck: ReturnType<typeof vi.fn>) =>
  registerCheck.mock.calls.at(-1)?.[0] as () => unknown;

describe("cctv maze solver", () => {
  it("names the start, the exit and the player's place", () => {
    renderSolver();
    expect(screen.getAllByRole("gridcell")).toHaveLength(9);
    expect(cell(0, 0).getAttribute("aria-label")).toMatch(
      /start, you are here/,
    );
    expect(cell(0, 2).getAttribute("aria-label")).toMatch(/exit/);
  });

  it("walks with the arrow keys, blocks walls and steps back", async () => {
    const user = userEvent.setup();
    const { onStateChange, registerCheck } = renderSolver();
    expect(reader(registerCheck)()).toBeNull();

    cell(0, 0).focus();
    await user.keyboard("{ArrowRight}");
    expect(onStateChange).not.toHaveBeenCalled();
    expect(screen.getByRole("status").textContent).toMatch(/wall blocks/);

    await user.keyboard("{ArrowDown}{ArrowRight}");
    expect(onStateChange).toHaveBeenLastCalledWith({
      path: [
        { row: 0, col: 0 },
        { row: 1, col: 0 },
        { row: 1, col: 1 },
      ],
    });
    expect(cell(1, 1).getAttribute("aria-label")).toMatch(/you are here/);

    await user.keyboard("{ArrowLeft}");
    expect(onStateChange).toHaveBeenLastCalledWith({
      path: [
        { row: 0, col: 0 },
        { row: 1, col: 0 },
      ],
    });
  });

  it("offers an answer only once the path reaches the exit", async () => {
    const user = userEvent.setup();
    const { registerCheck } = renderSolver();
    cell(0, 0).focus();
    await user.keyboard("{ArrowDown}{ArrowRight}{ArrowRight}");
    expect(reader(registerCheck)()).toBeNull();
    await user.keyboard("{ArrowUp}");
    expect(reader(registerCheck)()).toEqual({
      path: [
        { row: 0, col: 0 },
        { row: 1, col: 0 },
        { row: 1, col: 1 },
        { row: 1, col: 2 },
        { row: 0, col: 2 },
      ],
    });
  });

  it("does not stop the player entering a cell a camera sees", async () => {
    const user = userEvent.setup();
    const { onStateChange } = renderSolver();
    cell(0, 0).focus();
    await user.keyboard("{ArrowDown}{ArrowRight}");
    expect(onStateChange).toHaveBeenCalledTimes(2);
  });

  it("steps to a tapped neighbour and ignores a distant cell", async () => {
    const user = userEvent.setup();
    const { onStateChange } = renderSolver();
    await user.click(cell(2, 2));
    expect(onStateChange).not.toHaveBeenCalled();
    await user.click(cell(1, 0));
    expect(onStateChange).toHaveBeenLastCalledWith({
      path: [
        { row: 0, col: 0 },
        { row: 1, col: 0 },
      ],
    });
  });

  it("restores a saved path and drops anything past a wall", () => {
    renderSolver({
      path: [
        { row: 0, col: 0 },
        { row: 0, col: 1 },
        { row: 0, col: 2 },
      ],
    });
    expect(cell(0, 0).getAttribute("aria-label")).toMatch(/you are here/);
    expect(cell(0, 2).getAttribute("aria-label")).not.toMatch(/on your path/);
  });

  it("hides the cameras until revealed, then records the hint", async () => {
    const user = userEvent.setup();
    renderSolver();
    expect(cell(1, 1).getAttribute("aria-label")).not.toMatch(/camera/);
    await user.click(screen.getByRole("button", { name: "Reveal cameras" }));
    expect(revealCameras).toHaveBeenCalledWith(payload.puzzleId);
    expect(cell(1, 1).getAttribute("aria-label")).toMatch(
      /camera, in a camera's view/,
    );
    expect(cell(1, 2).getAttribute("aria-label")).toMatch(/in a camera's view/);

    await user.click(screen.getByRole("button", { name: "Hide cameras" }));
    expect(cell(1, 1).getAttribute("aria-label")).not.toMatch(/camera/);
    await user.click(screen.getByRole("button", { name: "Reveal cameras" }));
    expect(revealCameras).toHaveBeenCalledTimes(1);
  });

  it("says so when the reveal cannot be recorded", async () => {
    vi.mocked(revealCameras).mockRejectedValueOnce(new Error("offline"));
    const user = userEvent.setup();
    renderSolver();
    await user.click(screen.getByRole("button", { name: "Reveal cameras" }));
    expect(
      await screen.findByText(/The hint could not be recorded\./),
    ).toBeTruthy();
  });
});
