---
id: T013
title: "shadcn restyle C: tabs, toggle-group, slider, progress, form"
milestone: M1
epic: E3
depends_on: [T011]
migrations: false
requires_human: false
spec: ["SPEC §6.4", "SPEC §7.3", "SPEC §7.4.6"]
skills: [/zod4]
---

# T013: shadcn restyle C (controls and forms)

## Context

These are the remaining primitives: selection controls drawn as crossword-cell rows, the slider later reused as the gear crank thumb, and the form wrapper used by auth and settings.

## Scope

**In**

- `pnpm dlx shadcn@latest add tabs toggle-group slider progress form`, restyled per SPEC §6.4:
  - **Tabs and ToggleGroup:** rows of square cells. The active cell is filled with ink.
  - **Slider:** a thin ink rail with a cog-shaped thumb, so its SVG thumb can be reused by the gear crank.
  - **Progress:** a row of cells filling in ink.
  - **Form:** the shadcn react-hook-form wrapper. Error text is in `blood`, labels use `font-display` caps.
- Refactor the T008 auth forms onto the restyled `Form` if T008 used bare inputs. Keep their behaviour identical.

**Out**

- The gear crank behaviour (T038).
- The settings page (T065).

## Notes

- `form` pulls in `react-hook-form` and `@hookform/resolvers`. Use `zodResolver` with schemas composed from `drizzle-orm/zod` (SPEC §7.4.6). Never hand-write form schemas that duplicate columns.

## Acceptance criteria

- [ ] **AC1**: All five components are installed in `src/components/ui/`.
  - _Verify (cli):_ `ls src/components/ui/{tabs,toggle-group,slider,progress,form}.tsx` lists all five.
- [ ] **AC2**: No `rounded-*`, raw hex or palette colours appear.
  - _Verify (code):_ `grep -nE "rounded-|#[0-9a-fA-F]{3,6}\b|-(red|blue|gray|slate|zinc|neutral)-[0-9]" src/components/ui/{tabs,toggle-group,slider,progress,form}.tsx` matches nothing.
- [ ] **AC3**: The active tab or toggle cell has an ink background and paper text, and inactive cells are paper.
  - _Verify (browser):_ On a test page, compare the computed `background-color` of active and inactive items against the `--ink` and `--paper` values.
- [ ] **AC4**: The slider is keyboard-operable and its thumb renders as a cog SVG.
  - _Verify (browser):_
    - Focus the thumb and press ArrowRight 3 times; `aria-valuenow` goes up by 3 steps.
    - The snapshot shows an `svg` inside the thumb.
- [ ] **AC5**: Form validation errors show in `blood` and are linked through `aria-describedby`.
  - _Verify (browser):_ Submit the sign-in form empty. Error text appears, its colour matches `--blood`, and the input's `aria-describedby` references the error element's id.
- [ ] **AC6**: The auth forms still sign up and sign in successfully after the refactor.
  - _Verify (browser):_ Sign up `T013-1@test.local` through the UI; you land signed in. Sign out, then sign in again successfully.
- [ ] **AC7**: The controls look correct in both themes.
  - _Verify (browser):_ Screenshots of the tabs, toggle group, slider, progress and a form with errors, in Paper and Ink at 1280px and 390px, under `.verification/T013/`.
- [ ] **AC8**: Gates and the PLAN §5.3 definition of done pass.
  - _Verify (cli):_ `pnpm typecheck && pnpm lint && pnpm test && pnpm build` exits 0.
