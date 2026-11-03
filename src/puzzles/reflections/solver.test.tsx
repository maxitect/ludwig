// @vitest-environment jsdom
import { act, cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { payload, solution } from "./fixture";
import type { AttemptState } from "./schema";
import { Solver } from "./solver";

afterEach(cleanup);

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
  screen.getByRole("gridcell", {
    name: new RegExp(`^Row ${row}, column ${col}\\b`),
  });

const [slot] = payload.slots;

describe("reflections Solver", () => {
  it("places a mirror with the slash and backslash keys and clears it again", async () => {
    const user = userEvent.setup();
    const { onStateChange } = renderSolver();
    cell(slot.row + 1, slot.col + 1).focus();
    await user.keyboard("/");
    expect(onStateChange).toHaveBeenLastCalledWith({
      mirrors: [{ ...slot, mirror: "slash" }],
    });
    await user.keyboard("\\");
    expect(onStateChange).toHaveBeenLastCalledWith({
      mirrors: [{ ...slot, mirror: "backslash" }],
    });
    await user.keyboard("{Backspace}");
    expect(onStateChange).toHaveBeenLastCalledWith({ mirrors: [] });
  });

  it("cycles a tapped slot and ignores a cell that is not a slot", async () => {
    const user = userEvent.setup();
    const { onStateChange } = renderSolver();
    await user.click(cell(slot.row + 1, slot.col + 1));
    await user.click(cell(slot.row + 1, slot.col + 1));
    expect(onStateChange).toHaveBeenLastCalledWith({
      mirrors: [{ ...slot, mirror: "backslash" }],
    });
    const fixed = payload.fixedMirrors[0];
    onStateChange.mockClear();
    await user.click(cell(fixed.row + 1, fixed.col + 1));
    expect(onStateChange).not.toHaveBeenCalled();
  });

  it("announces where a focused camera's beam exits", async () => {
    renderSolver();
    const [port] = payload.ports;
    const [camera] = screen.getAllByRole("button", {
      name: new RegExp(`^Camera ${port.label},`),
    });
    expect(camera.getAttribute("aria-label")).toMatch(/currently exits/);
    act(() => camera.focus());
    expect(screen.getByTestId("beam-note").textContent).toMatch(
      /currently exits/,
    );
    expect(document.querySelector("[data-beam]")).not.toBeNull();
  });

  it("registers the answer only when every slot holds a mirror, and asks for a check on a full solve", async () => {
    const user = userEvent.setup();
    const { registerCheck, requestCheck } = renderSolver({
      mirrors: solution.slice(1),
    });
    const read = registerCheck.mock.calls.at(-1)![0] as () => unknown;
    expect(read()).toBeNull();
    const last = solution[0];
    cell(last.row + 1, last.col + 1).focus();
    await user.keyboard(last.mirror === "slash" ? "/" : "\\");
    expect(requestCheck).toHaveBeenCalled();
    const readAll = registerCheck.mock.calls.at(-1)![0] as () => {
      mirrors: unknown[];
    } | null;
    expect(readAll()?.mirrors).toHaveLength(solution.length);
  });

  it("restores saved mirrors", () => {
    const [first] = solution;
    renderSolver({ mirrors: [first] });
    expect(cell(first.row + 1, first.col + 1).getAttribute("aria-label")).toMatch(
      first.mirror === "slash" ? /forward slash/ : /backslash mirror/,
    );
  });

  it("presses a camera only when it is tapped, not when it is focused", async () => {
    const user = userEvent.setup();
    renderSolver();
    const [camera] = screen.getAllByRole("button", { name: /^Camera / });
    act(() => camera.focus());
    expect(camera.getAttribute("aria-pressed")).toBe("false");
    await user.click(camera);
    expect(camera.getAttribute("aria-pressed")).toBe("true");
    await user.click(camera);
    expect(camera.getAttribute("aria-pressed")).toBe("false");
  });
});
