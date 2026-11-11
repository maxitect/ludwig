import { expect, test } from "@playwright/test";
import { signUp, uniqueEmail } from "./helpers/auth";

test("the Desk draws a static desk first, then the WebGL scene, and arrows turn it", async ({
  page,
}) => {
  await signUp(page, uniqueEmail("desk-scene"));
  await page.goto("/");
  const scene = page.getByRole("group", {
    name: /Your desk in three dimensions/,
  });
  await expect(scene.locator("svg")).toHaveCount(1);
  await expect(scene).toHaveAttribute("data-desk-scene", "webgl", {
    timeout: 30_000,
  });
  await expect(scene.locator("canvas")).toHaveCount(1);
  await expect(page.getByText("Flagship: 0 solved")).toBeAttached();

  const before = await scene.locator("canvas").screenshot();
  await scene.focus();
  for (let press = 0; press < 3; press++) await page.keyboard.press("ArrowRight");
  await expect(async () => {
    const after = await scene.locator("canvas").screenshot();
    expect(after.equals(before)).toBe(false);
  }).toPass();
});

test.describe("reduced motion", () => {
  test.use({ reducedMotion: "reduce" });

  test("keeps the static desk and never creates a canvas", async ({ page }) => {
    await signUp(page, uniqueEmail("desk-scene-rm"));
    await page.goto("/");
    const scene = page.getByRole("group", {
      name: /Your desk in three dimensions/,
    });
    await expect(scene.locator("svg")).toBeVisible();
    await page.waitForTimeout(1500);
    await expect(page.locator("canvas")).toHaveCount(0);
    await expect(scene).toHaveAttribute("data-desk-scene", "static");
  });
});
