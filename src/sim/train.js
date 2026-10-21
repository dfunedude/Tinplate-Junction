// ===== sim/train: the consist, motion along the track path, E-unit style reversing =====
import * as THREE from 'three';
import { RAIL_TOP } from '../core/geometry.js';
import { TrackPath, nearestTrackPoint } from '../core/path.js';
import { scene } from '../render/stage.js';
import { dropMat } from '../render/materials.js';
import { VEHICLES, buildVehicle } from '../stock/catalog.js';

export const VMAX = 34;          // inches per second at full throttle
const START_V = 0.12;     // the motor needs a few volts before it turns
const HEADLIGHT_CD = 12;  // headlight spotlight strength at full volts

function disposeTree(obj) {
  obj.traverse(o => {
    if (!o.isMesh && !o.isSprite) return;
    if (o.userData.owned) o.geometry.dispose();
    if (o.userData.ownMat) { if (o.material.map) o.material.map.dispose(); dropMat(o.material); }
    if (o.userData.ownMatKeepMap) dropMat(o.material);
  });
}

export class Train {
  constructor(layout) {
    this.layout = layout;
    this.group = new THREE.Group();
    this.group.visible = false;
    scene.add(this.group);
    this.consist = [];
    this.vehicles = [];
    this.path = null;
    this.headS = 0; this.speed = 0; this.dir = 1; this.reversing = false;
    this.odo = 0; this.onTrack = false; this.length = 0; this.lastPose = null;
    this.onThrow = null; this.onBump = null; this.onJoint = null;
    this._a = {}; this._b = {}; this._c = {};
    // One real spotlight follows the lead engine's headlight. It lives in the scene root and only its
    // intensity changes, so the number of lights (and the compiled shaders) never changes.
    this.beam = new THREE.SpotLight(0xffd9a3, 0, 110, 0.5, 0.75, 0);
    scene.add(this.beam, this.beam.target);
    this._lp = new THREE.Vector3(); this._lt = new THREE.Vector3();
  }
  get loco() { return this.vehicles[0]; }
  get locoSpec() { return this.consist[0] ? VEHICLES[this.consist[0].type] : null; }
  setConsist(list) {
    this.consist = list.map(c => ({ type: c.type, li: c.li | 0 }));
    for (const v of this.vehicles) {
      for (const o of [v.body, ...v.trucks.map(t => t.g)]) { this.group.remove(o); disposeTree(o); }
      if (v.lamps) for (const m of v.lamps) dropMat(m);   // lit windows and marker lamps
    }
    this.vehicles = [];
    for (const c of this.consist) {
      this.vehicles.push(buildVehicle(c.type, c.li));
      if (c.type === 'steam') this.vehicles.push(buildVehicle('tender', 0));
    }
    for (const v of this.vehicles) {
      this.group.add(v.body);
      for (const t of v.trucks) { this.group.add(t.g); t.lastSeg = null; }
    }
    this.length = this.vehicles.reduce((s, v) => s + v.front + v.back, 0);
    if (this.onTrack) { if (this.fit()) this.pose(); else this.lift(); }
  }
  fit() {
    const P = this.path;
    let head = this.headS;
    while (P.s0 > head - this.length) if (!P.extendBack()) { head = P.s0 + this.length; break; }
    while (P.s1 < head) if (!P.extendFront()) return false;
    this.headS = head;
    return true;
  }
  headPose() {
    if (!this.onTrack) return this.lastPose;
    const q = this.path.at(this.headS, {});
    return { x: q.x, z: q.z, h: q.h };
  }
  lift() {
    if (this.onTrack) this.lastPose = this.headPose();
    this.onTrack = false; this.group.visible = false; this.path = null; this.speed = 0; this.reversing = false;
    this.beam.intensity = 0;
  }
  placeNear(x, z, h) {
    const n = nearestTrackPoint(this.layout, x, z, h);
    if (!n) return false;
    // try the new spot; if the train doesn't fit there, leave it where it was
    const prev = { path: this.path, headS: this.headS };
    const P = new TrackPath(this.onThrow);
    P.segs = [P.seg(n.p, n.r, n.d, 0)];
    this.path = P;
    this.headS = n.d > 0 ? n.u : P.segs[0].len - n.u;
    if (!this.fit()) { this.path = prev.path; this.headS = prev.headS; return false; }
    this.onTrack = true; this.group.visible = true; this.speed = 0; this.reversing = false;
    for (const v of this.vehicles) for (const t of v.trucks) t.lastSeg = null;
    this.pose();
    this.lastPose = this.headPose();
    return true;
  }
  reverse() {
    if (this.speed < 0.05 || !this.onTrack) { this.dir *= -1; this.reversing = false; this.speed = 0; }
    else this.reversing = true;
  }
  occupies(p) {
    if (!this.onTrack) return false;
    const lo = this.headS - this.length, hi = this.headS;
    return this.path.segs.some(g => g.p === p && g.s0 < hi && g.s0 + g.len > lo);
  }
  // Forget every stretch of path through piece p that the train has left or not reached yet,
  // so a switch thrown there is honoured. Only called when the train is not standing on p.
  cutAt(p) {
    if (!this.onTrack) return;
    const lo = this.headS - this.length, hi = this.headS, segs = this.path.segs;
    let from = 0, to = segs.length;
    segs.forEach((g, i) => {
      if (g.p !== p) return;
      if (g.s0 + g.len <= lo) from = Math.max(from, i + 1);
      else if (g.s0 >= hi) to = Math.min(to, i);
    });
    this.path.segs = segs.slice(from, to);
  }
  update(dt, throttle) {
    if (!this.onTrack) return;
    let target = throttle <= START_V ? 0 : (throttle - START_V) / (1 - START_V) * VMAX;
    if (this.reversing) target = 0;
    const acc = target > this.speed ? 15 : (this.reversing ? 90 : 24);
    this.speed += Math.sign(target - this.speed) * Math.min(Math.abs(target - this.speed), acc * dt);
    if (this.reversing && this.speed < 0.05) { this.speed = 0; this.dir *= -1; this.reversing = false; }
    const ds = this.speed * this.dir * dt;
    if (ds) this.move(ds);
    this.pose();
  }
  move(ds) {
    const P = this.path;
    let head = this.headS + ds;
    if (ds > 0) { while (P.s1 < head) if (!P.extendFront()) { head = P.s1; this.bump(); break; } }
    else { while (P.s0 > head - this.length) if (!P.extendBack()) { head = P.s0 + this.length; this.bump(); break; } }
    this.odo += head - this.headS;
    this.headS = head;
    P.trim(head - this.length - 2, head + 2);
  }
  bump() {
    if (this.speed > 4 && this.onBump) this.onBump(this.speed);
    this.speed = 0;
  }
  pose() {
    const P = this.path, A = this._a, B = this._b, C = this._c;
    let s = this.headS;
    for (const v of this.vehicles) {
      const o = s - v.front;
      P.at(o + v.pivots[0], A); P.at(o + v.pivots[1], B);
      const dx = A.x - B.x, dz = A.z - B.z, f = -v.pivots[1] / (v.pivots[0] - v.pivots[1]);
      v.body.position.set(B.x + dx * f, RAIL_TOP, B.z + dz * f);
      v.body.rotation.y = -Math.atan2(dz, dx);
      for (const t of v.trucks) {
        P.at(o + t.off, C);
        t.g.position.set(C.x, RAIL_TOP, C.z);
        t.g.rotation.y = -C.h;
        if (t.lastSeg && t.lastSeg !== C.seg && this.onJoint) this.onJoint();
        t.lastSeg = C.seg;
        for (const a of t.axles) a.m.rotation.z = -this.odo / a.r;
      }
      for (const w of v.spin) w.m.rotation.z = -this.odo / w.r;
      if (v.update) v.update(this.odo);
      s -= v.front + v.back;
    }
  }
  // lamps run off track voltage, so they glow brighter as the throttle opens
  lights(volts, dark) {
    const on = volts > 0.04 ? 0.35 + 0.65 * Math.min(1, volts / 0.9) : 0;
    for (const v of this.vehicles) {
      if (v.head) {
        v.head.lensM.emissiveIntensity = on * 3.2;
        v.head.glow.material.opacity = on * (0.3 + 0.6 * dark);
        v.head.glow.scale.setScalar(1.4 + on * (1.4 + 1.6 * dark));
        v.head.pool.material.opacity = on * 0.22 * dark;
      }
      if (v.lamps) for (const m of v.lamps) m.emissiveIntensity = on * 1.8;
    }
    // aim the beam from the lens down the track to a spot on the table about 30 inches ahead
    const lead = this.vehicles[0];
    if (lead && lead.head) {
      lead.body.updateMatrixWorld();
      const p = lead.head.pos;
      lead.body.localToWorld(this._lp.copy(p));
      lead.body.localToWorld(this._lt.set(p.x + 30, -RAIL_TOP, p.z));
      this.beam.position.copy(this._lp);
      this.beam.target.position.copy(this._lt);
      this.beam.target.updateMatrixWorld();
      this.beam.intensity = on * HEADLIGHT_CD * (0.1 + 0.9 * dark);
    } else this.beam.intensity = 0;
    return on;
  }
}
