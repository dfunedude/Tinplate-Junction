# Tinplate Junction: notes for Claude

A browser toy-train game on three.js 0.160 with no npm dependencies. The source in `src/` is ES modules; `npm run build` bundles it into `dist/tinplate-junction.html`, which is published as the user's "Tinplate Junction" claude.ai artifact. README.md has the file map.

## Commands

- `npm test`: `node:test` checks of the track logic in `src/core/`
- `npm run build`: must pass before publishing. `npm run build:debug` keeps the `window.__tj` handle for scripted browser checks.
- `npm run dev`: serves `/` (the unbundled modules) and `/dist/` (the built page in an artifact-like skeleton) on port 8080

## Module rules (the build enforces them)

- The bundle puts every module in one scope, so top-level names must be unique across `src/`.
- Import each name you use from another module, as `import { a, b } from '../x/y.js'`. No default, `* as` or `as` imports, except for three.js.
- Export with `export const|let|function|class`, one name per statement. Export `const` bindings, not `let`: a module that owns something changing exports a function to change it (like `updateScenery`).
- `src/core/` stays free of the DOM and three.js, so the tests can import it in Node.
- Lower layers never import higher ones: core, render, world and stock, sim, fx, state, storage, ui, main.
- Modules evaluate in import order from `main.js`. Keep top-level side effects, such as adding roots to the scene, where they are.
- Each module animates what it owns, from a function the frame loop calls (`train.update`, `animateTrack`, `updateScenery`, `smoke.update`, `updateReadout`); `main.js` only calls them in order and draws.

## Models and materials

- Make materials with `stdMat`, `paint`, `liveryMat` or `glowMat` (`src/render/materials.js`), never `new MeshStandardMaterial` directly. Those helpers start a material at the room lamp's current level and register it so it dims with the room; anything else stays daylight-bright at night.
- A material made for one vehicle (lit windows, lamps) goes in the vehicle's `lamps` list, or on a decal or headlight, so `Train.setConsist` releases it through `dropMat` when the train changes.
- Lettering goes on with `letter`, `decal`, `frontDecal` or `endDecals` (`src/render/decals.js`); halos, sparks and pools of light with `glowSprite` and `lightPool`, set with `showGlow`, which hides them at zero.
- New vehicles go in `VEHICLES` with a `set` (a key of `FAMILIES`); the Train tab builds its buttons from that.
- A vehicle that returns `poles` is a trolley: `sim/train.js` aims its poles at the wire, and `world/overhead.js` strings the wire while one is in the train. Masts are planned in `core/wire.js` and keep off the scenery zones in `core/keepout.js`.

## Keeping the frame rate up

Draw calls are what the frame costs: every mesh is one, and another in the shadow pass if it casts a shadow. A layout with a train runs about 200 of them; keep new things from adding many.

- Build models with a `Kit` (`src/render/kit.js`), which merges every part into one mesh per material. A part only needs a mesh of its own if it moves on its own (a truck, a pole, a rod, a driver face). Round things that turn, like wheels, can stay in the kit.
- Glow materials and `M.glass` cast no shadow (`userData.surface`), since windows and lamps sit inside their body's shadow. A lamp that stands clear of its model sets `userData.surface = false`.
- Things that don't move go into one kit (`world/scenery.js`, `world/room.js`) and get `pin`ned. Track pieces are drawn as one instanced mesh per piece type and material (`world/track.js`); a `PieceView` holds its piece's slot in them.
- Every shader compiles at boot (`warmShaders` in `main.js`, which shows hidden objects for the moment it takes), so nothing stalls a frame by compiling mid-run. Something with a new kind of material should be in the scene from boot, hidden if need be, like the scrap of trolley wire in `world/overhead.js`.
- Don't allocate or touch the page in per-frame code: reuse objects (route `at(t, out)`), and only write to the DOM when the text changes.
- `render/stage.js` steps the pixel ratio down from 2 towards 1 if frames keep coming slower than about 40 a second.

## Publishing

1. `npm test && npm run build`
2. Publish `dist/tinplate-junction.html` to the existing artifact. Find it with the Artifact tool's `list` (title "Tinplate Junction"), `read` it, then publish with its `url`. Only create a new artifact if the user asks.
3. Keep the localStorage key (`tinplate-junction-v1` in `src/storage.js`) and the save format compatible, because players' layouts live there.
4. Whenever you publish an update to the artifact, also commit the change and push it to `main` on GitHub, without asking first. The user has asked for this every time, so the published game and `main` always match.

## Checking a change in a browser

Run the build in debug mode and drive the game through `window.__tj` (`loadPreset`, `addPiece`, `setEngine`, `setThrottle` and more; see the end of `src/main.js`). Test `npm run dev`'s `/` page as well as the bundle, since only the unbundled page shows a missing import at runtime. In the cloud sandbox jsDelivr can be blocked: get three with `npm pack three@0.160.0` and answer the CDN URLs from it with Playwright's `page.route`, and launch Chromium with `--no-proxy-server`.
