// ===== ui/consist: the Train tab, where you pick an engine and add, repaint or uncouple cars =====
import { css, LIVERIES } from '../stock/liveries.js';
import { VEHICLES } from '../stock/catalog.js';
import { train, MAX_CARS } from '../state.js';
import { save } from '../storage.js';
import { $, toast } from './dom.js';
import { updateButtons } from './hud.js';
import { autoPlaceTrain } from './editor.js';

export function applyConsist(list, msg) {
  const before = train.onTrack;
  train.setConsist(list);
  if (before && !train.onTrack) toast('Not enough track behind the train for that. Lay more track first.');
  else if (!train.onTrack) autoPlaceTrain();
  renderConsist(); updateButtons(); save();
  if (msg) toast(msg, 1600);
}
export function setEngine(t) {
  const list = train.consist.slice();
  if (list[0] && list[0].type === t) { list[0] = { type: t, li: list[0].li + 1 }; applyConsist(list, `${VEHICLES[t].name}: ${LIVERIES[t][(list[0].li) % LIVERIES[t].length].name}`); return; }
  list[0] = { type: t, li: 0 };
  applyConsist(list);
}
export function addCar(t) {
  if (train.consist.length - 1 >= MAX_CARS) { toast(`That's a long train. ${MAX_CARS} cars is the limit.`); return; }
  const list = train.consist.slice();
  // keep the caboose at the end
  const cabIdx = list.findIndex((c, i) => i > 0 && c.type === 'caboose');
  const used = list.filter(c => c.type === t).length;
  const car = { type: t, li: used % LIVERIES[t].length };
  if (t !== 'caboose' && cabIdx > 0 && cabIdx === list.length - 1) list.splice(cabIdx, 0, car); else list.push(car);
  applyConsist(list);
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
