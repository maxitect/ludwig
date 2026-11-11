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

/** The landing page's prefetches keep `networkidle` from settling, so this just gives the worker time to finish a cache write. */
async function visit(page: Page, path: string) {
  await page.goto(path);
  await page.waitForTimeout(500);
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

async function cachedPages(page: Page) {
  return page.evaluate(async () => {
    const cache = await caches.open("pages");
    const entries: { url: string; body: string }[] = [];
    for (const request of await cache.keys()) {
      const response = await cache.match(request);
      entries.push({ url: request.url, body: (await response?.text()) ?? "" });
    }
    return entries;
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
    await visit(page, path);
  }

  const urls = await cachedUrls(page);
  for (const url of urls) {
    const { pathname } = new URL(url);
    expect(pathname).not.toMatch(/\/casebook|\/settings|\/api\//);
    expect(pathname).not.toMatch(/^\/puzzles\/[^/]+\/[^/]+/);
  }
  for (const { body } of await cachedPages(page)) {
    expect(body).toContain("data-guest-menu");
    expect(body).not.toContain("E2E Tester");
  }

  await page.goto("/");
  await page.getByRole("button", { name: /E2E Tester|account/i }).click();
  await page.getByRole("menuitem", { name: "Sign out" }).click();
  await expect(page.getByRole("link", { name: "Sign in" })).toBeVisible();

  await context.setOffline(true);
  await page.goto("/");
  await expect(page.getByText("E2E Tester")).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Sign in" })).toBeVisible();
});

test("a display name imitating the guest menu is not cached as a guest page", async ({
  page,
}) => {
  await waitForControl(page);
  await page.evaluate(async () => {
    await caches.delete("pages");
  });
  await signUp(page, uniqueEmail("offline-forged"), '<div data-guest-menu="">');
  for (const path of ["/", "/puzzles", "/gears"]) {
    await visit(page, path);
  }
  expect(await cachedPages(page)).toEqual([]);
});

test("a signed-in visitor online sees their account, not the cached guest page", async ({
  page,
  context,
}) => {
  await waitForControl(page);
  await signUp(page, uniqueEmail("offline-transition"));
  await page.goto("/");
  await expect(page.getByRole("link", { name: "Sign in" })).toHaveCount(0);

  await context.setOffline(true);
  await page.reload();
  await expect(page.getByText("E2E Tester")).toHaveCount(0);
});

for (const [label, register] of [
  ["rejects", "async () => { throw new TypeError('refused'); }"],
  ["resolves with nothing", "async () => undefined"],
] as const) {
  test(`a page stays error free when registration ${label}`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.addInitScript(`navigator.serviceWorker.register = ${register};`);
    await visit(page, "/puzzles");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "Collection",
    );
    expect(errors).toEqual([]);
  });
}

test("the precache list holds the app's chunks but never the three.js scene", async ({
  request,
}) => {
  const worker = await (await request.get("/serwist/sw.js")).text();
  const chunks = [
    ...new Set(worker.match(/\/_next\/static\/chunks\/[\w.-]+\.js/g)),
  ];
  expect(chunks.length).toBeGreaterThan(10);
  const three: string[] = [];
  for (const chunk of chunks) {
    if ((await (await request.get(chunk)).text()).includes("THREE.")) {
      three.push(chunk);
    }
  }
  expect(three).toEqual([]);
});
