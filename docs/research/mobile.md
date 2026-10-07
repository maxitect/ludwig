# Mobile: solving on a phone, a PWA, and a path to the app stores

Research only, no production code. This compares the codebase as of `fd5047d` with what phones and the app stores need. Claims about browsers and stores carry their URL. Where something rests on our own reasoning rather than a source, the text says so.

## 1. Summary

1. **The real problem is the solve page, not installability.** Every type that takes typed input (crossword, sudoku, futoshiki, caesar, keyword, pictogram and book cipher) loses part of what the player needs once the system keyboard opens. Nothing on the solve page is sticky or fixed, and no code reacts to the keyboard (section 3).
2. **Fix it with our own on-screen keyboard on touch devices, as Puzzmo does.** Set `inputmode="none"` on the hidden `CellGrid` input and draw a fixed-height letter or digit pad, with a clue bar pinned directly above it. It behaves the same on iOS Safari, Android Chrome, an installed PWA and any later native shell. The system keyboard stays available as a setting, for hardware keyboards and for assistive tech (section 4).
3. **Ship the PWA in two steps.** A manifest, icons, theme colour and safe-area handling are cheap and can go in before launch. A service worker and offline play come later, because Server Actions and session-dependent RSC need care (section 5).
4. **Native apps are deferred.** The options, including the store IP question that blocks a show-branded app, are recorded in [`native-app.md`](./native-app.md) and stay open (section 6).
5. **Workload.** The mobile web work is seven tickets (T112 to T118). We recommend landing T112 to T117 before T068 (accessibility audit) and T069 (performance pass), so those audits cover the layout we launch with. T118 (service worker) goes after launch, in M7 (section 7).

## 2. Where we are

- **Spec.** SPEC §2.2 lists native apps as a v1 non-goal and says "the web app must still be responsive and touch-friendly". There is no mobile section beyond the bottom-sheet nav (§3), which is built (`src/components/shell/mobile-nav.tsx`).
- **PWA.** None yet. There is no manifest, no `apple-icon` (only `src/app/icon.svg`), no `viewport` export or `themeColor`, no service worker and no `env(safe-area-inset-*)`.
- **Tests.** The Playwright `mobile` project is Desktop Chrome at 390×844 with `isMobile` and `hasTouch`. There is no WebKit and no real device profile. Specs type with `page.keyboard`, which never opens a soft keyboard, and none of them use `.tap()`.
- **Workload.** Open work: about 14 M4 tickets, T044, M5's T068 to T070, and 28 M6 tickets (T084 to T111). Native work would add a backend surface on top of all of this, so it has to be sequenced, not run in parallel.

## 3. What breaks on a phone today

The solve page (`src/app/(app)/puzzles/[type]/[slug]/page.tsx`, `src/components/puzzle/solve-chrome.tsx`) is one column in normal document flow. In order it shows the site header, the `Credit` title, the badge and timer, the solver, and the Check/Reveal/Reset bar. At 390×844 the solver starts about 280 to 300px down. An iOS keyboard with its suggestion bar takes roughly 300 to 350px.

| Type | Input | With the keyboard open |
|---|---|---|
| crossword | `CellGrid`, hidden text input | The active clue sits above the grid. Once the page scrolls to the focused input, the clue, the lower rows and the Check cell / Reveal cell buttons cannot all be seen together. The clue list is a nested `max-h-80` scroll under the grid. |
| sudoku, futoshiki | `DigitGrid` (numeric) | The bottom rows, the Notes toggle and the Check bar are under the keypad. |
| caesar, keyword, pictogram-cipher | `CipherKeyPanel`: ciphertext above, 26 slots below | The ciphertext scrolls off while you type into the slots, and the slots are 36px. |
| book-cipher | One `<input>` per reference | The book page is above the inputs on mobile (side by side only at `lg:`), so typing hides the text you are reading from. This is the worst case. |
| reverse-chess, rota | Board | No keyboard. Chess is drag-only on touch, with no tap-to-move. Rota tokens are about 32px, and its HTML5 drag-and-drop does not fire on touch (tap still works). |
| gears | Pointer drag on the crank and scrubber | Works, with `touch-action: none`. The swap buttons are 32px. |
| spot-difference | Tap on SVG | Works, but on a phone the two scenes stack vertically, so comparing them means scrolling. |
| anagram | Tap tiles | Fine. |

