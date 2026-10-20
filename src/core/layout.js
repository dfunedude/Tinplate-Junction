// ===== core/layout: the layout graph, the pieces on the table and which ends are joined =====
import { PI, normAng, rot2 } from './geometry.js';
import { PIECES } from './pieces.js';

export class Layout {
  constructor() { this.pieces = []; this.nextId = 1; }
  add(type, x = 0, z = 0, rot = 0, state = 0) {
    const def = PIECES[type];
    const p = { id: this.nextId++, type, def, x, z, rot: normAng(rot), state, conn: def.ends.map(() => null) };
    this.pieces.push(p);
    return p;
  }
  remove(p) {
    this.pieces = this.pieces.filter(q => q !== p);
    for (const q of this.pieces) q.conn = q.conn.map(c => (c && c.p === p ? null : c));
  }
  clear() { this.pieces = []; }
  toWorld(p, q) { const [x, z] = rot2(q.x, q.z, p.rot); return { x: p.x + x, z: p.z + z, h: normAng(q.h + p.rot) }; }
  endWorld(p, i) { return this.toWorld(p, p.def.ends[i]); }
  center(p) { const [x, z] = rot2(p.def.cx, p.def.cz, p.rot); return { x: p.x + x, z: p.z + z }; }
  connectAll() {
    const ends = [];
    for (const p of this.pieces) {
      p.conn.fill(null);
      if (p.lifted) continue;
      p.def.ends.forEach((e, i) => ends.push({ p, i, ...this.endWorld(p, i) }));
    }
    for (let a = 0; a < ends.length; a++) {
      const A = ends[a];
      for (let b = a + 1; b < ends.length; b++) {
        const B = ends[b];
        if (A.p === B.p || A.p.conn[A.i] || B.p.conn[B.i]) continue;
        if (Math.abs(A.x - B.x) > 0.3 || Math.abs(A.z - B.z) > 0.3) continue;
        if (Math.cos(A.h - B.h) > -0.995) continue;
        A.p.conn[A.i] = { p: B.p, i: B.i };
        B.p.conn[B.i] = { p: A.p, i: A.i };
      }
    }
  }
  freeEnds(skip) {
    const out = [];
    for (const p of this.pieces) {
      if (p === skip || p.lifted) continue;
      p.conn.forEach((c, i) => { if (!c) out.push({ p, i, ...this.endWorld(p, i) }); });
    }
    return out;
  }
  // pose that puts end `endIdx` of a `type` piece against joint J (J.h points out of the existing track)
  poseFor(type, endIdx, J) {
    const e = PIECES[type].ends[endIdx];
    const rot = normAng(J.h + PI - e.h);
    const [ex, ez] = rot2(e.x, e.z, rot);
    return { x: J.x - ex, z: J.z - ez, rot };
  }
  bounds() {
    let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity;
    for (const p of this.pieces) for (const r of p.def.routes) for (let i = 0; i <= 6; i++) {
      const q = this.toWorld(p, r.at(r.len * i / 6));
      x0 = Math.min(x0, q.x); x1 = Math.max(x1, q.x); z0 = Math.min(z0, q.z); z1 = Math.max(z1, q.z);
    }
    return { x0, x1, z0, z1 };
  }
  serialize() {
    return this.pieces.map(p => ({ t: p.type, x: +p.x.toFixed(4), z: +p.z.toFixed(4), r: +p.rot.toFixed(6), s: p.state || 0 }));
  }
  load(list) {
    this.clear();
    for (const o of list || []) if (PIECES[o.t] && isFinite(o.x) && isFinite(o.z)) this.add(o.t, o.x, o.z, o.r || 0, o.s === 1 ? 1 : 0);
    this.connectAll();
  }
}
