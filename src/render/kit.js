// ===== render/kit: unit shapes, and helpers that merge many parts into a few meshes =====
import * as THREE from 'three';
import { PI } from '../core/geometry.js';

export const UNIT = {
  box: new THREE.BoxGeometry(1, 1, 1),
  cylY: new THREE.CylinderGeometry(1, 1, 1, 20),
  cylX: new THREE.CylinderGeometry(1, 1, 1, 24).rotateZ(PI / 2),
  cylZ: new THREE.CylinderGeometry(1, 1, 1, 20).rotateX(PI / 2),
  cylZ32: new THREE.CylinderGeometry(1, 1, 1, 32).rotateX(PI / 2),
  sphere: new THREE.SphereGeometry(1, 20, 12),
  cone: new THREE.ConeGeometry(1, 1, 14),
};
const _m4 = new THREE.Matrix4(), _q = new THREE.Quaternion(), _eu = new THREE.Euler(), _p3 = new THREE.Vector3(), _s3 = new THREE.Vector3();

// Merge many geometries into one, optionally projecting UVs from the side (x, y).
export function mergeList(list, planar) {
  let n = 0;
  const parts = list.map(g => { const ng = g.index ? g.toNonIndexed() : g; n += ng.attributes.position.count; return ng; });
  const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), uv = new Float32Array(n * 2);
  let o = 0;
  for (const g of parts) {
    const P = g.attributes.position, N = g.attributes.normal, U = g.attributes.uv;
    pos.set(P.array, o * 3);
    if (N) nor.set(N.array, o * 3);
    if (planar) {
      for (let i = 0; i < P.count; i++) {
        uv[(o + i) * 2] = (P.array[i * 3] - planar.x0) / (planar.x1 - planar.x0);
        uv[(o + i) * 2 + 1] = (P.array[i * 3 + 1] - planar.y0) / (planar.y1 - planar.y0);
      }
    } else if (U) uv.set(U.array, o * 2);
    o += P.count;
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  out.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  out.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  out.computeBoundingSphere();
  return out;
}

// A kit collects parts per material and merges them into a few meshes.
export class Kit {
  constructor() { this.buckets = new Map(); }
  put(mat, geo, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1) {
    _eu.set(rx, ry, rz); _q.setFromEuler(_eu);
    _m4.compose(_p3.set(x, y, z), _q, _s3.set(sx, sy, sz));
    const g = (geo.index ? geo.toNonIndexed() : geo.clone()).applyMatrix4(_m4);
    if (!this.buckets.has(mat)) this.buckets.set(mat, []);
    this.buckets.get(mat).push(g);
    return this;
  }
  box(mat, lx, ly, lz, x, y, z, rx = 0, ry = 0, rz = 0) { return this.put(mat, UNIT.box, x, y, z, rx, ry, rz, lx, ly, lz); }
  // y-range box: easier to read for bodies that sit on a deck
  boxY(mat, x0, x1, y0, y1, hw, z = 0) { return this.box(mat, x1 - x0, y1 - y0, hw * 2, (x0 + x1) / 2, (y0 + y1) / 2, z); }
  cylX(mat, r, len, x, y, z, ry = r, rz = r) { return this.put(mat, UNIT.cylX, x, y, z, 0, 0, 0, len, ry, rz); }
  cylY(mat, r, h, x, y, z, rz = r) { return this.put(mat, UNIT.cylY, x, y, z, 0, 0, 0, r, h, rz); }
  cylZ(mat, r, len, x, y, z) { return this.put(mat, UNIT.cylZ, x, y, z, 0, 0, 0, r, r, len); }
  sphere(mat, rx, ry, rz, x, y, z) { return this.put(mat, UNIT.sphere, x, y, z, 0, 0, 0, rx, ry, rz); }
  build() {
    const group = new THREE.Group();
    for (const [mat, list] of this.buckets) {
      const mesh = new THREE.Mesh(mergeList(list, mat.userData.planar), mat);
      mesh.castShadow = true; mesh.receiveShadow = true;
      mesh.userData.owned = true;
      group.add(mesh);
    }
    return group;
  }
}

