---
id: T012
title: "shadcn restyle B: dialog, alert-dialog, sheet, dropdown-menu, tooltip, sonner"
milestone: M1
epic: E3
depends_on: [T011]
migrations: false
requires_human: false
spec: ["SPEC §6.4", "SPEC §6.6"]
skills: []
---

# T012: shadcn restyle B (overlays)

## Context

These are the overlay primitives used by the Reveal confirmation, the user menu, the mobile nav sheet and toasts. Each is restyled to the Ludwig treatments in SPEC §6.4.

## Scope

**In**

- `pnpm dlx shadcn@latest add dialog alert-dialog sheet dropdown-menu tooltip sonner`, restyled in place:
  - **Dialog and AlertDialog:** a paper sheet rotated −0.5°, a long `shadow` drop shadow and a 2px ink border. The title uses `Credit`-style caps.
  - **Sheet:** paper with a grain background and an ink border on its leading edge. It becomes the mobile nav bottom sheet in T015.
  - **DropdownMenu and Tooltip:** paper with ink borders, square corners and no soft blur shadows.
  - **Sonner:** paper slips with a red pencil underline. The `<Toaster />` is mounted once in the root layout, or left for T015 to mount. Record which you chose in the report.

**Out**

- Tabs, slider and form (T013).
- Wiring the overlays into real screens (T015, T018).

## Notes

- Keep Radix focus management intact. Only restyle; don't replace the primitives.
- The rotation must not apply under reduced motion if it is animated in. A static rotation is fine.

## Acceptance criteria

- [ ] **AC1**: All six components are installed in `src/components/ui/`.
  - _Verify (cli):_ `ls src/components/ui/{dialog,alert-dialog,sheet,dropdown-menu,tooltip,sonner}.tsx` lists all six.
- [ ] **AC2**: No `rounded-*`, raw hex or palette colours appear in these files.
  - _Verify (code):_ `grep -nE "rounded-|#[0-9a-fA-F]{3,6}\b|-(red|blue|gray|slate|zinc|neutral)-[0-9]" src/components/ui/{dialog,alert-dialog,sheet,dropdown-menu,tooltip,sonner}.tsx` matches nothing.
- [ ] **AC3**: The dialog content is rotated and has a hard ink border plus a long shadow.
  - _Verify (browser):_ Open the dialog on a test page. `getComputedStyle(content).transform` is a non-identity matrix equivalent to −0.5°, `border-top-width` is `2px` and `border-radius` is `0px`.
- [ ] **AC4**: The AlertDialog traps focus, closes on Escape and returns focus to its trigger.
  - _Verify (browser):_ Open it with the keyboard, press Tab repeatedly and check focus stays inside (`document.activeElement` is within the dialog). Press Escape; focus returns to the trigger.
- [ ] **AC5**: The dropdown menu and tooltip open with keyboard and pointer, and are styled with square corners and ink borders.
  - _Verify (browser):_ Open the dropdown with Enter on its trigger and navigate it with the arrow keys. Hover to open the tooltip. Computed styles show radius 0 and a 2px border.
- [ ] **AC6**: A toast renders as a paper slip with the red underline.
  - _Verify (browser):_ Trigger `toast("Test")` from the test page. The snapshot shows the toast, and the underline element's computed colour is the `--ludwig-red` value.
- [ ] **AC7**: The overlays look correct in both themes.
  - _Verify (browser):_ Screenshots of an open dialog, sheet, dropdown and toast in Paper and Ink at 1280px and 390px, under `.verification/T012/`.
- [ ] **AC8**: There are no console errors or accessibility warnings from Radix (such as a missing `DialogTitle`).
  - _Verify (browser):_ `browser_console_messages` has no errors or warnings.
- [ ] **AC9**: Gates and the PLAN §5.3 definition of done pass.
  - _Verify (cli):_ `pnpm typecheck && pnpm lint && pnpm test && pnpm build` exits 0.
