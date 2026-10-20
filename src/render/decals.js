// ===== render/decals: lettering planes for cars, signs and nameplates =====
import * as THREE from 'three';
import { PI } from '../core/geometry.js';
import { decalMat } from './materials.js';

export const decalGeo = new THREE.PlaneGeometry(1, 1);
export function decal(parent, tex, w, h, x, y, z, side) {
  const m = new THREE.Mesh(decalGeo, decalMat(tex));
  m.userData.ownMat = true;
  m.scale.set(w, h, 1);
  m.position.set(x, y, side * z);
  if (side < 0) m.rotation.y = PI;
  parent.add(m);
  return m;
}
// Letter both sides. mirror=true keeps the layout as each side's viewer reads it (like a real car).
export function letter(parent, tex, w, h, x, y, z, mirror = true) {
  decal(parent, tex, w, h, x, y, z, 1);
  decal(parent, tex, w, h, mirror ? -x : x, y, z, -1);
}
export function tankDecal(parent, tex, R, cy, w, span, x) {
  const nx = 10, ny = 6, pos = [], nor = [], uv = [], idx = [];
  for (let j = 0; j <= ny; j++) {
    const a = -span / 2 + span * j / ny;
    for (let i = 0; i <= nx; i++) {
      pos.push(-w / 2 + w * i / nx, R * Math.sin(a), R * Math.cos(a));
      nor.push(0, Math.sin(a), Math.cos(a));
      uv.push(i / nx, j / ny);
    }
  }
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
    const a = j * (nx + 1) + i, b = a + 1, c = a + nx + 2, d = a + nx + 1;
    idx.push(a, b, c, a, c, d);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  for (const side of [1, -1]) {
    const m = new THREE.Mesh(g, decalMat(tex, 0.5));
    m.userData.ownMat = true; m.userData.owned = true;
    m.position.set(side * x, cy, 0);
    if (side < 0) m.rotation.y = PI;
    parent.add(m);
  }
}
