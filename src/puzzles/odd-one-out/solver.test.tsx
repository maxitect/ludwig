// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { AttemptState, Payload } from "./schema";
import { Solver } from "./solver";

afterEach(cleanup);

const payload: Payload = {
  promptText: "Which is the odd one out?",
  items: ["Violin", "Cello", "Trumpet", "Harp"].map((label, position) => ({
    position,
    label,
  })),
};

function renderSolver(initialState: AttemptState | null = null, solved = false) {
  const onStateChange = vi.fn();
  const registerCheck = vi.fn();
  render(
    <Solver
      payload={payload}
      initialState={initialState}
      onStateChange={onStateChange}
      registerCheck={registerCheck}
      solved={solved}
    />,
  );
  const read = () =>
    registerCheck.mock.calls.at(-1)?.[0] as () => {
      itemPosition: number;
    } | null;
  return { onStateChange, read };
}

describe("odd one out solver", () => {
  it("is one radio group named by the prompt, with every item", () => {
    renderSolver();
    const group = screen.getByRole("group", { name: /odd one out/ });
    expect(group).toBeTruthy();
    expect(screen.getAllByRole("radio")).toHaveLength(4);
  });

  it("has no answer until an item is chosen, then reports and saves it", async () => {
    const { onStateChange, read } = renderSolver();
    expect(read()()).toBeNull();
    await userEvent.click(screen.getByRole("radio", { name: /Trumpet/ }));
    expect(read()()).toEqual({ itemPosition: 2 });
    expect(onStateChange).toHaveBeenLastCalledWith({ itemPosition: 2 });
  });

  it("restores the saved choice", () => {
    const { read } = renderSolver({ itemPosition: 3 });
    expect(
      (screen.getByRole("radio", { name: /Harp/ }) as HTMLInputElement).checked,
    ).toBe(true);
    expect(read()()).toEqual({ itemPosition: 3 });
  });

  it("ignores a saved choice that is not an item", () => {
    const { read } = renderSolver({ itemPosition: 8 });
    expect(read()()).toBeNull();
  });

  it("disables the items once solved", () => {
    renderSolver({ itemPosition: 2 }, true);
    for (const radio of screen.getAllByRole("radio")) {
      expect(radio.matches(":disabled")).toBe(true);
    }
  });
});
