// ===== core/presets: ready-made layouts, written as build instructions =====
import { PI, R27, S27, SW_LEN } from './geometry.js';
import { APPEND } from './pieces.js';

export const PRESETS = {
  spur: {
    name: 'Oval with spur',
    ops: [{ start: [-26.25, R27, 0] }, ...rep('S', 6), { t: 'switchR', at: 2, next: 0, label: 'sw' },
      ...rep('CL', 3), ...rep('S', 6), ...rep('CL', 4),
      { from: 'sw', end: 1 }, 'CR', ...rep('S', 3), 'B'],
  },
  starter: { name: 'Starter oval', ops: oval(2) },
  long: { name: 'Long oval', ops: oval(6) },
  fig8: {
    name: 'Figure eight',
    ops: [{ place: 'cross90', x: 0, z: 0, rot: -PI / 4, label: 'x' },
      { from: 'x', end: 1 }, 'S', ...rep('CR', 6), 'S',
      { from: 'x', end: 2 }, 'S', ...rep('CL', 6), 'S'],
  },
  sidings: {
    name: 'Twin passing sidings',
    ops: [{ start: [-(2 * SW_LEN + 4 * S27) / 2, R27, 0] },
      { t: 'switchR', at: 0, next: 1, label: 'a' }, ...rep('S', 4), { t: 'switchL', at: 1, next: 0 }, ...rep('CL', 4),
      { t: 'switchR', at: 0, next: 1, label: 'b' }, ...rep('S', 4), { t: 'switchL', at: 1, next: 0 }, ...rep('CL', 4),
      { from: 'a', end: 2 }, 'CL', 'S', 'S', 'CL',
      { from: 'b', end: 2 }, 'CL', 'S', 'S', 'CL'],
  },
  // A three-track stub yard inside the loop, fed by a switch ladder off the front straight,
  // plus an industry spur off the back straight. Each straight carries one switch so the oval closes.
  yard: {
    name: 'Freight yard',
    center: false,
    ops: [{ start: [-(SW_LEN + 5 * S27) / 2, R27, 0] },
      'S', { t: 'switchL', at: 0, next: 1, label: 'lead' }, ...rep('S', 4), ...rep('CL', 4),
      'S', { t: 'switchR', at: 0, next: 1, label: 'ind' }, ...rep('S', 4), ...rep('CL', 4),
      // the ladder runs diagonally into the loop; each ladder switch peels off one yard track
      { from: 'lead', end: 2 }, { t: 'switchR', at: 0, next: 1, label: 'l1' }, { t: 'switchR', at: 0, next: 1, label: 'l2' }, 'CR', 'S', 'B',
      { from: 'l1', end: 2 }, 'S', 'S', 'S', 'B',
      { from: 'l2', end: 2 }, 'S', 'S', 'B',
      { from: 'ind', end: 2 }, 'CL', 'S', 'B'],
  },
  // Two diagonal cutoffs cross in the middle on a 90° crossing. Taking either one turns the
  // train around, so it can run the loop clockwise or counter-clockwise without backing up.
  // Each diagonal is straight + crossing + straight = 27", which is exactly what the O27
  // switch geometry needs to land on the far straight.
  reverse: {
    name: 'Reversing X',
    ops: [{ start: [-(2 * SW_LEN + 4 * S27) / 2, R27, 0] },
      'S', { t: 'switchL', at: 0, next: 1, label: 'a' }, 'S', 'S', { t: 'switchR', at: 1, next: 0, label: 'b' }, 'S', ...rep('CL', 4),
      'S', { t: 'switchL', at: 0, next: 1 }, 'S', 'S', { t: 'switchR', at: 1, next: 0 }, 'S', ...rep('CL', 4),
      { from: 'a', end: 2 }, 'S', { t: 'cross90', at: 0, next: 1, label: 'x' }, 'S',
      { from: 'b', end: 2 }, 'S',
      { from: 'x', end: 2 }, 'S'],
  },
};
function rep(op, n) { return Array(n).fill(op); }
function oval(n) { return [{ start: [-(n * S27) / 2, R27, 0] }, ...rep('S', n), ...rep('CL', 4), ...rep('S', n), ...rep('CL', 4)]; }
const SHORT = { S: 'straight', H: 'half', CL: 'curveL', CR: 'curveR', SL: 'switchL', SR: 'switchR', X: 'cross90', B: 'bumper' };

export function appendPiece(layout, J, kind) {
  const a = APPEND[kind];
  const pose = layout.poseFor(a.type, a.at, J);
  const p = layout.add(a.type, pose.x, pose.z, pose.rot);
  return { p, next: a.next };
}

export function buildPreset(layout, key) {
  const P = PRESETS[key];
  layout.clear();
  if (!P) return;
  const labels = {};
  let J = null;
  for (const op of P.ops) {
    if (typeof op === 'string' || op.t) {
      let p, next;
      if (typeof op === 'string') ({ p, next } = appendPiece(layout, J, SHORT[op]));
      else {
        const pose = layout.poseFor(op.t, op.at, J);
        p = layout.add(op.t, pose.x, pose.z, pose.rot);
        next = op.next;
        if (op.label) labels[op.label] = p;
      }
      J = next >= 0 ? layout.endWorld(p, next) : null;
    } else if (op.start) {
      J = { x: op.start[0], z: op.start[1], h: op.start[2] };
    } else if (op.place) {
      const p = layout.add(op.place, op.x, op.z, op.rot);
      if (op.label) labels[op.label] = p;
    } else if (op.from) {
      J = layout.endWorld(labels[op.from], op.end);
    }
  }
  // centre the result on the table, unless the preset is already placed around the scenery
  if (P.center !== false) {
    const b = layout.bounds();
    const mx = (b.x0 + b.x1) / 2, mz = (b.z0 + b.z1) / 2;
    for (const p of layout.pieces) { p.x -= mx; p.z -= mz; }
  }
  layout.connectAll();
}
