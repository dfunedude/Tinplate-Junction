// ===== main: boot, resize and the frame loop =====
import * as THREE from 'three';
import { PI } from './core/geometry.js';
import { buildPreset } from './core/presets.js';
import { canvas, renderer, scene, ROOM_COLOR, camera, hemi, sun, fill, LIGHT_BASE } from './render/stage.js';
import { MATS, OWN_MATS, room } from './render/materials.js';
import { buildRoom } from './world/room.js';
import { bumperLamp } from './world/track.js';
import { transformerHandle, NIGHT_POOLS, buildScenery } from './world/scenery.js';
import { VEHICLES, FAMILIES } from './stock/catalog.js';
import { VMAX } from './sim/train.js';
import { layout, views, sound, smoke, train, state } from './state.js';
import { save, loadSaved, savedConsist, savedParked } from './storage.js';
import { $, toast } from './ui/dom.js';
import { setThrottle, updateDir, updateSoundBtn, setLamp, updateButtons } from './ui/hud.js';
import { view, resetView, stepCamera } from './ui/camera.js';
import { markers, syncViews, addPiece, rotateSel, autoPlaceTrain, throwSwitch, loadPreset } from './ui/editor.js';
import { applyConsist, setEngine, addCar, renderConsist, showFamily } from './ui/consist.js';
import { buildControls, setMode } from './ui/controls.js';

train.onThrow = p => { sound.clack(); save(); };
train.onBump = v => sound.thud(v);
train.onJoint = () => sound.joint(train.speed);

function resize() {
  const r = $('stage').getBoundingClientRect();
  const w = Math.max(1, Math.round(r.width)), h = Math.max(1, Math.round(r.height));
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  smoke.mat.uniforms.uScale.value = h * renderer.getPixelRatio() / (2 * Math.tan(camera.fov * PI / 360));
  if (resize.auto) resetView(false);
}
resize.auto = true;

// ---------- main loop ----------
let last = performance.now(), readoutT = 0, smokeAcc = 0;
const _v = new THREE.Vector3();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  // room lamp fades
  const goal = state.lampOn ? 0 : 1;
  if (state.dark !== goal) {
    state.dark += Math.sign(goal - state.dark) * Math.min(Math.abs(goal - state.dark), dt / 0.7);
    const L = 1 - state.dark;
    hemi.intensity = LIGHT_BASE.hemi * (0.1 + 0.9 * L);
    sun.intensity = LIGHT_BASE.sun * (0.06 + 0.94 * L);
    fill.intensity = LIGHT_BASE.fill * (0.25 + 0.75 * L);
    room.env = 0.15 + 0.85 * L;
    for (const m of MATS) m.envMapIntensity = m.userData.env * room.env;
    for (const m of OWN_MATS) m.envMapIntensity = m.userData.env * room.env;
    for (const m of NIGHT_POOLS) m.opacity = m.userData.peak * state.dark;
    $('app').classList.toggle('is-dark', state.dark > 0.5);
    scene.background.copy(ROOM_COLOR).multiplyScalar(0.45 + 0.55 * L);
    scene.fog.color.copy(scene.background);
    smoke.mat.uniforms.uColor.value.setHex(0xdedbd4).multiplyScalar(0.3 + 0.7 * L);
  }
  train.update(dt, state.throttle);
  if (train.onTrack) train.lights(state.throttle, state.dark);
  if (transformerHandle) transformerHandle.rotation.y += ((0.6 - state.throttle * 3.0) - transformerHandle.rotation.y) * Math.min(1, dt * 12);
  bumperLamp.emissiveIntensity = state.throttle > 0.04 ? 0.6 + 1.6 * state.throttle : 0.15;
  // the smoke unit heats with track voltage and puffs harder with speed
  const loco = train.loco;
  if (train.onTrack && loco && loco.smoke && state.throttle > 0.08) {
    smokeAcc += dt * (2.5 + train.speed * 0.45) * Math.min(1, state.throttle * 2);
    while (smokeAcc > 1) {
      smokeAcc -= 1;
      _v.copy(loco.smoke); loco.body.localToWorld(_v);
      smoke.emit(_v.x, _v.y, _v.z, train.speed / VMAX);
    }
  }
  smoke.update(dt);
  sound.update(train.onTrack ? train.speed : 0, state.throttle);
  for (const v of views.values()) v.tick(dt);
  if (markers.length) { const s = 1 + 0.12 * Math.sin(now / 180); for (const m of markers) if (m.on) m.g.scale.setScalar(s); }
  if (train.speed > 0.5 && (frame.saveT = (frame.saveT || 0) - dt) <= 0) { frame.saveT = 4; save(); }
  readoutT -= dt;
  if (readoutT <= 0) {
    readoutT = 0.15;
    const mph = Math.round((train.onTrack ? train.speed : 0) * 48 / 17.6);
    $('readout').innerHTML = `<b>${(state.throttle * 18).toFixed(1)} V</b> · ${mph} smph`;
  }
  stepCamera(dt);
  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}

// ---------- boot ----------
function boot() {
  buildControls();
  buildRoom();
  buildScenery();
  const saved = loadSaved();
  if (saved && Array.isArray(saved.layout) && saved.layout.length) layout.load(saved.layout);
  else if (!saved) buildPreset(layout, 'spur');
  syncViews();
  train.setConsist((saved && savedConsist(saved.consist)) || FAMILIES.freight.train);
  if (saved) state.parked = savedParked(saved.parked);
  showFamily(VEHICLES[train.consist[0].type].set);
  if (saved && saved.sound === false) sound.on = false;
  // put the train back where it was, or on the front straight of the starter layout
  const pose = saved && saved.pose && isFinite(saved.pose.x) ? saved.pose : null;
  if (pose) train.placeNear(pose.x, pose.z, pose.h);
  else if (layout.pieces[4]) { const c = layout.endWorld(layout.pieces[4], 1); train.placeNear(c.x, c.z, c.h); }
  autoPlaceTrain();
  renderConsist(); updateDir(); updateSoundBtn(); updateButtons(); setThrottle(0, true); setLamp(true);
  new ResizeObserver(resize).observe($('stage'));
  resize();
  resetView(false);
  canvas.addEventListener('pointerdown', () => { resize.auto = false; }, { once: true });
  if (!saved) setTimeout(() => toast('Slide the throttle to get the train rolling.', 3600), 600);
  requestAnimationFrame(t => { last = t; frame(t); });
}
boot();
// test handle for scripted checks; release builds drop this line (see tools/build.mjs)
window.__tj = { layout, train, view, camera, state, views, scene, renderer, sound, setMode, setEngine, addCar, setThrottle, setLamp, loadPreset, addPiece, throwSwitch, applyConsist, rotateSel, syncViews };
