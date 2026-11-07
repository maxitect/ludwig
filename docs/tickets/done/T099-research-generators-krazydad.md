---
id: T099
title: "Research: puzzle generation and grading, KrazyDad's blog against our pipeline"
milestone: M6
epic: E11
depends_on: []
migrations: false
requires_human: false
spec: ["SPEC §1.1 (KrazyDad)", "SPEC §2.3 (authoring rule)", "SPEC §4.6", "SPEC §5.2.3", "SPEC §10 (decision 6)", "PLAN §3 M6 (Generators)", "PLAN §5.4", "PLAN §7 (content risk)"]
skills: []
---

# T099: Research: puzzle generation and grading, KrazyDad's blog against our pipeline

## Context

Apart from the gears and spot-difference generators, every puzzle is written by hand and proven unique by `puzzles:verify`. PLAN §7 lists content writing as the highest-likelihood risk. KrazyDad (Jim Bumgardner) has generated tens of thousands of grid puzzles across many formats and has blogged about it for twenty years. This ticket reads that material closely, compares it with what we do, and decides where deterministic, seeded generators are possible and worth building. It is research and writing only: no production code.

## Scope

**In**

- **Read the blog closely.** Start with the posts below, then search the blog and its archives for anything else on generating, grading, uniqueness or solving techniques. Cite every claim with its URL.
  - https://blog.krazydad.com/2012/01/10/it-takes-17-clues-to-make-a-sudoku/
  - https://blog.krazydad.com/2013/03/19/systematic-sudoku/
  - https://blog.krazydad.com/2011/08/23/sudoku-troubleshooter-1/ and its follow-ups (parts 2–4: x-wing, xyz-wing)
  - https://blog.krazydad.com/2012/09/07/get-started-with-jigsaw-sudoku/
  - https://blog.krazydad.com/2008/10/05/killer-sudokus-at-krazydad/
  - https://blog.krazydad.com/2005/12/08/krazy-kakuro-puzzles/
  - https://blog.krazydad.com/2017/01/18/an-advanced-kakuro-technique/
  - https://blog.krazydad.com/2018/04/30/binox-puzzles-are-here/
  - https://blog.krazydad.com/2020/04/20/two-not-touch-puzzles-in-the-new-york-times/
  - https://blog.krazydad.com/2020/09/19/diabolical-two-not-touch/ (notes that his book puzzles "can be solved without resorting to trial and error")
  - https://blog.krazydad.com/2018/05/18/comparing-apples-oranges-and-futoshikis-using-google-trends/
  - https://blog.krazydad.com/2015/01/10/interactive-puzzles-are-here/
  - https://blog.krazydad.com/2023/07/19/about-those-pictures/
  - The lab samples at https://krazydad.com/labs/, for formats and difficulty steps (not for content)
- **Audit our pipeline.** For every implemented and ticketed type (SPEC §2.3), record:
  - how its puzzles are made today (hand-written, or generated: `src/puzzles/gears/generate.ts`, the spot-difference engine);
  - how uniqueness is proven (`countSolutions` and the `verify` hooks);
  - how difficulty is set (`meta` difficulty 1–5, by hand);
  - whether a deterministic generator is feasible, and how hard it would be.
- **Compare and recommend.** Cover at least these points:
  - generation strategy: solution first then remove clues, or clues first then repair;
  - the "solvable without trial and error" bar compared with our "exactly one solution" rule: should a logical-technique solver gate publication?
  - difficulty grading by which techniques a solve needs, mapped to our 1–5 squares;
  - symmetry and aesthetics constraints;
  - determinism: seeding through `_shared/prng.ts` (`mulberry32`, `hashSeed`) and version pinning (as `generator_version` does in spot-difference);
  - how generated puzzles enter the content-as-code pipeline: committed content files with seed provenance, or materialised at seed time like daily gears (SPEC §4.6);
  - daily seeded puzzles for grid types, like `gear_daily`.
- **Outputs:**
  - `docs/research/generators.md` with the findings, the per-type feasibility table and the recommendations;
  - SPEC updates if the recommendation changes the authoring rule or §4.6;
  - follow-up generator tickets, T101 onwards, for each type recommended beyond T100's two, added to `docs/tickets/README.md` under M6;
  - an update to T100's scope if the findings change it.

**Out**

- Production code, generators and content (T100 and the follow-ups).
- Copying any KrazyDad puzzle, grid, layout or code (SPEC §10, decision 6). Techniques and ideas are fine; instances are not.

## Notes

- The blog is personal writing, often light on algorithms. Say clearly where a recommendation rests on general puzzle-generation practice rather than on something the blog states.
- Measure, don't guess: time our existing `countSolutions` on the current content and include the numbers.

## Acceptance criteria

- [ ] **AC1**: `docs/research/generators.md` exists, covers every point listed under Compare and recommend, and cites a URL for every claim about KrazyDad's methods.
  - _Verify (code):_ read the document. Every KrazyDad claim has a link.
- [ ] **AC2**: The per-type table covers every type in SPEC §2.3, with how puzzles are made, how uniqueness is proven, how difficulty is set, and feasibility and effort.
  - _Verify (code)._
- [ ] **AC3**: Solver timings for every implemented type's content are recorded, with the command used.
  - _Verify (cli):_ re-running the recorded command reproduces the numbers within reason.
- [ ] **AC4**: Each recommended generator beyond sudoku and futoshiki has a ticket file and a README row.
  - _Verify (cli):_ `pnpm ticket:status` lists the new tickets.
- [ ] **AC5**: Gates pass.
  - _Verify (cli):_ `pnpm typecheck && pnpm lint && pnpm test && pnpm build` exits 0.
