// ===== render/stage: the WebGL renderer, scene, camera, environment and room lights =====
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

export const canvas = document.getElementById('view');
export const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
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
