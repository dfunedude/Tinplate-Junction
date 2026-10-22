// ===== render/stage: the WebGL renderer, scene, camera, environment and room lights =====
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

export const canvas = document.getElementById('view');
export const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
const FULL_RATIO = Math.min(window.devicePixelRatio || 1, 2);
renderer.setPixelRatio(FULL_RATIO);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

export const scene = new THREE.Scene();
export const ROOM_COLOR = new THREE.Color(0x1b1612);
scene.background = ROOM_COLOR.clone();
scene.fog = new THREE.Fog(0x1b1612, 180, 420);
export const camera = new THREE.PerspectiveCamera(38, 1, 1, 1200);

const pmrem = new THREE.PMREMGenerator(renderer);
const envTex = pmrem.fromScene(new RoomEnvironment(renderer), 0.04).texture;
scene.environment = envTex;

// ---- lights ----
export const hemi = new THREE.HemisphereLight(0xfff1dc, 0x3b2f25, 0.9);
scene.add(hemi);
export const sun = new THREE.DirectionalLight(0xffecd2, 2.4);
sun.position.set(-38, 120, 52);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -64, right: 64, top: 50, bottom: -50, near: 40, far: 260 });
sun.shadow.bias = -0.0004;
sun.shadow.normalBias = 0.03;
sun.shadow.radius = 3;
scene.add(sun, sun.target);
export const fill = new THREE.DirectionalLight(0xc9d6ff, 0.35);
fill.position.set(60, 40, -40);
scene.add(fill);
export const LIGHT_BASE = { hemi: hemi.intensity, sun: sun.intensity, fill: fill.intensity };

// ---- resolution and graphics quality ----
// Full graphics renders at the screen's pixel ratio (up to 2). On a GPU that can't keep up, where
// frames keep coming slower than about 40 a second, it steps a quarter down towards 1 for each two
// slow seconds or so, and stays there. Fast graphics, chosen by the player, renders at half the
// screen's ratio (never under 0.75) with a quarter of the shadow map: the browser scales the picture
// up, so it's softer, but there are a quarter as many pixels to draw on a retina screen.
// pace(ms) takes each frame's interval and returns true when the ratio has changed (by itself or
// through setFastGraphics), so the caller can size the view again.
const FAST_RATIO = Math.max(0.75, FULL_RATIO / 2);
const SHADOW_SIZE = sun.shadow.mapSize.x, SHADOW_NORMAL_BIAS = sun.shadow.normalBias;
export const graphics = { fast: false };
const pacing = { ratio: FULL_RATIO, sum: 0, n: 0, slow: 0, changed: false };
export function setFastGraphics(on) {
  graphics.fast = on;
  Object.assign(pacing, { ratio: on ? FAST_RATIO : FULL_RATIO, sum: 0, n: 0, slow: 0, changed: true });
  renderer.setPixelRatio(pacing.ratio);
  // a new shadow map at the new size is made on the next frame; its texels are twice the size, so
  // surfaces are pushed twice as far off them to keep clear of shadow acne
  sun.shadow.mapSize.setScalar(on ? SHADOW_SIZE / 2 : SHADOW_SIZE);
  sun.shadow.normalBias = on ? SHADOW_NORMAL_BIAS * 2 : SHADOW_NORMAL_BIAS;
  if (sun.shadow.map) { sun.shadow.map.dispose(); sun.shadow.map = null; }
}
export function pace(ms) {
  if (pacing.changed) { pacing.changed = false; return true; }
  if (pacing.ratio <= 1 || ms > 250) return false;   // a stall, or a tab coming back, says nothing about the GPU
  pacing.sum += ms;
  if (++pacing.n < 60) return false;
  const mean = pacing.sum / pacing.n;
  pacing.sum = pacing.n = 0;
  pacing.slow = mean > 24 ? pacing.slow + 1 : 0;
  if (pacing.slow < 2) return false;
  pacing.slow = 0;
  pacing.ratio = Math.max(1, pacing.ratio - 0.25);
  renderer.setPixelRatio(pacing.ratio);
  return true;
}
