// ===== stock/highspeed: a high-speed trainset, with power cars at both ends and coaches between =====
import * as THREE from 'three';
import { PI, clamp } from '../core/geometry.js';
import { textTexture } from '../render/textures.js';
import { paint, M, glowMat } from '../render/materials.js';
import { UNIT, Kit, loftGeo, mirrorX } from '../render/kit.js';
import { letter } from '../render/decals.js';
import { bodyCoupler, dieselTruck, passengerTruck, carTrucks, headlight, windowRow, gangway } from './parts.js';
import { css, liveryMat } from './liveries.js';

const HW = 1.27, HB = 1.0, HTOP = 3.65;   // half-width, floor and roof of the whole set
const NOSE0 = 1.0, NOSE_LEN = 5.45;       // where the power car's nose starts, and how long it runs
// height of the roof line along the nose
const noseTop = x => 1.62 + (HTOP - 1.62) * Math.cos(clamp((x - NOSE0) / NOSE_LEN, 0, 1) * PI / 2) ** 0.8;

let powerShell = null;
function powerShellGeo() {
  if (powerShell) return powerShell;
  const out = [];
  const sec = (x, w) => { const y1 = noseTop(x); out.push({ x, w, y0: HB, y1, r: Math.min(0.62, w * 0.95, (y1 - HB) * 0.48) }); };
  sec(-6.0, HW); sec(NOSE0, HW);
  for (let i = 1; i <= 18; i++) { const t = i / 18; sec(NOSE0 + NOSE_LEN * t, Math.max(0.3, HW * Math.sqrt(1 - t ** 2.6))); }
  return (powerShell = loftGeo(out));
}
// The side elevation the whole set shares: a coloured lower band under a pin stripe.
function expressPaint(liv, extra) {
  return (g, X, Y, W, H) => {
    g.fillStyle = css(liv.base); g.fillRect(0, 0, W, H);
    g.fillStyle = css(liv.band); g.fillRect(0, Y(1.85), W, Y(1.0) - Y(1.85));
    g.fillStyle = css(liv.stripe); g.fillRect(0, Y(2.02), W, Y(1.93) - Y(2.02));
    if (extra) extra(g, X, Y, W, H);
  };
}