// Sweep a closed 2D profile [(lateral, y)] along samples [{x, z, h}]. Lateral is to the right of travel.
export function sweepGeo(profile, samples, closed = true) {
  const P = profile.length, S = samples.length;
  const pos = [], uv = [], idx = [];
  samples.forEach((s, i) => {
    const nx = -Math.sin(s.h), nz = Math.cos(s.h);
    profile.forEach(([lat, y], j) => { pos.push(s.x + nx * lat, y, s.z + nz * lat); uv.push(i / (S - 1), j / P); });
  });
  const J = closed ? P : P - 1;
  for (let i = 0; i < S - 1; i++) for (let j = 0; j < J; j++) {
    const a = i * P + j, b = (i + 1) * P + j, c = (i + 1) * P + (j + 1) % P, d = i * P + (j + 1) % P;
    idx.push(a, b, d, b, c, d);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}
export function routeSamples(route, step = 0.6) {
  const n = route.kind === 'arc' ? Math.max(4, Math.ceil(route.len / step)) : 1;
  const out = [];
  for (let i = 0; i <= n; i++) out.push(route.at(route.len * i / n));
  return out;
}

export function xf(geo, x, y, z, sx = 1, sy = 1, sz = 1) {
  _m4.compose(_p3.set(x, y, z), _q.identity(), _s3.set(sx, sy, sz));
  return (geo.index ? geo.toNonIndexed() : geo.clone()).applyMatrix4(_m4);
}
export function prismX(pts, zHalf) {
  const s = new THREE.Shape(pts.map(([x, y]) => new THREE.Vector2(x, y)));
  return new THREE.ExtrudeGeometry(s, { depth: zHalf * 2, bevelEnabled: false }).translate(0, 0, -zHalf);
}

// Rounded-rectangle cross sections (half-width w, bottom y0, top y1, corner radius r) for loftGeo.
function ringPts(w, y0, y1, r) {
  const pts = [], K = 6;
  for (let i = 0; i < 4; i++) pts.push([w, y0 + (y1 - r - y0) * i / 4]);
  for (let i = 0; i <= K; i++) { const a = i / K * PI / 2; pts.push([w - r + r * Math.cos(a), y1 - r + r * Math.sin(a)]); }
  for (let i = 1; i < 6; i++) pts.push([(w - r) - 2 * (w - r) * i / 6, y1]);
  for (let i = 0; i <= K; i++) { const a = PI / 2 + i / K * PI / 2; pts.push([-w + r + r * Math.cos(a), y1 - r + r * Math.sin(a)]); }
  for (let i = 1; i <= 4; i++) pts.push([-w, (y1 - r) - (y1 - r - y0) * i / 4]);
  for (let i = 1; i < 4; i++) pts.push([-w + 2 * w * i / 4, y0]);
  return pts;
}
// Skin a body through cross sections along x, e.g. a cab nose; closed at both ends.
export function loftGeo(sections) {
  const rings = sections.map(s => ringPts(s.w, s.y0, s.y1, s.r));
  const N = rings[0].length, pos = [], idx = [];
  sections.forEach((s, i) => rings[i].forEach(([z, y]) => pos.push(s.x, y, z)));
  for (let i = 0; i < sections.length - 1; i++) for (let j = 0; j < N; j++) {
    const a = i * N + j, b = (i + 1) * N + j, c = (i + 1) * N + (j + 1) % N, d = i * N + (j + 1) % N;
    idx.push(a, b, d, b, c, d);
  }
  const shell = new THREE.BufferGeometry();
  shell.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  shell.setIndex(idx);
  shell.computeVertexNormals();
  const parts = [shell];
  for (const [i, flip] of [[0, false], [sections.length - 1, true]]) {
    const ring = rings[i], x = sections[i].x, cy = (sections[i].y0 + sections[i].y1) / 2, p = [];
    for (let j = 0; j < N; j++) {
      const A = ring[j], B = ring[(j + 1) % N];
      if (flip) p.push(x, cy, 0, x, B[1], B[0], x, A[1], A[0]); else p.push(x, cy, 0, x, A[1], A[0], x, B[1], B[0]);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3));
    g.computeVertexNormals();
    parts.push(g);
  }
  return mergeList(parts);
}

// Turn a built model end for end (x -> -x), e.g. a power car for the back of a trainset. Flips only
// the meshes a Kit built; add lettering and lamps afterwards, at mirrored positions.
export function mirrorX(group) {
  for (const mesh of group.children) {
    if (!mesh.isMesh || !mesh.userData.owned) continue;
    const g = mesh.geometry;
    for (const name of ['position', 'normal']) { const a = g.attributes[name].array; for (let i = 0; i < a.length; i += 3) a[i] = -a[i]; }
    // swap two corners of every triangle so the faces still point outwards
    for (const name of ['position', 'normal', 'uv']) {
      const n = g.attributes[name].itemSize, a = g.attributes[name].array;
      for (let t = 0; t < a.length; t += 3 * n) for (let c = 0; c < n; c++) { const i = t + n + c, j = t + 2 * n + c; [a[i], a[j]] = [a[j], a[i]]; }
    }
    g.computeBoundingSphere();
  }
}
