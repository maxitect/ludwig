import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { chromium, type Page } from "@playwright/test";
import pg from "pg";

/**
 * Measures the solve page of every puzzle type at the two desktop target sizes, with a fine pointer.
 * Run against a production build: `pnpm build && pnpm start --port 3169`, then
 * `pnpm tsx scripts/dev/audit-desktop-layout.mts [--sweep|--chrome|--grown|--footer] [--only <types>] [--base http://localhost:3169] [--out .verification/T169]`.
 * `--sweep` instead measures every published puzzle at 1280x650, without screenshots, to find the largest per type;
 * `--panel [--open-only]` the panel of every type and the largest growing cases (T174): scroll containers, clipped content, gaps, dead space and block heights, with Paper and Ink screenshots, open and solved; `--panel --widths` content height of the largest cases at panel widths of 24 to 48rem; `--panel --browsers` repeats four puzzles on Chromium and WebKit at 1280x650 and 1440x1000;
 * `--panel` prints whether the system drew classic or overlay scrollbars; only compare runs made in the same mode;
 * `--chrome` the chrome blocks, `--grown` the growing-panel cases and `--footer` the solved footer at panel widths.
 * `--only sudoku,crossword` limits the default run to those types.
 * The solved runs sign up a throwaway account, write to the database in `DATABASE_URL` and delete the account afterwards.
 * Each signs in once, and sign-in is limited to 5 in 15 minutes.
 */
const args = process.argv.slice(2);
const flag = (name: string, fallback: string) => {
  const at = args.indexOf(name);
  return at >= 0 ? args[at + 1] : fallback;
};
const base = flag("--base", "http://localhost:3169");
const out = flag("--out", ".verification/T169");
const sweep = args.includes("--sweep");
mkdirSync(out, { recursive: true });

if (!process.env.DATABASE_URL) process.loadEnvFile(".env.local");

const viewports = [
  { width: 1440, height: 800 },
  { width: 1280, height: 650 },
];

const registrySource = readFileSync("src/puzzles/registry.ts", "utf8");
const typeKeys = [
  ...registrySource.matchAll(/^ {2}"?([a-z0-9-]+)"?: \w+Module,$/gm),
].map((match) => match[1]);

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const { rows: puzzles } = await pool.query<{
  id: string;
  type_key: string;
  slug: string;
  mode: string | null;
}>(
  `select p.id, p.type_key, p.slug, null as mode
   from puzzles p left join volumes v on v.id = p.volume_id
   where p.published_at <= now()
   order by p.type_key, v.sort nulls last, p.volume_position nulls last, p.slug`,
);

const chessModes = new Map<string, string>();
for (const puzzle of puzzles.filter((p) => p.type_key === "reverse-chess")) {
  const source = readFileSync(`content/reverse-chess/${puzzle.slug}.ts`, "utf8");
  const mode = /mode: "([a-z_]+)"/.exec(source)?.[1];
  if (mode) chessModes.set(puzzle.slug, mode);
}

type Target = { key: string; typeKey: string; slug: string; id: string };
const only = flag("--only", "").split(",").filter(Boolean);
const targets: Target[] = [];
for (const typeKey of typeKeys) {
  if (only.length && !only.includes(typeKey)) continue;
  const mine = puzzles.filter((p) => p.type_key === typeKey);
  if (typeKey === "reverse-chess") {
    for (const mode of ["last_move", "unwind"]) {
      const first = mine.find((p) => chessModes.get(p.slug) === mode);
      if (first) targets.push({ key: `reverse-chess:${mode}`, typeKey, slug: first.slug, id: first.id });
    }
  } else if (mine[0]) {
    targets.push({ key: typeKey, typeKey, slug: mine[0].slug, id: mine[0].id });
  }
}

type Box = { top: number; bottom: number; left: number; right: number; width: number; height: number };
type Block = Box & { name: string; below: boolean };
type Measurement = {
  key: string;
  slug: string;
  viewport: string;
  state: "open" | "solved";
  docHeight: number;
  overflow: number;
  siteHeader: number;
  titleBlock: number;
  timerRow: number;
  controls: number;
  status: number;
  footerBlock: number;
  board: (Box & { how: string }) | null;
  check: Box | null;
  reset: Box | null;
  statusBox: Box | null;
  stamp: Box | null;
  stackedBelowBoard: number;
  blocks: Block[];
};

