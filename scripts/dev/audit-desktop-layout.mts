import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { chromium, type Page } from "@playwright/test";
import pg from "pg";

/**
 * Measures the solve page of every puzzle type at the two desktop target sizes, with a fine pointer.
 * Run against a production build: `pnpm build && pnpm start --port 3169`, then
 * `pnpm tsx scripts/dev/audit-desktop-layout.mts [--sweep] [--base http://localhost:3169] [--out .verification/T169]`.
 * `--sweep` instead measures every published puzzle at 1280x650, without screenshots, to find the largest per type.
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
const targets: Target[] = [];
for (const typeKey of typeKeys) {
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

async function settle(page: Page) {
  await page.waitForLoadState("networkidle");
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

const browser = await chromium.launch();
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

const results: Measurement[] = [];
for (const target of targets) {
  for (const viewport of viewports) {
    results.push(await measure(anonPage, target, viewport, "open", true));
  }
}

writeFileSync(`${out}/measurements-open.json`, JSON.stringify(results, null, 1));
const authed = await browser.newContext({ viewport: viewports[0] });
await authed.addInitScript("window.__name = (f) => f");
const authedPage = await authed.newPage();
const email = `e2e-t169-${Date.now().toString(36)}@e2e.test`;
await authedPage.goto(`${base}/sign-up`);
await authedPage.getByLabel("Name").fill("Audit");
await authedPage.getByLabel("Email").fill(email);
await authedPage.getByLabel("Password").fill("correct-horse-battery");
await authedPage.getByRole("button", { name: "Create account" }).click();
await authedPage.getByText("Check your inbox").waitFor();
await pool.query(`update "user" set email_verified = true where email = $1`, [email]);
await authedPage.goto(`${base}/sign-in`);
await authedPage.getByLabel("Email").fill(email);
await authedPage.getByLabel("Password").fill("correct-horse-battery");
await authedPage.getByRole("button", { name: "Sign in", exact: true }).click();
await authedPage.waitForURL((url) => !url.pathname.startsWith("/sign-in"));
const {
  rows: [account],
} = await pool.query<{ id: string }>(`select id from "user" where email = $1`, [email]);
for (const target of targets) {
  await pool.query(
    `insert into attempts (user_id, puzzle_id, type_key, completed_at, duration_ms)
     select $1, $2, $3, now(), 187000 where not exists (select 1 from attempts where user_id = $1 and puzzle_id = $2)`,
    [account.id, target.id, target.typeKey],
  );
  for (const viewport of viewports) {
    results.push(await measure(authedPage, target, viewport, "solved", true));
  }
}

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
