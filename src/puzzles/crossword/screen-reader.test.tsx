// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { virtual } from "@guidepup/virtual-screen-reader";
import { useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  DEVICE_KEYBOARD_KEY,
  resetKeyboardStore,
} from "../_shared/puzzle-keyboard/keyboard-store";
import { SolveSlotProvider } from "../_shared/solve-slot";
import { fixture, toPayloadClues } from "./fixture";
import type { Payload } from "./schema";
import { Solver } from "./solver";

const payload: Payload = {
  style: fixture.style,
  rows: fixture.rows,
  cols: fixture.cols,
  cells: fixture.cells.map(({ row, col }) => ({ row, col })),
  clues: toPayloadClues(fixture.clues),
};

function SolvePage() {
  const [slot, setSlot] = useState<HTMLDivElement | null>(null);
  return (
    <SolveSlotProvider value={slot}>
      <Solver
        payload={payload}
        initialState={null}
        onStateChange={vi.fn()}
        registerCheck={vi.fn()}
      />
      <div ref={setSlot} />
    </SolveSlotProvider>
  );
}

beforeEach(() => {
  localStorage.clear();
  resetKeyboardStore();
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: true,
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  }));
  const style = document.createElement("style");
  style.textContent = ".touch\\:hidden { display: none }";
  document.head.append(style);
});

afterEach(async () => {
  await virtual.stop();
  cleanup();
  vi.unstubAllGlobals();
  document.head.querySelector("style")?.remove();
});

type Step = "next" | "previous";

async function moveTo(phrase: string, step: Step = "next") {
  for (let moves = 0; moves < 150; moves += 1) {
    if ((await virtual.lastSpokenPhrase()) === phrase) return;
    await virtual[step]();
  }
  throw new Error(`The screen reader never reached "${phrase}"`);
}

const live = async () =>
  (await virtual.spokenPhraseLog()).filter((phrase) =>
    phrase.startsWith("polite: "),
  );

const between = (log: string[], start: string, end: string) =>
  log.slice(log.indexOf(start) + 1, log.indexOf(end));

const ACTIONS = [
  "button, Check cell, disabled",
  "button, Reveal cell, disabled",
  "button, Clues",
];

const KEYS = [..."QWERTYUIOPASDFGHJKLZXCVBNM"].map((key) => `button, ${key}`);

describe("crossword in solve mode with a screen reader", () => {
  it("solves an entry with the on-screen pad", async () => {
    render(<SolvePage />);
    await screen.findByRole("group", { name: "Keyboard" });
    await virtual.start({ container: document.body });

    await moveTo("end of group, Keyboard");
    const walk = await virtual.spokenPhraseLog();
    expect(walk).toContain("gridcell, Row 1, column 2, empty");
    expect(walk).toContain("gridcell, Row 2, column 2, block");
    expect(between(walk, "group, Keyboard", "end of group, Keyboard")).toEqual(
      [...ACTIONS, ...KEYS, "button, Delete"],
    );

    await moveTo("gridcell, Row 1, column 1, clue 1, empty", "previous");
    await virtual.act();
    expect(await virtual.lastSpokenPhrase()).toBe("textbox, Crossword input");

    await virtual.clearSpokenPhraseLog();
    for (const letter of "CRANE") {
      await moveTo("group, Keyboard");
      await moveTo(`button, ${letter}`);
      await virtual.act();
    }
    expect(await live()).toEqual([
      "polite: C, row 1, column 1",
      "polite: R, row 1, column 2",
      "polite: A, row 1, column 3",
      "polite: N, row 1, column 4",
      "polite: E, row 1, column 5",
    ]);

    await moveTo("button, Delete");
    await virtual.act();
    expect((await live()).at(-1)).toBe("polite: Erased, row 1, column 5");

    await virtual.clearSpokenPhraseLog();
    await moveTo("button, Next clue", "previous");
    await virtual.act();
    // The virtual reader repeats an atomic region once per changed text node; a real one speaks it once.
    expect(new Set(await live())).toEqual(
      new Set(["polite: 4 Across Remains of a fire (5)"]),
    );
  });

  it("solves an entry with the device keyboard", async () => {
    localStorage.setItem(DEVICE_KEYBOARD_KEY, "1");
    render(<SolvePage />);
    await screen.findByRole("group", { name: "Clue" });
    await virtual.start({ container: document.body });

    await moveTo("end of document");
    const walk = await virtual.spokenPhraseLog();
    expect(walk).not.toContain("group, Keyboard");
    expect(between(walk, "end of group, Clue", "end of document")).toEqual(
      ACTIONS,
    );

    await moveTo("gridcell, Row 1, column 1, clue 1, empty", "previous");
    await virtual.act();
    expect(await virtual.lastSpokenPhrase()).toBe("textbox, Crossword input");

    await virtual.clearSpokenPhraseLog();
    await virtual.type("CRANE");
    await virtual.press("Backspace");
    expect(await live()).toEqual([
      "polite: C, row 1, column 1",
      "polite: R, row 1, column 2",
      "polite: A, row 1, column 3",
      "polite: N, row 1, column 4",
      "polite: E, row 1, column 5",
      "polite: Erased, row 1, column 5",
    ]);

    await virtual.clearSpokenPhraseLog();
    await virtual.press("Tab");
    expect(new Set(await live())).toEqual(
      new Set(["polite: 4 Across Remains of a fire (5)"]),
    );
  });
});
