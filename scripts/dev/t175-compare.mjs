// Compares the box of every visible leaf element of the solve section on production and on a local build,
// for one puzzle of every type, at a phone and at an iPad in portrait and landscape (T175 AC10).
// node scripts/dev/t175-compare.mjs [local-base] [production-base]
import { chromium, devices } from "@playwright/test";
import { readFileSync } from "node:fs";

const local = process.argv[2] ?? "http://localhost:3175";
const prod = process.argv[3] ?? "https://ludwigpuzzles.com";

const reps = [
  ...readFileSync("e2e/desktop-layout.spec.ts", "utf8").matchAll(
    /\{ type: "([a-z0-9-]+)", slug: "([a-z0-9-]+)"/g,
  ),
].map((m) => ({ type: m[1], slug: m[2] }));
const unique = [...new Map(reps.map((r) => [`${r.type}/${r.slug}`, r])).values()];

const profiles = [
  { name: "iPhone 390x844", ...devices["iPhone 13"], viewport: { width: 390, height: 844 } },
  { name: "iPad portrait", ...devices["iPad (gen 7)"] },
  { name: "iPad landscape", ...devices["iPad (gen 7) landscape"] },
];

const measure = (page) =>
  page.evaluate(() => {
    const section = document.querySelector("section[data-solve-mode]");
    if (!section) return null;
    const seen = new Map();
    const out = {};
    for (const el of section.querySelectorAll("*")) {
      if (el.children.length > 0 && !["BUTTON", "A", "LABEL", "LI"].includes(el.tagName)) continue;
      if (!el.checkVisibility({ checkVisibilityCSS: true })) continue;
      const b = el.getBoundingClientRect();
      if (b.width < 1 || b.height < 1) continue;
      const label = `${el.tagName}|${(el.getAttribute("aria-label") ?? el.textContent ?? "").trim().slice(0, 24)}`;
      const n = (seen.get(label) ?? 0) + 1;
      seen.set(label, n);
      out[`${label}#${n}`] = [Math.round(b.x), Math.round(b.y + scrollY), Math.round(b.width), Math.round(b.height)];
    }
    return out;
  });

const browser = await chromium.launch();
let moved = 0;
let compared = 0;
for (const profile of profiles) {
  const { name, ...options } = profile;
  const context = await browser.newContext(options);
  for (const { type, slug } of unique) {
    const page = await context.newPage();
    const boxes = [];
    for (const base of [prod, local]) {
      await page.goto(`${base}/puzzles/${type}/${slug}`, { waitUntil: "load" }).catch(() => undefined);
      await page.waitForTimeout(1800);
      boxes.push(await measure(page));
    }
    await page.close();
    if (!boxes[0] || !boxes[1]) {
      console.log(`${name} ${type}/${slug}: not measurable (${boxes[0] ? "local" : "production"} has no solve section)`);
      continue;
    }
    const diffs = [];
    for (const [key, a] of Object.entries(boxes[0])) {
      const b = boxes[1][key];
      if (!b) continue;
      compared++;
      if (a.some((v, i) => Math.abs(v - b[i]) > 1)) diffs.push(`${key} ${a} -> ${b}`);
    }
    moved += diffs.length;
    console.log(`${name} ${type}/${slug}: ${diffs.length} moved of ${Object.keys(boxes[0]).length}${diffs.length ? "\n  " + diffs.slice(0, 4).join("\n  ") : ""}`);
  }
  await context.close();
}
console.log(`COMPARED ${compared} elements, ${moved} moved`);
await browser.close();
