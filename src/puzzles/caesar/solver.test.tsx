// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { AttemptState } from "./schema";
import { Solver } from "./solver";

afterEach(cleanup);

const payload = { ciphertext: "DWWDFN DW GDZQ" };

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

const slot = (letter: string) =>
  screen.getByRole("textbox", { name: new RegExp(`^Cipher letter ${letter},`) });
const lastReader = (registerCheck: ReturnType<typeof vi.fn>) =>
  registerCheck.mock.calls.at(-1)?.[0] as () => { answer: string } | null;

describe("cipher key panel in the caesar solver", () => {
  it("gives every letter of the alphabet a named slot, disabled when absent", () => {
    renderSolver();
    expect(screen.getAllByRole("textbox")).toHaveLength(26);
    expect(slot("D").hasAttribute("disabled")).toBe(false);
    expect(slot("A").hasAttribute("disabled")).toBe(true);
    expect(slot("D").getAttribute("aria-label")).toBe(
      "Cipher letter D, no guess",
    );
  });

  it("assigns a guess by typing, moves on, and clears with Backspace", async () => {
    const user = userEvent.setup();
    const { onStateChange } = renderSolver();
    await user.click(slot("D"));
    await user.keyboard("a");
    expect(slot("D").getAttribute("aria-label")).toBe(
      "Cipher letter D, guess A",
    );
    expect(onStateChange).toHaveBeenLastCalledWith({ answer: "a__a__a__a__" });
    expect(document.activeElement).toBe(slot("F"));
    await user.click(slot("D"));
    await user.keyboard("{Backspace}");
    expect(onStateChange).toHaveBeenLastCalledWith({ answer: null });
  });

  it("accepts input from virtual keyboards that send no letter keydown", () => {
    const { onStateChange } = renderSolver();
    fireEvent.change(slot("D"), { target: { value: "q" } });
    expect(slot("D").getAttribute("aria-label")).toBe(
      "Cipher letter D, guess Q",
    );
    fireEvent.change(slot("D"), { target: { value: "rq" } });
    expect(onStateChange).toHaveBeenLastCalledWith({ answer: "r__r__r__r__" });
    fireEvent.change(slot("D"), { target: { value: "" } });
    expect(onStateChange).toHaveBeenLastCalledWith({ answer: null });
  });

  it("gives screen readers the ciphertext", () => {
    renderSolver();
    expect(screen.getByText("Ciphertext: DWWDFN DW GDZQ")).toBeTruthy();
  });

  it("moves between slots with the arrow keys, skipping absent letters", async () => {
    const user = userEvent.setup();
    renderSolver();
    await user.click(slot("D"));
    await user.keyboard("{ArrowRight}");
    expect(document.activeElement).toBe(slot("F"));
    await user.keyboard("{ArrowLeft}{ArrowLeft}");
    expect(document.activeElement).toBe(slot("D"));
  });

  it("offers an answer only once every letter is guessed", async () => {
    const user = userEvent.setup();
    const { registerCheck } = renderSolver();
    expect(lastReader(registerCheck)()).toBeNull();
    for (const [cipher, plain] of [
      ["D", "a"],
      ["W", "t"],
      ["F", "c"],
      ["N", "k"],
      ["G", "d"],
      ["Z", "w"],
    ]) {
      await user.click(slot(cipher));
      await user.keyboard(plain);
    }
    expect(lastReader(registerCheck)()).toBeNull();
    await user.click(slot("Q"));
    await user.keyboard("n");
    expect(lastReader(registerCheck)()).toEqual({ answer: "attackatdawn" });
  });

  it("flags a plain letter used for two cipher letters", async () => {
    const user = userEvent.setup();
    renderSolver();
    await user.click(slot("D"));
    await user.keyboard("a");
    await user.click(slot("W"));
    await user.keyboard("a");
    expect(slot("D").getAttribute("aria-invalid")).toBe("true");
    expect(slot("W").getAttribute("aria-invalid")).toBe("true");
  });

  it("restores guesses from the saved attempt", () => {
    renderSolver({ answer: "atta__at_a__" });
    expect(slot("D").getAttribute("aria-label")).toBe(
      "Cipher letter D, guess A",
    );
    expect(slot("W").getAttribute("aria-label")).toBe(
      "Cipher letter W, guess T",
    );
    expect(slot("F").getAttribute("aria-label")).toBe(
      "Cipher letter F, no guess",
    );
  });
});
