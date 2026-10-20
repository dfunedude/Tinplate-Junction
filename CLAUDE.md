# Tinplate Junction: notes for Claude

A browser toy-train game on three.js 0.160 with no npm dependencies. The source in `src/` is ES modules; `npm run build` bundles it into `dist/tinplate-junction.html`, which is published as the user's "Tinplate Junction" claude.ai artifact. README.md has the file map.

## Commands

- `npm test`: `node:test` checks of the track logic in `src/core/`
- `npm run build`: must pass before publishing. `npm run build:debug` keeps the `window.__tj` handle for scripted browser checks.
- `npm run dev`: serves `/` (the unbundled modules) and `/dist/` (the built page in an artifact-like skeleton) on port 8080

## Module rules (the build enforces them)

- The bundle puts every module in one scope, so top-level names must be unique across `src/`.
- Import each name you use from another module, as `import { a, b } from '../x/y.js'`. No default, `* as` or `as` imports, except for three.js.
- Export with `export const|let|function|class`, one name per statement. Prefer exporting `const` bindings; `world/scenery.js`'s `transformerHandle` is the one exported `let`.
- `src/core/` stays free of the DOM and three.js, so the tests can import it in Node.
- Lower layers never import higher ones: core, render, world and stock, sim, fx, state, storage, ui, main.
- Modules evaluate in import order from `main.js`. Keep top-level side effects, such as adding roots to the scene, where they are.

## Publishing

1. `npm test && npm run build`
2. Publish `dist/tinplate-junction.html` to the existing artifact. Find it with the Artifact tool's `list` (title "Tinplate Junction"), `read` it, then publish with its `url`. Only create a new artifact if the user asks.
3. Keep the localStorage key (`tinplate-junction-v1` in `src/storage.js`) and the save format compatible, because players' layouts live there.

## Checking a change in a browser

Run the build in debug mode and drive the game through `window.__tj` (`loadPreset`, `addPiece`, `setEngine`, `setThrottle` and more; see the end of `src/main.js`). Test `npm run dev`'s `/` page as well as the bundle, since only the unbundled page shows a missing import at runtime. In the cloud sandbox jsDelivr can be blocked: get three with `npm pack three@0.160.0` and answer the CDN URLs from it with Playwright's `page.route`, and launch Chromium with `--no-proxy-server`.
