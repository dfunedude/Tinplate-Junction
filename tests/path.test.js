// The train's path: running around every preset, backing onto a spur, and surviving bad saved data.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Layout } from '../src/core/layout.js';
import { PRESETS, buildPreset } from '../src/core/presets.js';
import { TrackPath } from '../src/core/path.js';

for (const key of Object.keys(PRESETS)) {
  test(`a train runs around ${key} both ways without jumping or stopping`, () => {
    const L = new Layout();
    buildPreset(L, key);
    assert.equal(L.freeEnds().length, 0, 'open ends');
    const P = new TrackPath(() => {});
    const start = L.pieces.find(p => p.type === 'straight') || L.pieces[0];
    P.segs = [P.seg(start, 0, 1, 0)];
    let head = P.s1;
    const len = 40;
    while (P.s0 > head - len) if (!P.extendBack()) break;
    const pos = {}, prev = {};
    P.at(head, prev);
    let maxJump = 0, stops = 0;
    for (let step = 0; step < 20000; step++) {
      const ds = 0.3 * (step < 12000 ? 1 : -1);
      let h = head + ds;
      if (ds > 0) { while (P.s1 < h) if (!P.extendFront()) { h = P.s1; stops++; break; } }
      else { while (P.s0 > h - len) if (!P.extendBack()) { h = P.s0 + len; stops++; break; } }
      head = h; P.trim(head - len - 1, head + 1);
      P.at(head, pos);
      maxJump = Math.max(maxJump, Math.hypot(pos.x - prev.x, pos.z - prev.z));
      Object.assign(prev, pos);
    }
    assert.equal(stops, 0, 'the train hit the end of the track');
    assert.ok(maxJump < 0.301, `the train jumped ${maxJump.toFixed(3)}" in one 0.3" step`);
  });
}

test('on the spur layout a train backs into the spur, then pulls out through the switch', () => {
  const L = new Layout(); buildPreset(L, 'spur');
  const sw = L.pieces.find(p => p.def.sw); sw.state = 0;
  const throws = [];
  const P = new TrackPath(p => throws.push(`${p.type}:${p.state}`));
  P.segs = [P.seg(L.pieces[0], 0, 1, 0)];
  let head = P.s1;
  const len = 30;
  while (P.s0 > head - len) if (!P.extendBack()) break;
  // back up (clockwise) until the tail reaches the end of the line
  let stopped = false, n = 0;
  while (!stopped && n++ < 5000) { let h = head - 0.5; while (P.s0 > h - len) if (!P.extendBack()) { h = P.s0 + len; stopped = true; break; } head = h; P.trim(head - len - 1, head + 1); }
  const tail = {}; P.at(head - len, tail);
  assert.ok(stopped, 'backing up never stopped');
  assert.equal(tail.seg.p.type, 'bumper');
  // pull forward: the train trails through the switch, which throws itself to let it out
  stopped = false; n = 0;
  const seen = new Set();
  while (n++ < 3000) { let h = head + 0.5; while (P.s1 < h) if (!P.extendFront()) { h = P.s1; stopped = true; break; } head = h; P.trim(head - len - 1, head + 1); const q = {}; P.at(head, q); seen.add(q.seg.p.type); }
  assert.ok(!stopped, 'pulling out stopped');
  assert.ok(seen.has('switchR') && seen.has('curve'), 'the train never left the spur');
  assert.deepEqual(throws, ['switchR:1']);
});

test('a bad saved switch state loads as a valid one and the train can run through it', () => {
  const L = new Layout(); buildPreset(L, 'spur');
  const saved = L.serialize().map(o => (o.t.startsWith('switch') ? { ...o, s: 7 } : o));
  const L2 = new Layout(); L2.load(saved);
  const sw = L2.pieces.find(p => p.def.sw);
  assert.ok(sw.state === 0 || sw.state === 1, `switch state ${sw.state}`);
  const P = new TrackPath(); P.segs = [P.seg(L2.pieces[0], 0, 1, 0)];
  assert.doesNotThrow(() => {
    for (let i = 0; i < 400; i++) { if (!P.extendBack()) break; }   // clockwise: meets the switch points first
    for (let i = 0; i < 400; i++) { if (!P.extendFront()) break; }
  });
});
