---
id: T158
title: "Crossword grid standards: a Quick shelf of blocked grids, Mini for the open grids, and a word audit across the word games (high priority)"
milestone: M5
epic: E8
depends_on: [T135]
migrations: true
requires_human: true
preview: false
spec: ["SPEC §2.3", "SPEC §4.6", "SPEC §7.4.4", "SPEC §10 decision 6", "PLAN §5.4"]
skills: ["/db-trigger"]
---

# T158: Crossword grid standards: a Quick shelf of blocked grids, Mini for the open grids, and a word audit across the word games

## Context

User feedback: the quick crosswords are "a minefield" of overlapping words, and the word games keep reusing the same fill (GENE was the example). Measured on `content/` (2026-11-07):

| Grid | Style | Size | White cells | Entries | Letters checked | Entries fully checked |
|---|---|---|---|---|---|---|
| fine-print | cryptic | 15×15 | 72% | 36 | 34% | 0% |
| loose-ends, red-herring | cryptic | 13×13 | 72% | 28 | 34% | 0% |
| fresh-ink, margin-notes, paper-round, pencil-case, second-draft | quick | 11×11 | 75% | 42 | **100%** | **100%** |

The five "quick" grids are American-style open grids: every letter is in two words, so the solver fights 42 short entries on an 11×11 and every square is a crossing. The cryptics are British blocked grids (about a third of letters checked, half the entries in each direction unchecked between crossings), which is the format of every UK non-cryptic crossword too (Guardian Quick, Times Concise, the Radio Times special in SPEC §1.2.1).

The user's direction (2026-11-07): the open grids stay as a category of their own, called **Mini**, and the library needs a category of proper, non-cryptic, blocked-grid crosswords. In UK papers that category is called **Quick** (Guardian, Telegraph, Independent, Radio Times); the Times calls it Concise, and in American papers it is simply "the crossword", because American grids are the open kind. Quick is the right name for the big non-cryptic format, so the shelves are Mini, Quick and Cryptic. Keeping the five existing grids keeps their production attempts (fresh-ink 2 solved, margin-notes 1, paper-round 1, pencil-case 3, second-draft 1) untouched.

The user also asked whether the Minis can have fewer overlaps by having fewer words. In a fully open grid every letter is a crossing whatever the word count, so fewer words only means longer words. The only way to reduce crossings is blocks. The Mini standard below therefore allows some unchecked letters (a lighter lattice than Quick). The user approved (2026-11-07) deleting the production attempts on the five existing Minis so they can be regridded to that standard under their current slugs.

Fill reuse across the eight crosswords is 15 of 287 entries, mostly three-letter words (CAR, ART, SIT, TOE, ACT, END, AND, EYE) plus GENE, IDEA, EARTH, CRAB, ENTIRE, BANANA and READER. Nothing checks for it. Across the other word games (anagram, acrostic, word ladder, word wheel, keyword, word search) the only repeat found is CLUE in two word searches, but nothing checks there either.

## Scope

**In**

