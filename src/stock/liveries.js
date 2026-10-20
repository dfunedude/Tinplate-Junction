// ===== stock/liveries: paint schemes, painted as side elevations and projected onto the bodies =====
import { makeCanvas, canvasTex } from '../render/textures.js';
import { stdMat } from '../render/materials.js';

export const css = hex => '#' + hex.toString(16).padStart(6, '0');

const liveryMatCache = new Map();
export function liveryMat(key, planar, opts, draw) {
  if (!liveryMatCache.has(key)) {
    const c = makeCanvas(1024, 256), g = c.getContext('2d');
    const X = x => (x - planar.x0) / (planar.x1 - planar.x0) * c.width;
    const Y = y => (1 - (y - planar.y0) / (planar.y1 - planar.y0)) * c.height;
    draw(g, X, Y, c.width, c.height);
    const m = stdMat({ map: canvasTex(c), ...opts });
    m.userData.planar = planar;
    liveryMatCache.set(key, m);
  }
  return liveryMatCache.get(key);
}

export const LIVERIES = {
  steam: [{ name: 'Black', swatch: 0x1c1c1e, num: '637' }, { name: 'Black, 2037', swatch: 0x26262a, num: '2037' }],
  tender: [{ name: 'Black', swatch: 0x1c1c1e }],
  f3: [
    { name: 'Warbonnet', swatch: 0x8a2c25, base: 0xa7abae, bonnet: 0x8a2c25, stripe: 0xc6a552, edge: 0x1b1b1b, ink: '#e9d9a8', num: '2343', metal: 0.4 },
    { name: 'Freight blue', swatch: 0x3c4c66, base: 0x3d4c66, bonnet: 0xc2a04c, stripe: 0x1d1d1f, edge: 0x1b1b1b, ink: '#e7dcc1', num: '2243', metal: 0.12 },
    { name: 'Pullman green', swatch: 0x3f4d3d, base: 0x3f4c3c, bonnet: 0xcdbf98, stripe: 0x1d1d1d, edge: 0x1b1b1b, ink: '#2a2a28', num: '2245', metal: 0.12 },
  ],
  gp9: [
    { name: 'Road blue', swatch: 0x34465c, base: 0x34465c, band: 0xd9d1bd, ink: '#e8e0cc', road: 'LAKESHORE', num: '2365' },
    { name: 'Tuscan', swatch: 0x5b2e25, base: 0x5b2e25, band: 0xc4a557, ink: '#d8bf7c', road: 'TINPLATE LINES', num: '2028' },
    { name: 'Black & gold', swatch: 0x1f1f21, base: 0x222224, band: 0xb9964c, ink: '#d6b56c', road: 'NORTHERN LINES', num: '2349' },
  ],
  boxcar: [
    { name: 'Tuscan', swatch: 0x6a3628, base: 0x6a3628, ink: '#ebe3d2', road: 'LAKESHORE', num: '6464-25' },
    { name: 'Faded green', swatch: 0x4c5d45, base: 0x4c5d45, ink: '#ebe3d2', road: 'TIDEWATER', num: '6464-100' },
    { name: 'Slate', swatch: 0x5e6b77, base: 0x5e6b77, ink: '#16181a', road: 'NORTHERN LINES', num: '6464-375' },
    { name: 'Mustard', swatch: 0xa7843f, base: 0xa7843f, ink: '#1a1a1a', road: 'PRAIRIE CENTRAL', num: '6464-450' },
  ],
  hopper: [
    { name: 'Gray', swatch: 0x7a7d80, base: 0x7a7d80, ink: '#161616', road: 'PRAIRIE CENTRAL', num: '6456' },
    { name: 'Black', swatch: 0x262628, base: 0x262628, ink: '#e6dfcf', road: 'NORTHERN LINES', num: '6456-1' },
    { name: 'Maroon', swatch: 0x5a3029, base: 0x5a3029, ink: '#e6dfcf', road: 'LAKESHORE', num: '6476' },
  ],
  tank: [
    { name: 'Silver', swatch: 0xa9adb0, base: 0x9a9ea1, metal: 0.45, ink: '#1a1a1a', road: 'TIDEWATER OIL', num: '6465' },
    { name: 'Black', swatch: 0x232325, base: 0x232325, metal: 0.25, ink: '#e8e1d0', road: 'PRAIRIE GAS', num: '6465-60' },
    { name: 'Gray', swatch: 0x8a8e91, base: 0x8a8e91, metal: 0.3, ink: '#1a1a1a', road: 'LAKESHORE CHEMICAL', num: '6465-110' },
  ],
  gondola: [
    { name: 'Boxcar red', swatch: 0x733728, base: 0x733728, ink: '#ebe3d2', road: 'NORTHERN LINES', num: '6462' },
    { name: 'Black', swatch: 0x232325, base: 0x232325, ink: '#ebe3d2', road: 'TIDEWATER', num: '6462-1' },
    { name: 'Green', swatch: 0x4e5f48, base: 0x4e5f48, ink: '#ebe3d2', road: 'LAKESHORE', num: '6462-25' },
  ],
  flatcar: [
    { name: 'Black frame', swatch: 0x232325, base: 0x232325, ink: '#ebe3d2', num: '6361' },
    { name: 'Tuscan frame', swatch: 0x5f3127, base: 0x5f3127, ink: '#ebe3d2', num: '6361-1' },
  ],
  caboose: [
    { name: 'Tuscan', swatch: 0x6b2e25, base: 0x6b2e25, ink: '#ebe3d2', road: 'TINPLATE LINES', num: '6017' },
    { name: 'Red', swatch: 0x8c3a2b, base: 0x8c3a2b, ink: '#ebe3d2', road: 'LAKESHORE', num: '6017-50' },
    { name: 'Gray', swatch: 0x76797b, base: 0x76797b, ink: '#1b1b1b', road: 'NORTHERN LINES', num: '6017-185' },
  ],
};
