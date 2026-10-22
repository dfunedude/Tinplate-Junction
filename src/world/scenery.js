// ===== world/scenery: tabletop accessories kept to the edges of the board =====
// Where each thing stands is also listed in core/keepout.js, which keeps track and wire masts off it.
import * as THREE from 'three';
import { PI } from '../core/geometry.js';
import { scene } from '../render/stage.js';
import { rng, textTexture, TEX } from '../render/textures.js';
import { paint, M, glowMat } from '../render/materials.js';
import { UNIT, Kit } from '../render/kit.js';
import { decalGeo, decal } from '../render/decals.js';

const sceneryLamp = glowMat(0xffd28a, 1.1);
const stationGlow = glowMat(0xffc46e, 0.9);
export let transformerHandle = null;
// Warm light thrown on the table by the lamps; these fade in as the room goes dark.
export const NIGHT_POOLS = [];
function nightPool(root, x, z, sx, sz, peak) {
  const m = new THREE.MeshBasicMaterial({ map: TEX.glow, color: 0xffcf8a, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, opacity: 0 });
  m.userData.peak = peak;
  NIGHT_POOLS.push(m);
  const mesh = new THREE.Mesh(decalGeo, m);
  mesh.rotation.x = -PI / 2; mesh.scale.set(sx, sz, 1); mesh.position.set(x, 0.03, z);
  root.add(mesh);
}

