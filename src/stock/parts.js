// ===== stock/parts: wheels, trucks, couplers and headlights shared by the rolling stock =====
import * as THREE from 'three';
import { PI, RAIL_TOP } from '../core/geometry.js';
import { TEX } from '../render/textures.js';
import { M, glowMat } from '../render/materials.js';
import { UNIT, mergeList, Kit, xf } from '../render/kit.js';
import { decalGeo } from '../render/decals.js';

const WHEEL_Z = 0.66;

// ---- wheels, trucks, couplers ----
const axleCache = new Map();
function axle(r) {
  if (!axleCache.has(r)) {
    const parts = [];
    for (const s of [-1, 1]) {
      parts.push(xf(UNIT.cylZ, 0, 0, s * WHEEL_Z, r, r, 0.13));
      parts.push(xf(UNIT.cylZ, 0, 0, s * (WHEEL_Z - 0.085), r + 0.06, r + 0.06, 0.04));
    }
    parts.push(xf(UNIT.cylZ, 0, 0, 0, 0.05, 0.05, 1.3));
    axleCache.set(r, mergeList(parts));
  }
  const m = new THREE.Mesh(axleCache.get(r), M.steel);
  m.castShadow = true;
  return m;
}
const driverCache = new Map();
export function driverSet(r) {
  if (!driverCache.has(r)) {
    const tire = [], face = [];
    for (const s of [-1, 1]) {
      tire.push(xf(UNIT.cylZ32, 0, 0, s * WHEEL_Z, r, r, 0.15));
      tire.push(xf(UNIT.cylZ32, 0, 0, s * (WHEEL_Z - 0.09), r + 0.05, r + 0.05, 0.04));
      const c = new THREE.CircleGeometry(r * 0.99, 32);
      if (s < 0) c.rotateY(PI);
      c.translate(0, 0, s * (WHEEL_Z + 0.082));
      face.push(c);
    }
    tire.push(xf(UNIT.cylZ, 0, 0, 0, 0.06, 0.06, 1.3));
    driverCache.set(r, { tire: mergeList(tire), face: mergeList(face) });
  }
  const c = driverCache.get(r), g = new THREE.Group();
  const t = new THREE.Mesh(c.tire, M.nickel), f = new THREE.Mesh(c.face, M.driverFace);
  t.castShadow = f.castShadow = true;
  g.add(t, f);
  return g;
}
// Truck-mounted knuckle coupler with the dangling armature plate of a magnetic coupler.
export function coupler(k, dir, reach, y = 0.62) {
  const shank = Math.max(0.2, reach - 0.3);
  k.box(M.plastic, shank, 0.13, 0.24, dir * shank / 2, y, 0);
  k.box(M.plastic, 0.34, 0.42, 0.56, dir * (reach - 0.17), y + 0.03, 0);
  k.box(M.plastic, 0.14, 0.22, 0.18, dir * (reach - 0.02), y + 0.03, 0.13);
  k.box(M.steel, 0.05, 0.3, 0.26, dir * (reach - 0.34), 0.3, 0);
}
export function bodyCoupler(k, x, dir) {
  k.box(M.plastic, 0.5, 0.13, 0.24, x - dir * 0.25, 0.64, 0);
  k.box(M.plastic, 0.34, 0.42, 0.56, x - dir * 0.17, 0.66, 0);
}
export function withAxles(g, xs, r) {
  return xs.map(x => { const m = axle(r); m.position.set(x, r, 0); g.add(m); return { m, r }; });
}
export function freightTruck(dir, reach) {
  const k = new Kit(), r = 0.32;
  for (const s of [-1, 1]) {
    k.box(M.plastic, 1.8, 0.3, 0.1, 0, 0.36, s * 0.85);
    k.box(M.plastic, 0.5, 0.42, 0.14, 0, 0.42, s * 0.86);
    for (const ax of [-0.56, 0.56]) k.box(M.plastic, 0.28, 0.24, 0.16, ax, r, s * 0.86);
  }
  k.box(M.plastic, 0.44, 0.2, 1.64, 0, 0.62, 0);
  if (dir) coupler(k, dir, reach);
  const g = k.build();
  return { g, axles: withAxles(g, [-0.56, 0.56], r) };
}
export function dieselTruck(dir, reach) {
  const k = new Kit(), r = 0.42;
  for (const s of [-1, 1]) {
    k.box(M.plastic, 2.5, 0.4, 0.12, 0, 0.52, s * 0.88);
    k.box(M.plastic, 0.72, 0.52, 0.16, 0, 0.54, s * 0.9);
    for (const ax of [-0.78, 0.78]) k.cylZ(M.plastic, 0.22, 0.2, ax, r, s * 0.9);
    k.box(M.graphite, 0.3, 0.3, 0.14, 0, 0.3, s * 0.99);
  }
  k.box(M.plastic, 0.6, 0.24, 1.7, 0, 0.84, 0);
  if (dir) coupler(k, dir, reach);
  const g = k.build();
  return { g, axles: withAxles(g, [-0.78, 0.78], r) };
}
export function carTrucks(off, front, back, kind = freightTruck) {
  return [{ off, ...kind(1, front - off) }, { off: -off, ...kind(-1, back - off) }];
}

// ---- headlight ----
export function headlight(body, x, y, z = 0) {
  const lensM = glowMat(0xffe0a6, 0);
  const lens = new THREE.Mesh(UNIT.sphere, lensM);
  lens.scale.setScalar(0.14);
  lens.position.set(x, y, z);
  body.add(lens);
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: TEX.glow, color: 0xffd596, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, opacity: 0 }));
  glow.position.set(x + 0.12, y, z);
  body.add(glow);
  const pool = new THREE.Mesh(decalGeo, new THREE.MeshBasicMaterial({ map: TEX.pool, color: 0xffd596, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, opacity: 0 }));
  pool.rotation.x = -PI / 2;
  pool.scale.set(10, 6, 1);
  pool.position.set(x + 5.2, -RAIL_TOP + 0.04, z);
  body.add(pool);
  lens.userData.ownMatKeepMap = glow.userData.ownMatKeepMap = pool.userData.ownMatKeepMap = true;
  return { lensM, glow, pool, pos: new THREE.Vector3(x, y, z) };
}
