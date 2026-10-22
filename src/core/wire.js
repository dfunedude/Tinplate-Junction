// ===== core/wire: where the trolley wire runs over the layout, and where its masts stand =====
import { TABLE_W, TABLE_D, normAng } from './geometry.js';
import { KEEP_OUT } from './keepout.js';

export const MAST_OFF = 2.7;   // mast to centre rail: clear of a car's ends swinging wide on a curve
const CLEAR = 2.3;             // a mast keeps at least this far from every track
const MAST_GAP = 3.5;          // and from the next mast
const EDGE = 0.6;              // and inside the edge of the table
const STEP = 0.5;

// The wire hangs over the centre rail of every route of every piece on the table. Each run is a list
// of points {x, z, h} in table coordinates, about half an inch apart.
export function wireRuns(layout) {
  const runs = [];
  for (const p of layout.pieces) {
    if (p.lifted) continue;
    for (const R of p.def.routes) {
      const n = Math.max(2, Math.ceil(R.len / STEP)), pts = [];
      for (let i = 0; i <= n; i++) pts.push(layout.toWorld(p, R.at(R.len * i / n)));
      runs.push({ p, pts });
    }
  }
  return runs;
}

// One mast per route where there's room for it: beside the middle of the route, or failing that a
// quarter of the way from either end. It stands on the outside of a curve, or on a straight the side
// facing away from the middle of the layout, unless only the other side is clear. Each mast is
// { x, z } where it stands and { wx, wz } where its arm holds the wire.
export function planWire(layout) {
  const runs = wireRuns(layout), masts = [];
  const all = runs.flatMap(r => r.pts);
  let cx = 0, cz = 0;
  for (const q of all) { cx += q.x; cz += q.z; }
  cx /= all.length || 1; cz /= all.length || 1;
  const fits = (x, z) => {
    if (Math.abs(x) > TABLE_W / 2 - EDGE || Math.abs(z) > TABLE_D / 2 - EDGE) return false;
    if (all.some(q => Math.hypot(q.x - x, q.z - z) < CLEAR)) return false;
    if (masts.some(m => Math.hypot(m.x - x, m.z - z) < MAST_GAP)) return false;
    if (KEEP_OUT.circles.some(([X, Z, r]) => Math.hypot(X - x, Z - z) < r + 0.5)) return false;
    return !KEEP_OUT.rects.some(([x0, x1, z0, z1]) => x > x0 - 0.5 && x < x1 + 0.5 && z > z0 - 0.5 && z < z1 + 0.5);
  };
  for (const { pts } of runs) {
    const turn = normAng(pts[pts.length - 1].h - pts[0].h);   // > 0 bends right
    for (const f of [0.5, 0.25, 0.75]) {
      const q = pts[Math.round((pts.length - 1) * f)];
      const rx = -Math.sin(q.h), rz = Math.cos(q.h);          // to the right of travel
      const out = Math.abs(turn) > 1e-3 ? (turn > 0 ? -1 : 1) : (rx * (q.x - cx) + rz * (q.z - cz) >= 0 ? 1 : -1);
      const side = [out, -out].find(s => fits(q.x + rx * s * MAST_OFF, q.z + rz * s * MAST_OFF));
      if (side) { masts.push({ x: q.x + rx * side * MAST_OFF, z: q.z + rz * side * MAST_OFF, wx: q.x, wz: q.z }); break; }
    }
  }
  return { runs, masts };
}
