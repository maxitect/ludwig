---
id: T174
title: "Audit the desktop solve panel after T170: scrolling, spacing, what should fold away, and classic gears"
milestone: M5
epic: E12
depends_on: [T170]
migrations: false
requires_human: false
preview: false
spec: ["SPEC §4.5", "SPEC §6.7"]
skills: []
---

# T174: Audit the desktop solve panel after T170: scrolling, spacing, what should fold away, and classic gears

## Context

T170 built the desktop board-and-panel layout from T169's audit. User feedback on production (2026-11-24): it did a good job, and it needs a second pass.

- **The panel's scroll areas work, but they look bad and are poor to use.** Seen on the rota (`canteen-queue`), the logic grid (`cold-frame`), knights and knaves (`by-the-fire`) and the crossword. The system scrollbar is visible and "looks terrible", and it is tight against the content. The content runs straight into Check and Reset with nothing between them: on `cold-frame` clue 14 is cut in half by the Check button, and on `by-the-fire` the fourth card is.
- **The user wants a better answer than the scrollbar.** Long panel content should fold away where it can: sections with a caret that open and close. Where a scroll area is still the right answer, it needs padding between it and the buttons and content around it, and its scrollbar must be hidden or drawn in the house style.
- **The crossword** should show one clue list at a time. Across and Down are two sections, opening one closes the other, and the open one is the direction the grid is typing in.
- **The panel has no margin.** On the pictogram cipher (`first-drawing`) the key's sheet touches Check and Reset, and the page has too little space between the layout and the site footer. The user believes this is true of every type, and named `caesar` and `keyword` as well.
- **Classic gears must use the same layout** as everything else: the diagram on the left, the controls on the right. T169 and T170 recorded it as excluded on the user's call. That was a miscommunication, and it is reversed here.

This ticket is the audit, like T169. It measures every type against the built layout, turns each fault into a finding and writes down, per type, what T175 has to build. It changes no app code. T175 implements from this ticket's document.

## Scope

**In**

