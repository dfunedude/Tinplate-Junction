// ===== storage: keeps the layout, train and settings in localStorage =====
import { VEHICLES } from './stock/catalog.js';
import { layout, sound, train, MAX_CARS } from './state.js';

const STORE_KEY = 'tinplate-junction-v1';
export function save() {
  clearTimeout(save.t);
  save.t = setTimeout(() => {
    try { localStorage.setItem(STORE_KEY, JSON.stringify({ v: 1, layout: layout.serialize(), consist: train.consist, sound: sound.on, pose: train.onTrack ? train.headPose() : train.lastPose })); } catch (e) { /* storage unavailable */ }
  }, 300);
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
