import { expect, test, type Page } from "@playwright/test";
import { signUp, uniqueEmail } from "./helpers/auth";
import { firstPublishedSlug } from "./helpers/content";

test.use({ serviceWorkers: "allow" });

async function waitForControl(page: Page) {
  await page.goto("/");
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await expect
    .poll(() => page.evaluate(() => navigator.serviceWorker.controller !== null))
    .toBe(true);
}

async function cachedUrls(page: Page) {
  return page.evaluate(async () => {
    const urls: string[] = [];
    for (const name of await caches.keys()) {
      const cache = await caches.open(name);
      for (const request of await cache.keys()) urls.push(request.url);
    }
    return urls;
  });
}

test("the service worker controls the page after one reload", async ({
  page,
}) => {
  await waitForControl(page);
});

test("visited public pages open offline and unvisited ones show the fallback", async ({
  page,
  context,
}) => {
  await waitForControl(page);
  await page.goto("/puzzles");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Collection",
  );
  await expect
    .poll(async () => (await cachedUrls(page)).some((u) => u.endsWith("/puzzles")))
    .toBe(true);

  await context.setOffline(true);
  await page.goto("/puzzles");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Collection",
  );

  const slug = await firstPublishedSlug("crossword");
  await page.goto(`/puzzles/crossword/${slug}`);
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Offline",
  );
});

test("no session-dependent response is cached and sign-out leaves nothing readable", async ({
  page,
  context,
}) => {
  await waitForControl(page);
  await expect
    .poll(async () =>
      (await cachedUrls(page)).some((u) => new URL(u).pathname === "/"),
    )
    .toBe(true);
  await signUp(page, uniqueEmail("offline"));
  const slug = await firstPublishedSlug("crossword");
  for (const path of [
    "/",
    "/puzzles",
    "/casebook",
    "/settings",
    `/puzzles/crossword/${slug}`,
  ]) {
    await page.goto(path);
    await page.waitForLoadState("networkidle");
  }

  const urls = await cachedUrls(page);
  for (const url of urls) {
    const { pathname } = new URL(url);
    expect(pathname).not.toMatch(/\/casebook|\/settings|\/api\//);
    expect(pathname).not.toMatch(/^\/puzzles\/[^/]+\/[^/]+/);
  }
  const stored = await page.evaluate(async () => {
    const entries: { name: string; url: string; body: string }[] = [];
    for (const name of await caches.keys()) {
      if (!name.startsWith("pages")) continue;
      const cache = await caches.open(name);
      for (const request of await cache.keys()) {
        const response = await cache.match(request);
        entries.push({
          name,
          url: request.url,
          body: (await response?.text()) ?? "",
        });
      }
    }
    return entries;
  });
  for (const { name, body } of stored) {
    if (name !== "pages-rsc-prefetch") expect(body).toContain("data-guest-menu");
  }
  for (const { body } of stored) expect(body).not.toContain("E2E Tester");

  await page.goto("/");
  await page.getByRole("button", { name: /E2E Tester|account/i }).click();
  await page.getByRole("menuitem", { name: "Sign out" }).click();
  await expect(page.getByRole("link", { name: "Sign in" })).toBeVisible();

  await context.setOffline(true);
  await page.goto("/");
  await expect(page.getByText("E2E Tester")).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Sign in" })).toBeVisible();
});
