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
import { signUp, uniqueEmail } from "./helpers/auth";
import { uncapturePuzzle } from "./helpers/content";
import { completeAttemptFor, databaseAvailable } from "./helpers/db";
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
  /** The audit's smaller boards (section 7): the shorter side is this size, not the usual floor. Railroad's grid includes its count band. */
  sizes?: Partial<Record<1440 | 1280, number>>;
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
  { type: "detective-scene", slug: "cambridge-night", board: (p) => p.locator("[aria-label='The street scene']") },
  { type: "fillomino", slug: "borrowed-time", board: grid },
  { type: "futoshiki", slug: "balance-sheet", sizes: { 1440: 477 }, board: grid },
  { type: "gears", slug: "final-curtain", board: (p) => p.getByRole("group", { name: "Gear floor" }) },
  { type: "gear-train", slug: "big-wheel", sizes: { 1440: 432 }, board: (p) => p.locator("[aria-label=Pegboard]") },
  { type: "kakuro", slug: "blind-sum", board: grid },
  { type: "keyword", slug: "blotting-paper", sheet: true, board: (p) => p.getByTestId("ciphertext").locator("..") },
  { type: "knights-knaves", slug: "by-the-fire", sheet: true, board: (p) => solver(p).locator("ol").first() },
  { type: "logic-grid", slug: "cold-frame", board: (p) => p.locator("[aria-label='Logic grid']") },
  { type: "napkin-maths", slug: "bar-tab", sheet: true, board: (p) => p.locator("[aria-label='Napkin workings']") },
  { type: "nonogram", slug: "blind-spot", board: grid },
  { type: "norinori", slug: "cold-case", board: grid },
  { type: "odd-one-out", slug: "concert-programme", sheet: true, board: (p) => solver(p).locator("fieldset") },
  { type: "pictogram-cipher", slug: "chalk-marks", sheet: true, board: (p) => p.getByTestId("ciphertext").locator("..") },
  { type: "railroad", slug: "branch-line", sizes: { 1440: 402, 1280: 402 }, board: grid },
  { type: "reflections", slug: "double-take", board: (p) => sheetOf(grid(p)) },
  { type: "reverse-chess", slug: "bishop-taken", board: (p) => p.locator("[aria-label='Chess board']") },
  { type: "reverse-chess", slug: "four-steps", board: (p) => p.locator("[aria-label='Chess board']") },
  { type: "rota", slug: "canteen-queue", board: (p) => p.getByTestId("rota-board") },
  { type: "sightlines", slug: "chapel-aisle", board: grid },
  { type: "star-battle", slug: "double-bill", board: grid },
  { type: "sudoku", slug: "back-page", board: grid },
  { type: "troix", slug: "cross-and-circle", sizes: { 1440: 477 }, board: grid },
  { type: "word-ladder", slug: "coin-toss", sheet: true, board: (p) => solver(p).locator("ol").first().locator("..") },
  { type: "word-search", slug: "long-vacation", board: grid },
  { type: "word-wheel", slug: "dead-hours", board: (p) => p.locator("[aria-label='Wheel letters']") },
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

