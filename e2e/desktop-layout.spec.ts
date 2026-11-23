import { readFileSync } from "node:fs";
import {
  expect,
  test,
  type Locator,
  type Page,
} from "@playwright/test";
import { content as crosswordFinePrint } from "../content/crossword/fine-print";
import { content as crosswordStageDoor } from "../content/crossword/stage-door";
import { content as bigWheel } from "../content/gear-train/big-wheel";
import { content as manifest } from "../content/logic-grid/manifest";
import { content as theLongWalk } from "../content/reverse-chess/the-long-walk";
import { content as fourSteps } from "../content/reverse-chess/four-steps";
import {
  boardOnlySolveTypes,
  excludedSolveTypes,
  panelSolveTypes,
} from "../src/config/solve-layout";
import { uncapturePuzzle } from "./helpers/content";
import { clickCheck, crosswordCell, openPuzzle } from "./helpers/solve";

test.skip(({ isMobile }) => isMobile, "desktop layout only");
test.setTimeout(180_000);

const VIEWPORTS = [
  { width: 1440, height: 800 },
  { width: 1280, height: 650 },
] as const;
const PHONE_FOOTER = 98;

type Box = { x: number; y: number; width: number; height: number };

async function box(locator: Locator): Promise<Box> {
  const found = await locator.boundingBox();
  if (!found) throw new Error("not rendered");
  return found;
}

const sheetOf = (locator: Locator) =>
  locator.locator("xpath=ancestor::div[contains(@class,'paper-sheet')][1]");

type Representative = {
  type: string;
  slug: string;
  board: (page: Page) => Locator;
  /** A sheet or list stands in for a board; no size floor applies. */
  sheet?: boolean;
  /** The audit's smaller boards (section 7): the shorter side must still reach this. */
  floors?: Partial<Record<1440 | 1280, number>>;
};

const grid = (page: Page) => page.locator("[role=grid]").first();
const solver = (page: Page) => page.getByTestId("solver");

const REPRESENTATIVES: Representative[] = [
  { type: "acrostic", slug: "cold-coffee", sheet: true, board: (p) => p.locator("[aria-label='The letter']") },
  { type: "anagram", slug: "crossing-point", sheet: true, board: (p) => p.locator("[aria-label=Anagram]") },
  { type: "book-cipher", slug: "bowerbird-nest", sheet: true, board: (p) => p.locator("section[aria-label*=', page ']") },
  { type: "caesar", slug: "lamp-oil", sheet: true, board: (p) => p.getByTestId("ciphertext").locator("..") },
  { type: "cctv-maze", slug: "backs-path", board: grid },
  { type: "chess-problem", slug: "a-quiet-word", board: (p) => p.locator("[aria-label='Chess board']") },
  { type: "circle9", slug: "false-trail", board: grid },
  { type: "crossword", slug: "stage-door", board: grid },
  { type: "detective-scene", slug: "cambridge-night", floors: { 1440: 510 }, board: (p) => p.locator("[aria-label='The street scene']") },
  { type: "fillomino", slug: "borrowed-time", board: grid },
  { type: "futoshiki", slug: "balance-sheet", floors: { 1440: 477 }, board: grid },
  { type: "gear-train", slug: "big-wheel", floors: { 1440: 432 }, board: (p) => p.locator("[aria-label=Pegboard]") },
  { type: "kakuro", slug: "blind-sum", board: grid },
  { type: "keyword", slug: "blotting-paper", sheet: true, board: (p) => p.getByTestId("ciphertext").locator("..") },
  { type: "knights-knaves", slug: "by-the-fire", sheet: true, board: (p) => solver(p).locator("p.text-lg") },
  { type: "logic-grid", slug: "cold-frame", board: (p) => p.locator("[aria-label='Logic grid']") },
  { type: "napkin-maths", slug: "bar-tab", sheet: true, board: (p) => p.locator("[aria-label='Napkin workings']") },
  { type: "nonogram", slug: "blind-spot", board: grid },
  { type: "norinori", slug: "cold-case", board: grid },
  { type: "odd-one-out", slug: "concert-programme", sheet: true, board: (p) => solver(p).locator("fieldset") },
  { type: "pictogram-cipher", slug: "chalk-marks", sheet: true, board: (p) => p.getByTestId("ciphertext").locator("..") },
  { type: "railroad", slug: "branch-line", floors: { 1440: 360, 1280: 360 }, board: grid },
  { type: "reflections", slug: "double-take", floors: { 1440: 432 }, board: (p) => sheetOf(grid(p)) },
  { type: "reverse-chess", slug: "bishop-taken", board: (p) => p.locator("[aria-label='Chess board']") },
  { type: "reverse-chess", slug: "four-steps", board: (p) => p.locator("[aria-label='Chess board']") },
  { type: "rota", slug: "canteen-queue", floors: { 1440: 388 }, board: (p) => p.getByTestId("rota-board") },
  { type: "sightlines", slug: "chapel-aisle", board: grid },
  { type: "star-battle", slug: "double-bill", board: grid },
  { type: "sudoku", slug: "back-page", board: grid },
  { type: "troix", slug: "cross-and-circle", floors: { 1440: 477 }, board: grid },
  { type: "word-ladder", slug: "coin-toss", sheet: true, board: (p) => solver(p).locator("ol").first().locator("..") },
  { type: "word-search", slug: "long-vacation", board: grid },
  { type: "word-wheel", slug: "dead-hours", floors: { 1440: 384 }, board: (p) => p.locator("[aria-label='Wheel letters']") },
];

