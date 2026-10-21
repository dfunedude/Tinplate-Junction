# Tinplate Junction

A 3D tabletop toy train layout that runs in the browser. Lay O27 tubular three-rail track on an 8 × 5 ft table, couple up a 1960s-style train and run it from a bakelite transformer. Built on three.js, with no npm dependencies.

## Playing

- **Run**: slide the throttle to apply volts. Direction cuts power and flips the train, like the old E-unit reverser. Tap a switch's lantern to throw it. The lamp button darkens the room.
- **Track**: tap a piece to add it at the glowing open end, or tap any ring to build from that end. Drag pieces and their ends snap together. Rotate, Delete, Undo and preset layouts are on the second row.
- **Train**: choose a kind of train (freight, passenger, subway or high-speed), then pick an engine and add cars. Each kind keeps its own train, so switching back brings yours out again. Tap the engine again, or a car in your train, to repaint it, or × to uncouple a car. Tap any track to set the train down there. Passenger cars light up when the track has power.
- **Keys**: ↑ ↓ throttle · D direction · W whistle · F follow cam · R rotate · Delete · Ctrl+Z undo · 1 2 3 tabs

## Working on it

You need Node 20 or newer. There is nothing to install.

```sh
npm run dev      # http://localhost:8080 runs the game straight from src/
npm test         # checks the track geometry, the preset layouts and the train's path
npm run build    # writes dist/tinplate-junction.html, the single-file page for the artifact
```

`npm run dev` also serves the built page at http://localhost:8080/dist/tinplate-junction.html, so you can check the bundle before publishing it.

## Where things live

| Path | What's in it |
| --- | --- |
| `index.html` | Page markup: the 3D view, the control deck and the help card |
| `src/main.js` | Boot, resize and the frame loop |
| `src/state.js` | The live layout, train, sound and smoke, and what the controls are doing |
| `src/storage.js` | Saving the layout, train and settings in the browser |
| `src/core/` | Track math with no rendering: dimensions, the piece catalogue, the layout graph, preset layouts, the train's path |
| `src/render/` | Renderer, scene, camera and lights; procedural textures; materials; the mesh kit; lettering decals |
| `src/world/` | The table and room, the 3D track pieces, the scenery |
| `src/stock/` | Locomotives and cars: shared parts, paint schemes, steam, diesels, freight cars, the passenger set, the subway, the high-speed set, and the catalogue |
| `src/sim/` | The train: consist, motion along the track, reversing, headlight |
| `src/fx/` | Smoke and synthesized sound |
| `src/ui/` | Control deck, camera, track editor, Train tab, pointer input, icons |
| `src/styles/` | Colour and font tokens, the overlay on the 3D view, the control deck |
| `tests/` | `node:test` checks that import `src/core/` directly |
| `tools/` | The build script and the local server |

Common changes:

- **A new preset layout**: add it to `src/core/presets.js`. The tests check that it closes, fits on the table and clears the scenery.
- **A new engine or car**: write its builder in `src/stock/`, add it to `VEHICLES` in `src/stock/catalog.js` with the kind of train it belongs to (its button then appears on that kind's row), add its paint schemes to `src/stock/liveries.js`, and draw its chip in `src/ui/icons.js`.
- **A new kind of train**: add it to `FAMILIES` in `src/stock/catalog.js`, with the train it starts with.
- **A new track piece**: define it in `src/core/pieces.js`, model it in `src/world/track.js`, and add a palette button in `src/ui/icons.js`.
- **Scenery**: `src/world/scenery.js`. If something moves, update its keep-out zone in `tests/presets.test.js`.
- **Sounds**: `src/fx/sound.js`. **Colours and fonts**: `src/styles/base.css`.

## How the build works

The files in `src/` are plain ES modules. In development the browser loads them as they are, and three.js comes from jsDelivr through the import map in `index.html`.

`npm run build` joins the modules into one inline script, dependencies first, inlines the CSS and writes `dist/tinplate-junction.html`. The file has no `<!doctype>`, `<head>` or `<body>`, because the claude.ai artifact host adds its own. All modules share one scope in the bundle, so the build also enforces a few rules:

- Top-level names are unique across `src/`.
- Every module imports what it uses from other modules. Imports look like `import { a, b } from './x.js'`, with no default, `* as` or `as` renames (three.js is the exception).
- Exports are `export const|let|function|class`, one name per statement.

`dist/` is not committed. GitHub Actions runs the tests and the build on every push, and the built page can be downloaded from the run's artifacts.

## Publishing

The game is published as the **Tinplate Junction** artifact on claude.ai. To update it, ask Claude to build the game and publish `dist/tinplate-junction.html` to that artifact. Players' saved layouts are kept across republishes, as long as the storage key in `src/storage.js` stays the same.
