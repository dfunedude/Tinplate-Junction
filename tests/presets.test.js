// Every preset must close, stay on the table, keep clear of the scenery and keep
// non-adjacent tracks far enough apart that passing cars don't touch.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { TABLE_W, TABLE_D } from '../src/core/geometry.js';
import { Layout } from '../src/core/layout.js';
import { PRESETS, buildPreset } from '../src/core/presets.js';
import { TrackPath } from '../src/core/path.js';
import { KEEP_OUT } from '../src/core/keepout.js';

const TABLE = { x: TABLE_W / 2 - 1.4, z: TABLE_D / 2 - 1.4 };
const CIRCLES = KEEP_OUT.circles, RECTS = KEEP_OUT.rects;
const HALF = 1.5;              // track + car half-width margin from the centreline
const MIN_GAP = 3.4;           // closest allowed centreline distance between unrelated tracks

for (const key of Object.keys(PRESETS)) {
  test(`preset ${key} (${PRESETS[key].name})`, () => {
    const L = new Layout(); buildPreset(L, key);
    const issues = [];
    const free = L.freeEnds();
    if (free.length) issues.push(`${free.length} open ends`);
    const pts = [];
    for (const p of L.pieces) for (const r of p.def.routes) for (let i = 0; i <= 12; i++) pts.push({ p, ...L.toWorld(p, r.at(r.len * i / 12)) });
    for (const q of pts) {
      if (Math.abs(q.x) > TABLE.x || Math.abs(q.z) > TABLE.z) { issues.push(`off table at ${q.x.toFixed(1)},${q.z.toFixed(1)}`); break; }
    }
    for (const [cx, cz, r] of CIRCLES) for (const q of pts) if (Math.hypot(q.x - cx, q.z - cz) < r + HALF) { issues.push(`hits scenery at ${cx},${cz}`); break; }
    for (const [x0, x1, z0, z1] of RECTS) for (const q of pts) if (q.x > x0 - HALF && q.x < x1 + HALF && q.z > z0 - HALF && q.z < z1 + HALF) { issues.push('hits the station'); break; }
    // pieces that touch (directly, or both hang off the same switch/crossing) may run close together
    const near = (a, b) => a === b || a.conn.some(c => c && (c.p === b || c.p.conn.some(d => d && d.p === b)));
    let worst = Infinity, worstPair = '';
    for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) {
      const a = pts[i], b = pts[j];
      if (near(a.p, b.p)) continue;
      const d = Math.hypot(a.x - b.x, a.z - b.z);
      if (d < worst) { worst = d; worstPair = `${a.p.type}#${a.p.id} / ${b.p.type}#${b.p.id}`; }
    }
    if (worst < MIN_GAP) issues.push(`tracks ${worst.toFixed(2)}" apart (${worstPair})`);
    // drive every route of every piece both ways until the path runs out or loops a lot
    try {
      for (const p of L.pieces) p.def.routes.forEach((r, ri) => {
        for (const d of [1, -1]) {
          const P = new TrackPath(); P.segs = [P.seg(p, ri, d, 0)];
          for (let n = 0; n < 200 && P.extendFront(); n++);
          for (let n = 0; n < 200 && P.extendBack(); n++);
        }
      });
    } catch (e) { issues.push('path error: ' + e.message); }
    assert.deepEqual(issues, []);
  });
}
