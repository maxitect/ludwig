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
- Radio Times _Ludwig Puzzle Special_.
- win-vector.com on the S1E4 chess position.

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
| S2E2 | **Gear puzzle** | A cèilidh diagram: dancers are gears that "rotate AND move in and out". Each has a field of vision marked with Xs. There are eight convergences. It is "100% solvable if we adjust a couple of the starting positions". Lucy names it "Slidey Circles" | **Headline feature B** |
| S2E3 | Maze | The Cambridge street maze overlaid with the sightlines of 48 CCTV cameras. Also: "don't let him fob me off with a word search" | CCTV maze. Word search included as a deliberately jokey filler type |
| S2E4 | "Knight's Path" | A coded phrase that turns out to be a street name | Folded into the cipher set |
| S2E5 | Napkin maths | "Not a code… shorthand" | Arithmetic deduction puzzles |
| S2E6 | Pictogram cipher | From an early self-published Ludwig book. A stick figure with an eyeball head is "E" | Pictogram substitution cipher |

The Radio Times special also used **sudoku, futoshiki, odd-one-out** and a **chess problem**, so those count as on-brand.

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
- Native apps (the web app must still be responsive and touch-friendly)
- Monetisation
- OAuth providers
- Email verification (skipped entirely, with no plans for it)
- Password reset by email (v1.1)

### 2.3 Puzzle catalogue (v1)

| Category | Type key | Notes |
|---|---|---|
| **Flagship** | `reverse-chess` | Modes A and B (section 5.1) |
| **Flagship** | `rota` | Reverse Chess Mode C. It is a separate type because it shares no data shape with chess, and it is presented inside the Reverse Chess hub (section 5.1) |
| **Flagship** | `gears` | Engine-driven, generated plus curated (section 5.2) |
| Word | `crossword` | One type with a `style` of `cryptic` (13×13 or 15×15) or `quick` (11×11). They share every table. Both have original clues, checking and reveal. The UI shows them as "Cryptic" and "Quick" shelves |
| Word | `anagram` | Single words and phrase anagrams, letter-tile UI |
| Word | `word-ladder` | Change one letter per rung |
| Word | `acrostic` | Find the hidden message (S1E1) |
| Word | `word-search` | Labelled "The Fob-Off" in the UI as an in-joke (S2E3) |
| Logic | `logic-grid` | Classic grid, plus a "one statement is false" variant (S1E1) |
| Logic | `knights-knaves` | Truth-teller/liar puzzles (S2E1) |
| Logic | `sudoku` | 9×9 |
| Logic | `futoshiki` | 5×5 with inequalities |
| Logic | `odd-one-out` | Four or five items |
| Spatial | `sightlines` | Grid with pillars and observers. Mark the blind spots (S1E3) |
| Spatial | `cctv-maze` | Reach the exit without entering any camera's view cone (S2E3). Shares the `visibility.ts` engine (grid line of sight, view cones, obstacles) with `sightlines` |
| Spatial | `spot-difference` | Two SVG scenes generated with N seeded differences (S1E2) |
| Cipher | `book-cipher` | page:line:word references into a public-domain text in the app (S1E6) |
| Cipher | `pictogram-cipher` | Stick-figure substitution alphabet (S2E6) |
| Cipher | `caesar` / `keyword` | Grouped with the other ciphers under "James's Notebooks" |
| Numbers | `napkin-maths` | Deduction from partial working (S2E5) |

