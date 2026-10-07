# Native apps: open options

**Status: open, decision deferred (2026-10-07).** We are doing the PWA and the phone solve layout first (`docs/research/mobile.md`, T112 to T118). Native work comes back once the web app has launched. Nothing here is ticketed. This note records what was found so the decision can be picked up where it was left.

Claims about stores and libraries carry their URL. Where something rests on our own reasoning, the text says so.

## 1. The decision to make

The blocker is intellectual property, not technology.

- **Apple 5.2.1:** "Don't use protected third-party material such as trademarks… Apps should be submitted by the person or legal entity that owns or has licensed the intellectual property." Apple 4.1(c) forbids using another's brand in the app name or icon ([guidelines](https://developer.apple.com/app-store/review/guidelines/)).
- **Google's impersonation policy** uses, as its own example, an app that copies a TV show's title and character in its icon and implies affiliation ([policy](https://support.google.com/googleplay/android-developer/answer/9888374)).
- The web fan site is low risk (SPEC §10, decision 4). A store listing is different: people review it, and it is open to takedown on complaint. The BBC has renewed _Ludwig_ for a third series ([Drama Quarterly](https://dramaquarterly.com/bbc-plans-more-puzzles-for-ludwig/)), so the brand is being actively exploited. No fan-app precedent was found, and no trademark search has been done (UK IPO, USPTO).

The options, all still open:

| Option | What it means | Cost |
|---|---|---|
| **(a) Licence** | Approach the BBC / Big Talk to publish the app under the show's name | Time and an uncertain answer. It may bring conditions on content and branding |
| **(b) Generic store app** | Ship the puzzles, engines and paper-and-ink style under a name and identity of our own, without the show's name, wordmark or episode framing. The web site stays the fan site | A second brand. Puzzle copy that cites episodes (SPEC §1.2) needs a neutral variant |
| **(c) Web and PWA only** | No store presence. Installs come from Add to Home Screen | None beyond T112 to T118 |

## 2. Prerequisites any native client needs

These apply whichever of (a) or (b) is chosen. Items 1 and 3 are also worth doing for the web.

1. **A public HTTP API.**
   - Today every read is RSC (`src/lib/data/*`) and every write is a Server Action (`src/lib/actions/*`):
     - `saveState`, `clearState`, `checkAnswer` (full and cell mode) and `revealCell`;
     - `tapScene` and `loadFoundRegions`;
     - `mergeLocalProgress`, `saveSettings`, `saveTheme` and `saveChessNotation`;
     - `signUp` and `signIn`.
   - A native client needs versioned route handlers over the same data-access functions: catalogue, puzzle payload, attempt state, check, cell check and reveal, save and clear, Casebook and settings.
   - The actions stay thin wrappers, so no logic is duplicated.
   - "Solutions never reach the client" must hold for the API exactly as it does for payloads.
2. **Token auth.** Better Auth's Expo integration adds the server `expo()` plugin plus the app scheme in `trustedOrigins`. The client keeps the session in SecureStore and sends it as a `Cookie` header with `credentials: "omit"` ([docs](https://better-auth.com/docs/integrations/expo)). Today only `nextCookies()` is loaded (`src/lib/auth.ts`).
3. **Account deletion.**
   - Apple 5.1.1(v) requires in-app deletion for any app that creates accounts.
   - Google requires an in-app path and a web link, declared in the Data safety form ([Google](https://support.google.com/googleplay/android-developer/answer/13327111)).
   - We have no deletion feature yet.
4. **Sharing schemas.**
   - Every `schema.ts` imports its Drizzle `tables.ts`, because CLAUDE.md derives Zod from `drizzle-orm/zod`.
   - Engines, checkers and derivations are already pure, except `gears/crank.ts`, which is a React hook. One more hazard: `reverse-chess/retro-ply.ts` type-imports through the `_shared/chess-board` barrel, which re-exports components.
   - Before anyone proposes splitting schemas off Drizzle, which would break the type-system rule, spike whether a React Native bundle can simply import the `drizzle-orm/pg-core` table definitions. They are plain JS objects with no driver.

## 3. Which native stack

| Option | Fit for Ludwig | Verdict |
|---|---|---|
| **Capacitor with a remote `server.url`** (a shell around the Vercel site) | Least work. A 2026 report says the Capacitor team treats it as dev-only ([report](https://www.tabnews.com.br/Dasproffen/migrar-app-next-js-app-router-server-components-actions-do-server-url-do-capacitor-para-build-embutido-e-offline-first-android-ios-alguem-ja-fez)). Apple rejects repackaged websites under 4.2, even with native plugins ([forum, 2026](https://developer.apple.com/forums/thread/812889)) | No |
| **Capacitor with a bundled `output: 'export'`** | Server Actions, session pages and checking would all need the HTTP API anyway ([static exports](https://nextjs.org/docs/app/guides/static-exports)). It is still a WebView app, so the 4.2 risk remains | No |
| **Trusted Web Activity (Bubblewrap or PWABuilder) for Google Play** | Cheap once the PWA exists. `assetlinks.json` must match the Play signing key ([codelab](https://developers.google.com/codelabs/pwa-in-play)). Android only | A reasonable first store step under (a) or (b) |
| **Expo / React Native** | Native UI, so no 4.2 risk. Engines, checkers, derivations and (if the spike in section 2 passes) schemas are shared through a pnpm workspace. Solvers are rewritten natively. Heavy SVG boards (gears, spot the difference) can start as Expo DOM components (`'use dom'`), which run in a WebView and take serialisable props only ([docs](https://docs.expo.dev/guides/dom-components/)). The phone solve layout and `PuzzleKeyboard` from T113 to T116 port directly | **Recommended** when native starts |

## 4. Store logistics

- **Fees:** Apple $99 a year, Google a one-time $25 (secondary source). An organisation account needs a D-U-N-S number.
- **Google closed test:** a new personal Google Play account must run a closed test with at least 12 testers for 14 days before production. Organisation accounts are exempt ([Google](https://support.google.com/googleplay/android-developer/answer/14151465)).
- **Android developer verification:** this also applies to sideloaded apps. It started in four countries in September 2026 and rolls out globally from 2027 ([9to5Google](https://9to5google.com/2025/08/25/android-apps-developer-verification/)).
- **Both stores** need a privacy policy and an age-rating questionnaire (IARC on Google).

## 5. Suggested order when this reopens

1. Decide on (a), (b) or (c).
2. Spike: import the `pg-core` tables into a React Native bundle.
3. Build the public API, token auth and account deletion. The web can ship these first.
4. An Expo app shell with auth, the Collection and the Casebook.
5. One solver per group, copying the M4 grouping in PLAN §3.
6. Store submission: TWA or Expo on Google Play first, because the review is lighter and the closed test takes 14 days, then the App Store.
