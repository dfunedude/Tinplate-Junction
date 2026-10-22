// ===== stock/diesels: the F3 cab unit and the GP9 road switcher =====
import * as THREE from 'three';
import { PI } from '../core/geometry.js';
import { css, textTexture } from '../render/textures.js';
import { paint, M, liveryMat } from '../render/materials.js';
import { UNIT, Kit, prismX, loftGeo } from '../render/kit.js';
import { letter } from '../render/decals.js';
import { bodyCoupler, dieselTruck, carTrucks, headlight } from './parts.js';

// ---- F3 cab unit: a lofted body with the bulldog nose ----
let f3Shell = null;
function f3ShellGeo() {
  if (f3Shell) return f3Shell;
  const W = 1.32, B = 1.0, TOP = 3.45, out = [];
  const sec = (x, w, y1) => out.push({ x, w, y0: B, y1, r: Math.min(0.55, w * 0.95, (y1 - B) * 0.48) });
  sec(-6.25, W, TOP); sec(3.55, W, TOP);
  for (let i = 1; i <= 4; i++) { const t = i / 4; sec(3.55 + 0.8 * t, W, TOP - 0.62 * Math.sin(t * PI / 2)); }
  for (let i = 1; i <= 14; i++) {
    const t = i / 14;
    sec(4.35 + 1.95 * t, Math.max(0.03, W * Math.sqrt(Math.max(0, 1 - Math.pow(t, 2.6)))), 1.62 + 1.21 * Math.sqrt(Math.max(0, 1 - t * t)));
  }
  return (f3Shell = loftGeo(out));
}
export function buildF3(liv, li) {
  const planar = { x0: -6.35, x1: 6.45, y0: 0.9, y1: 3.55 };
  const bodyMat = liveryMat('f3-' + li, planar, { roughness: 0.38, metalness: liv.metal, envMapIntensity: 0.8 }, (g, X, Y, W, H) => {
    g.fillStyle = css(liv.base); g.fillRect(0, 0, W, H);
    g.fillStyle = 'rgba(0,0,0,0.38)';
    for (let y = 2.82; y < 3.24; y += 0.075) g.fillRect(X(-5.7), Y(y), X(0.4) - X(-5.7), 2.5);
    const poly = [[6.8, 0.6], [6.8, 3.1], [4.3, 2.95], [3.95, 2.75], [2.6, 2.75], [-1.4, 2.07], [1.4, 1.47], [3.3, 1.11], [4.2, 0.6]];
    g.beginPath(); poly.forEach(([x, y], i) => (i ? g.lineTo(X(x), Y(y)) : g.moveTo(X(x), Y(y)))); g.closePath();
    g.lineJoin = 'round';
    g.strokeStyle = css(liv.edge); g.lineWidth = 17; g.stroke();
    g.strokeStyle = css(liv.stripe); g.lineWidth = 12; g.stroke();
    g.fillStyle = css(liv.bonnet); g.fill();
    g.fillStyle = 'rgba(0,0,0,0.3)'; g.fillRect(0, Y(1.07), W, 3);
  });
  const base = paint(liv.base, 0.4, liv.metal, 0.8);
  const k = new Kit();
  k.put(bodyMat, f3ShellGeo());
  k.put(base, prismX([[4.9, 1.02], [4.9, 0.28], [5.85, 0.28], [6.38, 0.84], [6.38, 1.02]], 1.15));
  bodyCoupler(k, 6.5, 1);
  k.boxY(M.graphite, -2.3, 2.3, 0.42, 1.0, 0.9);           // fuel tank
  for (const s of [-1, 1]) k.cylX(M.graphite, 0.17, 3.0, 0, 0.62, s * 0.95);
  k.box(M.plastic, 0.12, 2.0, 1.5, -6.32, 2.2, 0);          // diaphragm
  // windshield, cab windows, portholes
  for (const s of [-1, 1]) {
    k.put(M.glass, UNIT.box, 3.97, 3.165, s * 0.48, 0, 0, -0.66, 0.6, 0.04, 0.7);
    k.box(M.glass, 0.75, 0.38, 0.04, 3.05, 3.0, s * 1.33);
    for (const px of [-3.2, -1.6, 0.0]) { k.cylZ(M.nickel, 0.31, 0.03, px, 2.28, s * 1.322); k.cylZ(M.glass, 0.25, 0.05, px, 2.28, s * 1.33); }
  }
  for (const fx of [-5.0, -3.85, -1.2]) k.cylY(M.graphite, 0.42, 0.08, fx, 3.47, 0);
  k.cylX(M.nickel, 0.06, 0.4, 3.0, 3.58, 0.25); k.cylX(M.nickel, 0.05, 0.3, 3.0, 3.58, -0.25);
  k.cylX(M.graphite, 0.19, 0.18, 5.88, 2.22, 0);
  const body = k.build();
  letter(body, textTexture([liv.num], { w: 256, h: 128, color: liv.ink }), 0.9, 0.42, 3.05, 2.4, 1.335, false);
  return {
    front: 6.5, back: 6.4, pivots: [3.7, -3.7], body, spin: [],
    trucks: [{ off: 3.7, ...dieselTruck(0) }, { off: -3.7, ...dieselTruck(-1, 6.4 - 3.7) }],
    head: headlight(body, 5.98, 2.22),
  };
}