/** Runs in the page: boxes of the board, the solver's blocks and the chrome. */
const measureInPage = () => {
  const box = (el: Element | null): Box | null => {
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return {
      top: Math.round(r.top + scrollY),
      bottom: Math.round(r.bottom + scrollY),
      left: Math.round(r.left),
      right: Math.round(r.right),
      width: Math.round(r.width),
      height: Math.round(r.height),
    };
  };
  const describe = (el: Element) => {
    const label = el.getAttribute("aria-label") ?? el.getAttribute("data-testid") ?? el.getAttribute("role") ?? "";
    const heading = el.querySelector("h1,h2,h3,legend,summary")?.textContent?.trim().slice(0, 24) ?? "";
    return `${el.tagName.toLowerCase()}${label ? `[${label.slice(0, 28)}]` : ""}${heading ? ` "${heading}"` : ""}`;
  };
  const root = document.querySelector("[data-testid=solver]");
  const section = document.querySelector("section[data-solve-mode]");
  const titleHeader = section?.querySelector(":scope > header") ?? null;
  const siteHeader = [...document.querySelectorAll("header")].find((h) => !section?.contains(h)) ?? null;
  const timer = titleHeader?.querySelector("p.font-mono") ?? null;
  const buttons = [...document.querySelectorAll("button")].filter((b) => b.getBoundingClientRect().width > 0);
  const named = (text: string) => buttons.find((b) => b.textContent?.trim() === text) ?? null;
  const status = section?.querySelector(":scope > [role=status]") ?? null;

  let board: (Box & { how: string }) | null = null;
  const named_boards = '[aria-label=Pegboard],[data-testid=rota-board],[aria-label="Wheel letters"],[aria-label="The street scene"],section[aria-label*=" of "][aria-label*="page"],[aria-label="Gear floor"]';
  const explicit = [...(root?.querySelectorAll(named_boards) ?? [])].find((el) => el.getBoundingClientRect().width > 150);
  if (explicit) board = { ...box(explicit)!, how: describe(explicit) };
  else if (root) {
    const candidates = [...root.querySelectorAll("[role=application],[role=grid],[role=img],svg,canvas,table,img")].filter((el) => {
      const r = el.getBoundingClientRect();
      return r.width > 150 && r.height > 150 && !el.closest("[aria-hidden=true]");
    });
    const largest = candidates.sort((a, b) => {
      const ra = a.getBoundingClientRect();
      const rb = b.getBoundingClientRect();
      return rb.width * rb.height - ra.width * ra.height;
    })[0];
    if (largest) board = { ...box(largest)!, how: describe(largest) };
  }

  let node: Element | null = root;
  while (node && node.children.length === 1) node = node.children[0];
  const blocks = [...(node?.children ?? [])]
    .map((child) => ({ el: child, b: box(child)! }))
    .filter(({ b }) => b.width > 0 || b.height > 0)
    .map(({ el, b }) => ({ ...b, name: describe(el), below: b.bottom > innerHeight }));

  const footer = document.querySelector("[data-testid=solved-footer]");
  const stamp = document.querySelector("[data-testid=solved-stamp]");
  const controls = named("Check")?.parentElement ?? null;
  const boardBottom = board?.bottom ?? 0;
  return {
    docHeight: document.documentElement.scrollHeight,
    overflow: document.documentElement.scrollHeight - innerHeight,
    siteHeader: box(siteHeader)?.height ?? 0,
    titleBlock: box(titleHeader)?.height ?? 0,
    timerRow: box(timer)?.height ?? 0,
    controls: box(controls)?.height ?? 0,
    status: box(status)?.height ?? 0,
    footerBlock: box(footer)?.height ?? 0,
    board,
    check: box(named("Check")),
    reset: box(named("Reset")),
    statusBox: box(status),
    stamp: box(stamp),
    stackedBelowBoard: Math.max(0, document.documentElement.scrollHeight - boardBottom),
    blocks,
  };
};

/** The network wait is capped: on a repeat visit the back link's RSC prefetch stays pending for about 26 seconds. */
async function settle(page: Page) {
  await page.waitForLoadState("networkidle", { timeout: 2500 }).catch(() => undefined);
  await page.evaluate("document.fonts.ready");
  await page.waitForFunction(() => {
    const root = document.querySelector("[data-testid=solver]");
    return root && root.children.length > 0 && !document.querySelector("[aria-busy=true]");
  });
  await page.waitForTimeout(600);
}

async function measure(page: Page, target: Target, viewport: { width: number; height: number }, state: "open" | "solved", shot: boolean) {
  await page.setViewportSize(viewport);
  await page.goto(`${base}/puzzles/${target.typeKey}/${target.slug}`);
  await settle(page);
  if (state === "solved") await page.getByTestId("solved-footer").waitFor({ timeout: 10_000 }).catch(() => undefined);
  const size = `${viewport.width}x${viewport.height}`;
  if (shot) {
    await page.screenshot({
      path: `${out}/${target.key.replace(":", "-")}-${size}-${state}.png`,
    });
  }
  const data = (await page.evaluate(`(${measureInPage.toString()})()`)) as Omit<Measurement, "key" | "slug" | "viewport" | "state">;
  return { key: target.key, slug: target.slug, viewport: size, state, ...data } satisfies Measurement;
}

