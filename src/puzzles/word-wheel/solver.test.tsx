// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

const submitWheelWord = vi.hoisted(() => vi.fn());
vi.mock("@/lib/actions/word-wheel", () => ({ submitWheelWord }));

import { Solver } from "./solver";

afterEach(() => {
  cleanup();
  submitWheelWord.mockReset();
});

const payload = {
  centre: "v",
  rim: ["a", "d", "e", "n", "r", "t", "u", "e"],
  minLength: 4,
  thresholds: { average: 2, good: 3, genius: 4 },
};

function renderSolver(initialState: { words: string[] } | null = null) {
  const onStateChange = vi.fn();
  const registerCheck = vi.fn();
  const requestCheck = vi.fn();
  render(
    <Solver
      puzzleId="p"
      payload={payload}
      initialState={initialState}
      onStateChange={onStateChange}
      registerCheck={registerCheck}
      requestCheck={requestCheck}
    />,
  );
  return { onStateChange, registerCheck, requestCheck };
}

describe("word wheel solver", () => {
  it("rejects a short word, a word without the centre and a repeated letter without asking the server", async () => {
    const user = userEvent.setup();
    renderSolver();
    const input = screen.getByRole("textbox", { name: "Your word" });
    await user.type(input, "vet{Enter}");
    expect(screen.getByTestId("wheel-message").textContent).toMatch(
      /at least 4 letters/,
    );
    await user.clear(input);
    await user.type(input, "tuned{Enter}");
    expect(screen.getByTestId("wheel-message").textContent).toMatch(/centre/);
    await user.clear(input);
    await user.type(input, "venues{Enter}");
    expect(screen.getByTestId("wheel-message").textContent).toMatch(
      /more often/,
    );
    expect(submitWheelWord).not.toHaveBeenCalled();
  });

  it("builds a word from tapped tiles and lists it once the server accepts it", async () => {
    submitWheelWord.mockResolvedValue({
      ok: true,
      result: "accepted",
      isTarget: false,
    });
    const user = userEvent.setup();
    const { onStateChange, requestCheck } = renderSolver();
    for (const name of [
      "Centre letter v",
      "Letter e",
      "Letter n",
      "Letter t",
    ]) {
      await user.click(screen.getAllByRole("button", { name })[0]);
    }
    await user.click(screen.getByRole("button", { name: "Enter" }));
    await waitFor(() =>
      expect(onStateChange).toHaveBeenCalledWith({ words: ["vent"] }),
    );
    expect(submitWheelWord).toHaveBeenCalledWith("p", "vent");
    expect(
      screen.getByRole("list", { name: "Found words" }).textContent,
    ).toBe("vent");
    expect(requestCheck).not.toHaveBeenCalled();
  });

  it("shows the server's rejection of a non-word", async () => {
    submitWheelWord.mockResolvedValue({
      ok: true,
      result: "not-a-word",
      isTarget: false,
    });
    const user = userEvent.setup();
    const { onStateChange } = renderSolver();
    await user.type(
      screen.getByRole("textbox", { name: "Your word" }),
      "vend{Enter}",
    );
    await waitFor(() =>
      expect(screen.getByTestId("wheel-message").textContent).toMatch(
        /Not a word/,
      ),
    );
    expect(onStateChange).not.toHaveBeenCalled();
  });

  it("registers the target and asks for the check when the target is found", async () => {
    submitWheelWord.mockResolvedValue({
      ok: true,
      result: "accepted",
      isTarget: true,
    });
    const user = userEvent.setup();
    const { registerCheck, requestCheck } = renderSolver();
    await user.type(
      screen.getByRole("textbox", { name: "Your word" }),
      "adventure{Enter}",
    );
    await waitFor(() => expect(requestCheck).toHaveBeenCalled());
    const read = registerCheck.mock.calls.at(-1)?.[0] as () => unknown;
    expect(read()).toEqual({ word: "adventure" });
  });

  it("rates the found words and restores a saved list", () => {
    renderSolver({ words: ["vent", "vend", "venue"] });
    expect(screen.getByTestId("wheel-rating").textContent).toMatch(
      /Rating: Good/,
    );
    expect(screen.getAllByRole("listitem")).toHaveLength(3);
  });
});
