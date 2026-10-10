import type { Page } from "@playwright/test";

export const PASSWORD = "correct-horse-battery";

const runId = Date.now().toString(36);
let counter = 0;

export const uniqueEmail = (flow: string) =>
  `e2e-${flow}-${runId}-${counter++}-${Math.random().toString(36).slice(2, 6)}@test.local`;

export async function signUp(page: Page, email: string) {
  await page.goto("/sign-up");
  await page.getByLabel("Name").fill("E2E Tester");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: "Create account" }).click();
  await page.waitForURL((url) => !url.pathname.startsWith("/sign-up"));
}