/** Runs in the page: the panel's scroll containers, clipped content, gaps, dead space and block heights. */
const measurePanelInPage = () => {
  const r2 = (n: number) => Math.round(n * 10) / 10;
  const rect = (el: Element) => el.getBoundingClientRect();
  const describe = (el: Element) => {
    const label = el.getAttribute("aria-label") ?? el.getAttribute("data-testid") ?? el.getAttribute("role") ?? "";
    const heading = el.querySelector("h1,h2,h3,h4,legend,summary")?.textContent?.trim().slice(0, 24) ?? "";
    const own = [...el.classList].slice(0, 3).join(".");
    return `${el.tagName.toLowerCase()}${label ? `[${label.slice(0, 28)}]` : ""}${heading ? ` "${heading}"` : ""}${own && !label && !heading ? `.${own}` : ""}`;
  };
  const section = document.querySelector("section[data-solve-mode]")!;
  const root = document.querySelector("[data-testid=solver]")!;
  const buttons = [...document.querySelectorAll("button")].filter((b) => rect(b).width > 0);
  const check = buttons.find((b) => b.textContent?.trim() === "Check") ?? null;
  const reset = buttons.find((b) => b.textContent?.trim() === "Reset") ?? null;
  const status = section.querySelector(":scope > [role=status]");
  const sectionRect = rect(section);
  const siteFooter = [...document.querySelectorAll("footer")].find((f) => !f.matches("[data-testid=solved-footer]") && !section.contains(f)) ?? null;
  const visible = (el: Element) => {
    const r = rect(el);
    const cs = getComputedStyle(el);
    return r.width > 0 && r.height > 0 && cs.visibility !== "hidden" && cs.display !== "none";
  };
  const isLeaf = (el: Element) =>
    visible(el) && ![...el.children].some((c) => visible(c)) && (el.textContent?.trim() || /^(BUTTON|INPUT|SVG|IMG|CANVAS|SELECT|TEXTAREA)$/i.test(el.tagName));
  const scrolls = (cs: CSSStyleDeclaration) => /auto|scroll/.test(cs.overflowY) || /auto|scroll/.test(cs.overflowX);

  const scrollers = [...section.querySelectorAll("*")]
    .filter((el) => scrolls(getComputedStyle(el)) && visible(el))
    .map((el) => {
      const cs = getComputedStyle(el);
      const r = rect(el);
      const bw = parseFloat(cs.borderLeftWidth) + parseFloat(cs.borderRightWidth);
      const clientRight = r.left + parseFloat(cs.borderLeftWidth) + el.clientWidth;
      const leaves = [...el.querySelectorAll("*")].filter(isLeaf);
      const contentRight = Math.max(r.left, ...leaves.map((l) => Math.min(rect(l).right, clientRight)));
      const clipTop = r.top + parseFloat(cs.borderTopWidth);
      const clipBottom = clipTop + el.clientHeight;
      const cut = [...el.querySelectorAll("*")]
        .filter((c) => visible(c) && (c.textContent?.trim() || /^(BUTTON|INPUT|SVG|IMG|CANVAS)$/i.test(c.tagName)))
        .filter((c) => {
          const b = rect(c);
          const v = b.top < clipTop - 0.5 && b.bottom > clipTop + 0.5;
          const w = b.top < clipBottom - 0.5 && b.bottom > clipBottom + 0.5;
          return v || w;
        });
      const deepest = cut.filter((c) => !cut.some((o) => o !== c && c.contains(o)));
      const hiddenBelow = [...el.children].filter((c) => visible(c) && rect(c).top >= clipBottom - 0.5).length;
      const last = [...el.children].filter(visible).at(-1);
      return {
        selector: describe(el),
        cls: [...el.classList].filter((c) => /overflow|panel:|scroll/.test(c)).slice(0, 4).join(" "),
        clientHeight: el.clientHeight,
        scrollHeight: el.scrollHeight,
        overflowY: el.scrollHeight - el.clientHeight,
        overflowX: el.scrollWidth - el.clientWidth,
        scrollbarWidth: Math.round((el as HTMLElement).offsetWidth - el.clientWidth - bw),
        scrollbarStyle: `${cs.scrollbarWidth}/${cs.scrollbarColor}`,
        gapContentToScrollbar: r2(clientRight - contentRight),
        gapToPanelEdge: r2(sectionRect.right - r.right),
        paddingEnd: `${cs.paddingTop} ${cs.paddingRight} ${cs.paddingBottom} ${cs.paddingLeft}`,
        lastChildMarginBottom: last ? getComputedStyle(last).marginBottom : null,
        clippedAtRest: deepest.length,
        hiddenBelowChildren: hiddenBelow,
        lastClipped: deepest.length ? `${describe(deepest.at(-1)!)} "${deepest.at(-1)!.textContent?.trim().slice(0, 30)}"` : null,
      };
    });

  const gridParentOf = (el: Element) => {
    let p = el.parentElement;
    while (p && getComputedStyle(p).display === "contents") p = p.parentElement;
    return p;
  };
  const panelParts = [...root.querySelectorAll("*")].filter((el) => getComputedStyle(el).gridColumnStart === "2" && gridParentOf(el) === section && visible(el));
  const firstPart = panelParts[0] ?? null;
  const clipBottomOf = (el: Element) => {
    let bottom = Infinity;
    for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
      const cs = getComputedStyle(p);
      if (/auto|scroll|hidden|clip/.test(cs.overflowY)) bottom = Math.min(bottom, rect(p).top + parseFloat(cs.borderTopWidth) + p.clientHeight);
    }
    return bottom;
  };
  const panelLeaves = panelParts.flatMap((p) => [...p.querySelectorAll("*")].filter(isLeaf));
  const lastVisibleBottom = Math.max(
    0,
    ...panelLeaves.filter((l) => rect(l).top < clipBottomOf(l)).map((l) => Math.min(rect(l).bottom, clipBottomOf(l))),
  );
  const shadow = check ? getComputedStyle(check).boxShadow : "";
  const checkRect = check ? rect(check) : null;
  const resetRect = reset ? rect(reset) : null;
  const statusRect = status ? rect(status) : null;
  const bottomOfControls = Math.max(checkRect?.bottom ?? 0, resetRect?.bottom ?? 0, statusRect?.bottom ?? 0);
  const footerTop = siteFooter ? rect(siteFooter).top : null;
  const solvedFooter = document.querySelector("[data-testid=solved-footer]");

  const boardCell =
    [...root.querySelectorAll("*")].find((el) => {
      const cs = getComputedStyle(el);
      return cs.containerType === "inline-size" && cs.gridColumnStart === "1" && gridParentOf(el) === section;
    }) ?? null;
  const named_boards = '[aria-label=Pegboard],[data-testid=rota-board],[aria-label="Wheel letters"],[aria-label="The street scene"],section[aria-label*=" of "][aria-label*="page"],[aria-label="Gear floor"]';
  const explicit = [...root.querySelectorAll(named_boards)].find((el) => rect(el).width > 150);
  const candidates = [...(boardCell ?? root).querySelectorAll("[role=application],[role=grid],[role=img],svg,canvas,table,img")].filter((el) => {
    const r = rect(el);
    return r.width > 150 && r.height > 150 && !el.closest("[aria-hidden=true]");
  });
  const largest = explicit ?? candidates.sort((a, b) => rect(b).width * rect(b).height - rect(a).width * rect(a).height)[0] ?? null;
  const boxOf = (el: Element | null) => (el ? { w: Math.round(rect(el).width), h: Math.round(rect(el).height), left: Math.round(rect(el).left), top: Math.round(rect(el).top + scrollY), bottom: Math.round(rect(el).bottom + scrollY) } : null);
  const cellBox = boxOf(boardCell);
  const boardBox = boxOf(largest);

  const sheets = [...section.querySelectorAll('[class*="paper-sheet"]')].filter((el) => visible(el) && getComputedStyle(el).boxShadow !== "none").map((el) => {
    const b = rect(el);
    return {
      selector: describe(el),
      column: b.left > sectionRect.left + sectionRect.width / 2 ? "panel" : "board",
      top: Math.round(b.top + scrollY),
      bottom: Math.round(b.bottom + scrollY),
      gapToCheck: checkRect && b.left > sectionRect.left + sectionRect.width / 2 ? r2(checkRect.top - b.bottom) : null,
    };
  });

  const blocks = panelParts.map((part) => {
    const cs = getComputedStyle(part);
    let node: Element = part;
    while (node.children.length === 1 && !scrolls(getComputedStyle(node.children[0]))) node = node.children[0];
    const kids = [...node.children].filter(visible);
    const partTop = rect(part).top;
    const content = Math.max(0, ...[...part.querySelectorAll("*")].filter(isLeaf).map((l) => rect(l).bottom - partTop));
    return {
      part: describe(part),
      scrollsInside: scrolls(cs),
      content: Math.round(content),
      natural: Math.max(part.scrollHeight, Math.round(rect(part).height)),
      paddingBottom: cs.paddingBottom,
      blocks: kids.map((k) => ({ name: describe(k), h: Math.round(rect(k).height), mb: getComputedStyle(k).marginBottom })),
      gap: getComputedStyle(node).rowGap,
    };
  });
  const budgetTop = firstPart ? rect(firstPart).top : null;
  const budget = budgetTop !== null && checkRect ? Math.round(checkRect.top - budgetTop) : null;
  const natural = blocks.reduce((sum, b) => sum + b.content + parseFloat(b.paddingBottom), 0);

  return {
    docHeight: document.documentElement.scrollHeight,
    pageScrollbar: innerWidth - document.documentElement.clientWidth,
    pageOverflow: document.documentElement.scrollHeight - innerHeight,
    section: { top: Math.round(sectionRect.top + scrollY), bottom: Math.round(sectionRect.bottom + scrollY), height: Math.round(sectionRect.height), right: Math.round(sectionRect.right) },
    scrollers,
    gaps: {
      lastContentToCheck: checkRect && lastVisibleBottom ? r2(checkRect.top - lastVisibleBottom) : null,
      controlsToSectionBottom: r2(sectionRect.bottom - bottomOfControls),
      checkToStatus: checkRect && statusRect ? r2(statusRect.top - checkRect.bottom) : null,
      checkShadow: shadow === "none" ? "" : shadow.slice(0, 40),
      sectionToSiteFooter: footerTop === null ? null : r2(footerTop - sectionRect.bottom),
      checkBottomToSiteFooter: footerTop === null || !checkRect ? null : r2(footerTop - checkRect.bottom),
      boardColumnBottomToPanelBottom: cellBox && statusRect ? Math.round(statusRect.bottom + scrollY - cellBox.bottom) : null,
    },
    boardCell: cellBox,
    board: boardBox,
    deadSpace: cellBox && boardBox ? { w: cellBox.w - boardBox.w, h: cellBox.h - boardBox.h, left: boardBox.left - cellBox.left } : null,
    sheets,
    budget,
    natural,
    blocks,
    solvedFooter: solvedFooter ? { ...boxOf(solvedFooter)!, scrollHeight: solvedFooter.scrollHeight, clientHeight: solvedFooter.clientHeight, stampBottom: boxOf(document.querySelector("[data-testid=solved-stamp]"))?.bottom ?? null, nextBottom: boxOf([...document.querySelectorAll("a")].find((a) => a.textContent?.trim() === "Next in volume") ?? null)?.bottom ?? null } : null,
    check: boxOf(check),
    status: boxOf(status),
    innerHeight,
  };
};

