---
id: T177
title: "Campaign links and funnel events: which outreach brought a visit, and what the visitor did"
milestone: M5
epic: E1
depends_on: [T176]
migrations: false
requires_human: true
preview: false
spec: ["SPEC §7.7"]
skills: []
---

# T177: Campaign links and funnel events: which outreach brought a visit, and what the visitor did

## Context

T176 records page views and referrers. A link opened from an email client usually has no referrer, so it shows as direct traffic, and a page view does not say whether the visitor played anything. The outreach to the show's makers (first emails 2026-11-26, follow-up planned for about 2026-12-01) needs two answers: did a given email bring a visit, and did that visitor open or solve a puzzle.

## Scope

**In**

- **Plan check first.** Find out, from the current Vercel docs and the live project, what the Hobby plan gives us: whether UTM parameters are reported, whether custom events are available, how many, and how many properties per event. Put the answer and its source at the top of the report. Everything below depends on it. If neither UTM reporting nor custom events is available on Hobby, stop and report `BLOCKED` with the options and their monthly cost. Do not buy or enable a paid add-on; that is the user's decision.
- **Campaign links.** A documented way to tag a link per recipient or per batch, using whichever mechanism the plan check supports, in this order of preference:
  1. standard UTM parameters (`utm_source`, `utm_medium`, `utm_campaign`), read with the Vercel MCP `aggregate_pageviews` by `utmSource` or `utmCampaign`;
  2. if UTM reporting is not on the plan but custom events are: one `campaign_visit` event with `source` and `campaign` properties, fired once per landing when the parameters are present.

  Tags are opaque slugs chosen by the user (for example `bt-a`), never a person's name or email address. The tag must survive the `/` to `/desk` rewrite and must not create new cached page variants or ISR writes (query strings on static pages: check the cache key and `x-vercel-cache`).
- **Funnel events,** if custom events are available: `puzzle_started` and `puzzle_solved` with the `type` key, and `sign_up`. Fire them where the client already knows the outcome (the solve chrome and the sign-up flow); do not add tracking calls to Server Actions or to puzzle engines. One small module in `src/lib/` wraps `track`, with the event names and property shapes typed in one place. No user id, email, puzzle answer or free text in any property. Events follow T176's production-only rule.
- **A short how-to,** `docs/analytics.md`: how to build a tagged link, the event list, and the exact MCP calls or dashboard views that answer "did campaign X bring visits" and "did those visitors start or solve a puzzle". State plainly what cannot be known (who the visitor is; a forwarded link keeps its tag).
- SPEC §7.7: the campaign mechanism, the event list, and the no-personal-data rule.

**Out**

- Per-user tracking, session replay, heatmaps, or storing visits or events in our own database.
- Email open tracking (pixels) in outreach or in Resend emails.
- Rewriting links in emails already sent.
- A paid plan or add-on, unless the user chooses one after the plan check.

## Notes

- Use the installed `@vercel/analytics` docs for `track` and its limits (property count, value types, length). Server-side `track` exists but is out: actions stay thin.
- The event budget is shared with page views. Estimate events per visit and state the monthly headroom against T176's allowance.
- The solve flow already distinguishes a first start from a resumed attempt and a first solve from a re-check. Reuse that; an event per keystroke or per check is a bug.
- Signed-out play is stored in `localStorage` (T020). Events must fire for signed-out visitors too, since outreach recipients will not have accounts.

## Acceptance criteria

- [ ] **AC1**: The plan check is recorded and the chosen mechanism follows from it.
  - _Verify (code):_ the report opens with the Hobby capabilities for UTM and custom events, with doc links, and names the mechanism used.
- [ ] **AC2**: A tagged link is attributed.
  - _Verify (deploy):_ on production after merge, open `/` with a test tag (`utm_source=t177-test` or the equivalent) in a real browser; within the hour the Vercel MCP query from `docs/analytics.md` returns that tag with a count of at least 1. Record the tool output.
- [ ] **AC3**: A tagged link costs no extra cache entries.
  - _Verify (api):_ `curl -sI` on production for `/` with and without the tag returns the same `x-vercel-cache` behaviour on a warm cache, and `vercel logs` shows no regeneration caused by the tagged request.
- [ ] **AC4**: Funnel events fire once each, for signed-out and signed-in visitors (skipped with the reason if the plan has no custom events).
  - _Verify (unit + deploy):_ a Vitest file covers the wrapper's event names and property shapes; on production, starting and solving one puzzle signed out produces exactly one `puzzle_started` and one `puzzle_solved` with the right `type` (`count_events` filtered by `eventName`), and resuming or re-checking adds none.
- [ ] **AC5**: No personal data leaves the site.
  - _Verify (code):_ every `track` call goes through the wrapper; its property types allow only the fields listed in SPEC §7.7.
- [ ] **AC6**: Nothing fires outside production.
  - _Verify (browser):_ the T176 AC2 script, extended to start and solve a puzzle on a local production build, still records zero `/_vercel/` requests.
- [ ] **AC7**: `docs/analytics.md` answers both outreach questions with runnable queries.
  - _Verify (cli):_ run each query in the document against production and paste the output.
- [ ] **AC8**: Gates and the PLAN §5.3 definition of done pass.
  - _Verify (cli):_ `pnpm typecheck && pnpm lint && pnpm test && pnpm build` exits 0.
