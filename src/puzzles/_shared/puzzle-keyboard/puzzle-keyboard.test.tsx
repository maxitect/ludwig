// @vitest-environment jsdom
import { act, cleanup, render, renderHook, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useRef, useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CellGrid, cellKey, type CellGridHandle } from "../cell-grid";
import { resetKeyboardStore } from "./keyboard-store";
import { PuzzleKeyboard } from "./puzzle-keyboard";
import { useKeyboardInset } from "./use-keyboard-inset";

const CELLS = new Set([cellKey(0, 0), cellKey(0, 1), cellKey(0, 2)]);

function Harness({ forceVisible }: { forceVisible?: boolean }) {
  const grid = useRef<CellGridHandle>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  return (
    <>
      <CellGrid
        ref={grid}
        label="Test"
        rows={1}
        cols={3}
        cells={CELLS}
        value={(row, col) => values[cellKey(row, col)] ?? ""}
        onChange={(row, col, value) =>
          setValues((prev) => ({ ...prev, [cellKey(row, col)]: value }))
        }
        accept={(char) => /^[A-Z]$/.test(char)}
        direction="across"
      />
      <PuzzleKeyboard
        layout="alpha"
        forceVisible={forceVisible}
        onKey={(char) => grid.current?.type(char)}
        onErase={() => grid.current?.erase()}
      />
    </>
  );
}

function stubTouch(matches: boolean) {
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches,
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  }));
}

beforeEach(() => {
  localStorage.clear();
  resetKeyboardStore();
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const cell = (col: number) =>
  screen.getByRole("gridcell", { name: new RegExp(`^Row 1, column ${col}\\b`) });

describe("PuzzleKeyboard", () => {
  it("drives the grid through its handle", async () => {
    stubTouch(true);
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getByRole("button", { name: "Q" }));
    await user.click(screen.getByRole("button", { name: "A" }));
    expect(cell(1).textContent).toBe("Q");
    expect(cell(2).textContent).toBe("A");
    await user.click(screen.getByRole("button", { name: "Delete" }));
    expect(cell(1).textContent).toBe("Q");
    expect(cell(2).textContent).toBe("");
    await user.click(screen.getByRole("button", { name: "W" }));
    expect(cell(2).textContent).toBe("W");
  });

  it("sets inputmode none on the grid input while the pad is active", () => {
    stubTouch(true);
    render(<Harness />);
    expect(screen.getByLabelText("Test input").getAttribute("inputmode")).toBe(
      "none",
    );
  });

  it("leaves the system keyboard alone for a specimen pad", () => {
    stubTouch(true);
    render(<Harness forceVisible />);
    expect(
      screen.getByLabelText("Test input").getAttribute("inputmode"),
    ).not.toBe("none");
  });

  it("is hidden away from touch", () => {
    stubTouch(false);
    render(<Harness />);
    expect(screen.queryByRole("group", { name: "Keyboard" })).toBeNull();
    expect(
      screen.getByLabelText("Test input").getAttribute("inputmode"),
    ).not.toBe("none");
  });
});

describe("useKeyboardInset", () => {
  it("follows visualViewport", () => {
    vi.stubGlobal("requestAnimationFrame", (callback: () => void) => {
      callback();
      return 0;
    });
    vi.stubGlobal("cancelAnimationFrame", () => {});
    vi.stubGlobal("innerHeight", 844);
    const viewport = Object.assign(new EventTarget(), {
      height: 500,
      offsetTop: 0,
    });
    vi.stubGlobal("visualViewport", viewport);
    const { result } = renderHook(() => useKeyboardInset(true));
    expect(result.current).toBe(344);
    act(() => {
      viewport.height = 844;
      viewport.dispatchEvent(new Event("resize"));
    });
    expect(result.current).toBe(0);
  });
});
