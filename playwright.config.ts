import { existsSync } from "node:fs";
import { defineConfig, devices } from "@playwright/test";

if (existsSync(".env.local")) process.loadEnvFile(".env.local");

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";

/** The bypass secret goes only to this project's own Vercel origins, never to whatever base URL a run is given. */
const bypass = /^(ludwigpuzzles\.com|ludwig-orcin\.vercel\.app|ludwig-[a-z0-9-]+-maxitects-projects\.vercel\.app)$/.test(
  new URL(baseURL).hostname,
)
  ? process.env.VERCEL_AUTOMATION_BYPASS_SECRET
  : undefined;

const phone = {
  ...devices["Desktop Chrome"],
  viewport: { width: 390, height: 844 },
  isMobile: true,
  hasTouch: true,
};

export default defineConfig({
  testDir: "./e2e",
  use: {
    baseURL,
    trace: "retain-on-failure",
    serviceWorkers: "block",
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
      name: "tablet",
      testMatch: /-tablet\.spec\.ts$/,
      use: { ...devices["iPad (gen 7)"] },
    },
    {
      name: "mobile-perf",
      grep: /@perf/,
      dependencies: ["desktop", "mobile", "landing-fallback", "iphone"],
      use: phone,
    },
  ],
});
