// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { CellGrid, cellRotation } from "./cell-grid";
import {
  cellKey,
  type CellKey,
  type CellPosition,
  type Direction,
} from "./navigation";

afterEach(cleanup);

const LETTER = (char: string) => /^[A-Z]$/.test(char);
const DIGIT = (char: string) => /^[1-9]$/.test(char);

function allCellsExcept(rows: number, cols: number, blocks: CellPosition[]) {
  const cells = new Set<CellKey>();
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (!blocks.some((b) => b.row === r && b.col === c)) {
        cells.add(cellKey(r, c));
      }
    }
  }
  return cells;
}

function Harness({
  rows = 3,
  cols = 3,
  blocks = [],
  accept = LETTER,
  words,
  initial = {},
}: {
  rows?: number;
  cols?: number;
  blocks?: CellPosition[];
  accept?: (char: string) => boolean;
  words?: CellPosition[][];
  initial?: Record<string, string>;
}) {
  const [values, setValues] = useState(initial);
  const [direction, setDirection] = useState<Direction>("across");
  return (
    <>
      <output data-testid="direction">{direction}</output>
      <CellGrid
        label="Test grid"
        rows={rows}
        cols={cols}
        cells={allCellsExcept(rows, cols, blocks)}
        value={(r, c) => values[cellKey(r, c)] ?? ""}
        onChange={(r, c, v) =>
          setValues((prev) => ({ ...prev, [cellKey(r, c)]: v }))
        }
        accept={accept}
        direction={direction}
        onDirectionChange={setDirection}
        words={words}
      />
    </>
  );
}

const cell = (row: number, col: number) =>
  screen.getByRole("gridcell", { name: new RegExp(`^Row ${row}, column ${col}\\b`) });

describe("CellGrid blocks", () => {
  it("renders missing coordinates as unfocusable ink blocks", () => {
    render(<Harness blocks={[{ row: 1, col: 1 }]} />);
    const block = cell(2, 2);
    expect(block.hasAttribute("tabindex")).toBe(false);
    expect(block.className).toContain("bg-ink");
    const focusable = screen
      .getAllByRole("gridcell")
      .filter((c) => c.hasAttribute("tabindex"));
    expect(focusable).toHaveLength(8);
  });
});

describe("CellGrid keyboard", () => {
  it("fills cells across when typing", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(cell(1, 1));
    await user.keyboard("ab");
    expect(cell(1, 1).textContent).toBe("A");
    expect(cell(1, 2).textContent).toBe("B");
    expect(cell(1, 3).textContent).toBe("");
  });

  it("switches to down with Space", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(cell(1, 1));
    await user.keyboard(" ab");
    expect(screen.getByTestId("direction").textContent).toBe("down");
    expect(cell(1, 1).textContent).toBe("A");
    expect(cell(2, 1).textContent).toBe("B");
  });

  it("toggles direction when the active cell is clicked again", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(cell(1, 1));
    expect(screen.getByTestId("direction").textContent).toBe("across");
    await user.click(cell(1, 1));
    expect(screen.getByTestId("direction").textContent).toBe("down");
  });

  it("skips blocks with the arrow keys", async () => {
    const user = userEvent.setup();
    render(<Harness blocks={[{ row: 0, col: 1 }]} />);
    await user.click(cell(1, 1));
    await user.keyboard("{ArrowRight}x");
    expect(cell(1, 3).textContent).toBe("X");
  });

  it("clears the current cell, then steps back on the next Backspace", async () => {
    const user = userEvent.setup();
    render(<Harness initial={{ [cellKey(0, 0)]: "A", [cellKey(0, 1)]: "B" }} />);
    await user.click(cell(1, 2));
    await user.keyboard("{Backspace}");
    expect(cell(1, 2).textContent).toBe("");
    expect(cell(1, 1).textContent).toBe("A");
    await user.keyboard("{Backspace}");
    expect(cell(1, 1).textContent).toBe("");
    await user.keyboard("z");
    expect(cell(1, 1).textContent).toBe("Z");
  });

  it("Tab jumps to the next word when words are supplied", async () => {
    const user = userEvent.setup();
    const words = [
      [
        { row: 0, col: 0 },
        { row: 0, col: 1 },
      ],
      [
        { row: 2, col: 0 },
        { row: 2, col: 1 },
      ],
    ];
    render(<Harness words={words} />);
    await user.click(cell(1, 2));
    await user.keyboard("{Tab}q");
    expect(cell(3, 1).textContent).toBe("Q");
    await user.keyboard("{Shift>}{Tab}{/Shift}r");
    expect(cell(1, 1).textContent).toBe("R");
  });

  it("leaves the grid with one Shift+Tab from the first entry", async () => {
    const user = userEvent.setup();
    render(
      <>
        <button type="button">before</button>
        <Harness />
      </>,
    );
    await user.click(cell(1, 1));
    await user.keyboard("{Shift>}{Tab}{/Shift}");
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "before" }));
  });

  it("moves focus between cells with a roving tabindex", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.tab();
    expect(document.activeElement).toBe(cell(1, 1));
    await user.keyboard("{ArrowRight}");
    expect(document.activeElement).toBe(cell(1, 2));
    expect(cell(1, 2).getAttribute("tabindex")).toBe("0");
    expect(cell(1, 1).getAttribute("tabindex")).toBe("-1");
  });
});

describe("CellGrid accept", () => {
  it("ignores characters the validator rejects", async () => {
    const user = userEvent.setup();
    render(<Harness accept={DIGIT} />);
    await user.click(cell(1, 1));
    await user.keyboard("a");
    expect(cell(1, 1).textContent).toBe("");
    await user.keyboard("5");
    expect(cell(1, 1).textContent).toBe("5");
  });
});

describe("CellGrid rotation", () => {
  it("is deterministic and within two degrees", () => {
    const transforms = () => {
      const { unmount } = render(
        <Harness initial={{ [cellKey(0, 0)]: "A", [cellKey(1, 1)]: "B" }} />,
      );
      const result = screen
        .getAllByRole("gridcell")
        .map((c) => c.querySelector<HTMLElement>("span:last-child")?.style.transform);
      unmount();
      return result;
    };
    const first = transforms();
    expect(transforms()).toEqual(first);
    expect(first.every((t) => t?.startsWith("rotate("))).toBe(true);
    for (let i = 0; i < 100; i++) {
      expect(Math.abs(cellRotation(i))).toBeLessThanOrEqual(2);
    }
  });
});

describe("CellGrid accessibility", () => {
  it("exposes grid, rows and named gridcells", () => {
    render(<Harness />);
    expect(screen.getByRole("grid", { name: "Test grid" })).toBeTruthy();
    expect(screen.getAllByRole("row")).toHaveLength(3);
    expect(cell(2, 3).getAttribute("aria-label")).toBe("Row 2, column 3, empty");
  });
});
