// ===== stock/trolley: classic double-ended streetcars with trolley poles, and an open summer car =====
import * as THREE from 'three';
import { PI, clamp } from '../core/geometry.js';
import { TEX, textTexture } from '../render/textures.js';
import { paint, M, glowMat } from '../render/materials.js';
import { UNIT, Kit, loftGeo } from '../render/kit.js';
import { decal, letter } from '../render/decals.js';
import { coupler, withAxles, carTrucks, headlight, windowRow } from './parts.js';
import { css, liveryMat } from './liveries.js';

const TW = 1.18;                 // half-width of the carbody
const TB = 0.95, EAVE = 3.25;    // bottom of the body, and the eaves
const TBOW = 4.55, TEND = 5.8;   // where the rounded vestibule ends start, and where the body ends
const POLE_X = 1.9, POLE_Y = 4.12, POLE_LEN = 5.0;   // each pole's pivot on the roof, and its length
const STREETCAR_LIGHT = 0xe8cf98;
// half-width of the body along its length: straight sides, then bowed ends
const planW = x => TW * Math.sqrt(1 - 0.72 * clamp((Math.abs(x) - TBOW) / (TEND - TBOW), 0, 1) ** 2);

// cross sections through the body, or through the roof over it
function bowSections(over, y0, y1, r) {
  const xs = [];
  for (let i = 6; i >= 0; i--) xs.push(-(TBOW + (TEND - TBOW) * i / 6));
  for (let i = 0; i <= 6; i++) xs.push(TBOW + (TEND - TBOW) * i / 6);
  return xs.map(x => ({ x: x * (TEND + over) / TEND, w: planW(x) + over, y0, y1, r }));
}
// lettering on an end of the car, facing out along x
function onEnd(parent, tex, w, h, x, y) {
  const m = decal(parent, tex, w, h, 0, y, 0, 1);
  m.position.set(x, y, 0);
  m.rotation.y = Math.sign(x) * PI / 2;
  return m;
}
// The deck roof shared by the closed and open cars: canvas over the eaves, and a clerestory down the
// middle with a row of small art-glass windows.
function deckRoof(k, liv, ends, cler) {
  const roof = paint(liv.roof, 0.75, 0.05);
  k.put(roof, loftGeo(ends(0.07, EAVE - 0.03, 3.6, 0.3)));
  k.put(roof, loftGeo([
    { x: -4.5, w: 0.42, y0: 3.45, y1: 3.62, r: 0.06 }, { x: -3.9, w: 0.62, y0: 3.45, y1: 3.9, r: 0.06 },
    { x: 3.9, w: 0.62, y0: 3.45, y1: 3.9, r: 0.06 }, { x: 4.5, w: 0.42, y0: 3.45, y1: 3.62, r: 0.06 },
  ]));
  windowRow(k, cler, [-3.2, -2.4, -1.6, -0.8, 0, 0.8, 1.6, 2.4, 3.2], 3.75, 0.44, 0.14, 0.632);
}

// A short motor truck: small wheels, a slung equalizer bar and the traction motor between the axles.
function streetcarTruck(dir, reach) {
  const k = new Kit(), r = 0.3;
  for (const s of [-1, 1]) {
    k.box(M.plastic, 1.7, 0.16, 0.1, 0, 0.5, s * 0.84);
    k.box(M.plastic, 1.3, 0.07, 0.1, 0, 0.17, s * 0.84);
    for (const ax of [-0.58, 0.58]) {
      k.box(M.plastic, 0.3, 0.26, 0.16, ax, r, s * 0.85);
      k.cylY(M.steel, 0.07, 0.24, ax * 0.55, 0.3, s * 0.84);
    }
  }
  k.box(M.plastic, 0.5, 0.18, 1.64, 0, 0.66, 0);
  k.boxY(M.graphite, -0.38, 0.38, 0.18, 0.5, 0.32);
  if (dir) coupler(k, dir, reach);
  const g = k.build();
  return { g, axles: withAxles(g, [-0.58, 0.58], r) };
}