type PanelMeasurement = ReturnType<typeof measurePanelInPage> & { key: string; slug: string; viewport: string; state: "open" | "solved" };

/** Headless Chromium hides scrollbars. `--panel` keeps the system ones, because how they look is what it measures. */
const browser = await chromium.launch(args.includes("--panel") ? { ignoreDefaultArgs: ["--hide-scrollbars"] } : {});

/** Signs up a throwaway account, verifies it in the local database (a production build sends a link instead) and signs in. */
async function signIn() {
  const context = await browser.newContext({ viewport: viewports[0] });
  await context.addInitScript("window.__name = (f) => f");
  const page = await context.newPage();
  const email = `e2e-t169-${Date.now().toString(36)}@e2e.test`;
  await page.goto(`${base}/sign-up`);
  await page.getByLabel("Name").fill("Audit");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("correct-horse-battery");
  await page.getByRole("button", { name: "Create account" }).click();
  await page.getByText("Check your inbox").waitFor();
  await pool.query(`update "user" set email_verified = true where email = $1`, [email]);
  await page.goto(`${base}/sign-in`);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("correct-horse-battery");
  const {
    rows: [account],
  } = await pool.query<{ id: string }>(`select id from "user" where email = $1`, [email]);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await page.waitForURL((url) => !url.pathname.startsWith("/sign-in"), { timeout: 15_000 }).catch(async () => {
    await removeUser(account.id);
    throw new Error("Sign-in did not go through. It is limited to 5 in 15 minutes, so wait and run the solved pass again.");
  });
  return { page, userId: account.id };
}

const complete = (userId: string, target: Target) =>
  pool.query(
    `insert into attempts (user_id, puzzle_id, type_key, completed_at, duration_ms)
     select $1, $2, $3, now(), 187000 where not exists (select 1 from attempts where user_id = $1 and puzzle_id = $2)`,
    [userId, target.id, target.typeKey],
  );

const removeUser = (userId: string) => pool.query(`delete from "user" where id = $1`, [userId]);

const anon = await browser.newContext({ viewport: viewports[0] });
await anon.addInitScript("window.__name = (f) => f");
const anonPage = await anon.newPage();

