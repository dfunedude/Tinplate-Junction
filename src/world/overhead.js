// ===== world/overhead: trolley wire strung over the whole layout while a trolley is out =====
import * as THREE from 'three';
import { TAU, WIRE_Y } from '../core/geometry.js';
import { MAST_OFF, planWire } from '../core/wire.js';
import { scene } from '../render/stage.js';
import { stdMat, paint } from '../render/materials.js';
import { UNIT, mergeList, xf, sweepGeo } from '../render/kit.js';

// Stringing the wire: the masts nearest the trolley spring up first and the rest follow outwards
// across the table, with the wire drawn out behind them. Taking it down plays the same thing backwards.
const SPREAD = 1.3;            // seconds for it to reach the far side of the layout
const POP = 0.45;              // how long one mast takes to spring up
const LAG = 0.2;               // the wire follows its masts by this much
const MAST_TOP = WIRE_Y + 0.6; // height of the bracket arm

// Each wire vertex carries the time it is strung, and the shader drops whatever isn't strung yet.
const wireReveal = { value: 0 };
const wireMat = stdMat({ color: 0x5b4632, roughness: 0.4, metalness: 0.75, envMapIntensity: 0.7 });
wireMat.onBeforeCompile = sh => {
  sh.uniforms.uReveal = wireReveal;
  sh.vertexShader = 'attribute float reveal;\nvarying float vReveal;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvReveal = reveal;');
  sh.fragmentShader = 'uniform float uReveal;\nvarying float vReveal;\n' + sh.fragmentShader.replace('void main() {', 'void main() {\nif (vReveal > uReveal) discard;');
};
const WIRE_PROFILE = Array.from({ length: 6 }, (_, i) => [0.045 * Math.cos(i / 6 * TAU), WIRE_Y + 0.045 * Math.sin(i / 6 * TAU)]);

// A bracket-arm mast, standing at the origin with its arm reaching along +z to the wire.
const mastParts = (() => {
  const braceLen = Math.hypot(1.1, 1.5);
  const steel = [
    xf(UNIT.cylY, 0, 0.1, 0, 0.3, 0.2, 0.3),                                    // footing
    new THREE.CylinderGeometry(0.09, 0.14, MAST_TOP + 0.35, 10).translate(0, (MAST_TOP + 0.35) / 2, 0),
    xf(UNIT.sphere, 0, MAST_TOP + 0.42, 0, 0.13, 0.13, 0.13),                   // finial
    xf(UNIT.box, 0, MAST_TOP, (MAST_OFF + 0.3) / 2, 0.09, 0.11, MAST_OFF + 0.3), // arm
    new THREE.BoxGeometry(0.07, 0.07, braceLen).rotateX(-Math.atan2(1.1, 1.5)).translate(0, MAST_TOP - 0.55, 0.75),
    xf(UNIT.cylY, 0, (MAST_TOP + WIRE_Y) / 2, MAST_OFF, 0.035, MAST_TOP - WIRE_Y, 0.035),   // hanger
    xf(UNIT.box, 0, WIRE_Y + 0.04, MAST_OFF, 0.4, 0.07, 0.1),                   // ear clamped to the wire
  ];
  const glass = [xf(UNIT.cylY, 0, MAST_TOP - 0.2, MAST_OFF, 0.11, 0.16, 0.11)];  // insulator
  return [[mergeList(steel), paint(0x34473a, 0.5, 0.2)], [mergeList(glass), paint(0x7d9a86, 0.3, 0.1, 0.8)]];
})();
const ohM4 = new THREE.Matrix4(), ohQ = new THREE.Quaternion(), ohPos = new THREE.Vector3(), ohScale = new THREE.Vector3(), ohUp = new THREE.Vector3(0, 1, 0);
// springs up past full height and settles back, like a pop-up book
function popEase(x) {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  return 1 + 2.70158 * (x - 1) ** 3 + 1.70158 * (x - 1) ** 2;
}

export class Overhead {
  constructor() {
    this.root = new THREE.Group();
    this.root.visible = false;
    scene.add(this.root);
    this.t = 0; this.stale = true; this.wire = null; this.parts = []; this.masts = [];
  }
  get total() { return SPREAD + POP; }
  // all the way up, so trolley poles can go up to it
  get strung() { return this.t >= this.total; }
  // the track changed: plan the wire again before it's next shown
  invalidate() { this.stale = true; }
  // want: a trolley is out. from: where it stands, so the wire spreads out from there.
  update(dt, layout, want, from) {
    if (!want && !this.t) return;
    const t0 = this.t, rebuilt = this.stale;
    if (rebuilt) this.build(layout, from);
    this.t = want ? Math.min(this.total, this.t + dt) : Math.max(0, this.t - dt * 1.6);
    if (this.t !== t0 || rebuilt) this.place();
    this.root.visible = this.t > 0;
    if (!this.t) this.clear();   // taken down; the next trolley strings it from wherever it stands
  }
  build(layout, from) {
    this.clear();
    const { runs, masts } = planWire(layout);
    const o = from || { x: 0, z: 0 };
    let far = 1;
    for (const r of runs) for (const q of r.pts) far = Math.max(far, Math.hypot(q.x - o.x, q.z - o.z));
    const when = (x, z) => SPREAD * Math.hypot(x - o.x, z - o.z) / far;
    if (runs.length) {
      // sweepGeo gives every point along a run a ring of vertices; stamp each ring with its time in uv.x
      const P = WIRE_PROFILE.length;
      const geo = mergeList(runs.map(({ pts }) => {
        const g = sweepGeo(WIRE_PROFILE, pts), uv = g.attributes.uv;
        pts.forEach((q, i) => { const r = LAG + when(q.x, q.z); for (let j = 0; j < P; j++) uv.setX(i * P + j, r); });
        return g;
      }));
      const uv = geo.attributes.uv.array, rv = new Float32Array(uv.length / 2);
      for (let i = 0; i < rv.length; i++) rv[i] = uv[i * 2];
      geo.setAttribute('reveal', new THREE.BufferAttribute(rv, 1));
      this.wire = new THREE.Mesh(geo, wireMat);
      this.root.add(this.wire);
    }
    this.masts = masts.map(m => ({ ...m, delay: when(m.x, m.z), yaw: Math.atan2(m.wx - m.x, m.wz - m.z) }));
    if (masts.length) {
      for (const [geo, mat] of mastParts) {
        const im = new THREE.InstancedMesh(geo, mat, masts.length);
        im.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
        im.castShadow = true; im.receiveShadow = true;
        im.frustumCulled = false;   // the bounds would be taken while the masts are still flat
        this.root.add(im);
        this.parts.push(im);
      }
    }
    this.stale = false;
  }
  place() {
    wireReveal.value = this.t;
    this.masts.forEach((m, i) => {
      const s = Math.max(1e-4, popEase((this.t - m.delay) / POP));
      ohM4.compose(ohPos.set(m.x, 0, m.z), ohQ.setFromAxisAngle(ohUp, m.yaw), ohScale.set(s, s, s));
      for (const im of this.parts) im.setMatrixAt(i, ohM4);
    });
    for (const im of this.parts) im.instanceMatrix.needsUpdate = true;
  }
  clear() {
    if (this.wire) { this.root.remove(this.wire); this.wire.geometry.dispose(); this.wire = null; }
    for (const im of this.parts) { this.root.remove(im); im.dispose(); }
    this.parts = []; this.masts = []; this.stale = true;
  }
}