/** Pairs of the solve grid's own items (through `display: contents` wrappers) that share space. */
const overlappingCells = (page: Page) =>
  page.locator("section[data-solve-mode]").evaluate((section) => {
    const items = [...section.querySelectorAll<HTMLElement>("*")].filter(
      (element) => {
        const style = getComputedStyle(element);
        if (["contents", "none"].includes(style.display)) return false;
        if (["absolute", "fixed"].includes(style.position)) return false;
        let parent = element.parentElement;
        while (
          parent &&
          parent !== section &&
          getComputedStyle(parent).display === "contents"
        ) {
          parent = parent.parentElement;
        }
        return parent === section;
      },
    );
    const boxes = items
      .map((element) => ({
        name: (element.textContent ?? "").trim().slice(0, 30),
        box: element.getBoundingClientRect(),
      }))
      .filter(({ box }) => box.width > 1 && box.height > 1);
    return boxes.flatMap((a, index) =>
      boxes
        .slice(index + 1)
        .filter(
          (b) =>
            Math.min(a.box.right, b.box.right) -
              Math.max(a.box.left, b.box.left) >
              1 &&
            Math.min(a.box.bottom, b.box.bottom) -
              Math.max(a.box.top, b.box.top) >
              1,
        )
        .map((b) => `"${a.name}" over "${b.name}"`),
    );
  });

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

        if (panelSolveTypes.has(rep.type)) {
          expect(await overlappingCells(page), "grid cells overlap").toEqual([]);
        }

        if (!rep.sheet) {
          const width = viewport.width as 1440 | 1280;
          const shorter = Math.min(boardBox.width, boardBox.height);
          const label = `${rep.type} board ${Math.round(boardBox.width)}x${Math.round(boardBox.height)}`;
          const size = rep.sizes?.[width];
          if (size) {
            expect(Math.abs(shorter - size), label).toBeLessThanOrEqual(3);
          } else {
            expect(shorter, label).toBeGreaterThanOrEqual(
              (width === 1440 ? 520 : 400) - 2,
            );
          }
        }
      });
    }
  });
}