const registryKeys = [
  ...readFileSync("src/puzzles/registry.ts", "utf8").matchAll(
    /^ {2}"?([a-z0-9-]+)"?: \w+Module,$/gm,
  ),
].map((match) => match[1]);

test("every registered type is in exactly one layout group", () => {
  expect(registryKeys.length).toBeGreaterThan(30);
  for (const key of registryKeys) {
    const groups = [panelSolveTypes, boardOnlySolveTypes, excludedSolveTypes]
      .filter((group) => group.has(key));
    expect(groups, `${key} must be in one group`).toHaveLength(1);
  }
  const represented = new Set(REPRESENTATIVES.map(({ type }) => type));
  for (const key of registryKeys) {
    if (excludedSolveTypes.has(key)) continue;
    expect(represented.has(key), `${key} needs a representative`).toBe(true);
  }
});

const chrome = (page: Page) => ({
  check: page.getByRole("button", { name: "Check", exact: true }),
  reset: page.getByRole("button", { name: "Reset", exact: true }),
  status: page.locator("section[data-solve-mode] > [role=status]"),
});

const bottomOf = (b: Box) => b.y + b.height;

for (const viewport of VIEWPORTS) {
  test.describe(`fits ${viewport.width}x${viewport.height}`, () => {
    test.use({ viewport });

    for (const rep of REPRESENTATIVES) {
      test(`${rep.type} ${rep.slug}`, async ({ page }) => {
        await openPuzzle(page, { typeKey: rep.type, slug: rep.slug });
        const board = rep.board(page);
        await expect(board.first()).toBeVisible();
        const { check, reset, status } = chrome(page);
        const boardBox = await box(board.first());
        const checkBox = await box(check);
        const resetBox = await box(reset);
        const statusBox = await box(status);

        expect(await page.evaluate(() => window.scrollY)).toBe(0);
        for (const [name, b] of Object.entries({
          board: boardBox,
          check: checkBox,
          reset: resetBox,
          status: statusBox,
        })) {
          expect(bottomOf(b), `${name} bottom`).toBeLessThanOrEqual(
            viewport.height,
          );
        }

        if (panelSolveTypes.has(rep.type)) {
          expect(checkBox.x, "panel left of the board's right edge").toBeGreaterThan(
            boardBox.x + boardBox.width - 1,
          );
        }

        if (!rep.sheet) {
          const floor =
            rep.floors?.[viewport.width as 1440 | 1280] ??
            (viewport.width === 1440 ? 520 : 400);
          const shorter = Math.min(boardBox.width, boardBox.height);
          expect(
            shorter,
            `${rep.type} board ${Math.round(boardBox.width)}x${Math.round(boardBox.height)}`,
          ).toBeGreaterThanOrEqual(floor - 2);
        }
      });
    }
  });
}

