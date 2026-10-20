// ===== core/pieces: the O27 track pieces, and how each palette button attaches one =====
import { PI, R27, S27, ARC, CX, CZ, SW_LEN, XC, BUMPER_LEN, lineRoute, arcRoute, E } from './geometry.js';

function makeSwitch(side) {
  return {
    name: side > 0 ? 'Switch right' : 'Switch left', sw: true, side,
    ends: [E(0, 0, PI), E(SW_LEN, 0, 0), E(CX, side * CZ, side * ARC)],
    routes: [lineRoute(0, 1, 0, 0, 0, SW_LEN), arcRoute(0, 2, 0, 0, 0, R27, ARC, side)],
  };
}

export const PIECES = {
  straight: { name: 'Straight', ends: [E(0, 0, PI), E(S27, 0, 0)], routes: [lineRoute(0, 1, 0, 0, 0, S27)] },
  half: { name: 'Half straight', ends: [E(0, 0, PI), E(S27 / 2, 0, 0)], routes: [lineRoute(0, 1, 0, 0, 0, S27 / 2)] },
  curve: { name: 'Curve', ends: [E(0, 0, PI), E(CX, CZ, ARC)], routes: [arcRoute(0, 1, 0, 0, 0, R27, ARC, 1)] },
  switchL: makeSwitch(-1),
  switchR: makeSwitch(1),
  cross90: {
    name: '90° crossing',
    ends: [E(-XC, 0, PI), E(XC, 0, 0), E(0, -XC, -PI / 2), E(0, XC, PI / 2)],
    routes: [lineRoute(0, 1, -XC, 0, 0, 2 * XC), lineRoute(2, 3, 0, -XC, PI / 2, 2 * XC)],
  },
  bumper: { name: 'Bumper', ends: [E(0, 0, PI)], routes: [lineRoute(0, -1, 0, 0, 0, BUMPER_LEN)] },
};
// centroid of each piece, used as the pivot when a loose piece is rotated
for (const def of Object.values(PIECES)) {
  let sx = 0, sz = 0, n = 0;
  for (const r of def.routes) for (let i = 0; i <= 8; i++) { const q = r.at(r.len * i / 8); sx += q.x; sz += q.z; n++; }
  def.cx = sx / n; def.cz = sz / n;
}

// How each palette button attaches to an open end: which end of the new piece
// meets the joint, and which end becomes the next place to build from.
export const APPEND = {
  straight: { type: 'straight', at: 0, next: 1 },
  half: { type: 'half', at: 0, next: 1 },
  curveL: { type: 'curve', at: 1, next: 0 },
  curveR: { type: 'curve', at: 0, next: 1 },
  switchL: { type: 'switchL', at: 0, next: 1 },
  switchR: { type: 'switchR', at: 0, next: 1 },
  cross90: { type: 'cross90', at: 0, next: 1 },
  bumper: { type: 'bumper', at: 0, next: -1 },
};
