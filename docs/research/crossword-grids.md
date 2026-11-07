# Crossword grid standards

Why: the open 11x11 grids were a "minefield" of crossings, and nothing stopped the fill repeating across crosswords. T158 sets one standard per shelf and has `puzzles:verify` enforce it. Grid shape only: every clue stays original (SPEC §10 decision 6).

## The three shelves

| Shelf | Size | Grid | Who it is for |
| --- | --- | --- | --- |
| Mini | 11x11 | Lightly blocked, every word has a free letter or two | A quick break |
| Quick | 13x13 | British blocked lattice, plain clues (definitions, short synonyms) | The Guardian Quick, Telegraph Quick, Radio Times special |
| Cryptic | 13x13 or 15x15 | The same lattice family, wordplay clues | Cryptic solvers |

"Quick" is the UK name for the non-cryptic crossword. The Times calls it Concise. American papers just call it "the crossword" because American grids are the open kind (every letter in two words).

## How a British blocked grid is built

- 180 degree rotational symmetry.
- A lattice: blocks sit on alternate rows and columns, so about half the letters of each word are checked and nobody has to guess a word from crossings alone. The Times rule is that each word has at least half its letters checked, with two unchecked letters in a row allowed but not at the start or end of a word. Only about half the squares are checked in a cryptic grid, where an American grid checks all of them.
- No two-letter words. The American convention agrees, and so do the British ones.
- No more than about a third of the cells black (the American rough limit is 16%, the British lattice sits near 28%; we cap at 40%).
- Every word at least three letters; word lengths varied; a 13x13 has about 24 to 30 entries and a 15x15 about 28 to 32.
- The white cells are one connected region ("all-over interlock").
- Across and down entry counts balance.
- No word twice in a grid, and no two words sharing a root (T135's rule).

## What we adopt

Thresholds live in `src/puzzles/crossword/standards.ts` (`GRID_STANDARDS`) and are enforced by `verifyCrossword`.

| Rule | Mini | Quick | Cryptic |
| --- | --- | --- | --- |
| 180 degree symmetry | yes | yes | yes |
| Shortest entry | 3 | 3 | 3 |
| Letters checked (share of white cells) | at least 60%, aim 60% to 75% | 30% to 60% | 30% to 60% |
| Entries | at most 32, aim 24 to 28 | aim 24 to 30 | aim 24 to 32 |
| Every entry has a checked and an unchecked letter | no | yes | yes |
| Black cells (share of the grid) | no cap | at most 40% | at most 40% |
| Connected white cells | yes | yes | yes |
| No repeated entry, no repeated root | yes | yes | yes |

Quick and Cryptic share the lattice family, so the two shelves look like one paper's crosswords. The Mini allows a fully open grid but the aim is the lighter lattice: a fully open grid checks every letter whatever the word count, so fewer words only means longer words. The only way to reduce crossings is blocks.

`pnpm content:audit-words` adds a library-wide rule: no answer of four or more letters is shared between two crosswords (a failure), and repeats between other word games are warnings.

## Sources read

- Wikipedia, "Crossword": American grids (all letters checked, no two-letter words, about 16% black, 15x15 with 180 degree symmetry, all-over interlock) against the British lattice style.
- Wikipedia, "Cryptic crossword": 15x15 with half-turn symmetry, the Times Quick Cryptic at 13x13, about half the squares checked, the Times checking rule above, stock grids.
- `docs/SPEC.md` §1.2.1, the Radio Times special layout (a 15x15 quick crossword), and §2.3 for the shared crossword tables.

## Rejected

- American open grids for the big shelf: this is the complaint that started T158, and they stay only as the Mini.
- Barred grids and variety grids: a different solver UI.
- A 15x15 Quick: 13x13 fits a phone, matches the Times Quick Cryptic size and needs half the clues to write.
- Stricter "at least half of each word checked" than ours: the 30% to 60% band and the one-checked, one-unchecked rule are checkable cell by cell, and a hand-set lattice meets the half-checked rule anyway.
