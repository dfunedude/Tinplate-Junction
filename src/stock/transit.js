// ===== stock/transit: a stainless subway train, a cab car up front and plain cars behind =====
import { PI, TAU } from '../core/geometry.js';
import { makeCanvas, canvasTex, textTexture } from '../render/textures.js';
import { paint, M, glowMat } from '../render/materials.js';
import { Kit, loftGeo } from '../render/kit.js';
import { decal, letter } from '../render/decals.js';
import { passengerTruck, carTrucks, headlight, windowRow } from './parts.js';
import { css, liveryMat } from './liveries.js';

const SW = 1.26, STOP = 3.55, SEND = 6.0;   // half-width, roof height and end of the car body

// lettering on the front end, facing forward
function onFront(parent, tex, w, h, x, y, z) {
  const m = decal(parent, tex, w, h, 0, y, 0, 1);
  m.position.set(x, y, z);
  m.rotation.y = PI / 2;
  return m;
}
function routeBullet(liv) {
  const c = makeCanvas(128, 128), g = c.getContext('2d');
  g.fillStyle = css(liv.stripe); g.beginPath(); g.arc(64, 64, 60, 0, TAU); g.fill();
  g.fillStyle = '#ffffff'; g.font = '700 82px "Arial Narrow", Arial, Helvetica, sans-serif';
  g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(liv.route, 64, 69);
  return canvasTex(c);
}

function subwayCar(liv, li, cab) {
  const planar = { x0: -SEND, x1: SEND, y0: 1.0, y1: STOP };
  const skin = liveryMat('subway-' + li, planar, { roughness: 0.3, metalness: 0.85, envMapIntensity: 0.95 }, (g, X, Y, W, H) => {
    g.fillStyle = '#b9bdc1'; g.fillRect(0, 0, W, H);
    for (let x = 0, i = 0; x < W; x += 6, i++) {   // fluted stainless below the windows
      g.fillStyle = i % 2 ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)';
      g.fillRect(x, Y(2.2), 3, Y(1.0) - Y(2.2));
    }
    g.fillStyle = css(liv.stripe); g.fillRect(0, Y(2.24), W, Y(2.08) - Y(2.24));   // the line's colour
    g.fillStyle = 'rgba(0,0,0,0.14)'; g.fillRect(0, 0, W, Y(STOP - 0.4));          // roof
  });
  const doorMat = paint(0x8f9397, 0.34, 0.8, 0.9);
  const win = glowMat(0xc9dcf0, 0);   // fluorescent tubes
  const k = new Kit();
  k.put(skin, loftGeo([{ x: -SEND, w: SW, y0: 1.0, y1: STOP, r: 0.5 }, { x: SEND, w: SW, y0: 1.0, y1: STOP, r: 0.5 }]));
  // three pairs of doors a side, each leaf with a window, and picture windows between them
  for (const s of [-1, 1]) for (const x of [-3.9, 0, 3.9]) {
    k.box(doorMat, 1.12, 2.22, 0.03, x, 2.2, s * (SW + 0.01));
    k.box(M.black, 0.03, 2.22, 0.035, x, 2.2, s * (SW + 0.012));
    for (const dx of [-0.27, 0.27]) k.box(win, 0.36, 0.64, 0.04, x + dx, 2.66, s * (SW + 0.016));
  }
  windowRow(k, win, [-5.15, -2.55, -1.35, 1.35, 2.55, 5.15], 2.66, 0.95, 0.62, SW + 0.012);
  // each end has a storm door with a window, and a window either side
  for (const ex of [-1, 1]) {
    k.box(win, 0.04, 0.82, 0.5, ex * (SEND + 0.01), 2.62, 0);
    for (const s of [-1, 1]) k.box(M.glass, 0.04, 0.55, 0.46, ex * (SEND + 0.01), 2.74, s * 0.78);
    k.box(M.graphite, 1.7, 0.2, 1.3, ex * 3.5, STOP + 0.06, 0);   // roof air conditioning
  }
  k.boxY(M.graphite, -2.9, 2.9, 0.5, 1.0, 1.0);
  k.box(M.black, 11.4, 0.2, 0.5, 0, 0.9, 0);
  const lamps = [win];
  if (cab) {
    k.box(M.black, 0.04, 0.24, 0.95, SEND + 0.02, 3.2, 0);   // destination sign
    const marker = glowMat(0xf4f1e6, 0);
    for (const s of [-1, 1]) k.box(marker, 0.04, 0.13, 0.2, SEND + 0.02, 1.55, s * 0.82);
    lamps.push(marker);
  }
  const body = k.build();
  letter(body, textTexture([liv.num], { w: 256, h: 128, color: '#1d1f22' }), 0.6, 0.26, 5.15, 1.75, SW + 0.012);
  letter(body, textTexture(['TINPLATE TRANSIT'], { w: 1024, h: 128, color: '#1d1f22' }), 1.9, 0.22, -1.95, 1.75, SW + 0.012);
  let head = null;
  if (cab) {
    onFront(body, textTexture(['JUNCTION'], { w: 512, h: 96, color: '#f2b347' }), 0.88, 0.2, SEND + 0.045, 3.2, 0);
    onFront(body, routeBullet(liv), 0.34, 0.34, SEND + 0.035, 2.74, 0.78);
    head = headlight(body, SEND + 0.04, 1.6);
  }
  return { front: 6.2, back: 6.2, pivots: [4.2, -4.2], body, spin: [], trucks: carTrucks(4.2, 6.2, 6.2, passengerTruck), head, lamps };
}
export function buildSubway(liv, li) { return subwayCar(liv, li, true); }
export function buildSubwayCar(liv, li) { return subwayCar(liv, li, false); }
