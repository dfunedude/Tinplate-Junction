// ===== render/decals: lettering planes for cars, signs and nameplates, and the glows lamps throw =====
import * as THREE from 'three';
import { PI } from '../core/geometry.js';
import { TEX } from './textures.js';
import { decalMat } from './materials.js';

const decalGeo = new THREE.PlaneGeometry(1, 1);
// One mesh holding a w x h plane at each [x, y, z, yaw]: a plane faces +z, then turns yaw about the
// vertical. The planes share the texture and one material, so both sides of a car cost one draw call.
function decalMesh(parent, tex, w, h, quads, rough) {
  const pos = [], nor = [], uv = [], idx = [];
  quads.forEach(([x, y, z, yaw], i) => {
    const c = Math.cos(yaw), s = Math.sin(yaw);
    for (const [u, v] of [[0, 1], [1, 1], [0, 0], [1, 0]]) {
      const lx = (u - 0.5) * w;
      pos.push(x + lx * c, y + (v - 0.5) * h, z - lx * s);
      nor.push(s, 0, c);
      uv.push(u, v);
    }
    const a = i * 4;
    idx.push(a, a + 2, a + 1, a + 2, a + 3, a + 1);
  });
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  const m = new THREE.Mesh(g, decalMat(tex, rough));
  m.userData.ownMat = true; m.userData.owned = true;
  parent.add(m);
  return m;
}
// A single plane on the +z side (side = 1) or the -z side (side = -1), facing out.
export function decal(parent, tex, w, h, x, y, z, side) {
  return decalMesh(parent, tex, w, h, [[x, y, side * z, side < 0 ? PI : 0]]);
}
// Letter both sides. mirror=true keeps the layout as each side's viewer reads it (like a real car).
export function letter(parent, tex, w, h, x, y, z, mirror = true) {
  return decalMesh(parent, tex, w, h, [[x, y, z, 0], [mirror ? -x : x, y, -z, PI]]);
}
// Lettering on the front end of a car (at +x), facing forward.
export function frontDecal(parent, tex, w, h, x, y, z = 0) {
  return decalMesh(parent, tex, w, h, [[x, y, z, PI / 2]]);
}
// The same lettering on both ends of a double-ended car, at +x and -x, each facing out.
export function endDecals(parent, tex, w, h, x, y) {
  return decalMesh(parent, tex, w, h, [[x, y, 0, PI / 2], [-x, y, 0, -PI / 2]]);
}
// Lettering wrapped round a tank of radius R, on both sides.
export function tankDecal(parent, tex, R, cy, w, span, x) {
  const nx = 10, ny = 6, pos = [], nor = [], uv = [], idx = [];
  for (const side of [1, -1]) {
    const base = pos.length / 3;
    for (let j = 0; j <= ny; j++) {
      const a = -span / 2 + span * j / ny;
      for (let i = 0; i <= nx; i++) {
        // the far side is the near one turned half round the vertical
        pos.push(side * (x - w / 2 + w * i / nx), cy + R * Math.sin(a), side * R * Math.cos(a));
        nor.push(0, Math.sin(a), side * Math.cos(a));
        uv.push(i / nx, j / ny);
      }
    }
    for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
      const a = base + j * (nx + 1) + i, b = a + 1, c = a + nx + 2, d = a + nx + 1;
      idx.push(a, b, c, a, c, d);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  const m = new THREE.Mesh(g, decalMat(tex, 0.5));
  m.userData.ownMat = true; m.userData.owned = true;
  parent.add(m);
  return m;
}

// ---- light ----
// The soft halo of a lamp, or the flash of a spark. It starts dark and hidden: set its opacity with
// showGlow, which hides it again at zero so it costs nothing while it's out.
export function glowSprite(color, size) {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: TEX.glow, color, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, opacity: 0 }));
  s.scale.setScalar(size);
  s.visible = false;
  s.userData.ownMatKeepMap = true;
  return s;
}
// Light thrown on the table: a flat w x d patch with a soft texture (TEX.glow, TEX.pool), lying on y = 0
// of its parent. Dark and hidden to start with, like glowSprite.
export function lightPool(tex, color, w, d) {
  const m = new THREE.Mesh(decalGeo, new THREE.MeshBasicMaterial({ map: tex, color, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, opacity: 0 }));
  m.rotation.x = -PI / 2;
  m.scale.set(w, d, 1);
  m.visible = false;
  m.userData.ownMatKeepMap = true;
  return m;
}
export function showGlow(obj, opacity) {
  obj.material.opacity = opacity;
  obj.visible = opacity > 0;
}
