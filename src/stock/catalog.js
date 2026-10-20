// ===== stock/catalog: every engine and car on the Train tab =====
import { LIVERIES } from './liveries.js';
import { buildSteam, buildTender } from './steam.js';
import { buildF3, buildGP9 } from './diesels.js';
import { buildBoxcar, buildHopper, buildTank, buildGondola, buildFlatcar, buildCaboose } from './freight.js';

// Each builder returns { front, back, pivots, body, trucks, spin, update? }.
// Local frame: +x forward, y up from the rail head, z to the right.
export const VEHICLES = {
  steam: { name: '2-6-4 Steam', kind: 'loco', sound: 'whistle', build: buildSteam },
  f3: { name: 'F3 Diesel', kind: 'loco', sound: 'horn', build: buildF3 },
  gp9: { name: 'GP9 Diesel', kind: 'loco', sound: 'horn', build: buildGP9 },
  tender: { name: 'Tender', kind: 'tender', build: buildTender },
  boxcar: { name: 'Boxcar', build: buildBoxcar },
  hopper: { name: 'Hopper', build: buildHopper },
  tank: { name: 'Tank car', build: buildTank },
  gondola: { name: 'Gondola', build: buildGondola },
  flatcar: { name: 'Log car', build: buildFlatcar },
  caboose: { name: 'Caboose', build: buildCaboose },
};
export function buildVehicle(type, li = 0) {
  const list = LIVERIES[type];
  const idx = ((li % list.length) + list.length) % list.length;
  const v = VEHICLES[type].build(list[idx], idx);
  v.type = type;
  v.li = idx;
  return v;
}
