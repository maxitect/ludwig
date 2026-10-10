---
id: T144
title: About page (who made this, why, and how to get in touch)
milestone: M5
epic: E10
depends_on: []
migrations: false
requires_human: true
preview: true
spec: ["SPEC §6 (visual design)", "SPEC §10 (decisions 2 and 4)"]
skills: []
---

# T144: About page (who made this, why, and how to get in touch)

## Context

The site has no page about who made it or why. Before launch it needs one: Max, why the site exists, a love of _Ludwig_ and of puzzles and solving hard problems, a link to the blog, and a way to get in touch. It is also the natural home for the full credits that SPEC §10 decision 2 calls the "footer/about page".

## Scope

**In**

- **Route.** `/about`, a static Server Component in the `(app)` group with the same frame as Settings (`GridPaper`, `Credit` heading, `max-w-xl` column). It has no session reads, so it prerenders.
- **Sections:**
  1. Who I am: Max, a short intro.
  2. Why this site: watching _Ludwig_, the two puzzles from the show that started it (Reverse Chess, S1E4, and the Gear Puzzle, S2E2), and a love of puzzles and of working at complex problems until they give.
  3. What's here: one line each on the flagships and the library, linking to `/reverse-chess`, `/gears` and `/puzzles`.
  4. Get in touch: a `mailto:` link and the blog link.
  5. Credits: the fan-site disclaimer and the chess-piece and font credits, which move here from the footer.
- **Footer.** It keeps the disclaimer line and gets an "About and credits" link. The credit paragraphs move to `/about`.
- **Metadata.** Title "About | Ludwig." and a description.

**Out**

- A contact form. Mailto was chosen.
- Analytics, newsletter sign-up, socials beyond what the user supplies.

## Notes

- **Human checkpoint.** Before building, get from the user: the blog URL, the contact email address, any other links, and how they want to be named (first name only or full name). Then draft the copy in the user's voice from the points above and get it approved before it ships. Record both in the report. Don't invent biography.
- Keep the copy short: a page, not an essay. Write it in British English.
- A mailto link exposes the address to scrapers. The user accepted that by choosing mailto.

## Acceptance criteria

- [ ] **AC1**: The user has supplied the links and approved the copy.
  - _Verify (human):_ the approvals are quoted in the report.
- [ ] **AC2**: `/about` renders every section, the blog and mailto links are correct, and the internal links resolve.
  - _Verify (browser):_ snapshot plus a link check. There are no console errors.
- [ ] **AC3**: The footer shows the disclaimer and the About link on every page, and the credits appear only on `/about`.
  - _Verify (browser + code):_ `grep -rn "cburnett" src` finds only the about page.
- [ ] **AC4**: The page is static.
  - _Verify (cli):_ the `pnpm build` route table marks `/about` as prerendered.
- [ ] **AC5**: Both themes at 1280px and 390px.
  - _Verify (browser):_ screenshots.
- [ ] **AC6**: Gates pass.
  - _Verify (cli):_ `pnpm typecheck && pnpm lint && pnpm test && pnpm build` exits 0.