if (sweep) {
  const rows = [];
  for (const puzzle of puzzles) {
    if (puzzle.type_key === "spot-difference") continue;
    const target = { key: puzzle.type_key, typeKey: puzzle.type_key, slug: puzzle.slug, id: puzzle.id };
    const m = await measure(anonPage, target, viewports[1], "open", false);
    const mode = chessModes.get(puzzle.slug);
    rows.push({ type: puzzle.type_key + (mode ? `:${mode}` : ""), slug: puzzle.slug, overflow: m.overflow, board: m.board ? `${m.board.width}x${m.board.height}` : "", stackedBelowBoard: m.stackedBelowBoard, docHeight: m.docHeight });
    console.log(rows.at(-1));
  }
  writeFileSync(`${out}/sweep.json`, JSON.stringify(rows, null, 1));
  await browser.close();
  await pool.end();
  process.exit(0);
}

if (args.includes("--panel")) {
  const extras: { type: string; slug: string; fill?: boolean }[] = [
    { type: "reverse-chess", slug: "the-long-walk", fill: true },
    { type: "crossword", slug: "fine-print" },
    { type: "logic-grid", slug: "manifest" },
    { type: "logic-grid", slug: "cold-frame" },
    { type: "knights-knaves", slug: "night-ferry" },
    { type: "knights-knaves", slug: "by-the-fire" },
    { type: "word-wheel", slug: "dead-hours" },
    { type: "book-cipher", slug: "bowerbird-nest" },
    { type: "rota", slug: "the-long-shift" },
    { type: "rota", slug: "canteen-queue" },
    { type: "word-search", slug: "wound-up" },
    { type: "detective-scene", slug: "cambridge-night" },
    { type: "pictogram-cipher", slug: "first-drawing" },
  ];
  const gearsAll = puzzles.filter((p) => p.type_key === "gears");
  let largest = gearsAll[0];
  let most = 0;
  for (const p of gearsAll) {
    if (p.slug.startsWith("daily-")) continue;
    const count = (await import(`../../content/gears/${p.slug}.ts`).catch(() => null))?.content?.gears?.length ?? 0;
    if (count > most) [most, largest] = [count, p];
  }
  const daily = gearsAll.find((p) => p.slug.startsWith("daily-"));
  const panelTargets: (Target & { fill?: boolean })[] = [];
  const seen = new Set<string>();
  const add = (t: Target & { fill?: boolean }) => {
    if (seen.has(`${t.typeKey}/${t.slug}`)) return;
    seen.add(`${t.typeKey}/${t.slug}`);
    panelTargets.push(t);
  };
  for (const t of targets) add(t);
  for (const e of extras) {
    if (only.length && !only.includes(e.type)) continue;
    const p = puzzles.find((q) => q.type_key === e.type && q.slug === e.slug);
    if (p) add({ key: `${e.type}~${e.slug}`, typeKey: e.type, slug: e.slug, id: p.id, fill: e.fill });
  }
  if (largest && (!only.length || only.includes("gears"))) add({ key: `gears~${largest.slug}`, typeKey: "gears", slug: largest.slug, id: largest.id });
  if (daily && (!only.length || only.includes("gears"))) add({ key: `gears~${daily.slug}`, typeKey: "gears", slug: daily.slug, id: daily.id });

  const fileOf = (t: Target, size: string, state: string, theme: string) => `${out}/${t.key.replace(/[:~]/g, "-")}-${size}-${state}-${theme}.png`;

  const fillState = async (page: Page, t: Target & { fill?: boolean }) => {
    if (!t.fill) return;
    const mod = await import(`../../content/${t.typeKey}/${t.slug}.ts`);
    await page.addInitScript(
      ([key, value]) => localStorage.setItem(key, value),
      [`ludwig:progress:${t.id}`, JSON.stringify({ typeKey: t.typeKey, state: { plies: mod.content.solutionPlies }, startedAt: Date.now() })],
    );
  };

  /** A solved page loaded from a completion row has no epilogue, so the three types that have one get a stand-in of the real length. */
  const epilogues = async (t: Target) => {
    const mod = await import(`../../content/${t.typeKey}/${t.slug}.ts`).catch(() => null);
    if (t.typeKey === "odd-one-out") return [String(mod?.content?.items?.find?.((i: { explanation?: string }) => i.explanation)?.explanation ?? mod?.content?.explanation ?? "")];
    if (t.typeKey === "nonogram") return [String(mod?.content?.caption ?? "")];
    if (t.typeKey === "rota") return Array.from({ length: (mod?.content?.solution?.swaps?.length ?? 5) + 1 }, (_, i) => `Step ${i + 1}: A and B swap. A plausible excuse for the swap, in one sentence of about the usual length. Yara is now two zones from the hazard.`);
    return null;
  };

  const run = async (page: Page, t: Target & { fill?: boolean }, viewport: { width: number; height: number }, state: "open" | "solved", themes: boolean) => {
    await page.setViewportSize(viewport);
    await page.emulateMedia({ colorScheme: "light" });
    await page.goto(`${base}/puzzles/${t.typeKey}/${t.slug}`);
    await page.waitForFunction(() => {
      const root = document.querySelector("[data-testid=solver]");
      return root && root.children.length > 0 && !document.querySelector("[aria-busy=true]");
    });
    await page.evaluate("document.fonts.ready");
    if (state === "solved") await page.getByTestId("solved-footer").waitFor({ timeout: 10_000 }).catch(() => undefined);
    await page.waitForTimeout(700);
    const lines = state === "solved" ? await epilogues(t) : null;
    if (lines) {
      await page.evaluate((text) => {
        const footer = document.querySelector("[data-testid=solved-footer]");
        if (!footer || footer.querySelector("[data-testid=epilogue]")) return;
        const many = text.length > 1;
        const el = document.createElement(many ? "ol" : "p");
        el.setAttribute("data-testid", "epilogue");
        if (many) el.className = "flex max-w-prose list-none flex-col gap-1";
        if (many) for (const line of text) { const li = document.createElement("li"); li.textContent = line; el.append(li); }
        else el.textContent = text[0];
        footer.insertBefore(el, footer.querySelector("a"));
      }, lines);
    }
    const size = `${viewport.width}x${viewport.height}`;
    const data = (await page.evaluate(`(${measurePanelInPage.toString()})()`)) as ReturnType<typeof measurePanelInPage>;
    await page.screenshot({ path: fileOf(t, size, state, "paper") });
    if (themes) {
      await page.emulateMedia({ colorScheme: "dark" });
      await page.waitForTimeout(150);
      await page.screenshot({ path: fileOf(t, size, state, "ink") });
      await page.emulateMedia({ colorScheme: "light" });
    }
    return { key: t.key, slug: t.slug, viewport: size, state, ...data } satisfies PanelMeasurement;
  };

  if (args.includes("--widths")) {
    const widths = [24, 30, 36, 42, 48];
    const cases = panelTargets.filter((t) => ["rota", "logic-grid", "logic-grid~manifest", "knights-knaves", "knights-knaves~night-ferry", "crossword", "crossword~fine-print", "rota~the-long-shift", "book-cipher", "caesar", "keyword", "pictogram-cipher", "pictogram-cipher~first-drawing", "reverse-chess~the-long-walk", "word-search~wound-up", "detective-scene"].includes(t.key));
    const rows = [];
    const ctx = await browser.newContext({ viewport: viewports[0] });
    await ctx.addInitScript("window.__name = (f) => f");
    const page = await ctx.newPage();
    for (const t of cases) {
      for (const vp of viewports) {
        await page.setViewportSize(vp);
        await fillState(page, t);
        await page.goto(`${base}/puzzles/${t.typeKey}/${t.slug}`);
        await page.waitForFunction(() => document.querySelector("[data-testid=solver]")?.children.length);
        await page.evaluate("document.fonts.ready");
        await page.waitForTimeout(500);
        for (const w of widths) {
          const data = await page.evaluate(`((w) => {
            const section = document.querySelector("section[data-solve-mode]");
            section.style.gridTemplateColumns = "minmax(0,1fr) " + w + "rem";
            const gp = (el) => { let p = el.parentElement; while (p && getComputedStyle(p).display === "contents") p = p.parentElement; return p; };
            const body = [...document.querySelectorAll("[data-testid=solver] *")].filter((el) => getComputedStyle(el).gridColumnStart === "2" && gp(el) === section && el.getBoundingClientRect().width > 0);
            const first = body[0]?.getBoundingClientRect().top ?? 0;
            const check = [...document.querySelectorAll("button")].find((b) => b.textContent.trim() === "Check" && b.getBoundingClientRect().width > 0);
            const budget = Math.round((check?.getBoundingClientRect().top ?? 0) - first);
            const leaves = body.flatMap((el) => [...el.querySelectorAll("*")]).filter((l) => l.getBoundingClientRect().height > 0 && ![...l.children].some((c) => c.getBoundingClientRect().height > 0));
            const content = Math.round(Math.max(0, ...leaves.map((l) => l.getBoundingClientRect().bottom)) - first);
            const cell = [...document.querySelectorAll("[data-testid=solver] *")].find((el) => getComputedStyle(el).containerType === "inline-size" && getComputedStyle(el).gridColumnStart === "1");
            return { budget, content, over: content - budget, boardCell: cell ? Math.round(cell.getBoundingClientRect().width) : null };
          })(${w})`);
          rows.push({ key: t.key, viewport: `${vp.width}x${vp.height}`, panelRem: w, ...(data as object) });
        }
      }
    }
    writeFileSync(`${out}/panel-widths.json`, JSON.stringify(rows, null, 1));
    for (const r of rows) console.log(JSON.stringify(r));
    await browser.close();
    await pool.end();
    process.exit(0);
  }

  if (args.includes("--browsers")) {
    const { webkit } = await import("@playwright/test");
    const cases = [
      { type: "rota", slug: "canteen-queue" },
      { type: "logic-grid", slug: "cold-frame" },
      { type: "knights-knaves", slug: "by-the-fire" },
      { type: "crossword", slug: puzzles.find((p) => p.type_key === "crossword")!.slug },
    ];
    const sizes = [{ width: 1280, height: 650 }, { width: 1440, height: 1000 }];
    const rows = [];
    for (const [name, launcher] of [["chromium", chromium], ["webkit", webkit]] as const) {
      const b = await launcher.launch(name === "chromium" ? { ignoreDefaultArgs: ["--hide-scrollbars"] } : {});
      const ctx = await b.newContext({ viewport: sizes[0] });
      await ctx.addInitScript("window.__name = (f) => f");
      const page = await ctx.newPage();
      for (const c of cases) {
        const p = puzzles.find((q) => q.type_key === c.type && q.slug === c.slug)!;
        for (const vp of sizes) {
          const m = await run(page, { key: `${name}~${c.slug}`, typeKey: c.type, slug: c.slug, id: p.id }, vp, "open", false);
          rows.push({ browser: name, slug: c.slug, viewport: m.viewport, scrollers: m.scrollers.map((s) => ({ selector: s.selector, client: s.clientHeight, scroll: s.scrollHeight, scrollbarWidth: s.scrollbarWidth, gapContentToScrollbar: s.gapContentToScrollbar, clipped: s.clippedAtRest, lastClipped: s.lastClipped })), gaps: m.gaps });
        }
      }
      await b.close();
    }
    writeFileSync(`${out}/panel-browsers.json`, JSON.stringify(rows, null, 1));
    console.log(JSON.stringify(rows, null, 1));
    await browser.close();
    await pool.end();
    process.exit(0);
  }

  const results: PanelMeasurement[] = [];
  for (const t of panelTargets) {
    const ctx = await browser.newContext({ viewport: viewports[0] });
    await ctx.addInitScript("window.__name = (f) => f");
    const page = await ctx.newPage();
    await fillState(page, t);
    for (const vp of viewports) results.push(await run(page, t, vp, "open", true));
    await ctx.close();
  }
  writeFileSync(`${out}/panel-open.json`, JSON.stringify(results, null, 1));
  if (!args.includes("--open-only")) {
    const { page: authed, userId } = await signIn();
    try {
      for (const t of panelTargets) {
        await complete(userId, t);
        for (const vp of viewports) results.push(await run(authed, t, vp, "solved", true));
      }
    } finally {
      await removeUser(userId);
    }
  }
  writeFileSync(`${out}/panel.json`, JSON.stringify(results, null, 1));

  const inView = (bottom: number | null | undefined, height: number) => (bottom == null ? "-" : bottom <= height ? "in" : `+${bottom - height}`);
  console.log("| key | viewport | state | scrollers (clientH/scrollH, bar px) | clipped | content to Check | controls to bottom | section to footer | col vs panel bottom | board in column (dead w x h) | natural/budget | stamp |");
  console.log("|---|---|---|---|---|---|---|---|---|---|---|---|");
  for (const m of results) {
    const clipped = m.scrollers.reduce((n, s) => n + s.clippedAtRest, 0);
    const over = m.scrollers.filter((s) => s.overflowY > 1 || s.overflowX > 1);
    const scr = over.length ? over.map((s) => `${s.selector.slice(0, 26)} ${s.clientHeight}/${s.scrollHeight}${s.scrollbarWidth ? ` bar${s.scrollbarWidth}` : ""}`).join("; ") : "none";
    console.log(
      `| ${m.key} | ${m.viewport} | ${m.state} | ${scr} | ${clipped} | ${m.gaps.lastContentToCheck ?? "-"} | ${m.gaps.controlsToSectionBottom} | ${m.gaps.sectionToSiteFooter ?? "-"} | ${m.gaps.boardColumnBottomToPanelBottom ?? "-"} | ${m.board && m.boardCell ? `${m.board.w}x${m.board.h} in ${m.boardCell.w}x${m.boardCell.h} (${m.deadSpace?.w}x${m.deadSpace?.h})` : m.board ? `${m.board.w}x${m.board.h} (no board cell)` : "-"} | ${m.natural}/${m.budget ?? "-"} | ${m.state === "solved" ? inView(m.solvedFooter?.stampBottom, m.innerHeight) : "-"} |`,
    );
  }
  console.log(`ROWS ${results.length} (${panelTargets.length} puzzles x ${viewports.length} sizes x ${args.includes("--open-only") ? 1 : 2} states); registry types ${typeKeys.length}`);
  const bar = Math.max(0, ...results.map((m) => m.pageScrollbar));
  console.log(bar ? `SCROLLBARS classic (${bar}px)` : "SCROLLBARS overlay (0px): bar widths read 0 and lists wrap one line less; macOS shows classic bars with a mouse attached or with Show scroll bars set to Always");
  await browser.close();
  await pool.end();
  process.exit(0);
}

