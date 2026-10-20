// ===== stock/freight: boxcar, hopper, tank car, gondola, log car and caboose =====
import * as THREE from 'three';
import { textTexture } from '../render/textures.js';
import { paint, M, glowMat } from '../render/materials.js';
import { UNIT, Kit, prismX } from '../render/kit.js';
import { letter, tankDecal } from '../render/decals.js';
import { carTrucks } from './parts.js';

export function buildBoxcar(liv) {
  const mat = paint(liv.base, 0.6, 0.05), dark = paint(new THREE.Color(liv.base).multiplyScalar(0.82).getHex(), 0.6, 0.05);
  const k = new Kit(), W = 1.22, y0 = 1.0, y1 = 3.55;
  k.boxY(mat, -4.6, 4.6, y0, y1, W);
  for (const s of [-1, 1]) {
    k.box(mat, 9.36, 0.1, 1.36, 0, y1 + 0.08, s * 0.62, s * 0.1, 0, 0);
    for (let x = -4.2; x <= 4.21; x += 0.7) if (Math.abs(x) > 1.1) k.box(mat, 0.07, y1 - y0 - 0.12, 0.05, x, (y0 + y1) / 2, s * (W + 0.02));
    k.box(dark, 1.9, 2.3, 0.06, 0, (y0 + y1) / 2 - 0.04, s * (W + 0.05));
    k.box(M.graphite, 4.3, 0.08, 0.08, 0.9, y1 - 0.12, s * (W + 0.08));
    k.box(M.graphite, 4.3, 0.06, 0.06, 0.9, y0 + 0.12, s * (W + 0.08));
    for (const ex of [-1, 1]) for (let y = 1.4; y < 3.3; y += 0.32) k.box(M.graphite, 0.05, 0.05, 0.42, ex * 4.63, y, s * 0.82);
  }
  k.box(M.graphite, 9.0, 0.06, 0.44, 0, y1 + 0.22, 0);
  k.box(M.black, 8.4, 0.25, 0.42, 0, 0.86, 0);
  k.cylX(M.black, 0.28, 0.04, 4.66, 3.15, 0.5);
  const body = k.build();
  letter(body, textTexture([[liv.road, 0.78], [liv.num, 0.6]], { w: 512, h: 192, color: liv.ink }), 3.3, 1.24, -2.65, 2.55, W + 0.085);
  letter(body, textTexture([['CAPY 100000', 0.6], ['LD LMT 128500', 0.6], ['LT WT 41200', 0.6]], { w: 512, h: 192, color: liv.ink, weight: 600 }), 2.0, 0.75, 2.75, 2.05, W + 0.085);
  return { front: 5.0, back: 5.0, pivots: [3.25, -3.25], body, spin: [], trucks: carTrucks(3.25, 5.0, 5.0) };
}
export function buildHopper(liv) {
  const mat = paint(liv.base, 0.62, 0.08), k = new Kit();
  for (const s of [-1, 1]) {
    k.box(mat, 7.4, 1.45, 0.07, 0, 2.28, s * 1.18);
    for (let x = -3.3; x <= 3.31; x += 0.94) k.box(mat, 0.09, 1.5, 0.06, x, 2.28, s * 1.24);
    k.box(mat, 7.5, 0.1, 0.14, 0, 3.0, s * 1.2);
    k.box(mat, 7.5, 0.12, 0.12, 0, 1.56, s * 1.2);
  }
  for (const ex of [-1, 1]) { k.box(mat, 0.07, 1.45, 2.4, ex * 3.7, 2.28, 0); k.box(M.black, 0.5, 0.08, 2.3, ex * 3.95, 1.25, 0); }
  k.put(mat, prismX([[-1.65, 1.56], [1.65, 1.56], [1.25, 0.55], [0.15, 0.95], [-0.15, 0.95], [-1.25, 0.55]], 1.0));
  k.box(M.black, 7.6, 0.2, 0.36, 0, 1.2, 0);
  k.box(M.coal, 7.25, 0.2, 2.25, 0, 2.86, 0);
  for (const x of [-2.4, 0, 2.4]) k.sphere(M.coal, 1.25, 0.28, 1.0, x, 2.9, 0);
  k.cylX(M.black, 0.26, 0.04, 3.76, 2.7, 0.5);
  const body = k.build();
  letter(body, textTexture([[liv.road, 0.72], [liv.num, 0.55]], { w: 512, h: 192, color: liv.ink }), 3.0, 1.1, 0, 2.3, 1.29);
  return { front: 4.3, back: 4.3, pivots: [2.55, -2.55], body, spin: [], trucks: carTrucks(2.55, 4.3, 4.3) };
}
export function buildTank(liv) {
  const mat = paint(liv.base, 0.42, liv.metal, 0.6), k = new Kit(), R = 1.05, CY = 2.25;
  k.put(mat, UNIT.cylX, 0, CY, 0, 0, 0, 0, 7.6, R, R);
  for (const ex of [-1, 1]) k.sphere(mat, 0.38, R, R, ex * 3.8, CY, 0);
  for (const dx of [-1.45, 1.45]) {
    k.cylY(mat, 0.46, 0.55, dx, CY + R + 0.12, 0);
    k.sphere(mat, 0.48, 0.15, 0.48, dx, CY + R + 0.4, 0);
    k.cylY(M.graphite, 0.08, 0.16, dx, CY + R + 0.56, 0);
  }
  for (const bx of [-2.6, 2.6]) k.cylX(M.black, R + 0.015, 0.05, bx, CY, 0);
  k.box(M.black, 8.6, 0.26, 0.46, 0, 0.98, 0);
  for (const sx of [-2.9, 2.9]) k.box(M.black, 0.45, 0.42, 1.7, sx, 1.25, 0);
  for (const ex of [-1, 1]) k.box(M.black, 0.9, 0.08, 2.5, ex * 4.15, 1.15, 0);
  for (const s of [-1, 1]) {
    k.box(M.black, 8.0, 0.05, 0.24, 0, 1.18, s * 1.12);
    k.cylX(M.black, 0.025, 7.2, 0, CY + 0.35, s * (R + 0.08));
    for (let y = 1.35; y < CY + 0.1; y += 0.28) k.box(M.black, 0.05, 0.04, 0.36, 1.0, y, s * 1.1);
  }
  const body = k.build();
  tankDecal(body, textTexture([[liv.road, 0.72], [liv.num, 0.55]], { w: 512, h: 192, color: liv.ink }), R + 0.012, CY, 3.6, 1.1, 0);
  return { front: 4.7, back: 4.7, pivots: [3.0, -3.0], body, spin: [], trucks: carTrucks(3.0, 4.7, 4.7) };
}
export function buildGondola(liv) {
  const mat = paint(liv.base, 0.62, 0.06), k = new Kit();
  k.box(mat, 9.0, 0.18, 2.4, 0, 1.08, 0);
  for (const s of [-1, 1]) {
    k.box(mat, 9.0, 0.85, 0.08, 0, 1.58, s * 1.17);
    for (let x = -4.1; x <= 4.11; x += 0.75) k.box(mat, 0.08, 0.85, 0.05, x, 1.58, s * 1.23);
    k.box(mat, 9.1, 0.08, 0.14, 0, 2.02, s * 1.19);
  }
  for (const ex of [-1, 1]) k.box(mat, 0.08, 0.85, 2.4, ex * 4.5, 1.58, 0);
  k.box(M.black, 8.2, 0.24, 0.4, 0, 0.86, 0);
  const barrel = paint(0x6a4a30, 0.75, 0), hoop = M.graphite;
  for (const x of [-3.0, -1.0, 1.0, 3.0]) for (const z of [-0.5, 0.5]) {
    k.cylY(barrel, 0.4, 0.8, x, 1.57, z);
    k.cylY(hoop, 0.415, 0.05, x, 1.32, z); k.cylY(hoop, 0.415, 0.05, x, 1.82, z);
  }
  const body = k.build();
  letter(body, textTexture([[liv.road + '   ' + liv.num, 0.6]], { w: 1024, h: 96, color: liv.ink }), 4.6, 0.43, 0, 1.55, 1.285);
  return { front: 4.9, back: 4.9, pivots: [3.2, -3.2], body, spin: [], trucks: carTrucks(3.2, 4.9, 4.9) };
}
export function buildFlatcar(liv) {
  const mat = paint(liv.base, 0.6, 0.06), k = new Kit(), deck = M.wood;
  k.box(deck, 9.6, 0.2, 2.3, 0, 1.12, 0);
  for (const s of [-1, 1]) {
    k.box(mat, 9.7, 0.3, 0.08, 0, 1.03, s * 1.17);
    for (let x = -4.2; x <= 4.21; x += 1.68) k.box(M.black, 0.1, 0.95, 0.1, x, 1.68, s * 1.1);
  }
  k.box(mat, 8.8, 0.3, 0.5, 0, 0.82, 0);
  const endWood = paint(0xa07a52, 0.85, 0);
  const logs = [[-0.47, 1.64], [0.47, 1.64], [0, 2.38]];
  for (const [z, y] of logs) { k.cylX(M.bark, 0.42, 8.8, 0, y, z); for (const ex of [-1, 1]) k.cylX(endWood, 0.38, 0.03, ex * 4.41, y, z); }
  for (const x of [-2.6, 2.6]) k.box(M.graphite, 0.05, 0.05, 1.9, x, 2.82, 0);
  const body = k.build();
  letter(body, textTexture([[liv.num, 0.7]], { w: 256, h: 64, color: liv.ink }), 0.9, 0.24, 2.6, 1.04, 1.215);
  return { front: 5.0, back: 5.0, pivots: [3.3, -3.3], body, spin: [], trucks: carTrucks(3.3, 5.0, 5.0) };
}
export function buildCaboose(liv) {
  const mat = paint(liv.base, 0.6, 0.05), k = new Kit();
  const win = glowMat(0xffc777, 0);
  const marker = glowMat(0xd2452e, 0);
  k.box(M.black, 7.9, 0.18, 2.5, 0, 1.1, 0);
  k.boxY(mat, -3.0, 3.0, 1.2, 3.25, 1.15);
  k.box(mat, 6.5, 0.1, 2.55, 0, 3.3, 0);
  k.box(M.graphite, 6.3, 0.05, 0.42, 0, 3.38, 0);
  k.boxY(mat, -0.65, 0.65, 3.3, 4.05, 0.82);
  k.box(mat, 1.6, 0.08, 1.92, 0, 4.1, 0);
  for (const s of [-1, 1]) {
    for (const x of [-1.8, 1.8]) { k.box(M.graphite, 0.66, 0.66, 0.03, x, 2.55, s * 1.16); k.box(win, 0.52, 0.52, 0.04, x, 2.55, s * 1.165); }
    for (const x of [-0.3, 0.3]) k.box(win, 0.38, 0.34, 0.04, x, 3.7, s * 0.825);
    for (const ex of [-1, 1]) {
      k.box(M.nickel, 0.035, 1.0, 0.035, ex * 3.85, 1.7, s * 1.05);
      k.box(M.black, 0.4, 0.08, 0.35, ex * 3.6, 0.72, s * 1.05);
    }
  }
  for (const ex of [-1, 1]) {
    k.box(M.black, 0.95, 0.1, 2.3, ex * 3.45, 1.15, 0);
    k.box(M.nickel, 0.035, 0.035, 2.1, ex * 3.85, 2.2, 0);
    k.box(M.graphite, 0.04, 1.6, 0.8, ex * 3.01, 2.05, 0);
    k.box(win, 0.04, 0.5, 0.4, ex * 3.02, 2.5, 0);
    k.box(win, 0.04, 0.26, 0.5, ex * 0.66, 3.7, 0);
  }
  for (const s of [-1, 1]) k.box(marker, 0.12, 0.18, 0.12, -3.08, 3.0, s * 1.05);
  k.cylY(M.black, 0.09, 0.6, -1.9, 3.6, 0.4);
  const body = k.build();
  letter(body, textTexture([[liv.road, 0.75]], { w: 512, h: 96, color: liv.ink }), 3.2, 0.42, 0, 1.75, 1.17);
  letter(body, textTexture([[liv.num, 0.75]], { w: 256, h: 96, color: liv.ink }), 1.2, 0.36, 0, 3.0, 1.17);
  return {
    front: 4.2, back: 4.2, pivots: [2.4, -2.4], body, spin: [], trucks: carTrucks(2.4, 4.2, 4.2),
    lamps: [win, marker],
  };
}