test.describe("journeys at 1280x650", () => {
  test.use({ viewport: { width: 1280, height: 650 } });

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      const w = window as unknown as { __maxScroll: number };
      w.__maxScroll = 0;
      window.addEventListener("scroll", () => {
        w.__maxScroll = Math.max(w.__maxScroll, window.scrollY);
      });
    });
  });

  async function expectSolvedInView(page: Page) {
    const viewport = page.viewportSize()!;
    const footer = page.getByTestId("solved-footer");
    await expect(footer).toBeVisible();
    await expect(page.getByText(/Solved in/)).toBeVisible();
    await page.waitForTimeout(800);
    for (const target of [
      page.getByTestId("solved-stamp"),
      page.getByText(/Solved in/),
    ]) {
      const b = await box(target);
      expect(b.y).toBeGreaterThanOrEqual(0);
      expect(bottomOf(b)).toBeLessThanOrEqual(viewport.height);
    }
    expect(
      await page.evaluate(() => ({
        y: window.scrollY,
        max: (window as unknown as { __maxScroll: number }).__maxScroll,
        inFooter: !!document.activeElement?.closest(
          "[data-testid=solved-footer]",
        ),
      })),
    ).toEqual({ y: 0, max: 0, inFooter: true });
  }

  const dragPiece = async (page: Page, from: string, to: string) => {
    const square = (name: string) =>
      page.locator(`[role="group"][aria-label^="${name},"]`);
    const source = await box(square(from));
    const target = await box(square(to));
    await page.mouse.move(source.x + source.width / 2, source.y + source.height / 2);
    await page.mouse.down();
    await page.mouse.move(
      target.x + target.width / 2,
      target.y + target.height / 2,
      { steps: 10 },
    );
    await page.mouse.up();
  };

  type Unwind = typeof fourSteps | typeof theLongWalk;
  async function enterUnwind(page: Page, puzzle: Unwind) {
    let colour = puzzle.fen.split(" ")[1] === "w" ? "White" : "Black";
    const steps = page.getByTestId("retro-step");
    for (const [index, ply] of puzzle.solutionPlies.entries()) {
      const from = `${ply.fromFile}${ply.fromRank}`;
      const to = `${ply.toFile}${ply.toRank}`;
      await expect(async () => {
        if ((await steps.count()) <= index) {
          await dragPiece(page, to, from);
        }
        await expect(steps).toHaveCount(index + 1, { timeout: 2000 });
      }).toPass({ timeout: 20_000 });
      if ("uncapture" in ply && ply.uncapture) {
        const radio = page.getByRole("radio", { name: `${colour} ${ply.uncapture}` });
        await expect(async () => {
          await radio.click();
          await expect(radio).toBeChecked({ timeout: 1000 });
        }).toPass({ timeout: 15_000 });
      }
      if (ply.unpromote) {
        await page.getByRole("button", { name: "Unpromote" }).click();
      }
      colour = colour === "White" ? "Black" : "White";
    }
  }

  test("Reverse Chess last_move: play, check, solved in view", async ({ page }) => {
    const puzzle = await uncapturePuzzle();
    await openPuzzle(page, puzzle);
    await expect(page.getByTestId("side-to-move")).toBeVisible();
    await expect(async () => {
      await dragPiece(page, puzzle.to, puzzle.from);
      await expect(page.getByRole("button", { name: "Undo" })).toBeEnabled({
        timeout: 1000,
      });
    }).toPass({ timeout: 15_000 });
    const radio = page.getByRole("radio", {
      name: `${puzzle.sideToMove} ${puzzle.uncapture}`,
    });
    await expect(async () => {
      await radio.click();
      await expect(radio).toBeChecked({ timeout: 1000 });
    }).toPass({ timeout: 15_000 });
    await clickCheck(page);
    await expectSolvedInView(page);
  });

  test("Reverse Chess unwind: play, check, solved in view", async ({ page }) => {
    await openPuzzle(page, { typeKey: "reverse-chess", slug: "four-steps" });
    await enterUnwind(page, fourSteps);
    await clickCheck(page);
    await expectSolvedInView(page);
  });

  test("chess problem: play, check, solved in view", async ({ page }) => {
    await openPuzzle(page, { typeKey: "chess-problem", slug: "a-quiet-word" });
    const board = page.getByRole("application", { name: "Chess board" });
    await expect(board).toBeVisible();
    await board.focus();
    const press = async (from: string, to: string) => {
      const dx = to.charCodeAt(0) - from.charCodeAt(0);
      const dy = Number(to[1]) - Number(from[1]);
      for (let i = 0; i < Math.abs(dx); i++) {
        await page.keyboard.press(dx > 0 ? "ArrowRight" : "ArrowLeft");
      }
      for (let i = 0; i < Math.abs(dy); i++) {
        await page.keyboard.press(dy > 0 ? "ArrowUp" : "ArrowDown");
      }
      await page.keyboard.press("Enter");
    };
    await press("e4", "c2");
    await press("c2", "c6");
    await expect(page.getByTestId("line-ply")).toHaveCount(2);
    await press("c6", "c6");
    await press("c6", "b7");
    await expect(page.getByTestId("line-ply")).toHaveCount(3);
    await expectSolvedInView(page);
  });

  test("gear train: place the cog, check, solved in view", async ({ page }) => {
    await openPuzzle(page, { typeKey: "gear-train", slug: "big-wheel" });
    const [cog] = bigWheel.solution;
    await page
      .getByRole("button", { name: new RegExp(`^${cog.teeth}-tooth cog`) })
      .click();
    const b = await box(page.locator("[aria-label=Pegboard]"));
    await page.mouse.click(
      b.x + ((cog.col + 0.5) / bigWheel.cols) * b.width,
      b.y + ((cog.row + 0.5) / bigWheel.rows) * b.height,
    );
    await expect(page.getByTestId("train-status")).toContainText(
      "Every cog is needed",
    );
    await clickCheck(page);
    await expectSolvedInView(page);
  });

  test("crossword: the active clue stays in view, then solve, check, solved in view", async ({
    page,
  }) => {
    await openPuzzle(page, { typeKey: "crossword", slug: "stage-door" });
    const cells = crosswordStageDoor.cells;
    const last = cells[cells.length - 1];
    await crosswordCell(page, last).click();
    await expect
      .poll(() => clueInView(page))
      .toBe(true);
    for (const cell of cells) {
      await crosswordCell(page, cell).click();
      await page.keyboard.type(cell.letter);
    }
    await clickCheck(page);
    await expectSolvedInView(page);
  });

  async function clueInView(page: Page) {
    return page.evaluate(() => {
      const current = document.querySelector("ol button[aria-current=true]");
      const list = current?.closest("ol");
      if (!current || !list) return false;
      const c = current.getBoundingClientRect();
      const l = list.getBoundingClientRect();
      return c.top >= l.top - 1 && c.bottom <= l.bottom + 1;
    });
  }

  test("AC6: the 14-ply unwind chain scrolls inside the panel", async ({ page }) => {
    await openPuzzle(page, { typeKey: "reverse-chess", slug: "the-long-walk" });
    await enterUnwind(page, theLongWalk);
    await expect(page.getByTestId("retro-step")).toHaveCount(14);
    await expect
      .poll(() =>
        page.evaluate(() => {
          const scroller = document.querySelector<HTMLElement>("[data-panel-scroll]")!;
          const steps = document.querySelectorAll("[data-testid=retro-step]");
          const last = steps[steps.length - 1].getBoundingClientRect();
          return last.bottom <= scroller.getBoundingClientRect().bottom + 1;
        }),
      )
      .toBe(true);
    const result = await page.evaluate(() => {
      const scroller = document.querySelector<HTMLElement>("[data-panel-scroll]")!;
      const steps = document.querySelectorAll("[data-testid=retro-step]");
      const last = steps[steps.length - 1].getBoundingClientRect();
      const s = scroller.getBoundingClientRect();
      return {
        scrollY: window.scrollY,
        overflow:
          document.documentElement.scrollHeight - window.innerHeight,
        scrolls: scroller.scrollHeight > scroller.clientHeight,
        lastInView: last.top >= s.top - 1 && last.bottom <= s.bottom + 1,
      };
    });
    expect(result.scrollY).toBe(0);
    expect(result.overflow).toBeLessThanOrEqual(PHONE_FOOTER + 2);
    expect(result.scrolls).toBe(true);
    expect(result.lastInView).toBe(true);
  });

  test("AC6: the 15x15 crossword's clue lists scroll inside the panel", async ({
    page,
  }) => {
    await openPuzzle(page, { typeKey: "crossword", slug: "fine-print" });
    const cells = crosswordFinePrint.cells;
    await crosswordCell(page, cells[cells.length - 1]).click();
    await expect.poll(() => clueInView(page)).toBe(true);
    const result = await page.evaluate(() => ({
      scrollY: window.scrollY,
      overflow: document.documentElement.scrollHeight - window.innerHeight,
      listScrolls: [...document.querySelectorAll("ol")].some(
        (list) => list.scrollHeight > list.clientHeight + 1 && list.clientHeight > 0,
      ),
    }));
    expect(result.scrollY).toBe(0);
    expect(result.overflow).toBeLessThanOrEqual(PHONE_FOOTER + 2);
    expect(result.listScrolls).toBe(true);
  });

  test("AC7: a wrong logic grid brings its wrong pairs into view in the panel", async ({
    page,
  }) => {
    await openPuzzle(page, { typeKey: "logic-grid", slug: "manifest" });
    const [first, second] = manifest.solution;
    const swapped = [
      [first[0], ...second.slice(1)],
      [second[0], ...first.slice(1)],
      ...manifest.solution.slice(2),
    ];
    const pair = (a: string, b: string) =>
      page.getByRole("gridcell", { name: new RegExp(`^${a} × ${b}: `) });
    for (const row of swapped) {
      for (let a = 0; a < row.length; a++) {
        for (let b = a + 1; b < row.length; b++) {
          const target = pair(row[a], row[b]);
          await target.click();
          await target.click();
        }
      }
    }
    await page.getByRole("radio", { name: /clue 1$/ }).check();
    const scroller = page.locator("[data-panel-scroll]").first();
    await scroller.evaluate((el) => (el.scrollTop = el.scrollHeight));
    await clickCheck(page);
    await expect(
      page.locator("section[data-solve-mode] > [role=status]"),
    ).toContainText(/parts? (is|are) marked wrong/);
    await expect
      .poll(() =>
        page.evaluate(() => {
          const scroller = document.querySelector("[data-panel-scroll]")!;
          const list = [...scroller.querySelectorAll("ul")].find((ul) =>
            /is wrong/.test(ul.textContent ?? ""),
          );
          if (!list) return false;
          const l = list.getBoundingClientRect();
          const s = scroller.getBoundingClientRect();
          return l.top >= s.top - 1 && l.bottom <= s.bottom + 1;
        }),
      )
      .toBe(true);
    expect(await page.evaluate(() => window.scrollY)).toBe(0);
  });
});