// ---- power car; the rear one is the same car turned end for end ----
function powerCar(liv, li, rear) {
  const planar = { x0: -6.1, x1: 6.55, y0: 1.0, y1: 3.7 };
  const skin = liveryMat('hspower-' + li, planar, { roughness: 0.28, metalness: liv.metal, envMapIntensity: 0.9 }, expressPaint(liv, (g, X, Y) => {
    // the cab windows hug the top of the nose, so they wrap over it as a windscreen
    const xs = [];
    for (let x = 2.3; x <= 4.15; x += 0.05) xs.push(x);
    g.fillStyle = '#111417'; g.beginPath();
    xs.forEach((x, i) => (i ? g.lineTo(X(x), Y(noseTop(x) + 0.1)) : g.moveTo(X(x), Y(noseTop(x) + 0.1))));
    for (let i = xs.length - 1; i >= 0; i--) g.lineTo(X(xs[i]), Y(noseTop(xs[i]) - 0.42));
    g.closePath(); g.fill();
    g.fillStyle = 'rgba(0,0,0,0.3)';   // cooling grilles along the machine room
    for (let x = -5.3; x < -1.2; x += 1.0) g.fillRect(X(x), Y(3.0), X(x + 0.78) - X(x), Y(2.35) - Y(3.0));
  }));
  const k = new Kit();
  k.put(skin, powerShellGeo());
  // the chin fairing under the nose narrows with it
  k.put(paint(liv.band, 0.35, 0.2, 0.8), loftGeo([
    { x: 4.4, w: 1.0, y0: 0.36, y1: HB + 0.02, r: 0.12 }, { x: 5.4, w: 0.8, y0: 0.33, y1: HB + 0.02, r: 0.15 },
    { x: 6.1, w: 0.48, y0: 0.56, y1: HB + 0.02, r: 0.18 }, { x: 6.42, w: 0.28, y0: 0.86, y1: HB + 0.02, r: 0.07 },
  ]));
  bodyCoupler(k, 6.55, 1);
  gangway(k, -6.0, 3.3);
  k.boxY(M.graphite, -2.5, 2.5, 0.45, HB, 0.95);
  // single-arm pantograph, raised to the wire
  const ins = paint(0x7d9a86, 0.3, 0.1, 0.8);
  for (const x of [-4.3, -2.9]) for (const s of [-1, 1]) k.cylY(ins, 0.07, 0.18, x, HTOP + 0.06, s * 0.4);
  k.box(M.graphite, 1.6, 0.06, 0.95, -3.6, HTOP + 0.17, 0);
  const bar = (x0, y0, x1, y1, z, t) => k.put(M.steel, UNIT.box, (x0 + x1) / 2, (y0 + y1) / 2, z, 0, 0, Math.atan2(y1 - y0, x1 - x0), Math.hypot(x1 - x0, y1 - y0), t, t);
  for (const z of [-0.14, 0.14]) bar(-4.2, HTOP + 0.22, -3.0, 4.6, z, 0.07);
  bar(-3.0, 4.6, -3.95, 5.12, 0, 0.05);
  k.box(M.steel, 0.14, 0.06, 1.5, -3.95, 5.16, 0);
  const body = k.build();
  if (rear) mirrorX(body);
  const m = rear ? -1 : 1;
  letter(body, textTexture([liv.road], { w: 1024, h: 128, color: liv.ink }), 2.9, 0.28, m * -3.3, 2.18, HW + 0.012, false);
  letter(body, textTexture([liv.num], { w: 256, h: 128, color: liv.ink2 }), 0.62, 0.26, m * -5.1, 1.45, HW + 0.012, false);
  const v = {
    front: rear ? 6.1 : 6.55, back: rear ? 6.55 : 6.1, pivots: [3.6, -3.6], body, spin: [],
    trucks: rear ? [{ off: 3.6, ...dieselTruck(1, 6.1 - 3.6) }, { off: -3.6, ...dieselTruck(0) }]
      : [{ off: 3.6, ...dieselTruck(0) }, { off: -3.6, ...dieselTruck(-1, 6.1 - 3.6) }],
  };
  if (rear) {
    const tail = glowMat(0xd2452e, 0);
    for (const s of [-1, 1]) {
      const lamp = new THREE.Mesh(UNIT.sphere, tail);
      lamp.scale.setScalar(0.07); lamp.position.set(-6.43, 1.32, s * 0.16);
      body.add(lamp);
    }
    v.lamps = [tail];
  } else v.head = headlight(body, 6.43, 1.32);
  return v;
}
export function buildHighSpeed(liv, li) { return powerCar(liv, li, false); }
export function buildPowerCarRear(liv, li) { return powerCar(liv, li, true); }

// ---- coach ----
export function buildHsCoach(liv, li) {
  const planar = { x0: -6.0, x1: 6.0, y0: 1.0, y1: 3.7 };
  const skin = liveryMat('hscoach-' + li, planar, { roughness: 0.28, metalness: liv.metal, envMapIntensity: 0.9 }, expressPaint(liv));
  const win = glowMat(0xe6d6b4, 0);
  const k = new Kit();
  k.put(skin, loftGeo([{ x: -5.9, w: HW, y0: HB, y1: HTOP, r: 0.62 }, { x: 5.9, w: HW, y0: HB, y1: HTOP, r: 0.62 }]));
  const xs = [];
  for (let i = -5; i <= 5; i++) xs.push(i * 0.84);
  windowRow(k, win, xs, 2.55, 0.62, 0.46, HW + 0.012);
  for (const ex of [-1, 1]) {
    for (const s of [-1, 1]) {
      k.box(M.graphite, 0.6, 1.62, 0.03, ex * 5.2, 2.0, s * (HW + 0.01));
      k.box(win, 0.26, 0.5, 0.04, ex * 5.2, 2.5, s * (HW + 0.016));
    }
    gangway(k, ex * 6.0, 3.35);
  }
  k.boxY(M.graphite, -2.8, 2.8, 0.5, HB, 0.95);
  const body = k.build();
  letter(body, textTexture([liv.road], { w: 1024, h: 128, color: liv.ink2 }), 2.6, 0.28, 0, 1.45, HW + 0.012);
  letter(body, textTexture([liv.num], { w: 256, h: 128, color: liv.ink2 }), 0.62, 0.26, 3.9, 1.45, HW + 0.012);
  return { front: 6.1, back: 6.1, pivots: [4.2, -4.2], body, spin: [], trucks: carTrucks(4.2, 6.1, 6.1, passengerTruck), lamps: [win] };
}
