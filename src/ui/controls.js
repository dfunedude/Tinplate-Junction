// ===== ui/controls: wires up the deck buttons, tabs and keyboard shortcuts =====
import { PRESETS } from '../core/presets.js';
import { VEHICLES } from '../stock/catalog.js';
import { layout, sound, train, state } from '../state.js';
import { save } from '../storage.js';
import { $, toast } from './dom.js';
import { setThrottle, updateDir, updateSoundBtn, setLamp, updateButtons } from './hud.js';
import { resetView, follow, setFollow } from './camera.js';
import { refreshMarkers, highlight, addPiece, rotateSel, deleteSel, undo, loadPreset } from './editor.js';
import { setEngine, addCar } from './consist.js';
import { bindCanvas } from './input.js';
import { PALETTE, sil } from './icons.js';

export function buildControls() {
  const pal = $('palette');
  for (const [kind, label, icon] of PALETTE) {
    const b = document.createElement('button');
    b.className = 'chip'; b.type = 'button'; b.dataset.kind = kind;
    b.innerHTML = `${icon}<span>${label}</span>`;
    b.addEventListener('click', () => addPiece(kind));
    pal.appendChild(b);
  }
  const sel = $('presetSel');
  for (const [k, P] of Object.entries(PRESETS)) sel.add(new Option(P.name, k));
  sel.add(new Option('Clear the table', 'clear'));
  sel.addEventListener('change', () => { const v = sel.value; sel.value = ''; if (v) loadPreset(v); sel.blur(); });

  const er = $('engineSlot');
  for (const t of ['steam', 'f3', 'gp9']) {
    const b = document.createElement('button');
    b.className = 'chip wide'; b.type = 'button'; b.dataset.engine = t;
    b.innerHTML = `${sil(t)}<span>${VEHICLES[t].name}</span>`;
    b.addEventListener('click', () => setEngine(t));
    er.appendChild(b);
  }
  const cr = $('carSlot');
  for (const t of ['boxcar', 'hopper', 'tank', 'gondola', 'flatcar', 'caboose']) {
    const b = document.createElement('button');
    b.className = 'chip'; b.type = 'button';
    b.innerHTML = `${sil(t)}<span>${VEHICLES[t].name}</span>`;
    b.addEventListener('click', () => addCar(t));
    cr.appendChild(b);
  }

  document.querySelectorAll('.tab').forEach(t => t.addEventListener('click', () => setMode(t.dataset.tab)));
  const th = $('throttle');
  th.addEventListener('input', () => { sound.init(); setThrottle(th.value / 100, false); });
  $('btnDir').addEventListener('click', () => { sound.init(); train.reverse(); updateDir(); });
  const wb = $('btnWhistle');
  wb.addEventListener('pointerdown', e => { e.preventDefault(); try { wb.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ } signal(true); });
  for (const ev of ['pointerup', 'pointercancel', 'lostpointercapture']) wb.addEventListener(ev, () => signal(false));
  wb.addEventListener('keydown', e => { if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) { e.preventDefault(); signal(true); } });
  wb.addEventListener('keyup', e => { if (e.key === ' ' || e.key === 'Enter') signal(false); });
  wb.addEventListener('contextmenu', e => e.preventDefault());
  $('btnLamp').addEventListener('click', () => setLamp(!state.lampOn));
  $('btnRotate').addEventListener('click', rotateSel);
  $('btnDelete').addEventListener('click', deleteSel);
  $('btnUndo').addEventListener('click', undo);
  $('btnSound').addEventListener('click', () => { sound.init(); sound.setOn(!sound.on); updateSoundBtn(); save(); });
  $('btnView').addEventListener('click', () => { setFollow(false); resetView(true); });
  $('btnFollow').addEventListener('click', () => setFollow(!follow.on));
  $('btnHelp').addEventListener('click', () => { $('help').hidden = false; $('btnHelpClose').focus(); });
  $('btnHelpClose').addEventListener('click', () => { $('help').hidden = true; });
  $('help').addEventListener('click', e => { if (e.target === $('help')) $('help').hidden = true; });

  bindCanvas();
  document.addEventListener('gesturestart', e => e.preventDefault());
  // iOS only lets audio start inside a user gesture; try on every kind of tap
  for (const ev of ['pointerup', 'touchend', 'click', 'keydown']) document.addEventListener(ev, () => sound.init(), { capture: true, passive: true });
  window.addEventListener('keydown', onKey);
  window.addEventListener('keyup', e => { if (e.key === 'w' || e.key === 'W') signal(false); });
  // a whistle held when focus leaves would never hear its key-up; and nothing should play in a hidden tab
  window.addEventListener('blur', () => signal(false));
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { signal(false); sound.pause(); save(); } else sound.resume();
  });
}
function signal(down) {
  if (down) sound.init();
  sound.signal(down, train.locoSpec ? train.locoSpec.sound : 'horn');
  $('btnWhistle').classList.toggle('is-down', down);
}
function onKey(e) {
  if (e.target && (e.target.tagName === 'SELECT' || e.target.tagName === 'INPUT' && e.target.type !== 'range')) return;
  const k = e.key;
  if ((e.ctrlKey || e.metaKey) && (k === 'z' || k === 'Z')) { e.preventDefault(); undo(); return; }
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  if (k === 'ArrowUp' || k === 'ArrowRight') { if (e.target.id !== 'throttle') { e.preventDefault(); setThrottle(state.throttle + 0.05, true); } }
  else if (k === 'ArrowDown' || k === 'ArrowLeft') { if (e.target.id !== 'throttle') { e.preventDefault(); setThrottle(state.throttle - 0.05, true); } }
  else if (k === 'd' || k === 'D') { sound.init(); train.reverse(); updateDir(); }
  else if (k === 'f' || k === 'F') setFollow(!follow.on);
  else if ((k === 'w' || k === 'W') && !e.repeat) signal(true);
  else if ((k === 'r' || k === 'R') && state.mode === 'track') rotateSel();
  else if ((k === 'Delete' || k === 'Backspace') && state.mode === 'track') { e.preventDefault(); deleteSel(); }
  else if (k === '1') setMode('run'); else if (k === '2') setMode('track'); else if (k === '3') setMode('train');
  else if (k === 'Escape') { $('help').hidden = true; state.sel = null; highlight(); updateButtons(); }
}
export function setMode(m) {
  state.mode = m;
  document.querySelectorAll('.tab').forEach(t => t.setAttribute('aria-selected', String(t.dataset.tab === m)));
  document.querySelectorAll('.panel').forEach(p => { p.hidden = p.dataset.panel !== m; });
  if (m === 'track' && !state.active) { const f = layout.freeEnds()[0]; state.active = f ? { p: f.p, i: f.i } : null; }
  if (m !== 'track') state.sel = null;
  if (m === 'train') toast('Tap any track to set the train down there.');
  refreshMarkers(); highlight(); updateButtons();
}
