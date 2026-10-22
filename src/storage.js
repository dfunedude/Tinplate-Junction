// ===== storage: keeps the layout, train and settings in localStorage =====
import { VEHICLES, FAMILIES } from './stock/catalog.js';
import { layout, sound, train, state, MAX_CARS } from './state.js';

const STORE_KEY = 'tinplate-junction-v1';
// Saving waits for a pause in the changes, then for a moment when the browser is idle between
// frames, so writing to storage never holds up the train.
const whenIdle = window.requestIdleCallback ? f => requestIdleCallback(f, { timeout: 1000 }) : f => f();
function write() {
  try { localStorage.setItem(STORE_KEY, JSON.stringify({ v: 1, layout: layout.serialize(), consist: train.consist, parked: state.parked, sound: sound.on, pose: train.onTrack ? train.headPose() : train.lastPose })); } catch (e) { /* storage unavailable */ }
}
export function save() {
  clearTimeout(save.t);
  save.t = setTimeout(() => whenIdle(write), 300);
}
export function loadSaved() {
  try { const s = JSON.parse(localStorage.getItem(STORE_KEY) || 'null'); if (s && s.v === 1) return s; } catch (e) { /* ignore */ }
  return null;
}
export function savedConsist(list) {
  if (!Array.isArray(list)) return null;
  const cars = list.filter(c => c && VEHICLES[c.type] && VEHICLES[c.type].kind !== 'tender').map(c => ({ type: c.type, li: c.li | 0 }));
  if (!cars.length) return null;
  if (VEHICLES[cars[0].type].kind !== 'loco') cars.unshift({ type: 'steam', li: 0 });
  return cars.slice(0, MAX_CARS + 1);
}
export function savedParked(o) {
  const out = {};
  for (const k of Object.keys(FAMILIES)) {
    const list = o && savedConsist(o[k]);
    if (list && VEHICLES[list[0].type].set === k) out[k] = list;
  }
  return out;
}
