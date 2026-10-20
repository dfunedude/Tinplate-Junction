// ===== render/materials: shared materials, registered so the room lamp can dim them =====
import * as THREE from 'three';
import { TEX } from './textures.js';

// Every material is registered so the room lamp can dim reflections with the lights.
export const MATS = [];
export function stdMat(o) {
  const env = o.envMapIntensity ?? 0.6;
  const m = new THREE.MeshStandardMaterial({ ...o, envMapIntensity: env });
  m.userData.env = env;
  MATS.push(m);
  return m;
}
// Lettering decals come and go with the train, so they're tracked separately and dimmed with the room.
export const DECAL_MATS = new Set();
export const room = { env: 1 };
export function decalMat(tex, rough = 0.6) {
  const m = new THREE.MeshStandardMaterial({ map: tex, transparent: true, roughness: rough, metalness: 0, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4, envMapIntensity: 0.55 * room.env });
  m.userData.env = 0.55;
  DECAL_MATS.add(m);
  return m;
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
// lamp-type materials whose glow follows track power
export function glowMat(hex, intensity = 1) {
  return new THREE.MeshStandardMaterial({ color: 0x111111, emissive: hex, emissiveIntensity: intensity, roughness: 0.3 });
}