if (args.includes("--chrome")) {
  const rows = [];
  for (const viewport of viewports) {
    await anonPage.setViewportSize(viewport);
    await anonPage.goto(`${base}/puzzles/reverse-chess/${targets.find((t) => t.key === "reverse-chess:unwind")!.slug}`);
    await settle(anonPage);
    rows.push({
      viewport: `${viewport.width}x${viewport.height}`,
      ...((await anonPage.evaluate(`(() => {
        const r = (el) => { if (!el) return null; const b = el.getBoundingClientRect(); return { top: Math.round(b.top + scrollY), height: Math.round(b.height), width: Math.round(b.width), left: Math.round(b.left) }; };
        const section = document.querySelector("section[data-solve-mode]");
        const main = document.querySelector("main");
        const header = section.querySelector(":scope > header");
        const credit = header.querySelector("h1") ?? header.querySelector("[class*=font-display]");
        const spans = credit ? [...credit.children].map(r) : [];
        const buttons = [...document.querySelectorAll("button")].filter((b) => b.getBoundingClientRect().width > 0);
        const check = buttons.find((b) => b.textContent.trim() === "Check");
        const cs = getComputedStyle(main);
        const sc = getComputedStyle(section);
        const footers = [...document.querySelectorAll("footer")].filter((f) => !f.matches("[data-testid=solved-footer]"));
        return {
          siteHeader: r(document.querySelector("header")),
          mainPaddingTop: cs.paddingTop, mainPaddingBottom: cs.paddingBottom, mainGap: cs.rowGap, sectionGap: sc.rowGap,
          titleHeader: r(header), backLink: r(header.querySelector("a")), credit: r(credit), creditLines: spans,
          badge: r(header.querySelector("[class*=badge], [data-slot=badge]")), timer: r(header.querySelector("p.font-mono")),
          menuButton: r(header.querySelector("button")),
          checkRow: r(check?.parentElement), status: r(section.querySelector(":scope > [role=status]")),
          siteFooter: r(footers[0]), docHeight: document.documentElement.scrollHeight,
        };
      })()`)) as object),
    });
  }
  writeFileSync(`${out}/chrome.json`, JSON.stringify(rows, null, 1));
  console.log(JSON.stringify(rows, null, 1));
  await browser.close();
  await pool.end();
  process.exit(0);
}

