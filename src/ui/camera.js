// ===== ui/camera: the table view, the follow camera and the glides between them =====
import * as THREE from 'three';
import { PI, TABLE_W, TABLE_D, RAIL_TOP } from '../core/geometry.js';
import { canvas, camera } from '../render/stage.js';
import { train } from '../state.js';
import { $, toast } from './dom.js';

export const view = { target: new THREE.Vector3(0, 0, 0), yaw: 0, pitch: 0.9, dist: 120 };
function defaultYaw() { const r = canvas.getBoundingClientRect(); return r.width >= r.height * 0.95 ? 0 : PI / 2; }
export function placeCamera(v, cam) {
  const cp = Math.cos(v.pitch);
  cam.position.set(v.target.x + v.dist * cp * Math.sin(v.yaw), v.target.y + v.dist * Math.sin(v.pitch), v.target.z + v.dist * cp * Math.cos(v.yaw));
  cam.lookAt(v.target);
  cam.updateMatrixWorld();
}
const probeCam = new THREE.PerspectiveCamera();
function fitDistance(yaw, pitch) {
  probeCam.copy(camera);
  const pts = [];
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) for (const y of [0.2, -4.4]) pts.push(new THREE.Vector3(sx * (TABLE_W / 2 + 0.8), y, sz * (TABLE_D / 2 + 0.8)));
  const probe = { target: new THREE.Vector3(), yaw, pitch, dist: 100 };
  let lo = 30, hi = 600;
  for (let i = 0; i < 28; i++) {
    probe.dist = (lo + hi) / 2;
    placeCamera(probe, probeCam);
    const ok = pts.every(p => { const q = p.clone().project(probeCam); return Math.abs(q.x) < 0.95 && q.y > -0.95 && q.y < 0.8; });
    if (ok) hi = probe.dist; else lo = probe.dist;
  }
  return hi;
}
let camTween = null;
export function resetView(animate = true) {
  const goal = { yaw: defaultYaw(), pitch: 0.9 };
  goal.dist = fitDistance(goal.yaw, goal.pitch);
  if (!animate) { Object.assign(view, goal); view.target.set(0, 0, 0); return; }
  let dy = goal.yaw - view.yaw; dy = Math.atan2(Math.sin(dy), Math.cos(dy));
  camTween = { t: 0, from: { yaw: view.yaw, pitch: view.pitch, dist: view.dist, tx: view.target.x, tz: view.target.z }, to: { yaw: view.yaw + dy, pitch: goal.pitch, dist: goal.dist } };
}
// a drag, pinch or scroll takes over from a glide in progress
export function stopTween() { camTween = null; }
// Follow view: a chase camera that rides along with the engine. yaw/pitch/dist are the
// viewer's own offsets (drag and zoom adjust them); the heading is smoothed so curves don't snap.
export const follow = { on: false, yaw: 0.55, pitch: 0.4, dist: 30, head: 0, cam: { target: new THREE.Vector3(), yaw: 0, pitch: 0, dist: 0 } };
let camBlend = null;
export function setFollow(on) {
  if (on && !(train.onTrack && train.loco)) { toast('Put the train on the track to follow it.'); on = false; }
  if (on === follow.on) return;
  follow.on = on;
  if (on) camTween = null;
  const b = $('btnFollow');
  b.setAttribute('aria-pressed', String(on));
  b.setAttribute('aria-label', on ? 'Stop following the engine' : 'Follow the engine');
  if (on) toast('Following the engine. Drag to look around, pinch or scroll to zoom.');
}
export function stepCamera(dt) {
  // while the train is lifted off the track the table view stands in; following resumes when it's back
  const active = follow.on && train.onTrack && !!train.loco;
  if (active !== !!follow.active) {
    camBlend = { t: 0, pos: camera.position.clone(), quat: camera.quaternion.clone() };
    follow.active = active;
    if (active) follow.head = -train.loco.body.rotation.y;
  }
  if (active) {
    const b = train.loco.body, h = -b.rotation.y;
    const c = follow.cam;
    const tx = b.position.x + Math.cos(h) * 2, tz = b.position.z + Math.sin(h) * 2;
    if (Math.hypot(tx - c.target.x, tz - c.target.z) > 8 && !camBlend) {
      // the train was set down somewhere else: glide there instead of cutting
      camBlend = { t: 0, pos: camera.position.clone(), quat: camera.quaternion.clone() };
      follow.head = h;
    }
    follow.head += Math.atan2(Math.sin(h - follow.head), Math.cos(h - follow.head)) * (1 - Math.exp(-dt * 3.5));
    // aim just ahead of the engine at boiler height, camera behind and to one side
    c.target.set(tx, RAIL_TOP + 2.2, tz);
    c.yaw = Math.atan2(-Math.cos(follow.head), -Math.sin(follow.head)) + follow.yaw;
    c.pitch = follow.pitch; c.dist = follow.dist;
    placeCamera(c, camera);
  } else {
    if (camTween) {
      camTween.t = Math.min(1, camTween.t + dt / 0.6);
      const k = 1 - Math.pow(1 - camTween.t, 3), f = camTween.from, g = camTween.to;
      view.yaw = f.yaw + (g.yaw - f.yaw) * k; view.pitch = f.pitch + (g.pitch - f.pitch) * k; view.dist = f.dist + (g.dist - f.dist) * k;
      view.target.set(f.tx * (1 - k), 0, f.tz * (1 - k));
      if (camTween.t >= 1) camTween = null;
    }
    placeCamera(view, camera);
  }
  if (camBlend) {
    camBlend.t = Math.min(1, camBlend.t + dt / 0.8);
    const k = 1 - Math.pow(1 - camBlend.t, 3);
    camera.position.lerpVectors(camBlend.pos, camera.position, k);
    camera.quaternion.slerpQuaternions(camBlend.quat, camera.quaternion, k);
    camera.updateMatrixWorld();
    if (camBlend.t >= 1) camBlend = null;
  }
}