**Authoring rule (Mr Todd's principle).** Every puzzle has exactly one solution, verified by a solver at authoring time. The one exception is the word ladder (section 7.4.4). Each one should be built "from the solution backwards, with false paths layered in".

---

## 3. Information architecture

```
/                          Title-sequence landing (signed out) / Desk (signed in)
/sign-in  /sign-up
/puzzles                   The Collection: all categories
/puzzles/[type]            Category index (volumes, difficulty filter)
/puzzles/[type]/[slug]     Solve page
/reverse-chess             Flagship hub (modes, intro "how it works")
/gears                     Flagship hub (curated diagrams, daily diagram)
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
  - The whole-grid `check` still returns `{ correct }` only. `cellsWrong` is not part of the contract.
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
- **Actions:** Check, Reveal (with a confirm dialog) and Reset. Reset clears the board and, when signed in, deletes the saved attempt state (`clearState`), so a reload after Reset starts empty.
- **On completion:** a red handwritten "Solved." stamp in the hand font, the time, and a "Next in volume" link.

### 4.6 Content as code

- **Where puzzles live.** Curated puzzles are TypeScript files in `content/<type>/<slug>.ts`. Each one exports `{ meta, content }`, typed and validated by that type's `contentSchema`, which is composed from the insert schemas (section 7.4.6).
- **Verification.** `pnpm puzzles:verify` runs in CI. For every file it parses the schema, runs `derive.ts`, and runs the type's solver or uniqueness check (the word ladder checks validity only).
- **Seeding.** `pnpm db:seed` upserts by `(type_key, slug)`. Each puzzle's supertype, subtype and child rows are written in a single transaction, so the deferred subtype trigger (section 7.4.2) passes. Content is updated in place by natural key (upsert, then delete only the child rows the file no longer contains), so content row ids such as gears and rota workers are stable and `db:seed` never writes a `*_attempt*` table. A content change that removes a row attempt data references fails the seed for that puzzle with an error naming it, and that puzzle is left unchanged. Puzzles whose file is gone are removed.
- **Generated content.** Gears and spot-difference puzzles are produced by scripts and materialised through the same seeding path.
- **What this gives us.** Reviewable diffs, git history and rollbacks for content. Every Neon preview branch also gets real content.

---

## 5. Flagship puzzles

### 5.1 Reverse Chess

The tagline, from the show: _"Instead of having to work out what comes next, you deduce what came before."_ There are three modes.

#### Mode A: "The Last Move" (single retro move)

**Prompt:** a position with side-to-move. It is stored as one row per piece plus scalar castling and en passant columns, and the FEN for `chess.js` is derived in `derive.ts`. The question is "What was the last move?"

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

The position is given and the player must take back **N** half-moves (N = 2–6) to reach a stated earlier position or condition, for example "before the bishop was captured" or "the moment White last castled".

- **The goal is data, not prose.** Each Mode B puzzle has exactly one goal: a predicate on the position reached after the N-th retro move, stored as one row in `reverse_chess_goals` (a `retro_goal_kind` plus the display text shown to the player) and one row in the subtype table for that kind. The kinds are:
  - `piece_on_square`: a piece of a colour and type stands on a square ("before the black pawn left a7");
  - `castling_right`: a colour can still castle on a side ("the moment White last castled");
  - `piece_count`: a colour has exactly this many pieces of a type ("before the bishop was captured").
- **Entry.** The player builds the chain one retro move at a time, as in Mode A (drag a piece backwards, choose the uncaptured piece, toggle Unpromote or En passant). A king dropped two files from its home square is read as a castling un-move, so castling needs no control. The list shows each take-back as the forward move it undoes. Undo removes the last move.
- **Checking.** Wrong steps are allowed until Check is pressed, which flags the first invalid step. An answer is correct when it has exactly N plies, each is a legal retro move on the previous prior position (including the Mode A material rules), and the final prior position satisfies the goal. The authored chain is not compared: any chain that does this is accepted.
- **Authoring (`pnpm puzzles:verify`).** Exactly one chain of N retro moves may reach the goal, and it must be the authored one. The verifier searches every chain of N enumerated retro moves, so N is bounded in practice by how many retro moves each position has.
- A **descriptive notation** toggle shows the move list in old notation ("N–Q1"), as in the Henry scene. It is a user setting (`user_settings.chess_notation`) with algebraic as the default. Signed-in players save it to their settings, and signed-out players keep it in `localStorage`. Notation is derived from the forward move and the position before it (`derive.ts`): files are named after the piece that starts on them (QR, QN, QB, Q, K, KB, KN, KR), ranks count from the mover's own back rank, captures name the captured piece (`PxP`), and the origin square is added only when two pieces would otherwise read the same (`R(KR1)-Q1`).

#### Mode C: "The Rota" (S1E4 case-style)

This mode is non-chess retro deduction on an 8×8 site grid. The board is drawn as a chessboard of numbered work zones, with labels A–H and 1–8.

**Payload:**

- the final positions of 6–10 named workers (tokens);
- their **intended** rota positions;
- 4–8 clue statements, for example "G5 had no power all morning", "Only adjacent zones can swap", "Ojay never worked a zone in row 1", "Each worker swapped at most once".

**Goal:** reconstruct the **ordered sequence of swaps**, backwards from the final state, that turns the intended rota into the final state, and identify the **opening gambit**: the first swap and the worker who instigated it.

**UI:** drag two tokens to "unswap" them. Each unswap pushes a step onto a visible stack, drawn as a red pencil line between the cells. Undo pops a step.

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

Layout: gears sit on distinct slots; the spin sign is the slot parity, so every mesh joins slots an odd number apart. Meshes are ring edges (adjacent slots) plus the fewest, shortest, non-crossing chords that connect the gears. Presets (`presets.ts`) use 12 slots and the teeth 8 and 16 with an odd gear count, the sizes that the covering step was measured to handle; see the ticket report.

Curated diagrams live in the DB like any other puzzle. Generated ones are materialised into `puzzles`, `gear_puzzles` and their child tables by a script, so checking stays server-side.

**Daily diagrams (T036).** `pnpm puzzles:gen-gears --from YYYY-MM-DD --days N [--difficulty-cycle easy,medium,hard,expert]` generates with `seed = date`, writes slug `daily-<date>` through the seed module's per-puzzle transaction (`upsertPuzzle`) and links it in `gear_daily` in the same transaction. Daily puzzles belong to no volume, have `published_at` at the start of that date in `Europe/London` (future dailies stay hidden), and their difficulty column is the preset index plus 2 (easy 2 to expert 5). `db:seed` never removes a puzzle linked in `gear_daily`; any other puzzle without a content file is removed. A date that already has a `gear_daily` row is skipped, so a published daily never changes. `puzzles:verify` also re-solves every `gear_daily` puzzle in the database and compares it with its stored solution.

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
| `--grid-blue` | `#004060` | The "tear-through" blue grid revealed under bullet holes, focus rings |
| `--book-blue` | `#3A7FB0` | Pocket Puzzle Collection covers (volume cards) |

**shadcn mapping (light / "Paper"):**

- `background` → paper, `foreground` → ink
- `card` → paper with a texture overlay
- `primary` → ludwig-red, `primary-foreground` → paper
- `secondary` → ink, `secondary-foreground` → paper
- `muted` → paper-shade, `accent` → book-blue
- `destructive` → blood
- `border` → ink at 100% (2px), `input` → ink, `ring` → grid-blue

**Dark theme ("Ink", modelled on the title card):**

- `background` → `#0A0B0D` with grain, `foreground` → paper
- `card` → shadow `#1E2B3B`
- `primary` → ludwig-red (unchanged), `border` → paper at 60%

All text and background pairs must pass WCAG AA. Red on paper (`#C40C12` on `#E9E4DE`) is about 5:1, so it passes for text. Crayon is used only at large sizes.

### 6.3 Texture and motifs

- **Paper grain.** A single tiled noise PNG of about 512px, kept under 40 KB and generated once from an SVG `feTurbulence`. It is applied through a `body::before` overlay with `mix-blend-mode: multiply` at around 0.35 opacity. It is never a live SVG filter, for performance.
- **Raking light.** An optional `.raking` utility adds a large diagonal linear-gradient of blue-grey shadow stripes at low opacity, used on hero sections and the landing page.
- **Grid paper.** The `.grid-paper` background is a CSS `background-image` of dot-and-cross (·×) on a 24px pitch, used on the Casebook and in scratch areas.
- **Crossword cells everywhere.** Square corners (`--radius: 0`), 2px ink borders, and small superscript clue numbers on cards and buttons where they make sense.
- **Red hand-filled letters.** Letters the user enters in grids render in `--font-hand` and `--crayon`/`--ludwig-red`, with a ±2° random rotation per cell seeded by its index for stable SSR.
- **Ink splat.** An SVG asset placed behind the wordmark on the landing hero and the sign-in card.
- **Silhouette walker.** A small black SVG figure that walks across grid cells. It is used as the **loading indicator** (`loading.tsx` / Suspense fallbacks) and on empty states.
- **White chess pieces.** Large, with long blue shadows, used as decorative elements on the landing page and the Reverse Chess hub.
- **Bullet-hole transition.** On puzzle completion, and as the landing-to-app route transition, a torn circular hole expands to reveal the blue grid. This uses the View Transitions API through Next's view-transition support, with `prefers-reduced-motion` falling back to a fade.
- **Mirrored digits.** Sudoku decorative backgrounds use `scale-x-[-1]` digits, as in the titles.

### 6.4 Component customisation (shadcn)

Install components with `pnpm dlx shadcn@latest add …`, then restyle them in place. The likely set is: button, input, label, card, dialog, alert-dialog, dropdown-menu, tabs, toggle-group, slider, tooltip, sonner, form, sheet, badge, progress, separator and skeleton.

| Component | Ludwig treatment |
|---|---|
| Button (primary) | Red fill, paper text, Josefin 700 caps, 0 radius, 2px ink border, 3px hard offset shadow in `--shadow` that collapses on press |
| Button (secondary) | Paper fill, ink border, ink text. Hover inverts to an ink fill (a "black square") |
| Input | Bottom-border-only "answer line", or a cell variant (`<CellInput>`): one square per letter, handwritten red entry |
| Card | Paper with grain, 2px ink border. Optional clue number in the top-left corner. Volume cards styled as Pocket Puzzle Collection covers (book-blue, white signature, pale caps band) |
| Dialog | A paper sheet with a slight rotation (−0.5°) and a long blue drop shadow, like a page laid on a desk |
| Tabs / ToggleGroup | Rows of crossword cells; the active cell is ink-filled |
| Slider | A thin ink rail with a cog thumb (reused in the gear crank) |
| Toast (sonner) | Paper slips with a red pencil underline |
| Skeleton | Grey grid cells with a silhouette walker |
| Badge (difficulty) | 1–5 cells, filled ink |

### 6.5 Icons

- **Lucide** (`lucide-react`, ISC): the shadcn default, used for general UI such as search, pencil, eraser, undo, settings, timer, check, eye, lightbulb and grid.
- **Tabler Icons** (`@tabler/icons-react`, MIT): used for chess glyphs in UI chrome (`IconChessKing`, `IconChessQueen`, `IconChessKnight`, `IconChessBishop`, `IconChessRook`, `IconChess`) and cog/gear variants. Lucide's chess coverage is thin.
- **Board pieces:** a dedicated SVG set restyled white with ink outlines. cburnett (Lichess) is GPL-2.0+/CC BY-SA, so it needs attribution and may have copyleft implications. If that is a problem, the alternatives are commissioned or self-drawn pieces. A decision is needed (see section 10).
- Phosphor and game-icons.net are **not** used in v1. A single primary icon set keeps the style consistent, and game-icons needs CC BY attribution.
- Icon stroke is 2px to match the borders, and icons are always ink or paper, never red unless they are active.

### 6.6 Motion

- Use the `motion` package (Framer Motion's successor) for the gear animation and the solved stamp.
- Use CSS transitions for everything else.
- Every animation respects `prefers-reduced-motion`.

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
  words.txt                         word-ladder dictionary (one word per line, seeded into words)
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
| **reverse-chess** (Modes A and B) | `reverse_chess_puzzles`: mode `retro_mode`('last_move','unwind'), side_to_move, four castling-right bools, en_passant_file `chess_file` null, halfmove smallint, fullmove smallint, ply_count smallint<br>`reverse_chess_goals` **(S)** (Mode B only, `display_text` is shown to the player): puzzle_id pk, kind `retro_goal_kind`('piece_on_square','castling_right','piece_count'), display_text. Unique `(puzzle_id, kind)`<br>`reverse_chess_goal_piece_on_square`, `reverse_chess_goal_castling_right`, `reverse_chess_goal_piece_count` **(S)**: puzzle_id pk, kind (generated, fixed per table). FK `(puzzle_id, kind)` to `reverse_chess_goals`, so a goal can only have the subtype row of its own kind. Columns: colour with piece, file and rank (1–8); colour with side `retro_castle_side`('kingside','queenside'); colour with piece and count (0–10). A deferred trigger requires the subtype row of the goal's kind, and another requires a goal exactly when mode is 'unwind'<br>`reverse_chess_pieces`: (puzzle_id, file `chess_file`, rank 1–8) pk, colour, piece `chess_piece`<br>`reverse_chess_solution_plies` **(S)**: (puzzle_id, ply) pk, from_file, from_rank, to_file, to_rank, uncapture `chess_piece` null, unpromote bool, special `retro_special`('none','en_passant','castle') | `reverse_chess_attempt_plies`, mirroring the solution plies |
| **rota** (Reverse Chess Mode C, its own type) | `rota_puzzles`<br>`rota_workers`: id, puzzle_id, name, unique (puzzle_id, name)<br>`rota_worker_squares`: (puzzle_id, worker_id, phase `rota_phase`('intended','final')) pk, file, rank 1–8, unique (puzzle_id, phase, file, rank) so no two workers share a zone in one phase. `puzzle_id` is part of that candidate key, so it is not redundancy<br>`rota_clues`: id, puzzle_id, position, kind `rota_clue_kind`('unpowered_square','adjacent_only','never_in_rank','max_swaps'), display_text. The deferred constraint trigger `rota_clues_require_subtype` requires a subtype row for every kind except `adjacent_only`<br>One subtype table per parameterised clue kind, pinned by a generated `kind` and composite FK (clue_id, kind) → `rota_clues` (id, kind): `rota_clue_unpowered_square`(clue_id, file, rank), `rota_clue_never_in_rank`(clue_id, worker_id, rank), `rota_clue_max_swaps`(clue_id, max_swaps smallint)<br>`rota_solution_swaps` **(S)**: (puzzle_id, step) pk, worker_a_id, worker_b_id<br>`rota_solutions` **(S)**: puzzle_id pk, instigator_worker_id. The deferred constraint trigger `rota_instigator_in_first_swap` requires the instigator to be one of the two workers of step 1<br>Every worker reference is a composite FK (puzzle_id, worker_id) → `rota_workers` (puzzle_id, id) | `rota_attempts`: instigator_worker_id null<br>`rota_attempt_swaps`, mirroring the solution swaps |
| **gears** | `gear_puzzles`: slot_count, m_in, m_out, max_adjustments smallint (0 = normal), occlusion bool, generator_seed text null (provenance only)<br>`gear_puzzle_gears`: id, puzzle_id, label, teeth smallint check (8, 12, 16, 24), start_slot, initial_offset, half_width_deg, is_driver bool. Partial unique index on (puzzle_id) where is_driver, plus a deferred constraint trigger requiring exactly one driver<br>`gear_meshes`: (puzzle_id, gear_a_id, gear_b_id) pk, check (gear_a_id < gear_b_id), both FKs composite (puzzle_id, id)<br>`gear_solutions` **(S)**: puzzle_id pk, crank, convergence 1–8, killer_gear_id<br>`gear_solution_swaps` **(S)**: (puzzle_id, gear_a_id, gear_b_id)<br>`gear_daily`: date pk, puzzle_id unique | `gear_attempts`: crank, convergence null, accused_gear_id null<br>`gear_attempt_swaps` |
| **crossword** (cryptic and quick merged, see section 2.3) | `crossword_puzzles`: style `crossword_style`('cryptic','quick'), rows, cols<br>`crossword_cells`: (puzzle_id, row, col) pk, letter char(1) **(S)**, upper-case A to Z. Blocks are the absence of a row<br>`crossword_clues`: (puzzle_id, direction `clue_direction`('across','down'), row, col) pk, clue_text. FK to the start cell<br>`crossword_clue_segments`: (puzzle_id, direction, row, col, position) pk, length, separator `segment_separator`('word','hyphen'), the break after the segment. These give the "(4,3)" or "(5-4)" enumeration. A deferred trigger rejects a separator on the last segment of a clue; null before the last reads as a word break. Content states `separators` only for hyphens | `crossword_attempts`: puzzle_id (redundant, section 7.4.5)<br>`crossword_attempt_cells`: (attempt_id, row, col) pk, puzzle_id (redundant, section 7.4.5), letter char(1). FK `(puzzle_id, row, col)` → `crossword_cells`, so an entry can only sit on a cell of its own puzzle. That FK is `DEFERRABLE INITIALLY DEFERRED` with no cascade, so a content edit that removes a filled cell fails the seed at commit instead of deleting saved letters |
| **anagram** | `anagram_puzzles`: answer **(S)**, definition_hint null, scramble_seed. Tiles are derived from the answer and seed | `anagram_attempts`: answer text null |
| **word-ladder** | `words`: word pk (dictionary lookup)<br>`word_ladder_puzzles`: start_word fk→words, end_word fk→words, rung_count<br>`word_ladder_solution_rungs` **(S)**: (puzzle_id, position) pk, word fk→words (a reference ladder) | `word_ladder_attempt_rungs` |
| **acrostic** | `acrostic_puzzles`: rule `acrostic_rule`('first_letter_line','first_letter_word','last_letter_line')<br>`acrostic_lines`: (puzzle_id, position) pk, content | `acrostic_attempts`: answer null |
| **word-search** | `word_search_puzzles`: rows, cols<br>`word_search_cells`: (puzzle_id, row, col) pk, letter<br>`word_search_words`: (puzzle_id, word) pk | `word_search_attempt_found`: (attempt_id, word) pk |
| **logic-grid** | `logic_grid_puzzles`<br>`logic_grid_categories`: (puzzle_id, position) pk, name<br>`logic_grid_items`: id, puzzle_id, category_position, position, label<br>`logic_grid_clues`: (puzzle_id, position) pk, content, is_false bool **(S)**. The variant is derived as "any clue is false"<br>`logic_grid_solution_links` **(S)**: (puzzle_id, item_a_id, item_b_id) pk | `logic_grid_attempt_marks`: (attempt_id, item_a_id, item_b_id) pk, mark `grid_mark`('yes','no') |
| **knights-knaves** | `knights_knaves_puzzles`: question_text<br>`knights_knaves_characters`: (puzzle_id, position) pk, name, role `kk_role`('knight','knave') **(S)**<br>`knights_knaves_statements`: (puzzle_id, character_position, position) pk, content | `knights_knaves_attempt_roles` |
| **sudoku** | `sudoku_puzzles`<br>`sudoku_givens`: (puzzle_id, row, col) pk, digit 1–9 | `sudoku_attempt_cells`: (attempt_id, row, col) pk, digit, plus `sudoku_attempt_notes`: (attempt_id, row, col, digit) pk for pencil marks |
| **futoshiki** | `futoshiki_puzzles`: size<br>`futoshiki_givens`<br>`futoshiki_inequalities`: (puzzle_id, row, col, direction `ineq_direction`('right','down')) pk, relation `ineq_relation`('lt','gt') | `futoshiki_attempt_cells`, `futoshiki_attempt_notes` |
| **odd-one-out** | `odd_one_out_puzzles`: prompt_text<br>`odd_one_out_items`: (puzzle_id, position) pk, label<br>`odd_one_out_solutions` **(S)**: puzzle_id pk, item_position, explanation | `odd_one_out_attempts`: item_position null |
| **sightlines** | `sightlines_puzzles`: rows, cols, target_row, target_col<br>`sightlines_obstacles`: (puzzle_id, row, col) pk<br>`sightlines_observers`: (puzzle_id, row, col) pk, facing compass8, fov_deg | `sightlines_attempt_marks`: (attempt_id, row, col) pk |
| **cctv-maze** | `cctv_maze_puzzles`: rows, cols, start_row, start_col, exit_row, exit_col<br>`cctv_maze_walls`: (puzzle_id, row, col, side `wall_side`('north','west')) pk<br>`cctv_maze_cameras`: (puzzle_id, row, col) pk, facing compass8, fov_deg, range_cells | `cctv_maze_attempt_steps`: (attempt_id, step) pk, row, col |
| **spot-difference** | `spot_difference_puzzles`: scene_seed **(S)**, difference_count 1 to 15, generator_version smallint ≥ 1 **(S)**. The scenes and differences are derived from these. `load.ts` returns the two derived scene trees and never the seed, version or any region | `spot_difference_attempts`<br>`spot_difference_attempt_found`: (attempt_id, difference_index) pk, difference_index 0 to 14. The index names a derived difference, not a content row, so it has no FK to the puzzle and needs no redundant `puzzle_id`. Triggers reject a found index at or above the puzzle's `difference_count`, and lowering a count below an index already found |
| **book-cipher** | `book_texts`: id, slug, title, author<br>`book_text_lines`: (text_id, page, line) pk, content<br>`book_cipher_puzzles`: text_id fk<br>`book_cipher_refs`: (puzzle_id, position) pk, text_id (scoped), page, line, word_index | `book_cipher_attempts`: answer null |
| **pictogram-cipher** | `pictogram_glyphs` (lookup): id pk, asset_key unique, letter char(1) unique **(S)**<br>`pictogram_cipher_puzzles`<br>`pictogram_cipher_symbols`: (puzzle_id, word_index, position) pk, glyph_id<br>`pictogram_cipher_given_glyphs`: (puzzle_id, glyph_id) pk | `pictogram_cipher_attempt_guesses`: (attempt_id, glyph_id) pk, letter |
| **caesar** | `caesar_puzzles`: plaintext **(S)**, shift 1–25 **(S)**. The ciphertext is derived | `caesar_attempts`: answer null |
| **keyword** | `keyword_puzzles`: plaintext **(S)**, keyword **(S)** | `keyword_attempts`: answer null |
| **napkin-maths** | `napkin_maths_puzzles`: question_text, answer numeric **(S)**<br>`napkin_maths_lines`: (puzzle_id, position) pk, content | `napkin_maths_attempts`: answer numeric null |

**Uniqueness exception.** A word ladder accepts **any** valid ladder of `rung_count` rungs that uses dictionary words. The stored ladder is only a reference. Every other type keeps the exactly-one-solution rule.

#### 7.4.5 Controlled redundancy (complete list)

| Column | Redundant with | Kept consistent by |
|---|---|---|
| `attempts.type_key` | `puzzles.type_key` through `puzzle_id` | Composite FK `(puzzle_id, type_key)` → `puzzles`, plus the `BEFORE INSERT OR UPDATE OF puzzle_id` trigger `attempts_fill_type_key` |
| `puzzle_id` on attempt rows that reference puzzle children (the general rule; each case has its own row below) | `attempts.puzzle_id` | The attempt subtype FKs `(attempt_id, puzzle_id, type_key)` → `attempts (id, puzzle_id, type_key)`, since `attempts` has no unique `(id, puzzle_id)`; its children FK `(attempt_id, puzzle_id)` → the subtype. Each column has a `BEFORE INSERT` fill trigger |
| `gear_attempts.puzzle_id` | `attempts.puzzle_id` | Composite FK `(attempt_id, puzzle_id, type_key)` → `attempts (id, puzzle_id, type_key)`, where `type_key` is generated as `'gears'`, plus the `BEFORE INSERT` trigger `gear_attempts_fill_puzzle_id`. The trigger fills only a NULL, so an explicit mismatch reaches the FK and fails |
| `gear_attempt_swaps.puzzle_id` | `gear_attempts.puzzle_id` | Composite FK `(attempt_id, puzzle_id)` → `gear_attempts (attempt_id, puzzle_id)`, plus the `BEFORE INSERT` trigger `gear_attempt_swaps_fill_puzzle_id`. Both gears are then scoped to the puzzle by `(puzzle_id, gear_*_id)` → `gear_puzzle_gears (puzzle_id, id)` |
| `crossword_attempts.puzzle_id` | `attempts.puzzle_id` | Composite FK `(attempt_id, puzzle_id, type_key)` → `attempts (id, puzzle_id, type_key)`, where `type_key` is generated as `'crossword'`, plus the `BEFORE INSERT` trigger `crossword_attempts_fill_puzzle_id`. The trigger fills only a NULL, so an explicit mismatch reaches the FK and fails |
| `crossword_attempt_cells.puzzle_id` | `crossword_attempts.puzzle_id` | Composite FK `(attempt_id, puzzle_id)` → `crossword_attempts (attempt_id, puzzle_id)`, plus the `BEFORE INSERT` trigger `crossword_attempt_cells_fill_puzzle_id`. The cell is then scoped to the puzzle by `(puzzle_id, row, col)` → `crossword_cells (puzzle_id, row, col)` |
| `rota_attempts.puzzle_id` | `attempts.puzzle_id` | Composite FK `(attempt_id, puzzle_id, type_key)` → `attempts (id, puzzle_id, type_key)`, where `type_key` is generated as `'rota'`, plus the `BEFORE INSERT` trigger `rota_attempts_fill_puzzle_id`. The trigger fills only a NULL, so an explicit mismatch reaches the FK and fails |
| `rota_attempt_swaps.puzzle_id` | `rota_attempts.puzzle_id` | Composite FK `(attempt_id, puzzle_id)` → `rota_attempts (attempt_id, puzzle_id)`, plus the `BEFORE INSERT` trigger `rota_attempt_swaps_fill_puzzle_id`. Both workers are then scoped to the puzzle by `(puzzle_id, worker_*_id)` → `rota_workers (puzzle_id, id)` |
| `rota_clue_never_in_rank.puzzle_id` | `rota_clues.puzzle_id` | Composite FK `(clue_id, puzzle_id)` → `rota_clues (id, puzzle_id)`, plus the `BEFORE INSERT` trigger `rota_clue_never_in_rank_fill_puzzle_id`. The worker is then scoped to the puzzle by `(puzzle_id, worker_id)` → `rota_workers (puzzle_id, id)` |
| `book_cipher_refs.text_id` | `book_cipher_puzzles.text_id` | Composite FK `(puzzle_id, text_id)` → `book_cipher_puzzles`, plus a fill trigger |
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
- The only accent hue is red. Blue appears only as shadow, grid-blue focus and book covers.
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
| **M4 Library** | Cryptic crosswords (the `crossword` type's cryptic style), logic grid (with false-statement variant), knights and knaves, futoshiki, acrostic, ciphers, sightlines, CCTV maze, spot the difference, word search, odd-one-out, napkin maths. Reverse Chess Mode C (the `rota` type) |
| **M5 Polish** | Bullet-hole transitions, landing title sequence (scroll-driven grid rooms, walker, toppled pieces), This Week, accessibility audit, performance pass |

---

## 10. Decisions

1. **Fonts.** Use the free look-alikes (section 6.1). There is no licensed Hummingbird or Gravesend Sans.
2. **Chess pieces.** Use the cburnett set under its licence, with attribution in the footer/about page.
3. **Content.** All cryptic clues and retro positions are original to this app.
4. **Public fan site,** non-commercial, just for fun. Branding follows the show as closely as we like, with no further licensing review.
5. **Password reset** waits for v1.1. Email verification is skipped entirely.
