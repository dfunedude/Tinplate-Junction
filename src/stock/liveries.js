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

// Matched sets (passenger, subway, high-speed, trolley): the engine and its cars list the same schemes in the
// same order, so a whole train can wear one scheme.
const PAX = [
  { name: 'Lakeshore silver', swatch: 0x2b4c8c, base: 0xb4b9bd, metal: 0.6, stripe: 0x2b4c8c, accent: 0xc9a54a, ink: '#1d2a44', ink2: '#eef0ea', road: 'LAKESHORE' },
  { name: 'Midnight blue', swatch: 0x22324f, base: 0x22324f, metal: 0.2, stripe: 0xc9a54a, accent: 0xe8e2d2, ink: '#e8e0cc', ink2: '#22324f', road: 'NORTHERN LINES' },
  { name: 'Signal red', swatch: 0xb8322a, base: 0xdedad2, metal: 0.15, stripe: 0xb8322a, accent: 0x2a2a2a, ink: '#2a2a2a', ink2: '#f1ece2', road: 'PRAIRIE CENTRAL' },
];
const LINES = [
  { name: 'Blue line', swatch: 0x2d5fb3, stripe: 0x2d5fb3, route: 'B' },
  { name: 'Red line', swatch: 0xc4372c, stripe: 0xc4372c, route: 'R' },
  { name: 'Green line', swatch: 0x2f8a4c, stripe: 0x2f8a4c, route: 'G' },
];
const EXPRESS = [
  { name: 'White & red', swatch: 0xb5302a, base: 0xebe8e1, metal: 0.15, band: 0xb5302a, stripe: 0x26282b, ink: '#26282b', ink2: '#f3efe6', road: 'TINPLATE EXPRESS' },
  { name: 'White & blue', swatch: 0x274a86, base: 0xe7e9ea, metal: 0.15, band: 0x274a86, stripe: 0xc9a54a, ink: '#1d2a44', ink2: '#f3efe6', road: 'LAKESHORE EXPRESS' },
  { name: 'Silver & teal', swatch: 0x1d6f6c, base: 0xaab0b3, metal: 0.6, band: 0x1d6f6c, stripe: 0xe9e4d6, ink: '#1e2426', ink2: '#eef0ea', road: 'NORTHERN EXPRESS' },
];
// The trolleys: lower panels in the line's colour, a cream window band, and a lined-out belt rail.
const TRACTION = [
  { name: 'Traction orange', swatch: 0xd2702a, base: 0xd2702a, band: 0xe9dfc6, stripe: 0x2b2522, roof: 0x5a5f61, ink: '#2b2522', ink2: '#f1e7cf', road: 'MILL CREEK RAILWAY', dest: 'JUNCTION' },
  { name: 'Pullman green', swatch: 0x3a5440, base: 0x3a5440, band: 0xdcd2b2, stripe: 0xc9a54a, roof: 0x4a4d4f, ink: '#3a5440', ink2: '#e6cf8a', road: 'LAKESHORE TRACTION', dest: 'LAKESHORE' },
  { name: 'Cherry red', swatch: 0xa22f2a, base: 0xa22f2a, band: 0xe8dcc0, stripe: 0xc9a54a, roof: 0x55595b, ink: '#a22f2a', ink2: '#ecd48e', road: 'TINPLATE STREET RY.', dest: 'MAIN ST.' },
];
const numbered = (list, nums) => list.map((l, i) => ({ ...l, num: nums[i] }));

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
  charger: numbered(PAX, ['4601', '4622', '4640']),
  coach: numbered(PAX, ['7201', '7230', '7255']),
  bilevel: numbered(PAX, ['8301', '8320', '8344']),
  subway: numbered(LINES, ['4120', '4310', '4502']),
  subwaycar: numbered(LINES, ['4121', '4311', '4503']),
  highspeed: numbered(EXPRESS, ['2001', '2101', '2201']),
  hscoach: numbered(EXPRESS, ['3001', '3101', '3201']),
  hstail: numbered(EXPRESS, ['2002', '2102', '2202']),
  trolley: numbered(TRACTION, ['1907', '2112', '2350']),
  trolleycar: numbered(TRACTION, ['1908', '2113', '2351']),
  opencar: numbered(TRACTION, ['24', '31', '46']),
};
