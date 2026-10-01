---
id: T031
title: /reverse-chess hub
milestone: M2
epic: E6
depends_on: [T029]
migrations: false
requires_human: false
spec: ["SPEC §3", "SPEC §5.1", "SPEC §1.3", "SPEC §6.3"]
skills: []
---

# T031: `/reverse-chess` hub

## Context

This is the flagship landing for Reverse Chess. It introduces the concept with the show's quote and lists the puzzles by mode. Rota (T063) adds a third section later.

## Scope

**In**

- The `/reverse-chess` page:
  - a credits-pattern header ("REVERSE / **CHESS**");
  - an intro card quoting John (SPEC §5.1 tagline);
  - a "How it works" explainer;
  - mode sections listing the published puzzles for `last_move` and `unwind`, with difficulty and solved state for signed-in users;
  - decorative oversized white pieces (SPEC §6.3).
- A nav link (it already exists in the T015 shell, so wire it up).

**Out**

- The Rota section (T063) and content (T032).

## Acceptance criteria

- [ ] **AC1**: The hub renders the published puzzles grouped by mode.
  - _Verify (browser + db):_ the count of list items per section equals `SELECT mode, count(*) FROM reverse_chess_puzzles r JOIN puzzles p ON p.id=r.puzzle_id WHERE p.published_at IS NOT NULL GROUP BY mode`.
- [ ] **AC2**: Unpublished puzzles are hidden.
  - _Verify (db + browser):_ set one fixture's `published_at = NULL`. It disappears from the hub after reload, and its solve route returns 404.
- [ ] **AC3**: Solved state for signed-in users.
  - _Verify (browser):_ as a user who solved one puzzle (follow T029 AC2), that item shows a solved mark. In a signed-out context no solved marks appear.
- [ ] **AC4**: The links work.
  - _Verify (browser):_ clicking an item navigates to `/puzzles/reverse-chess/<slug>`.
- [ ] **AC5**: Session reads don't block the static shell.
  - _Verify (next):_ `nextjs_call` route info shows `/reverse-chess` with a static shell, and the solved-state component sits behind `<Suspense>`. If the T006 decision turned Cache Components off, note that and skip this AC.
- [ ] **AC6**: Brand and visuals.
  - _Verify (browser):_ take screenshots in both themes at 1280px and 390px. The header uses the credits pattern, there is no rounded corner, and decorative pieces are hidden from assistive technology (`aria-hidden`). The console is clean.
- [ ] **AC7**: Keyboard and reduced motion.
  - _Verify (browser):_ every list item is reachable with Tab and has a visible focus ring. With `reducedMotion: 'reduce'` the decorative pieces don't animate.
- [ ] **AC8**: Gates pass.
  - _Verify (cli):_ `pnpm typecheck && pnpm lint && pnpm test && pnpm build` exits 0.