if (args.includes("--grown")) {
  const cases = [
    { type: "reverse-chess", slug: "the-long-walk", fill: true },
    { type: "crossword", slug: "fine-print" },
    { type: "logic-grid", slug: "manifest" },
    { type: "knights-knaves", slug: "night-ferry" },
    { type: "word-wheel", slug: "dead-hours" },
    { type: "book-cipher", slug: "bowerbird-nest" },
    { type: "rota", slug: "the-long-shift" },
    { type: "word-search", slug: "wound-up" },
  ];
  const rows = [];
  for (const item of cases) {
    const puzzle = puzzles.find((p) => p.type_key === item.type && p.slug === item.slug)!;
    const page = await browser.newPage({ viewport: viewports[1] });
    await page.addInitScript("window.__name = (f) => f");
    if (item.fill) {
      const source = readFileSync(`content/${item.type}/${item.slug}.ts`, "utf8");
      const mod = await import(`../../content/${item.type}/${item.slug}.ts`);
      void source;
      const state = { plies: mod.content.solutionPlies };
      await page.addInitScript(
        ([key, value]) => localStorage.setItem(key, value),
        [`ludwig:progress:${puzzle.id}`, JSON.stringify({ typeKey: item.type, state, startedAt: Date.now() })],
      );
    }
    await page.goto(`${base}/puzzles/${item.type}/${item.slug}`);
    await settle(page);
    const data = await page.evaluate(`(() => {
      const root = document.querySelector("[data-testid=solver]");
      const scrollers = [...root.querySelectorAll("*")].filter((el) => el.scrollHeight > el.clientHeight + 4 && getComputedStyle(el).overflowY !== "visible").map((el) => ({ tag: el.tagName.toLowerCase(), label: el.getAttribute("aria-label") ?? el.getAttribute("data-testid") ?? el.className.toString().slice(0, 40), scrollHeight: el.scrollHeight, clientHeight: el.clientHeight }));
      const items = (sel) => [...root.querySelectorAll(sel)].length;
      return { docHeight: document.documentElement.scrollHeight, scrollers, retroSteps: items("[data-testid=retro-step]"), listItems: items("li"), tabs: [...root.querySelectorAll("[role=tab]")].map((t) => t.textContent) };
    })()`);
    rows.push({ ...item, ...(data as object) });
    await page.close();
  }
  writeFileSync(`${out}/grown.json`, JSON.stringify(rows, null, 1));
  console.log(JSON.stringify(rows, null, 1));
  await browser.close();
  await pool.end();
  process.exit(0);
}

