// Solves the rota for real (signed out) and measures the solved footer with its epilogue (T175 AC9, F14).
// node scripts/dev/t175-rota-solved.mjs [base] [slug]
import { chromium } from "@playwright/test";

const base = process.argv[2] ?? "http://localhost:3175";
const slug = process.argv[3] ?? "the-long-shift";
const { content } = await import(`../../content/rota/${slug}.ts`);

const browser = await chromium.launch({ ignoreDefaultArgs: ["--hide-scrollbars"] });
for (const viewport of [
  { width: 1440, height: 800 },
  { width: 1280, height: 650 },
]) {
  const page = await (await browser.newContext({ viewport })).newPage();
  await page.goto(`${base}/puzzles/rota/${slug}`);
  await page.waitForTimeout(2000);
  const token = (name) => page.getByTestId(`token-${name}`);
  for (const { a, b } of [...content.solution.swaps].reverse()) {
    await token(a).click();
    await token(b).click();
  }
  await page.getByRole("group", { name: "Who insisted on the first swap?" }).getByLabel(content.solution.instigatorName).check();
  await page.getByRole("button", { name: "Check", exact: true }).click();
  await page.getByText(/Solved in/).waitFor();
  await page.waitForTimeout(1200);
  const result = await page.evaluate(() => {
    const rect = (el) => (el ? el.getBoundingClientRect() : null);
    const footer = rect(document.querySelector("[data-testid=solved-footer]"));
    const epilogue = document.querySelector("[data-testid=epilogue]");
    const stamp = rect(document.querySelector("[data-testid=solved-stamp]"));
    return {
      innerHeight,
      footer: footer && [Math.round(footer.top), Math.round(footer.bottom)],
      stampBottom: stamp && Math.round(stamp.bottom),
      epilogue: epilogue && { client: epilogue.clientHeight, scroll: epilogue.scrollHeight, bottom: Math.round(rect(epilogue).bottom) },
      next: rect(document.querySelector("a[href*='/puzzles/']:not([href$='/rota'])"))?.bottom ?? null,
      pageScroll: document.documentElement.scrollHeight - innerHeight,
    };
  });
  console.log(slug, `${viewport.width}x${viewport.height}`, JSON.stringify(result));
  await page.screenshot({ path: `.verification/T175/rota-solved-${viewport.width}x${viewport.height}.png` });
}
await browser.close();
