// ===== stock/steam: the 2-6-4 steam locomotive and its square tender =====
import * as THREE from 'three';
import { PI } from '../core/geometry.js';
import { textTexture } from '../render/textures.js';
import { paint, M } from '../render/materials.js';
import { UNIT, Kit, prismX } from '../render/kit.js';
import { letter } from '../render/decals.js';
import { axles, drivers, bodyCoupler, freightTruck, headlight } from './parts.js';

export function buildSteam(liv) {
  const k = new Kit(), blk = M.black, gr = M.graphite, BY = 2.45;
  k.cylX(blk, 0.95, 5.6, 0.8, BY, 0);                       // boiler
  k.cylX(gr, 1.0, 1.05, 4.1, BY, 0);                        // smokebox
  k.cylX(gr, 0.88, 0.08, 4.66, BY, 0);                      // smokebox door
  k.cylX(M.nickel, 0.16, 0.05, 4.71, BY + 0.25, 0);         // number plate
  for (const bx of [-1.0, 0.4, 1.8, 3.47]) k.cylX(gr, 0.97, 0.05, bx, BY, 0);
  k.cylY(gr, 0.27, 0.8, 4.1, 3.75, 0); k.cylY(gr, 0.34, 0.12, 4.1, 4.15, 0);
  for (const dx of [2.5, 0.7]) { k.cylY(blk, 0.42, 0.42, dx, 3.42, 0); k.sphere(blk, 0.42, 0.2, 0.42, dx, 3.63, 0); }
  k.cylY(blk, 0.15, 0.24, 1.6, 3.45, 0); k.sphere(blk, 0.18, 0.18, 0.18, 1.6, 3.62, 0);
  k.cylY(M.nickel, 0.05, 0.42, -1.4, 3.56, 0);
  k.box(gr, 0.42, 0.38, 0.42, 4.45, 3.58, 0);               // headlight housing
  for (const s of [-1, 1]) {
    k.box(blk, 5.7, 0.07, 0.38, 0.75, 1.62, s * 1.17);      // running boards
    k.cylX(M.nickel, 0.028, 5.6, 0.95, 2.98, s * 0.99);     // handrails
    k.cylY(gr, 0.2, 0.75, 1.05, 2.05, s * 1.12);            // air pump / feedwater pump
    k.box(blk, 0.7, 0.35, 0.18, -0.6, 1.82, s * 1.12);      // sandbox / toolbox
  }
  k.boxY(blk, -2.4, -1.6, 1.35, 3.1, 1.02);                 // firebox
  k.boxY(blk, -4.55, -2.0, 1.45, 3.72, 1.18);               // cab
  k.put(blk, UNIT.cylX, -3.3, 3.62, 0, 0, 0, 0, 3.1, 0.3, 1.42); // arched roof
  for (const s of [-1, 1]) {
    k.box(M.glass, 0.6, 0.6, 0.04, -2.72, 3.02, s * 1.195);
    k.box(M.glass, 0.6, 0.6, 0.04, -3.62, 3.02, s * 1.195);
    k.box(M.glass, 0.04, 0.48, 0.42, -1.985, 3.15, s * 0.8);
  }
  k.box(blk, 0.6, 0.1, 2.0, -4.8, 1.48, 0);
  k.box(M.steel, 0.8, 0.12, 0.28, -4.65, 0.98, 0);          // drawbar
  k.boxY(blk, -4.3, 4.45, 0.55, 1.4, 0.5);                  // frame
  for (const s of [-1, 1]) {
    k.cylX(blk, 0.4, 1.2, 3.3, 0.98, s * 1.05);             // cylinders
    k.cylX(gr, 0.43, 0.06, 2.72, 0.98, s * 1.05); k.cylX(gr, 0.43, 0.06, 3.88, 0.98, s * 1.05);
    k.box(blk, 1.05, 0.38, 0.5, 3.3, 1.55, s * 1.0);        // steam chest
    k.box(M.steel, 1.15, 0.07, 0.07, 2.15, 1.12, s * 0.95); // crosshead guide
  }
  k.put(blk, prismX([[4.4, 1.25], [4.4, 0.14], [4.78, 0.14], [5.45, 1.0], [5.45, 1.25]], 0.98)); // pilot
  k.box(blk, 0.32, 0.3, 2.2, 5.35, 1.18, 0);
  bodyCoupler(k, 5.6, 1);
  const spin = drivers(k, [1.55, 0, -1.55], 0.72);
  const body = k.build();
  for (const w of spin) body.add(w.m);
  // the rods swing with the drivers; their shadow falls inside the boiler's, so they cast none
  const rodMat = paint(0xa9aaa8, 0.32, 0.9, 1.0);
  const rods = [-1, 1].map(s => {
    const mk = (geo, mat, sx, sy, sz) => { const m = new THREE.Mesh(geo, mat); m.scale.set(sx, sy, sz); body.add(m); return m; };
    return {
      s, phase: s > 0 ? 0 : PI / 2,
      cr: mk(UNIT.box, rodMat, 3.45, 0.13, 0.06), mr: mk(UNIT.box, rodMat, 2.2, 0.12, 0.06),
      xh: mk(UNIT.box, M.steel, 0.3, 0.2, 0.1), pr: mk(UNIT.cylX, rodMat, 1.0, 0.045, 0.045),
    };
  });
  letter(body, textTexture([liv.num], { w: 256, h: 128, color: '#e8e2d2' }), 0.95, 0.45, -3.17, 2.25, 1.2, false);

  const pilot = new Kit(); pilot.box(blk, 0.9, 0.14, 1.36, 0, 0.62, 0); pilot.box(blk, 0.3, 0.3, 0.12, 0, 0.36, 0.84); pilot.box(blk, 0.3, 0.3, 0.12, 0, 0.36, -0.84);
  axles(pilot, [0], 0.34);
  const trail = new Kit();
  for (const s of [-1, 1]) { trail.box(blk, 1.6, 0.34, 0.08, 0, 0.46, s * 0.84); for (const ax of [-0.45, 0.45]) trail.box(blk, 0.3, 0.26, 0.14, ax, 0.4, s * 0.86); }
  trail.box(blk, 0.5, 0.16, 1.6, 0, 0.72, 0);
  axles(trail, [-0.45, 0.45], 0.4);

  return {
    front: 5.6, back: 5.0, pivots: [1.55, -1.55], body, spin,
    trucks: [{ off: 3.85, g: pilot.build() }, { off: -3.45, g: trail.build() }],
    head: headlight(body, 4.68, 3.58),
    smoke: new THREE.Vector3(4.1, 4.25, 0),
    update(odo) {
      const ang = -odo / 0.72;
      for (const R of rods) {
        const th = ang + R.phase, px = Math.cos(th) * 0.34, py = 0.72 + Math.sin(th) * 0.34;
        const yc = 0.98, L = 2.2, xc = px + Math.sqrt(L * L - (yc - py) ** 2);
        R.cr.position.set(px, py, R.s * 0.86);
        R.mr.position.set((xc + px) / 2, (yc + py) / 2, R.s * 0.94);
        R.mr.rotation.z = Math.atan2(yc - py, xc - px);
        R.xh.position.set(xc, yc, R.s * 0.96);
        R.pr.position.set(xc + 0.5, yc, R.s * 1.02);
      }
    },
  };
}

