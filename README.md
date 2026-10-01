# Ludwig

An unofficial, non-commercial fan site: a puzzle app styled after the BBC One drama _Ludwig_. It features Reverse Chess, the Gear Puzzle, and a library of word, logic and cipher puzzles. It is not affiliated with the BBC.

## Docs

- [`docs/SPEC.md`](docs/SPEC.md): what we're building
- [`docs/PLAN.md`](docs/PLAN.md): how, and in what order
- [`docs/tickets/`](docs/tickets/README.md): implementation tickets and the agent execution protocol
- [`CLAUDE.md`](CLAUDE.md) and [`.claude/rules/`](.claude/rules): coding rules

## Local setup

1. Install dependencies: `pnpm install`.
2. Start Postgres 17: `docker compose up -d`.
3. Copy the env template: `cp .env.example .env.local`, then set `BETTER_AUTH_SECRET` to a random string of 32 or more characters.
4. Start the dev server: `pnpm dev`.
5. Install the browser for end-to-end tests once: `pnpm exec playwright install chromium`.

## Deployment

Vercel, with Neon Postgres. Details arrive with ticket T009 (see [`docs/SPEC.md`](docs/SPEC.md) §7.7).
