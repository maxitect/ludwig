import { existsSync } from "node:fs";
import { defineConfig, devices } from "@playwright/test";

if (existsSync(".env.local")) process.loadEnvFile(".env.local");

const bypass = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;

const phone = {
  ...devices["Desktop Chrome"],
  viewport: { width: 390, height: 844 },
  isMobile: true,
  hasTouch: true,
};

export default defineConfig({
  testDir: "./e2e",
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000",
    trace: "retain-on-failure",
    extraHTTPHeaders: bypass
      ? {
          "x-vercel-protection-bypass": bypass,
          "x-vercel-set-bypass-cookie": "true",
          "x-vercel-skip-toolbar": "1",
        }
      : undefined,
  },
  projects: [
    { name: "desktop", grepInvert: /@perf/, use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", grepInvert: /@perf/, use: phone },
    {
      name: "landing-fallback",
      testMatch: /landing-walls\.spec\.ts$/,
      grepInvert: /@perf/,
      use: {
        ...devices["Desktop Firefox"],
        launchOptions: {
          firefoxUserPrefs: {
            "layout.css.scroll-driven-animations.enabled": false,
          },
        },
      },
    },
    {
      name: "iphone",
      testMatch: /(-mobile|smoke)\.spec\.ts$/,
      use: { ...devices["iPhone 15"] },
    },
    {
      name: "mobile-perf",
      grep: /@perf/,
      dependencies: ["desktop", "mobile", "landing-fallback", "iphone"],
      use: phone,
    },
  ],
});
