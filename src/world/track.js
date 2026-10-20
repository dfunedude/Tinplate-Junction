// ===== world/track: tubular three-rail O27 track pieces and the open-end markers =====
import * as THREE from 'three';
import { PI, SW_LEN, BUMPER_LEN } from '../core/geometry.js';
import { PIECES } from '../core/pieces.js';
import { scene } from '../render/stage.js';
import { M, glowMat } from '../render/materials.js';
import { UNIT, mergeList, Kit, sweepGeo, routeSamples } from '../render/kit.js';

const RAIL_OFFSETS = [-0.72, 0, 0.72];
// Rolled tubular rail: flared foot crimped into the tie, round head. Ordered over the top right-to-left.
const RAIL_PROFILE = (() => {
  const p = [[0.13, 0.03], [0.09, 0.1], [0.09, 0.59]];
  for (let i = 1; i < 8; i++) { const a = i / 8 * PI; p.push([0.09 * Math.cos(a), 0.59 + 0.09 * Math.sin(a)]); }
  p.push([-0.09, 0.59], [-0.09, 0.1], [-0.13, 0.03]);
  return p;
})();

const footMat = new THREE.MeshBasicMaterial({ color: 0xe0b45c, transparent: true, opacity: 0.32, depthWrite: false });
const footSnapMat = new THREE.MeshBasicMaterial({ color: 0x9fd08a, transparent: true, opacity: 0.36, depthWrite: false });
const lensGreen = glowMat(0x7fbf72, 1.4);
const lensRed = glowMat(0xd0583e, 1.4);
export const bumperLamp = glowMat(0xc8402c, 0.5);

function railsFor(route, shorten = 0) {
  const samples = routeSamples(route);
  if (shorten) { // pull the far end back (bumper rails stop at the buffer)
    const last = route.at(route.len - shorten); samples[samples.length - 1] = last;
  }
  return RAIL_OFFSETS.map(off => sweepGeo(RAIL_PROFILE.map(([l, y]) => [l + off, y]), samples));
}
function tiesAlong(k, route, positions) {
  for (const t of positions) {
    const q = route.at(t);
    const ry = -q.h;
    const c = Math.cos(q.h), s = Math.sin(q.h);
    const at = (lat, y) => [q.x - s * lat, y, q.z + c * lat];
    // stamped steel tie with raised clamps where the rails crimp in
    let [x, y, z] = at(0, 0.05);
    k.put(M.tie, UNIT.box, x, y, z, 0, ry, 0, 0.5, 0.1, 2.5);
    for (const off of [-0.72, 0.72]) { [x, y, z] = at(off, 0.11); k.put(M.tie, UNIT.box, x, y, z, 0, ry, 0, 0.56, 0.08, 0.36); }
    [x, y, z] = at(0, 0.115);
    k.put(M.fiber, UNIT.box, x, y, z, 0, ry, 0, 0.6, 0.06, 0.44);
  }
}
function footprintGeo(def) {
  const parts = def.routes.map(r => sweepGeo([[1.7, 0.03], [-1.7, 0.03]], routeSamples(r, 0.8), false));
  return mergeList(parts);
}

const pieceGeoCache = new Map();
function pieceParts(type) {
  if (pieceGeoCache.has(type)) return pieceGeoCache.get(type);
  const def = PIECES[type];
  const k = new Kit();
  const rails = [];
  if (type === 'bumper') rails.push(...railsFor(def.routes[0], 0.35));
  else for (const r of def.routes) rails.push(...railsFor(r));
  for (const g of rails) k.put(M.rail, g);

  if (type === 'straight' || type === 'half' || type === 'curve') {
    const r = def.routes[0];
    const n = type === 'half' ? 2 : 3;
    const pos = n === 2 ? [0.45, r.len - 0.45] : [0.45, r.len / 2, r.len - 0.45];
    tiesAlong(k, r, pos);
  } else if (def.sw) {
    // molded base under the points and frog, ties along both legs
    for (const r of def.routes) k.put(M.plastic, sweepGeo([[1.5, 0.07], [-1.5, 0.07], [-1.5, 0.0], [1.5, 0.0]], routeSamples(r, 0.8)));
    tiesAlong(k, def.routes[0], [0.45, 3.4, 6.6, SW_LEN - 0.45]);
    tiesAlong(k, def.routes[1], [5.0, def.routes[1].len - 0.45]);
    // switch machine housing beside the straight leg
    const side = -def.side;
    k.box(M.plastic, 2.4, 0.55, 1.0, 3.2, 0.28, side * 2.25);
    k.box(M.plastic, 1.2, 0.18, 0.55, 3.2, 0.62, side * 2.25);
    k.cylY(M.plastic, 0.09, 0.9, 3.2, 1.05, side * 2.25);
  } else if (type === 'cross90') {
    k.box(M.plastic, 3.6, 0.09, 3.6, 0, 0.045, 0, 0, PI / 4, 0);
    tiesAlong(k, def.routes[0], [0.45, def.routes[0].len - 0.45]);
    tiesAlong(k, def.routes[1], [0.45, def.routes[1].len - 0.45]);
  } else if (type === 'bumper') {
    tiesAlong(k, def.routes[0], [0.45, 2.5]);
    // die-cast bumper bolted to the rail ends, with a red lamp
    const L = BUMPER_LEN;
    k.box(M.black, 0.42, 0.95, 2.0, L - 0.2, 0.62, 0);
    k.box(M.black, 0.5, 0.18, 2.2, L - 0.15, 1.12, 0);
    for (const s of [-0.55, 0.55]) {
      k.cylX(M.steel, 0.13, 0.35, L - 0.55, 0.92, s);
      k.box(M.black, 1.7, 0.14, 0.16, L - 0.95, 0.55, s * 1.15, 0, 0, -0.55);
    }
    k.cylY(M.black, 0.16, 0.32, L - 0.2, 1.36, 0);
    k.sphere(bumperLamp, 0.12, 0.12, 0.12, L - 0.2, 1.45, 0);
  }
  const parts = { group: k.build(), foot: footprintGeo(def) };
  pieceGeoCache.set(type, parts);
  return parts;
}

