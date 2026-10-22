// The trolley wire: it covers every route, and its masts stand on the table, clear of the track,
// the scenery and each other, close enough together that no stretch of wire hangs unsupported.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { TABLE_W, TABLE_D } from '../src/core/geometry.js';
import { Layout } from '../src/core/layout.js';
import { PRESETS, buildPreset } from '../src/core/presets.js';
import { KEEP_OUT } from '../src/core/keepout.js';
import { MAST_OFF, planWire } from '../src/core/wire.js';

const MAX_REACH = 10;   // no point on the wire further than this from a mast's arm

for (const key of Object.keys(PRESETS)) {
  test(`trolley wire over ${key}`, () => {
    const L = new Layout(); buildPreset(L, key);
    const { runs, masts } = planWire(L);
    const issues = [];
    if (runs.length !== L.pieces.reduce((n, p) => n + p.def.routes.length, 0)) issues.push('a route has no wire');
    const pts = runs.flatMap(r => r.pts);
    masts.forEach((m, i) => {
      if (Math.abs(m.x) > TABLE_W / 2 || Math.abs(m.z) > TABLE_D / 2) issues.push(`mast off the table at ${m.x.toFixed(1)},${m.z.toFixed(1)}`);
      if (Math.abs(Math.hypot(m.wx - m.x, m.wz - m.z) - MAST_OFF) > 1e-6) issues.push('arm the wrong length');
      const near = Math.min(...pts.map(q => Math.hypot(q.x - m.x, q.z - m.z)));
      if (near < 2.2) issues.push(`mast ${near.toFixed(2)}" from a track at ${m.x.toFixed(1)},${m.z.toFixed(1)}`);
      for (const [x, z, r] of KEEP_OUT.circles) if (Math.hypot(x - m.x, z - m.z) < r) issues.push(`mast in the scenery at ${x},${z}`);
      for (const [x0, x1, z0, z1] of KEEP_OUT.rects) if (m.x > x0 && m.x < x1 && m.z > z0 && m.z < z1) issues.push('mast in the station');
      for (const o of masts.slice(i + 1)) if (Math.hypot(o.x - m.x, o.z - m.z) < 3) issues.push('masts crowded together');
    });
    let worst = 0;
    for (const q of pts) worst = Math.max(worst, Math.min(...masts.map(m => Math.hypot(m.wx - q.x, m.wz - q.z))));
    if (worst > MAX_REACH) issues.push(`${worst.toFixed(1)}" of wire without a mast`);
    assert.deepEqual(issues, []);
  });
}

test('lifted pieces lose their wire, and an empty table has none', () => {
  const L = new Layout(); buildPreset(L, 'starter');
  L.pieces[0].lifted = true;
  assert.equal(planWire(L).runs.length, L.pieces.length - 1);
  L.clear();
  assert.deepEqual(planWire(L), { runs: [], masts: [] });
});
