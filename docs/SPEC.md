# Ludwig: Puzzle App Specification

Version 0.1 · 2026-10-01 · Status: draft for review

A puzzle-solving web app inspired by the BBC One drama _Ludwig_ (Big Talk / That Mitchell and Webb Company, 2024–, created by Mark Brotherhood). In the show, David Mitchell plays John Taylor, a reclusive puzzle setter whose pen name is "Ludwig". The app's two headline puzzles come from the show: **Reverse Chess** (S1E4) and **The Gear Puzzle** (S2E2). Around them sit the word and logic puzzles John solves or sets across both series. The visual identity follows the show's title sequence and key art.

> **IP note.** This is an unofficial fan app. The Ludwig name, the logo artwork and stills belong to the BBC and Big Talk. We reproduce the _style_ (palette, motifs, typographic approach) with our own wordmark and artwork. We do not copy the logo file, stills, music or Guardian crossword clues. Every app screen carries a "not affiliated with the BBC" footer. If this ever goes public, revisit this note with legal advice.

---

## 1. Research summary

### 1.1 Sources

- Episode dialogue transcripts for S1E1–S2E6 (Forever Dreaming). The key quotes below were checked against them.
- Wikipedia: _Ludwig (2024 TV series)_ and _Alan Connor_.
- Fonts In Use: [Ludwig logo and titles](https://fontsinuse.com/uses/76756/ludwig-logo-and-titles).
- Huge Designs' title-sequence case study: [hugedesigns.com/home/ludwig](https://www.hugedesigns.com/home/ludwig).
- Fifteensquared write-ups of the Guardian "Ludwig" cryptics (29,497 and 29,527).
- Radio Times _Ludwig Puzzle Special_, 19–25 October 2024 (section 1.2.1). A local copy is kept in `docs/material/`, which is gitignored.
- win-vector.com on the S1E4 chess position.
- KrazyDad ([krazydad.com](https://krazydad.com/) and [blog.krazydad.com](https://blog.krazydad.com/)): the source of the special's grid puzzles and of the extra formats in section 2.4, and background reading for the generators (T099). We use formats only (section 10, decision 6).

### 1.2 Puzzles in the show

| Ep | Puzzle | What happens | App feature |
|---|---|---|---|
| S1E1 | Acrostic | James's letter hides "I LOVE YOU" in the first letter of each sentence ("The same one we used as kids") | Acrostic puzzles |
| S1E1 | Logic grid | Seven suspects (A–G), three events (1–3) and seven movements (T–Z). "A concatenation of syllogisms… one of which will be false" | Logic grid, including a variant with one false statement |
| S1E1 | Significant-date passcode | The phone code is a family date | Date/number deduction riddles |
| S1E1 | Opening crossword | A real Guardian cryptic set under the name "Ludwig" by Alan Connor and Enigmatist | Cryptic and quick crosswords (original clues only) |
| S1E2 | Spot the difference | "They're basically an entry-level puzzle!" | Spot the difference (SVG scenes) |
| S1E3 | Perceptual / sightline puzzle | Who could see the alcove past the pillars? "Blind spot… blind spot" | Sightlines puzzle |
| S1E4 | **Reverse chess** | "You're presented with a board in the middle of a game but, instead of having to work out what comes next, you use maths, probability and reason to deduce what came before." He then unwinds a chain of rota swaps on an 8×8 site grid | **Headline feature A** |
| S1E5 | Locked room / false paths | Mr Todd: "start with a solution, work backwards and then layer in a few false paths" | Design principle for every puzzle we author |
| S1E6 | Book cipher | The "Bowerbird" bird book is the source key for James's notebook cipher | Book cipher puzzles |
| S2E1 | Knights and Knaves | "One truth, one lie", which John then subverts | Truth-teller/liar logic puzzles |
| S2E1 | "Two puzzles a week" | Ludwig supplies the local paper | Weekly-pair cadence (see section 4.4) |
| S2E2 | **Gear puzzle** | A cèilidh diagram: dancers are gears that "rotate AND move in and out". Each has a field of vision marked with Xs. There are eight convergences. It is "100% solvable if we adjust a couple of the starting positions". Lucy names it "Slidey Circles". Before John invents it, "gear puzzle" means the classic kind, which the detectives at the station play: connect a driver to a target with the right cogs | **Headline feature B** (Mode B: the classic gear train) |
| S2E3 | Maze | The Cambridge street maze overlaid with the sightlines of 48 CCTV cameras. Also: "don't let him fob me off with a word search" | CCTV maze. Word search included as a deliberately jokey filler type |
| S2E4 | "Knight's Path" | A coded phrase that turns out to be a street name | Folded into the cipher set |
| S2E5 | Napkin maths | "Not a code… shorthand" | Arithmetic deduction puzzles |
| S2E6 | Pictogram cipher | From an early self-published Ludwig book. A stick figure with an eyeball head is "E" | Pictogram substitution cipher |

#### 1.2.1 The Radio Times puzzle special

The 16-page special (Radio Times, 19–25 October 2024) counts as on-brand, especially Alan Connor's own pages. Connor is the show's puzzle setter.

| Pages | Puzzle | Setter | App feature |
|---|---|---|---|
| 2–3 | An intro whose sentence initials spell "YOU'RE AS SMART AS LUDWIG" | Alan Connor | `acrostic` |
| 4 | Logic puzzle: four categories of five items, seven clues | Alan Connor | `logic-grid` |
| 4 | Odd one out, typographic: "the 8, which is not an odd one out" | Alan Connor | `odd-one-out` |
| 5 | Spot the difference on the 1977 _Mastermind_ cover | Alan Connor | `spot-difference` |
| 5 | Futoshiki, 5×5 | Alan Connor | `futoshiki` |
| 5 | Chess problem: "If you make move A, Black will make move B, and you will win with move C" | Alan Connor | `chess-problem` |
| 10–11 | Visual quiz: 50 TV crime-drama titles hidden in one illustrated street | Ian McKinnell | `detective-scene` |
| 12–13 | Rainbow sudoku, jigsaw sudoku, railroad, star battle, Troix, word wheel, vortex maze | KrazyDad | `sudoku` region variants, `railroad`, `star-battle`, `troix`, `word-wheel` |
| 13 | Circle9 ("This is not a Sudoku!") | James Dewar | `circle9` |
| 16 | Quick crossword, 15×15 | Radio Times | `crossword` (quick style) |
| 16 | Sudoku | Radio Times | `sudoku` |

The QI and Popmaster trivia rounds (pages 6–9) and the vortex maze are left out. Trivia tests memory rather than deduction, and the CCTV maze already covers mazes.

**Rights.** Every puzzle in the special belongs to its setter. We copy formats and rules, never instances: no clue text, positions, grids or artwork are republished (section 10, decision 6). The special's chess problem, sudoku and futoshiki may be used as **engine test fixtures**, since they have published answers to test against, but never as `content/` files.

### 1.3 The two headline puzzles in the show

**Reverse chess (S1E4).** This is retrograde analysis. John claims to have invented it ("It didn't really catch on. Nobody could ever solve them"), though in reality it is far older. It appears in two places:

1. **Opening scene.** John plays an asynchronous game with his nephew Henry and deduces Henry's last move, "knight to queen one", which is old descriptive notation.
2. **The case.** A construction site's work-zone grid "contains exactly the same number of squares" as a chessboard. "We start with the end-game and we work backwards." John unwinds the chain of position swaps back to "the opening gambit", the first swap, which the killer insisted on.

The on-screen board was reportedly not a valid position, so our puzzles must be properly authored.

**The gear puzzle (S2E2).** The wedding invitation carried a printed choreography diagram:

- Circles are dancers, with arrows for rotation direction and crossovers.
- The dancers converge on the centre, where the victim stood.
- They pull back out "taking opposing sides to where they started, reversing rotation".
- Each dancer is a gear with a field of vision marked by Xs, which "changes continuously as they rotate both clockwise then anticlockwise… They do that eight times in total". On one of the eight convergences, everyone must face away from the victim except the killer.
- In John's words: "Literally hundreds of computations, but only one that places each and every gear at the precise rotational angle to solve the puzzle."
- As drawn, the puzzle had no solution. It is solvable once a couple of starting positions are adjusted.

The show never gives exact rules, so section 5.2 defines our own. They stay faithful to every stated property.

**The classic gear puzzle (S2E2).** When John first talks about gear puzzles, he means the familiar kind, which the detectives at the station play: a driver and a target cog on a board, and a handful of cogs to place between them. The dancer diagram is his reinvention of it. The app offers the classic kind as the Gear Puzzle's Mode B (section 5.2.5). It is not John's puzzle, so it carries no John quote.

### 1.4 Visual identity

- **Wordmark.** "Ludwig." in **Hummingbird Bold**, a script by Laura Worthington (commercial, also on Adobe Fonts). It has a full stop and doubles as John's signature. On the key art it is solid red; on the title card it is black ink with a dark-red ink splat behind the "L".
- **Credits / secondary type.** **Gravesend Sans** by Rian Hughes (commercial, also on Adobe Fonts), a 1920s–40s Southern Railway-signage geometric sans. The house layout is **all caps, with a small light first word stacked over a large bold surname** ("DAVID / **MITCHELL**").
- **Title sequence** (Huge Designs, London):
  - CG rooms and corridors built from crossword grids and chessboards, with Escher-like rotated planes.
  - A tiny black silhouette of John walking across the grids.
  - Oversized white chess pieces, some toppled.
  - Red crayon or marker letters filling grid cells.
  - Sudoku grids with mirrored digits, and a knife stabbing into a square.
  - A bullet hole tearing through the paper to reveal a blue grid beneath.
  - Coarse paper and plaster grain throughout, under hard raking sunlight with **blue-grey shadows**.
- **Palette.** Monochrome paper and ink with a single red accent and cool blue shadows. There is **no** mustard or navy-and-cream in the brand.
- **Props.**
  - _Ludwig's Pocket Puzzle Collection_: a blue paperback with the white signature at the top and a pale band reading "POCKET PUZZLE COLLECTION" in condensed caps.
  - John signs on dot-and-cross grid paper with a blue felt pen.

---

## 2. Product scope

### 2.1 Goals

1. Two flagship puzzles, Reverse Chess and the Gear Puzzle, that are original, fully specified and properly solvable.
2. A library of "usual" puzzles and word exercises tied to moments in the show.
3. A look indistinguishable in spirit from the title sequence: paper, ink, grids, red hand-filled letters.
4. Accounts, so progress, streaks and the "Casebook" persist.

### 2.2 Non-goals for v1

- Multiplayer and leaderboards (beyond your own times)
- A user-generated puzzle editor (an internal authoring tool is in scope; see section 7.4)
- Native apps (the web app must still be responsive and touch-friendly). Phones are served by solve mode, the on-screen keyboard and an installable PWA (`docs/research/mobile.md`). The native options are recorded in `docs/research/native-app.md` (section 10, decision 7)
- Monetisation
- OAuth providers
- Email verification (skipped entirely, with no plans for it)
- Password reset by email (v1.1)

### 2.3 Puzzle catalogue (v1)

| Category | Type key | Notes |
|---|---|---|
| **Flagship** | `reverse-chess` | Modes A and B (section 5.1) |
| **Flagship** | `rota` | Reverse Chess Mode D. It is a separate type because it shares no data shape with chess, and it is presented inside the Reverse Chess hub (section 5.1) |
| **Flagship** | `gears` | Engine-driven, generated plus curated (section 5.2). The dancer diagrams are the main version |
| **Flagship** | `gear-train` | Gear Puzzle Mode B, "Classic Gear Train". It is a separate type because it shares no data shape with the dancer diagrams, and it is presented inside the gears hub (section 5.2.5) |
| Word | `crossword` | One type with a `style` of `cryptic` (13×13 or 15×15) or `quick` (11×11 or 15×15, as in the Radio Times special). They share every table. Both have original clues, checking and reveal. The UI shows them as "Cryptic" and "Quick" shelves |
| Word | `anagram` | Single words and phrase anagrams, letter-tile UI |
| Word | `word-ladder` | Change one letter per rung |
| Word | `acrostic` | Find the hidden message (S1E1) |
| Word | `word-search` | Labelled "The Fob-Off" in the UI as an in-joke (S2E3) |
| Word | `word-wheel` | Nine letters round a wheel, the centre one compulsory. Find the nine-letter word, plus as many shorter words as you can (section 2.4, Radio Times) |
| Logic | `logic-grid` | Classic grid, plus a "one statement is false" variant (S1E1). Three to six categories of three to six items, cleared by a staircase of yes/no marks. A variant is a puzzle where one clue is false, derived from that clue's `is_false` and never stored. The player flags the false clue as well as matching every item. Content files carry a formal `rule` per clue (`is`, `isNot`, `either`) for `puzzles:verify` only; it is not stored, and the verifier checks that the clue text names every item of its rule as a whole word and reads with its polarity (a negation exactly for `isNot`, an "or" for `either`) |
| Logic | `knights-knaves` | Truth-teller/liar puzzles (S2E1). Two to five characters, each a knight (every statement true) or a knave (every statement false), toggled one by one. Content files carry a typed `claim` per statement (`is`, `same`, `different`, `all`/`any` over those, `atLeast`, `exactly`) for `puzzles:verify` only; it is not stored. The verifier tries all 2ⁿ assignments and needs exactly one, equal to the stored roles. `check` needs every role right and also returns the count of wrong roles, never which ones. The statement list with toggles is the shared `_shared/statement-list` component |
| Logic | `sudoku` | 9×9. Classic, plus the jigsaw and rainbow region variants (Radio Times) and the killer and XV variants (KrazyDad); see section 2.4 |
| Logic | `futoshiki` | 5×5 with inequalities |
| Logic | `odd-one-out` | Four or five text items (labels; no image items in v1), one of which does not belong. The items are one radio group and Check needs a choice. The explanation of why is `(S)`: `check` returns it as the `epilogue` only for the right item, so it is never in the page or the payload before a solve. Uniqueness cannot be machine-proven, so `puzzles:verify` checks structure only (4 to 5 distinct items, the odd item is one of them, a non-empty explanation) and requires a `reviewNote` in the content file's `meta`, which says why no other item is odd. The note is authoring metadata and is never stored |
| Logic | `chess-problem` | Forward chess: White to play and mate in N, in Alan Connor's "moves A, B and C" format (section 2.4, Radio Times) |
| Logic | `star-battle` | Place stars so every row, column and region has the same number, none touching (section 2.4, Radio Times) |
| Logic | `troix` | Fill with X, O and I: equal counts per line, never three alike in a row (section 2.4, Radio Times) |
| Logic | `circle9` | Circle one of each digit, one per row, column and box (section 2.4, Radio Times) |
| Logic | `nonogram` | Shade cells to match the run clues on every row and column. The solved grid is a picture of a Ludwig motif (section 2.4, KrazyDad format) |
| Logic | `fillomino` | Divide the grid into areas, where an area of n cells is filled with n (section 2.4, KrazyDad format) |
| Logic | `norinori` | Shade two cells per region so that every shaded cell is part of one domino and dominoes never touch along an edge (section 2.4, KrazyDad format) |
| Numbers | `kakuro` | Cross-sums: runs of digits 1–9 add up to their clue, with no repeats in a run (section 2.4, KrazyDad format) |
| Spatial | `reflections` | Put a mirror in every marked cell so each lettered pair of edge ports is joined by a beam, like CCTV mirrors in a Cambridge alley (section 2.4) |
| Spatial | `sightlines` | Grid with pillars and observers. Mark the blind spots (S1E3) |
| Spatial | `cctv-maze` | Reach the exit without entering any camera's view cone (S2E3). Shares the `visibility.ts` engine (grid line of sight, view cones, obstacles) with `sightlines` |
| Spatial | `spot-difference` | Two SVG scenes generated with N seeded differences (S1E2) |
| Spatial | `railroad` | Lay one track from the green light to the red, matching the row and column counts (section 2.4, Radio Times) |
| Spatial | `detective-scene` | Find the TV detective-drama titles hidden in an illustrated street scene (section 2.4, Radio Times) |
| Cipher | `book-cipher` | page:line:word references into a public-domain text in the app (S1E6) |
| Cipher | `pictogram-cipher` | Stick-figure substitution alphabet (S2E6) |
| Cipher | `caesar` / `keyword` | Grouped with the other ciphers under "James's Notebooks" |
| Numbers | `napkin-maths` | Deduction from partial working (S2E5). A question and 2 to 12 handwritten lines on grid paper; the answer is one decimal number (up to 12 integer and 6 fractional digits) typed into a text field with `inputmode="decimal"`. The answer is `(S)`. `answerSchema` parses the input as a decimal string and rejects anything else (text, fractions, expressions) as `invalid`, and `check` compares the normalised decimal strings exactly (4, 4.0 and 04 all equal 4), never floats. Uniqueness cannot be machine-proven, so `puzzles:verify` checks structure only (at least 2 lines, an answer, and `meta.workings`); the workings are for review and are never stored or evaluated |

**Authoring rule (Mr Todd's principle).** Every puzzle has exactly one solution, verified by a solver at authoring time. The one exception is the word ladder (section 7.4.4). Each one should be built "from the solution backwards, with false paths layered in". A generated grid puzzle meets a second bar: a technique grader for its type solves it by deduction alone, with no trial and error, and the hardest technique needed sets its difficulty (`docs/research/generators.md`). Hand-written puzzles need only the single solution.

### 2.4 Rules for the Radio Times and KrazyDad types

These types come from the Radio Times special (section 1.2.1) and from KrazyDad's catalogue. They are delivered in M6 (section 9), after launch.

- **`chess-problem`.** White is to move and forces mate in N moves, where N is 1 or 2. The player makes White's moves on the board. After each White move that still forces mate, the engine plays Black's reply automatically: the defence that leaves White the fewest mating continuations, with ties broken by UCI order. That reply is "move B", the one Ludwig predicts. The answer is the full line, ending in checkmate within `2N − 1` plies. Uniqueness means exactly one key move (White's first move) forces mate against every defence. Later White moves may have duals, and any of them that mates is accepted. No solution is stored: `loadSolution` and `check` solve the position with chess.js. N is capped at 2 so that `check` stays within a server action's time budget.
- **`sudoku` region variants.** A **jigsaw** sudoku replaces the nine 3×3 boxes with nine irregular, edge-connected regions of nine cells. A **rainbow** sudoku keeps the boxes and adds nine colour groups of nine cells, each of which also holds 1–9 once. A classic sudoku has no region set. The rest of section 7.4.4's sudoku contract is unchanged.
- **`sudoku` constraint variants.**
  - **Killer:** dashed cages, each with a sum. A cage's digits add up to its sum and never repeat within the cage. A killer sudoku may have no givens.
  - **XV:** an X between two adjacent cells means they sum to 10, and a V means 5. The negative rule applies: two adjacent cells **without** a mark never sum to 5 or 10.
  - Both combine freely with each other and with the region variants.
- **`nonogram`.** A grid of 5–25 rows and columns. The clue on each row and column lists the lengths of its runs of shaded cells, in order. The clues are derived from the solution picture, which is stored. Exactly one picture satisfies the clues. After solving, the picture's caption is revealed (for example "A sixteen-tooth gear"). Pictures are Ludwig motifs drawn for the app.
- **`fillomino`.** Fill every cell with a digit so that each edge-connected group of equal digits, call it an area, has as many cells as its digit, and two areas of the same size never share an edge. Some digits are given. There is exactly one solution, and none is stored.
- **`norinori`.** A grid split into regions. Shade exactly two cells in each region. Every shaded cell belongs to exactly one domino (two edge-adjacent shaded cells), and no two dominoes touch along an edge; diagonal contact is allowed. There is exactly one solution, and none is stored.
- **`kakuro`.** A crossword-shaped grid of white and black cells. Every horizontal or vertical run of white cells holds digits 1–9 adding up to the clue in the black cell before it, with no repeated digit in a run. The solution digits are stored, and the clues are derived from them, as crossword numbers are. There is exactly one solution.
- **`reflections`.** A grid of 4–10 rows and columns. Some cells hold fixed two-sided diagonal mirrors (`/` or `\`), and some are marked as slots. The player puts a mirror in every slot. Edge ports carry letters, each letter on exactly two ports. A beam entering at a lettered port travels straight, turns 90° at each mirror, and must leave at the port with the same letter. Unlettered ports are unconstrained. There is exactly one solution, and none is stored.
- **`railroad`.** A grid of 4–10 rows and columns, with an entry on one edge cell (the green light) and an exit on another (the red light). The track is one path of straight and curved pieces from entry to exit. It never crosses or branches, and every track cell is on it. The numbers outside the grid count the track cells in each row and column. Some pieces are given. There is exactly one solution, and none is stored: `loadSolution` solves the clues.
- **`star-battle`.** An N×N grid (N from 5 to 10) is split into N regions. Every row, column and region holds exactly K stars, where K is 1 or 2, and no two stars touch, not even diagonally. There is exactly one solution, and none is stored.
- **`troix`.** A 6×6 or 9×9 grid is filled with X, O and I. Each row and column holds `size / 3` of each symbol, and no row or column has three of one symbol in a row. Some cells are given. There is exactly one solution, and none is stored.
- **`circle9`.** A 9×9 grid holds some digits from 1 to 9, and digits may repeat. The player circles exactly nine of them: one of each digit 1–9, with one in every row, every column and every 3×3 box. There is exactly one solution, and none is stored.
- **`word-wheel`.** Nine letters: one in the centre and eight round the rim, all taken from a nine-letter target word. Words must have at least `min_length` letters (4 or 5), use the centre letter, and use each wheel letter no more often than it appears. They are accepted against the `words` dictionary, which contains no proper nouns. Unlike the Radio Times rules, plurals and verb forms count whenever the dictionary has them. Finding the target word solves the puzzle, and it must be the only nine-letter dictionary word the letters make. The other words count towards a rating: Average, Good and Genius at one third, one half and two thirds of all valid words, rounded down. The counts are derived, not stored.
- **`detective-scene`.** One illustrated scene in the brand style, a night-time street in the manner of the special's crime-drama spread, with between 10 and 50 titles of TV detective dramas hidden in it: signs, posters, number plates, props. The player taps a spot and types a title. A find counts when the tap is inside an item's region and the typed title matches the item's title or one of its aliases. Matching ignores case, punctuation and a leading "The", and treats "&" as "and". The payload carries the scene and the number of hidden titles, never the titles or regions. Show titles are facts; the artwork is ours.

---

## 3. Information architecture

```
/                          Title-sequence landing for everyone (the signed-in Desk is post-launch). Its three room captions are links: The Grid to Word puzzles (/puzzles#word), The Board to Reverse Chess (/reverse-chess), The Mirror to Logic puzzles (/puzzles#logic)
/sign-in  /sign-up
/puzzles                   The Collection: all categories
/puzzles/[type]            Category index (volumes, difficulty filter)
/puzzles/[type]/[slug]     Solve page
/reverse-chess             Flagship hub (modes, intro "how it works")
/gears                     Flagship hub (intro "how it works", daily diagram, curated diagrams, Mode B: Classic Gear Train)
/this-week                 "Two puzzles a week": the current weekly pair
/casebook                  Progress: solved, times, streaks, per-category stats
/settings                  Display name, theme (paper/ink), notation (algebraic/descriptive)
/dev/kitchen-sink          Every design-system component in both themes (dev and preview builds only; 404 in production)
```

Navigation is a slim top bar: the wordmark on the left, then Collection, Reverse Chess, Gears, This Week and Casebook, with the account menu on the right. On mobile it becomes a bottom sheet.

---

## 4. Shared puzzle framework

### 4.1 Types

Each puzzle type is a self-contained folder:

```
src/puzzles/<type>/
  tables.ts         // Drizzle tables for this type: subtype, children, solution, attempt state (section 7.4.4)
  schema.ts         // Zod, composed from drizzle-orm/zod: payloadSchema (play DTO, no solution), answerSchema,
                    //   contentSchema (content files), attemptSchema
  load.ts           // server-only: one RQBv2 query → payload DTO; never selects solution columns
  load-solution.ts  // server-only: solution rows for check.ts
  check.ts          // pure: check(payload, solution, answer) → { correct }; grid types also export checkCell and revealCell
  derive.ts         // pure: values derived instead of stored (e.g. clue numbers, ciphertext, tiles)
  solver.tsx        // "use client"
  engine.ts         // flagship and generated types only: simulation / generation / solving
```

- Types come from `z.infer<…>` on schemas composed from the generated table schemas. There are no hand-written duplicates and no `any`.
- `registry.ts` maps each `type_key` to its server module (`schema`, `meta`, `load`, `loadSolution`, `check`, `upsertContent` and the attempt-state functions). Client solvers live in a separate map, `solvers.ts`, which only the solve page imports, so scripts can load the registry without any client code.
- **Per-cell hooks (optional, grid types).** A type whose answer is a grid may add two members to its module, first implemented by `crossword`:
  - `checkCell(payload, solution, row, col, value) → { correct }`: whether `value` is the solution's value at that cell.
  - `revealCell(solution, row, col) → value | null`: the one value at that cell, or null when there is no such cell.
  - `checkAnswer(puzzleId, null, { mode: "cell", row, col, value })` and `revealCell(puzzleId, row, col)` call them and return only that one cell's result (`{ correct }` or `{ value }`), never the grid. Each still inserts its `check_cell` / `reveal_cell` hint. The checked `value` travels in the options (the client's own letter), so the action stays generic and needs no answer or saved state; a type without the hooks makes both actions return `invalid`.
  - The whole-grid `check` returns `{ correct }` and may add the optional shared field `wrongParts` (below), plus the `epilogue` a type returns on a correct check.
- **Wrong parts (optional, any type).** A type whose failed check can name what is wrong exports a `wrongPartSchema` from `schema.ts`, and its `check` returns `wrongParts: z.infer<typeof wrongPartSchema>[]`. The registry `check` type and the `checkAnswer` result carry it, derived from the module's schemas (`WrongPart<S>`), not hand-written. Sudoku and futoshiki name cells (`{ row, col }`), the logic grid names category pairs (`{ first, second }`). The rule: it is computed from the player's answer and the payload, and never reveals a solution fact the player could not find by checking the rules. Sudoku and futoshiki list rule breaks only, never a cell that merely differs from the stored solution, and the logic grid lists only category pairs in which the player has linked items. Naming wrong parts writes nothing to `attempt_hints`: it is a full check, not a cell hint. Other types opt in when they have wrong parts worth naming. Sightlines does not: any wrong cell is a diff against the derived blind spots, so even a count would leak them, and it returns only `{ correct }`.
- Shared pure engines live in `src/puzzles/_shared/`, for example `visibility.ts`, which is used by `sightlines`, `cctv-maze` and the gear occlusion rule.

### 4.2 Answer checking

- Solutions never leave the server. Pages load the payload through a data-access function marked `import "server-only"`.
- Players check answers through a **Server Action** `checkAnswer(puzzleId, answer, options)`, where `options` is `{ mode: "full", durationMs }` or `{ mode: "cell", row, col, value }`. In full mode it validates `answer` with the type's `answerSchema` and runs `check`. If the answer is correct, it records completion.
- Per-cell "check" goes through the same action with `{ mode: "cell", row, col, value }`, and "reveal letter" through `revealCell(puzzleId, row, col)` (section 4.1). Each use inserts an `attempt_hints` row, and the hint count is derived from those rows.

### 4.3 Progress state

- In-progress state autosaves through a debounced Server Action `saveState(puzzleId, state)` (the attempt is resolved from the signed-in user and the puzzle).
  - The state is validated by the type's `attemptSchema`.
  - It is written as normalised rows into that type's `<type>_attempts` and `<type>_attempt_*` tables (section 7.4.4), replacing the previous rows in one transaction.
  - Examples are crossword letters, chess retro plies and the gear crank setting.
- Signed-out users can play. Their state is stored in `localStorage` and merged into the account on sign-up.

### 4.4 "This Week" cadence

Every Monday two puzzles are published, nodding to the paper's "two puzzles a week" deal. Implementation is a `weekly_puzzles` table keyed by `(week_start, slot)`. There is no cron in v1: an admin sets the pairs ahead of time with a seed script.

### 4.5 Solve-page chrome (all types)

- **Header:** the category in a small light caps line, the puzzle title in large bold caps (the credits pattern), and a difficulty shown as 1–5 filled grid squares.
- **Timer:** monospaced and pausable. It pauses when the tab is hidden.
- **Actions:** Check and Reset. Revealing the whole answer is post-launch (it needs a per-type design); types with per-cell hooks offer "reveal letter" in the solver. Reset clears the board and, when signed in, deletes the saved attempt state (`clearState`), so a reload after Reset starts empty.
- **Wrong parts.** After a failed full check that returns `wrongParts`, the chrome passes them to the solver, which frames those parts with a dashed `ludwig-red` border (a pattern as well as a colour) and adds the label ("breaks a rule", or "in a pair of categories that is wrong") to each part's accessible name. The status line (`aria-live`) says how many parts are marked wrong. The frames clear on the player's next edit or on Reset.
- **On completion:** a red handwritten "Solved." stamp in the hand font, the time, and a "Next in volume" link.
- **Solve mode.** Under the `touch` variant (§6.7) the solve page is exactly `100dvh` and the document does not scroll. The site header and footer give way to a compact one-row solve header: a back link, the title (compact credit, one line), the timer and a menu button. Check and Reset move into that menu. The status line stays visible as a single line under the header. The solver area fills the rest and scrolls internally when a solver is taller. A bottom slot, padded for the safe area, is reserved for the on-screen keyboard. Cell grids size to the smaller of the width and height of the solver area (`--solver-height`), so a grid never needs scrolling.
- **On-screen keyboard.** In solve mode, typed solvers use the shared `PuzzleKeyboard` (`src/puzzles/_shared/puzzle-keyboard/`, `alpha` or `digits` layout, an erase key and an optional action row) instead of the system keyboard, and the grid's hidden input gets `inputmode="none"`. A printable physical key hides the pad until the next tap on the grid. "Use my device's keyboard" in the solve menu (kept in `localStorage` as `ludwig:device-keyboard`) hides the pad for good and lifts the bottom slot above the system keyboard. Sudoku and futoshiki put Notes and Clear notes in the pad's action row. The ciphers keep the ciphertext in the solver area and move the key slots, in two rows, into the bottom slot above the pad; a tap selects a slot and pad letters fill it. The book cipher keeps the page in the solver area and shows a reference bar (previous, current reference with its answer, next) above the pad.
- **Crossword in solve mode.** The grid fills the solver area. A clue bar and the `alpha` pad sit in the bottom slot (a solver puts content there with `SolveSlot`, `src/puzzles/_shared/solve-slot.tsx`). The bar has previous and next buttons that walk every entry (across by number, then down by number), the active entry's label, clue and enumeration in at most two lines, and tapping the clue text toggles direction on a crossing cell. The pad's action row is Check cell, Reveal cell and Clues; Clues opens a bottom `Sheet` with the across/down list, and choosing a clue closes it. The above-grid clue line becomes screen-reader-only (it stays the single `aria-live` announcement) and the inline clue list is hidden. With the device keyboard on, the action row moves under the clue bar.

### 4.6 Content as code

- **Where puzzles live.** Curated puzzles are TypeScript files in `content/<type>/<slug>.ts`. Each one exports `{ meta, content }`, typed and validated by that type's `contentSchema`, which is composed from the insert schemas (section 7.4.6).
- **Verification.** `pnpm puzzles:verify` runs in CI. For every file it parses the schema, runs `derive.ts`, and runs the type's solver or uniqueness check (the word ladder checks validity only). A file's `meta` may carry a `reviewNote`, the human justification for a type whose uniqueness a machine cannot prove (odd one out), and `workings`, a worked derivation for review (napkin maths). Both are passed to the type's `verify(content, { reviewNote, workings })` and stripped before seeding, so they are never stored.
- **Seeding.** `pnpm db:seed` upserts by `(type_key, slug)`. Each puzzle's supertype, subtype and child rows are written in a single transaction, so the deferred subtype trigger (section 7.4.2) passes. Content is updated in place by natural key (upsert, then delete only the child rows the file no longer contains), so content row ids such as gears and rota workers are stable and `db:seed` never writes a `*_attempt*` table. A content change that removes a row attempt data references fails the seed for that puzzle with an error naming it, and that puzzle is left unchanged. Puzzles whose file is gone are removed. If any of them have attempts, the removal needs confirmation, because the attempts cascade with the puzzle: an interactive terminal lists each `<type>/<slug>` with its attempt count and asks `y/N`, and without a TTY (Vercel build, CI) `SEED_CONFIRM_REMOVE` must list them (comma-separated `<type>/<slug>`, or `all`). Unconfirmed, the seed removes nothing and exits non-zero. Daily gears, which have no file, are never removed.
- **Generated content.** Gears and spot-difference puzzles are produced by scripts and materialised through the same seeding path. Generated grid puzzles (sudoku, futoshiki and later types) are committed content files: `pnpm puzzles:gen` writes `content/<type>/<slug>.ts` from a seed, a difficulty and a pinned generator version. The file exports its provenance (generator, version, seed) beside `meta` and `content`; it is never seeded, and the difficulty is `meta.difficulty`. `puzzles:verify` regenerates the puzzle from it and fails on any difference. Only daily puzzles, which have no author and no file, are materialised at cron time, as `gear_daily` does.
- **What this gives us.** Reviewable diffs, git history and rollbacks for content. Every Neon preview branch also gets real content.

---

## 5. Flagship puzzles

### 5.1 Reverse Chess

The tagline, from the show: _"Instead of having to work out what comes next, you deduce what came before."_ There are three modes.

#### Mode A: "The Last Move" (single retro move)

**Prompt:** a position with side-to-move. It is stored as one row per piece plus scalar castling and en passant columns, and the FEN for `chess.js` is derived in `derive.ts`. The question is "What was the last move?" The side to move is shown as a king glyph in that colour, never as a checkbox-like swatch.

**Answer:** the player drags a piece **backwards**, from its current square to its origin square. If the move was a capture, they choose the uncaptured piece (type plus colour, or "none") from a piece tray, and that piece is placed on the vacated square. Promotions are undone by turning the piece back into a pawn (there is a toggle). En passant and castling un-moves are supported.

**Engine:**

- Built on `chess.js` (v1.4). The retro move `{ from, to, uncapture?, unpromote?, special? }` is applied to build the prior position.
- That position is validated: `chess.js` must load it as a legal FEN, and the side that is *not* to move must not be in check in the prior position.
- The forward move is then replayed with `chess.js`. Its piece placement and side-to-move must equal the puzzle FEN.
- Finally, the answer must match the authored solution. The authoring script guarantees uniqueness.

**Authoring script (`pnpm puzzles:verify`):** for each Reverse Chess puzzle,

1. enumerate every pseudo-legal retro move for the side that just moved, across all uncapture options;
2. keep only those that pass the validation above, plus the extra legality rules we enforce (pawn count ≤ 8, no pawn on the back rank, bishop-colour feasibility, plausible piece counts);
3. require exactly one survivor.

Full retrograde legality (reachability from the start position) is not computed. Curated puzzles must be reviewed by hand for it, and the script prints a reminder.

**Difficulty ladder:**

1. The last move is forced because the king is in check.
2. Captures with uncapture.
3. Promotions, en passant and castling.
4. Positions where most of the candidate un-moves create an impossible check.

#### Mode B: "Unwind" (N retro moves)

The position is given and the player must take back **N** half-moves (N = 2–6, or up to 16 for a Proof Game) to reach a stated earlier position or condition, for example "before the bishop was captured" or "the moment White last castled".

- **The goal is data, not prose.** Each Mode B puzzle has exactly one goal: a predicate on the position reached after the N-th retro move, stored as one row in `reverse_chess_goals` (a `retro_goal_kind` plus the display text shown to the player) and one row in the subtype table for that kind. The kinds are:
  - `piece_on_square`: a piece of a colour and type stands on a square ("before the black pawn left a7");
  - `castling_right`: a colour can still castle on a side ("the moment White last castled");
  - `piece_count`: a colour has exactly this many pieces of a type ("before the bishop was captured");
  - `initial_position`: the chain reaches the standard starting position ("Proof Game", below). It takes no parameters, so it has a `reverse_chess_goals` row and no subtype row.
- **Entry.** The player builds the chain one retro move at a time, as in Mode A (drag a piece backwards, choose the uncaptured piece, toggle Unpromote or En passant). A king dropped two files from its home square is read as a castling un-move, so castling needs no control. The list shows each take-back as the forward move it undoes. Undo removes the last move.
- **Checking.** Wrong steps are allowed until Check is pressed, which flags the first invalid step. An answer is correct when it has exactly N plies, each is a legal retro move on the previous prior position (including the Mode A material rules), and the final prior position satisfies the goal. The authored chain is not compared: any chain that does this is accepted.
- **Authoring (`pnpm puzzles:verify`).** Exactly one chain of N retro moves may reach the goal, and it must be the authored one. The verifier searches every chain of N enumerated retro moves, so N is bounded in practice by how many retro moves each position has.
- **Proof Game (`initial_position`).** The hub presents it as its own mode, **Mode C: "Proof Game"**, though it is an Unwind goal kind and shares Mode B's tables and solver. The position is the end of a real game and N is its length in half-moves, up to 16. The player takes back every move with the same Unwind solver, and the goal text reads "Back to the starting position". N is derivable from the position, `2 * (fullmove - 1) + (1 if Black is to move)`, so a deferred trigger requires `ply_count` to equal it (section 7.4.5).
  - **Checking.** The answer has exactly N plies, each a legal retro move, and the last prior position has the standard starting placement with White to move. The chain is then reversed and replayed forward with `chess.js` from the standard starting FEN, and must reproduce the puzzle position exactly: placement, side to move, castling rights and en passant square. The retro engine cannot restore a lost castling right (un-moving a king or rook gives none back), so the forward replay is the source of truth for rights.
  - **Authoring.** `puzzles:verify` runs a forward search (`proof-search.ts`) from the starting position instead of `goalChains`. It counts the games of exactly N plies that end at the position, requires exactly one and requires it to be the authored chain reversed. Games that differ in move order are different games. The search prunes with admissible lower bounds on the moves each side still needs (pieces off their target squares, captures implied by the material, pawn file changes) and remembers dead positions by (position, plies left). Each puzzle must verify within a few seconds, and the verifier gives up after 5 million positions.
- Entering a take-back of a double pawn push does not need the en passant square to be shown: a position built by an earlier take-back has no en passant square of its own, so the replay compares it only when it has one. `goalChains` enumerates with the same rule, so the verifier counts every chain that Checking accepts.
- A **descriptive notation** toggle shows the move list in old notation ("N–Q1"), as in the Henry scene. It is a user setting (`user_settings.chess_notation`) with algebraic as the default. Signed-in players save it to their settings, and signed-out players keep it in `localStorage`. Notation is derived from the forward move and the position before it (`derive.ts`): files are named after the piece that starts on them (QR, QN, QB, Q, K, KB, KN, KR), ranks count from the mover's own back rank, captures name the captured piece (`PxP`), and the origin square is added only when two pieces would otherwise read the same (`R(KR1)-Q1`).

#### Mode D: "The Rota" (S1E4 case-style)

This mode is non-chess retro deduction on an 8×8 site grid. The board is drawn as a chessboard of numbered work zones, with labels A–H and 1–8.

**Payload:**

- the final positions of 6–10 named workers (tokens);
- their **intended** rota positions;
- 4–8 clue statements, for example "G5 had no power all morning", "Only adjacent zones can swap", "Ojay never worked a zone in row 1", "No more than 5 swaps were made".

**Goal:** reconstruct the **ordered sequence of swaps**, backwards from the final state, that turns the intended rota into the final state. The opening gambit (the first swap and the worker who insisted on it) is not asked for: it is revealed after a correct answer.

**UI:** drag two tokens to "unswap" them. Each unswap pushes a step onto a visible stack, drawn as a red pencil line between the cells. Undo pops a step.

**Clue meanings** (all evaluated on the sequence applied forwards from the intended rota, and all prefix-checkable so `solve` can prune):

- `adjacent_only`: every swap is between workers in orthogonally neighbouring zones at the time of the swap.
- `unpowered_square`: no swap involves a worker standing on that zone at the time of the swap.
- `never_in_rank`: the named worker is never in that row, in any state, the intended and final rotas included.
- `max_swaps`: a cap on the total length of the sequence (not per worker), for example "No more than 5 swaps were made". A per-worker cap of 1 would make every swap disjoint and the order could never be deduced.

**Uniqueness:** the answer is the one shortest valid sequence. `solve` returns only the shortest sequences, and `check` requires the stored length, so undo-padded sequences are neither counted nor accepted. `puzzles:verify` (the `verify` hook) requires that `solve` returns exactly the stored sequence (each swap compared as an unordered pair), that every worker has an intended and a final zone, that the two rotas use the same set of zones, that the authored instigator is in the first swap, and that a `max_swaps` clue caps the sequence below the stored length + 2. Every sequence between the two rotas has the same parity of length, so that cap leaves the stored sequence as the only one that satisfies every clue, and a player is never rejected for a longer sequence that breaks no clue.

**Opening gambit:** the instigator is authored data (`rota_solutions.instigator_worker_id`, one of the two workers of step 1) and is not part of the answer, because no clue could decide it. `check` returns it as story text (`epilogue`, "Opening gambit: Name insisted on it.") only for a correct answer, never in the payload. `rota_attempts.instigator_worker_id` is gone from the Drizzle schema and is never written. The nullable column stays in the database until T141 drops it.

**Solver:** the board shows the final rota. Each unswap is pushed on the stack, which is kept in forward order (the newest unswap is the first forward swap). Clues are evaluated in the browser once every worker is back on the intended rota, and a broken clue is marked "Broken". `check` also returns the position of the first broken clue as `violatedClue`. It is computed from the payload and the answer alone, so the shape of the result never hints at the solution.

**Check:** the sequence, applied forwards from the intended rota, must yield the final state and satisfy every clue predicate. Clues are stored as typed predicates: one subtype table per clue kind (section 7.4.4), not free text, so the checker can evaluate them. Each clue row also carries its display text.

**Engine:** a pure `rota.ts` with `applySwaps`, `validateClues`, and a brute-force/BFS `solve` used by the verify script to prove uniqueness.

**Board styling (all modes):**

- Paper and ink squares: light squares `--paper`, dark squares `--ink`, with paper-grain texture.
- Pieces are white, oversized and sculptural with a long blue-grey drop shadow, echoing the title sequence.
- The last retro move is drawn as a hand-drawn red arrow pointing **backwards**.
- Captured or uncaptured pieces "topple" into the tray.

### 5.2 The Gear Puzzle

**Display name:** "The Gear Puzzle". The subtitle reads _(definitely not "Slidey Circles")_ and links to the show quote.

#### 5.2.1 Concept

A diagram of **dancer-gears** on a circular floor, with the **victim** at the centre. Gears mesh with their neighbours, so turning one turns them all ("all of which move in conjunction with each other"). The dance runs **8 figures**. In each figure every gear travels **in** to the centre ring while turning, then travels **out** to the **opposite** side, **one slot further round the floor**, turning in the reverse direction. Over the eight figures the gears therefore progress round the floor, and no two convergences share a floor arrangement. Each gear carries a **field of vision**, a wedge marked with small Xs. The player must find the crank setting, and the one convergence of the eight, at which **every gear faces away from the victim except one**, and then name that one: the killer.

The **"Fix the Diagram"** variant reproduces the episode's twist. The diagram as printed has **no** solution, and the player may **swap up to K starting slots** (K = 1–2) to make it solvable. This variant needs a stated uniqueness rule, given below.

#### 5.2.2 Formal model

All arithmetic is integer, in **teeth** and **slot** units, so solutions are exact.

```
Floor:
  S          number of slots on each ring (a multiple of 4; default 12, so slot angle = 360/S)
             S/2 + 1 is then odd and coprime to S, so for S >= 8 the 8 convergences all have different floor arrangements
             one symmetry remains when S/2 < 8: figure f + S/2 is figure f turned half a turn. If every T_g has the
             same power of 2 (all 8, or {8, 24}, ...), a crank shift δ with δ ≡ T_g/2 (mod T_g) for every g maps
             each win at f to one at f + S/2, so such diagrams are never unique at S = 8, and at S = 12 only with the win at f = 3..6
  outer ring (start/rest positions), inner ring (convergence positions)
  victim at the centre O

Gear g:
  T_g        tooth count ∈ {8, 12, 16, 24}
  s_g        starting slot (0..S-1) on the outer ring
  o_g        initial facing, in teeth (0..T_g-1); facing angle = o_g * 360/T_g
  h_g        half-width of the field of vision, in degrees (default 45; 30 on hard)
  d_g        spin sign ∈ {+1, -1}, derived from the mesh graph

Mesh graph M:
  undirected edges between gears that touch on the diagram
  must be bipartite (else the train locks); d_g = +1 / -1 by 2-colouring from the driver gear D
  must be connected: every gear is reachable from D (an unmeshed gear would not turn); generators and puzzles:verify reject disconnected diagrams
  meshed gears share linear tooth travel, so turning the train by k teeth turns EVERY gear
  by exactly k teeth: Δangle_g = d_g * k * 360/T_g

Dance parameters (per puzzle):
  m_in       teeth turned while travelling in (figure f, towards convergence f)
  m_out      teeth turned while travelling out (reversed direction)
  m_in ≠ m_out, so the net drift per figure is Δ = m_in - m_out ≠ 0
  F = 8      figures

Player input:
  c          crank: teeth by which the driver is pre-turned before the dance, 0 ≤ c < L,
             where L = lcm(T_g over all g)

State at convergence f (1..8):
  slot_g(f)    = (s_g + (f-1) * (S/2 + 1)) mod S   // opposite side AND one slot further each figure
  pos_g(f)     = inner-ring point at angle slot_g(f) * 360/S
  teeth_g(f)   = o_g + d_g * (c + m_in + (f-1) * Δ)
  facing_g(f)  = (teeth_g(f) mod T_g) * 360 / T_g
  bearing_g(f) = angle from pos_g(f) to O          // = slot angle + 180°
  sees_g(f)    = angularDistance(facing_g(f), bearing_g(f)) ≤ h_g

Angle convention:
  slot s sits at s * 360/S degrees, and a +1 tooth rotation increases the facing angle
  the boundary is inclusive (≤)

Win condition:
  exists (c, f) such that |{ g : sees_g(f) }| = 1
  answer = (c, f, killer g)
```

**Uniqueness requirement (verified at generation):** exactly one pair (c mod L, f) satisfies the win condition. m_in and m_out never change the number of wins: for each f, c ↦ c + m_in + (f-1)Δ is a bijection mod L, so they only shift the crank of each win.

The search space is L × 8, at most lcm(8,12,16,24) × 8 = 384 cells, so brute-force verification is instant and can also run on the client for a live "sightline preview".

**Fix the Diagram:** the printed diagram has zero solutions. The player may swap the starting slots of up to K pairwise-disjoint pairs of gears (an unordered set, so each gear moves at most once). Uniqueness here means exactly one such swap set (of size ≤ K) yields a diagram with exactly one (c, f) solution. Search size is C(N,2)^K × L × 8, which stays under about 10⁶ for N ≤ 12 and K ≤ 2. It runs in the generator only, never on page load.

**Expert rule (optional flag `occlusion: true`):** a gear's line of sight to O is blocked if the segment pos_g(f) to O passes through another gear's disc at that convergence. This nods to the S1E3 "perceptual puzzle".

#### 5.2.3 Generator

`src/puzzles/gears/generate.ts`: `generateDiagram(seed, difficulty)`, `generateFixVariant(seed, difficulty, K)` and `repairsOf(diagram, K)`.

Randomising and accepting does not work: a random diagram has a win (exactly one gear sees) at about a third of its (c, f) cells, so a unique diagram is essentially never drawn. The generator therefore **plants and covers**:

1. **Plant.** Draw the killer and one moment (c, f) where it sees the victim.
2. **Cover.** Split the other gears into twin groups of 2 or 3. Twins share teeth, spin sign (slot parity) and offsets aligned to their slot difference, so they see at exactly the same moments (every bearing shifts identically each figure, so twins stay in sync). A group is never alone, so the only possible win is the killer seeing while no group does. Choose groups greedily to cover every moment where the killer sees, never the planted one.
3. **Local search.** While moments remain uncovered, re-draw one group at a time and keep the change if it uncovers fewer moments.
4. **Gate.** Accept only if brute-force `solveAll` finds exactly one win.
5. **Fix the Diagram.** Take a unique diagram, swap the starting slots of K disjoint gear pairs, and accept if the printed diagram has zero solutions **and** that swap set is the only set of at most K disjoint swaps (`repairsOf`) giving exactly one solution.
6. Seed with mulberry32 over a string hash of the seed, so a daily diagram is reproducible from its date seed.

Layout: gears sit on distinct slots; the spin sign is the slot parity, so every mesh joins slots an odd number apart. Meshes are ring edges (adjacent slots) plus the fewest, shortest, non-crossing chords that connect the gears. Presets (`presets.ts`) use 12 slots and the teeth 8 and 16 with an odd gear count, the sizes that the covering step was measured to handle; see the ticket report. The board's performance budget was measured on 11 gears, so `limits.ts` caps every stored diagram (curated or daily) at 11 gears with 8 or 16 teeth, enforced by `puzzles:verify`, and the `preview` e2e check guards the layout count while the dance plays (`e2e/gears-layout.spec.ts`).

Curated diagrams live in the DB like any other puzzle. Generated ones are materialised into `puzzles`, `gear_puzzles` and their child tables by a script, so checking stays server-side.

**Daily diagrams (T036).** `pnpm puzzles:gen-gears --from YYYY-MM-DD --days N [--difficulty-cycle easy,medium,hard,expert]` generates with `seed = date`, writes slug `daily-<date>` through the per-puzzle transaction `db:seed` also uses (`upsertPuzzle` in `src/lib/data/puzzle-upsert.ts`) and links it in `gear_daily` in the same transaction. Daily puzzles belong to no volume, have `published_at` at the start of that date in `Europe/London` (future dailies stay hidden), and their difficulty column is the preset index plus 2 (easy 2 to expert 5). The difficulty cycles by date (days since 1970-01-01 modulo the cycle length), so a date's difficulty doesn't depend on which run generated it. `db:seed` never removes a puzzle linked in `gear_daily`; any other puzzle without a content file is removed. A date that already has a `gear_daily` row is skipped, so a published daily never changes. `puzzles:verify` also re-solves every `gear_daily` puzzle in the database and compares it with its stored solution. In production a daily Vercel cron (`vercel.json`, 00:05 UTC) calls `GET /api/cron/daily-gears` with `Authorization: Bearer <CRON_SECRET>` (T078); it runs the same `generateDailies` code path for today (London) through today + 365 days, so a year of dailies always exists and only missing dates are written.

**Preset evaluation (T037).** `pnpm puzzles:gears-report` measures every preset over 500 seeds (`playtest-0` to `playtest-499`) and exits non-zero if any threshold fails:

| Measure | Definition | Accept |
|---|---|---|
| Near misses | mean number of (c, f) cells where exactly 0 or exactly 2 gears see the victim | >= 3 |
| Solution spread | largest share of solutions at one convergence f | <= 25% |
| Untouched dial | share of solutions with c = 0 | < 5% |
| Churn | mean number of gears whose `sees` flips between consecutive convergences, at the solution crank | >= 1 |
| Acceptance | accepted diagrams over plant-and-cover draws | >= 2% |
| Generation time | mean `generateDiagram` wall time | < 50 ms |

Tuning result: gear counts (7, 9, 9, 11), half-widths (45, 45, 30, 30), 12 slots and teeth 8 and 16 in `presets.ts` already met every threshold, so they are unchanged. The one lever that needed tuning was `m_in` and `m_out`: they only relabel the crank, so the generator redraws them until the answer is not crank 0, which would hand the player the crank step (about 6% of solutions at L = 16 otherwise).

| Preset | Near misses | Max f share | c = 0 | Churn | Acceptance | Mean ms |
|---|---|---|---|---|---|---|
| easy | 84.6 | 19.0% | 0.0% | 3.25 | 22.8% | 0.47 |
| medium | 73.6 | 16.8% | 0.0% | 3.73 | 51.6% | 0.24 |
| hard | 92.8 | 15.6% | 0.0% | 2.77 | 40.0% | 0.31 |
| expert | 83.7 | 16.2% | 0.0% | 3.26 | 60.7% | 0.24 |

#### 5.2.4 Interaction

**Board.** An SVG floor of textured paper with two faint concentric rings and slot ticks. Gears are drawn as ink-outlined cogs with their tooth count visible. Each field-of-vision wedge is drawn as a fan of small red Xs, as described in the show.

**Controls:**

- **Crank:** drag-rotate the driver gear, or use ± tooth buttons and arrow keys. Every meshed gear turns live, in the correct direction and ratio.
- **Dance scrubber:** a timeline of 8 figures, 16 half-phases, with play/pause. Animation interpolates position along an in/out path and rotation, using `motion`.
  - The timeline position runs 0 to 16 in half-phases, and half-phase 2f - 1 ends at convergence f (markers 1 to 8). Gears move in a straight line, outer ring to inner ring and back out to the next figure's slot, and turn linearly by +m_in and then -m_out teeth. Interpolation is presentation only: at a marker the board equals `stateAt` exactly.
  - Keys on the scrubber: Left and Right move one half-phase, Home and End jump to markers 1 and 8, Space plays or pauses. Play dwells on each convergence. With reduced motion, Play steps from marker to marker with no interpolation.
- At each convergence the victim marker shows which gears "see" it: thin red sightlines appear from those gears, and an `aria-live="polite"` line announces the count.
- **Accuse:** choose the convergence and the killer gear, then submit. The submission contains (c, f, g).
- Fix the Diagram: tap two gears to swap their starting slots. The swap count is shown as "Adjustments: 1/2".

**Accessibility:** a fully keyboard-operable crank and scrubber, a textual state table ("Gear C: facing 135°, sees victim: no") behind a toggle, and colour that is never the only signal (Xs versus dots).

**Show-accurate copy:** the intro card quotes John: _"Gears usually just rotate, but these rotate AND move in and out."_

#### 5.2.5 Mode B: "Classic Gear Train"

The dancer diagrams (sections 5.2.1 to 5.2.4) stay the main version of the Gear Puzzle. Mode B is the classic gear puzzle the detectives play at the station (section 1.3). It is its own `gear-train` type, presented inside the gears hub after the dancer sections, the way the Rota sits inside Reverse Chess.

**Payload:**

- a pegboard of `rows × cols` pegs (4 to 12 each way);
- the **driver**, a fixed cog that always turns clockwise, and the **target**, a fixed cog with a required direction (clockwise or anticlockwise);
- **bolts**, pegs that block placement;
- an **inventory**: how many cogs of each size the player may place. It usually holds more than the answer needs.

**Goal:** place cogs from the inventory on free pegs so that the driver turns the target in the required direction. Every cog placed must be needed.

**Formal model** (integers only, in peg units):

```
Cog:
  T          teeth ∈ {8, 16, 24}
  r          pitch radius = T / 8 pegs (1, 2 or 3)
  (row, col) the peg it sits on

Two cogs a, b, with d² = Δrow² + Δcol²:
  mesh       d² = (r_a + r_b)²       (axis-aligned, or a 3-4-5 diagonal for r_a + r_b = 5)
  collide    d² < (r_a + r_b)²

A cog collides with a bolt when the bolt's distance² from its peg is ≤ r².
Every disc lies on the board: r ≤ row ≤ rows - 1 - r, and the same for col.

Train: the mesh graph over the driver, the target and every placed cog.
  spin signs by 2-colouring from the driver (the shared spinSigns used by gears)
  jammed     the graph is not bipartite

A placement (a set of (row, col, teeth)) is valid when:
  1. every cog is on a free peg (not a bolt, not the driver's or target's peg), one cog per peg
  2. no more cogs of each size than the inventory holds
  3. no two cogs collide (the driver and target included), no cog collides with a bolt, every disc is on the board
  4. every placed cog and the target are reachable from the driver
  5. the train is not jammed
  6. the target's spin sign matches the required direction
  7. minimal: removing any one placed cog disconnects the target from the driver
```

Rules 4 and 7 together mean a valid placement is an induced path from the driver to the target: no cog meshes with anything but its two neighbours on the chain. The target's direction then comes from the chain's length alone.

**Speed is not a goal.** In a simple train the ratio between the driver and the target depends only on their own teeth, whatever the idlers between them. A speed goal would need compound cogs (two on one axle), which v1 leaves out.

**Uniqueness:** exactly one valid placement, compared as a set of (row, col, teeth). The `verify` hook runs `solve`, a depth-first search over induced paths that grows a chain from the driver one meshing cog at a time, prunes by collision, bolts and the remaining inventory, and records each chain that reaches the target with the right sign. It caps the count at 2 and requires exactly the stored placement. Authoring follows Mr Todd's principle: plant the chain, then add bolts and decoy cogs until every other chain is gone.

**Answer and check:** the answer is the placement. `check` validates rules 1 to 7 against the payload and compares the set with the stored solution. Uniqueness makes the two agree, so a valid placement is never rejected. Every rule can be checked from the payload alone, so the solver evaluates them live without any solution data.

**Interaction:**

- **Board:** an SVG pegboard on textured paper. Pegs are small ink dots and bolts are ink hex heads. The driver carries a red crank handle, and the target shows its required direction as a hand-drawn arrow. Cogs reuse the gears board's cog drawing, with the tooth count visible.
- **Place:** drag a cog from the inventory tray onto a peg. With the keyboard, choose a size in the tray, move a peg cursor with the arrow keys and press Enter. Select a placed cog and press Delete, or tap it, to return it to the tray. A placement that breaks rule 1, 2 or 3 is refused with an `aria-live` notice naming the reason.
- **Live train:** every cog connected to the driver turns, at its own speed and direction (a CSS keyframe rotation per cog, one revolution in `3 s × teeth / 8`). A jammed train does not turn, and the cogs on its odd cycle are marked with a red X. A status line reads, for example, "The target turns anticlockwise. Cog at C4 isn't needed." With reduced motion, direction arrows replace the spinning.
- **Check** submits the placement.

**Engine:** a pure `engine.ts` with `meshes`, `collisions`, `trainOf` (signs, jam and reachability), `validate` (rules 1 to 7, naming the first broken one) and `solve`. `spinSigns` moves from `gears/engine.ts` to `src/puzzles/_shared/` now that a second type uses it.


---

## 6. Visual design system

### 6.1 Typefaces

| Role | Show typeface | v1 web font (free, OFL) | Exact-match upgrade |
|---|---|---|---|
| Wordmark / signature | Hummingbird Bold (Laura Worthington) | **Dancing Script** Bold 700 (user decision, 2026-10-02) | Hummingbird through an Adobe Fonts kit or a purchased webfont licence |
| Headings, credits, UI labels | Gravesend Sans (Rian Hughes, Device) | **Josefin Sans** (600/700 for surnames, 300 for first words) | Gravesend Sans through Adobe Fonts |
| Body / long text, grid numerals | — | **Jost** (Futura-like, good small sizes and tabular numerals) | — |
| Puzzle-book cover band | Unidentified condensed caps | **Barlow Semi Condensed** 600 | — |
| Hand-filled grid letters | Red crayon/marker in titles | **Caveat Brush**, or Permanent Marker (Apache 2.0) for heavier strokes | — |
| Timer / FEN / code | — | **JetBrains Mono** | — |

**Loading:**

- Google fonts load through `next/font/google`, exposed as CSS variables (`--font-signature`, `--font-display`, `--font-sans`, `--font-hand`, `--font-mono`).
- Licensed fonts, if adopted, load through `next/font/local` from `src/fonts/`, which must be excluded from the public repo if the licence requires it.
- The wordmark is **our own SVG**: "Ludwig." traced from our chosen script, with a hand-tuned swash and full stop. It is never set live, so it renders identically everywhere.

**Typographic rules:**

- Headings are always UPPERCASE with letter-spacing of about 0.04em, using the stacked pattern: a small light first line over a large bold second line, e.g. "THE / **GEAR PUZZLE**". `<Credit top="THE" bottom="GEAR PUZZLE" />` is a single component.
- Body copy is sentence case in Jost.
- Script appears only in the wordmark and the "Solved." stamp. It never appears in UI text.

### 6.2 Colour tokens

Defined in `src/app/globals.css` with Tailwind v4 `@theme` and mapped onto shadcn's semantic variables.

| Token | Hex | Use |
|---|---|---|
| `--paper` | `#E9E4DE` | Page background (lifted slightly from the graded `#E2DCD6` for screen legibility) |
| `--paper-shade` | `#C2BABB` | Cards' recessed areas, disabled cells |
| `--paper-deep` | `#B0A7A8` | Borders on paper, grid hairlines |
| `--ink` | `#0A0B0D` | Text, black crossword squares, dark chess squares |
| `--ink-soft` | `#444549` | Secondary text |
| `--ludwig-red` | `#C40C12` | Primary accent: wordmark, primary buttons, filled letters, sightlines |
| `--blood` | `#75171A` | Ink splat, destructive states, hover on red |
| `--crayon` | `#8B2020` | Hand-filled letters on paper (lower contrast than full red) |
| `--shadow` | `#1E2B3B` | Long cast shadows, dark-mode surfaces |
| `--shadow-soft` | `#4C5462` | Muted borders and icons on dark |
| `--grid-blue` | `#004060` | The "tear-through" blue grid revealed under bullet holes |
| `--book-blue` | `#3A7FB0` | Pocket Puzzle Collection covers (volume cards), focus rings (3.4:1 on paper, 4.5:1 on ink, so a ring reads on paper and ink cells in both themes) |

**shadcn mapping (light / "Paper"):**

- `background` → paper, `foreground` → ink
- `card` → paper with a texture overlay
- `primary` → ludwig-red, `primary-foreground` → paper
- `secondary` → ink, `secondary-foreground` → paper
- `muted` → paper-shade, `accent` → book-blue
- `destructive` → blood
- `border` → ink at 100% (2px), `input` → ink, `ring` → book-blue
- `--cast` → shadow (the colour of every hard offset shadow), `--hand` → crayon (handwritten entry)

**Dark theme ("Ink", modelled on the title card):**

- `background` → `#0A0B0D` with grain, `foreground` → paper
- `card` and `popover` → ink, so dialogs, menus and toasts are dark, not blue; the light `border` and the light `--cast` shadow separate them from the page. Puzzle "pages" (book cipher book and references, cipher key panel, anagram and letter tiles, acrostic letter, rota tokens) are not `card`: they use the `paper-sheet` utility (ink border, paper fill, ink text) and stay paper in Ink, like paper on a desk. Their block shadow is `--sheet-cast`: the same as `--cast` in Paper, and paper at 70% in Ink, lighter than `--cast` so the sheet stands out
- `muted` → paper at 14% over ink (dark, non-blue), used for active clue rows, hover states and selected toggle cells
- `--cast` → paper at 45% (3.8:1 against ink), `--hand` → paper (crayon is too dark on ink)
- `destructive` → ludwig-red at 65% over paper (blood is invisible on ink, and plain ludwig-red is only 3.2:1), 4.5:1 or better against ink, so error text and the `aria-invalid` underline pass; `destructive-foreground` → ink
- `primary` → ludwig-red (unchanged), `border` → paper at 60%
- Grids (`CellGrid`, the chess board) stay paper, like a printed page on a dark desk. Their frame is the light `border` and they carry the `--cast` shadow

All text and background pairs must pass WCAG AA. Red on paper (`#C40C12` on `#E9E4DE`) is about 5:1, so it passes for text. Crayon is used only at large sizes.

### 6.3 Texture and motifs

- **Paper grain.** A single tiled noise PNG of about 512px, kept under 40 KB and generated once from an SVG `feTurbulence`. It is applied through a `body::before` overlay with `mix-blend-mode: multiply` at around 0.35 opacity. It is never a live SVG filter, for performance.
- **Raking light.** An optional `.raking` utility adds a large diagonal linear-gradient of blue-grey shadow stripes at low opacity, used on hero sections and the landing page.
- **Grid paper.** The `.grid-paper` background is a CSS `background-image` of dot-and-cross (·×) on a 24px pitch, used on the Casebook, Settings and in scratch areas. It fills the page down to the footer, and in Ink its marks are toned down to 30%.
- **Crossword cells everywhere.** Square corners (`--radius: 0`), 2px ink borders, and small superscript clue numbers on cards and buttons where they make sense.
- **Red hand-filled letters.** Letters the user enters in grids render in `--font-hand` and `--crayon`/`--ludwig-red`, with a ±2° random rotation per cell seeded by its index for stable SSR.
- **Ink splat.** An SVG asset placed behind the wordmark on the landing hero and the sign-in card. On the landing hero the wordmark has no box: it sits on the textured page in the foreground colour (ink in Paper, paper in Ink) with the splat behind it. The splat is `ludwig-red` (the button red) in Paper, so it stays clear of the black text, and `blood` in Ink.
- **Clinical, never soft.** No fades anywhere: no blurred shadows, no gradients that blend one colour into another, no cast shadow that fades along its length. Gradients appear only as hard-stop patterns (grid lines, checks, raking stripes).
- **Silhouette walker.** A small black SVG figure that walks across grid cells. It is used as the **loading indicator** (`loading.tsx` / Suspense fallbacks) and on empty states.
- **White chess pieces.** Large, with long blue shadows, used as decorative elements on the landing page and the Reverse Chess hub.
- **Bullet-hole transition.** As the landing-to-app route transition, a torn circular hole tears open in the old page from the clicked link and reveals the blue grid, then the new page fades in beneath it; the header does not move. This uses the View Transitions API through Next's view-transition support, with `prefers-reduced-motion` falling back to a fade.
- **Solved hole.** On puzzle completion, one small torn hole opens behind the "Solved." stamp only, and the rest of the footer is a plain surface. It is a true circle, 264px across (11 whole 24px cells), or 216px (9 cells) on phones in solve mode, and sized in px so it never depends on the footer's shape. Its `grid-blue` grid, at partial alpha, is anchored so the hole's centre is a cell centre. A torn paper rim, a band tinted from the page background towards the foreground, frames it and covers the line ends, so the grid reads as seen through the paper. The hole opens in 300ms (`clip-path` only), then the stamp springs on top. With reduced motion both appear at once.
- **Mirrored digits.** Decorative sudoku backgrounds, such as the landing title sequence, use `scale-x-[-1]` digits, as in the titles. They are not drawn behind solve grids.

### 6.4 Component customisation (shadcn)

Install components with `pnpm dlx shadcn@latest add …`, then restyle them in place. The likely set is: button, input, label, card, dialog, alert-dialog, dropdown-menu, tabs, toggle-group, slider, tooltip, sonner, form, sheet, badge, progress, separator and skeleton.

| Component | Ludwig treatment |
|---|---|
| Button (primary) | Red fill, paper text, Josefin 700 caps, 0 radius, 2px `border`, 3px hard offset shadow in `--cast` that collapses on press |
| Button (disabled) | Every variant: `muted` fill, `muted-foreground` text, a `muted-foreground` border and no shadow (ghost keeps no fill or border). Never opacity, so a disabled button looks the same in both themes and no grain shows through the fill. Disabled menu items (the solve-page CHECK on phones) use `muted-foreground` text, not opacity |
| Button (secondary) | Paper fill, ink border, ink text. Hover inverts to an ink fill (a "black square") |
| Input | Bottom-border-only "answer line", or a cell variant (`<CellInput>`): one square per letter, handwritten red entry |
| Card | `card` surface (paper in Paper, ink in Ink) with grain, 2px `border` and a `--cast` block shadow. Optional clue number in the top-left corner. Volume cards styled as Pocket Puzzle Collection covers (book-blue, white signature, pale caps band) |
| Dialog | A `popover` sheet (paper in Paper, ink in Ink) with a slight rotation (−0.5°) and a long hard `--cast` block shadow, like a page laid on a desk |
| Tabs / ToggleGroup | Rows of crossword cells; the active cell is ink-filled. In the reverse chess uncapture tray and notation toggle, where an ink fill would hide black pieces, the active cell is `muted` with a `primary` border, so it differs from hover |
| Slider | A thin ink rail with a cog thumb (reused in the gear crank) |
| Toast (sonner) | Paper slips with a red pencil underline |
| Skeleton | Grey grid cells with a silhouette walker |
| Badge (difficulty) | 1–5 cells, filled ink |

### 6.5 Icons

- **Lucide** (`lucide-react`, ISC): the shadcn default, used for general UI such as search, pencil, eraser, undo, settings, timer, check, eye, lightbulb and grid.
- **Tabler Icons** (`@tabler/icons-react`, MIT): used for chess glyphs in UI chrome (`IconChessKing`, `IconChessQueen`, `IconChessKnight`, `IconChessBishop`, `IconChessRook`, `IconChess`) and cog/gear variants. Lucide's chess coverage is thin.
- **Board pieces:** a dedicated SVG set. White pieces are paper with an ink outline in both themes, so they stay legible on light squares. Black pieces are ink with a paper outline, in both themes. Each has the long blue-grey `shadow` drop shadow, a stack of eight 0.6px `drop-shadow` steps; keep that look. File and rank labels are bold with a hard halo in the opposite colour so they stay readable over pieces. Off the board (the uncapture tray and the side-to-move king) a glyph sits on a paper tile, so black reads as black in Ink too. The king's cross has a halo in the piece's body colour, so it shows on either square. cburnett (Lichess) is GPL-2.0+/CC BY-SA, so it needs attribution and may have copyleft implications. If that is a problem, the alternatives are commissioned or self-drawn pieces. A decision is needed (see section 10).
- Phosphor and game-icons.net are **not** used in v1. A single primary icon set keeps the style consistent, and game-icons needs CC BY attribution.
- Icon stroke is 2px to match the borders, and icons are always ink or paper, never red unless they are active.

### 6.6 Motion

- Use the `motion` package (Framer Motion's successor) for the gear animation and the solved stamp.
- Use CSS transitions for everything else.
- Every animation respects `prefers-reduced-motion`.
- On solve, the solved hole opens (about 300ms, ease-out) and the stamp lands after it.

### 6.7 Mobile

- **Safe areas.** Anything fixed or flush to a screen edge pads itself with `env(safe-area-inset-*)`, using `max()` against its normal padding so it never shrinks: the site header (top, left, right), the footer (bottom) and bottom sheets (bottom). The viewport sets `viewport-fit=cover` so the insets are non-zero.
- **Theme colour.** The browser chrome follows the active theme. `viewport.themeColor` carries Paper and Ink for the system setting. When the theme is chosen by hand, the theme init script and `applyTheme` prepend their own `theme-color` meta, which wins because it comes first; they never edit the metas React renders. "System" removes it. The hex values live in `src/config/theme-colors.ts`.
- **`touch` variant.** The Tailwind variant `touch` is `@media (pointer: coarse) and (max-width: 47.999rem)`: portrait-class touch phones. It is pure CSS, so there is no hydration mismatch. Landscape phones and tablets keep the desktop layout. It drives solve mode (§4.5).
- **Tap targets.** Under `touch`, every control is at least 44×44px: `Button` sizes `sm`, `default` and `icon`, `Toggle`, the sheet close button, cipher key slots, book-cipher references, crossword clue rows, rota tokens and the solve back link. Desktop sizes are unchanged. The on-screen keyboard keys are exempt on width: ten keys across a phone are about 34px wide, as on any system keyboard, and are 48px tall. Rota tokens are 44px on squares about 41px wide, so they overlap their neighbours by a pixel or two.
- **Touch input.** Reverse Chess moves by tap: tap a piece, then a square (tapping the picked piece again cancels). Spot the Difference shows one scene at a time with a Left/Right toggle. `CellGrid` treats a `beforeinput` of `deleteContentBackward` as Backspace, because Android keyboards send no usable `keydown`.
- **Install hint.** On iOS Safari, outside standalone mode, the mobile nav sheet shows a dismissible "Add to Home Screen" hint. The dismissal is kept in `localStorage`.

---

## 7. Technical architecture

### 7.1 Stack (pinned to what is installed or current at time of writing)

- **Next.js 16.3.7** (App Router, Turbopack), **React 19.2**, TypeScript 5, pnpm 11.
  - _Read `node_modules/next/dist/docs/` before implementing. In Next 16, Middleware is renamed **Proxy** (`src/proxy.ts`)._
- **Tailwind CSS v4** (CSS-first `@theme`, no `tailwind.config.js`).
- **shadcn/ui** (CLI 4.x) with Radix primitives, heavily restyled (section 6.4).
- **Better Auth 1.7.x** with email and password, the Drizzle adapter and the `nextCookies()` plugin. Its peer ranges cover Next 16, `drizzle-orm ^0.45.2 || >=1.0.0-rc.1` and `drizzle-kit >=1.0.0-beta.1`.
  - We chose it over Auth.js/next-auth v5 because Auth.js is now in maintenance under the Better Auth team, its docs recommend Better Auth for new projects, and v5 has never left beta.
  - Credentials sign-in in Auth.js would also mean hand-rolling password hashing, sign-up and rate limiting, and it forces JWT sessions.
- **PostgreSQL 16+** with **Drizzle ORM 1.0** and **drizzle-kit 1.0** from the `rc` tag (currently 1.0.0-rc.4). Pin exact versions, because this is pre-release. What we take from 1.0:
  - built-in validators (`drizzle-orm/zod`), with no separate drizzle-zod package;
  - Relational Queries v2 with `defineRelations` in `src/db/relations.ts`, passed as `drizzle({ client, relations })`;
  - the v3 migrations folder layout (one folder per migration, no `journal.json`);
  - the rewritten drizzle-kit.

  The fallback, if the RC blocks us, is 0.45.x with `drizzle-zod` 0.8.x. The code changes are small: validator imports and relations syntax.
- **Zod 4** for every schema (payloads, answers, forms, env).
- **`drizzle-orm/zod`** (built into Drizzle 1.0, supports Zod 4) generates row schemas from the Drizzle tables.
- **chess.js 1.4** (rules and FEN) and **react-chessboard 5.x** (board UI, piece renderer overridden). Check the v5 API, which uses an `options` prop, before building.
- **motion** for animation.
- Testing: **Vitest** for engines and checkers, **Playwright** for end-to-end flows.
- **PWA:** `src/app/manifest.ts` (standalone, Ink splash background), icons are "L." from the wordmark in `ludwig-red` on Ink: PNGs in `public/icons/`, `src/app/apple-icon.png` and `src/app/icon.svg` (made by `scripts/dev/make-icons.ts`). iOS launch screens are `public/splash/{paper,ink}-<w>x<h>@<ratio>.jpg` (made by `scripts/dev/make-splash.ts`): the ink-splat wordmark on the grain texture, chosen by the OS colour scheme through `appleWebApp.startupImage` in `layout.tsx` (a static image cannot follow the in-app theme). Android builds its own splash from the manifest: the 512px icon on the Ink background colour, so `icon-512.png` is the full ink-splat wordmark on a transparent square (made by `make-splash.ts`) while the other icons stay "L.". There is no service worker until T118 (M7); installability needs only the manifest and HTTPS.
- Hosting: **Vercel**, with **Neon** Postgres from the Vercel Marketplace (section 7.7). The `pg` driver and `@vercel/functions` handle connection pooling.

### 7.2 Source layout

```
src/
  app/
    (marketing)/page.tsx            landing
    (auth)/sign-in/page.tsx, sign-up/page.tsx
    (app)/layout.tsx                nav, Suspense'd user menu
    (app)/puzzles/…, reverse-chess/…, gears/…, this-week/…, casebook/…, settings/…
    api/auth/[...all]/route.ts      toNextJsHandler(auth)
    globals.css                     @theme tokens, textures, shadcn variables
  lib/auth.ts                       betterAuth({ database: drizzleAdapter(db, { provider: "pg" }), emailAndPassword, session, rateLimit, plugins: [nextCookies()] })
  lib/auth-client.ts                createAuthClient() from better-auth/react (signIn, signUp, signOut, useSession)
  proxy.ts                          optimistic redirect via getSessionCookie() from better-auth/cookies
  db/
    index.ts                        pg Pool + drizzle (node-postgres); attachDatabasePool on Vercel
    schema/index.ts                 re-exports core, progress, auth and every src/puzzles/<type>/tables.ts
    schema/core.ts, progress.ts     lookups, puzzles supertype, volumes, weekly_puzzles, attempts, hints
    auth-schema.ts                  generated by the Better Auth CLI (user, session, account, verification, rate_limit)
    relations.ts                    defineRelations (RQBv2)
  lib/data/                         server-only data access (puzzles, attempts, user)
  lib/actions/                      server actions (checkAnswer, saveState, signUp, signIn)
  puzzles/<type>/…                  per-type tables/schema/load/check/derive/solver/engine (section 4.1)
  puzzles/_shared/                  shared pure engines (visibility.ts) and solver parts (CellInput grid)
  puzzles/registry.ts
  app/dev/kitchen-sink/page.tsx     design-system showcase; notFound() when VERCEL_ENV === "production"
  components/ui/                    shadcn (restyled)
  components/brand/                 Wordmark, Credit, InkSplat, Walker, Grain, SolvedStamp, BulletHole
  fonts/                            licensed fonts (optional, git-ignored if required)
content/
  <type>/<slug>.ts                  curated puzzles: { meta, content } typed by the type's contentSchema
  weekly.ts                         weekly_puzzles schedule
  lookups.ts                        puzzle_categories, puzzle_types, pictogram_glyphs
  words.txt                         word-ladder and word-wheel dictionary (one word per line, seeded into words)
scripts/
  seed.ts                           upserts lookups, then each content file (supertype + subtype + children in one transaction)
  verify-puzzles.ts                 uniqueness and solver checks (CI)
  generate-gears.ts                 materialise generated diagrams
drizzle/                            migrations (v3 layout: one folder per migration; custom SQL migrations for triggers)
drizzle.config.ts
```

### 7.3 Authentication (Better Auth)

**Config (`src/lib/auth.ts`):**

- `emailAndPassword: { enabled: true, minPasswordLength: 10, autoSignIn: true, requireEmailVerification: false }`. Users are signed in straight after sign-up, and no verification email is sent or needed.
- Password hashing uses Better Auth's built-in default, scrypt. The hash lives in `account.password` with `providerId = "credential"`, not on the user row.
- `advanced.database.generateId: "uuid"`, so ids are Postgres uuids.
- `plugins: [nextCookies()]`, so Server Actions can set the session cookie.

**Sign-up and sign-in:**

- Forms post to Server Actions.
- The action validates its input with the Zod form schema (section 7.4). It then calls `auth.api.signUpEmail({ body: { email, password, name } })` or `auth.api.signInEmail({ body })` and redirects.
- Errors (`APIError`) map onto form field messages.
- Sign-out uses `authClient.signOut()` from the user menu.

**Sessions:**

- Sessions are stored in the database (`session` table), so they can be revoked.
- `session: { expiresIn: 60*60*24*30, updateAge: 60*60*24, cookieCache: { enabled: true, maxAge: 300 } }`.
- The session is read with `auth.api.getSession({ headers: await headers() })`, wrapped once as `getCurrentUser()` in `lib/data/user.ts` and marked `server-only`.

**Route protection:**

- `proxy.ts` checks `getSessionCookie(request)` and redirects `/casebook` and `/settings` to `/sign-in` when there is no cookie. This is optimistic only.
- Authoritative checks happen in the data-access layer and in every Server Action, which call `getCurrentUser()` and throw if there is no session.
- Puzzle pages are public. Saving progress to the account requires a session; without one, state goes to `localStorage` (section 4.3).

**Rate limiting:** use Better Auth's built-in limiter with `rateLimit: { enabled: true, storage: "database" }` and a custom rule of 5 requests per 15 minutes on `/sign-in/email`. Database storage is used because in-memory limits don't survive serverless instances.

**v1.1:** turn on password reset (`sendResetPassword`). It is config plus an email provider; the `verification` table already exists. Email verification is out of scope.

**Cache Components:** **on** (T006 spike: session UI streams behind `<Suspense>` and `use cache` + `cacheTag` data caches and revalidates correctly, with a clean build and no runtime errors). User-dependent UI such as the nav user menu and the Casebook must sit behind `<Suspense>`. Puzzle payloads can be cached with `use cache` and `cacheTag("puzzle:"+id)`. See `node_modules/next/dist/docs/01-app/02-guides/authentication-with-cache-components.md`.

### 7.4 Data model (Drizzle, Postgres)

#### 7.4.1 Rules (non-negotiable)

1. **Third normal form.** Every non-key column depends on the key, the whole key and nothing but the key.
   - **Anything derivable is not stored.** That covers crossword answers and clue numbers, sudoku and futoshiki solutions, acrostic messages, plaintexts, maze paths, blind spots, gear spin signs, hint counts and streaks. Derivations live in pure engine code. `puzzles:verify` proves each one exists and is unique.
2. **Denormalisation is DB-enforced or absent.** Any redundant column is kept consistent by the database itself, through a composite foreign key and, where the value would otherwise come from the app, a `BEFORE INSERT` trigger that fills it. App code never writes or maintains a redundant value. Every such column is listed in section 7.4.5.
3. **No polymorphic relationships.** Every foreign key points at exactly one table, and there are no `(target_type, target_id)` pairs.
   - Puzzle types use **class-table inheritance**. Each type has its own subtype table whose PK is also an FK to `puzzles`.
   - A generated constant `type_key` column plus a composite FK makes a subtype row for the wrong type impossible (section 7.4.2).
4. **Atomic cells only.** There are no `jsonb`, `json`, array, or delimited or encoded text columns, so no FEN strings, no "4,3" enumerations, and no comma lists. Composite data becomes child rows.
5. **Enums versus lookup tables versus checks:**
   - A `pgEnum` is used for a fixed set of options that carry only a name.
   - A **lookup table** is used only when options carry extra attributes or must be extensible without a migration. In v1 that means `puzzle_categories`, `puzzle_types`, `pictogram_glyphs` and `words`.
   - A `CHECK` is used only where an enum is impossible, i.e. numeric domains such as `difficulty BETWEEN 1 AND 5`, ranks 1–8, digits 1–9 and tooth counts.
6. **Third-party schema.** Better Auth's generated tables are used as generated. They contain no `jsonb` or array columns. `account.scope` is a delimited OAuth field but stays `NULL`, because we have no OAuth.

#### 7.4.2 Supertype/subtype pattern

```sql
puzzles       (id uuid pk, type_key text not null fk→puzzle_types, …, unique (id, type_key))
gear_puzzles  (puzzle_id uuid pk,
               type_key text generated always as ('gears') stored,
               …,
               foreign key (puzzle_id, type_key) references puzzles (id, type_key) on delete cascade)
```

- **Wrong type is impossible.** A `gear_puzzles` row can only attach to a puzzle whose `type_key` is `gears`.
- **Type is immutable.** Changing a puzzle's `type_key` is rejected by the referencing FK, so no trigger is needed.
- **Completeness is enforced.** The constraint trigger `puzzles_require_subtype` is `DEFERRABLE INITIALLY DEFERRED`, `AFTER INSERT` on `puzzles`. At commit it checks that a row exists in the subtype table named by `puzzle_types.subtype_table` for that type, using dynamic SQL with `format('%I')`. It rejects puzzles with no subtype. Seeding inserts the supertype and subtype in one transaction.
- **Prototype tested.** The pattern was checked on Postgres 17: the wrong-type insert, the missing subtype and the type change each fail.
- **Attempts use the same pattern.** `attempts` is the supertype, and each `<type>_attempts` row pins its `type_key` the same way.

#### 7.4.3 Core tables

```
// Auth: generated by the Better Auth CLI into src/db/auth-schema.ts. Do not hand-edit; regenerate.
user, session, account, verification, rate_limit

// Enums
theme                  ('paper','ink','system')
chess_notation         ('algebraic','descriptive')
book_cover             ('blue','red','ink')            // maps to design tokens
weekly_slot            ('first','second')
hint_kind              ('check_cell','reveal_cell','check_all','reveal_all')

// Lookups
puzzle_categories      key text pk, name, sort smallint
puzzle_types           key text pk, category_key fk→puzzle_categories, name, description,
                       subtype_table text unique, sort smallint

// Settings
user_settings          user_id pk fk→user, theme, chess_notation, reduce_motion bool

// Content
volumes                id uuid pk, slug unique, title, cover book_cover, sort smallint
puzzles                id uuid pk, type_key fk→puzzle_types, slug, title,
                       difficulty smallint check (1–5), volume_id fk→volumes null,
                       source_note text null, published_at timestamptz null, created_at
                       unique (type_key, slug), unique (id, type_key)
weekly_puzzles         week_start date, slot weekly_slot, puzzle_id fk→puzzles
                       pk (week_start, slot), unique (week_start, puzzle_id)

// Progress
attempts               id uuid pk, user_id fk→user, puzzle_id fk→puzzles,
                       type_key text  (trigger-filled, see 7.4.5),
                       started_at, completed_at null, duration_ms int null
                       unique (user_id, puzzle_id), unique (id, puzzle_id, type_key),
                       unique (id, type_key) (target of the `<type>_attempts` FK),
                       fk (puzzle_id, type_key) → puzzles (id, type_key)
attempt_hints          id uuid pk, attempt_id fk→attempts, kind hint_kind,
                       row smallint null, col smallint null, used_at
```

#### 7.4.4 Per-type tables

The conventions:

- Each `<type>_puzzles` table is the subtype (section 7.4.2). Child tables key on `puzzle_id` plus a position or coordinates.
- Columns marked **(S)** are solution data. They are **never** selected by play queries (section 4.2).
- Each `<type>_attempts` table is the 1:1 attempt subtype, pinned with a generated `type_key` and keyed by `attempt_id`, with optional `<type>_attempt_*` children.
- Coordinates are `row`/`col smallint check (>= 0)`.
- Shared enums: `compass8` ('n','ne','e','se','s','sw','w','nw') and `chess_colour` ('white','black').

| Type | Content tables | Attempt-state tables |
|---|---|---|
| **reverse-chess** (Modes A and B) | `reverse_chess_puzzles`: mode `retro_mode`('last_move','unwind'), side_to_move, four castling-right bools, en_passant_file `chess_file` null, halfmove smallint, fullmove smallint, ply_count smallint<br>`reverse_chess_goals` **(S)** (Mode B only, `display_text` is shown to the player): puzzle_id pk, kind `retro_goal_kind`('piece_on_square','castling_right','piece_count','initial_position'), display_text. Unique `(puzzle_id, kind)`<br>`reverse_chess_goal_piece_on_square`, `reverse_chess_goal_castling_right`, `reverse_chess_goal_piece_count` **(S)**: puzzle_id pk, kind (generated, fixed per table). FK `(puzzle_id, kind)` to `reverse_chess_goals`, so a goal can only have the subtype row of its own kind. Columns: colour with piece, file and rank (1–8); colour with side `retro_castle_side`('kingside','queenside'); colour with piece and count (0–10). A deferred trigger requires the subtype row of the goal's kind (`initial_position` has none), another requires a goal exactly when mode is 'unwind', and a third requires `ply_count = 2 * (fullmove - 1) + (1 if side_to_move is black)` when the goal is `initial_position`<br>`reverse_chess_pieces`: (puzzle_id, file `chess_file`, rank 1–8) pk, colour, piece `chess_piece`<br>`reverse_chess_solution_plies` **(S)**: (puzzle_id, ply) pk, from_file, from_rank, to_file, to_rank, uncapture `chess_piece` null, unpromote bool, special `retro_special`('none','en_passant','castle') | `reverse_chess_attempt_plies`, mirroring the solution plies |
| **rota** (Reverse Chess Mode D, its own type) | `rota_puzzles`<br>`rota_workers`: id, puzzle_id, name, unique (puzzle_id, name)<br>`rota_worker_squares`: (puzzle_id, worker_id, phase `rota_phase`('intended','final')) pk, file, rank 1–8, unique (puzzle_id, phase, file, rank) so no two workers share a zone in one phase. `puzzle_id` is part of that candidate key, so it is not redundancy<br>`rota_clues`: id, puzzle_id, position, kind `rota_clue_kind`('unpowered_square','adjacent_only','never_in_rank','max_swaps'), display_text. The deferred constraint trigger `rota_clues_require_subtype` requires a subtype row for every kind except `adjacent_only`<br>One subtype table per parameterised clue kind, pinned by a generated `kind` and composite FK (clue_id, kind) → `rota_clues` (id, kind): `rota_clue_unpowered_square`(clue_id, file, rank), `rota_clue_never_in_rank`(clue_id, worker_id, rank), `rota_clue_max_swaps`(clue_id, max_swaps smallint)<br>`rota_solution_swaps` **(S)**: (puzzle_id, step) pk, worker_a_id, worker_b_id<br>`rota_solutions` **(S)**: puzzle_id pk, instigator_worker_id. The deferred constraint trigger `rota_instigator_in_first_swap` requires the instigator to be one of the two workers of step 1<br>Every worker reference is a composite FK (puzzle_id, worker_id) → `rota_workers` (puzzle_id, id) | `rota_attempts`: puzzle_id (redundant, section 7.4.5). The instigator is not part of the answer, so an attempt stores none (a leftover nullable `instigator_worker_id` stays in the database until T141 drops it)<br>`rota_attempt_swaps`, mirroring the solution swaps |
| **gears** | `gear_puzzles`: slot_count, m_in, m_out, max_adjustments smallint (0 = normal), occlusion bool, generator_seed text null (provenance only)<br>`gear_puzzle_gears`: id, puzzle_id, label, teeth smallint check (8, 12, 16, 24), start_slot, initial_offset, half_width_deg, is_driver bool. Partial unique index on (puzzle_id) where is_driver, plus a deferred constraint trigger requiring exactly one driver<br>`gear_meshes`: (puzzle_id, gear_a_id, gear_b_id) pk, check (gear_a_id < gear_b_id), both FKs composite (puzzle_id, id)<br>`gear_solutions` **(S)**: puzzle_id pk, crank, convergence 1–8, killer_gear_id<br>`gear_solution_swaps` **(S)**: (puzzle_id, gear_a_id, gear_b_id)<br>`gear_daily`: date pk, puzzle_id unique | `gear_attempts`: crank, convergence null, accused_gear_id null<br>`gear_attempt_swaps` |
| **gear-train** (Gear Puzzle Mode B, its own type) | `gear_train_puzzles`: rows smallint check (4–12), cols smallint check (4–12), target_clockwise bool. The driver always turns clockwise<br>`gear_train_fixed_cogs`: (puzzle_id, role `gear_train_role`('driver','target')) pk, row, col, teeth smallint check (8, 16, 24), unique (puzzle_id, row, col). The deferred constraint triggers `trg_gear_train_puzzles_require_fixed_cogs` (on insert of the puzzle) and `trg_gear_train_fixed_cogs_keep_both` (on update of role or delete) require both roles at commit<br>`gear_train_bolts`: (puzzle_id, row, col) pk<br>`gear_train_inventory`: (puzzle_id, teeth) pk, count smallint check (1–6)<br>`gear_train_solution_cogs` **(S)**: (puzzle_id, row, col) pk, teeth. Composite FK (puzzle_id, teeth) → `gear_train_inventory`. Board bounds, bolts, collisions and the inventory count are checked by `puzzles:verify`, not the database | `gear_train_attempts`<br>`gear_train_attempt_cogs`: (attempt_id, row, col) pk, puzzle_id, teeth. Composite FK (puzzle_id, teeth) → `gear_train_inventory`. Saved state may be any work in progress, so only `check` applies the placement rules. `check` also returns `brokenRule`, the first of rules 1 to 7 (section 5.2.5) an invalid placement breaks, which depends only on the payload and the answer (a type-specific extra, not the shared `wrongParts` of section 4.1) |
| **crossword** (cryptic and quick merged, see section 2.3) | `crossword_puzzles`: style `crossword_style`('cryptic','quick'), rows, cols<br>`crossword_cells`: (puzzle_id, row, col) pk, letter char(1) **(S)**, upper-case A to Z. Blocks are the absence of a row<br>`crossword_clues`: (puzzle_id, direction `clue_direction`('across','down'), row, col) pk, clue_text. FK to the start cell<br>`crossword_clue_segments`: (puzzle_id, direction, row, col, position) pk, length, separator `segment_separator`('word','hyphen'), the break after the segment. These give the "(4,3)" or "(5-4)" enumeration. A deferred trigger requires a separator on every segment but the last and rejects one on the last (null is never a word break). Content states `separators` only for hyphens | `crossword_attempts`: puzzle_id (redundant, section 7.4.5)<br>`crossword_attempt_cells`: (attempt_id, row, col) pk, puzzle_id (redundant, section 7.4.5), letter char(1). FK `(puzzle_id, row, col)` → `crossword_cells`, so an entry can only sit on a cell of its own puzzle. That FK is `DEFERRABLE INITIALLY DEFERRED` with no cascade, so a content edit that removes a filled cell fails the seed at commit instead of deleting saved letters |
| **anagram** | `anagram_puzzles`: answer **(S)**, definition_hint null, scramble_seed. Tiles are derived from the answer and seed | `anagram_attempts`: answer text null |
| **word-ladder** | `words` (lookup, seeded from `content/words.txt`, never removed): word pk, CHECK `^[a-z]{3,6}$`. The source is SCOWL (npm `wordlist-english` 1.2.1), whose notices are reproduced in `content/words.COPYRIGHT` and summarised in `scripts/seed-words.ts`<br>`word_ladder_puzzles`: start_word fk→words, end_word fk→words, rung_count smallint check (≥ 1). `rung_count` is the number of rungs **between** the two fixed words<br>`word_ladder_solution_rungs` **(S)**: (puzzle_id, position) pk, word fk→words (a reference ladder of exactly `rung_count` rungs). `load` returns only the endpoints and the count. `loadSolution` returns every dictionary word of the ladder's length (not the reference rungs, which only `puzzles:verify` checks), and `check` looks the player's rungs up in that list. The answer is the whole ladder (start, rungs, end); `check` also returns `rungProblems` (`position`, `reason` of `not-a-word`, `not-one-step` or `repeated`), which depend only on the answer and the dictionary | `word_ladder_attempts`<br>`word_ladder_attempt_rungs`: (attempt_id, position) pk, word text a–z, 1–6 letters. No FK to `words`: it holds what the player typed, partial words included |
| **acrostic** | `acrostic_puzzles`: rule `acrostic_rule`('first_letter_line','first_letter_word','last_letter_line')<br>`acrostic_lines`: (puzzle_id, position) pk, content (1–300 characters, at least one letter). There is no message column: `derive.ts` derives the message from the lines by the rule (upper-case A–Z, ignoring case, accents, spaces and punctuation), so nothing is **(S)** and `loadSolution` derives it for `check`. `load` returns the lines and the rule's display label only, not the rule key or the message. `puzzles:verify` needs a derived message of at least 4 letters and a letter in every line | `acrostic_attempts`: answer text null (what the player typed, at most 80 characters) |
| **word-search** | `word_search_puzzles`: rows, cols (3–15)<br>`word_search_cells`: (puzzle_id, row, col) pk, letter A–Z. Not secret: the payload carries every cell<br>`word_search_words`: (puzzle_id, word) pk, A–Z, 3–15 letters. There is no placement column: `derive.ts` finds each word in all eight directions, and `puzzles:verify` needs exactly one placement per word and a full rectangular grid. Nothing is **(S)**, since anyone can derive the placements from the payload; `loadSolution` derives them for `check`, whose answer is the two end cells of each selection | `word_search_attempts`: puzzle_id (redundant, section 7.4.5, trigger-filled)<br>`word_search_attempt_found`: (attempt_id, word) pk, puzzle_id (redundant, trigger-filled). FK `(puzzle_id, word)` → `word_search_words`, `DEFERRABLE INITIALLY DEFERRED` with no cascade, so a content edit that removes a found word fails the seed |
| **logic-grid** | `logic_grid_puzzles`<br>`logic_grid_categories`: (puzzle_id, position) pk, name<br>`logic_grid_items`: id, puzzle_id, category_position, position, label. `unique (puzzle_id, id)` and `unique (puzzle_id, category_position, position)`, FK `(puzzle_id, category_position)` → `logic_grid_categories`. Item ids stay stable across re-seeds because content rows upsert on the slot<br>`logic_grid_clues`: (puzzle_id, position) pk, content, is_false bool **(S)**. A partial unique index allows at most one false clue per puzzle. The variant is derived as "any clue is false" (`derive.ts`); the payload carries only that boolean<br>`logic_grid_solution_links` **(S)**: (puzzle_id, item_a_id, item_b_id) pk. FKs `(puzzle_id, item_a_id)` and `(puzzle_id, item_b_id)` → `logic_grid_items (puzzle_id, id)` keep both items in one puzzle. Content states one household per row, stored as links from the first category's item to the others; every other pair is derived by closing the links. `check` also returns `wrongParts`, the category pairs in which the player linked items and whose links differ from the solution (the shared field of section 4.1; it never names a pair the player left unlinked) | `logic_grid_attempts`: puzzle_id (redundant, section 7.4.5), false_clue_position (the clue the player flagged). FK `(puzzle_id, false_clue_position)` → `logic_grid_clues`<br>`logic_grid_attempt_marks`: (attempt_id, item_a_id, item_b_id) pk, puzzle_id (redundant, section 7.4.5), mark `grid_mark`('yes','no'). `item_a_id` is the item of the earlier category. FKs `(puzzle_id, item_a_id)` and `(puzzle_id, item_b_id)` → `logic_grid_items (puzzle_id, id)`<br>`logic_grid_attempt_struck_clues`: (attempt_id, clue_position) pk, puzzle_id (redundant, section 7.4.5). FK `(puzzle_id, clue_position)` → `logic_grid_clues`. The attempt FKs to content rows have no cascade, so a content edit that removes a marked item or a struck clue fails the seed |
| **knights-knaves** | `knights_knaves_puzzles`: question_text<br>`knights_knaves_characters`: (puzzle_id, position) pk, name, role `kk_role`('knight','knave') **(S)**<br>`knights_knaves_statements`: (puzzle_id, character_position, position) pk, content, FK `(puzzle_id, character_position)` → `knights_knaves_characters`. Position 0–4 and a unique name per puzzle, `DEFERRABLE INITIALLY DEFERRED` so a reseed can swap two names | `knights_knaves_attempts`: puzzle_id (redundant, section 7.4.5, trigger-filled)<br>`knights_knaves_attempt_roles`: (attempt_id, character_position) pk, puzzle_id (redundant, trigger-filled), role `kk_role`. FK `(puzzle_id, character_position)` → `knights_knaves_characters`, `DEFERRABLE INITIALLY DEFERRED` with no cascade, so a content edit that removes a character with a saved role fails the seed. A statement's predicate is never stored |
| **sudoku** | `sudoku_puzzles`<br>`sudoku_givens`: (puzzle_id, row, col) pk, row and col 0–8, digit 1–9<br>`sudoku_region_sets` (jigsaw and rainbow only; a classic sudoku has no row): puzzle_id pk, FK → `sudoku_puzzles`, kind `sudoku_region_kind`('jigsaw','rainbow')<br>`sudoku_region_cells`: (puzzle_id, row, col) pk, region smallint 0–8, FK puzzle_id → `sudoku_region_sets`. The deferred constraint trigger `sudoku_region_sets_require_cells` requires all 81 cells, with nine in each region. `puzzles:verify` checks that jigsaw regions are edge-connected<br>`sudoku_cages` (killer): (puzzle_id, cage) pk, sum smallint check (1–45)<br>`sudoku_cage_cells`: (puzzle_id, row, col) pk, cage, FK (puzzle_id, cage) → `sudoku_cages`. The deferred constraint trigger `sudoku_cages_require_cells` requires at least one cell per cage. `puzzles:verify` checks that cages are edge-connected and that their sums are reachable<br>`sudoku_xv_sets` (XV; its presence turns on the negative rule): puzzle_id pk, FK → `sudoku_puzzles`<br>`sudoku_xv_marks`: (puzzle_id, row, col, direction `ineq_direction`) pk, mark `xv_mark`('x','v'), FK puzzle_id → `sudoku_xv_sets`. A mark sits between a cell and its right or lower neighbour, as futoshiki signs do. The units are rows, columns, and either the boxes (classic and rainbow) or the jigsaw regions, plus the colour groups for rainbow. No solution is stored: `loadSolution` solves the givens, and `puzzles:verify` proves they have exactly one completion. `check` accepts any grid that respects the givens and repeats no digit in any unit, and also returns `wrongParts`, the cells breaking a rule (the shared field of section 4.1, rule breaks only, never a diff against a solution) | `sudoku_attempt_cells`: (attempt_id, row, col) pk, digit, plus `sudoku_attempt_notes`: (attempt_id, row, col, digit) pk for pencil marks. Both carry the same 0–8 and 1–9 checks, and neither references the givens |
| **futoshiki** | `futoshiki_puzzles`: size 4–7<br>`futoshiki_givens`: (puzzle_id, row, col) pk, row and col 0–6, digit 1–9<br>`futoshiki_inequalities`: (puzzle_id, row, col, direction `ineq_direction`('right','down')) pk, relation `ineq_relation`('lt','gt'): `lt` means the cell is smaller than its right or lower neighbour. A CHECK cannot see `size`, so `contentSchema` and `check` validate that coordinates and digits fit it, and the signs stay on the grid. No solution is stored: `loadSolution` solves the puzzle, and `puzzles:verify` proves exactly one completion. `check` accepts any grid that respects the givens, repeats no digit in a row or column and obeys every sign, and also returns `wrongParts` (rule breaks only, as for sudoku) | `futoshiki_attempt_cells`: (attempt_id, row, col) pk, digit, plus `futoshiki_attempt_notes`: (attempt_id, row, col, digit) pk for pencil marks. Neither references the puzzle's rows |
| **odd-one-out** | `odd_one_out_puzzles`: prompt_text (1–300 characters)<br>`odd_one_out_items`: (puzzle_id, position) pk, position 0–4, label (1–60 characters). `unique (puzzle_id, label)` is `DEFERRABLE INITIALLY DEFERRED`, so labels can swap on a re-seed. The count of 4 to 5 is checked by `contentSchema` and `puzzles:verify`, not the database<br>`odd_one_out_solutions` **(S)**: puzzle_id pk (so exactly one row per puzzle), item_position, explanation (non-blank, up to 600 characters). FK `(puzzle_id, item_position)` → `odd_one_out_items`, so it cannot name a missing item and removing that item fails the seed | `odd_one_out_attempts`: item_position null until the player picks. FK `(puzzle_id, item_position)` → `odd_one_out_items`, `DEFERRABLE INITIALLY DEFERRED` and without cascade, so removing a picked item fails the seed instead of wiping saved progress |
| **sightlines** | `sightlines_puzzles`: rows, cols (3–15), target_row, target_col (a CHECK keeps the target inside the grid)<br>`sightlines_obstacles`: (puzzle_id, row, col) pk<br>`sightlines_observers`: (puzzle_id, row, col) pk, facing `compass8`('n','ne','e','se','s','sw','w','nw'), fov_deg 1–360 (CHECK). No blind or visible column is stored: the blind spots are derived with `visibility.ts` (`derive.ts`), and `loadSolution` derives them from the layout. The question is "mark every floor cell that no observer can see". The DB does not see the grid contents, so `puzzles:verify` requires every observer and the target in bounds, no observer or target on a pillar, no two observers on one cell, a non-empty blind-spot set, and the target among the blind spots. `check` requires the marked set to equal the derived set and also computes `cellsWrong`, the number of missing plus extra cells, server-side only: the module returns just `{ correct }` to `checkAnswer`, because a count sent to the browser would let a player find each blind spot by toggling one cell per check | `sightlines_attempt_marks`: (attempt_id, row, col) pk, row and col ≥ 0. A mark names no content row, so it has no FK to the puzzle's rows |
| **cctv-maze** | `cctv_maze_puzzles`: rows, cols (3–15), start_row, start_col, exit_row, exit_col (CHECKs keep the start and exit inside the grid)<br>`cctv_maze_walls`: (puzzle_id, row, col, side `wall_side`('north','west')) pk. A cell's south and east walls are its neighbours' north and west walls, and the outer boundary is implicit, so `derive.ts` (`hasWall`, `canStep`) reads all four sides and `puzzles:verify` rejects a stored boundary wall<br>`cctv_maze_cameras`: (puzzle_id, row, col) pk, facing `compass8` (defined with `sightlines`), fov_deg 1–360 (CHECK), range_cells ≥ 1 (CHECK). Cones are laid over the plan, so walls do not block a camera's view; `visibility.ts` computes them. No path or seen cell is stored: `loadSolution` derives the seen cells. `puzzles:verify` requires everything in bounds, the start and exit unseen and different, and exactly one shortest unseen path (`engine.ts` counts them, up to 2). `check` accepts any path that starts at the start, moves one cell at a time through no wall and over no seen cell, and ends at the exit, not only the shortest. It computes the first invalid step server-side, but the module returns only `{ correct }` to `checkAnswer`: the step would tell the player which cells are seen. The solver hides the cones; "Reveal cameras" shows them and, signed in, inserts one `attempt_hints` row of kind `reveal_all` per attempt, none once the attempt is completed | `cctv_maze_attempt_steps`: (attempt_id, step) pk, row, col ≥ 0. Step 0 is the start cell. A step names no content row, so it has no FK to the puzzle's rows |
| **spot-difference** | `spot_difference_puzzles`: scene_seed **(S)**, difference_count 1 to 15, generator_version smallint ≥ 1 **(S)**. The scenes and differences are derived from these. `load.ts` returns the two derived scene trees and never the seed, version or any region | `spot_difference_attempts`<br>`spot_difference_attempt_found`: (attempt_id, difference_index) pk, difference_index 0 to 14. The index names a derived difference, not a content row, so it has no FK to the puzzle and needs no redundant `puzzle_id`. Triggers reject a found index at or above the puzzle's `difference_count`, and lowering a count below an index already found |
| **book-cipher** | `book_texts`: id, slug unique, title, author, source, public_domain_basis<br>`book_text_lines`: (text_id, page, line) pk, content. Seeded from `content/book-texts/<slug>.ts` by `paginate`: words packed greedily into lines of at most 56 characters, 20 lines to a page, both counted from 1<br>`book_cipher_puzzles`: text_id fk→book_texts, unique (puzzle_id, text_id)<br>`book_cipher_refs`: (puzzle_id, position) pk, text_id (scoped, filled by trigger), page, line, word_index ≥ 1. The FK to `book_text_lines` has no cascade. There is no **(S)** column: the plaintext is derived (each referenced word, lowercased and stripped to letters, in position order). `load` returns the whole text and the references; `puzzles:verify` fails a reference to a missing line or a word beyond the line's word count | `book_cipher_attempts`: answer null. The saved `answer` is the player's words in reference order, separated by spaces, `_` for a word not yet written; `check` compares letters only |
| **pictogram-cipher** | `pictogram_glyphs` (lookup, seeded from `content/lookups.ts`): id smallint pk, asset_key unique (`glyph-NN`, a neutral number, checked), letter char(1) unique a–z **(S)**. The 26 SVGs are in `public/glyphs/<asset_key>.svg`; the numbering is shuffled against the alphabet, so neither name nor order gives a letter away. Glyphs are never removed<br>`pictogram_cipher_puzzles`<br>`pictogram_cipher_symbols`: (puzzle_id, word_index, position) pk, glyph_id fk→pictogram_glyphs (no cascade)<br>`pictogram_cipher_given_glyphs`: (puzzle_id, glyph_id) pk, glyph_id fk→pictogram_glyphs (no cascade). The plaintext is derived (the symbols' glyph letters, words split by `word_index`). `load` returns the glyph asset keys per word and the asset key and letter of the given glyphs only; `puzzles:verify` needs at least 20 letters, 8 distinct glyphs, given glyphs that occur in the message, and every other glyph readable from the given ones (a word of 3+ letters with at most two unknown glyphs and at least half its letters known gives those glyphs away, repeated to a fixpoint) | `pictogram_cipher_attempts` (no columns beyond the key), `pictogram_cipher_attempt_guesses`: (attempt_id, glyph_id) pk, glyph_id fk→pictogram_glyphs, letter a–z. Only the player's own guesses are saved, never the given glyphs. `check` compares the decoded letters only |
| **caesar** | `caesar_puzzles`: plaintext **(S)**, shift 1–25 **(S)** (CHECK). The ciphertext is derived (uppercase, non-letters unchanged) and is the whole payload. `check` compares letters only, so case, spacing and punctuation never count | `caesar_attempts`: answer null. The cipher-key panel's guesses are client-only; the saved `answer` is the decoded letters of the ciphertext in order, `_` for a letter not yet guessed |
| **keyword** | `keyword_puzzles`: plaintext **(S)**, keyword **(S)**, 3–12 letters. The cipher alphabet is derived: the keyword's letters once each in order, then the rest of the alphabet in order. The ciphertext is derived and is the whole payload | `keyword_attempts`: answer null, saved as for caesar |
| **napkin-maths** | `napkin_maths_puzzles`: question_text (1-300 characters), answer numeric(18,6) **(S)**<br>`napkin_maths_lines`: (puzzle_id, position) pk, position 0-11, content (1-120 characters) | `napkin_maths_attempts`: answer numeric(18,6) null, the last valid decimal the player typed. It references no content row, so it needs no redundant puzzle_id |
| **chess-problem** | `chess_problem_puzzles`: mate_in smallint check (1–2), four castling-right bools, en_passant_file `chess_file` null. White is always to move<br>`chess_problem_pieces`: (puzzle_id, file `chess_file`, rank 1–8) pk, colour `chess_colour`, piece `chess_piece`. The FEN is derived. No solution is stored: `loadSolution` and `check` solve the position (section 2.4) | `chess_problem_attempts`<br>`chess_problem_attempt_plies`: (attempt_id, ply) pk, from_file, from_rank, to_file, to_rank, promotion `chess_piece` null |
| **railroad** | `railroad_puzzles`: rows and cols smallint check (4–10), entry_row, entry_col, entry_side `compass8`, exit_row, exit_col, exit_side `compass8`. The sides are checked to be 'n', 'e', 's' or 'w'. `contentSchema` checks that each end sits on the edge its side names<br>`railroad_row_counts`: (puzzle_id, row) pk, count smallint ≥ 0<br>`railroad_col_counts`: (puzzle_id, col) pk, count smallint ≥ 0<br>`railroad_given_pieces`: (puzzle_id, row, col) pk, piece `track_piece`('ns','ew','ne','nw','se','sw'). No solution is stored | `railroad_attempts`<br>`railroad_attempt_pieces`: (attempt_id, row, col) pk, piece `track_piece`<br>`railroad_attempt_crosses`: (attempt_id, row, col) pk, for cells marked "no track" |
| **star-battle** | `star_battle_puzzles`: size smallint check (5–10), stars smallint check (1–2)<br>`star_battle_region_cells`: (puzzle_id, row, col) pk, region smallint check (0–9). `puzzles:verify` checks `size²` cells, `size` edge-connected regions, and exactly one solution. No solution is stored | `star_battle_attempts`<br>`star_battle_attempt_marks`: (attempt_id, row, col) pk, mark `star_mark`('star','dot') |
| **troix** | `troix_puzzles`: size smallint check (size IN (6, 9))<br>`troix_givens`: (puzzle_id, row, col) pk, symbol `troix_symbol`('x','o','i'). No solution is stored | `troix_attempts`<br>`troix_attempt_cells`: (attempt_id, row, col) pk, symbol `troix_symbol` |
| **circle9** | `circle9_puzzles`<br>`circle9_numbers`: (puzzle_id, row, col) pk, row and col 0–8, digit 1–9. No solution is stored | `circle9_attempts`<br>`circle9_attempt_circles`: (attempt_id, row, col) pk. Attempt rows don't reference the numbers; `check` rejects a circle on an empty cell |
| **word-wheel** | `word_wheel_puzzles`: target_word fk→words **(S)**, centre_position smallint check (0–8) **(S)**, scramble_seed, min_length smallint check (4–5). The wheel is derived as for the anagram: the centre letter is `target_word[centre_position]`, and the rim is the other eight letters in an order derived from the seed. The rating thresholds are derived from the dictionary (section 2.4) | `word_wheel_attempts`<br>`word_wheel_attempt_words`: (attempt_id, word) pk, word fk→words |
| **nonogram** | `nonogram_puzzles`: rows and cols smallint check (5–25), caption **(S)**<br>`nonogram_cells` **(S)**: (puzzle_id, row, col) pk, the shaded cells of the picture. The run clues are derived from them; `load.ts` returns only the clues | `nonogram_attempts`<br>`nonogram_attempt_marks`: (attempt_id, row, col) pk, mark `nonogram_mark`('fill','cross') |
| **fillomino** | `fillomino_puzzles`: rows and cols smallint check (5–12)<br>`fillomino_givens`: (puzzle_id, row, col) pk, digit 1–9. No solution is stored | `fillomino_attempts`<br>`fillomino_attempt_cells`: (attempt_id, row, col) pk, digit 1–9 |
| **norinori** | `norinori_puzzles`: rows and cols smallint check (5–12)<br>`norinori_region_cells`: (puzzle_id, row, col) pk, region smallint ≥ 0. `puzzles:verify` checks full coverage and edge-connected regions of at least two cells. No solution is stored | `norinori_attempts`<br>`norinori_attempt_marks`: (attempt_id, row, col) pk, mark `norinori_mark`('shade','dot') |
| **kakuro** | `kakuro_puzzles`: rows and cols smallint check (5–14)<br>`kakuro_cells` **(S)**: (puzzle_id, row, col) pk, digit 1–9. White cells are the rows; black cells are their absence, as for crossword. The clues are derived from the digits, and `load.ts` returns the white cells and the clues, never the digits | `kakuro_attempts`<br>`kakuro_attempt_cells`: (attempt_id, row, col) pk, digit 1–9. Attempt rows don't reference `kakuro_cells`; `check` rejects a digit in a black cell |
| **reflections** | `reflections_puzzles`: rows and cols smallint check (4–10)<br>`reflections_fixed_mirrors`: (puzzle_id, row, col) pk, mirror `mirror_kind`('slash','backslash')<br>`reflections_slots`: (puzzle_id, row, col) pk. `puzzles:verify` checks that a slot never shares a cell with a fixed mirror<br>`reflections_ports`: (puzzle_id, side `compass8`, offset smallint ≥ 0) pk, label char(1), upper-case A–Z. The side is checked to be 'n', 'e', 's' or 'w', and `puzzles:verify` checks that every label appears exactly twice. No solution is stored | `reflections_attempts`<br>`reflections_attempt_mirrors`: (attempt_id, row, col) pk, mirror `mirror_kind` |
| **detective-scene** | `detective_scene_puzzles`: scene_key text unique, the key of a scene component in `src/puzzles/detective-scene/scenes/`, width and height smallint (scene units)<br>`detective_scene_items`: (puzzle_id, position) pk, title **(S)**, x, y, w, h smallint **(S)**, the item's region in scene units<br>`detective_scene_item_aliases` **(S)**: (puzzle_id, position, alias) pk, FK (puzzle_id, position) → `detective_scene_items` | `detective_scene_attempts`: puzzle_id (redundant, section 7.4.5)<br>`detective_scene_attempt_found`: (attempt_id, position) pk, puzzle_id (redundant, section 7.4.5). FK `(puzzle_id, position)` → `detective_scene_items`, `DEFERRABLE INITIALLY DEFERRED` with no cascade, as for crossword attempt cells |

**Uniqueness exception.** A word ladder accepts **any** valid ladder of `rung_count` rungs that uses dictionary words. The stored ladder is only a reference. Every other type keeps the exactly-one-solution rule.

#### 7.4.5 Controlled redundancy (complete list)

| Column | Redundant with | Kept consistent by |
|---|---|---|
| `attempts.type_key` | `puzzles.type_key` through `puzzle_id` | Composite FK `(puzzle_id, type_key)` → `puzzles`, plus the `BEFORE INSERT OR UPDATE OF puzzle_id` trigger `attempts_fill_type_key` |
| `puzzle_id` on attempt rows that reference puzzle children (the general rule; each case has its own row below) | `attempts.puzzle_id` | The attempt subtype FKs `(attempt_id, puzzle_id, type_key)` → `attempts (id, puzzle_id, type_key)`, since `attempts` has no unique `(id, puzzle_id)`; its children FK `(attempt_id, puzzle_id)` → the subtype. Each column has a `BEFORE INSERT` fill trigger |
| `gear_attempts.puzzle_id` | `attempts.puzzle_id` | Composite FK `(attempt_id, puzzle_id, type_key)` → `attempts (id, puzzle_id, type_key)`, where `type_key` is generated as `'gears'`, plus the `BEFORE INSERT` trigger `gear_attempts_fill_puzzle_id`. The trigger fills only a NULL, so an explicit mismatch reaches the FK and fails |
| `gear_attempt_swaps.puzzle_id` | `gear_attempts.puzzle_id` | Composite FK `(attempt_id, puzzle_id)` → `gear_attempts (attempt_id, puzzle_id)`, plus the `BEFORE INSERT` trigger `gear_attempt_swaps_fill_puzzle_id`. Both gears are then scoped to the puzzle by `(puzzle_id, gear_*_id)` → `gear_puzzle_gears (puzzle_id, id)` |
| `gear_train_attempts.puzzle_id` | `attempts.puzzle_id` | Composite FK `(attempt_id, puzzle_id, type_key)` → `attempts (id, puzzle_id, type_key)`, where `type_key` is generated as `'gear-train'`, plus the `BEFORE INSERT` trigger `trg_gear_train_attempts_fill_puzzle_id`. The trigger fills only a NULL, so an explicit mismatch reaches the FK and fails |
| `gear_train_attempt_cogs.puzzle_id` | `gear_train_attempts.puzzle_id` | Composite FK `(attempt_id, puzzle_id)` → `gear_train_attempts (attempt_id, puzzle_id)`, plus the `BEFORE INSERT` trigger `trg_gear_train_attempt_cogs_fill_puzzle_id`. The cog size is then scoped to the puzzle by `(puzzle_id, teeth)` → `gear_train_inventory (puzzle_id, teeth)` |
| `crossword_attempts.puzzle_id` | `attempts.puzzle_id` | Composite FK `(attempt_id, puzzle_id, type_key)` → `attempts (id, puzzle_id, type_key)`, where `type_key` is generated as `'crossword'`, plus the `BEFORE INSERT` trigger `crossword_attempts_fill_puzzle_id`. The trigger fills only a NULL, so an explicit mismatch reaches the FK and fails |
| `crossword_attempt_cells.puzzle_id` | `crossword_attempts.puzzle_id` | Composite FK `(attempt_id, puzzle_id)` → `crossword_attempts (attempt_id, puzzle_id)`, plus the `BEFORE INSERT` trigger `crossword_attempt_cells_fill_puzzle_id`. The cell is then scoped to the puzzle by `(puzzle_id, row, col)` → `crossword_cells (puzzle_id, row, col)` |
| `word_search_attempts.puzzle_id` | `attempts.puzzle_id` | Composite FK `(attempt_id, puzzle_id, type_key)` → `attempts (id, puzzle_id, type_key)`, where `type_key` is generated as `'word-search'`, plus the `BEFORE INSERT` trigger `trg_word_search_attempts_fill_puzzle_id` |
| `word_search_attempt_found.puzzle_id` | `word_search_attempts.puzzle_id` | Composite FK `(attempt_id, puzzle_id)` → `word_search_attempts (attempt_id, puzzle_id)`, plus the `BEFORE INSERT` trigger `trg_word_search_attempt_found_fill_puzzle_id`. The word is then scoped to the puzzle by `(puzzle_id, word)` → `word_search_words (puzzle_id, word)` |
| `knights_knaves_attempts.puzzle_id` | `attempts.puzzle_id` | Composite FK `(attempt_id, puzzle_id, type_key)` → `attempts (id, puzzle_id, type_key)`, where `type_key` is generated as `'knights-knaves'`, plus the `BEFORE INSERT` trigger `trg_knights_knaves_attempts_fill_puzzle_id` |
| `odd_one_out_attempts.puzzle_id` | `attempts.puzzle_id` | Composite FK `(attempt_id, puzzle_id, type_key)` → `attempts (id, puzzle_id, type_key)`, where `type_key` is generated as `'odd-one-out'`, plus the `BEFORE INSERT` trigger `trg_odd_one_out_attempts_fill_puzzle_id`. The picked item is then scoped to the puzzle by `(puzzle_id, item_position)` → `odd_one_out_items (puzzle_id, position)` |
| `knights_knaves_attempt_roles.puzzle_id` | `knights_knaves_attempts.puzzle_id` | Composite FK `(attempt_id, puzzle_id)` → `knights_knaves_attempts (attempt_id, puzzle_id)`, plus the `BEFORE INSERT` trigger `trg_knights_knaves_attempt_roles_fill_puzzle_id`. The character is then scoped to the puzzle by `(puzzle_id, character_position)` → `knights_knaves_characters (puzzle_id, position)` |
| `logic_grid_attempts.puzzle_id` | `attempts.puzzle_id` | Composite FK `(attempt_id, puzzle_id, type_key)` → `attempts (id, puzzle_id, type_key)`, where `type_key` is generated as `'logic-grid'`, plus the `BEFORE INSERT` trigger `trg_logic_grid_attempts_fill_puzzle_id`. The trigger fills only a NULL, so an explicit mismatch reaches the FK and fails |
| `logic_grid_attempt_marks.puzzle_id` | `logic_grid_attempts.puzzle_id` | Composite FK `(attempt_id, puzzle_id)` → `logic_grid_attempts (attempt_id, puzzle_id)`, plus the `BEFORE INSERT` trigger `trg_logic_grid_attempt_marks_fill_puzzle_id`. Both items are then scoped to the puzzle by `(puzzle_id, item_*_id)` → `logic_grid_items (puzzle_id, id)` |
| `logic_grid_attempt_struck_clues.puzzle_id` | `logic_grid_attempts.puzzle_id` | Composite FK `(attempt_id, puzzle_id)` → `logic_grid_attempts (attempt_id, puzzle_id)`, plus the `BEFORE INSERT` trigger `trg_logic_grid_attempt_struck_clues_fill_puzzle_id`. The clue is then scoped to the puzzle by `(puzzle_id, clue_position)` → `logic_grid_clues (puzzle_id, position)` |
| `rota_attempts.puzzle_id` | `attempts.puzzle_id` | Composite FK `(attempt_id, puzzle_id, type_key)` → `attempts (id, puzzle_id, type_key)`, where `type_key` is generated as `'rota'`, plus the `BEFORE INSERT` trigger `rota_attempts_fill_puzzle_id`. The trigger fills only a NULL, so an explicit mismatch reaches the FK and fails |
| `rota_attempt_swaps.puzzle_id` | `rota_attempts.puzzle_id` | Composite FK `(attempt_id, puzzle_id)` → `rota_attempts (attempt_id, puzzle_id)`, plus the `BEFORE INSERT` trigger `rota_attempt_swaps_fill_puzzle_id`. Both workers are then scoped to the puzzle by `(puzzle_id, worker_*_id)` → `rota_workers (puzzle_id, id)` |
| `rota_clue_never_in_rank.puzzle_id` | `rota_clues.puzzle_id` | Composite FK `(clue_id, puzzle_id)` → `rota_clues (id, puzzle_id)`, plus the `BEFORE INSERT` trigger `rota_clue_never_in_rank_fill_puzzle_id`. The worker is then scoped to the puzzle by `(puzzle_id, worker_id)` → `rota_workers (puzzle_id, id)` |
| `book_cipher_refs.text_id` | `book_cipher_puzzles.text_id` | Composite FK `(puzzle_id, text_id)` → `book_cipher_puzzles (puzzle_id, text_id)`, plus the `BEFORE INSERT` trigger `trg_book_cipher_refs_fill_text_id`. The trigger fills only a NULL, so an explicit mismatch reaches the FK and fails. The line is then scoped to the text by `(text_id, page, line)` → `book_text_lines` |
| `detective_scene_attempts.puzzle_id` | `attempts.puzzle_id` | Composite FK `(attempt_id, puzzle_id, type_key)` → `attempts (id, puzzle_id, type_key)`, where `type_key` is generated as `'detective-scene'`, plus the `BEFORE INSERT` trigger `detective_scene_attempts_fill_puzzle_id`. The trigger fills only a NULL, so an explicit mismatch reaches the FK and fails |
| `detective_scene_attempt_found.puzzle_id` | `detective_scene_attempts.puzzle_id` | Composite FK `(attempt_id, puzzle_id)` → `detective_scene_attempts (attempt_id, puzzle_id)`, plus the `BEFORE INSERT` trigger `detective_scene_attempt_found_fill_puzzle_id`. The item is then scoped to the puzzle by `(puzzle_id, position)` → `detective_scene_items (puzzle_id, position)` |
| `reverse_chess_puzzles.ply_count` (for an `initial_position` goal) | `fullmove` and `side_to_move` of the same row | The deferred constraint triggers `trg_reverse_chess_goals_initial_position_ply_count` and `trg_reverse_chess_puzzles_initial_position_ply_count`, which raise at commit when `ply_count` differs from `2 * (fullmove - 1) + (1 if Black is to move)` |
| Generated `type_key` / `kind` on subtype tables | The supertype row | `GENERATED ALWAYS AS (…) STORED` plus a composite FK |

How this looks in code:

- **Drizzle optional columns.** Trigger-filled columns are declared `.notNull().default(sql\`NULL\`)`, so Drizzle insert types treat them as optional and the trigger supplies the value before the `NOT NULL` check runs.
- **Triggers in custom migrations.** Triggers and functions live in custom SQL migrations (`drizzle-kit generate --custom --name=<name>`), one per concern. Each comes with a Vitest integration test that proves the trigger fires and the FK rejects drift.

#### 7.4.6 Code organisation and typing

- **Schema files:** core tables live in `src/db/schema/{core,progress}.ts`. Each type's tables are colocated in `src/puzzles/<type>/tables.ts` and re-exported from `src/db/schema/index.ts`. Relations are in `src/db/relations.ts` (RQBv2 `defineRelations`, using `defineRelationsPart` per type if the file grows).
- **Row schemas:** generated with `drizzle-orm/zod` (`createSelectSchema`, `createInsertSchema`, `createUpdateSchema`), and types come from those with `z.infer`. Nothing is hand-duplicated.
  - **Sign-up form:** `createInsertSchema(user, { email: z.email() }).pick({ email: true, name: true }).extend({ password: z.string().min(10) })`. The password is not a user column, because Better Auth stores it on `account`.
  - **Settings form:** `createUpdateSchema(userSettings)`.
- **Play DTO:** each type's `load.ts` assembles the client payload with one RQBv2 query. Its `payloadSchema` is composed from the generated select schemas with solution columns omitted, e.g. `z.object({ ...createSelectSchema(crosswordPuzzles).shape, cells: z.array(createSelectSchema(crosswordCells).omit({ letter: true })) })`.
- **Content and attempt schemas:** the `contentSchema` used to validate `content/` files is composed the same way from the insert schemas. Attempt state is the same again, from the `<type>_attempt*` insert schemas.
- **Arrays exist only in transit.** They appear in DTOs and content files, never in a column.
- **Data access:**
  - Play queries name their columns explicitly and never use `select *` on tables that have **(S)** columns.
  - Only `check.ts` and `load-solution.ts` (both `server-only`) read solution columns.
  - A Vitest test asserts that every type's play payload, run through `payloadSchema.strict()`, contains no solution field.
- **Stats:** streaks and stats are computed from `attempts.completed_at` in SQL views. There are no stored counters. Days are London calendar days. The current streak counts consecutive London days with at least one solve, ending on the day of the most recent solve; it stays alive until the end of the London day after that solve, and is 0 after that.

### 7.5 Environment

| Variable | Local | Vercel (Neon) |
|---|---|---|
| `DATABASE_URL` | `postgres://…@localhost:5432/ludwig` | Neon **pooled** URL (`-pooler` host), used by the app at runtime |
| `DATABASE_URL_UNPOOLED` | same as `DATABASE_URL` | Neon **direct** URL, used only by drizzle-kit migrations |
| `BETTER_AUTH_SECRET` | any random 32+ bytes | per environment, set in Vercel |
| `BETTER_AUTH_URL` | `http://localhost:3000` | production domain. On previews, derive it from `VERCEL_URL` |
| `CRON_SECRET` | optional, 16+ characters, to call the daily-gears cron route by hand | per environment, set in Vercel; Vercel cron sends it as `Authorization: Bearer`. Unset, the route returns 401 |

These are validated with Zod in `src/env.ts`. A local Postgres runs through `docker compose` (`compose.yaml` with `postgres:17`), and needs no Neon account.

### 7.6 Scripts (package.json)

`db:generate`, `db:migrate`, `db:studio`, `db:seed`, `puzzles:verify`, `puzzles:gen-gears`, `typecheck` (`tsc --noEmit`), `test`, `test:e2e`, `perf:lighthouse` (T069), `smoke` (T070), `puzzles:gears-report` (T037).

---

### 7.7 Deployment (Vercel + Neon)

**Hosting:** Vercel Hobby, which allows non-commercial use and fits this fan site.

- Fluid compute is on (the default), so function instances are reused and connection pools survive between requests.
- Next.js deploys through Vercel's own adapter, so Cache Components, `use cache`, tags and PPR work with no extra cache-handler config.

**Database:** Neon Postgres, provisioned through the Vercel Marketplace integration. The integration injects the env vars into each Vercel environment.

- Neon is plain Postgres. Drizzle and Better Auth are unchanged; only the connection URL differs from local.
- **Region:** put the Neon database and the Vercel functions in the same region (e.g. `aws-eu-west-2` London with Vercel `lhr1`). Set it with `regions` in `vercel.json`.
- **Preview branches:** the integration creates a Neon branch per preview deployment, copied from the main branch with its data and auth tables. Previews never touch production data. Branches are deleted when the git branch is deleted.
- **Free-tier note:** the database scales to zero when idle, so expect a cold start of a few hundred ms on the first query after inactivity. That is acceptable for v1.

**Connection handling:**

- Use one code path everywhere: the `pg` driver with `drizzle-orm/node-postgres`, against local Docker and Neon alike. We don't use the Neon serverless HTTP/WebSocket driver, because it can't talk to local Docker without a proxy.
- `src/db/index.ts` creates a single module-level `Pool` from `DATABASE_URL`, with a small `max` (e.g. 5) and a short `idleTimeoutMillis`. On Vercel it calls `attachDatabasePool(pool)` from `@vercel/functions`, so idle connections are released before an instance is suspended. That helper supports `pg`, which is why we use it.
- At runtime the app always goes through Neon's pooled (PgBouncer) endpoint.

**Migrations:**

- `drizzle.config.ts` reads `DATABASE_URL_UNPOOLED`, because DDL should not go through PgBouncer.
- The Vercel build command is `pnpm db:migrate && pnpm db:seed && pnpm build`. Production deploys migrate and seed the production branch, and previews migrate and seed their own Neon branch.
- Migrations must be backward-compatible with the previous deploy (add columns, then backfill, then remove later), because the old version keeps serving until the new one is live.

**Seeding:** `pnpm db:seed` runs in every Vercel build. It is an idempotent upsert of `content/` (SPEC §4.6), so content changes ship with the deploy that contains them, and nobody writes to production by hand.

**Auth on Vercel:**

- `BETTER_AUTH_URL` and `trustedOrigins` must include the production domain.
- Previews add `https://${VERCEL_URL}` dynamically, so sign-in works on preview URLs.
- The rate-limit store is the database (section 7.3), which is required on serverless.

**CI:** a GitHub Action runs typecheck, lint, Vitest and `puzzles:verify` on each PR. Vercel's git integration handles deploys. End-to-end Playwright tests run against the preview URL once it is ready.

## 8. Quality and acceptance

### 8.1 Engine tests (Vitest)

- **Gears:**
  - The mesh 2-colouring rejects odd cycles.
  - Tooth arithmetic is exact over L.
  - Facing and seeing match hand-computed fixtures.
  - The generator only emits unique-solution diagrams.
  - Fix the Diagram yields exactly one repair.
- **Reverse Chess:**
  - Retro-move application covers normal moves, uncaptures, unpromotions, en passant and castling.
  - Positions that would leave the non-moving side in check are rejected.
  - Every seeded puzzle has exactly one surviving retro move.
- **Rota:** clue predicates, swap application, and a uniqueness BFS.
- **Gear train:** mesh, collision and bolt geometry, jam detection, the minimality rule, and a uniqueness search that finds exactly one valid placement per content file.
- **Database integrity** (Vitest against local Postgres):
  - inserting a wrong-type subtype row fails;
  - a puzzle with no subtype fails at commit;
  - a puzzle's type cannot change;
  - every fill trigger in section 7.4.5 populates its column and its FK rejects drift;
  - a gear puzzle needs exactly one driver;
  - no play payload contains a solution field.
- **Every other type:** `check()` accepts the solution and rejects single-cell perturbations.

### 8.2 End-to-end (Playwright)

1. Sign up, solve a quick crossword, and see it in the Casebook.
2. Play signed out, sign up, and confirm progress is merged.
3. Solve Reverse Chess Mode A by dragging backwards and choosing an uncapture.
4. Gears: crank, scrub to the convergence, accuse, and see the success stamp.
5. Keyboard-only solve of a sudoku.

### 8.3 Brand acceptance checklist

- The wordmark reads "Ludwig." in script with a full stop, in red on paper and in ink with a splat on the dark landing.
- Every page title uses the stacked caps credits pattern.
- No rounded corners anywhere, including shadcn defaults and focus rings.
- Paper grain is visible on every surface. There are no flat whites (`#fff` is banned in tokens).
- The only accent hue is red. Blue appears only as shadow, book-blue focus rings and book covers.
- Entered letters look hand-filled in red.
- The loading state is the silhouette walker.
- Lighthouse: Performance ≥ 90 on the solve pages, and Accessibility ≥ 95.

---

## 9. Delivery plan

| Milestone | Contents |
|---|---|
| **M0 Foundations** | Tokens, fonts, textures and brand components. shadcn restyle. Drizzle schema and migrations. Better Auth email/password sign-up and sign-in, with the schema generated into Drizzle and a sign-up/sign-in end-to-end test. `proxy.ts`. Docker Postgres locally. Vercel project with Neon integration, preview branches and migrate-on-build. CI (typecheck, lint, test) |
| **M1 Framework** | Registry, solve-page chrome, `checkAnswer`/`saveState` actions, localStorage merge, Casebook basics. First types: anagram and crossword (quick style), as in `PLAN.md` |
| **M2 Reverse Chess** | Engine plus verify script. Modes A and B. Descriptive notation. Ten curated puzzles |
| **M3 Gear Puzzle** | Engine, generator, SVG board, crank, scrubber, accuse. Fix the Diagram. Twelve curated diagrams plus a daily seed |
| **M4 Library** | Cryptic crosswords (the `crossword` type's cryptic style), logic grid (with false-statement variant), knights and knaves, futoshiki, acrostic, ciphers, sightlines, CCTV maze, spot the difference, word search, odd-one-out, napkin maths. Reverse Chess Mode D (the `rota` type). Gear Puzzle Mode B (the `gear-train` type) |
| **M5 Polish** | Bullet-hole transitions, landing title sequence (scroll-driven grid rooms, walker, toppled pieces), This Week. Phones and PWA: installable PWA baseline, solve mode on touch phones, the shared on-screen keyboard for typed types, and a touch pass (T112–T117). Accessibility audit, performance pass |
| **M6 Radio Times set** (after launch) | The types from the Radio Times special (section 2.4): sudoku jigsaw and rainbow variants, chess problem, railroad, star battle, Troix, Circle9, word wheel, detective scene. The KrazyDad formats: killer and XV sudoku, nonogram, fillomino, norinori, kakuro, reflections. Deterministic seeded generators for the grid types (T099, T100) |
| **M7 Offline PWA** (after launch) | Service worker with an offline fallback, never caching session-dependent responses (T118). Native apps stay deferred (section 10, decision 7) |

---

## 10. Decisions

1. **Fonts.** Use the free look-alikes (section 6.1). There is no licensed Hummingbird or Gravesend Sans.
2. **Chess pieces.** Use the cburnett set under its licence, with attribution in the footer/about page.
3. **Content.** All cryptic clues and retro positions are original to this app.
4. **Public fan site,** non-commercial, just for fun. Branding follows the show as closely as we like, with no further licensing review.
5. **Password reset** waits for v1.1. Email verification is skipped entirely.
6. **Third-party puzzles are format references only.** We take rules and formats from the Radio Times special (section 1.2.1) and from puzzle sites such as KrazyDad, never the instances: no clue text, positions, grids, word lists or artwork. KrazyDad's terms allow reproduction only for "personal, church, school, hospital or institutional use", which a public website is not. Published puzzles may serve as engine test fixtures, because their answers are known, but never as `content/` files.
7. **Native apps are deferred.** A store app under the show's name runs into Apple 5.2.1 / 4.1(c) and Google's impersonation policy. The options are a licence from the BBC / Big Talk, a generic store app with its own identity, or web and PWA only. They stay open, and are recorded with the prerequisites and the recommended stack in `docs/research/native-app.md`. The PWA comes first (M5 baseline, M7 offline).