export function buildScenery() {
  const root = new THREE.Group();
  // --- the transformer: bakelite case, two throttle handles, binding posts ---
  {
    const k = new Kit();
    const bake = paint(0x1d1916, 0.35, 0.05, 0.7), handleMat = paint(0x5a2a22, 0.38, 0.05, 0.6);
    k.put(bake, UNIT.cylX, 0, 2.2, 0, 0, 0, 0, 9.5, 2.2, 2.9);
    k.boxY(bake, -4.75, 4.75, 0, 2.2, 2.9);
    k.box(bake, 9.9, 0.3, 6.1, 0, 0.15, 0);
    for (const x of [-2.2, 2.2]) { k.cylY(M.nickel, 0.9, 0.12, x, 4.42, 0); k.cylY(bake, 0.2, 0.35, x, 4.6, 0); }
    for (let i = 0; i < 6; i++) k.cylY(M.nickel, 0.16, 0.45, -3.5 + i * 1.4, 1.0, -2.95);
    k.box(paint(0x2b2420, 0.5, 0.1), 2.6, 0.9, 0.06, 0, 2.2, 2.92);
    const g = k.build();
    const plate = textTexture([['TYPE TW', 0.55], ['250 WATTS', 0.4]], { w: 256, h: 96, color: '#c8a664' });
    decal(g, plate, 2.4, 0.8, 0, 2.2, 2.97, 1);
    const hk = new Kit();
    hk.box(handleMat, 3.0, 0.5, 0.75, 1.3, 0.25, 0);
    hk.cylY(handleMat, 0.38, 0.6, 2.7, 0.3, 0);
    const mkHandle = x => { const h = hk.build(); h.position.set(x, 4.62, 0); g.add(h); return h; };
    transformerHandle = mkHandle(-2.2);
    const idle = mkHandle(2.2); idle.rotation.y = -0.4;
    g.position.set(40.5, 0, 23.5);
    g.rotation.y = -0.35;
    root.add(g);
    // the power cord trails off the front edge of the table
    const cord = new THREE.CatmullRomCurve3([[41.2, 0.5, 20.6], [44.5, 0.25, 21.2], [46.0, 0.25, 25.5], [45.4, 0.3, 29.4], [45.2, 0.45, 30.6], [45.0, -1.5, 31.3], [44.6, -12, 31.8]].map(p => new THREE.Vector3(...p)));
    const cm = new THREE.Mesh(new THREE.TubeGeometry(cord, 60, 0.12, 6), paint(0x2a2622, 0.6, 0));
    cm.castShadow = true;
    root.add(cm);
  }
  // --- a small passenger station with lit windows ---
  {
    const k = new Kit();
    const wall = paint(0xcfc2a2, 0.75, 0), trim = paint(0x6a4a33, 0.6, 0), roof = paint(0x3f5240, 0.6, 0.05), base = paint(0x8d8a82, 0.85, 0);
    k.box(base, 13, 0.5, 7.5, 0, 0.25, 0);
    k.boxY(wall, -4.5, 4.5, 0.5, 4.2, 2.2);
    for (const s of [-1, 1]) {
      k.box(roof, 11.2, 0.22, 3.6, 0, 5.05, s * 1.62, s * 0.5, 0, 0);
      for (const x of [-3, -1.2, 1.2, 3]) { k.box(trim, 1.15, 1.6, 0.05, x, 2.45, s * 2.22); k.box(stationGlow, 0.9, 1.35, 0.06, x, 2.45, s * 2.225); }
      k.box(trim, 9.1, 0.18, 0.08, 0, 0.62, s * 2.23);
      for (const x of [-5.4, 5.4]) k.cylY(trim, 0.09, 4.3, x, 2.65, s * 3.1);
    }
    k.box(trim, 0.08, 2.4, 1.2, 4.52, 1.7, 0);
    k.box(trim, 0.08, 2.4, 1.2, -4.52, 1.7, 0);
    k.box(roof, 11.4, 0.2, 0.25, 0, 5.85, 0);
    k.boxY(trim, -0.4, 0.4, 5.2, 6.4, 0.4, 1.2);
    const g = k.build();
    const sign = textTexture([['MILL CREEK', 0.62]], { w: 512, h: 96, color: '#ece2ce' });
    const board = new THREE.Mesh(UNIT.box, trim); board.scale.set(3.6, 0.6, 0.08); board.position.set(0, 4.35, 2.3); g.add(board);
    decal(g, sign, 3.4, 0.55, 0, 4.35, 2.36, 1);
    g.position.set(-29, 0, -25.6);
    root.add(g);
  }
  // --- lamp posts by the platform ---
  for (const x of [-38.5, -19.5]) {
    const k = new Kit(), green = paint(0x34473a, 0.5, 0.2);
    k.cylY(green, 0.45, 0.3, 0, 0.15, 0); k.cylY(green, 0.1, 5.6, 0, 3.0, 0);
    k.cylY(green, 0.28, 0.22, 0, 5.85, 0);
    k.sphere(sceneryLamp, 0.42, 0.5, 0.42, 0, 6.35, 0);
    k.cylY(green, 0.18, 0.18, 0, 6.9, 0);
    const g = k.build(); g.position.set(x, 0, -23.2); root.add(g);
    nightPool(root, x, -22.4, 24, 22, 0.42);
  }
  nightPool(root, -29, -21.2, 15, 6, 0.3);
  // --- telegraph poles along the back edge ---
  {
    const k = new Kit(), wood = paint(0x5e4632, 0.85, 0), ins = paint(0x7d9a86, 0.3, 0.1, 0.8);
    const wire = paint(0x2a2a2a, 0.6, 0.3);
    for (const z of [-1.3, -0.45, 0.45, 1.3]) k.cylX(wire, 0.022, 48, 18, 8.72, -27.5 + z, 0.022, 0.022);
    for (let x = -6; x <= 42; x += 12) {
      k.cylY(wood, 0.22, 9, x, 4.5, -27.5);
      k.box(wood, 0.25, 0.28, 3.4, x, 8.3, -27.5);
      for (const z of [-1.3, -0.45, 0.45, 1.3]) k.cylY(ins, 0.09, 0.25, x, 8.58, -27.5 + z);
    }
    root.add(k.build());
  }
  // --- bottle-brush trees in the corners ---
  {
    const k = new Kit(), leaf = paint(0x34422c, 0.95, 0), leaf2 = paint(0x3e4d33, 0.95, 0), trunk = paint(0x4a3627, 0.9, 0);
    const r = rng(23);
    const spots = [[-44, -26], [-41.5, -22.5], [-45, -19], [44, -27], [40.5, -26.5], [44.5, -22], [-44, 25.5], [-40.5, 27]];
    for (const [x, z] of spots) {
      const h = 6 + r() * 4, w = 1.6 + r() * 0.7;
      k.cylY(trunk, 0.18, 1.4, x, 0.7, z);
      for (let i = 0; i < 4; i++) {
        const y = 1.2 + i * h / 4.6, rr = w * (1 - i / 5);
        k.put(i % 2 ? leaf : leaf2, UNIT.cone, x, y + h / 6, z, 0, r() * 3, 0, rr, h / 3, rr);
      }
    }
    root.add(k.build());
  }
  scene.add(root);
}
