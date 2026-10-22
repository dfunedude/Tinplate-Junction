// ===== render/materials: shared materials, registered so the room lamp can dim them =====
import * as THREE from 'three';
import { scene, ROOM_COLOR, hemi, sun, fill, LIGHT_BASE } from './stage.js';
import { makeCanvas, canvasTex, TEX } from './textures.js';

// The room lamp dims reflections on every material: room.env is the current level (1 by day), and
// each material keeps its full-light strength in userData.env. New materials start at the current
// level, so a train built after dark matches the rest of the room.
export const room = { env: 1 };
// Shared materials last the whole session.
export const MATS = [];
export function stdMat(o) {
  const env = o.envMapIntensity ?? 0.6;
  const m = new THREE.MeshStandardMaterial({ ...o, envMapIntensity: env * room.env });
  m.userData.env = env;
  MATS.push(m);
  return m;
}
// Materials made for one model (lettering, lamp lenses). The train's come and go, so they're kept in
// a Set, and dropMat takes them out again.
export const OWN_MATS = new Set();
export function decalMat(tex, rough = 0.6) {
  const m = new THREE.MeshStandardMaterial({ map: tex, transparent: true, roughness: rough, metalness: 0, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4, envMapIntensity: 0.55 * room.env });
  m.userData.env = 0.55;
  OWN_MATS.add(m);
  return m;
}
export function dropMat(m) {
  OWN_MATS.delete(m);
  m.dispose();
}
// The room lamp: L is 1 with it on and 0 with it off. The lights, the room behind the table and the
// reflections on every registered material follow it.
export function setRoomLight(L) {
  hemi.intensity = LIGHT_BASE.hemi * (0.1 + 0.9 * L);
  sun.intensity = LIGHT_BASE.sun * (0.06 + 0.94 * L);
  fill.intensity = LIGHT_BASE.fill * (0.25 + 0.75 * L);
  room.env = 0.15 + 0.85 * L;
  for (const m of MATS) m.envMapIntensity = m.userData.env * room.env;
  for (const m of OWN_MATS) m.envMapIntensity = m.userData.env * room.env;
  scene.background.copy(ROOM_COLOR).multiplyScalar(0.45 + 0.55 * L);
  scene.fog.color.copy(scene.background);
}
const paintCache = new Map();
export function paint(hex, rough = 0.5, metal = 0.1, env = 0.55) {
  const key = hex + '|' + rough + '|' + metal + '|' + env;
  if (!paintCache.has(key)) paintCache.set(key, stdMat({ color: hex, roughness: rough, metalness: metal, envMapIntensity: env }));
  return paintCache.get(key);
}

export const M = {
  rail: stdMat({ color: 0xa3a7aa, metalness: 0.85, roughness: 0.36, envMapIntensity: 0.5 }),
  tie: stdMat({ color: 0x1f1f21, metalness: 0.5, roughness: 0.55, envMapIntensity: 0.5 }),
  fiber: stdMat({ color: 0x4b3527, roughness: 0.85, metalness: 0 }),
  plastic: stdMat({ color: 0x1a1a1c, roughness: 0.48, metalness: 0.05, envMapIntensity: 0.6 }),
  black: stdMat({ color: 0x1c1c1e, roughness: 0.4, metalness: 0.3, envMapIntensity: 0.7 }),
  graphite: stdMat({ color: 0x323336, roughness: 0.55, metalness: 0.45 }),
  nickel: stdMat({ color: 0xd9d9d4, roughness: 0.22, metalness: 1.0, envMapIntensity: 1.1 }),
  steel: stdMat({ color: 0x4b4d52, roughness: 0.42, metalness: 0.8, envMapIntensity: 0.8 }),
  glass: stdMat({ color: 0x0c0f12, roughness: 0.12, metalness: 0.3, envMapIntensity: 1.0 }),
  coal: stdMat({ color: 0xffffff, map: TEX.coal, roughness: 0.7, metalness: 0.2 }),
  wood: stdMat({ color: 0x6d4c33, roughness: 0.8, metalness: 0 }),
  bark: stdMat({ color: 0x4a3627, roughness: 0.95, metalness: 0 }),
  driverFace: stdMat({ map: TEX.spoke, roughness: 0.35, metalness: 0.5, envMapIntensity: 0.8 }),
};
// Windows sit on the surface of a body, so they cast no shadow of their own (see castsShadow in kit.js).
M.glass.userData.surface = true;
// lamp-type materials whose glow follows track power; the glass itself dims with the room. Like
// windows they cast no shadow; set userData.surface = false on one that stands clear of its model.
export function glowMat(hex, intensity = 1) {
  const m = new THREE.MeshStandardMaterial({ color: 0x111111, emissive: hex, emissiveIntensity: intensity, roughness: 0.3, envMapIntensity: room.env });
  m.userData.env = 1;
  m.userData.surface = true;
  OWN_MATS.add(m);
  return m;
}

// A paint scheme drawn as a side elevation (see stock/liveries.js) and projected onto a body from the
// side: planar is the box { x0, x1, y0, y1 } the canvas covers. draw(g, X, Y, W, H) paints the canvas,
// with X and Y turning body coordinates into canvas pixels. Made once per key and kept.
const liveryMatCache = new Map();
export function liveryMat(key, planar, opts, draw) {
  if (!liveryMatCache.has(key)) {
    const c = makeCanvas(1024, 256), g = c.getContext('2d');
    const X = x => (x - planar.x0) / (planar.x1 - planar.x0) * c.width;
    const Y = y => (1 - (y - planar.y0) / (planar.y1 - planar.y0)) * c.height;
    draw(g, X, Y, c.width, c.height);
    const m = stdMat({ map: canvasTex(c), ...opts });
    m.userData.planar = planar;
    liveryMatCache.set(key, m);
  }
  return liveryMatCache.get(key);
}
