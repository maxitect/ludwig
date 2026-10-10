import { mkdirSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { launch } from "chrome-launcher";
import lighthouse from "lighthouse";

/**
 * Lighthouse (mobile, default throttling, 390x844 touch) over a fixed URL list against a production server.
 * Run `pnpm build && pnpm start --port 3069`, then `pnpm perf:lighthouse`. Exits non-zero if a target is missed.
 */
const base = process.env.BASE ?? "http://localhost:3069";
const out = path.join(process.cwd(), ".verification", "T069");
const contentDir = path.join(process.cwd(), "content");

const performanceTarget = 0.9;
const accessibilityTarget = 0.95;

const solveTypes = readdirSync(contentDir, { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && entry.name !== "book-texts")
  .map((entry) => entry.name)
  .sort();

const firstSlug = (type: string) =>
  readdirSync(path.join(contentDir, type))
    .filter((file) => file.endsWith(".ts") && file !== "index.ts")
    .sort()[0]
    ?.replace(/\.ts$/, "");

const pages = [
  { name: "landing", path: "/", performance: true },
  { name: "puzzles", path: "/puzzles", performance: false },
  { name: "hub-reverse-chess", path: "/reverse-chess", performance: true },
  { name: "hub-gears", path: "/gears", performance: true },
  ...solveTypes.flatMap((type) => {
    const slug = firstSlug(type);
    return slug
      ? [{ name: `solve-${type}`, path: `/puzzles/${type}/${slug}`, performance: true }]
      : [];
  }),
];

async function main() {
mkdirSync(out, { recursive: true });
const chrome = await launch({ chromeFlags: ["--headless=new", "--no-sandbox"] });
const failures: string[] = [];

try {
  for (const page of pages) {
    const result = await lighthouse(
      `${base}${page.path}`,
      { port: chrome.port, output: "json", onlyCategories: ["performance", "accessibility"] },
      {
        extends: "lighthouse:default",
        settings: {
          formFactor: "mobile",
          screenEmulation: { mobile: true, width: 390, height: 844, deviceScaleFactor: 3, disabled: false },
        },
      },
    );
    if (!result) throw new Error(`no Lighthouse result for ${page.path}`);
    writeFileSync(path.join(out, `${page.name}.json`), String(result.report));
    const performance = result.lhr.categories.performance?.score ?? 0;
    const accessibility = result.lhr.categories.accessibility?.score ?? 0;
    console.log(`${page.name.padEnd(28)} perf ${Math.round(performance * 100)} a11y ${Math.round(accessibility * 100)}`);
    if (page.performance && performance < performanceTarget) failures.push(`${page.path} performance ${performance}`);
    if (accessibility < accessibilityTarget) failures.push(`${page.path} accessibility ${accessibility}`);
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