// ---- GP9 road switcher ----
export function buildGP9(liv, li) {
  const planar = { x0: -5.6, x1: 5.6, y0: 1.2, y1: 3.7 };
  const bodyMat = liveryMat('gp9-' + li, planar, { roughness: 0.45, metalness: 0.1, envMapIntensity: 0.7 }, (g, X, Y, W, H) => {
    g.fillStyle = css(liv.base); g.fillRect(0, 0, W, H);
    g.fillStyle = css(liv.band); g.fillRect(0, Y(1.62), W, Y(1.4) - Y(1.62));
    g.fillStyle = 'rgba(0,0,0,0.28)';
    for (let x = -4.6; x < 1.2; x += 0.72) g.fillRect(X(x), Y(2.9), 2, Y(1.66) - Y(2.9));
    for (let x = 3.4; x < 4.9; x += 0.72) g.fillRect(X(x), Y(2.8), 2, Y(1.66) - Y(2.8));
    for (let y = 2.2; y < 2.86; y += 0.08) g.fillRect(X(-5.05), Y(y), X(-3.9) - X(-5.05), 2);
  });
  const k = new Kit(), deck = M.plastic;
  k.boxY(deck, -5.5, 5.5, 1.12, 1.26, 1.25);
  k.boxY(M.black, -5.45, 5.45, 0.88, 1.12, 1.2);
  k.boxY(bodyMat, -5.1, 1.3, 1.26, 2.95, 0.95);
  k.put(bodyMat, UNIT.cylX, -1.9, 2.95, 0, 0, 0, 0, 6.4, 0.22, 0.95);
  k.boxY(bodyMat, 1.3, 2.95, 1.26, 3.45, 1.2);
  k.put(bodyMat, UNIT.cylX, 2.12, 3.45, 0, 0, 0, 0, 1.9, 0.12, 1.28);
  k.boxY(bodyMat, 2.95, 4.95, 1.26, 2.85, 0.95);
  k.put(bodyMat, UNIT.cylX, 3.95, 2.85, 0, 0, 0, 0, 2.0, 0.2, 0.95);
  for (const s of [-1, 1]) {
    k.box(M.glass, 0.55, 0.5, 0.04, 1.78, 2.95, s * 1.21);
    k.box(M.glass, 0.5, 0.5, 0.04, 2.5, 2.95, s * 1.21);
    k.box(M.glass, 0.04, 0.3, 0.6, 2.965, 3.25, s * 0.55);
    k.box(M.glass, 0.04, 0.28, 0.55, 1.285, 3.3, s * 0.55);
    k.cylX(M.nickel, 0.025, 6.5, -1.95, 2.0, s * 1.19);
    k.cylX(M.nickel, 0.025, 2.4, 4.15, 2.0, s * 1.19);
    for (let x = -5.2; x <= 5.3; x += 1.3) if (x < 1.2 || x > 3.0) k.cylY(M.nickel, 0.025, 0.75, x, 1.63, s * 1.19);
    for (const ex of [-1, 1]) k.box(M.black, 0.35, 0.5, 0.3, ex * 5.25, 0.8, s * 1.0);
    k.cylX(M.graphite, 0.17, 2.4, -0.3, 0.72, s * 0.95);
  }
  for (const ex of [-1, 1]) { k.cylZ(M.nickel, 0.025, 2.4, ex * 5.42, 2.0, 0); k.box(M.black, 0.15, 0.45, 1.3, ex * 5.47, 0.8, 0); }
  k.boxY(M.graphite, -2.0, 1.2, 0.42, 0.9, 0.8);
  for (const fx of [-4.45, -3.45]) k.cylY(M.graphite, 0.38, 0.06, fx, 3.18, 0);
  k.box(M.graphite, 0.35, 0.16, 0.25, -0.6, 3.2, 0); k.box(M.graphite, 0.35, 0.16, 0.25, 0.2, 3.2, 0);
  k.cylX(M.nickel, 0.06, 0.4, 2.2, 3.62, 0.22); k.cylX(M.nickel, 0.05, 0.3, 2.2, 3.62, -0.22);
  k.box(M.graphite, 0.18, 0.3, 0.55, 4.98, 2.6, 0); k.box(M.graphite, 0.18, 0.3, 0.55, -5.13, 2.75, 0);
  const body = k.build();
  // the long hood is at the rear on both sides, so this lettering is not mirrored front to back
  letter(body, textTexture([liv.road], { w: 1024, h: 128, color: liv.ink }), 4.4, 0.48, -1.9, 2.3, 0.955, false);
  letter(body, textTexture([liv.num], { w: 256, h: 128, color: liv.ink }), 0.9, 0.42, 2.12, 2.4, 1.205, false);
  return {
    front: 5.8, back: 5.8, pivots: [3.6, -3.6], body, spin: [],
    trucks: carTrucks(3.6, 5.8, 5.8, dieselTruck),
    head: headlight(body, 5.1, 2.6),
  };
}