async function shotBothThemes(page: Page, name: string) {
  if (!process.env.LAYOUT_SHOTS) return;
  for (const theme of ["paper", "ink"]) {
    await page.evaluate(
      (value) => document.documentElement.setAttribute("data-theme", value),
      theme,
    );
    await page.screenshot({ path: `.verification/T170/${name}-${theme}.png` });
  }
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
    await shotBothThemes(page, "unwind-midgame-1280x650");
    await clickCheck(page);
    await expectSolvedInView(page);
    await shotBothThemes(page, "unwind-solved-1280x650");
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
      const list = current?.closest("[data-panel-scroll]");
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
    const rows = await page.evaluate(() => {
      const scroller = document.querySelector<HTMLElement>("[data-panel-scroll]")!;
      scroller.scrollTop = 0;
      const s = scroller.getBoundingClientRect();
      return [...scroller.querySelectorAll("li")]
        .map((li) => li.getBoundingClientRect())
        .filter((b) => b.top < s.bottom - 3)
        .map((b) => b.bottom <= s.bottom + 0.5);
    });
    expect(rows.length, "whole plies in view").toBeGreaterThanOrEqual(2);
    expect(rows.every(Boolean), "no ply is half cut").toBe(true);
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
      listScrolls: [...document.querySelectorAll("[data-panel-scroll]")].some(
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
    await clickCheck(page);
    await expect(
      page.locator("section[data-solve-mode] > [role=status]"),
    ).toContainText(/parts? (is|are) marked wrong/);
    await expect
      .poll(() =>
        page.evaluate(() => {
          const list = [...document.querySelectorAll("ul")].find((ul) =>
            /is wrong/.test(ul.textContent ?? ""),
          );
          if (!list) return false;
          const l = list.getBoundingClientRect();
          return l.top >= 0 && l.bottom <= window.innerHeight;
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
      await expect(staticPage.locator(placeholder).first()).toBeVisible();
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

const LARGE_CASES: Pick<Representative, "type" | "slug" | "board">[] = [
  { type: "logic-grid", slug: "manifest", board: (p) => p.locator("[aria-label='Logic grid']") },
  { type: "knights-knaves", slug: "night-ferry", board: (p) => solver(p).locator("ol").first() },
  { type: "rota", slug: "the-long-shift", board: (p) => p.getByTestId("rota-board") },
  { type: "crossword", slug: "fine-print", board: grid },
  { type: "reverse-chess", slug: "the-long-walk", board: (p) => p.locator("[aria-label='Chess board']") },
  { type: "word-search", slug: "wound-up", board: grid },
  { type: "pictogram-cipher", slug: "first-drawing", board: (p) => p.getByTestId("ciphertext").locator("..") },
];

type PanelMeasure = {
  scrollers: { name: string; bar: number; paddingRight: number; tagged: boolean; pageText: boolean }[];
  contentToCheck: number | null;
  clipped: string[];
  checkToStatus: number;
  statusToFooterRule: number;
  columnsEndGap: number | null;
};

/** Everything the panel-and-spacing rules assert, measured in the page. */
const measurePanel = (page: Page) =>
  page.evaluate<PanelMeasure>(() => {
    const section = document.querySelector("section[data-solve-mode]")!;
    const visible = (element: Element) =>
      (element as HTMLElement).checkVisibility({ checkVisibilityCSS: true });
    const check = [...section.querySelectorAll("button")].find(
      (b) => b.textContent === "Check" && visible(b),
    )!;
    const status = section.querySelector(":scope > [role=status]")!;
    const checkBox = check.getBoundingClientRect();
    const statusBox = status.getBoundingClientRect();
    const scrollers = [...section.querySelectorAll<HTMLElement>("*")]
      .filter((element) => {
        const style = getComputedStyle(element);
        return (
          visible(element) &&
          ["auto", "scroll"].includes(style.overflowY) &&
          element.scrollHeight > element.clientHeight + 1
        );
      })
      .map((element) => {
        const style = getComputedStyle(element);
        return {
          name: element.getAttribute("aria-label") ?? element.tagName,
          bar: parseFloat(getComputedStyle(element, "::-webkit-scrollbar").width),
          paddingRight: parseFloat(style.paddingRight),
          tagged: element.hasAttribute("data-panel-scroll"),
          pageText: element.getAttribute("aria-label") === "Page text",
        };
      });
    let contentBottom = -Infinity;
    const clipped: string[] = [];
    for (const element of section.querySelectorAll<HTMLElement>("[data-testid=solver] *")) {
      if (!visible(element)) continue;
      const box = element.getBoundingClientRect();
      if (box.width <= 1 || box.height <= 1) continue;
      if (box.left < checkBox.left - 1) continue;
      const inside = element.closest("[data-panel-scroll]");
      if (inside && inside !== element) continue;
      const cast = element.classList.contains("paper-sheet") ? 3 : 0;
      contentBottom = Math.max(contentBottom, box.bottom + cast);
      for (let parent = element.parentElement; parent && parent !== section; parent = parent.parentElement) {
        if (getComputedStyle(parent).overflowY === "visible") continue;
        const edge = parent.getBoundingClientRect();
        if (edge.height > 1 && (box.bottom > edge.bottom + 1 || box.top < edge.top - 1)) {
          clipped.push(`${element.tagName} "${(element.textContent ?? "").slice(0, 30)}"`);
        }
        break;
      }
    }
    const footer = document.querySelector("footer:not([data-testid])");
    const footerTop = footer ? footer.getBoundingClientRect().top : window.innerHeight;
    const boardCell = section.querySelector<HTMLElement>("[class*='panel:col-start-1']");
    return {
      scrollers,
      contentToCheck: Number.isFinite(contentBottom) ? checkBox.top - contentBottom : null,
      clipped,
      checkToStatus: statusBox.top - checkBox.bottom,
      statusToFooterRule: footerTop - statusBox.bottom,
      columnsEndGap: boardCell ? Math.abs(boardCell.getBoundingClientRect().bottom - statusBox.bottom) : null,
    };
  });

for (const viewport of VIEWPORTS) {
  test.describe(`panel rules ${viewport.width}x${viewport.height}`, () => {
    test.use({ viewport });

    for (const rep of [...REPRESENTATIVES, ...LARGE_CASES]) {
      if (!panelSolveTypes.has(rep.type) && !boardOnlySolveTypes.has(rep.type)) continue;
      test(`${rep.type} ${rep.slug}: spacing and scroll areas`, async ({ page, browserName }) => {
        await openPuzzle(page, { typeKey: rep.type, slug: rep.slug });
        await expect(rep.board(page).first()).toBeVisible();
        await page.waitForTimeout(500);
        const m = await measurePanel(page);
        expect(m.checkToStatus, "Check to status").toBeGreaterThanOrEqual(11);
        expect(m.statusToFooterRule, "status to the site footer's rule").toBeGreaterThanOrEqual(23);
        if (panelSolveTypes.has(rep.type)) {
          expect(m.contentToCheck, "last panel content to Check").toBeGreaterThanOrEqual(15);
          expect(m.clipped, "panel elements cut by an ancestor's edge").toEqual([]);
          if (m.columnsEndGap !== null) {
            expect(m.columnsEndGap, "board column and panel end together").toBeLessThanOrEqual(1);
          }
        }
        const inPanel = m.scrollers.filter(({ pageText }) => !pageText);
        expect(inPanel.length, `scroll areas in the panel: ${inPanel.map((s) => s.name)}`).toBeLessThanOrEqual(1);
        for (const scroller of m.scrollers) {
          expect(scroller.tagged || scroller.pageText, `${scroller.name} is a shared scroll area`).toBe(true);
          if (browserName !== "firefox") {
            expect(scroller.bar, `${scroller.name} bar width`).toBe(10);
          }
          expect(scroller.paddingRight, `${scroller.name} padding to the bar`).toBe(12);
        }
      });
    }
  });
}

test.describe("AC4: the crossword shows one clue list at a time", () => {
  test.use({ viewport: { width: 1280, height: 650 } });

  const openLists = (page: Page) =>
    page.locator("details[name=crossword-clues][open] > summary").allTextContents();

  const activeClueVisible = (page: Page) =>
    page.evaluate(() => {
      const current = document.querySelector("details[open] button[aria-current=true]");
      const list = current?.closest("[data-panel-scroll]");
      if (!current || !list) return false;
      const c = current.getBoundingClientRect();
      const l = list.getBoundingClientRect();
      return c.top >= l.top - 1 && c.bottom <= l.bottom + 1;
    });

  for (const [slug, content] of [
    ["stage-door", crosswordStageDoor],
    ["fine-print", crosswordFinePrint],
  ] as const) {
    test(`${slug}: the open list follows the grid's direction and the caret sets it`, async ({ page }) => {
      const lists = page.locator("details[name=crossword-clues]").getByRole("list");
      const direction = () =>
        page.locator("details[name=crossword-clues][open] button[aria-current=true]").count();
      await openPuzzle(page, { typeKey: "crossword", slug });
      await expect.poll(() => openLists(page)).toEqual(["across"]);
      await expect(lists).toHaveCount(1);
      const crossing = content.cells.find(
        (cell) =>
          content.cells.some((other) => other.row === cell.row && other.col === cell.col + 1) &&
          content.cells.some((other) => other.col === cell.col && other.row === cell.row + 1),
      )!;
      await crosswordCell(page, crossing).click();
      await expect.poll(() => activeClueVisible(page)).toBe(true);
      await page.keyboard.press("Space");
      await expect.poll(() => openLists(page)).toEqual(["down"]);
      await expect(lists).toHaveCount(1);
      await expect.poll(() => activeClueVisible(page)).toBe(true);

      const lastDown = page.locator("details[name=crossword-clues][open] ol button").last();
      await lastDown.click();
      await expect(lastDown).toHaveAttribute("aria-current", "true");
      await expect.poll(() => openLists(page)).toEqual(["down"]);
      await expect.poll(() => activeClueVisible(page)).toBe(true);

      await page.locator("details[name=crossword-clues] > summary", { hasText: "across" }).click();
      await expect.poll(() => openLists(page)).toEqual(["across"]);
      await expect(lists).toHaveCount(1);
      await expect.poll(direction).toBe(1);
      await expect.poll(() => activeClueVisible(page)).toBe(true);
      const scrollers = (await measurePanel(page)).scrollers;
      expect(scrollers.length, "one clue list is the only scroller").toBeLessThanOrEqual(1);
      expect(await page.evaluate(() => window.scrollY)).toBe(0);
    });
  }
});

const inViewport = (page: Page, selector: string) =>
  page.evaluate((css) => {
    const element = document.querySelector(css);
    if (!element) return false;
    const b = element.getBoundingClientRect();
    return b.top >= 0 && b.bottom <= window.innerHeight && b.height > 0;
  }, selector);

for (const viewport of [...VIEWPORTS, { width: 1440, height: 1000 }]) {
  test.describe(`AC5: blocks open at first read without scrolling at ${viewport.width}x${viewport.height}`, () => {
    test.use({ viewport });

    test("rota canteen-queue: the incident sheet and the five headers", async ({ page }) => {
      await openPuzzle(page, { typeKey: "rota", slug: "canteen-queue" });
      await expect(page.locator("details[name=rota-sections]")).toHaveCount(5);
      for (const summary of await page.locator("details[name=rota-sections] > summary").all()) {
        const b = await box(summary);
        expect(bottomOf(b)).toBeLessThanOrEqual(viewport.height);
      }
      await expect.poll(() => inViewport(page, "[data-testid=rota-brief]")).toBe(true);
      const clues = page.locator("details[name=rota-sections] > summary", { hasText: "Clues" });
      await clues.focus();
      await page.keyboard.press("Enter");
      await expect(page.locator("details[name=rota-sections][open]")).toHaveCount(1);
      await expect(page.getByTestId("clue-0")).toBeVisible();
      await page.locator("details[name=rota-sections] > summary", { hasText: "Unswaps" }).click();
      await expect(page.locator("details[name=rota-sections][open] > summary")).toHaveText(/Unswaps/);
      const { check, reset, status } = chrome(page);
      for (const target of [check, reset, status]) {
        expect(bottomOf(await box(target))).toBeLessThanOrEqual(viewport.height);
      }
    });

    test("logic-grid cold-frame: the open Clues list is the one scroller, in whole rows", async ({ page }) => {
      await openPuzzle(page, { typeKey: "logic-grid", slug: "cold-frame" });
      const clues = page.locator("details[open] [data-panel-scroll]");
      await expect(clues).toHaveCount(1);
      await page.waitForTimeout(500);
      const rows = await clues.evaluate((area) => {
        const a = area.getBoundingClientRect();
        return [...area.querySelectorAll("ol > li")]
          .map((li) => li.getBoundingClientRect())
          .filter((b) => b.top < a.bottom - 1)
          .map((b) => b.bottom <= a.bottom + 0.5);
      });
      expect(rows.every(Boolean), "no row is half cut").toBe(true);
      const notes = page.locator("details > summary", { hasText: "Case notes" });
      const accessibility = await page.context().newCDPSession(page);
      const expanded = async () => {
        const { nodes } = await accessibility.send("Accessibility.getFullAXTree");
        return nodes
          .find((node) => /^case notes$/i.test(node.name?.value ?? "") && node.properties?.some(({ name }) => name === "expanded"))
          ?.properties?.find(({ name }) => name === "expanded")?.value.value;
      };
      expect(await expanded(), "the closed caret is exposed as collapsed").toBe(false);
      await notes.focus();
      await page.keyboard.press("Space");
      await expect(page.getByTestId("logic-grid-brief")).toBeVisible();
      expect(await expanded(), "the open caret is exposed as expanded").toBe(true);
    });

    test("knights-knaves by-the-fire: the cards sit in the board cell", async ({ page }) => {
      await openPuzzle(page, { typeKey: "knights-knaves", slug: "by-the-fire" });
      const cards = page.getByTestId("solver").locator("ol > li");
      await expect(cards).toHaveCount(4);
      const cell = await box(page.locator("section[data-solve-mode] [class*='panel:col-start-1']").first());
      for (const card of await cards.all()) {
        const b = await box(card);
        expect(b.x).toBeGreaterThanOrEqual(cell.x - 1);
        expect(b.x + b.width).toBeLessThanOrEqual(cell.x + cell.width + 1);
        expect(bottomOf(b)).toBeLessThanOrEqual(bottomOf(cell) + 1);
      }
    });
  });
}

test.describe("AC6: a failed check opens the section with the wrong part", () => {
  test.use({ viewport: { width: 1280, height: 650 } });

  test("logic-grid manifest: Check opens Clues and the wrong pairs show", async ({ page }) => {
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
    const clues = page.locator("details", { has: page.locator("summary", { hasText: "Clues" }) });
    await clues.locator("summary").click();
    await expect(clues).not.toHaveAttribute("open", "");
    await clickCheck(page);
    await expect(clues).toHaveAttribute("open", "");
    await expect(chrome(page).status).toContainText(/parts? (is|are) marked wrong/);
    await expect.poll(() => page.evaluate(() => {
      const list = [...document.querySelectorAll("ul")].find((ul) => /is wrong/.test(ul.textContent ?? ""));
      const b = list?.getBoundingClientRect();
      return !!b && b.top >= 0 && b.bottom <= window.innerHeight;
    })).toBe(true);
  });

  test("rota canteen-queue: a restored rota that breaks a clue opens Clues with it in view", async ({ page }) => {
    const { content } = await import("../content/rota/canteen-queue");
    await openPuzzle(page, { typeKey: "rota", slug: "canteen-queue" });
    const token = (name: string) => page.getByTestId(`token-${name}`);
    const unswap = async (a: string, b: string) => {
      await token(a).click();
      await token(b).click();
    };
    const [{ a, b }] = [...content.solution.swaps].reverse();
    await unswap(a, b);
    await unswap(a, b);
    for (const step of [...content.solution.swaps].reverse()) await unswap(step.a, step.b);
    const clues = page.locator("details", { has: page.locator("summary", { hasText: "Clues" }) });
    await expect(clues).toHaveAttribute("open", "");
    await expect.poll(() => inViewport(page, "[data-broken]")).toBe(true);
    await page.locator("details > summary", { hasText: "Who insisted" }).click();
    await expect(clues).not.toHaveAttribute("open", "");
    await page.getByTestId("rota-accusation").getByRole("radio").first().check();
    await clickCheck(page);
    await expect(clues).toHaveAttribute("open", "");
    await expect.poll(() => inViewport(page, "[data-broken]")).toBe(true);
    await expect(chrome(page).status).toContainText("Not quite");
  });
});

for (const viewport of VIEWPORTS) {
  test.describe(`AC7: classic gears at ${viewport.width}x${viewport.height}`, () => {
    test.use({ viewport });

    const diagramMin = viewport.width === 1440 ? 576 : 474;

    async function expectBoardAndPanel(page: Page, fix: boolean) {
      const board = await box(page.getByRole("group", { name: "Gear floor" }));
      const { check, reset, status } = chrome(page);
      const checkBox = await box(check);
      expect(board.width, "diagram size").toBeGreaterThanOrEqual(diagramMin - 2);
      expect(checkBox.x, "panel right of the diagram").toBeGreaterThan(board.x + board.width - 1);
      const targets = [
        page.getByRole("slider", { name: "Dance scrubber" }),
        page.getByRole("button", { name: "Crank forward one tooth" }),
        page.getByRole("button", { name: /as table/i }),
        page.getByRole("button", { name: "Accuse", exact: true }),
        check,
        reset,
        status,
      ];
      if (fix) {
        targets.push(
          page.locator("details > summary", { hasText: "The brief" }),
          page.locator("details > summary", { hasText: "Adjust the diagram" }),
        );
      }
      for (const target of targets) {
        const b = await box(target);
        expect(bottomOf(b)).toBeLessThanOrEqual(viewport.height);
      }
      expect(await page.evaluate(() => window.scrollY)).toBe(0);
    }

    test("final-curtain: the largest diagram", async ({ page }) => {
      await openPuzzle(page, { typeKey: "gears", slug: "final-curtain" });
      await expectBoardAndPanel(page, false);
    });

    test("crossed-wires: Fix the Diagram keeps the brief and the swap panel header in view", async ({ page }) => {
      await openPuzzle(page, { typeKey: "gears", slug: "crossed-wires" });
      await expectBoardAndPanel(page, true);
      await page.locator("details > summary", { hasText: "Adjust the diagram" }).click();
      await expect(page.getByTestId("swap-panel")).toBeVisible();
      await expect(page.locator("details[name=gears-sections][open]")).toHaveCount(1);
      expect(bottomOf(await box(chrome(page).check))).toBeLessThanOrEqual(viewport.height);
    });

    test("today's daily", async ({ page }) => {
      await page.goto("/gears");
      const daily = page.locator('a[href^="/puzzles/gears/daily-"]').first();
      test.skip(!(await daily.isVisible()), "no daily drawn for today");
      await daily.click();
      await page.waitForURL(/\/puzzles\/gears\/daily-/);
      await page.waitForLoadState("networkidle");
      await expectBoardAndPanel(page, false);
    });

    test("a solved diagram shows its stamp and time in view, focus in the footer", async ({ page }) => {
      const { gearPuzzle } = await import("./helpers/content");
      const puzzle = await gearPuzzle(false);
      await openPuzzle(page, puzzle);
      const driver = page.getByRole("slider", { name: /^Driver gear/ });
      await expect(async () => {
        await driver.focus();
        await page.keyboard.press("Home");
        for (let turn = 0; turn < puzzle.crank; turn += 1) await page.keyboard.press("ArrowRight");
        await expect(page.getByTestId("crank")).toHaveText(String(puzzle.crank), { timeout: 1000 });
      }).toPass({ timeout: 15_000 });
      const scrubber = page.getByRole("slider", { name: "Dance scrubber" });
      await scrubber.focus();
      await page.keyboard.press("Home");
      for (let step = 1; step < puzzle.convergence; step += 1) {
        await page.keyboard.press("ArrowRight");
        await page.keyboard.press("ArrowRight");
      }
      await page.getByRole("button", { name: "Accuse", exact: true }).click();
      const dialog = page.getByRole("alertdialog");
      await dialog.getByRole("radio", { name: puzzle.killer }).check();
      await dialog.getByRole("button", { name: "Accuse", exact: true }).click();
      await expect(page.getByText(/Solved in/)).toBeVisible();
      await page.waitForTimeout(800);
      for (const target of [page.getByTestId("solved-stamp"), page.getByText(/Solved in/)]) {
        const b = await box(target);
        expect(b.y).toBeGreaterThanOrEqual(0);
        expect(bottomOf(b)).toBeLessThanOrEqual(viewport.height);
      }
      expect(await box(page.getByTestId("solved-hole"))).toMatchObject({ width: 216 });
      expect(
        await page.evaluate(() => ({
          y: window.scrollY,
          inFooter: !!document.activeElement?.closest("[data-testid=solved-footer]"),
        })),
      ).toEqual({ y: 0, inFooter: true });
    });
  });
}

/** Scroll areas and cut elements of a solved page, with the footer's parts against the viewport. */
const measureSolved = (page: Page) =>
  page.evaluate(() => {
    const section = document.querySelector("section[data-solve-mode]")!;
    const visible = (element: Element) =>
      (element as HTMLElement).checkVisibility({ checkVisibilityCSS: true });
    const below = (element: Element | null) =>
      element ? Math.round(element.getBoundingClientRect().bottom - window.innerHeight) : null;
    const footer = section.querySelector("[data-testid=solved-footer]")!;
    const scrollers = [...section.querySelectorAll<HTMLElement>("*")]
      .filter(
        (element) =>
          visible(element) &&
          ["auto", "scroll"].includes(getComputedStyle(element).overflowY) &&
          element.scrollHeight > element.clientHeight + 1,
      )
      .map((element) => element.getAttribute("data-testid") ?? element.getAttribute("aria-label") ?? element.tagName);
    const epilogue = section.querySelector<HTMLElement>("ol[data-testid=epilogue]");
    const area = epilogue?.getBoundingClientRect();
    return {
      scrollers,
      past: {
        stamp: below(section.querySelector("[data-testid=solved-stamp]")),
        time: below([...footer.querySelectorAll("p")].find((p) => /Solved in/.test(p.textContent ?? "")) ?? null),
        next: below(footer.querySelector("a")),
      },
      scrollY: window.scrollY,
      halfCutLines: epilogue && area
        ? [...epilogue.children].filter((line) => {
            const b = line.getBoundingClientRect();
            return b.top < area.bottom - 3 && b.bottom > area.bottom - 1.5;
          }).length
        : 0,
    };
  });

for (const viewport of VIEWPORTS) {
  test.describe(`AC9: the solved footer at ${viewport.width}x${viewport.height}`, () => {
    test.use({ viewport });

    test("every panel and board-only type shows its stamp, time and next link, and nothing scrolls", async ({ page }) => {
      test.skip(!databaseAvailable, "needs the local database for the completion rows");
      test.setTimeout(300_000);
      const cases = [...REPRESENTATIVES, ...LARGE_CASES].filter(
        ({ type }) => panelSolveTypes.has(type) || boardOnlySolveTypes.has(type),
      );
      const email = uniqueEmail("t175-solved");
      await signUp(page, email);
      for (const { type, slug } of cases) await completeAttemptFor(email, type, slug);
      for (const { type, slug } of cases) {
        await page.goto(`/puzzles/${type}/${slug}`);
        await expect(page.getByTestId("solved-footer"), `${type} ${slug}`).toBeVisible();
        await page.waitForTimeout(600);
        const m = await measureSolved(page);
        expect(m.past.stamp, `${type} ${slug}: stamp past the fold`).toBeLessThanOrEqual(0);
        expect(m.past.time, `${type} ${slug}: time past the fold`).toBeLessThanOrEqual(0);
        if (m.past.next !== null) {
          expect(m.past.next, `${type} ${slug}: Next in volume past the fold`).toBeLessThanOrEqual(0);
        }
        expect(
          m.scrollers.filter((name) => name !== "Page text"),
          `${type} ${slug}: scroll areas when solved`,
        ).toEqual([]);
        expect(m.scrollY, `${type} ${slug}: page scroll`).toBe(0);
      }
    });

    test("rota the-long-shift solved for real: the epilogue is the one scroll area, in whole lines", async ({ page }) => {
      const { content } = await import("../content/rota/the-long-shift");
      await openPuzzle(page, { typeKey: "rota", slug: "the-long-shift" });
      for (const { a, b } of [...content.solution.swaps].reverse()) {
        await page.getByTestId(`token-${a}`).click();
        await page.getByTestId(`token-${b}`).click();
      }
      await page.getByTestId("rota-accusation").getByLabel(content.solution.instigatorName).check();
      await clickCheck(page);
      await expect(page.getByTestId("epilogue")).toBeVisible();
      await page.waitForTimeout(1200);
      const m = await measureSolved(page);
      expect(m.past.stamp).toBeLessThanOrEqual(0);
      expect(m.past.time).toBeLessThanOrEqual(0);
      if (m.past.next !== null) expect(m.past.next).toBeLessThanOrEqual(0);
      expect(m.scrollers).toEqual(["epilogue"]);
      expect(m.halfCutLines, "no epilogue line is half cut").toBe(0);
      expect(m.scrollY).toBe(0);
    });
  });
}