const trackRoot = new THREE.Group();
scene.add(trackRoot);

export class PieceView {
  constructor(p) {
    this.p = p;
    const parts = pieceParts(p.type);
    this.group = new THREE.Group();
    for (const m of parts.group.children) {
      const mm = new THREE.Mesh(m.geometry, m.material);
      mm.castShadow = true; mm.receiveShadow = true;
      this.group.add(mm);
    }
    this.foot = new THREE.Mesh(parts.foot, footMat);
    this.foot.visible = false;
    this.foot.userData.piece = p;
    this.foot.renderOrder = 1;
    this.group.add(this.foot);
    if (p.def.sw) this.addLantern();
    trackRoot.add(this.group);
    this.sync();
  }
  addLantern() {
    const side = -this.p.def.side;
    const head = new THREE.Group();
    head.position.set(3.2, 1.62, side * 2.25);
    const box = new THREE.Mesh(UNIT.box, M.black);
    box.scale.set(0.5, 0.5, 0.5); box.castShadow = true;
    head.add(box);
    // four lenses that all show the route colour; the head still turns like the real lantern
    this.lenses = [];
    const lens = (x, z, ry) => { const m = new THREE.Mesh(UNIT.cylZ, lensGreen); m.scale.set(0.17, 0.17, 0.06); m.position.set(x, 0, z); m.rotation.y = ry; head.add(m); this.lenses.push(m); };
    lens(0.27, 0, PI / 2); lens(-0.27, 0, PI / 2); lens(0, 0.27, 0); lens(0, -0.27, 0);
    const cap = new THREE.Mesh(UNIT.cylY, M.black); cap.scale.set(0.2, 0.18, 0.2); cap.position.y = 0.33; head.add(cap);
    // a lens on top so the route reads from overhead too
    this.topGreen = new THREE.Mesh(UNIT.sphere, lensGreen); this.topGreen.scale.set(0.15, 0.1, 0.15); this.topGreen.position.y = 0.44;
    this.topRed = new THREE.Mesh(UNIT.sphere, lensRed); this.topRed.scale.copy(this.topGreen.scale); this.topRed.position.y = 0.44;
    head.add(this.topGreen, this.topRed);
    // generous tap target around the lantern
    const hit = new THREE.Mesh(UNIT.cylY, footMat);
    hit.scale.set(1.8, 2.4, 1.8); hit.position.set(3.2, 1.0, side * 2.25); hit.visible = false;
    hit.userData.piece = this.p; hit.userData.lantern = true;
    this.group.add(hit);
    this.hit = hit;
    this.head = head;
    this.group.add(head);
    this.lanternAngle = this.p.state ? PI / 2 : 0;
    this.applyLantern();
  }
  applyLantern() {
    this.head.rotation.y = this.lanternAngle;
    const mat = this.lanternAngle > PI / 4 ? lensRed : lensGreen;
    for (const l of this.lenses) l.material = mat;
    this.topGreen.visible = this.p.state === 0;
    this.topRed.visible = this.p.state === 1;
  }
  tick(dt) {
    if (!this.head) return;
    const goal = this.p.state ? PI / 2 : 0;
    if (Math.abs(goal - this.lanternAngle) > 1e-3) {
      this.lanternAngle += Math.sign(goal - this.lanternAngle) * Math.min(Math.abs(goal - this.lanternAngle), dt * 9);
      this.applyLantern();
    }
  }
  sync() { this.group.position.set(this.p.x, 0, this.p.z); this.group.rotation.y = -this.p.rot; }
  setHighlight(mode) { this.foot.visible = !!mode; this.foot.material = mode === 'snap' ? footSnapMat : footMat; }
  dispose() { trackRoot.remove(this.group); }
}

// ---- open-end markers shown while building ----
export const markerRoot = new THREE.Group();
scene.add(markerRoot);
export const ringGeo = new THREE.RingGeometry(0.9, 1.25, 40).rotateX(-PI / 2);
export const arrowGeo = (() => { const s = new THREE.Shape(); s.moveTo(0.55, 0); s.lineTo(-0.35, 0.5); s.lineTo(-0.35, -0.5); s.closePath(); return new THREE.ShapeGeometry(s).rotateX(-PI / 2); })();
export const markerMat = new THREE.MeshBasicMaterial({ color: 0xece2ce, transparent: true, opacity: 0.55, depthWrite: false });
export const markerActiveMat = new THREE.MeshBasicMaterial({ color: 0xe8b85c, transparent: true, opacity: 0.95, depthWrite: false });
export const markerHitGeo = new THREE.CircleGeometry(2.6, 20).rotateX(-PI / 2);
