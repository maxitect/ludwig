---
id: T000
title: Short imperative title
milestone: M0
epic: E1
depends_on: []
migrations: false
requires_human: false
spec: ["SPEC §x.y"]
skills: []
---

# T000: Short imperative title

## Context

One or two sentences on why this ticket exists and where it sits in the plan. Link to the spec sections; don't copy them.

## Scope

**In**

- Concrete deliverables (files, routes, tables, components).

**Out**

- Things a reader might expect here that belong to another ticket (name the ticket).

## Notes

Only what isn't already in SPEC, PLAN, CLAUDE.md or the rules: gotchas, decisions taken for this ticket, docs to read (`node_modules/next/dist/docs/...`, library docs).

## Acceptance criteria

- [ ] **AC1**: Observable outcome stated as a fact.
  - _Verify (db):_ `psql "$DATABASE_URL" -c "…"` returns …
- [ ] **AC2**: …
  - _Verify (browser):_ Navigate to `/…`, do …, and expect …. Take screenshots in both themes at 1280px and 390px.
- [ ] **ACn**: Gates and the PLAN §5.3 definition of done pass.
  - _Verify (cli):_ `pnpm typecheck && pnpm lint && pnpm test && pnpm build` exits 0.
