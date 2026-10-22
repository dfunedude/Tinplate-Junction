// ===== stock/parts: wheels, trucks, couplers and headlights shared by the rolling stock =====
import * as THREE from 'three';
import { PI, RAIL_TOP } from '../core/geometry.js';
import { TEX } from '../render/textures.js';
import { M, glowMat } from '../render/materials.js';
import { UNIT, mergeList, Kit, xf } from '../render/kit.js';
import { glowSprite, lightPool } from '../render/decals.js';

const WHEEL_Z = 0.66;

// ---- wheels, trucks, couplers ----
// A wheel is round, so a turning axle looks just like a still one: plain axles are merged into their
// truck, and steam drivers into the engine's body. Only the spoked faces of the drivers, which show
// them turning, are meshes of their own (the spin list a builder returns).
const axleCache = new Map();
function axleGeo(r) {
  if (!axleCache.has(r)) {
    const parts = [];
    for (const s of [-1, 1]) {
      parts.push(xf(UNIT.cylZ, 0, 0, s * WHEEL_Z, r, r, 0.13));
      parts.push(xf(UNIT.cylZ, 0, 0, s * (WHEEL_Z - 0.085), r + 0.06, r + 0.06, 0.04));
    }
    parts.push(xf(UNIT.cylZ, 0, 0, 0, 0.05, 0.05, 1.3));
    axleCache.set(r, mergeList(parts));
  }
  return axleCache.get(r);
}
const driverCache = new Map();
function driverGeo(r) {
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
  return driverCache.get(r);
}
// wheelsets of radius r at each x along a truck or a body, standing on the rails
export function axles(k, xs, r) {
  for (const x of xs) k.put(M.steel, axleGeo(r), x, r, 0);
}
// Steam drivers of radius r at each x: the tires go in the kit, and the faces come back as the spin
// list, to add to the body once it's built. The faces sit on the tires, so they cast no shadow.
export function drivers(k, xs, r) {
  const { tire, face } = driverGeo(r);
  return xs.map(x => {
    k.put(M.nickel, tire, x, r, 0);
    const m = new THREE.Mesh(face, M.driverFace);
    m.position.set(x, r, 0);
    return { m, r };
  });
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
export function freightTruck(dir, reach) {
  const k = new Kit(), r = 0.32;
  for (const s of [-1, 1]) {
    k.box(M.plastic, 1.8, 0.3, 0.1, 0, 0.36, s * 0.85);
    k.box(M.plastic, 0.5, 0.42, 0.14, 0, 0.42, s * 0.86);
    for (const ax of [-0.56, 0.56]) k.box(M.plastic, 0.28, 0.24, 0.16, ax, r, s * 0.86);
  }
  k.box(M.plastic, 0.44, 0.2, 1.64, 0, 0.62, 0);
  if (dir) coupler(k, dir, reach);
  axles(k, [-0.56, 0.56], r);
  return { g: k.build() };
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
  axles(k, [-0.78, 0.78], r);
  return { g: k.build() };
}
// Passenger truck: a longer wheelbase, coil springs over the journal boxes and a deep bolster.
export function passengerTruck(dir, reach) {
  const k = new Kit(), r = 0.34;
  for (const s of [-1, 1]) {
    k.box(M.plastic, 2.3, 0.24, 0.1, 0, 0.44, s * 0.86);
    for (const ax of [-0.72, 0.72]) {
      k.box(M.plastic, 0.4, 0.2, 0.16, ax, r, s * 0.87);
      k.cylY(M.steel, 0.1, 0.24, ax, 0.62, s * 0.86);
    }
    k.box(M.graphite, 0.5, 0.3, 0.14, 0, 0.5, s * 0.88);
  }
  k.box(M.plastic, 0.56, 0.2, 1.7, 0, 0.66, 0);
  if (dir) coupler(k, dir, reach);
  axles(k, [-0.72, 0.72], r);
  return { g: k.build() };
}
export function carTrucks(off, front, back, kind = freightTruck) {
  return [{ off, ...kind(1, front - off) }, { off: -off, ...kind(-1, back - off) }];
}

// ---- headlight ----
// It shines along +x, or back along -x with dir = -1 (the far end of a double-ended car).
export function headlight(body, x, y, z = 0, dir = 1) {
  const lensM = glowMat(0xffe0a6, 0);
  const lens = new THREE.Mesh(UNIT.sphere, lensM);
  lens.scale.setScalar(0.14);
  lens.position.set(x, y, z);
  lens.userData.ownMatKeepMap = true;
  const glow = glowSprite(0xffd596, 1.4);
  glow.position.set(x + 0.12 * dir, y, z);
  const pool = lightPool(TEX.pool, 0xffd596, 10, 6);
  if (dir < 0) pool.rotation.z = PI;
  pool.position.set(x + 5.2 * dir, -RAIL_TOP + 0.04, z);
  body.add(lens, glow, pool);
  return { lensM, glow, pool, pos: new THREE.Vector3(x, y, z), dir };
}

// ---- passenger fittings ----
// A row of windows down both sides. Pass a glowMat to light them from track power, like the bulbs
// in a tinplate coach.
export function windowRow(k, mat, xs, y, w, h, side) {
  for (const s of [-1, 1]) for (const x of xs) k.box(mat, w, h, 0.04, x, y, s * side);
}
// the rubber gangway at the end of a passenger car
export function gangway(k, x, top = 3.2) {
  k.box(M.plastic, 0.22, top - 1.15, 1.5, x, (top + 1.15) / 2, 0);
}
