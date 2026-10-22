// ===== main: boot, resize and the frame loop =====
import { PI } from './core/geometry.js';
import { buildPreset } from './core/presets.js';
import { canvas, renderer, scene, camera, pace, setFastGraphics } from './render/stage.js';
import { setRoomLight } from './render/materials.js';
import { buildRoom } from './world/room.js';
import { animateTrack } from './world/track.js';
import { buildScenery, updateScenery } from './world/scenery.js';
import { VEHICLES, FAMILIES } from './stock/catalog.js';
import { layout, views, sound, smoke, train, overhead, state } from './state.js';
import { save, loadSaved, savedConsist, savedParked } from './storage.js';
import { $, toast } from './ui/dom.js';
import { setThrottle, updateReadout, updateDir, updateSoundBtn, updateFastBtn, setLamp, updateButtons } from './ui/hud.js';
import { view, resetView, stepCamera } from './ui/camera.js';
import { syncViews, addPiece, rotateSel, autoPlaceTrain, throwSwitch, loadPreset } from './ui/editor.js';
import { applyConsist, setEngine, addCar, renderConsist, showFamily } from './ui/consist.js';
import { buildControls, setMode } from './ui/controls.js';

train.onThrow = p => { sound.clack(); save(); };
train.onBump = v => sound.thud(v);
train.onJoint = () => sound.joint(train.speed);
const trainPose = () => train.headPose();

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

// the room lamp fades over 0.7 s
function fadeLamp(dt) {
  const goal = state.lampOn ? 0 : 1;
  if (state.dark === goal) return;
  state.dark += Math.sign(goal - state.dark) * Math.min(Math.abs(goal - state.dark), dt / 0.7);
  const L = 1 - state.dark;
  setRoomLight(L);
  smoke.setLight(L);
  $('app').classList.toggle('is-dark', state.dark > 0.5);
}

// Compile every shader the game will use now, while it boots, rather than when something first
// shows up mid-run (a headlight's glow, the smoke, the trolley wire) and that frame stalls on it.
// renderer.compile skips hidden objects, so show everything for the moment it takes.
function warmShaders() {
  const hidden = [];
  scene.traverse(o => { if (!o.visible) { hidden.push(o); o.visible = true; } });
  renderer.compile(scene, camera);
  for (const o of hidden) o.visible = false;
}

// ---------- main loop ----------
// Each part of the world animates itself; this only runs them in order and draws the frame.
let last = performance.now(), saveT = 0;
function frame(now) {
  const ms = now - last, dt = Math.min(0.05, ms / 1000);
  last = now;
  if (pace(ms)) resize();
  fadeLamp(dt);
  // the trolley wire goes up over the layout while a trolley is out, and comes down after it
  overhead.update(dt, layout, train.needsWire, trainPose);
  train.wireUp = overhead.strung;
  train.update(dt, state.throttle);
  if (train.onTrack) train.lights(state.throttle, state.dark);
  animateTrack(dt, now, state.throttle);
  updateScenery(dt, state.throttle, state.dark);
  smoke.update(dt, train, state.throttle);
  sound.update(train.onTrack ? train.speed : 0, state.throttle);
  updateReadout(dt);
  // keep where the train is, so a reload puts it back there
  if (train.speed > 0.5 && (saveT -= dt) <= 0) { saveT = 4; save(); }
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
  if (saved && saved.fast === true) setFastGraphics(true);
  // put the train back where it was, or on the front straight of the starter layout
  const pose = saved && saved.pose && isFinite(saved.pose.x) ? saved.pose : null;
  if (pose) train.placeNear(pose.x, pose.z, pose.h);
  else if (layout.pieces[4]) { const c = layout.endWorld(layout.pieces[4], 1); train.placeNear(c.x, c.z, c.h); }
  autoPlaceTrain();
  renderConsist(); updateDir(); updateSoundBtn(); updateFastBtn(); updateButtons(); setThrottle(0, true); setLamp(true);
  new ResizeObserver(resize).observe($('stage'));
  resize();
  resetView(false);
  warmShaders();
  canvas.addEventListener('pointerdown', () => { resize.auto = false; }, { once: true });
  if (!saved) setTimeout(() => toast('Slide the throttle to get the train rolling.', 3600), 600);
  requestAnimationFrame(t => { last = t; frame(t); });
}
boot();
// test handle for scripted checks; release builds drop this line (see tools/build.mjs)
window.__tj = { layout, train, overhead, view, camera, state, views, scene, renderer, sound, setMode, setEngine, addCar, setThrottle, setLamp, setFastGraphics, loadPreset, addPiece, throwSwitch, applyConsist, rotateSel, syncViews };