export function buildTender() {
  const k = new Kit(), blk = M.black;
  k.boxY(blk, -3.75, 3.65, 0.85, 1.12, 1.0);
  k.boxY(blk, -3.55, 3.45, 1.1, 2.95, 1.15);
  k.box(blk, 7.12, 0.06, 2.42, -0.05, 2.97, 0);
  for (const s of [-1, 1]) k.box(blk, 3.2, 0.34, 0.06, 1.85, 3.13, s * 1.13);
  k.box(blk, 0.06, 0.34, 2.26, 0.25, 3.13, 0);
  k.box(M.coal, 3.1, 0.2, 2.2, 1.85, 3.0, 0);
  k.sphere(M.coal, 1.45, 0.36, 1.0, 1.9, 3.05, 0);
  k.cylY(blk, 0.36, 0.16, -2.1, 3.04, 0); k.cylY(blk, 0.26, 0.06, -2.1, 3.14, 0);
  k.box(blk, 0.55, 0.22, 1.7, -0.55, 3.06, 0);
  k.box(blk, 0.45, 0.08, 1.9, 3.7, 1.42, 0);
  k.box(M.steel, 0.6, 0.12, 0.28, 3.8, 0.98, 0);
  for (const s of [-1, 1]) for (let y = 1.4; y < 2.9; y += 0.3) k.box(blk, 0.06, 0.05, 0.5, -3.6, y, s * 0.7);
  k.box(M.graphite, 0.22, 0.24, 0.3, -3.62, 2.7, 0);
  for (const sx of [-1, 1]) for (const s of [-1, 1]) k.box(blk, 0.3, 0.06, 0.3, sx * 3.35, 0.72, s * 1.05);
  const body = k.build();
  letter(body, textTexture(['TINPLATE LINES'], { w: 1024, h: 128, color: '#e6dfcf' }), 5.0, 0.6, 0, 2.15, 1.16);
  return { front: 3.9, back: 3.9, pivots: [2.35, -2.35], body, spin: [], trucks: [{ off: 2.35, ...freightTruck(0) }, { off: -2.35, ...freightTruck(-1, 3.9 - 2.35) }] };
}
