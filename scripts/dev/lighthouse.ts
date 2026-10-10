import { mkdirSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { launch } from "chrome-launcher";
import lighthouse from "lighthouse";

/**
 * Lighthouse (mobile form factor, default throttling, 390x844 touch) over a fixed URL list against a
 * production server, writing one JSON report per page to .verification/T069/. A page below its target is
 * re-run twice more and judged on the median run, since a single simulated run varies by a few points.
 * Run `pnpm build && pnpm start --port 3069`, then `pnpm perf:lighthouse`. Exits non-zero if a target is missed.
 */
const base = process.env.BASE ?? "http://localhost:3069";
const out = path.join(process.cwd(), ".verification", "T069");
const contentDir = path.join(process.cwd(), "content");

const performanceTarget = 0.9;
const accessibilityTarget = 0.95;
const retries = 2;

const solveTypes = readdirSync(contentDir, { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && entry.name !== "book-texts")
  .map((entry) => entry.name)
  .sort();

const firstSlug = (type: string) =>
  readdirSync(path.join(contentDir, type))
    .filter((file) => file.endsWith(".ts") && file !== "index.ts")
    .sort()[0]
    ?.replace(/\.ts$/, "");

const only = process.env.ONLY?.split(",");

const allPages = [
  { name: "landing", path: "/" },
  { name: "puzzles", path: "/puzzles" },
  { name: "hub-reverse-chess", path: "/reverse-chess" },
  { name: "hub-gears", path: "/gears" },
  ...solveTypes.flatMap((type) => {
    const slug = firstSlug(type);
    return slug
      ? [{ name: `solve-${type}`, path: `/puzzles/${type}/${slug}` }]
      : [];
  }),
];

const pages = only ? allPages.filter((page) => only.includes(page.name)) : allPages;

const settings = {
  formFactor: "mobile",
  screenEmulation: {
    mobile: true,
    width: 390,
    height: 844,
    deviceScaleFactor: 3,
    disabled: false,
  },
} as const;

type Run = { performance: number; accessibility: number; report: string };

async function measure(port: number, url: string): Promise<Run> {
  const result = await lighthouse(
    url,
    { port, output: "json", onlyCategories: ["performance", "accessibility"] },
    { extends: "lighthouse:default", settings },
  );
  if (!result) throw new Error(`no Lighthouse result for ${url}`);
  return {
    performance: result.lhr.categories.performance?.score ?? 0,
    accessibility: result.lhr.categories.accessibility?.score ?? 0,
    report: String(result.report),
  };
}

const meets = (run: Run) =>
  run.performance >= performanceTarget && run.accessibility >= accessibilityTarget;

async function main() {
  mkdirSync(out, { recursive: true });
  const chrome = await launch({
    chromeFlags: ["--headless=new", "--no-sandbox"],
  });
  const failures: string[] = [];

  try {
    for (const page of pages) {
      const url = `${base}${page.path}`;
      const runs = [await measure(chrome.port, url)];
      while (!meets(runs[0]) && runs.length <= retries) {
        runs.push(await measure(chrome.port, url));
        if (runs.length > retries) break;
      }
      const ranked = [...runs].sort((a, b) => a.performance - b.performance);
      const median = ranked[Math.floor(ranked.length / 2)];
      writeFileSync(path.join(out, `${page.name}.json`), median.report);
      console.log(
        `${page.name.padEnd(28)} perf ${Math.round(median.performance * 100)} a11y ${Math.round(median.accessibility * 100)}${runs.length > 1 ? ` (median of ${runs.length})` : ""}`,
      );
      if (median.performance < performanceTarget)
        failures.push(`${page.path} performance ${median.performance}`);
      if (median.accessibility < accessibilityTarget)
        failures.push(`${page.path} accessibility ${median.accessibility}`);
    }
  } finally {
    await chrome.kill();
  }

  if (failures.length > 0) {
    console.error(`Missed targets:\n${failures.join("\n")}`);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
