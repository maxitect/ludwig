---
id: T037
title: SVG gear board and playtest prototype (checkpoint)
milestone: M3
epic: E7
depends_on: [T034, T018]
migrations: false
requires_human: false
spec: ["SPEC §5.2.4", "SPEC §6.3", "PLAN §3 (M3 order steps 4–5)", "PLAN §7 (gear fun risk)"]
skills: []
---

# T037: SVG gear board and playtest prototype (checkpoint)

## Context

PLAN §7 calls "the gear puzzle isn't fun" the biggest product risk. This ticket builds the real SVG board, plus a deliberately rough crank and convergence stepper, so the parameters can be evaluated **before** any polish. The evaluation is agent-run against measurable criteria. There is no human pause; the user may playtest later, and their feedback becomes a normal follow-up ticket.

## Scope

**In**

- `src/puzzles/gears/board.tsx`, an SVG floor:
  - paper texture, two faint rings and slot ticks;
  - ink-outlined cogs with their tooth counts;
  - a field-of-vision wedge drawn as a fan of red Xs;
  - the victim marker at the centre;
  - thin red sightlines for the gears that see the victim.
- It renders `stateAt(diagram, crank, f)` from T034.
- A temporary `solver.tsx` with rough controls: crank −/+ buttons, a convergence select (1–8) and a seeing-count readout. No animation.
- A preset switcher on the prototype page that lets the playtester try every difficulty preset from T035 and generate a new seed.

**Out**

- Full crank interaction (T038), animation (T039), accuse (T040) and polish.

## Parameter evaluation (replaces a human playtest)

- **Report script.** Add `scripts/gears-playtest-report.ts` (`pnpm puzzles:gears-report`). For each difficulty preset in `presets.ts`, over 500 seeds, it outputs:
  1. **near misses:** the mean number of (c, f) pairs where exactly 0 or exactly 2 gears see the victim;
  2. **solution spread:** the distribution of the solution's convergence index f, and the share of solutions with c = 0;
  3. **churn:** the mean number of gears whose `sees` flips between consecutive convergences;
  4. the generator acceptance rate and the mean generation time.
- **Accept a preset when all of these hold:**
  - near misses ≥ 3 (false paths exist, per Mr Todd's principle);
  - no single f holds more than 25% of solutions;
  - c = 0 in fewer than 5% of solutions;
  - churn ≥ 1;
  - acceptance rate ≥ 2%;
  - mean generation time < 50 ms.
- **Tuning.** Tune `m_in`/`m_out`, sector width, gear counts and the Fix the Diagram K values in `presets.ts` until every preset passes. Record the final values and the report table in SPEC §5.2.

## Acceptance criteria

- [ ] **AC1**: The board renders the engine state exactly.
  - _Verify (browser):_ seed a dev content file equal to T034 fixture F3, then open its solve route.
    1. Set crank 4 and convergence 2. A and B show sightlines; C doesn't.
    2. Switch to convergence 5. Only B shows a sightline.
    3. The readout says "1".
- [ ] **AC2**: The geometry matches the engine.
  - _Verify (browser):_ `browser_evaluate` reads each gear group's `data-slot` and `data-facing-deg`. The values equal `stateAt(F3, 4, 2)` from the T034 AC4 table.
- [ ] **AC3**: The visual language.
  - _Verify (browser):_ take screenshots in both themes at 1280px and 390px.
    - Vision wedges are drawn as Xs, not as filled areas.
    - Sightlines are `ludwig-red`.
    - Gears are ink outlines.
    - The board scales to fit 390px with no horizontal scroll.
- [ ] **AC4**: Accessible names.
  - _Verify (browser):_ `browser_snapshot` shows each gear with an accessible name such as "Gear B, 12 teeth".
- [ ] **AC5**: Presets and new seeds.
  - _Verify (browser):_ switching to each preset and pressing "New seed" renders a new diagram. The readout reaches exactly 1 at the generator's stored solution (use a hidden dev-only "show solution" toggle, which must not exist in production builds).
- [ ] **AC6**: The dev-only controls are excluded from production.
  - _Verify (cli):_ `pnpm build && grep -r "show solution" .next/server/app/puzzles -l` returns nothing, or the toggle is gated by `notFound()` / an env check. State which in the report.
- [ ] **AC7**: Every preset meets the evaluation criteria, and the result is recorded.
  - _Verify (cli + code):_ `pnpm puzzles:gears-report` shows every preset passing every threshold above. The SPEC §5.2 diff with the tuned values and the report table is committed. The T035 10,000-seed uniqueness test still passes with the tuned presets.
- [ ] **AC8**: Gates pass.
  - _Verify (cli):_ `pnpm typecheck && pnpm lint && pnpm test && pnpm build` exits 0.
