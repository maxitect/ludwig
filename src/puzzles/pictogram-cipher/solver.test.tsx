// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { AttemptState, Payload } from "./schema";
import { Solver } from "./solver";

afterEach(cleanup);

const payload: Payload = {
  words: [
    ["glyph-05", "glyph-03"],
    ["glyph-09", "glyph-03", "glyph-03", "glyph-09"],
  ],
  given: [{ assetKey: "glyph-03", letter: "e" }],
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

const slot = (number: number) =>
  screen.getByRole("textbox", { name: new RegExp(`^Symbol ${number},`) });
const lastReader = (registerCheck: ReturnType<typeof vi.fn>) =>
  registerCheck.mock.calls.at(-1)?.[0] as () => { answer: string } | null;

describe("pictogram cipher solver", () => {
  it("gives each glyph in the message one slot, named by number and never by letter", () => {
    renderSolver();
    expect(screen.getAllByRole("textbox")).toHaveLength(3);
    expect(slot(5).getAttribute("aria-label")).toBe("Symbol 5, no guess");
    expect(slot(3).getAttribute("aria-label")).toBe("Symbol 3, given E");
    for (const textbox of screen.getAllByRole("textbox")) {
      expect(textbox.getAttribute("aria-label")).toMatch(/^Symbol \d+, /);
    }
  });

  it("reads the message to screen readers by symbol number only", () => {
    renderSolver();
    expect(
      screen.getByText("Ciphertext: Symbol 5, Symbol 3; Symbol 9, Symbol 3, Symbol 3, Symbol 9"),
    ).toBeTruthy();
  });

  it("locks the given glyph", async () => {
    const user = userEvent.setup();
    const { onStateChange } = renderSolver();
    expect(slot(3).hasAttribute("readonly")).toBe(true);
    await user.click(slot(3));
    await user.keyboard("x{Backspace}");
    expect(slot(3).getAttribute("aria-label")).toBe("Symbol 3, given E");
    expect(onStateChange).not.toHaveBeenCalled();
  });

  it("saves guesses as glyph key and letter, never the given glyph", async () => {
    const user = userEvent.setup();
    const { onStateChange } = renderSolver();
    await user.click(slot(5));
    await user.keyboard("h");
    expect(slot(5).getAttribute("aria-label")).toBe("Symbol 5, guess H");
    expect(onStateChange).toHaveBeenLastCalledWith({
      guesses: [{ assetKey: "glyph-05", letter: "h" }],
    });
    await user.click(slot(5));
    await user.keyboard("{Backspace}");
    expect(onStateChange).toHaveBeenLastCalledWith({ guesses: [] });
  });

  it("accepts input from virtual keyboards that send no letter keydown", () => {
    const { onStateChange } = renderSolver();
    fireEvent.change(slot(9), { target: { value: "s" } });
    expect(onStateChange).toHaveBeenLastCalledWith({
      guesses: [{ assetKey: "glyph-09", letter: "s" }],
    });
  });

  it("moves between slots with the arrow keys, in symbol order", async () => {
    const user = userEvent.setup();
    renderSolver();
    await user.click(slot(3));
    await user.keyboard("{ArrowRight}");
    expect(document.activeElement).toBe(slot(5));
    await user.keyboard("{ArrowRight}");
    expect(document.activeElement).toBe(slot(9));
    await user.keyboard("{ArrowLeft}{ArrowLeft}");
    expect(document.activeElement).toBe(slot(3));
  });

  it("skips given glyphs when tabbing in and when typing on from slot to slot", async () => {
    const user = userEvent.setup();
    const onStateChange = vi.fn();
    render(
      <Solver
        payload={{ ...payload, given: [{ assetKey: "glyph-05", letter: "h" }] }}
        initialState={null}
        onStateChange={onStateChange}
        registerCheck={vi.fn()}
      />,
    );
    await user.tab();
    expect(document.activeElement).toBe(slot(3));
    await user.keyboard("es");
    expect(slot(3).getAttribute("aria-label")).toBe("Symbol 3, guess E");
    expect(slot(9).getAttribute("aria-label")).toBe("Symbol 9, guess S");
    expect(slot(5).getAttribute("aria-label")).toBe("Symbol 5, given H");
  });

  it("offers the decoded message only once every glyph has a letter", async () => {
    const user = userEvent.setup();
    const { registerCheck } = renderSolver();
    expect(lastReader(registerCheck)()).toBeNull();
    await user.click(slot(5));
    await user.keyboard("h");
    expect(lastReader(registerCheck)()).toBeNull();
    await user.click(slot(9));
    await user.keyboard("s");
    expect(lastReader(registerCheck)()).toEqual({ answer: "hesees" });
  });

  it("restores saved guesses and ignores glyphs outside the message or given", () => {
    renderSolver({
      guesses: [
        { assetKey: "glyph-05", letter: "h" },
        { assetKey: "glyph-03", letter: "x" },
        { assetKey: "glyph-20", letter: "q" },
      ],
    });
    expect(slot(5).getAttribute("aria-label")).toBe("Symbol 5, guess H");
    expect(slot(3).getAttribute("aria-label")).toBe("Symbol 3, given E");
  });

  it("clears every guess but keeps the given glyph", async () => {
    const user = userEvent.setup();
    const { onStateChange } = renderSolver({
      guesses: [{ assetKey: "glyph-05", letter: "h" }],
    });
    await user.click(screen.getByRole("button", { name: "Clear" }));
    expect(onStateChange).toHaveBeenLastCalledWith({ guesses: [] });
    expect(slot(5).getAttribute("aria-label")).toBe("Symbol 5, no guess");
    expect(slot(3).getAttribute("aria-label")).toBe("Symbol 3, given E");
  });

  it("draws glyphs through neutral asset files in the ink colour", () => {
    const { container } = render(
      <Solver
        payload={payload}
        initialState={null}
        onStateChange={vi.fn()}
        registerCheck={vi.fn()}
      />,
    );
    const masks = [...container.querySelectorAll<HTMLElement>("span.bg-ink")];
    expect(masks.length).toBeGreaterThan(0);
    for (const mask of masks) {
      expect(mask.style.maskImage).toMatch(/\/glyphs\/glyph-\d{2}\.svg/);
    }
  });
});