test.describe("AC8: below 1024px with a fine pointer the layout is stacked", () => {
  test.use({ viewport: { width: 1000, height: 800 } });

  for (const [typeKey, slug, board] of [
    ["reverse-chess", "four-steps", "[aria-label='Chess board']"],
    ["crossword", "stage-door", "[role=grid]"],
  ] as const) {
    test(`${typeKey} is one column`, async ({ page }) => {
      await openPuzzle(page, { typeKey, slug });
      const boardBox = await box(page.locator(board).first());
      const checkBox = await box(chrome(page).check);
      expect(checkBox.y).toBeGreaterThanOrEqual(boardBox.y + boardBox.height - 1);
      expect(
        await page
          .locator("section[data-solve-mode]")
          .evaluate((el) => getComputedStyle(el).display),
      ).not.toBe("grid");
    });
  }
});

test.describe("AC9: no board shifts when it hydrates", () => {
  const viewport = { width: 1440, height: 800 };
  test.use({ viewport });

  for (const [typeKey, slug, placeholder, loaded] of [
    [
      "reverse-chess",
      "four-steps",
      "[data-testid=solver] div[aria-hidden=true].aspect-square",
      "[aria-label='Chess board']",
    ],
    ["sudoku", "back-page", "[role=grid]", "[role=grid]"],
  ] as const) {
    test(`${typeKey}: placeholder box equals the board's`, async ({
      browser,
      page,
    }) => {
      const bare = await browser.newContext({ viewport });
      await bare.route(/\/_next\/static\/.*\.js/, (route) => route.abort());
      const staticPage = await bare.newPage();
      await staticPage.goto(`/puzzles/${typeKey}/${slug}`);
      const before = await box(staticPage.locator(placeholder).first());
      await bare.close();

      await openPuzzle(page, { typeKey, slug });
      const after = await box(page.locator(loaded).first());
      for (const key of ["x", "y", "width", "height"] as const) {
        expect(Math.abs(before[key] - after[key]), key).toBeLessThanOrEqual(1);
      }
    });
  }
});
