import { mkdirSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";
import { content as bumps } from "../content/nonogram/bumps-in-the-night";
import { content as inkWell } from "../content/nonogram/ink-well";
import { cluesOf } from "../src/puzzles/nonogram/derive";
import { solve } from "../src/puzzles/nonogram/engine";
import { shadedCells } from "../src/puzzles/nonogram/verify";
import { signUp, uniqueEmail } from "./helpers/auth";
import { attemptsFor, databaseAvailable, nonogramMarks } from "./helpers/db";
import { hydrated, openPuzzle } from "./helpers/solve";

const SHOTS = ".verification/T094";
const MAX_TABS = 120;

type Cell = { row: number; col: number };

const cell = (page: Page, { row, col }: Cell) =>
  page.locator(
    `[role="gridcell"][aria-label^="Row ${row + 1}, column ${col + 1},"]`,
  );

const solutionOf = ({ rows, cols, grid }: typeof inkWell): Cell[] =>
  solve(cluesOf(rows, cols, shadedCells({ grid }))) ?? [];

const status = (page: Page) =>
  page.getByRole("status").filter({ hasText: "clues met" });

async function tabIntoGrid(page: Page) {
  await expect(page.getByRole("grid", { name: "Nonogram grid" })).toBeVisible();
  for (let i = 0; i < MAX_TABS; i++) {
    await page.keyboard.press("Tab");
    const inGrid = await page.evaluate(
      () => document.activeElement?.getAttribute("role") === "gridcell",
    );
    if (inGrid) return;
  }
  throw new Error("The nonogram grid never received keyboard focus");
}

async function walk(page: Page, from: Cell, to: Cell) {
  for (let row = from.row; row !== to.row; ) {
    const down = row < to.row;
    await page.keyboard.press(down ? "ArrowDown" : "ArrowUp");
    row += down ? 1 : -1;
  }
  for (let col = from.col; col !== to.col; ) {
    const right = col < to.col;
    await page.keyboard.press(right ? "ArrowRight" : "ArrowLeft");
    col += right ? 1 : -1;
  }
  return to;
}

/** Walks the cursor from `at` with the arrow keys and presses Space on each cell. */
async function fill(page: Page, cells: Cell[], at: Cell = { row: 0, col: 0 }) {
  let position = at;
  for (const target of cells) {
    position = await walk(page, position, target);
    await page.keyboard.press(" ");
  }
  return position;
}

test("solve by keyboard, hear each clue, keep the marks across a reload", async ({
  page,
}) => {
  test.skip(!databaseAvailable, "needs the local database");
  const email = uniqueEmail("t094-key");
  const cells = solutionOf(inkWell);
  const total = cells.length;
  const { rowClues, colClues } = cluesOf(
    inkWell.rows,
    inkWell.cols,
    shadedCells(inkWell),
  );
  await signUp(page, email);
  await openPuzzle(page, { typeKey: "nonogram", slug: "ink-well" });
  await tabIntoGrid(page);

  const first = cells[0];
  await walk(page, { row: 0, col: 0 }, first);
  await expect(page.locator(":focus")).toHaveAttribute(
    "aria-label",
    new RegExp(
      `row clue ${rowClues[first.row].join(" ")}, column clue ${colClues[first.col].join(" ")}, empty$`,
    ),
  );

  const end = await fill(page, cells.slice(0, 4), { row: first.row, col: first.col });
  await walk(page, end, { row: 0, col: 0 });
  await page.keyboard.press("x");
  await expect
    .poll(async () => nonogramMarks(email))
    .toEqual([
      { mark: "fill", count: 4 },
      { mark: "cross", count: 1 },
    ]);

  await page.reload();
  await hydrated(page.getByRole("grid", { name: "Nonogram grid" }));
  await expect(cell(page, { row: 0, col: 0 })).toHaveAttribute("aria-label", /cross$/);
  await expect(cell(page, cells[0])).toHaveAttribute("aria-label", /fill$/);

  await tabIntoGrid(page);
  await fill(page, cells.slice(4), { row: 0, col: 0 });
  await expect(status(page)).toHaveText(`${inkWell.rows + inkWell.cols} of ${inkWell.rows + inkWell.cols} clues met`);
  await expect(page.getByText(/Solved in/)).toBeVisible();
  await expect(page.getByTestId("epilogue")).toHaveText(inkWell.caption);
  await expect
    .poll(async () => (await attemptsFor(email))[0]?.completed)
    .toBe(true);
  expect((await nonogramMarks(email)).find((m) => m.mark === "fill")?.count).toBe(
    total,
  );
});

test("taps cycle a cell, a drag paints a run, and the picture shows in both themes", async ({
  page,
}, testInfo) => {
  test.skip(!databaseAvailable, "needs the local database");
  if (testInfo.project.name !== "mobile") {
    await page.setViewportSize({ width: 1280, height: 900 });
  }
  await signUp(page, uniqueEmail("t094-pic"));
  await openPuzzle(page, { typeKey: "nonogram", slug: "bumps-in-the-night" });
  const grid = page.getByRole("grid", { name: "Nonogram grid" });
  await expect(grid).toBeVisible();

  const target = { row: 14, col: 14 };
  await cell(page, target).click();
  await expect(cell(page, target)).toHaveAttribute("aria-label", /fill$/);
  await cell(page, target).click();
  await expect(cell(page, target)).toHaveAttribute("aria-label", /cross$/);
  await cell(page, target).click();
  await expect(cell(page, target)).toHaveAttribute("aria-label", /empty$/);

  const centre = async (at: Cell) => {
    await cell(page, at).scrollIntoViewIfNeeded();
    const box = await cell(page, at).boundingBox();
    return { x: box!.x + box!.width / 2, y: box!.y + box!.height / 2 };
  };
  const runs = bumps.grid.flatMap((line, row) =>
    [...line.matchAll(/#+/g)].map((run) => ({
      row,
      from: run.index,
      to: run.index + run[0].length - 1,
    })),
  );
  const paint = async ({ row, from, to }: (typeof runs)[number]) => {
    const start = await centre({ row, col: from });
    await page.mouse.move(start.x, start.y);
    await page.mouse.down();
    for (let col = from + 1; col <= to; col++) {
      const next = await centre({ row, col });
      await page.mouse.move(next.x, next.y);
    }
    await page.mouse.up();
  };

  mkdirSync(SHOTS, { recursive: true });
  const width = testInfo.project.name === "mobile" ? 390 : 1280;
  const shoot = async (name: string) => {
    for (const theme of ["paper", "ink"]) {
      await page.evaluate(
        (value) => document.documentElement.setAttribute("data-theme", value),
        theme,
      );
      await grid.evaluate((el) => el.scrollIntoView({ block: "center" }));
      await page.screenshot({ path: `${SHOTS}/ac6-${name}-${theme}-${width}.png` });
    }
  };

  const half = Math.ceil(runs.length / 2);
  for (const run of runs.slice(0, half)) await paint(run);
  await shoot("partial");

  await cell(page, { row: 14, col: 0 }).click();
  await cell(page, { row: 14, col: 0 }).click();
  await expect(cell(page, { row: 14, col: 0 })).toHaveAttribute("aria-label", /cross$/);

  for (const run of runs.slice(half)) await paint(run);
  await expect(page.getByText(/Solved in/)).toBeVisible();
  await expect(page.getByTestId("epilogue")).toHaveText(bumps.caption);
  await expect(grid).toHaveAttribute("data-solved", "true");
  await shoot("solved");
});
