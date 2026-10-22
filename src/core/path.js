// ===== core/path: the train's path, a run of route segments extended lazily at either end =====
import { PI } from './geometry.js';

export class TrackPath {
  constructor(onThrow) { this.segs = []; this.onThrow = onThrow; this._q = {}; }
  seg(p, r, d, s0) { return { p, r, d, len: p.def.routes[r].len, s0 }; }
  exitEnd(g) { const R = g.p.def.routes[g.r]; return g.d > 0 ? R.b : R.a; }
  entryEnd(g) { const R = g.p.def.routes[g.r]; return g.d > 0 ? R.a : R.b; }
  chooseRoute(p, e) {
    const rs = p.def.routes;
    if (p.def.sw) {
      if (e === 0) return p.state;                 // facing points follow the switch
      const want = e === 1 ? 0 : 1;                // trailing points get thrown (non-derailing)
      if (p.state !== want) { p.state = want; if (this.onThrow) this.onThrow(p); }
      return want;
    }
    for (let i = 0; i < rs.length; i++) if (rs[i].a === e || rs[i].b === e) return i;
    return -1;
  }
  get s0() { return this.segs[0].s0; }
  get s1() { const l = this.segs[this.segs.length - 1]; return l.s0 + l.len; }
  extendFront() {
    const last = this.segs[this.segs.length - 1];
    const e = this.exitEnd(last);
    const c = e >= 0 && last.p.conn[e];
    if (!c) return false;
    const r = this.chooseRoute(c.p, c.i);
    if (r < 0) return false;
    this.segs.push(this.seg(c.p, r, c.p.def.routes[r].a === c.i ? 1 : -1, last.s0 + last.len));
    return true;
  }
  extendBack() {
    const first = this.segs[0];
    const e = this.entryEnd(first);
    const c = e >= 0 && first.p.conn[e];
    if (!c) return false;
    const r = this.chooseRoute(c.p, c.i);
    if (r < 0) return false;
    const R = c.p.def.routes[r];
    this.segs.unshift(this.seg(c.p, r, R.b === c.i ? 1 : -1, first.s0 - R.len));
    return true;
  }
  trim(lo, hi) {
    while (this.segs.length > 1 && this.segs[0].s0 + this.segs[0].len < lo) this.segs.shift();
    while (this.segs.length > 1 && this.segs[this.segs.length - 1].s0 > hi) this.segs.pop();
  }
  at(s, out) {
    let g = this.segs[0];
    for (let i = 1; i < this.segs.length; i++) { if (s >= this.segs[i].s0) g = this.segs[i]; else break; }
    const u = Math.max(0, Math.min(g.len, s - g.s0));
    const q = g.p.def.routes[g.r].at(g.d > 0 ? u : g.len - u, this._q);
    const c = Math.cos(g.p.rot), sn = Math.sin(g.p.rot);
    out.x = g.p.x + q.x * c - q.z * sn;
    out.z = g.p.z + q.x * sn + q.z * c;
    out.h = q.h + g.p.rot + (g.d > 0 ? 0 : PI);
    out.seg = g;
    return out;
  }
  uses(p) { return this.segs.some(g => g.p === p); }
}

// Find the closest point on any route to (x, z), preferring heading h when given.
export function nearestTrackPoint(layout, x, z, h) {
  let best = null;
  for (const p of layout.pieces) {
    if (p.lifted) continue;
    p.def.routes.forEach((R, r) => {
      const n = Math.max(2, Math.ceil(R.len / 0.5));
      for (let i = 0; i <= n; i++) {
        const u = R.len * i / n;
        const q = layout.toWorld(p, R.at(u));
        let cost = Math.hypot(q.x - x, q.z - z);
        let d = 1;
        if (h !== undefined) {
          const c = Math.cos(q.h - h);
          d = c >= 0 ? 1 : -1;
        }
        if (!best || cost < best.cost) best = { cost, p, r, u, d };
      }
    });
  }
  return best;
}
