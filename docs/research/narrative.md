# Narrative in the puzzles: research and proposals

Status: research, 2026-11-07. Prompted by user feedback on the Rota: "all it is doing is adding names to people but there's absolutely no narrative to it, which is what made it good in the show". This note diagnoses the gap, collects what comparable puzzle products do, and proposes changes that put the story into the play itself rather than into text nobody reads.

## 1. The gap

### 1.1 What the show does (S1E4)

- A builder, Marty Symes, dies at a construction site. It looks like an accident: a fall at a generator that had been rewired and was standing in water, with safety signs put up late and a guard rail loosened.
- The site's work-zone grid "contains exactly the same number of squares" as a chessboard. John treats the rota as a game position: "We start with the end-game and we work backwards."
- Marty was led to the generator by a chain of **supposedly impromptu rota swaps**. Each swap had an innocent excuse. Only the whole chain shows design.
- Zara "made the first move" (a favour), but she was not the killer. The killer engineered the chain so the victim ended on the live generator. The **opening gambit** is the one swap the killer insisted on.
- The case has texture the puzzle lacks: a victim who was a "joker" and a catfish, workers with grudges (Zara had dated him, Stefan was told he would be deported), a foreman who wants the police gone.

Sources: episode recaps on [whattowatch.com](https://www.whattowatch.com/features/ludwig-episode-4-recap-is-holly-pinder-good-or-bad), [reelmockery.com](https://reelmockery.com/ludwig-series-1-episode-4-recap/), [tellyvisions.org](https://tellyvisions.org/article/ludwig-season-1-episode-4-recap), [eyesonshow.com](https://www.eyesonshow.com/ludwig-season-1-episode-4-catfish-conundrum-recap/) and the Forever Dreaming transcript (SPEC §1.1). The killer's name (Gary) comes from a fan wiki and a recap, both secondary.

### 1.2 What the app does today

- `content/rota/*.ts` has workers, two placements, clues and the solution. No victim, no site, no crime, no time of day.
- The board shows tokens on a chessboard. Nothing marks where the death happened, so the final rota is not a crime scene. It is a permutation.
- Clues are abstract constraints with no speaker: "Colm never stood in a zone in row 5, at any point." "No more than 6 swaps were made."
- The hub calls it a "swapped duty roster" and explains the mechanics in four steps. The solver's one paragraph is instructions.
- The payoff is one sentence in the solved footer: "Opening gambit: Fenn insisted on it." The player has no reason to care who Fenn is or why insisting matters.
- Each unswap the player makes is the real story (who asked whom, with what excuse), but the app never says so, before or after.

The result is the Layton failure mode: a story label beside a mechanics puzzle, with nothing joining them.

### 1.3 How John works it, and what the puzzle must therefore ask

John's method in S1E4 runs across three kinds of evidence and ends on one person:

1. **Physical evidence** says it was murder and where: water on the floor, a rewired generator, signs put up late, a loosened rail, the time the footage shows.
2. **Site process** constrains the chain: the pinned rota, who may swap with whom, what the supervisor signed off.
3. **Statements** say who asked and who agreed. Each excuse is plausible on its own.
4. The chain, read forwards, shows the one swap only the killer needed. That is the accusation.

The puzzle today covers 2 and part of 3, and makes 4 a footnote. The proposals below map onto his steps: the brief carries 1, the clue voices split 1 to 3 (a site log, a site rule, a worker's statement), and R5 makes the player take step 4 instead of being told it. The chain is John's means; the person is his end. A version that stops at the chain is a permutation puzzle wearing a hard hat.

S1E1 has the same shape for the logic grid: seven suspects' statements in an interview room, "a concatenation of syllogisms, one of which will be false". John works the whole set and names the liar. L1 is that scene.

### 1.4 The same gap elsewhere

| Type | State | Gap |
|---|---|---|
| `logic-grid` | Categories are domestic (gardeners, plots, crops, tools). Clue voice is "the file puts X with Y". | S1E1 framed it as suspects, events and movements, "one of which will be false". The false-clue variant exists but reads as a technicality, not as "one witness is lying". No brief, no speakers. |
| `knights-knaves` | Characters speak in first person; `questionText` sets the scene. | Fine. The statements are the story. |
| `napkin-maths` | The napkin lines are the story ("Tab for the table by the window"). | Fine. |
| `sightlines` | Observers are unnamed facings on a grid. | S1E3 is "who could see the alcove past the pillars". Observers could be named witnesses; one line of brief would place it. Low priority. |
| `cctv-maze` | Start, exit, walls. | S2E3 is a route through Cambridge past 48 cameras. The maze is the story, so a one-line brief is enough. Low priority. |
| `odd-one-out` | Explanation arrives as the epilogue. | Fine. |
| `gears` | Victim, killer and an Accuse step (T040). | The model to copy: the answer *is* the accusation. |
| Reverse Chess A to C | Chess. | None. The show's chess is pure chess. |

## 2. What works elsewhere

### 2.1 The Case of the Golden Idol (Color Gray)

From the developers' write-up ([gamedeveloper.com](https://www.gamedeveloper.com/design/case-of-the-golden-idol)):

- The goal was for players to "feel like a detective through gameplay and not just through narrative flavor".
- Early builds had lots of optional lore and it overwhelmed testers. They kept **only content that is required for the solution or is a purposeful misdirection**. That is the rule for us: no sentence on the solve page that is neither.
- Full-sentence answers failed; a **pool of phrases dropped into slots** worked. Slots keep grammar so they are not blank guesses.
- Whole-puzzle right or wrong frustrated players; partial feedback ("two or fewer slots are incorrect") fixed it. Our `violatedClue` and `wrongParts` already do this.
- Clues chain through "thought paths": one discovery leads to the next. Where possible, several routes reach the same conclusion.
- "Given the opportunity, players will optimize the fun out of a game": design the verdict so it cannot be brute-forced.

### 2.2 Murdle (G. T. Karber)

From the published "How to Solve" chapter ([Profile Books preview](https://profilebooks.com/wp-content/uploads/wpallimport/files/PDFs/9781800818026_preview.pdf)):

- A case is four fixed pieces: a two-line setup, a **cast sheet** (each suspect has one sentence of character and a line of attributes), the locations and weapons (each with one sentence), then five to eight clues and one question: who, with what, where.
- **Descriptions double as clues.** "Dean Glaucous seemed to carry a lot of logic textbooks around" resolves because the heavy backpack's description says it carries textbooks. "The body was found next to peeling paint" resolves because Old Main's description mentions peeling paint. Karber's rule: "You don't have to make leaps of logic in these puzzles: everything you need to know clearly appears in the descriptions."
- Clues are written as observations about people, not as grid facts, even when their logical content is a plain "is not": "The suspect with the sharp pencil resented the person at Old Main."
- The **last clue is about the crime itself**, and it is what turns a filled grid into an accusation.
- After the solve there is a short scene: the accusation spoken aloud, and a two-sentence coda about what happened next.
- The whole thing fits on a two-page spread. There is no paragraph longer than four lines.

Why it beat the zebra puzzle it is built on: "the puzzle to do when you want to feel like a detective, not just solve a logic grid" ([everyclue comparison](https://everyclue.pages.dev/blog/clues-by-sam-vs-murdle/), a competitor, so partial). The cost they note is a steeper on-ramp, which argues for keeping our first puzzle in each volume short.

### 2.3 Return of the Obra Dinn (Lucas Pope)

- The answer format is **diegetic**: an insurance ledger with a name, a fate and a killer per entry. The player never fills an abstract form. ([filmstories.co.uk](https://filmstories.co.uk/?p=83249))
- Verification happens in **batches of three**, so single answers cannot be brute-forced. Critics note any batch system still leaks a little.
- The mode of death is usually easy; the hard part is who. The deduction is identity, which is also the Rota's hard part (who asked whom).

### 2.4 Puzzle hunts

Puzzled Pint's setter guidelines ([puzzledpint.org](http://puzzledpint.org/?p=1079)): flavour text sits at the top, introduces the type if needed, carries the theme, hints at the mechanism without stating it, and **bolds the words that matter**. Jay Lorch's "How to write a fun puzzle" adds "keep flavor text minimal". Hunts that run a story do it one short paragraph per puzzle, never more.

### 2.5 Professor Layton, the counter-example

Kyle Orland's critique ([gamedeveloper.com](https://www.gamedeveloper.com/game-platforms/opinion-professor-layton-and-the-unrelated-story-)): "the storyline and gameplay progress almost entirely in parallel", and "each game in the series could quite easily be split into two wholly independent parts". The puzzles that worked were the ones "actually key to helping Luke and Layton's mission". A story beside a puzzle is worse than no story.

### 2.6 Principles to carry over

1. **The board is the crime scene.** Mark the victim and the place. The player should see the problem before reading a word.
2. **Every clue has a speaker or a source.** Statements come from people, rules from the site, counts from a log. Same predicates, different voice.
3. **Descriptions can carry clue content, but nothing that only descriptions carry.** Karber's rule, plus our verifier.
4. **Text budget.** A brief is at most three lines. A statement is one line. Nothing else before the solve. Bold the words that bind to the board.
5. **The verdict is diegetic.** Name a person, not an index.
6. **The story is told by the solve, and retold once at the end.** The unswap stack is the timeline. The epilogue replays it forwards with the excuses, like John's summing-up.
7. **Keep partial feedback, and keep the answer unbrute-forceable.**

## 3. Proposals for the Rota

Numbered so tickets can reference them. R1 to R4 are one ticket; R5 is a spec change that needs the user's decision.

### R1. The case: victim, hazard zone, brief

- Content gains `victimName` (one of the workers) and `brief` (two or three lines, present tense, the incident sheet). The hazard zone is the victim's **final** square, derived, never stored.
- Tables: `rota_puzzles.victim_worker_id` (FK `(puzzle_id, worker_id)` → `rota_workers`, deferred trigger that it is a worker of this puzzle, same shape as `rota_instigator_in_first_swap`) and `rota_puzzles.brief text not null`.
- Board: the hazard zone gets a hatch or a `BulletHole`-style tear and an accessible name ("D3, where Hobb was found"); the victim's token is red-bordered and stays red wherever the player unswaps it to, so the player watches the victim being walked onto the square.
- Solver header: the brief on a `paper-sheet`, under a small caps line "Incident sheet". Three lines, hard limit enforced by the content schema (`max(280)` characters).
- The current intended-rota list ("A Bridget, D4 to C4") becomes a second small sheet titled "The rota as pinned up that morning", because that is what it is.
- Payload adds `victimWorkerId` and `brief`; neither is (S).

Example brief for `the-building-site`, where Hobb is the victim at D3 and Fenn the instigator:

> Hobb was found at the foot of the hoist in **D3** at 11:40. The generator there had been rewired and stood in a puddle. The rota pinned up at eight had him in **D2**.

### R2. Clues become statements with speakers

- `rota_clues.speaker_worker_id` (nullable, composite FK to `rota_workers`). Content gives `speakerName` where a clue is spoken. The predicate tables are unchanged.
- Rendering: a spoken clue reads as `Colm: "I never went near row 5. I don't do heights."` A site rule reads as `Site rule: swaps only with the next zone along, so the supervisor can keep track.` A log reads as `Site log: no power to G5 until eleven.` and `Supervisor: "I signed off six swaps. Not one more."`
- Weaving into play: tapping a clue highlights the speaker's token and the squares its predicate names (row 5, G5), using the same red the pencil lines use. A broken clue is labelled "Colm's statement does not hold", not "Broken".
- `puzzles:verify` requires the display text of a `never_in_rank` clue to name the rank, and of an `unpowered_square` clue to name the square, the way the logic grid verifier checks that clue text names its items. Voice is free; binding words are checked.
- Each puzzle mixes the three evidence kinds of §1.3: at least one unspoken clue (a site log or site rule) and at least one spoken statement. `verify` checks the mix so no puzzle is only statements or only rules.

### R3. The epilogue replays the chain

- `rota_solution_swaps.excuse text not null` (S). One line per swap, the reason given at the time: "Fenn asked Gwyn to take the ladder; said the height made her dizzy."
- `check` returns, for a correct answer only, an epilogue of the full forward timeline (step, two names, excuse, and what the swap achieved, derived: "Hobb is now one zone from D3") ending with the confession line: "Fenn insisted on the first swap. From there, every favour fell where she needed it." `epilogue` becomes a short structured list rather than one string (the solve chrome's footer renders a `<ol>` when it gets one). This is John's summing-up to the crew: the chain read forwards as design.
- The pencil-line step numbers become times when the content gives a `startTime` and an interval. Optional; cheap once R1 exists.

### R4. Content rewrite

- The five existing files gain victim, brief, speakers and excuses. The puzzles' logic does not change, so attempts stay valid.
- Hub copy: "Unpick a swapped duty roster" becomes the case framing in one line: "A worker died in the wrong zone. Work the swaps backwards to find who put them there." The mode tagline quotes John, as the gears intro card does: _"We start with the end-game and we work backwards."_
- The solver's instruction paragraph moves to a collapsible "How to play" so the sheet is the first thing read.

### R5. Accuse the instigator (spec change)

Today the instigator is revealed, not asked, "because no clue could decide it" (SPEC §5.1 Mode D). Murdle and Obra Dinn both show the accusation is the payoff, the gears already have an Accuse step, and §1.3 shows it is the step John's method ends on. The show's own shape is two people in the first swap: one made the first move innocently (Zara), one insisted (the killer). A decidable version:

- New clue kind `not_instigator(worker)`: "Gwyn: 'I didn't ask for the swap. Fenn did.'" or, weaker and better, "Gwyn: 'I never ask for swaps. People ask me.'" The predicate: `worker` is not the instigator. Table `rota_clue_not_instigator(clue_id, worker_id)`, pinned by `(clue_id, kind)` like the others.
- After the rota is restored, the solver asks "Who insisted on the first swap?" with the two workers of step 1 as the only options. The answer gains `instigatorWorkerId`; `check` requires it to equal the stored one; `verify` requires that the clues exclude exactly one of the two.
- Two options is thin, but the gears' Accuse has the same shape and the wrong guess costs a failed check. Keep it one shot per check, as now.
- Trade-off: it reopens `rota_attempts` to store the choice (T132 and T141 removed exactly that column), and every content file needs one more clue. The reward is that the puzzle ends on a verdict instead of a footnote.

Recommendation (revised 2026-11-07 after the user asked whether the proposals follow John's method): build R1 to R5 in one ticket. Without R5 the chain is the answer, and in the show the chain is only how John gets to the answer.

## 4. Proposals for the logic grid

### L1. Witness voice and "name the liar"

- `logic_grid_clues.speaker_item_id` (nullable, FK `(puzzle_id, item_id)` → `logic_grid_items`, with a trigger that the speaker is in the first category). Content gives `speaker` by label.
- A spoken clue renders as `Hettie: "I had the rake, and I was at the compost end."` The false-clue variant becomes what S1E1 said it was: "a concatenation of syllogisms, one of which will be false". The flag reads "Name the liar", and the chrome's label for the flagged clue says whose statement it is.
- The verifier already requires clue text to name every item of its rule and to read with its polarity. A spoken clue's speaker counts as naming that item, so "I had the rake" is allowed when the speaker is Hettie.

### L2. Brief and cast sheet

- `logic_grid_puzzles.brief text not null`, two lines, shown on a paper sheet above the grid.
- Categories lean to who, where, what and when, as in Murdle and S1E1 (suspects, events, movements), without making every puzzle a murder: a missing ledger, a swapped parcel, a late train.
- Item descriptions as clue carriers (Karber's peeling paint) would need a `description` column and a looser verifier. Not now; revisit if L1 lands well.

### L3. Content rewrite

The five files get a brief, speakers on most clues, and clue text rewritten in voice. Rules are unchanged, so attempt marks stay valid.

## 5. Small briefs elsewhere

- `sightlines`: name each observer (a `name` column on observers) and one line of brief: "Three people say they saw the alcove. Mark every square none of them could see." The answer is unchanged.
- `cctv-maze`: a one-line brief per puzzle. No schema beyond `brief`.
- Everything else is left alone.

## 6. What not to do

- No prose above three lines anywhere on a solve page.
- No per-step story reveals during the solve. Confirming a step's excuse confirms the step, which leaks the solution. Excuses arrive only in the epilogue.
- No worker descriptions that carry clue content the predicates do not. The verifier cannot check them and the player cannot trust them.
- No narrative on the chess modes.

## 7. Suggested tickets

Status 2026-11-07: T164 (R1 to R5) is built. The summing-up is a list rendered under the stamp, and the instigator is an accusation backed by the `not_instigator` clue. Optional step times (R3) are left for after the user plays it.

| Ticket | Scope | Mig | Depends on |
|---|---|---|---|
| T164 Rota: the case | R1 to R5. Tables, schema, new clue kind, verify, board, solver, accuse step, epilogue list, hub copy, five content files, e2e update | ✔ | T063 |
| T165 Logic grid: witness voice | L1, L2, L3 | ✔ | T048 |
| T166 Briefs for sightlines and the CCTV maze | §5 | ✔ | T059, T060 |

Each content change runs `pnpm puzzles:verify`; each schema change runs `db:generate`, `db:migrate`, `pnpm test`. SPEC §5.1 Mode D, §7.4.4 (rota, logic-grid) and the `logic-grid` row of §2.3 are updated in the same PRs.