// A trolley pole on its sprung base. Its local x runs up the pole, so sim/train only has to turn it:
// up to the wire behind the car, or down onto the hook over its own end of the roof.
function trolleyPole(side) {
  const k = new Kit();
  k.cylX(M.black, 0.045, POLE_LEN - 0.1, (POLE_LEN - 0.1) / 2, 0, 0);
  k.cylX(M.black, 0.075, 0.7, 0.35, 0, 0);
  k.box(M.steel, 0.26, 0.08, 0.14, POLE_LEN - 0.1, 0, 0);    // the harp
  k.cylZ(M.nickel, 0.1, 0.05, POLE_LEN, 0, 0);               // and the wheel that runs on the wire
  const g = k.build();
  g.rotation.order = 'YZX';
  g.position.set(side * POLE_X, POLE_Y, 0);
  // the blue flash of the wheel arcing on the wire
  const spark = new THREE.Sprite(new THREE.SpriteMaterial({ map: TEX.glow, color: 0xa9cfff, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, opacity: 0 }));
  spark.position.set(POLE_LEN, 0.05, 0);
  spark.scale.setScalar(1.2);
  spark.userData.ownMatKeepMap = true;
  g.add(spark);
  const pole = { g, side, x: side * POLE_X, y: POLE_Y, len: POLE_LEN, rest: -0.08, up: 0, spark };
  g.rotation.set(0, side > 0 ? 0 : PI, pole.rest);
  return pole;
}

// ---- closed streetcar: the lead car carries the lit headlight ----
function streetcar(liv, li, lead) {
  const planar = { x0: -TEND, x1: TEND, y0: TB, y1: EAVE + 0.4 };
  const skin = liveryMat('streetcar-' + li, planar, { roughness: 0.4, metalness: 0.1, envMapIntensity: 0.7 }, (g, X, Y, W, H) => {
    g.fillStyle = css(liv.base); g.fillRect(0, 0, W, H);
    g.fillStyle = css(liv.band); g.fillRect(0, 0, W, Y(1.98));                       // window band and letterboard
    g.fillStyle = css(liv.stripe); g.fillRect(0, Y(2.04), W, Y(1.94) - Y(2.04));      // belt rail
    g.strokeStyle = css(liv.stripe); g.lineWidth = 3;                                 // lined-out lower panels
    for (const [x0, x1] of [[-TBOW + 0.25, -0.1], [0.1, TBOW - 0.25]]) g.strokeRect(X(x0), Y(1.8), X(x1) - X(x0), Y(1.15) - Y(1.8));
    g.fillStyle = 'rgba(0,0,0,0.3)'; g.fillRect(0, Y(1.06), W, Y(TB) - Y(1.06));      // shadowed sill
  });
  const win = glowMat(STREETCAR_LIGHT, 0), cler = glowMat(0xe9b65c, 0);
  const door = paint(0x5a3e2b, 0.55, 0), wood = paint(0x6d4c33, 0.8, 0);
  const k = new Kit();
  k.put(skin, loftGeo(bowSections(0, TB, EAVE, 0.08)));
  deckRoof(k, liv, bowSections, cler);
  windowRow(k, win, [-3.2, -2.4, -1.6, -0.8, 0, 0.8, 1.6, 2.4, 3.2], 2.5, 0.62, 0.78, TW + 0.012);
  // the bow at each end: a window straight ahead and one either side, following the curve
  const bx = 5.2, slope = (planW(bx + 0.05) - planW(bx - 0.05)) / 0.1;
  for (const ex of [-1, 1]) {
    k.box(win, 0.04, 0.78, 0.52, ex * (TEND + 0.012), 2.5, 0);
    for (const s of [-1, 1]) {
      k.put(win, UNIT.box, ex * bx, 2.5, s * (planW(bx) + 0.015), 0, ex * s * Math.atan(-slope), 0, 0.5, 0.78, 0.04);
      k.box(door, 0.6, 1.95, 0.03, ex * 4.0, 1.97, s * (TW + 0.01));                   // a door at each corner
      k.box(win, 0.36, 0.62, 0.04, ex * 4.0, 2.5, s * (TW + 0.016));
      k.box(M.black, 0.6, 0.08, 0.22, ex * 4.0, 0.78, s * (TW - 0.04));               // the step under it
    }
    k.box(M.black, 0.04, 0.24, 0.84, ex * (TEND + 0.03), 3.07, 0);                   // destination sign
    k.box(M.black, 0.14, 0.16, 1.25, ex * (TEND + 0.05), 1.02, 0);                   // anticlimber
    k.cylX(M.black, 0.17, 0.14, ex * (TEND + 0.06), 1.55, 0);                        // headlight case
    if (!lead || ex < 0) k.sphere(M.glass, 0.12, 0.12, 0.12, ex * (TEND + 0.14), 1.55, 0);
    k.box(wood, 1.6, 0.05, 0.5, ex * POLE_X, 3.93, 0);                               // trolley boards
    k.cylY(M.black, 0.16, 0.18, ex * POLE_X, 4.02, 0);                               // pole base
    k.box(M.black, 0.06, 0.3, 0.08, ex * 5.65, 3.7, 0);                              // pole hook
  }
  k.box(M.black, 2 * TBOW, 0.18, 0.5, 0, 0.86, 0);
  k.boxY(M.graphite, -2.1, 2.1, 0.5, TB, 0.85);                                     // controller and resistor grids
  const body = k.build();
  letter(body, textTexture([liv.road], { w: 1024, h: 128, color: liv.ink }), 3.4, 0.24, 0, 3.08, TW + 0.012);
  letter(body, textTexture([liv.num], { w: 256, h: 128, color: liv.ink2 }), 0.62, 0.3, 2.9, 1.47, TW + 0.012);
  for (const ex of [-1, 1]) {
    onEnd(body, textTexture([liv.dest], { w: 512, h: 128, color: '#f2c46e' }), 0.78, 0.2, ex * (TEND + 0.055), 3.07);
    onEnd(body, textTexture([liv.num], { w: 256, h: 128, color: liv.ink2 }), 0.5, 0.22, ex * (TEND + 0.012), 1.2);
  }
  const poles = [trolleyPole(1), trolleyPole(-1)];
  for (const p of poles) body.add(p.g);
  return {
    front: 6.2, back: 6.2, pivots: [3.4, -3.4], body, spin: [], trucks: carTrucks(3.4, 6.2, 6.2, streetcarTruck),
    head: lead ? headlight(body, TEND + 0.14, 1.55) : null, lamps: [win, cler], poles,
  };
}
export function buildTrolley(liv, li) { return streetcar(liv, li, true); }
export function buildTrolleyCar(liv, li) { return streetcar(liv, li, false); }

