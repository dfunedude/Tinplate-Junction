// ===== stock/passenger: a modern passenger diesel, with single-level and bi-level coaches =====
import { css, textTexture } from '../render/textures.js';
import { M, glowMat, liveryMat } from '../render/materials.js';
import { UNIT, Kit, prismX, loftGeo } from '../render/kit.js';
import { letter } from '../render/decals.js';
import { bodyCoupler, dieselTruck, passengerTruck, carTrucks, headlight, windowRow, gangway } from './parts.js';

const PW = 1.25;               // half-width of the passenger cars
const COACH_LIGHT = 0xe0c48c;  // warm interior bulbs

// ---- Charger-style passenger diesel: a long carbody, a raked windscreen and a rounded nose ----
let chargerShell = null;
function chargerShellGeo() {
  if (chargerShell) return chargerShell;
  const W = 1.27, B = 1.05, TOP = 3.55, out = [];
  const sec = (x, w, y1) => out.push({ x, w, y0: B, y1, r: Math.min(0.32, w * 0.9, (y1 - B) * 0.45) });
  sec(-5.6, W, TOP); sec(3.55, W, TOP);
  sec(4.45, W, 2.68);                                     // the windscreen falls at 45°
  for (let i = 1; i <= 8; i++) { const t = i / 8; sec(4.45 + 1.5 * t, W * Math.sqrt(1 - 0.55 * t ** 3), 2.68 - 0.95 * t ** 1.6); }
  return (chargerShell = loftGeo(out));
}
export function buildCharger(liv, li) {
  const planar = { x0: -5.7, x1: 6.35, y0: 1.0, y1: 3.6 };
  const bodyMat = liveryMat('charger-' + li, planar, { roughness: 0.34, metalness: liv.metal, envMapIntensity: 0.85 }, (g, X, Y, W, H) => {
    g.fillStyle = css(liv.base); g.fillRect(0, 0, W, H);
    // a swoosh that sweeps up from the rear and wraps the nose
    g.fillStyle = css(liv.stripe);
    g.beginPath(); g.moveTo(X(-5.7), Y(1.0)); g.lineTo(X(-5.7), Y(1.5));
    g.bezierCurveTo(X(-1), Y(1.55), X(2.2), Y(1.95), X(3.75), Y(2.72));
    g.lineTo(X(6.4), Y(2.72)); g.lineTo(X(6.4), Y(1.0)); g.closePath(); g.fill();
    g.strokeStyle = css(liv.accent); g.lineWidth = 6;
    g.beginPath(); g.moveTo(X(-5.7), Y(1.66)); g.bezierCurveTo(X(-1), Y(1.71), X(2.2), Y(2.11), X(3.62), Y(2.86)); g.stroke();
    // engine-room louvres
    g.fillStyle = 'rgba(0,0,0,0.32)';
    for (let x = -4.95; x < -2.5; x += 0.24) g.fillRect(X(x), Y(3.22), 3, Y(2.42) - Y(3.22));
  });
  const k = new Kit();
  k.put(bodyMat, chargerShellGeo());
  for (const s of [-1, 1]) {
    k.put(M.glass, UNIT.box, 4.015, 3.135, s * 0.5, 0, 0, -0.769, 1.0, 0.04, 0.82);   // windscreen panes on the slope
    k.box(M.glass, 0.55, 0.42, 0.04, 3.05, 2.98, s * 1.275);                        // cab side window
    k.box(M.black, 0.4, 0.5, 0.3, 3.3, 0.8, s * 1.0);                               // cab steps
    k.box(M.black, 0.4, 0.5, 0.3, -5.25, 0.8, s * 1.0);
    k.cylX(M.graphite, 0.16, 2.6, -0.2, 0.7, s * 0.95);                             // air reservoirs
  }
  k.put(M.graphite, prismX([[4.7, 1.05], [4.7, 0.32], [5.5, 0.28], [6.22, 0.82], [6.22, 1.05]], 1.12));   // pilot and plow
  bodyCoupler(k, 6.3, 1);
  k.boxY(M.graphite, -2.2, 2.0, 0.42, 1.05, 0.95);                               // fuel tank
  k.box(M.plastic, 0.12, 2.0, 1.5, -5.66, 2.2, 0);                               // rear diaphragm
  for (const fx of [-4.85, -3.95]) k.cylY(M.graphite, 0.36, 0.06, fx, 3.58, 0);   // radiator fans
  k.box(M.graphite, 0.7, 0.14, 0.4, -2.0, 3.6, 0);                               // exhaust
  k.cylX(M.nickel, 0.06, 0.45, 2.75, 3.66, 0.22); k.cylX(M.nickel, 0.05, 0.35, 2.75, 3.66, -0.22);   // horn
  const ditch = glowMat(0xfff0cf, 0);
  for (const s of [-1, 1]) k.sphere(ditch, 0.08, 0.08, 0.08, 6.02, 1.14, s * 0.78);
  const body = k.build();
  letter(body, textTexture([liv.road], { w: 1024, h: 128, color: liv.ink }), 3.4, 0.4, -0.6, 2.78, 1.272, false);
  letter(body, textTexture([liv.num], { w: 256, h: 128, color: liv.ink2 }), 0.85, 0.38, 3.9, 1.8, 1.272, false);
  return {
    front: 6.3, back: 5.8, pivots: [3.4, -3.4], body, spin: [],
    trucks: [{ off: 3.4, ...dieselTruck(0) }, { off: -3.4, ...dieselTruck(-1, 5.8 - 3.4) }],
    head: headlight(body, 5.99, 1.44),
    lamps: [ditch],
  };
}

