import { spawnSync } from "node:child_process";

/**
 * Runs the production-safe Playwright selection (tests tagged `@smoke`: signed out, no account, no database write)
 * against a deployed origin: `pnpm smoke https://ludwigpuzzles.com`. Extra arguments go to Playwright.
 * `VERCEL_AUTOMATION_BYPASS_SECRET` (read from `.env.local` by `playwright.config.ts`) takes the browser past Vercel's bot challenge.
 */
const [target, ...rest] = process.argv.slice(2);

if (!target || !URL.canParse(target)) {
  console.error("usage: pnpm smoke <url> [playwright args]");
  process.exit(1);
}

const { status } = spawnSync(
  "pnpm",
  ["exec", "playwright", "test", "--grep", "@smoke", "--project", "desktop", ...rest],
  {
    stdio: "inherit",
    env: { ...process.env, PLAYWRIGHT_BASE_URL: new URL(target).origin },
  },
);

process.exit(status ?? 1);
