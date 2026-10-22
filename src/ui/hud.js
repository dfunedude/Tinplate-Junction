// ===== ui/hud: readouts and button states on the control deck =====
import { clamp } from '../core/geometry.js';
import { graphics } from '../render/stage.js';
import { layout, sound, train, state } from '../state.js';
import { $ } from './dom.js';

// what the signal button sounds on the current engine (the voices are in fx/sound)
const SIGNAL_LABELS = { whistle: 'Whistle', gong: 'Bell' };

export function updateStat() {
  const n = layout.pieces.length;
  const inches = layout.pieces.reduce((s, p) => s + p.def.routes.reduce((a, r) => a + r.len, 0), 0);
  const open = layout.freeEnds().length;
  $('trackStat').textContent = n ? `${n} pieces · ${(inches / 12).toFixed(1)} ft · ${open} open end${open === 1 ? '' : 's'}` : 'Empty table';
}
export function setThrottle(v, fromKey) {
  state.throttle = clamp(v, 0, 1);
  const th = $('throttle');
  if (fromKey) th.value = Math.round(state.throttle * 100);
  th.style.setProperty('--val', `${state.throttle * 100}%`);
  $('voltOut').textContent = `${(state.throttle * 18).toFixed(1)} V`;
}
// The volts and the scale speed over the throttle, a few times a second. The page is only touched
// when the text changes, so a train running at a steady speed costs nothing here.
let readoutT = 0, readoutText = '';
export function updateReadout(dt) {
  if ((readoutT -= dt) > 0) return;
  readoutT = 0.15;
  const volts = (state.throttle * 18).toFixed(1), mph = Math.round((train.onTrack ? train.speed : 0) * 48 / 17.6);
  const text = `${volts}|${mph}`;
  if (text === readoutText) return;
  readoutText = text;
  $('readout').innerHTML = `<b>${volts} V</b> · ${mph} smph`;
}
export function updateDir() { $('dirLabel').textContent = train.dir > 0 ? 'Forward' : 'Reverse'; }
export function updateSoundBtn() {
  const b = $('btnSound');
  b.setAttribute('aria-pressed', String(sound.on));
  b.setAttribute('aria-label', sound.on ? 'Sound on' : 'Sound off');
  b.querySelector('.wave').style.display = sound.on ? '' : 'none';
  b.querySelector('.mute').style.display = sound.on ? 'none' : '';
}
export function updateFastBtn() {
  const b = $('btnFast');
  b.setAttribute('aria-pressed', String(graphics.fast));
  b.setAttribute('aria-label', graphics.fast ? 'Fast graphics on' : 'Fast graphics off');
}
export function setLamp(on) {
  state.lampOn = on;
  const b = $('btnLamp');
  b.setAttribute('aria-pressed', String(!on));
  $('lampLabel').textContent = on ? 'Lamp on' : 'Lamp off';
}
export function updateButtons() {
  $('btnRotate').disabled = !state.sel;
  $('btnDelete').disabled = !state.sel && !state.active;
  $('btnUndo').disabled = !state.undo.length;
  const loco = train.consist[0] ? train.consist[0].type : null;
  document.querySelectorAll('[data-engine]').forEach(b => b.classList.toggle('is-on', b.dataset.engine === loco));
  const spec = train.locoSpec, label = SIGNAL_LABELS[spec && spec.sound] || 'Horn';
  $('whistleLabel').textContent = label;
  $('btnWhistle').setAttribute('aria-label', label);
}