// The coaches share a side elevation: a band under the windows and a pin stripe over them.
function coachSkin(key, liv, planar, band, pin) {
  return liveryMat(key, planar, { roughness: 0.3, metalness: liv.metal, envMapIntensity: 0.85 }, (g, X, Y, W, H) => {
    g.fillStyle = css(liv.base); g.fillRect(0, 0, W, H);
    if (liv.metal > 0.4) { g.fillStyle = 'rgba(255,255,255,0.05)'; for (let x = 0; x < W; x += 6) g.fillRect(x, 0, 2, H); }   // brushed grain
    g.fillStyle = css(liv.stripe); g.fillRect(0, Y(band[1]), W, Y(band[0]) - Y(band[1]));
    g.fillStyle = css(liv.accent); g.fillRect(0, Y(pin[1]), W, Y(pin[0]) - Y(pin[1]));
    g.fillStyle = 'rgba(0,0,0,0.12)'; g.fillRect(0, 0, W, Y(planar.y1 - 0.42));           // the roof a shade darker
    g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(0, Y(1.13), W, Y(1.0) - Y(1.13));         // shadowed skirt
  });
}

// ---- single-level coach ----
export function buildCoach(liv, li) {
  const TOP = 3.6, planar = { x0: -5.8, x1: 5.8, y0: 1.0, y1: TOP };
  const skin = coachSkin('coach-' + li, liv, planar, [1.74, 1.98], [2.8, 2.86]);
  const win = glowMat(COACH_LIGHT, 0);
  const k = new Kit();
  k.put(skin, loftGeo([{ x: -5.75, w: PW, y0: 1.0, y1: TOP, r: 0.55 }, { x: 5.75, w: PW, y0: 1.0, y1: TOP, r: 0.55 }]));
  windowRow(k, win, [-3.75, -2.5, -1.25, 0, 1.25, 2.5, 3.75], 2.36, 0.95, 0.56, PW + 0.012);
  for (const ex of [-1, 1]) {
    for (const s of [-1, 1]) {                     // a door near each end, with a narrow light
      k.box(M.graphite, 0.7, 1.82, 0.03, ex * 4.95, 2.0, s * (PW + 0.01));
      k.box(win, 0.32, 0.6, 0.04, ex * 4.95, 2.4, s * (PW + 0.016));
    }
    gangway(k, ex * 5.86, 3.25);
    k.box(M.graphite, 1.5, 0.16, 1.2, ex * 3.6, TOP + 0.06, 0);   // roof air conditioning
  }
  k.boxY(M.graphite, -2.6, 2.6, 0.5, 1.0, 0.95);
  k.box(M.black, 11.0, 0.2, 0.5, 0, 0.9, 0);
  const body = k.build();
  letter(body, textTexture([liv.road], { w: 1024, h: 128, color: liv.ink }), 2.8, 0.3, 0, 1.44, PW + 0.012);
  letter(body, textTexture([liv.num], { w: 256, h: 128, color: liv.ink }), 0.62, 0.26, 3.75, 1.44, PW + 0.012);
  return { front: 6.0, back: 6.0, pivots: [4.0, -4.0], body, spin: [], trucks: carTrucks(4.0, 6.0, 6.0, passengerTruck), lamps: [win] };
}

// ---- bi-level commuter coach: two rows of windows, doors in the middle ----
export function buildBilevel(liv, li) {
  const TOP = 4.45, planar = { x0: -5.8, x1: 5.8, y0: 1.0, y1: TOP };
  const skin = coachSkin('bilevel-' + li, liv, planar, [2.56, 2.84], [4.0, 4.06]);
  const win = glowMat(COACH_LIGHT, 0);
  const k = new Kit();
  k.put(skin, loftGeo([{ x: -5.75, w: PW, y0: 1.0, y1: TOP, r: 0.42 }, { x: 5.75, w: PW, y0: 1.0, y1: TOP, r: 0.42 }]));
  windowRow(k, win, [-4.2, -3.0, -1.8, 1.8, 3.0, 4.2], 1.95, 0.92, 0.5, PW + 0.012);
  windowRow(k, win, [-4.2, -3.0, -1.8, -0.6, 0.6, 1.8, 3.0, 4.2], 3.32, 0.92, 0.5, PW + 0.012);
  for (const s of [-1, 1]) {
    k.box(M.graphite, 1.1, 1.42, 0.03, 0, 1.86, s * (PW + 0.01));
    for (const dx of [-0.27, 0.27]) k.box(win, 0.36, 0.55, 0.04, dx, 2.05, s * (PW + 0.016));
  }
  for (const ex of [-1, 1]) {
    gangway(k, ex * 5.86, 4.0);
    k.box(M.graphite, 1.5, 0.16, 1.2, ex * 3.6, TOP + 0.06, 0);
  }
  k.boxY(M.graphite, -2.6, 2.6, 0.5, 1.0, 0.95);
  k.box(M.black, 11.0, 0.2, 0.5, 0, 0.9, 0);
  const body = k.build();
  letter(body, textTexture([liv.road], { w: 1024, h: 128, color: liv.ink }), 2.8, 0.3, 0, 3.8, PW + 0.012);
  letter(body, textTexture([liv.num], { w: 256, h: 128, color: liv.ink }), 0.62, 0.26, 4.9, 1.42, PW + 0.012);
  return { front: 6.0, back: 6.0, pivots: [4.0, -4.0], body, spin: [], trucks: carTrucks(4.0, 6.0, 6.0, passengerTruck), lamps: [win] };
}
