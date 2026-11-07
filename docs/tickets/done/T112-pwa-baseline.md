---
id: T112
title: PWA baseline (manifest, icons, viewport, safe areas, install hint)
milestone: M5
epic: E12
depends_on: [T015]
migrations: false
requires_human: false
spec: ["SPEC §6.2", "SPEC §7", "PLAN §3 M5"]
skills: []
---

# T112: PWA baseline (manifest, icons, viewport, safe areas, install hint)

## Context

The first step of the PWA (`docs/research/mobile.md` §5.1). Ludwig becomes installable to the Home Screen and draws correctly under notches and home indicators. There is no service worker yet: installability needs only a manifest and HTTPS, and offline support is T118.

## Scope

**In**

- `src/app/manifest.ts` (`MetadataRoute.Manifest`):
  - `name` "Ludwig.", `short_name` "Ludwig";
  - `display: "standalone"`, `start_url: "/"`, `scope: "/"`;
  - `background_color` and `theme_color` from the Paper tokens;
  - icons at 192 and 512, plus a 512 `purpose: "maskable"`.
- `src/app/apple-icon.png` (180×180).
- All PNG icons are drawn from the existing Wordmark or `icon.svg` on paper, with no rounded corners baked in, since the OS masks them. They are committed as files and made by a script in `scripts/dev/`.
- `export const viewport` in `src/app/layout.tsx`:
  - `themeColor` for light and dark colour schemes;
  - `viewportFit: "cover"`;
  - `interactiveWidget: "resizes-content"`.
- Safe areas. `env(safe-area-inset-*)` padding goes on:
  - the site header (top, left and right);
  - the footer (bottom);
  - the mobile nav bottom sheet (bottom).
- An install hint, shown in the mobile nav sheet only on iOS Safari when the page is not running standalone: "Add Ludwig to your Home Screen: tap Share, then Add to Home Screen." It can be dismissed, and the dismissal is remembered in `localStorage` (in try/catch).
- SPEC §7: a short PWA bullet (manifest and icons, no service worker until T118). SPEC §6 gets a new §6.7 "Mobile", which starts with the safe-area rule.

**Out**

- Service worker, offline and caching (T118).
- A custom `beforeinstallprompt` button. The Next PWA guide advises against it because it does nothing on iOS.
- Web push.
- The phone solve layout (T113).

## Notes

- Read `node_modules/next/dist/docs/01-app/02-guides/progressive-web-apps.md` and the `manifest` and `viewport` file-convention pages first.
- The theme can be chosen by hand (`data-theme`), so a media-query `themeColor` alone can disagree with it. `themeInitScript` and the theme switcher must also set the `theme-color` meta content to the active theme's paper token. Keep the hex values in one place in `src/config/`, next to the tokens they mirror, because a meta tag cannot read CSS variables.
- Detect standalone with `matchMedia("(display-mode: standalone)")` or `navigator.standalone`. The hint renders nothing on the server, to avoid a hydration mismatch.

## Acceptance criteria

- [ ] **AC1**: The manifest is served, and Chrome reports no manifest errors.
  - _Verify (browser):_ On a production build (`pnpm build && pnpm start --port 3112`), `browser_run_code_unsafe` runs CDP `Page.getAppManifest`. `errors` is empty, and the parsed manifest has `display: "standalone"`, `start_url` `/`, and icons at 192, 512 and 512 maskable.
- [ ] **AC2**: Every icon URL resolves to a PNG of the declared size.
  - _Verify (cli):_ For each icon `src` in the manifest and for `/apple-icon.png`, `curl -sI` returns 200 with `content-type: image/png`. `sips -g pixelWidth -g pixelHeight` on each committed file matches its declared size.
- [ ] **AC3**: The head carries the viewport, theme colour and apple-touch-icon tags.
  - _Verify (api):_ `curl -s http://localhost:3112/ | grep -o '<meta name="viewport"[^>]*>'` contains `viewport-fit=cover` and `interactive-widget=resizes-content`. The page has `<meta name="theme-color"` and `<link rel="apple-touch-icon"`.
- [ ] **AC4**: The theme colour follows the chosen theme.
  - _Verify (browser):_ Switch to Ink, reload, and `document.querySelector('meta[name=theme-color]').content` equals the Ink paper value. Switch back to Paper and it equals the Paper value.
- [ ] **AC5**: Safe-area padding is applied.
  - _Verify (code):_ `grep -rn "safe-area-inset" src/` matches the header, the footer and the mobile nav sheet.
- [ ] **AC6**: The install hint shows only where it should.
  - _Verify (browser):_ With an iPhone Safari user agent at 390×844, the mobile nav sheet shows the hint. After dismissing it and reloading, it is gone. With the Desktop Chrome user agent, and with `display-mode: standalone` emulated, it never renders. Take screenshots in both themes at 390px.
- [ ] **AC7**: The behaviour holds on the PR's preview.
  - _Verify (deploy):_ `vercel curl --yes --deployment <preview-url> /manifest.webmanifest` returns the manifest JSON.
- [ ] **AC8**: Gates and the PLAN §5.3 definition of done pass.
  - _Verify (cli):_ `pnpm typecheck && pnpm lint && pnpm test && pnpm build` exits 0.
