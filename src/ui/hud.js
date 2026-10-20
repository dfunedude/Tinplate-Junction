// ===== ui/hud: readouts and button states on the control deck =====
import { clamp } from '../core/geometry.js';
import { layout, sound, train, state } from '../state.js';
import { $ } from './dom.js';

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
export function updateDir() { $('dirLabel').textContent = train.dir > 0 ? 'Forward' : 'Reverse'; }
export function updateSoundBtn() {
  const b = $('btnSound');
  b.setAttribute('aria-pressed', String(sound.on));
  b.setAttribute('aria-label', sound.on ? 'Sound on' : 'Sound off');
  b.querySelector('.wave').style.display = sound.on ? '' : 'none';
  b.querySelector('.mute').style.display = sound.on ? 'none' : '';
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
  const spec = train.locoSpec;
  $('whistleLabel').textContent = spec && spec.sound === 'whistle' ? 'Whistle' : 'Horn';
  $('btnWhistle').setAttribute('aria-label', spec && spec.sound === 'whistle' ? 'Whistle' : 'Horn');
}
