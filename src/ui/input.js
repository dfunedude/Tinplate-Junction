// ===== ui/input: pointer input on the table (mouse, pen and touch share one path) =====
import * as THREE from 'three';
import { TABLE_W, TABLE_D, clamp } from '../core/geometry.js';
import { canvas, scene, camera } from '../render/stage.js';
import { views, sound, train, state } from '../state.js';
import { toast } from './dom.js';
import { updateButtons } from './hud.js';
import { view, placeCamera, stopTween, follow } from './camera.js';
import { markers, refreshMarkers, highlight, throwSwitch, beginDrag, dragMove, endDrag } from './editor.js';

const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
const pickPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -0.35);
function setRay(cx, cy) {
  const r = canvas.getBoundingClientRect();
  ndc.set(((cx - r.left) / r.width) * 2 - 1, -((cy - r.top) / r.height) * 2 + 1);
  ray.setFromCamera(ndc, camera);
}
function planePoint(cx, cy) { setRay(cx, cy); return ray.ray.intersectPlane(pickPlane, new THREE.Vector3()); }
function pick(cx, cy) {
  scene.updateMatrixWorld();
  setRay(cx, cy);
  if (state.mode === 'track' && markers.length) {
    const mh = ray.intersectObjects(markers.map(m => m.hit), false);
    if (mh.length) return { kind: 'end', end: mh[0].object.userData.end };
  }
  const targets = [];
  for (const v of views.values()) { targets.push(v.foot); if (v.hit) targets.push(v.hit); }
  const hits = ray.intersectObjects(targets, false);
  if (!hits.length) return null;
  const lantern = hits.find(h => h.object.userData.lantern);
  const h = lantern && state.mode !== 'track' ? lantern : hits[0];
  return { kind: 'piece', p: h.object.userData.piece, lantern: !!h.object.userData.lantern, point: h.point };
}
function panBy(x0, y0, x1, y1) {
  const a = planePoint(x0, y0), b = planePoint(x1, y1);
  if (!a || !b) return;
  view.target.x = clamp(view.target.x - (b.x - a.x), -TABLE_W / 2, TABLE_W / 2);
  view.target.z = clamp(view.target.z - (b.z - a.z), -TABLE_D / 2, TABLE_D / 2);
}
const ptrs = new Map();
let gest = null;
function onDown(e) {
  sound.init();
  stopTween();
  try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
  ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (ptrs.size === 1) {
    gest = { kind: 'pending', x0: e.clientX, y0: e.clientY, lx: e.clientX, ly: e.clientY, button: e.button, mod: e.shiftKey || e.altKey, hit: pick(e.clientX, e.clientY) };
  } else if (ptrs.size === 2) {
    if (gest && gest.kind === 'drag') endDrag(false);
    const [a, b] = [...ptrs.values()];
    gest = { kind: 'pinch', d0: Math.hypot(a.x - b.x, a.y - b.y), dist0: follow.active ? follow.dist : view.dist, mx: (a.x + b.x) / 2, my: (a.y + b.y) / 2 };
  }
}
function onMove(e) {
  const pt = ptrs.get(e.pointerId);
  if (!pt) { hover(e); return; }
  pt.x = e.clientX; pt.y = e.clientY;
  if (!gest) return;
  if (gest.kind === 'pinch') {
    if (ptrs.size < 2) return;
    const [a, b] = [...ptrs.values()];
    const d = Math.max(10, Math.hypot(a.x - b.x, a.y - b.y));
    if (follow.active) { follow.dist = clamp(gest.dist0 * gest.d0 / d, 9, 90); return; }
    view.dist = clamp(gest.dist0 * gest.d0 / d, 16, 280);
    const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
    placeCamera(view, camera);
    panBy(gest.mx, gest.my, mx, my);
    gest.mx = mx; gest.my = my;
    return;
  }
  if (gest.kind === 'pending') {
    if (Math.hypot(e.clientX - gest.x0, e.clientY - gest.y0) < 7) return;
    const h = gest.hit;
    if (state.mode === 'track' && h && h.kind === 'piece' && gest.button === 0 && !gest.mod) { beginDrag(h.p, planePoint(gest.x0, gest.y0)); gest.kind = 'drag'; }
    else gest.kind = !follow.active && (gest.button === 2 || gest.button === 1 || gest.mod) ? 'pan' : 'orbit';
  }
  const dx = e.clientX - gest.lx, dy = e.clientY - gest.ly;
  if (gest.kind === 'orbit' && follow.active) {
    follow.yaw -= dx * 0.0055;
    follow.pitch = clamp(follow.pitch + dy * 0.0045, 0.06, 1.4);
  } else if (gest.kind === 'orbit') {
    view.yaw -= dx * 0.0055;
    view.pitch = clamp(view.pitch + dy * 0.0045, 0.3, 1.48);
  } else if (gest.kind === 'pan') panBy(gest.lx, gest.ly, e.clientX, e.clientY);
  else if (gest.kind === 'drag') dragMove(planePoint(e.clientX, e.clientY));
  gest.lx = e.clientX; gest.ly = e.clientY;
}
function onUp(e) {
  if (!ptrs.has(e.pointerId)) return;
  ptrs.delete(e.pointerId);
  if (!gest) return;
  if (gest.kind === 'pinch') {
    if (ptrs.size === 1) { const p = [...ptrs.values()][0]; gest = { kind: 'orbit', lx: p.x, ly: p.y }; } else gest = null;
    return;
  }
  if (ptrs.size) return;
  if (gest.kind === 'pending' && e.type === 'pointerup') tap(gest.hit);
  else if (gest.kind === 'drag') endDrag(e.type === 'pointerup');
  gest = null;
}
function hover(e) {
  if (e.pointerType !== 'mouse') return;
  if (hover.raf) return;
  hover.raf = requestAnimationFrame(() => {
    hover.raf = 0;
    const h = pick(e.clientX, e.clientY);
    let c = 'grab';
    if (h && state.mode === 'track') c = h.kind === 'end' ? 'pointer' : 'move';
    else if (h && state.mode === 'train') c = 'pointer';
    else if (h && h.p.def.sw) c = 'pointer';
    canvas.style.cursor = c;
  });
}
function tap(hit) {
  if (state.mode === 'track') {
    if (hit && hit.kind === 'end') { state.active = { p: hit.end.p, i: hit.end.i }; state.sel = null; refreshMarkers(); highlight(); updateButtons(); return; }
    if (hit && hit.kind === 'piece') {
      if (hit.lantern) { throwSwitch(hit.p); return; }
      state.sel = state.sel === hit.p ? null : hit.p;
    } else state.sel = null;
    highlight(); updateButtons();
    return;
  }
  if (!hit || hit.kind !== 'piece') return;
  if (state.mode === 'train') {
    const pose = train.onTrack ? train.headPose() : null;
    if (train.placeNear(hit.point.x, hit.point.z, pose ? pose.h : undefined)) { sound.snap(); toast('Train set down.'); }
    else toast('Not enough track there for the whole train.');
    return;
  }
  if (hit.p.def.sw) throwSwitch(hit.p);
}
// gestures on the 3D view; the deck buttons are wired up in ui/controls
export function bindCanvas() {
  canvas.addEventListener('pointerdown', onDown);
  canvas.addEventListener('pointermove', onMove);
  canvas.addEventListener('pointerup', onUp);
  canvas.addEventListener('pointercancel', onUp);
  canvas.addEventListener('contextmenu', e => e.preventDefault());
  canvas.addEventListener('wheel', e => {
    e.preventDefault(); stopTween();
    const k = Math.exp(e.deltaY * (e.ctrlKey ? 0.01 : 0.0012));
    if (follow.active) follow.dist = clamp(follow.dist * k, 9, 90);
    else view.dist = clamp(view.dist * k, 16, 280);
  }, { passive: false });
}
