---
id: T146
title: "Spot the difference: five launch scenes from public-domain engravings"
milestone: M5
epic: E8
depends_on: [T145]
migrations: false
requires_human: true
preview: true
spec: ["SPEC §1.2 (S1E2)", "SPEC §7.4.4 (spot-difference)", "SPEC §10 (decision 6)"]
skills: []
---

# T146: Spot the difference: five launch scenes from public-domain engravings

## Context

T145 built the pipeline with one fixture. This ticket makes the five launch puzzles, spread across difficulties 1–5, from public-domain engravings, each with hand-made differences that look as if they belong in the engraving.

## Scope

**In**

- **Shortlist.** Present 8–10 candidate engravings for approval before editing anything. Each needs a source URL, artist, work, year and the public-domain basis. Choose line engravings (not aquatints or colour plates) with fine hatching and plenty of countable detail. Good sources:
  - J. Le Keux, _Memorials of Cambridge_ (1840s). The show is set in Cambridge.
  - J. P. Neale, _Views of the Seats of Noblemen and Gentlemen_ (1818–29), for the stately home of S1E2.
  - _Illustrated London News_ crowd and group scenes (1842–1900), for the team-building group photo.
  - British Library Flickr Commons and Wikimedia Commons "PD-old" scans.
- **Edits.** For each approved image, make an altered copy with N differences in a raster editor, at a size that survives the T145 threshold pass:
  - remove a window, chimney or figure;
  - add a bird, a lamp or a hat;
  - mirror a detail;
  - lengthen a shadow;
  - shift a sign;
  - change a clock's hands.

  Each edit is retouched in matching hatching, so it can't be spotted as a smudge. No difference may be a colour or tone change alone, because thresholding erases it.
- **Content.** One `content/spot-difference/<slug>.ts` per scene, with the regions sized to the edit plus a small margin. Difficulty comes from the difference count and how subtle the edits are: 5 differences at difficulty 1, up to 12–15 at difficulty 5.
- **Credits.** Each scene's registry `credit` shows under the solver, and a "Picture credits" list goes on the About page (T144), or the footer if T144 hasn't merged.

**Out**

- Pipeline or solver changes (T145). If something is missing, raise it rather than patch it here.

## Notes

- **Human checkpoints:** the user approves the shortlist, then one finished pair before the rest are edited, so the editing style is agreed, then all five. Quote each approval in the report.
- The user may do the edits themselves. In that case the agent prepares the assets, writes the content files and regions, and verifies.
- Check each scan's terms on its own page. Most BL and Wikimedia scans of pre-1900 engravings are public domain, but a few carry a "no known copyright, attribution requested" note. Honour it in the credit.
- Playtest each scene at 390px. A difference should be findable on a phone without zooming.

## Acceptance criteria

- [ ] **AC1**: The user has approved the shortlist, the style pair and the final five.
  - _Verify (human):_ the approvals are quoted in the report.
- [ ] **AC2**: Five scenes cover difficulties 1–5, and `puzzles:verify` (including the pixel-diff proof) passes on all of them.
  - _Verify (cli)._
- [ ] **AC3**: Every scene shows its credit, and the credits list is complete.
  - _Verify (browser)._
- [ ] **AC4**: Each scene is playable to completion at 1280px and 390px in both themes.
  - _Verify (browser):_ screenshots, and a full solve of one scene using the test helper's regions.
- [ ] **AC5**: The scenes play on the PR preview, and the solve-page transfer size stays within the SPEC §8.3 budget.
  - _Verify (deploy)._
- [ ] **AC6**: Gates pass.
  - _Verify (cli):_ `pnpm typecheck && pnpm lint && pnpm test && pnpm build && pnpm puzzles:verify` exits 0.
