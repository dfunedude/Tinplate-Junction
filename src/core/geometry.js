// ===== core/geometry: O27 track dimensions, angle helpers and route shapes (no rendering) =====
// Units are inches. The table is the x/z plane; heading 0 points along +x and
// positive heading changes turn right (clockwise seen from above).

export const PI = Math.PI;
export const TAU = PI * 2;
export const R27 = 13.5;                        // O27 curve radius to the centre rail
export const S27 = 8.75;                        // O27 straight section
export const ARC = PI / 4;                      // eight curves make a circle
export const CX = R27 * Math.sin(ARC);          // 9.546  chord length along a curve
export const CZ = R27 * (1 - Math.cos(ARC));    // 3.954  sideways offset of a curve
export const SW_LEN = 2 * CX - S27;             // switch straight leg, chosen so passing sidings close
export const XC = R27 - S27;                    // half length of the 90° crossing, so figure eights close
export const BUMPER_LEN = 3.4;
export const TABLE_W = 96;                      // an 8 x 5 ft layout board
export const TABLE_D = 60;
export const RAIL_TOP = 0.68;                   // O27 rail height, 11/16"
export const WIRE_Y = 7.6;                      // trolley wire height over the table

export function normAng(a) { a %= TAU; if (a > PI) a -= TAU; if (a <= -PI) a += TAU; return a; }
export function rot2(x, z, r) { const c = Math.cos(r), s = Math.sin(r); return [x * c - z * s, x * s + z * c]; }
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

export function lineRoute(a, b, x0, z0, h, len) {
  const c = Math.cos(h), s = Math.sin(h);
  return { a, b, len, kind: 'line', at(t) { return { x: x0 + c * t, z: z0 + s * t, h }; } };
}
export function arcRoute(a, b, x0, z0, h0, R, ang, turn) {
  const cx = x0 - Math.sin(h0) * R * turn, cz = z0 + Math.cos(h0) * R * turn;
  return {
    a, b, len: R * ang, kind: 'arc',
    at(t) { const h = h0 + turn * t / R; return { x: cx + turn * R * Math.sin(h), z: cz - turn * R * Math.cos(h), h }; },
  };
}
export const E = (x, z, h) => ({ x, z, h });
