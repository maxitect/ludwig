import { chromium } from "@playwright/test";
const [, , url, w = "1280", h = "650", shot] = process.argv;
const b = await chromium.launch({ ignoreDefaultArgs: ["--hide-scrollbars"] });
const p = await b.newPage({ viewport: { width: +w, height: +h } });
await p.goto("http://localhost:3175" + url, { waitUntil: "load" });
await p.waitForTimeout(2500);
const r = await p.evaluate(() => {
  const sec = document.querySelector("[data-solve-mode]");
  const out = [];
  for (const e of document.querySelectorAll(
    "details.panel-section, [data-panel-scroll], main button",
  )) {
    const b = e.getBoundingClientRect();
    out.push([
      e.tagName,
      e.textContent.trim().slice(0, 24),
      Math.round(b.top),
      Math.round(b.bottom),
      Math.round(b.width),
      e.scrollHeight,
      e.clientHeight,
      e.hasAttribute("open"),
    ]);
  }
  return { doc: document.documentElement.scrollHeight, secBottom: sec.getBoundingClientRect().bottom, out };
});
for (const row of r.out.filter((x) => x[0] !== "BUTTON" || /^(Check|Reset)/.test(x[1]))) console.log(JSON.stringify(row));
console.log("secBottom", r.secBottom, "doc", r.doc, "vh", h);
if (shot) await p.screenshot({ path: shot });
await b.close();
