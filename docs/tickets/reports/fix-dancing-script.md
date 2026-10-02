# fix-dancing-script report: Dancing Script for wordmark and signature

Status: DONE
Branch: fix/dancing-script-wordmark
Verify cycles: 1 (one gate rerun after clearing stale `.next` types from the deleted temp route)

## Summary table

| AC | Result | Method | Evidence |
|---|---|---|---|
| AC1 | PASS | code | see AC1 below |
| AC2 | PASS | browser | see AC2 below |
| AC3 | PASS | browser, code | .verification/fix-font/wordmark-stamp-{paper,ink}-{1280,390}.png; `grep -c "<text"` -> 0 |
| AC4 | PASS | cli | .verification/fix-font/gates.log |

## Gates

typecheck ✔ · lint ✔ · test ✔ (46 passed) · build ✔ · puzzles:verify n.a.

## Evidence

### AC1
```
$ grep -rni yesteryear src docs/SPEC.md      (no output, rc=1)
$ grep -n "Dancing" src/app/fonts.ts docs/SPEC.md
src/app/fonts.ts:4:  Dancing_Script,
src/app/fonts.ts:10:const signature = Dancing_Script({
docs/SPEC.md:382:| Wordmark / signature | Hummingbird Bold ... | **Dancing Script** Bold 700 (user decision, 2026-10-02) | ...
```

### AC2
Isolated Playwright script (.verification/fix-font/shoot.mjs) against a temporary `/dev-font` route (deleted):
```
{"url":"/dev-font","check":true,"ff":"\"Dancing Script\", \"Dancing Script Fallback\", cursive","loaded":["Dancing Script 700","Jost 100 900"]}
console errors: []
```

### AC3
Screenshots in `.verification/fix-font/`: Wordmark red on paper, paper-on-ink with InkSplat, and SolvedStamp, in Paper and Ink at 1280 and 390. Letterforms are Dancing Script Bold.
`grep -c "<text" src/components/brand/wordmark.tsx` -> 0. Path traced from Dancing Script Bold 700 (@fontsource woff, opentype.js, path built from glyph commands, 1 decimal) as a temporary tool input outside the repo; viewBox is now `-8 -74 302 104` (new glyph bounds), props unchanged.

## Deviations and follow-ups

- SPEC §6.1 wordmark row edited only (line 382).
- Home page sample label changed to "Signature (Dancing Script)".
- Only weight 700 is loaded; SolvedStamp and the sample request 400 and resolve to the 700 face.
- The viewBox aspect ratio changed (3.0 to 2.9 wide-to-high), so rendered height shifts slightly; no caller changes needed.
- Only favicon 404s appeared in the shared MCP tab; not related.