- **Three styles.** Add `mini` to the `crossword_style` enum (an additive migration; the old deploy keeps working). The five existing open grids become `style: "mini"` (a content-file edit only; the seed updates the subtype row and never touches a cell, so attempt data is safe). `quick` keeps its enum value and is redefined as the blocked, non-cryptic format. Shelves read "Mini", "Quick" and "Cryptic" in that order of difficulty; the Collection card description says what each is. Naming is the user's call before the content is written (see Notes); the ticket assumes Mini and Quick.
- **Research note** `docs/research/crossword-grids.md`, short and sourced, on how a British blocked grid is built, and what we adopt for Quick and Cryptic: 180° rotational symmetry; a lattice where alternate rows and columns carry the blocks so that about half the letters of each entry are checked and no entry is fully unchecked or fully checked; no two-letter entries; at most about a third of cells black; every entry at least three letters; word lengths varied (a 13×13 has about 24 to 30 entries, a 15×15 about 28 to 32); the grid fully connected; across and down entry counts balanced; no entry repeated within the grid and no entry sharing a root with another (T135's rule); Quick and Cryptic sharing the same lattice family so the shelves look like one paper's crosswords. For Mini, state the small-grid rules: 11×11, symmetric, no two-letter entries, 24 to 32 entries, at least 60% of letters checked (a fully open grid is allowed but not the aim; new Minis should land around 60% to 75% so most words have a free letter or two). Record the sources read (Guardian and Times style notes, the Radio Times special layout from SPEC §1.2.1, standard setters' guides) and what was rejected.
- **Rules in the verifier** (`src/puzzles/crossword/verify.ts`), per style, so `puzzles:verify` enforces them on every crossword: symmetry for all (move the content test's check here); no two-letter entries for all; for Quick and Cryptic, every entry has at least one checked and at least one unchecked letter, the whole-grid checked ratio between 30% and 60%, black cells at most 40%; for Mini, at least 60% of letters checked and at most 32 entries; for all, no repeated entry within a grid and no repeated root (same stem of 4+ letters). Put the thresholds in one named place so a setter reads them.
- **Library-wide fill audit.** A script, `pnpm content:audit-words`, that derives every answer word from every word-game content file (crossword entries via `derive.ts`, anagram answers, word-ladder start, end and rungs, word-wheel targets, word-search words, acrostic messages and keyword cipher keywords) and lists any word of four or more letters that appears in more than one file, by file. Run it inside `puzzles:verify`: a failure for crossword entries of four or more letters shared between two crosswords, a warning elsewhere (a word search and an anagram may share a word). Record the first run's output in the report.
- **Five Quick grids,** new content under new slugs: 13×13 blocked grids meeting the rules above, original quick clues (definitions and short synonyms, no cryptic devices), difficulties 2 to 3, in a "Quick" volume with `volumePosition`, and no fill of four or more letters shared with any other crossword. The five Mini grids keep their slugs, titles and volume. Give two of the new Quick grids weekly slots in `content/weekly.ts` in place of two future Mini slots (the schedule runs to June 2027), so they get an airing.
- **Regrid the five Minis** to the lighter standard (about 60% to 75% checked, 24 to 28 entries), keeping slugs, titles, volume positions and weekly slots, with new original quick clues where the fill changes and no fill of four or more letters shared with any other crossword. Their eight production attempts (fresh-ink 2, margin-notes 1, paper-round 1, pencil-case 3, second-draft 1) must go first or the seed fails (T072): the user approved the deletion on 2026-11-07. The orchestrator runs it on Neon `main` **after the PR is approved and immediately before merging**, so the production build's seed finds no attempt cells on the changed grids: `delete from attempts where puzzle_id in (select id from puzzles where type_key = 'crossword' and slug in ('fresh-ink','margin-notes','paper-round','pencil-case','second-draft'))` (cascades to the cells and hints). Record the row counts before and after in the report. Local and preview databases do the same in their own branch.
- **Existing grids.** Run the new verifier on all eight; fix any rule a Mini or Cryptic breaks, keeping every existing cell (the two cryptics with an unsolved attempt, `fine-print` and `loose-ends`, must keep their cells; a block change there fails the seed).
- **Docs.** SPEC §2.3 crossword row: three styles with sizes. SPEC §7.4.4: the enum value. PLAN §5.4: link the research note and the rules.

**Out**

- A crossword grid generator or auto-fill (consider a follow-up if the rules make hand-setting slow).
- Cryptic clue rewrites beyond what a rule breach forces.
- The crossword solver UI.

## Notes

- Every clue stays original (SPEC §10 decision 6). No Guardian or Times clues, ever; the sources are for grid shape only.
- Names are settled: Mini, Quick, Cryptic (user, 2026-11-07). The enum gains `mini` and the five existing files change one field.
- `derive.ts` already derives runs and answers; build the audit on it rather than a second parser. `scripts/format-content.ts` formats content files; run it after writing grids.
- Human step: a review of the ten grids (five regridded Minis, five Quicks) (a screenshot of each, both themes, 1280px) and a sample of clues before merge.

## Acceptance criteria

- [ ] **AC1**: The research note exists and the adopted rules are stated with sources.
  - _Verify (code):_ `docs/research/crossword-grids.md` lists the rules in the verifier with their thresholds, per style, and names at least three sources.
- [ ] **AC2**: The enum gains the new style without breaking existing rows.
  - _Verify (db):_ after `pnpm db:migrate`, inserting a `crossword_puzzles` row with the new style succeeds, and an unknown style is rejected; the integrity test covers it.
- [ ] **AC3**: The verifier enforces the standard per style.
  - _Verify (unit):_ tests in `verify.test.ts` fail a grid for each rule (asymmetry, a two-letter entry, a fully checked Quick entry, a fully unchecked Quick entry, checked ratio out of range, too many blocks, a Mini under 60% checked, a repeated entry, a repeated root) and pass a conforming 13×13 Quick fixture and an 11×11 Mini fixture.
- [ ] **AC4**: Every published crossword passes, and the Quick shelf is blocked grids.
  - _Verify (cli):_ `pnpm puzzles:verify` passes; the measurement script from this ticket's context shows every Quick grid at 13×13 with 30% to 60% of letters checked and 24 to 30 entries, and every Mini grid at 11×11 between 60% and 75% checked with 24 to 28 entries.
- [ ] **AC5**: No fill of four or more letters is shared between two crosswords.
  - _Verify (cli):_ `pnpm content:audit-words` reports no crossword repeat and lists any cross-type repeats as warnings.
- [ ] **AC6**: The seed applies the content, and the attempt deletion is recorded.
  - _Verify (db):_ locally, `pnpm db:seed` with attempts on the old Mini grids fails with the T072 named error; after the deletion statement it exits 0. On production the report records the before and after counts of the deletion, run right before the merge, and the production build log shows the seed succeeding.
- [ ] **AC7**: The shelves and the weekly schedule resolve.
  - _Verify (browser):_ `/puzzles/crossword` shows Mini, Quick and Cryptic shelves with the right grids; `/this-week` renders every slot; "Next in volume" walks the Quick volume in order. Screenshots in both themes at 1280px and 390px.
- [ ] **AC8**: The user approves the grids and clues.
  - _Verify (human):_ screenshots of each of the ten grids in `.verification/T158/` and a clue sample in the report, approved by the user on the PR.
- [ ] **AC9**: Gates pass.
  - _Verify (cli):_ `pnpm typecheck && pnpm lint && pnpm test && pnpm build && pnpm puzzles:verify` exits 0.
