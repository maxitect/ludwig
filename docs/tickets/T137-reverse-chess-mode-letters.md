---
id: T137
title: "Reverse Chess mode letters: Proof Game is Mode C, the Rota is Mode D"
milestone: M5
epic: E6
depends_on: []
migrations: false
requires_human: false
spec: ["SPEC §2.3", "SPEC §5.1", "PLAN §3"]
skills: []
---

# T137: Reverse Chess mode letters: Proof Game is Mode C, the Rota is Mode D

## Context

The `/reverse-chess` hub labels both Unwind and Proof Game "Mode B", which reads as an error. The user decided (2026-10-07) that Proof Game gets its own letter, Mode C, and the Rota becomes Mode D.

## Scope

**In**

- Hub labels in `src/app/(app)/reverse-chess/page.tsx`: Proof Game "Mode C", the Rota "Mode D".
- SPEC: §5.1 gives Proof Game its own Mode C heading (it still uses the Unwind solver and the `initial_position` goal kind, so say that it is presented as its own mode) and renames "Mode C: The Rota" to Mode D; update every other "Mode C" that means the Rota (§2.3 table, §7.4.4 rota row, M4 row and elsewhere).
- PLAN and the README titles of open or done tickets that say "Mode C" for the Rota.
- Code comments that say "Mode C" for the Rota.

**Out**

- The `rota` type key, tables, file names and the `unwind` mode value. Only labels and docs change.
- Done tickets' bodies and reports, which stay as history.
- "Mode B" for the Gear Puzzle's gear train.

## Acceptance criteria

- [ ] **AC1**: The hub shows Mode A, B, C and D once each, in that order.
  - _Verify (browser):_ screenshot `/reverse-chess` in Paper and Ink at 1280px and 390px.
- [ ] **AC2**: No doc or comment calls the Rota Mode C.
  - _Verify (code):_ `grep -rn "Mode C" docs/SPEC.md docs/PLAN.md docs/tickets/README.md src` finds only Proof Game references.
- [ ] **AC3**: The preview shows the new labels.
  - _Verify (deploy):_ `vercel curl --yes --deployment <preview-url> /reverse-chess` contains "Mode D".
- [ ] **AC4**: Gates pass.
  - _Verify (cli):_ `pnpm typecheck && pnpm lint && pnpm test && pnpm build` exits 0.