Other touch issues: `Button` `sm` is 32px and the default is 40px, the mobile menu trigger is 32px, and the crossword clue and book-cipher reference buttons are small. The Casebook and gear state tables scroll sideways at 390px. One possible bug needs a device test: `CellGrid` clears its input after every keystroke (`cell-grid.tsx:188`), and Android Gboard may not send a usable `Backspace` keydown on an empty input (it often reports key `Unidentified`, keyCode 229). If so, erasing does not work on Android today.

## 4. The keyboard: options and recommendation

### 4.1 What the platforms offer

| Technique | Support | Source |
|---|---|---|
| `interactive-widget=resizes-content` in the viewport meta. The keyboard shrinks the layout viewport, so `dvh` and fixed elements sit above it. | Chrome and Firefox on Android, Samsung Internet. Not in any shipping Safari: WebKit merged it on 2026-07-31, with no release named. | [caniuse](https://caniuse.com/mdn-html_elements_meta_name_viewport_interactive-widget_resizes-content), [WebKit bug 319903](https://bugs.webkit.org/show_bug.cgi?id=319903) |
| VirtualKeyboard API (`overlaysContent`, `env(keyboard-inset-height)`) | Chromium only | [caniuse](https://caniuse.com/mdn-api_virtualkeyboard) |
| `visualViewport` resize and scroll events, to pin a bar above the keyboard by hand | Works on iOS but is janky. There is a reported iOS 26 bug where `offsetTop` stays non-zero after the keyboard closes. | [Apple forums 800125](https://developer.apple.com/forums/thread/800125) |
| `inputmode="none"` plus an in-page keyboard | Everywhere | — |

### 4.2 What other crossword sites do

- **Puzzmo Cross|word** (mobile web) draws its own QWERTY keyboard, with a 123 key and backspace. This was checked in mobile emulation.
- **The Guardian** keeps the native keyboard and puts the current clue in the input's `aria-label`. This was checked by DOM inspection.
- **Amuse Labs PuzzleMe** advertises a virtual keyboard and a clue-list view on phones ([vendor page](https://amuselabs.com/games/crossword/)).
- **NYT and The Times** could not be verified. The Mini is now paywalled.

The common pattern is a custom keyboard, a clue bar directly above it, and the grid scaled into whatever space is left.

### 4.3 Recommendation

On a touch device (`(pointer: coarse)`) with no hardware keyboard in use, the solve page switches to a **solve mode** layout:

```
┌──────────────────────────────┐
│ ‹  THE CLUE ROOM     04:12 ⋯ │  compact header: back, title, timer, menu (Check / Reveal / Reset)
│                              │
│        grid, scaled to       │  flex-1: fits the width and the height that is left
│        fit what remains      │
│                              │
├──────────────────────────────┤
│ ‹  12A  Ink on paper (5)   › │  clue bar: prev/next clue; tap toggles direction or opens the clue list
├──────────────────────────────┤
│ Q W E R T Y U I O P          │
│  A S D F G H J K L           │  PuzzleKeyboard: about 3 × 48px rows plus one action row
│ ⌫  Z X C V B N M   ✓ cell    │
└──────────────────────────────┘
```

- **Height budget at 390×844:** a header of about 48px and a clue bar plus keyboard of about 230px leaves about 560px for the grid. A 15×15 grid at the full 358px width fits with room to spare, which the system keyboard never allows.
- **`PuzzleKeyboard` is a shared solver part** in `src/puzzles/_shared/puzzle-keyboard/`, with `alpha` and `digits` layouts and an optional action row (supplied by the solver: Check cell, Notes, Reveal). Keys are `<button>`s with labels and call the same `enter` / `erase` paths as `CellGrid`'s key handler, so nothing new reaches the server. They are styled in tokens: square ink keys on paper.
- **`CellGrid` gains a `keyboard` mode.** In it, the hidden input gets `inputmode="none"` and stays focused, so hardware keyboards and assistive tech keep working. The pad hides on the first physical keydown and comes back on the next tap.
- **A setting, "Use my device's keyboard"** (default off on touch). For VoiceOver and TalkBack users, Braille screen input, and people who prefer swipe typing. In that mode the clue bar is pinned above the system keyboard with `visualViewport` (iOS) and `interactive-widget=resizes-content` (Android). It is stored in `localStorage`, not `user_settings`, because it belongs to the device (a phone and an iPad with a keyboard want different answers), and it lives in the solve page's menu so signed-out players can reach it.
- **The same layout serves every typed type.** Sudoku and futoshiki use a digit pad, with Notes in the action row. The cipher panel pins the ciphertext in the scrolling area, and tapping a slot selects the letter you type on the pad. Book cipher shows the page in the flexible area and the active reference in the bar.
- **A native app gets this layout for free.** A React Native port would draw the same layout with the same props (section 6).

**Accessibility risk** (our reasoning, not a source). VoiceOver's Quick Nav captures single letters ([Apple forums 727085](https://developer.apple.com/forums/thread/727085)), and a custom keyboard is unfamiliar to screen-reader users. That is why the system keyboard stays one setting away, and why T068 has to do a VoiceOver pass on a real iPhone in solve mode.

## 5. PWA

### 5.1 Step one, before launch (T112)

- `src/app/manifest.ts` (`MetadataRoute.Manifest`) with `display: "standalone"`, `start_url: "/"`, a paper `background_color`, and 192, 512 and maskable icons drawn from the Wordmark. Plus `src/app/apple-icon.png`. The [Next PWA guide](https://nextjs.org/docs/app/guides/progressive-web-apps) needs only a manifest and HTTPS for installability, and says not to build a custom `beforeinstallprompt` button because it does nothing on iOS.
- `export const viewport` in `src/app/layout.tsx`: `themeColor` per colour scheme (Paper and Ink tokens), `viewportFit: "cover"`, and `interactiveWidget: "resizes-content"`. Then add `env(safe-area-inset-*)` padding to the header and the solve-mode keyboard.
- Since iOS 26, anything added to the Home Screen opens as a standalone web app by default ([heise](https://heise.de/-10749652), [WebKit](https://webkit.org/?p=16993)). An install hint (Share, then Add to Home Screen) on the landing page or in Settings is enough. There is no prompt API on iOS. Chrome's `<install>` element is still an origin trial ([Chrome blog](https://developer.chrome.com/blog/install-element-ot)).

### 5.2 Step two, after launch (T118)

- **Service worker with Serwist.** `@serwist/turbopack` is the route the Next guide points to (route handler `app/serwist/[path]/route.ts`, `app/sw.ts`) ([Serwist docs](https://serwist.pages.dev/docs/next/turbo)). `next-pwa` is deprecated in favour of Serwist.
- **What to cache.** Static assets, fonts, textures and glyphs, plus an offline fallback page. Do not cache anything that reads the session (the nav user menu, Casebook, settings). RSC responses share the HTML document's URL, distinguished by the `RSC` header, so their cache keys must be kept apart (our reasoning). Server Actions are POSTs and are never cached.
- **Flaky connections.** Next 16 has an experimental `useOffline` hook (`next/offline`) that retries failed navigations and Server Actions, including autosave, once the connection returns ([docs](https://nextjs.org/docs/app/api-reference/functions/use-offline)). The docs say it is not for production. Watch it rather than adopt it.
- **Storage.** Safari's 7-day cap on script-writable storage applies to browser tabs, and Home Screen apps get their own counter based on use ([Ionic summary of Apple's 2020 statement](https://ionic.io/blog/is-apple-trying-to-kill-pwas)). There is a 2022 WebKit report of Home Screen users being logged out after 7 days ([bug 237350](https://bugs.webkit.org/show_bug.cgi?id=237350)), and no 2026 restatement could be found. Signed-out progress lives in `localStorage`, so the install hint should nudge people to sign up.
- **Push** (iOS 16.4+ when installed; Declarative Web Push from iOS 18.4 needs no service worker, [WebKit](https://webkit.org/?p=16535)) is out of scope. The only obvious use is "this week's pair is out", and that is an M6-or-later idea.

## 6. Native apps

Deferred. The options, their prerequisites and the recommended stack are recorded in [`native-app.md`](./native-app.md), and the decision there is still open. In short: the blocker is store IP policy for a show-branded app, not technology. Any native client needs a public HTTP API, token auth and account deletion. When native starts, Expo / React Native sharing the pure engines is the recommended route. Nothing in T112 to T118 depends on it, and the phone layout and keyboard built there port to it directly.

## 7. Plan

### 7.1 Proposed tickets

| ID | Title | Depends on | Mig | Milestone |
|---|---|---|---|---|
| T112 | PWA baseline: manifest, icons, `viewport` export (theme colour per theme, `viewport-fit`, `interactive-widget`), safe areas, install hint | T015 | | M5 |
| T113 | Solve mode: full-height phone layout for the solve page (compact header with timer, flexible solver area, actions in a menu) | T018, T112 | | M5 |
| T114 | Shared `PuzzleKeyboard` and `CellGrid` keyboard mode, plus the device-keyboard setting and a `visualViewport` inset when that setting is on | T113 | | M5 |
| T115 | Crossword on phones: clue bar with prev/next, clue list in a sheet, cell actions on the keyboard row | T114 | | M5 |
| T116 | The pad for the other typed types: sudoku and futoshiki (digits plus Notes), caesar, keyword, pictogram and book cipher (pinned text) | T114 | | M5 |
| T117 | Touch pass: 44px targets (`Button` sizes, menu trigger, cipher slots, rota tokens), chess tap-to-move, spot-difference compare toggle, Android backspace fix, a Playwright WebKit iPhone project and tap tests | T113 | | M5 |
| T118 | Service worker (Serwist, Turbopack): static asset cache, offline fallback, no session caching | T112, T070 | | M7 |

Native is not ticketed. See [`native-app.md`](./native-app.md).

### 7.2 Changes to existing documents, made in the tickets that need them

Made with this note:

- **SPEC §2.2 and §10:** native apps stay a v1 non-goal, and decision 7 points to `native-app.md`.
- **SPEC §9:** M5 gains the mobile work, and an M7 row is added.
- **PLAN:** M5 gains T112 to T117, M7 holds T118, and there is a new epic, E12, plus two new risks. T068 and T069 now depend on the mobile tickets: T068 gets a VoiceOver pass in solve mode, and T069 measures the solve page in solve mode.
- **Tickets README:** the new rows.

Made by the tickets themselves:

- **SPEC §4.5:** solve mode and the on-screen keyboard (T113, T114).
- **SPEC §6.7 (new, "Mobile"):** safe areas, the `touch` variant and 44px targets (T112, T113, T117).
- **SPEC §7:** the manifest (T112), and later the service worker (T118).

## 8. Limits of this research

- No real-device testing was done. The keyboard heights, and the Android backspace bug, are estimates until someone checks on an iPhone and a Pixel.
- NYT and The Times mobile behaviour, which Safari release ships `resizes-content`, whether Chrome still needs a `fetch` handler for its automatic install prompt, and the 2026 Home Screen storage rules are all unverified.
- App store fees come from secondary sources. No trademark search was done for "Ludwig".
