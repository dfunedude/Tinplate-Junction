// ===== ui/consist: the Train tab, where you pick an engine and add, repaint or uncouple cars =====
import { css, LIVERIES } from '../stock/liveries.js';
import { VEHICLES, FAMILIES } from '../stock/catalog.js';
import { train, state, MAX_CARS } from '../state.js';
import { save } from '../storage.js';
import { $, toast } from './dom.js';
import { updateButtons } from './hud.js';
import { autoPlaceTrain } from './editor.js';

export function applyConsist(list, msg) {
  const before = train.onTrack;
  train.setConsist(list);
  if (before && !train.onTrack) toast('Not enough track behind the train for that. Lay more track first.');
  else {
    if (!train.onTrack) autoPlaceTrain();
    if (msg) toast(msg, 1600);
  }
  renderConsist(); updateButtons(); save();
}
export function setEngine(t) {
  const list = train.consist.slice(), kind = VEHICLES[t].set, F = FAMILIES[kind];
  if (list[0] && list[0].type === t) {
    // tapping the engine again repaints it, and the cars of a matched set with it
    const li = list[0].li + 1;
    list.forEach((c, i) => { if (i === 0 || F.matched && VEHICLES[c.type].set === kind) list[i] = { type: c.type, li }; });
    applyConsist(list, `${VEHICLES[t].name}: ${LIVERIES[t][li % LIVERIES[t].length].name}`);
    return;
  }
  const was = list[0] && VEHICLES[list[0].type].set;
  if (was && was !== kind) {
    // another kind of train: park this one and bring out the last train of that kind
    state.parked[was] = list;
    const next = (state.parked[kind] || F.train).map(c => ({ ...c }));
    if (next[0].type !== t) next[0] = { type: t, li: 0 };
    const n = next.length - 1;
    applyConsist(next, `${F.name} train, ${n} car${n === 1 ? '' : 's'}`);
    return;
  }
  list[0] = { type: t, li: 0 };
  applyConsist(list);
}
export function addCar(t) {
  if (train.consist.length - 1 >= MAX_CARS) { toast(`That's a long train. ${MAX_CARS} cars is the limit.`); return; }
  const list = train.consist.slice(), kind = VEHICLES[t].set, engine = list[0];
  // a car from a matched set wears the engine's paint; other cars take turns through their schemes
  const li = FAMILIES[kind].matched && engine && VEHICLES[engine.type].set === kind ? engine.li : list.filter(c => c.type === t).length % LIVERIES[t].length;
  const car = { type: t, li };
  // keep the caboose (or a rear power car) at the end
  const last = list.length - 1;
  if (!VEHICLES[t].tail && last > 0 && VEHICLES[list[last].type].tail) list.splice(last, 0, car); else list.push(car);
  applyConsist(list);
}
// show one kind of train's engines and cars on the Train tab
export function showFamily(kind) {
  $('familySel').value = kind;
  document.querySelectorAll('#stockRow [data-set]').forEach(b => { b.hidden = b.dataset.set !== kind; });
}
export function renderConsist() {
  const box = $('consist');
  box.textContent = '';
  train.consist.forEach((c, i) => {
    if (i) { const k = document.createElement('span'); k.className = 'coupler'; box.appendChild(k); }
    const liv = LIVERIES[c.type][c.li % LIVERIES[c.type].length];
    const pill = document.createElement('span');
    pill.className = 'car-pill';
    const paintBtn = document.createElement('button');
    paintBtn.type = 'button'; paintBtn.className = 'paint';
    paintBtn.innerHTML = `<span class="swatch" style="background:${css(liv.swatch)}"></span>${VEHICLES[c.type].name}`;
    paintBtn.setAttribute('aria-label', `${VEHICLES[c.type].name}, ${liv.name}. Change paint`);
    paintBtn.addEventListener('click', () => {
      const list = train.consist.slice();
      list[i] = { type: c.type, li: c.li + 1 };
      const nl = LIVERIES[c.type][(c.li + 1) % LIVERIES[c.type].length];
      applyConsist(list, `${VEHICLES[c.type].name}: ${nl.name}`);
    });
    pill.appendChild(paintBtn);
    if (i > 0) {
      const x = document.createElement('button');
      x.type = 'button'; x.className = 'x'; x.textContent = '×';
      x.setAttribute('aria-label', `Uncouple ${VEHICLES[c.type].name}`);
      x.addEventListener('click', () => { const list = train.consist.slice(); list.splice(i, 1); applyConsist(list); });
      pill.appendChild(x);
    }
    box.appendChild(pill);
  });
}
