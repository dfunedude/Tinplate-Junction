// ===== world/room: the 8 x 5 ft table, its legs, the floor and the rug =====
import * as THREE from 'three';
import { PI, TAU, TABLE_W, TABLE_D } from '../core/geometry.js';
import { scene } from '../render/stage.js';
import { makeCanvas, canvasTex, feltTexture, woodTexture } from '../render/textures.js';
import { stdMat, paint } from '../render/materials.js';
import { Kit, pin } from '../render/kit.js';

const FLOOR_Y = -30;

export function buildRoom() {
  const g = new THREE.Group();
  const feltTex = feltTexture();
  const top = new THREE.Mesh(new THREE.PlaneGeometry(TABLE_W, TABLE_D), stdMat({ map: feltTex, roughness: 0.95, metalness: 0, envMapIntensity: 0.25 }));
  top.rotation.x = -PI / 2;
  top.receiveShadow = true;
  g.add(top);

  const fasciaTex = woodTexture('#6a4a33', '40,24,14');
  fasciaTex.wrapS = fasciaTex.wrapT = THREE.RepeatWrapping;
  const fascia = stdMat({ map: fasciaTex, roughness: 0.55, metalness: 0, envMapIntensity: 0.5 });
  // the boards round the edge, the board under the felt and the legs: one mesh for each material
  const k = new Kit();
  const T = 0.75, Hh = 4.5, lip = 0.18;
  const mk = (w, d, x, z) => k.box(fascia, w, Hh, d, x, lip - Hh / 2, z);
  mk(TABLE_W + 2 * T, T, 0, TABLE_D / 2 + T / 2);
  mk(TABLE_W + 2 * T, T, 0, -TABLE_D / 2 - T / 2);
  mk(T, TABLE_D, TABLE_W / 2 + T / 2, 0);
  mk(T, TABLE_D, -TABLE_W / 2 - T / 2, 0);
  // the plywood board under the felt: it must cast, or overhead light (and the shadows of
  // everything on the table) falls straight through onto the floor
  k.box(paint(0x2a2018, 0.9, 0), TABLE_W, 0.75, TABLE_D, 0, -0.4, 0);
  // the board also shuts out most of the room's ambient light, so darken the floor beneath it
  const W = 256, H = 176, aoC = makeCanvas(W, H), ag = aoC.getContext('2d'), img = ag.createImageData(W, H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const dx = Math.max(0, Math.abs(x / W - 0.5) - 0.33), dy = Math.max(0, Math.abs(y / H - 0.5) - 0.3);
    const t = Math.min(1, Math.hypot(dx, dy) / 0.17);
    img.data[(y * W + x) * 4 + 3] = Math.round(255 * 0.62 * (1 - t * t * (3 - 2 * t)));
  }
  ag.putImageData(img, 0, 0);
  const ao = new THREE.Mesh(new THREE.PlaneGeometry(TABLE_W + 26, TABLE_D + 26), new THREE.MeshBasicMaterial({ map: canvasTex(aoC, false), color: 0x000000, transparent: true, depthWrite: false }));
  ao.rotation.x = -PI / 2; ao.position.y = FLOOR_Y + 0.12; ao.renderOrder = 1;
  g.add(ao);
  const legMat = paint(0x3b2a1e, 0.7, 0);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) k.box(legMat, 3, -FLOOR_Y - 4, 3, sx * (TABLE_W / 2 - 5), (FLOOR_Y - 4) / 2, sz * (TABLE_D / 2 - 5));
  g.add(k.build());
  const floorTex = woodTexture('#3a2a1f', '18,10,6', 1024, 1024, 8);
  floorTex.wrapS = floorTex.wrapT = THREE.RepeatWrapping;
  floorTex.repeat.set(6, 6);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(900, 900), stdMat({ map: floorTex, roughness: 0.7, metalness: 0, envMapIntensity: 0.2 }));
  floor.rotation.x = -PI / 2; floor.position.y = FLOOR_Y; floor.receiveShadow = true;
  g.add(floor);
  // a braided rug under the table
  const rugC = makeCanvas(512, 512), rg = rugC.getContext('2d');
  const rings = ['#4f3f33', '#5a493b', '#4a3b30', '#5e4d3e', '#53433a', '#584638'];
  for (let i = 0; i < 26; i++) {
    rg.fillStyle = rings[i % rings.length];
    rg.beginPath(); rg.ellipse(256, 256, 256 - i * 9.6, 256 - i * 9.6, 0, 0, TAU); rg.fill();
  }
  const rug = new THREE.Mesh(new THREE.CircleGeometry(1, 64), stdMat({ map: canvasTex(rugC), roughness: 1, metalness: 0, envMapIntensity: 0.1 }));
  rug.scale.set(110, 80, 1); rug.rotation.x = -PI / 2; rug.position.y = FLOOR_Y + 0.05; rug.receiveShadow = true;
  g.add(rug);
  pin(g);
  scene.add(g);
}