- **Extend the measuring script,** `scripts/dev/audit-desktop-layout.mts`, with a `--panel` mode. Against a local production build, at 1440×800 and 1280×650 with a fine pointer, for the representative puzzle of every registry type (both Reverse Chess modes) and for the largest case of each type that grows (T169's document, section 6), it records:
  - **every scroll container inside the solve section:** its selector, `clientHeight`, `scrollHeight`, how far it overflows, the width its scrollbar takes from the content, and the gap between the scrollbar and the content beside it and the edge of the panel. Scrolling works; this measures how it looks and how often the player has to do it;
  - **clipped content:** every element inside a scroll container that is cut by the container's edge at rest, and the last one's name;
  - **gaps:** the distance from the bottom of the panel's last content to the top of Check and Reset, from the bottom of Check and Reset (and of the status line) to the bottom of the section, from the section to the site footer's rule, and between the board column's bottom edge and the panel's;
  - **dead space:** the board's box against its column's, so a 486px board in an 832px column shows as 346px unused;
  - **each panel block's natural height** (unclipped), so the document can say which blocks fit together and which must fold away.

  Screenshots go to `.verification/T174/`, open and solved, at both sizes.
- **The results document,** `docs/research/desktop-solve-panel-audit.md`, holding:
  - **the findings table,** one row per distinct fault, with the types it hits, its cause in the source (file and class) and its severity (`broken`, `cramped`, `polish`);
  - **the scroll verdict:** for each scroll container, whether folding (or a wider panel) removes it, and for each one that stays, its design: hidden or house-style scrollbar, the padding around it, and how the player can tell there is more below when the scrollbar is hidden;
  - **a section plan for every panel type:** the panel's blocks in order, each marked `always shown`, `section, open at first` or `section, closed at first`, and which sections are exclusive (one open at a time). The plan must come with the heights that prove it: for each type and both sizes, the open-at-first state fits the panel budget without scrolling, or the row says why it cannot and what the fallback is;
  - **the spacing rule:** one set of numbers for the panel's padding, the gap above Check and Reset, the gap below the status line, the space between the layout and the site footer, and how a bordered sheet (`paper-sheet`) sits in the panel so its border never touches a button. State it once, then list every type that breaks it today;
  - **the panel width per type.** T170 fixed 24rem (18rem for the book cipher) and noted the wide empty gutter beside a height-bound board at 1280×650. Say for each type whether a wider panel (and so two columns of clues, or no folding at all) is the better answer than sections, with the board size that results;
  - **what goes on the left for types without a board** (`knights-knaves`, `caesar`, `keyword`, `pictogram-cipher`, `napkin-maths`, `acrostic`, `word-ladder`): today knights and knaves has two lines of text in an 830px column and four cards squeezed into the panel;
  - **the classic gears plan:** which of `GearBoard`, `Scrubber`, the convergence status, the seeing count, the crank stepper, `StateTableToggle` and `StateTable`, `SwapPanel`, the Fix the Diagram quotation and the accusation go in the board cell and which in the panel, in what order and in which sections, the diagram size at both viewports for the largest curated diagram and today's daily, and what `e2e/gears-layout.spec.ts` and the reading-column test in `e2e/spot-difference-desktop.spec.ts` must change to;
  - **the solved state:** for each type, that the solved footer (stamp, time, epilogue, "Next in volume") fits the panel with the sections in the state the plan leaves them, including `anagram` and `odd-one-out`, whose stamp ends 18px and 74px past the fold at 1280×650 today (T170 report, Review);
  - **anything else found.** Look at every type's screenshot at both sizes, open and solved, in Paper and Ink, and record what reads badly, with a severity. This is a judgment pass, not only a measurement.
- **Decisions already taken by the user,** recorded in the document as fixed:
  - folding into sections opened by a caret is preferred to scrolling;
  - the system scrollbar is never shown as it is today: a scroll area that stays has its scrollbar hidden or styled, and padding between it and the buttons and content around it;
  - the crossword's Across and Down are two exclusive sections, and the open one follows the grid's typing direction;
  - classic `gears` is a `panel` type: diagram left, controls right;
  - the spacing fix applies to every type, not only the ciphers.
- **Write T175's per-type detail.** Update `docs/tickets/T175-desktop-solve-panel-remediation.md` where the audit contradicts it: its list of findings, its section plans, its spacing numbers and its named test puzzles. The audit is the authority.

**Out**

- Any change under `src/`, `content/` or `e2e/`. Building is T175.
- Phones and tablets (`touch`), and widths below 1024px: not audited, apart from noting where a T175 change could leak into them.
- `spot-difference` stays excluded. Measure its gaps to the footer, and record a finding only if it breaks the spacing rule.
- The layout shift on solve pages and the hanging prefetch: T173.

## Notes

- **Read first:** `docs/research/desktop-solve-layout.md` (T169), `docs/tickets/reports/T170.md`, `src/components/puzzle/solve-chrome.tsx`, `src/puzzles/_shared/solve-layout.tsx` and SPEC §4.5.
- **Findings from reading the source and the user's four screenshots** (production, about 1000px of viewport height). Treat each as a lead to confirm or refute by measurement, and add to them:
  1. **No space between the scrolling body and Check.** `PanelCell`'s body is `overflow-y-auto` in the grid's `minmax(0,1fr)` row with `panel:pb-3` inside the scroller, and Check and Reset are the next row with no top padding or rule. Content is clipped flush against the buttons.
  2. **The sheet touches the buttons on the ciphers.** `cipher-key-panel.tsx` puts `panel:paper-sheet` on the `PanelCell` itself, so `pb-3` is inside the sheet's border and the border meets Check. The board sheet (`row-span-6`) also ends lower than the panel column, so the two columns' bottoms do not line up.
  3. **Tight to the site footer.** The section is `100dvh - 5.625rem` tall and `main` has 12px of bottom padding, so Check's hard shadow sits almost on the footer's rule.
  4. **Native scrollbars.** `globals.css` has no scrollbar styling, so the panel shows the system's scrollbar (a rounded thumb on a light track over the grain), which is outside the house style (`.claude/rules/design-system.md`: nothing rounded). The body has only `panel:px-1`, so the scrollbar sits against the content. This is the user's main complaint.
  5. **Rota:** the incident sheet is pinned, and the pinned rota, How to play, Clues, Unswaps so far and the accusation all share one scroller. The pinned rota's list is `grid-cols-2 sm:grid-cols-3`, which follows the viewport and not the 24rem panel, so each entry wraps onto two lines.
  6. **Logic grid:** 15 clues in a 24rem panel beside a board that leaves about 350px of its column empty; the board is left-aligned in its column where other boards are centred.
  7. **Knights and knaves:** the statement cards are in the panel and the board cell holds two paragraphs. The cards may belong on the left as a grid, with the question and rule in the panel.
  8. **Crossword:** `ClueTabs split` force-mounts both lists, each its own scroller (`min-h-0 flex-1`), so there are two short scroll areas in one panel. The pinned clue line above them stays the single `aria-live` announcement.
  9. **Pictogram cipher:** the ciphertext takes two rows of a sheet that fills the whole board column. The glyphs may be able to grow with the sheet.
  10. **Board-only types** (`anagram`, `odd-one-out`): solved, the stamp is past the fold at 1280×650.
- **A section may still be taller than the panel** (15 logic-grid clues at 650px). Folding does not remove that case. For each one, the document must choose: a wider panel, a second column, smaller type, or one scroll area inside the open section. If a scroll area remains anywhere, the document specifies it: where the single scroller is, whether its scrollbar is hidden or a square house-style one (`scrollbar-width`, `scrollbar-color`, and what WebKit needs), the padding around it and at its end, and a hard rule (not a fade) where content is cut. A hidden scrollbar needs another sign that there is more below.
- **How sections might be built** is for the audit to recommend, with reasons: the native `<details name="…">` exclusive accordion (no script; rota's How to play is already a `<details>`), or shadcn's `accordion` restyled in place. Check keyboard behaviour and what a screen reader announces for both.
- **A wrong part must still be found.** After a failed check, T170 scrolls the framed clue or pair into view. With sections, the section holding it has to open. Record which types frame parts in the panel.
- Run against `pnpm build && pnpm start --port 3174`, not the dev server. Do not wait on `networkidle` (T173 explains why).
- `scripts/dev/` and docs only: a push touching nothing else skips CI and Vercel.

## Acceptance criteria

- [ ] **AC1**: The script measures every type's panel at both sizes.
  - _Verify (cli):_ `pnpm tsx scripts/dev/audit-desktop-layout.mts --panel --base http://localhost:3174 --out .verification/T174` exits 0 and prints one row per type and viewport (registry count plus the second Reverse Chess mode, `gears` and `spot-difference` included), with the scroll containers, clipped elements, gaps and dead space for each.
- [ ] **AC2**: Every scroll container has a verdict.
  - _Verify (code, browser):_ the document lists every scroll container the script found, per type and size, as `removed by folding`, `removed by a wider panel` or `stays`, and gives the design of each one that stays. Screenshots of `canteen-queue`, `cold-frame`, `by-the-fire` and one crossword at 1280×650 and 1440×1000, on Chromium and WebKit, show today's scrollbar and its gaps.
- [ ] **AC3**: Every finding has a cause and a severity.
  - _Verify (code):_ `docs/research/desktop-solve-panel-audit.md` has the findings table; each row names the types, a file and class or element, and `broken`, `cramped` or `polish`. Each of the ten leads in the Notes is confirmed or refuted by name.
- [ ] **AC4**: Every panel type has a section plan backed by heights.
  - _Verify (code):_ for every type in `panelSolveTypes` plus `gears`, the document lists the panel's blocks in order with their state at first paint and their natural heights at both sizes, and shows the open-at-first state against the panel budget. Each type whose plan still overflows names its fallback.
- [ ] **AC5**: The spacing rule is one set of numbers, and the breaches are listed.
  - _Verify (code):_ the document states the rule and has a table of measured gaps per type at both sizes, with every breach marked. `pictogram-cipher`, `caesar` and `keyword` are in it.
- [ ] **AC6**: Classic gears has a complete plan.
  - _Verify (code):_ the document places every part of `src/puzzles/gears/solver.tsx` in the board cell or a named panel section, gives the diagram's size at both viewports for the largest curated diagram and today's daily, covers Fix the Diagram and the state table, and names the e2e changes.
- [ ] **AC7**: The user's fixed decisions are recorded and respected.
  - _Verify (code):_ the document records the five decisions, the crossword's plan is two exclusive sections following the typing direction, and `gears` is `panel`.
- [ ] **AC8**: The screenshots exist and were looked at.
  - _Verify (browser):_ `.verification/T174/` holds one screenshot per type and size, open and solved, in Paper and Ink. The report embeds the rota, the logic grid, knights and knaves, the crossword, the pictogram cipher and classic gears at 1280×650, and the document's "anything else found" section says what was judged for each type.
- [ ] **AC9**: T175 agrees with the audit.
  - _Verify (code):_ T175's findings, section plans, spacing numbers and test puzzles match the document, and T175 names the document as its specification. `git diff --stat origin/main...HEAD` shows no file under `src/`, `content/` or `e2e/`.
- [ ] **AC10**: Gates pass.
  - _Verify (cli):_ `pnpm typecheck && pnpm lint && pnpm test && pnpm build` exits 0.