if (args.includes("--footer")) {
  const { page, userId } = await signIn();
  const {
    rows: [followed],
  } = await pool.query<{ id: string; type_key: string; slug: string }>(
    `select p.id, p.type_key, p.slug from puzzles p
     where p.published_at <= now() and exists (
       select 1 from puzzles n where n.volume_id = p.volume_id and n.volume_position > p.volume_position and n.published_at <= now())
     order by p.type_key, p.volume_position limit 1`,
  );
  const target = { key: followed.type_key, typeKey: followed.type_key, slug: followed.slug, id: followed.id };
  await complete(userId, target);
  await page.setViewportSize(viewports[1]);
  await page.goto(`${base}/puzzles/${target.typeKey}/${target.slug}`);
  await settle(page);
  await page.getByTestId("solved-footer").waitFor();
  const rows = [];
  for (const width of [704, 416, 384, 352]) {
    rows.push(
      await page.evaluate(`((width) => {
        const footer = document.querySelector("[data-testid=solved-footer]");
        const hole = footer.firstElementChild;
        if (width < 704) {
          footer.style.width = width + "px";
          footer.style.columnGap = "16px";
          footer.style.rowGap = "24px";
          hole.style.setProperty("--hole-size", "216px");
        }
        const top = footer.getBoundingClientRect().top;
        return {
          slug: ${JSON.stringify(target.slug)},
          width,
          height: Math.round(footer.getBoundingClientRect().height),
          items: [...footer.children].map((el) => ({ text: el.textContent.trim().slice(0, 16) || "stamp", top: Math.round(el.getBoundingClientRect().top - top), height: Math.round(el.getBoundingClientRect().height) })),
        };
      })(${width})`),
    );
  }
  await removeUser(userId);
  writeFileSync(`${out}/footer.json`, JSON.stringify(rows, null, 1));
  console.log(JSON.stringify(rows, null, 1));
  await browser.close();
  await pool.end();
  process.exit(0);
}

const results: Measurement[] = [];
for (const target of targets) {
  for (const viewport of viewports) {
    results.push(await measure(anonPage, target, viewport, "open", true));
  }
}

writeFileSync(`${out}/measurements-open.json`, JSON.stringify(results, null, 1));
const { page: authedPage, userId } = await signIn();
for (const target of targets) {
  await complete(userId, target);
  for (const viewport of viewports) {
    results.push(await measure(authedPage, target, viewport, "solved", true));
  }
}
await removeUser(userId);

writeFileSync(`${out}/measurements.json`, JSON.stringify(results, null, 1));

const fold = (m: Box | null, height: number) => (m ? (m.bottom <= height ? "in" : `below +${m.bottom - height}`) : "-");
console.log("| key | slug | viewport | state | doc height | overflow | board WxH | board bottom | Check | Reset | status | stamp |");
console.log("|---|---|---|---|---|---|---|---|---|---|---|---|");
for (const m of results) {
  const height = Number(m.viewport.split("x")[1]);
  console.log(
    `| ${m.key} | ${m.slug} | ${m.viewport} | ${m.state} | ${m.docHeight} | ${m.overflow} | ${m.board ? `${m.board.width}x${m.board.height}` : "-"} | ${m.board?.bottom ?? "-"} | ${fold(m.check, height)} | ${fold(m.reset, height)} | ${fold(m.statusBox, height)} | ${m.state === "solved" ? fold(m.stamp, height) : "-"} |`,
  );
}
console.log(`ROWS ${results.length} (${targets.length} targets x ${viewports.length} sizes x 2 states); registry types ${typeKeys.length}`);

await browser.close();
await pool.end();