// ---- open summer car: cross benches under a deck roof, a trailer with no pole of its own ----
export function buildOpenCar(liv) {
  const OEND = 5.6;
  const base = paint(liv.base, 0.45, 0.1), band = paint(liv.band, 0.6, 0), wood = paint(0x8a5a36, 0.6, 0);
  const bulb = glowMat(0xffd89a, 0), cler = glowMat(0xe9b65c, 0);
  const k = new Kit();
  deckRoof(k, liv, (over, y0, y1, r) => [{ x: -OEND - over, w: TW + over, y0, y1, r }, { x: OEND + over, w: TW + over, y0, y1, r }], cler);
  k.boxY(base, -OEND, OEND, TB, 1.25, TW);                                          // floor and side sills
  for (const s of [-1, 1]) {
    k.box(base, 2 * OEND - 0.2, 0.4, 0.05, 0, 1.45, s * (TW - 0.02));               // side panel under the benches
    k.box(band, 2 * OEND, 0.3, 0.05, 0, EAVE - 0.17, s * (TW - 0.02));              // letterboard
    k.cylX(paint(0xc8b48a, 0.85, 0), 0.07, 2 * OEND - 0.4, 0, EAVE - 0.4, s * (TW - 0.08));   // side curtains, rolled up
    k.box(wood, 2 * OEND - 1.0, 0.07, 0.32, 0, 0.74, s * (TW + 0.12));              // running board
    for (let i = 0; i <= 9; i++) k.cylY(band, 0.045, EAVE - 1.65, -4.95 + i * 1.1, (EAVE + 1.65) / 2, s * (TW - 0.05));   // roof posts
  }
  for (let i = 0; i <= 8; i++) {
    const x = -4.4 + i * 1.1;
    k.box(wood, 0.42, 0.08, 2 * TW - 0.2, x, 1.62, 0);                               // bench seat
    k.box(wood, 0.06, 0.5, 2 * TW - 0.2, x - 0.18, 1.92, 0);                         // and its back
    k.sphere(bulb, 0.08, 0.08, 0.08, x, EAVE - 0.1, 0);                              // a bulb over each bench
  }
  for (const ex of [-1, 1]) {
    k.box(base, 0.08, 1.05, 2 * TW - 0.1, ex * OEND, 1.75, 0);                       // dash across each end
    k.box(M.black, 0.14, 0.16, 1.25, ex * (OEND + 0.08), 1.02, 0);
  }
  k.box(M.black, 2 * OEND - 1, 0.18, 0.5, 0, 0.86, 0);
  const body = k.build();
  letter(body, textTexture([liv.road], { w: 1024, h: 128, color: liv.ink }), 3.4, 0.22, 0, EAVE - 0.17, TW + 0.012);
  letter(body, textTexture([liv.num], { w: 256, h: 128, color: liv.ink2 }), 0.5, 0.28, 4.2, 1.45, TW + 0.012);
  return { front: 6.05, back: 6.05, pivots: [3.4, -3.4], body, spin: [], trucks: carTrucks(3.4, 6.05, 6.05, streetcarTruck), lamps: [bulb, cler] };
}
