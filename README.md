Violentmonkey userscript that disables automatic advance to the next video in desktop and mobile YouTube playlists. Manual playlist selection remains available.

Install [Violentmonkey](https://violentmonkey.github.io/get-it/), open the [userscript](https://raw.githubusercontent.com/sashokey/no-youtube-playlist-autoplay/master/no-playlist-autoplay-youtube.user.js), and confirm installation. Enable `Allow User Scripts` for Violentmonkey if required. Reload YouTube and open a playlist video.

The authoritative source is [no-playlist-autoplay-youtube.src.ts](no-playlist-autoplay-youtube.src.ts). It runs at document start in the page context, uses no privileged APIs, and installs once per document. Desktop playlist-manager fallbacks are inspected lazily, so a protected alternative cannot break a usable native controller.

Use Node.js 24:

```sh
npm ci --ignore-scripts
npx playwright install --with-deps chromium
npm run build
npm run check
```

`check` runs type-aware lint, strict type checking, JavaScript syntax/metadata/build reproducibility checks, and all 36 Node and browser tests against both compiled unminified and minified artifacts. Coverage includes desktop manager variants and protected getters, SPA replacement, mobile end events, native argument behavior, unrelated states, manual selection, and repeated initialization. GitHub Actions runs the same checks on pushes and pull requests.

All authored TypeScript, including tests and helpers, uses `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, and type-aware unsafe-operation lint rules. `allowJs` is disabled. `skipLibCheck` applies only to overlapping third-party browser declarations; authored files remain checked. Dependencies and tool versions are pinned in `package-lock.json`.
